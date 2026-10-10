import type { Db } from "@/server/db/client";
import type { CartOwner } from "@/server/modules/cart/cart.owner";
import { NotFoundError } from "@/server/http/errors";
import { orderInclude, toOrderDto, type OrderDto } from "@/server/modules/orders/order.dto";

export class OrdersService {
  constructor(private readonly db: Db) {}

  async listForUser(userId: string): Promise<OrderDto[]> {
    const orders = await this.db.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: orderInclude,
    });
    return orders.map(toOrderDto);
  }

  /** Owners see their own orders. Guests need the cookie that placed the order. Others get 404. */
  async getForOwner(owner: CartOwner, orderNumber: string): Promise<OrderDto> {
    const where =
      owner.type === "user"
        ? { orderNumber, userId: owner.userId }
        : { orderNumber, userId: null, guestTokenHash: owner.tokenHash };
    const order = await this.db.order.findFirst({ where, include: orderInclude });
    if (!order) throw new NotFoundError("We could not find that order.");
    return toOrderDto(order);
  }
}
