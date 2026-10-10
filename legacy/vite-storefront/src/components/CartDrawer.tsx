import { useMemo, useState } from "react";
import { COLOURS, POLICIES, PRODUCTS, PROMO_RULES } from "../data/catalog";
import { cartComplements, formatMoney, variantTotalStock } from "../lib/commerce";
import { navigate, track, useStore } from "../lib/store";
import { Icon, Modal, Drawer, EmptyState, LinkButton } from "./ui";

/* --------------------------------------------------------------- cart drawer */

export function CartDrawer() {
  const {
    cart,
    cartOpen,
    setCartOpen,
    updateQty,
    removeLine,
    clearCart,
    lineProduct,
    region,
    promo,
    promoError,
    applyPromoCode,
    clearPromo,
    shippingId,
    setShippingId,
  } = useStore();

  const [code, setCode] = useState("");
  const [handoff, setHandoff] = useState(false);

  const shippingOption = region.shipping.find((option) => option.id === shippingId) ?? region.shipping[0];

  const totals = useMemo(() => {
    const subtotal = cart.reduce((total, line) => {
      const product = lineProduct(line);
      return total + (product?.price ?? 0) * line.qty;
    }, 0);
    const rawShipping = cart.length ? shippingOption.price : 0;
    let discount = 0;
    let shipping = rawShipping;
    if (promo && subtotal >= promo.minSubtotal) {
      if (promo.kind === "percent") discount = (subtotal * promo.value) / 100;
      if (promo.kind === "fixed") discount = Math.min(promo.value, subtotal);
      if (promo.kind === "shipping") shipping = 0;
    }
    return {
      subtotal,
      discount: Math.round(discount * 100) / 100,
      shipping,
      total: Math.max(0, subtotal - discount + shipping),
    };
  }, [cart, lineProduct, promo, shippingOption]);

  const complements = useMemo(
    () => (cart.length ? cartComplements(cart.map((line) => line.slug), 3) : []),
    [cart],
  );

  const freeShipRule = PROMO_RULES.find((rule) => rule.kind === "shipping");
  const freeShipGap = freeShipRule ? Math.max(0, freeShipRule.minSubtotal - totals.subtotal) : 0;
  const freeShipUnlocked =
    freeShipRule && totals.subtotal >= freeShipRule.minSubtotal && promo?.kind !== "shipping";

  return (
    <>
      <Drawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        title={cart.length ? `Your bag (${cart.reduce((n, line) => n + line.qty, 0)})` : "Your bag"}
        label="Shopping bag"
        footer={
          cart.length ? (
            <div className="cart-foot">
              <dl className="cart-totals">
                <div>
                  <dt>Subtotal</dt>
                  <dd>{formatMoney(totals.subtotal, region)}</dd>
                </div>
                {totals.discount > 0 ? (
                  <div className="is-discount">
                    <dt>Discount ({promo?.code})</dt>
                    <dd>−{formatMoney(totals.discount, region)}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Shipping — {shippingOption.label}</dt>
                  <dd>{totals.shipping === 0 ? "Included" : formatMoney(totals.shipping, region)}</dd>
                </div>
                <div className="cart-total">
                  <dt>Total</dt>
                  <dd>{formatMoney(totals.total, region)}</dd>
                </div>
              </dl>
              <p className="tax-note">{region.taxNote}</p>
              <button
                type="button"
                className="button button-dark cart-checkout"
                onClick={() => {
                  setHandoff(true);
                  track({ name: "begin_checkout", value: totals.total, itemCount: cart.length });
                }}
              >
                Continue to checkout <Icon.ArrowRight />
              </button>
              <button type="button" className="ghost-button cart-clear" onClick={clearCart}>
                Empty bag
              </button>
            </div>
          ) : null
        }
      >
        {cart.length === 0 ? (
          <>
            <EmptyState
              title="Your bag is empty"
              copy="Start with the coats and tailoring we build everything else around."
              action={{ label: "Shop the collection", to: "/shop" }}
            />
            <p className="drawer-hint">Saved pieces live in your wishlist, ready when you are.</p>
          </>
        ) : (
          <>
            <ul className="cart-lines">
              {cart.map((line) => {
                const product = lineProduct(line);
                if (!product) return null;
                const variant = product.variants.find((entry) => entry.id === line.variantId);
                const max = variant?.sizes.find((size) => size.size === line.size)?.stock ?? 1;
                const colour = variant ? COLOURS[variant.colour].name : "";
                return (
                  <li className="cart-line" key={line.key}>
                    <button
                      type="button"
                      className="cart-thumb"
                      onClick={() => {
                        setCartOpen(false);
                        navigate(`/product/${product.slug}`);
                      }}
                      aria-label={`View ${product.name}`}
                    >
                      <img src={variant?.images[0]} alt="" loading="lazy" />
                    </button>
                    <div className="cart-line-copy">
                      <div className="cart-line-head">
                        <span className="cart-line-name">{product.name}</span>
                        <span className="cart-line-price">{formatMoney(product.price * line.qty, region)}</span>
                      </div>
                      <p className="cart-line-meta">
                        {colour} · Size {line.size}
                      </p>
                      {max - line.qty <= 2 ? <p className="stock-low">Only {max} left in this size</p> : null}
                      <div className="cart-line-controls">
                        <div className="qty" role="group" aria-label={`Quantity for ${product.name}`}>
                          <button
                            type="button"
                            onClick={() => updateQty(line.key, line.qty - 1)}
                            aria-label="Decrease quantity"
                            disabled={line.qty <= 1}
                          >
                            −
                          </button>
                          <span aria-live="polite">{line.qty}</span>
                          <button
                            type="button"
                            onClick={() => updateQty(line.key, line.qty + 1)}
                            aria-label="Increase quantity"
                            disabled={line.qty >= max}
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          className="ghost-button cart-remove"
                          onClick={() => removeLine(line.key)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {complements.length ? (
              <div className="cart-complements">
                <p className="mega-heading">Completes the bag</p>
                <ul>
                  {complements.map((product) => (
                    <li key={product.slug}>
                      <button
                        type="button"
                        className="cart-complement"
                        onClick={() => {
                          setCartOpen(false);
                          navigate(`/product/${product.slug}`);
                        }}
                      >
                        <img src={product.variants[0].images[0]} alt="" loading="lazy" />
                        <span>
                          <span className="cart-line-name">{product.name}</span>
                          <span className="cart-line-meta">{formatMoney(product.price, region)}</span>
                        </span>
                        <Icon.ArrowUpRight />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="cart-promo">
              <label htmlFor="promo" className="mega-heading">
                Promotion code
              </label>
              <div className="promo-row">
                <input
                  id="promo"
                  type="text"
                  value={code}
                  placeholder="Enter code"
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  autoComplete="off"
                />
                {promo ? (
                  <button type="button" className="ghost-button" onClick={() => { clearPromo(); setCode(""); }}>
                    Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    className="button button-dark"
                    onClick={() => {
                      const result = applyPromoCode(code);
                      if (result.ok) setCode("");
                    }}
                  >
                    Apply
                  </button>
                )}
              </div>
              {promoError ? (
                <p className="form-error" role="alert">
                  {promoError}
                </p>
              ) : (
                <p className="promo-hint">
                  {promo ? promo.description : "Try WELCOME10 for 10% off your first order."}
                </p>
              )}
            </div>

            <div className="cart-shipping">
              <p className="mega-heading">Delivery to {region.label}</p>
              <div className="shipping-options" role="radiogroup" aria-label="Delivery speed">
                {region.shipping.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={option.id === shippingId}
                    className={`shipping-option ${option.id === shippingId ? "is-active" : ""}`}
                    onClick={() => setShippingId(option.id)}
                  >
                    <span>
                      <strong>{option.label}</strong>
                      <em>{option.eta}</em>
                    </span>
                    <span>{option.price === 0 ? "Included" : formatMoney(option.price, region)}</span>
                  </button>
                ))}
              </div>
              {freeShipRule ? (
                <p className={`ship-progress ${freeShipUnlocked ? "is-done" : ""}`}>
                  {freeShipUnlocked
                    ? "You have unlocked free shipping — add FREESHIP at checkout."
                    : `Add ${formatMoney(freeShipGap, region)} more for free shipping with FREESHIP.`}
                </p>
              ) : null}
            </div>
          </>
        )}
      </Drawer>

      <CheckoutHandoff
        open={handoff}
        onClose={() => setHandoff(false)}
        totals={totals}
        shippingLabel={`${shippingOption.label} — ${shippingOption.eta}`}
      />
    </>
  );
}

/* ------------------------------------------------------------ checkout handoff */

function CheckoutHandoff({
  open,
  onClose,
  totals,
  shippingLabel,
}: {
  open: boolean;
  onClose: () => void;
  totals: { subtotal: number; discount: number; shipping: number; total: number };
  shippingLabel: string;
}) {
  const { cart, lineProduct, region, promo } = useStore();
  const [copied, setCopied] = useState(false);

  const payload = useMemo(
    () => ({
      currency: region.currency,
      conversionRateUsed: region.rate,
      shippingAddress: { country: region.code },
      shippingMethod: shippingLabel,
      items: cart.map((line) => {
        const product = lineProduct(line);
        return {
          slug: line.slug,
          variantId: line.variantId,
          size: line.size,
          quantity: line.qty,
          unitPriceUsd: product?.price ?? 0,
        };
      }),
      totals: {
        subtotalUsd: totals.subtotal,
        discountUsd: totals.discount,
        shippingUsd: totals.shipping,
        totalUsd: totals.total,
      },
      promotions: promo ? [promo.code] : [],
    }),
    [cart, lineProduct, promo?.code, region, shippingLabel, totals],
  );

  const json = JSON.stringify(payload, null, 2);

  return (
    <Modal open={open} onClose={onClose} title="Checkout" wide>
      <div className="handoff">
        <div className="handoff-alert">
          <strong>Payment is not connected yet.</strong>
          <p>
            This storefront has no payment provider or order API wired up, so we will not take your card details or
            create an order. Everything up to this point — bag, variants, stock limits, promotions, shipping and
            currency — is live and ready to hand over.
          </p>
        </div>

        <ol className="handoff-steps">
          <li>
            <strong>Connect a checkout provider.</strong> Add your Shopify Storefront / Stripe / Adyen credentials as
            environment variables (never in client code).
          </li>
          <li>
            <strong>Replace the catalogue loaders.</strong> Point <code>src/data/catalog.ts</code> at your commerce API so
            prices, stock and delivery windows come from the source of truth.
          </li>
          <li>
            <strong>Swap this panel for the provider’s checkout.</strong> The payload below is exactly what the cart is
            ready to send.
          </li>
        </ol>

        <div className="handoff-summary">
          <div className="handoff-row">
            <span>Items</span>
            <span>{cart.reduce((n, line) => n + line.qty, 0)}</span>
          </div>
          <div className="handoff-row">
            <span>Shipping</span>
            <span>{shippingLabel}</span>
          </div>
          <div className="handoff-row">
            <span>Order total</span>
            <span>{formatMoney(totals.total, region)}</span>
          </div>
          <div className="handoff-row is-muted">
            <span>Payment options</span>
            <span>{POLICIES.payments}</span>
          </div>
        </div>

        <div className="handoff-actions">
          <button
            type="button"
            className="button button-dark"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(json);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2200);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? "Copied" : "Copy cart payload"} {copied ? <Icon.Check /> : <Icon.ArrowRight />}
          </button>
          <LinkButton to="/shop" variant="ghost" onClick={onClose}>
            Keep shopping
          </LinkButton>
        </div>

        <details className="handoff-json">
          <summary>Preview the payload sent to checkout</summary>
          <pre>
            <code>{json}</code>
          </pre>
        </details>
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------- wishlist drawer */

export function WishlistDrawer() {
  const {
    wishlist,
    wishlistOpen,
    setWishlistOpen,
    removeWishlist,
    toggleBackInStock,
    moveWishlistToCart,
    region,
  } = useStore();
  const products = wishlist
    .map((entry) => ({ entry, product: PRODUCTS.find((product) => product.slug === entry.slug) }))
    .filter((item): item is { entry: typeof wishlist[number]; product: NonNullable<typeof item.product> } => Boolean(item.product));

  return (
    <Drawer
      open={wishlistOpen}
      onClose={() => setWishlistOpen(false)}
      title={wishlist.length ? `Wishlist (${wishlist.length})` : "Wishlist"}
      label="Wishlist"
      side="right"
    >
      {products.length === 0 ? (
        <>
          <EmptyState
            title="Nothing saved yet"
            copy="Tap the heart on any piece and it will wait for you here — on this device, next visit included."
            action={{ label: "Find something", to: "/shop" }}
          />
        </>
      ) : (
        <ul className="cart-lines">
          {products.map(({ entry, product }) => {
            const variant =
              product.variants.find((item) => item.id === entry.variantId) ?? product.variants[0];
            const inStock = variantTotalStock(variant) > 0;
            return (
              <li className="cart-line" key={entry.slug}>
                <button
                  type="button"
                  className="cart-thumb"
                  onClick={() => {
                    setWishlistOpen(false);
                    navigate(`/product/${product.slug}`);
                  }}
                  aria-label={`View ${product.name}`}
                >
                  <img src={variant.images[0]} alt="" loading="lazy" />
                </button>
                <div className="cart-line-copy">
                  <div className="cart-line-head">
                    <span className="cart-line-name">{product.name}</span>
                    <span className="cart-line-price">{formatMoney(product.price, region)}</span>
                  </div>
                  <p className="cart-line-meta">
                    {COLOURS[variant.colour].name} · {product.subtitle}
                  </p>
                  <p className={`stock-note ${inStock ? "is-in" : "is-out"}`}>
                    {inStock ? "Available" : "Sold out in this colour"}
                  </p>
                  <div className="cart-line-controls">
                    <button
                      type="button"
                      className="button button-dark button-small"
                      onClick={() => {
                        const result = moveWishlistToCart(entry.slug);
                        if (!result.ok) toggleBackInStock(entry.slug);
                      }}
                      disabled={!inStock}
                    >
                      {inStock ? "Move to bag" : "Sold out"} {!inStock ? null : <Icon.ArrowRight />}
                    </button>
                    <button
                      type="button"
                      className={`ghost-button ${entry.notifyWhenBack ? "is-active" : ""}`}
                      onClick={() => toggleBackInStock(entry.slug)}
                      aria-pressed={entry.notifyWhenBack}
                    >
                      {entry.notifyWhenBack ? "Alerts on" : "Alert me"}
                    </button>
                    <button
                      type="button"
                      className="ghost-button cart-remove"
                      onClick={() => removeWishlist(entry.slug)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="drawer-hint">
        Saved on this device only — no account is required, which also means your list will not follow you to another
        browser. Connecting a customer account is listed as remaining work.
      </p>
    </Drawer>
  );
}
