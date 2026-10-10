import type { Prisma } from "@/server/db/generated/prisma/client";
import type { Db } from "@/server/db/client";
import type { CartOwner } from "@/server/modules/cart/cart.owner";

export const cartInclude = {
  promoCode: true,
  shippingMethod: true,
  items: {
    orderBy: { createdAt: "asc" },
    include: {
      variant: {
        include: {
          product: { include: { category: true } },
          sizes: true,
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

export type CartRecord = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

export const ownerWhere = (owner: CartOwner): Prisma.CartWhereInput =>
  owner.type === "user" ? { userId: owner.userId } : { guestTokenHash: owner.tokenHash };

export class CartRepository {
  constructor(private readonly db: Db) {}

  findByOwner(owner: CartOwner): Promise<CartRecord | null> {
    return this.db.cart.findFirst({ where: ownerWhere(owner), include: cartInclude });
  }

  async ensureCart(owner: CartOwner): Promise<string> {
    const data =
      owner.type === "user" ? { userId: owner.userId } : { guestTokenHash: owner.tokenHash };
    const cart = await this.db.cart.upsert({
      where: owner.type === "user" ? { userId: owner.userId } : { guestTokenHash: owner.tokenHash },
      create: data,
      update: {},
      select: { id: true },
    });
    return cart.id;
  }

  findVariantById(id: string) {
    return this.db.productVariant.findUnique({ where: { id }, include: { sizes: true } });
  }

  findVariantBySku(sku: string) {
    return this.db.productVariant.findUnique({
      where: { sku },
      include: { product: true, sizes: true },
    });
  }

  findLine(cartId: string, variantId: string, size: string) {
    return this.db.cartItem.findUnique({
      where: { cartId_variantId_size: { cartId, variantId, size } },
    });
  }

  findItemInCart(cartId: string, itemId: string) {
    return this.db.cartItem.findFirst({ where: { id: itemId, cartId } });
  }

  upsertLine(cartId: string, variantId: string, size: string, quantity: number) {
    return this.db.cartItem.upsert({
      where: { cartId_variantId_size: { cartId, variantId, size } },
      create: { cartId, variantId, size, quantity },
      update: { quantity },
    });
  }

  async setLineQuantity(itemId: string, quantity: number): Promise<void> {
    await this.db.cartItem.update({ where: { id: itemId }, data: { quantity } });
  }

  async deleteLine(itemId: string): Promise<void> {
    await this.db.cartItem.delete({ where: { id: itemId } });
  }

  async countLines(cartId: string): Promise<number> {
    return this.db.cartItem.count({ where: { cartId } });
  }

  async setPromo(cartId: string, promoCodeId: string | null): Promise<void> {
    await this.db.cart.update({ where: { id: cartId }, data: { promoCodeId } });
  }

  async setShipping(cartId: string, shippingMethodId: string | null): Promise<void> {
    await this.db.cart.update({ where: { id: cartId }, data: { shippingMethodId } });
  }

  findPromoByCode(code: string) {
    return this.db.promoCode.findUnique({ where: { code } });
  }

  findActiveShippingMethod(id: string) {
    return this.db.shippingMethod.findFirst({ where: { id, isActive: true } });
  }

  async deleteCart(owner: CartOwner): Promise<void> {
    await this.db.cart.deleteMany({ where: ownerWhere(owner) });
  }
}
