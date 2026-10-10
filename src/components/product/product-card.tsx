"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useState } from "react";
import { Icon } from "@/components/ui/icons";
import { Photo } from "@/components/ui/photo";
import { Reveal } from "@/components/ui/reveal";
import { useToast } from "@/features/feedback/toast-context";
import { useAddToCart } from "@/features/cart/use-add-to-cart";
import { availableSizes, BADGE_LABELS, isVariantSoldOut } from "@/features/catalog/product-utils";
import { useRegion } from "@/features/regions/region-context";
import { formatRegionMoney } from "@/lib/money-format";
import type { ProductSummaryDto } from "@/shared/catalog-dto";
import { ProductQuickView } from "@/components/product/quick-view";

const swatchStyle = (hex: string): CSSProperties => ({ "--swatch": hex }) as CSSProperties;

export function ProductCard({
  product,
  index = 0,
  compact = false,
  listId = "product-grid",
}: {
  product: ProductSummaryDto;
  index?: number;
  compact?: boolean;
  listId?: string;
}) {
  const { region } = useRegion();
  const { toast } = useToast();
  const addToCart = useAddToCart();
  const [variantIndex, setVariantIndex] = useState(0);
  const [quickView, setQuickView] = useState(false);
  const variant = product.variants[variantIndex] ?? product.variants[0];
  if (!variant) return null;
  const sizes = availableSizes(variant);
  const soldOut = isVariantSoldOut(variant);
  const productHref = `/product/${product.slug}`;

  const quickAdd = () => {
    if (sizes.length === 1 && sizes[0]) {
      addToCart.mutate(
        { variantId: variant.id, size: sizes[0].size },
        {
          onSuccess: () => toast(`${product.name} added to your bag.`, "success"),
          onError: (error) => toast(error.message, "error"),
        },
      );
      return;
    }
    setQuickView(true);
  };

  return (
    <>
      <Reveal
        as="article"
        className={`product-card ${compact ? "is-compact" : ""}`}
        delay={Math.min(index, 8) * 55}
      >
        <div className="product-media">
          <Link
            href={productHref}
            className="product-media-link"
            aria-label={`View ${product.name} in ${variant.colour.name}`}
          >
            <Photo
              className="product-image-a"
              src={variant.images[0]}
              alt={`${product.name} in ${variant.colour.name}`}
              loading={index < 4 ? "eager" : "lazy"}
              decoding="async"
            />
            {variant.images[1] ? (
              <Photo
                className="product-image-b"
                src={variant.images[1]}
                alt=""
                loading="lazy"
                decoding="async"
                aria-hidden="true"
              />
            ) : null}
            {product.badges.length ? (
              <span className="badge-row">
                {product.badges.map((badge) => (
                  <span key={badge} className={`badge badge-${badge}`}>
                    {BADGE_LABELS[badge] ?? badge}
                  </span>
                ))}
              </span>
            ) : null}
            {soldOut ? <span className="sold-out-flag">Sold out</span> : null}
          </Link>

          <div className="product-tools">
            <button
              type="button"
              className="tool-button"
              onClick={() => toast("Wishlist is not available yet.", "info")}
              aria-pressed={false}
              aria-label={`Save ${product.name} to wishlist`}
            >
              <Icon.Heart filled={false} />
            </button>
            <button
              type="button"
              className="tool-button"
              onClick={() => setQuickView(true)}
              aria-label={`Quick view ${product.name}`}
            >
              <Icon.Zoom />
            </button>
          </div>

          <button
            type="button"
            className="quick-add"
            onClick={quickAdd}
            disabled={soldOut || addToCart.isPending}
          >
            {soldOut ? "Sold out" : sizes.length === 1 ? "Add to bag" : "Select size"}
            {!soldOut ? <Icon.Plus /> : null}
          </button>
        </div>

        <div className="product-info">
          <div className="product-title-row">
            <Link href={productHref} className="product-title">
              {product.name}
            </Link>
            <span className="product-price">{formatRegionMoney(product.price, region)}</span>
          </div>
          <p className="product-subtitle">{product.subtitle}</p>
          <div className="swatch-row" role="group" aria-label={`${product.name} colours`}>
            {product.variants.map((entry, entryIndex) => {
              const unavailable = isVariantSoldOut(entry);
              return (
                <button
                  key={entry.id}
                  type="button"
                  className={`swatch ${entryIndex === variantIndex ? "is-active" : ""} ${unavailable ? "is-out" : ""}`}
                  style={swatchStyle(entry.colour.hex)}
                  onClick={() => {
                    setVariantIndex(entryIndex);
                    setQuickView(false);
                  }}
                  aria-pressed={entryIndex === variantIndex}
                  aria-label={`${entry.colour.name}${unavailable ? " (sold out)" : ""}`}
                  title={`${entry.colour.name}${unavailable ? " — sold out" : ""}`}
                />
              );
            })}
          </div>
          {compact ? null : <span className="visually-hidden">{`List: ${listId}`}</span>}
        </div>
      </Reveal>

      <ProductQuickView
        product={product}
        open={quickView}
        onClose={() => setQuickView(false)}
        variantIndex={variantIndex}
        onVariantChange={setVariantIndex}
      />
    </>
  );
}

export function ProductGrid({
  products,
  columns = 3,
  listId,
}: {
  products: ProductSummaryDto[];
  columns?: 2 | 3 | 4;
  listId: string;
}) {
  return (
    <div className={`product-grid cols-${columns}`}>
      {products.map((product, index) => (
        <ProductCard key={product.slug} product={product} index={index} listId={listId} />
      ))}
    </div>
  );
}
