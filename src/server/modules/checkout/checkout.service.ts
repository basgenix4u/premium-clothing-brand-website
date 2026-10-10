import { randomBytes } from "node:crypto";
import { Prisma } from "@/server/db/generated/prisma/client";
import type { Db } from "@/server/db/client";
import { ConflictError, UnprocessableError } from "@/server/http/errors";
import { sha256Hex } from "@/server/security/hash";
import type { CartOwner } from "@/server/modules/cart/cart.owner";
import type { CartRepository, CartRecord } from "@/server/modules/cart/cart.repository";
import { computeTotals, PROMO_REJECTION_MESSAGES } from "@/server/modules/cart/pricing";
import { toPromoState } from "@/server/modules/cart/cart.service";
import { orderInclude, toOrderDto, type OrderDto } from "@/server/modules/orders/order.dto";
import type { CheckoutRequest } from "@/server/modules/checkout/checkout.schemas";

export type CheckoutInput = CheckoutRequest;

export type PlaceOrderResult = { order: OrderDto; replayed: boolean };

const ORDER_NUMBER_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateOrderNumber(now: Date): string {
  const bytes = randomBytes(6);
  let code = "";
  for (const byte of bytes) code += ORDER_NUMBER_ALPHABET[byte % ORDER_NUMBER_ALPHABET.length];
  const datePart = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `VLM-${datePart}-${code}`;
}

const ownerScope = (owner: CartOwner): string =>
  owner.type === "user" ? `user:${owner.userId}` : `guest:${owner.tokenHash}`;

const isUniqueViolation = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

export class CheckoutService {
  constructor(
    private readonly db: Db,
    private readonly cartRepository: CartRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /**
   * Converts the bag into a pending order. Prices and totals are recomputed from the
   * database, stock is decremented atomically, and retries with the same
   * Idempotency-Key return the original order instead of creating a second one.
   */
  async placeOrder(
    owner: CartOwner,
    idempotencyKey: string,
    input: CheckoutInput,
  ): Promise<PlaceOrderResult> {
    const scopedKey = sha256Hex(`${ownerScope(owner)}|${idempotencyKey}`);
    const existing = await this.findByIdempotencyKey(scopedKey);
    if (existing) return { order: toOrderDto(existing), replayed: true };

    const cart = await this.cartRepository.findByOwner(owner);
    if (!cart || cart.items.length === 0) throw new UnprocessableError("Your bag is empty.");
    const shippingMethod = cart.shippingMethod;
    if (!shippingMethod) throw new UnprocessableError("Choose a shipping option before checkout.");

    const lines = this.priceLines(cart);
    const subtotalMinor = lines.reduce((sum, line) => sum + line.unitPriceMinor * line.quantity, 0);
    const promo = cart.promoCode ? toPromoState(cart.promoCode) : null;
    const now = this.now();
    const totals = computeTotals({
      subtotalMinor,
      shippingMinor: shippingMethod.priceMinor,
      promo,
      now,
    });
    if (totals.promoRejection)
      throw new UnprocessableError(PROMO_REJECTION_MESSAGES[totals.promoRejection]);

    try {
      const created = await this.commit({
        cart,
        shippingMethodId: shippingMethod.id,
        lines,
        input,
        scopedKey,
        owner,
        totals,
        now,
      });
      return { order: toOrderDto(created), replayed: false };
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        const raced = await this.findByIdempotencyKey(scopedKey);
        if (raced) return { order: toOrderDto(raced), replayed: true };
      }
      throw error;
    }
  }

  private findByIdempotencyKey(scopedKey: string) {
    return this.db.order.findUnique({
      where: { idempotencyKey: scopedKey },
      include: orderInclude,
    });
  }

  private priceLines(cart: CartRecord) {
    return cart.items.map((item) => {
      const product = item.variant.product;
      if (!product.isPublished || !item.variant.isActive) {
        throw new ConflictError(`${product.name} is no longer available. Please review your bag.`);
      }
      return {
        variantId: item.variantId,
        sku: item.variant.sku,
        productName: product.name,
        colour: item.variant.colour,
        size: item.size,
        quantity: item.quantity,
        unitPriceMinor: product.priceMinor,
      };
    });
  }

  private async commit(args: {
    cart: CartRecord;
    shippingMethodId: string;
    lines: ReturnType<CheckoutService["priceLines"]>;
    input: CheckoutInput;
    scopedKey: string;
    owner: CartOwner;
    totals: ReturnType<typeof computeTotals>;
    now: Date;
  }) {
    const { cart, shippingMethodId, lines, input, scopedKey, owner, totals, now } = args;
    const orderNumber = generateOrderNumber(now);
    return this.db.$transaction(async (tx) => {
      for (const line of lines) {
        // Conditional decrement: succeeds only if enough stock remains. Concurrent checkouts cannot oversell.
        const reserved = await tx.variantSize.updateMany({
          where: { variantId: line.variantId, size: line.size, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity }, version: { increment: 1 } },
        });
        if (reserved.count !== 1) {
          throw new ConflictError(
            `Only some pieces in your bag are still available (${line.productName}, size ${line.size}). Please review your bag.`,
          );
        }
      }

      if (cart.promoCodeId) {
        const consumed = await tx.$executeRaw`
          UPDATE "promo_codes"
          SET "used_count" = "used_count" + 1
          WHERE "id" = ${cart.promoCodeId}::uuid
            AND ("usage_limit" IS NULL OR "used_count" < "usage_limit")`;
        if (consumed !== 1) throw new UnprocessableError(PROMO_REJECTION_MESSAGES.exhausted);
      }

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: owner.type === "user" ? owner.userId : null,
          guestTokenHash: owner.type === "guest" ? owner.tokenHash : null,
          email: input.email,
          status: "PENDING_PAYMENT",
          currency: "USD",
          subtotalMinor: totals.subtotalMinor,
          discountMinor: totals.discountMinor,
          shippingMinor: totals.shippingMinor,
          totalMinor: totals.totalMinor,
          promoCodeId: cart.promoCodeId,
          shippingMethodId,
          shippingAddress: input.shippingAddress,
          idempotencyKey: scopedKey,
          items: {
            create: lines.map((line) => ({
              variantId: line.variantId,
              sku: line.sku,
              productName: line.productName,
              colour: line.colour,
              size: line.size,
              unitPriceMinor: line.unitPriceMinor,
              quantity: line.quantity,
            })),
          },
        },
        include: orderInclude,
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({ where: { id: cart.id }, data: { promoCodeId: null } });
      return order;
    });
  }
}
