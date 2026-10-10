import { getDb, type Db } from "@/server/db/client";
import { CatalogRepository } from "@/server/modules/catalog/catalog.repository";
import { CatalogService } from "@/server/modules/catalog/catalog.service";
import { AuthRepository } from "@/server/modules/auth/auth.repository";
import { AuthService } from "@/server/modules/auth/auth.service";
import { CartRepository } from "@/server/modules/cart/cart.repository";
import { CartService } from "@/server/modules/cart/cart.service";
import { CheckoutService } from "@/server/modules/checkout/checkout.service";
import { ContentRepository } from "@/server/modules/content/content.repository";
import { ContentService } from "@/server/modules/content/content.service";
import { OrdersService } from "@/server/modules/orders/orders.service";
import { FixedWindowRateLimiter } from "@/server/http/rate-limit";

export type Services = {
  db: Db;
  catalog: CatalogService;
  content: ContentService;
  auth: AuthService;
  cart: CartService;
  cartRepository: CartRepository;
  checkout: CheckoutService;
  orders: OrdersService;
};

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

/** Wires concrete implementations into services. The only place that knows about concrete classes. */
export function createServices(db: Db): Services {
  const cartRepository = new CartRepository(db);
  const authRepository = new AuthRepository(db);
  return {
    db,
    catalog: new CatalogService(new CatalogRepository(db)),
    content: new ContentService(new ContentRepository(db)),
    auth: new AuthService({
      repository: authRepository,
      loginLimiter: new FixedWindowRateLimiter(10, FIFTEEN_MINUTES_MS),
      registerLimiter: new FixedWindowRateLimiter(5, ONE_HOUR_MS),
    }),
    cart: new CartService(cartRepository),
    cartRepository,
    checkout: new CheckoutService(db, cartRepository),
    orders: new OrdersService(db),
  };
}

let services: Services | undefined;

export function getServices(): Services {
  services ??= createServices(getDb());
  return services;
}
