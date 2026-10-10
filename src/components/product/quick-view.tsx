"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useState } from "react";
import { Icon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/overlays";
import { Photo } from "@/components/ui/photo";
import { useAddToCart } from "@/features/cart/use-add-to-cart";
import { availableSizes, isProductAvailable } from "@/features/catalog/product-utils";
import { useToast } from "@/features/feedback/toast-context";
import { useRegion } from "@/features/regions/region-context";
import { formatRegionMoney } from "@/lib/money-format";
import type { ProductSummaryDto } from "@/shared/catalog-dto";

const swatchStyle = (hex: string): CSSProperties => ({ "--swatch": hex }) as CSSProperties;

/** Modal with colour and size pickers. Adds the chosen line to the bag through the API. */
export function ProductQuickView({
  product,
  open,
  onClose,
  variantIndex,
  onVariantChange,
}: {
  product: ProductSummaryDto;
  open: boolean;
  onClose: () => void;
  variantIndex: number;
  onVariantChange: (index: number) => void;
}) {
  const { region } = useRegion();
  const { toast } = useToast();
  const addToCart = useAddToCart();
  const [size, setSize] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const variant = product.variants[variantIndex] ?? product.variants[0];
  if (!variant) return null;
  const sizes = availableSizes(variant);
  const available = isProductAvailable(product);

  const submit = () => {
    const chosen = size ?? (sizes.length === 1 ? sizes[0]?.size : undefined);
    if (!chosen) {
      setError("Choose a size to continue.");
      return;
    }
    addToCart.mutate(
      { variantId: variant.id, size: chosen },
      {
        onSuccess: () => {
          setError(null);
          onClose();
          toast(`${product.name} added to your bag.`, "success");
        },
        onError: (failure) => setError(failure.message),
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title="Quick view" wide>
      <div className="quickview">
        <div className="quickview-media">
          <Photo src={variant.images[0]} alt={`${product.name} in ${variant.colour.name}`} />
        </div>
        <div className="quickview-detail">
          <p className="section-eyebrow">{product.category.name}</p>
          <h3 className="quickview-name">{product.name}</h3>
          <p className="quickview-price">{formatRegionMoney(product.price, region)}</p>
          <p className="quickview-copy">{product.subtitle}</p>

          <fieldset className="option-group">
            <legend>
              Colour — <span className="option-value">{variant.colour.name}</span>
            </legend>
            <div className="swatch-row">
              {product.variants.map((entry, entryIndex) => (
                <button
                  key={entry.id}
                  type="button"
                  className={`swatch ${entryIndex === variantIndex ? "is-active" : ""}`}
                  style={swatchStyle(entry.colour.hex)}
                  onClick={() => {
                    onVariantChange(entryIndex);
                    setSize(null);
                    setError(null);
                  }}
                  aria-pressed={entryIndex === variantIndex}
                  aria-label={entry.colour.name}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className="option-group">
            <legend>Size</legend>
            <div className="size-row">
              {variant.sizes.map((entry) => {
                const out = entry.stock <= 0;
                const low = !out && entry.stock <= 2;
                return (
                  <button
                    key={entry.size}
                    type="button"
                    className={`size-chip ${size === entry.size ? "is-active" : ""} ${out ? "is-out" : ""}`}
                    onClick={() => {
                      setSize(entry.size);
                      setError(null);
                    }}
                    disabled={out}
                    aria-pressed={size === entry.size}
                  >
                    {entry.size}
                    {low ? <em>2 left</em> : null}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="quickview-actions">
            <button
              type="button"
              className="button button-dark"
              onClick={submit}
              disabled={!available || addToCart.isPending}
            >
              {available ? "Add to bag" : "Sold out"} <Icon.ArrowRight />
            </button>
            <button
              type="button"
              className="button button-ghost"
              onClick={() => toast("Wishlist is not available yet.", "info")}
              aria-pressed={false}
            >
              <Icon.Heart filled={false} /> Save
            </button>
          </div>
          <Link href={`/product/${product.slug}`} className="text-link" onClick={onClose}>
            Full product details <Icon.ArrowUpRight />
          </Link>
        </div>
      </div>
    </Modal>
  );
}
