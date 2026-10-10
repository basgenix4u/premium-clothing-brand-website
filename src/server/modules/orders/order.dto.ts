import type { Prisma } from "@/server/db/generated/prisma/client";
import { usd, type Money } from "@/shared/money";

export const orderInclude = {
  items: { orderBy: { id: "asc" } },
  shippingMethod: true,
} satisfies Prisma.OrderInclude;

export type OrderRecord = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

export type OrderDto = {
  orderNumber: string;
  status: string;
  createdAt: string;
  email: string;
  totals: { subtotal: Money; discount: Money; shipping: Money; total: Money };
  shippingMethod: { id: string; label: string };
  shippingAddress: unknown;
  items: {
    sku: string;
    productName: string;
    colour: string;
    size: string;
    quantity: number;
    unitPrice: Money;
    lineTotal: Money;
  }[];
  payment: { status: "awaiting_payment" | "paid" };
};

export function toOrderDto(order: OrderRecord): OrderDto {
  return {
    orderNumber: order.orderNumber,
    status: order.status.toLowerCase(),
    createdAt: order.createdAt.toISOString(),
    email: order.email,
    totals: {
      subtotal: usd(order.subtotalMinor),
      discount: usd(order.discountMinor),
      shipping: usd(order.shippingMinor),
      total: usd(order.totalMinor),
    },
    shippingMethod: { id: order.shippingMethod.id, label: order.shippingMethod.label },
    shippingAddress: order.shippingAddress,
    items: order.items.map((item) => ({
      sku: item.sku,
      productName: item.productName,
      colour: item.colour,
      size: item.size,
      quantity: item.quantity,
      unitPrice: usd(item.unitPriceMinor),
      lineTotal: usd(item.unitPriceMinor * item.quantity),
    })),
    payment: { status: order.status === "PAID" ? "paid" : "awaiting_payment" },
  };
}
