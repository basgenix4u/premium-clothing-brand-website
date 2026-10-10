import { COLOUR_PALETTE } from "@/shared/palette";
import { usd, type Money } from "@/shared/money";
import { ConflictError, NotFoundError, UnprocessableError } from "@/server/http/errors";
import type { CartOwner } from "@/server/modules/cart/cart.owner";
import type { CartRecord, CartRepository } from "@/server/modules/cart/cart.repository";
import {
  computeTotals,
  normalisePromoCode,
  PROMO_REJECTION_MESSAGES,
  type PromoState,
} from "@/server/modules/cart/pricing";
import { MAX_DISTINCT_LINES, MAX_LINE_QUANTITY } from "@/server/modules/cart/policy";

export type CartLineDto = {
  id: string;
  variantId: string;
  productSlug: string;
  productName: string;
  colour: { id: string; name: string; hex: string };
  size: string;
  quantity: number;
  imageUrl: string | null;
  unitPrice: Money;
  lineTotal: Money;
  stockAvailable: number;
  inStock: boolean;
};

export type CartView = {
  itemCount: number;
  items: CartLineDto[];
  totals: { subtotal: Money; discount: Money; shipping: Money; total: Money };
  promo: {
    code: string;
    description: string;
    applied: boolean;
    rejectionReason: string | null;
  } | null;
  shippingMethod: { id: string; label: string; eta: string; price: Money } | null;
  checkoutReady: boolean;
};

const EMPTY_VIEW: CartView = {
  itemCount: 0,
  items: [],
  totals: { subtotal: usd(0), discount: usd(0), shipping: usd(0), total: usd(0) },
  promo: null,
  shippingMethod: null,
  checkoutReady: false,
};

export const toPromoState = (promo: NonNullable<CartRecord["promoCode"]>): PromoState => ({
  code: promo.code,
  kind: promo.kind,
  value: promo.value,
  minSubtotalMinor: promo.minSubtotalMinor,
  description: promo.description,
  isActive: promo.isActive,
  startsAt: promo.startsAt,
  endsAt: promo.endsAt,
  usageLimit: promo.usageLimit,
  usedCount: promo.usedCount,
});

export class CartService {
  constructor(
    private readonly repository: CartRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async view(owner: CartOwner | null): Promise<CartView> {
    if (!owner) return EMPTY_VIEW;
    const cart = await this.repository.findByOwner(owner);
    return cart ? this.toView(cart) : EMPTY_VIEW;
  }

  async addItem(
    owner: CartOwner,
    input: { variantId: string; size: string; quantity: number },
  ): Promise<CartView> {
    const variant = await this.repository.findVariantBySku(input.variantId);
    if (!variant || !variant.isActive || !variant.product.isPublished) {
      throw new NotFoundError("That piece is no longer available.");
    }
    const sizeRow = variant.sizes.find((row) => row.size === input.size);
    if (!sizeRow) throw new UnprocessableError(`Size ${input.size} is not offered for this piece.`);

    const cartId = await this.repository.ensureCart(owner);
    const existing = await this.repository.findLine(cartId, variant.id, input.size);
    const desired = (existing?.quantity ?? 0) + input.quantity;

    if (desired > MAX_LINE_QUANTITY) {
      throw new UnprocessableError(`You can add up to ${MAX_LINE_QUANTITY} of each size.`);
    }
    if (!existing && (await this.repository.countLines(cartId)) >= MAX_DISTINCT_LINES) {
      throw new UnprocessableError("Your bag is full. Remove a piece to add another.");
    }
    if (sizeRow.stock === 0) throw new ConflictError(`Size ${input.size} is sold out.`);
    if (desired > sizeRow.stock) {
      throw new ConflictError(`Only ${sizeRow.stock} left in size ${input.size}.`);
    }
    await this.repository.upsertLine(cartId, variant.id, input.size, desired);
    return this.view(owner);
  }

  async updateItem(owner: CartOwner, itemId: string, quantity: number): Promise<CartView> {
    const cart = await this.requireCart(owner);
    const line = await this.repository.findItemInCart(cart.id, itemId);
    if (!line) throw new NotFoundError("That bag item could not be found.");
    const stock = await this.stockFor(line.variantId, line.size);
    if (quantity > stock) throw new ConflictError(`Only ${stock} left in size ${line.size}.`);
    await this.repository.setLineQuantity(line.id, quantity);
    return this.view(owner);
  }

  async removeItem(owner: CartOwner, itemId: string): Promise<CartView> {
    const cart = await this.requireCart(owner);
    const line = await this.repository.findItemInCart(cart.id, itemId);
    if (!line) throw new NotFoundError("That bag item could not be found.");
    await this.repository.deleteLine(line.id);
    return this.view(owner);
  }

  async applyPromo(owner: CartOwner, rawCode: string): Promise<CartView> {
    const code = normalisePromoCode(rawCode);
    const promo = await this.repository.findPromoByCode(code);
    if (!promo) throw new UnprocessableError("That code is not recognised.");
    const cart = await this.requireCart(owner);
    const subtotal = this.subtotalOf(cart);
    const totals = computeTotals({
      subtotalMinor: subtotal,
      shippingMinor: 0,
      promo: toPromoState(promo),
      now: this.now(),
    });
    if (totals.promoRejection) {
      throw new UnprocessableError(PROMO_REJECTION_MESSAGES[totals.promoRejection]);
    }
    await this.repository.setPromo(cart.id, promo.id);
    return this.view(owner);
  }

  async removePromo(owner: CartOwner): Promise<CartView> {
    const cart = await this.repository.findByOwner(owner);
    if (cart) await this.repository.setPromo(cart.id, null);
    return this.view(owner);
  }

  async selectShipping(owner: CartOwner, shippingMethodId: string): Promise<CartView> {
    const method = await this.repository.findActiveShippingMethod(shippingMethodId);
    if (!method) throw new UnprocessableError("That shipping option is not available.");
    const cart = await this.requireCart(owner);
    await this.repository.setShipping(cart.id, method.id);
    return this.view(owner);
  }

  /** Called on sign-in: moves guest lines into the customer's cart, capped by live stock. */
  async mergeGuestIntoUser(guest: CartOwner, userId: string): Promise<void> {
    const guestCart = await this.repository.findByOwner(guest);
    if (!guestCart) return;
    const userOwner: CartOwner = { type: "user", userId };
    const userCartId = await this.repository.ensureCart(userOwner);

    for (const item of guestCart.items) {
      const existing = await this.repository.findLine(userCartId, item.variantId, item.size);
      const stock = await this.stockFor(item.variantId, item.size);
      const combined = Math.min(
        (existing?.quantity ?? 0) + item.quantity,
        MAX_LINE_QUANTITY,
        stock,
      );
      if (combined > 0)
        await this.repository.upsertLine(userCartId, item.variantId, item.size, combined);
    }
    const userCart = await this.repository.findByOwner(userOwner);
    if (userCart && !userCart.promoCodeId && guestCart.promoCodeId) {
      await this.repository.setPromo(userCart.id, guestCart.promoCodeId);
    }
    if (userCart && !userCart.shippingMethodId && guestCart.shippingMethodId) {
      await this.repository.setShipping(userCart.id, guestCart.shippingMethodId);
    }
    await this.repository.deleteCart(guest);
  }

  private async requireCart(owner: CartOwner): Promise<CartRecord> {
    const cart = await this.repository.findByOwner(owner);
    if (!cart) throw new NotFoundError("Your bag is empty.");
    return cart;
  }

  private async stockFor(variantId: string, size: string): Promise<number> {
    const variant = await this.repository.findVariantById(variantId);
    if (!variant) return 0;
    return variant.sizes.find((row) => row.size === size)?.stock ?? 0;
  }

  private subtotalOf(cart: CartRecord): number {
    return cart.items.reduce(
      (sum, item) => sum + item.variant.product.priceMinor * item.quantity,
      0,
    );
  }

  toView(cart: CartRecord): CartView {
    const now = this.now();
    const items: CartLineDto[] = cart.items.map((item) => {
      const sizeRow = item.variant.sizes.find((row) => row.size === item.size);
      const stock = sizeRow?.stock ?? 0;
      const unit = item.variant.product.priceMinor;
      const available = item.variant.isActive && item.variant.product.isPublished;
      return {
        id: item.id,
        variantId: item.variant.sku,
        productSlug: item.variant.product.slug,
        productName: item.variant.product.name,
        colour: COLOUR_PALETTE[item.variant.colour] ?? {
          id: item.variant.colour,
          name: item.variant.colour,
          hex: "#999999",
        },
        size: item.size,
        quantity: item.quantity,
        imageUrl: item.variant.imageUrls[0] ?? null,
        unitPrice: usd(unit),
        lineTotal: usd(unit * item.quantity),
        stockAvailable: stock,
        inStock: available && stock >= item.quantity,
      };
    });
    const subtotalMinor = items.reduce((sum, line) => sum + line.lineTotal.amountMinor, 0);
    const shippingMinor = cart.shippingMethod?.priceMinor ?? 0;
    const promo = cart.promoCode ? toPromoState(cart.promoCode) : null;
    const totals = computeTotals({ subtotalMinor, shippingMinor, promo, now });

    return {
      itemCount: items.reduce((sum, line) => sum + line.quantity, 0),
      items,
      totals: {
        subtotal: usd(totals.subtotalMinor),
        discount: usd(totals.discountMinor),
        shipping: usd(totals.shippingMinor),
        total: usd(totals.totalMinor),
      },
      promo: promo
        ? {
            code: promo.code,
            description: promo.description,
            applied: totals.promoRejection === null,
            rejectionReason: totals.promoRejection
              ? PROMO_REJECTION_MESSAGES[totals.promoRejection]
              : null,
          }
        : null,
      shippingMethod: cart.shippingMethod
        ? {
            id: cart.shippingMethod.id,
            label: cart.shippingMethod.label,
            eta: cart.shippingMethod.eta,
            price: usd(cart.shippingMethod.priceMinor),
          }
        : null,
      checkoutReady:
        items.length > 0 && items.every((line) => line.inStock) && cart.shippingMethod !== null,
    };
  }
}
