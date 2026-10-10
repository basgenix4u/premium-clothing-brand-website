import { useState } from "react";
import { COLOURS, type Product } from "../data/catalog";
import { availableSizesFor, badgeLabel, formatMoney, isProductAvailable, variantTotalStock } from "../lib/commerce";
import { navigate, useStore } from "../lib/store";
import { Icon, Modal, Reveal, Stars, ratingSummary } from "./ui";

export function ProductCard({
  product,
  index = 0,
  compact = false,
  listId = "product-grid",
}: {
  product: Product;
  index?: number;
  compact?: boolean;
  listId?: string;
}) {
  const { addToCart, toggleWishlist, isWishlisted, region, reviewsFor } = useStore();
  const [variantIndex, setVariantIndex] = useState(0);
  const [quickView, setQuickView] = useState(false);
  const variant = product.variants[variantIndex] ?? product.variants[0];
  const colour = COLOURS[variant.colour];
  const sizes = availableSizesFor(variant);
  const soldOut = variantTotalStock(variant) <= 0;
  const wishlisted = isWishlisted(product.slug);
  const { average, count } = ratingSummary(reviewsFor(product.slug));

  const selectVariant = (next: number) => {
    setVariantIndex(next);
    if (quickView) setQuickView(false);
  };

  const quickAdd = () => {
    if (sizes.length === 1) {
      const result = addToCart({ slug: product.slug, variantId: variant.id, size: sizes[0].size });
      if (!result.ok) setQuickView(true);
      return;
    }
    if (sizes.length === 0) {
      setQuickView(true);
      return;
    }
    setQuickView(true);
  };

  return (
    <>
      <Reveal as="article" className={`product-card ${compact ? "is-compact" : ""}`} delay={Math.min(index, 8) * 55}>
        <div className="product-media">
          <button
            type="button"
            className="product-media-link"
            onClick={() => navigate(`/product/${product.slug}`)}
            aria-label={`View ${product.name} in ${colour.name}`}
          >
            <img
              className="product-image-a"
              src={variant.images[0]}
              alt={`${product.name} in ${colour.name}`}
              loading={index < 4 ? "eager" : "lazy"}
              decoding="async"
            />
            {variant.images[1] ? (
              <img
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
                    {badgeLabel[badge]}
                  </span>
                ))}
              </span>
            ) : null}
            {soldOut ? <span className="sold-out-flag">Sold out</span> : null}
          </button>

          <div className="product-tools">
            <button
              type="button"
              className={`tool-button ${wishlisted ? "is-active" : ""}`}
              onClick={() => toggleWishlist(product.slug, variant.id)}
              aria-pressed={wishlisted}
              aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
            >
              <Icon.Heart filled={wishlisted} />
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

          <button type="button" className="quick-add" onClick={quickAdd} disabled={soldOut}>
            {soldOut ? "Sold out" : sizes.length === 1 ? "Add to bag" : "Select size"}
            {!soldOut ? <Icon.Plus /> : null}
          </button>
        </div>

        <div className="product-info">
          <div className="product-title-row">
            <button
              type="button"
              className="product-title"
              onClick={() => navigate(`/product/${product.slug}`)}
            >
              {product.name}
            </button>
            <span className="product-price">{formatMoney(product.price, region)}</span>
          </div>
          <p className="product-subtitle">{product.subtitle}</p>
          {count > 0 ? (
            <span className="product-rating">
              <Stars value={average} /> <span>{average.toFixed(1)} · {count}</span>
            </span>
          ) : null}
          <div className="swatch-row" role="group" aria-label={`${product.name} colours`}>
            {product.variants.map((entry, entryIndex) => {
              const unavailable = variantTotalStock(entry) <= 0;
              return (
                <button
                  key={entry.id}
                  type="button"
                  className={`swatch ${entryIndex === variantIndex ? "is-active" : ""} ${unavailable ? "is-out" : ""}`}
                  style={{ "--swatch": COLOURS[entry.colour].hex } as React.CSSProperties}
                  onClick={() => selectVariant(entryIndex)}
                  aria-pressed={entryIndex === variantIndex}
                  aria-label={`${COLOURS[entry.colour].name}${unavailable ? " (sold out)" : ""}`}
                  title={`${COLOURS[entry.colour].name}${unavailable ? " — sold out" : ""}`}
                />
              );
            })}
          </div>
          {compact ? null : <span className="visually-hidden">{`List: ${listId}`}</span>}
        </div>
      </Reveal>

      <QuickView
        product={product}
        open={quickView}
        onClose={() => setQuickView(false)}
        variantIndex={variantIndex}
        onVariantChange={setVariantIndex}
      />
    </>
  );
}

export function QuickView({
  product,
  open,
  onClose,
  variantIndex,
  onVariantChange,
}: {
  product: Product;
  open: boolean;
  onClose: () => void;
  variantIndex: number;
  onVariantChange: (index: number) => void;
}) {
  const { addToCart, toggleWishlist, isWishlisted, region } = useStore();
  const [size, setSize] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const variant = product.variants[variantIndex] ?? product.variants[0];
  const colour = COLOURS[variant.colour];
  const sizes = availableSizesFor(variant);
  const available = isProductAvailable(product);
  const wishlisted = isWishlisted(product.slug);

  const submit = () => {
    const chosen = size ?? (sizes.length === 1 ? sizes[0].size : null);
    if (!chosen) {
      setError("Choose a size to continue.");
      return;
    }
    const result = addToCart({ slug: product.slug, variantId: variant.id, size: chosen });
    if (result.ok) {
      setError(null);
      onClose();
    } else {
      setError(result.message);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Quick view" wide>
      <div className="quickview">
        <div className="quickview-media">
          <img src={variant.images[0]} alt={`${product.name} in ${colour.name}`} />
        </div>
        <div className="quickview-detail">
          <p className="section-eyebrow">{product.category}</p>
          <h3 className="quickview-name">{product.name}</h3>
          <p className="quickview-price">{formatMoney(product.price, region)}</p>
          <p className="quickview-copy">{product.description}</p>

          <fieldset className="option-group">
            <legend>Colour — <span className="option-value">{colour.name}</span></legend>
            <div className="swatch-row">
              {product.variants.map((entry, entryIndex) => (
                <button
                  key={entry.id}
                  type="button"
                  className={`swatch ${entryIndex === variantIndex ? "is-active" : ""}`}
                  style={{ "--swatch": COLOURS[entry.colour].hex } as React.CSSProperties}
                  onClick={() => {
                    onVariantChange(entryIndex);
                    setSize(null);
                    setError(null);
                  }}
                  aria-pressed={entryIndex === variantIndex}
                  aria-label={COLOURS[entry.colour].name}
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

          {error ? <p className="form-error" role="alert">{error}</p> : null}

          <div className="quickview-actions">
            <button type="button" className="button button-dark" onClick={submit} disabled={!available}>
              {available ? "Add to bag" : "Sold out"} <Icon.ArrowRight />
            </button>
            <button
              type="button"
              className={`button button-ghost ${wishlisted ? "is-active" : ""}`}
              onClick={() => toggleWishlist(product.slug, variant.id)}
              aria-pressed={wishlisted}
            >
              <Icon.Heart filled={wishlisted} /> {wishlisted ? "Saved" : "Save"}
            </button>
          </div>
          <button
            type="button"
            className="text-link"
            onClick={() => {
              onClose();
              navigate(`/product/${product.slug}`);
            }}
          >
            Full product details <Icon.ArrowUpRight />
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function ProductGrid({
  products,
  columns = 3,
  listId,
}: {
  products: Product[];
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
