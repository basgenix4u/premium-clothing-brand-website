-- Native CHECK constraints (Prisma 7 schema does not express them).
-- These are the last line of defence behind the application validation layer.

ALTER TABLE "products"        ADD CONSTRAINT "products_price_non_negative"        CHECK ("price_minor" >= 0);
ALTER TABLE "variant_sizes"   ADD CONSTRAINT "variant_sizes_stock_non_negative"   CHECK ("stock" >= 0);
ALTER TABLE "promo_codes"     ADD CONSTRAINT "promo_codes_value_non_negative"     CHECK ("value" >= 0);
ALTER TABLE "cart_items"      ADD CONSTRAINT "cart_items_quantity_positive"       CHECK ("quantity" > 0);
ALTER TABLE "order_items"     ADD CONSTRAINT "order_items_quantity_positive"      CHECK ("quantity" > 0);
ALTER TABLE "orders"          ADD CONSTRAINT "orders_amounts_non_negative"        CHECK ("subtotal_minor" >= 0 AND "discount_minor" >= 0 AND "shipping_minor" >= 0 AND "total_minor" >= 0);
ALTER TABLE "reviews"         ADD CONSTRAINT "reviews_rating_range"               CHECK ("rating" BETWEEN 1 AND 5);
