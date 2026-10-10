import { useEffect, useMemo, useRef, useState } from "react";
import { COLOURS, POLICIES, SIZE_GUIDE, productBySlug, type Product } from "../data/catalog";
import {
  availableSizesFor,
  badgeLabel,
  completeTheLook,
  formatMoney,
  relatedProducts,
  variantTotalStock,
} from "../lib/commerce";
import { navigate, track, useStore } from "../lib/store";
import { ProductGrid } from "../components/ProductCard";
import { EmptyState, Icon, LinkButton, Modal, Reveal, StarIcon, Stars, ratingSummary } from "../components/ui";

export function ProductPage({ slug }: { slug: string }) {
  const {
    addToCart,
    toggleWishlist,
    isWishlisted,
    region,
    recordView,
    reviewsFor,
    addReview,
    toggleBackInStock,
    wishlist,
    pushToast,
  } = useStore();

  const product = productBySlug(slug);
  const [variantIndex, setVariantIndex] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const [openPanel, setOpenPanel] = useState<string | null>("description");
  const imageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVariantIndex(0);
    setSize(null);
    setImageIndex(0);
    setError(null);
    if (product) {
      recordView(product.slug);
      track({ name: "view_item", slug: product.slug, value: product.price });
      document.title = `${product.name} — Vellum`;
    }
    return () => {
      document.title = "Vellum — Wear your next chapter";
    };
  }, [product, recordView]);

  const reviews = useMemo(() => (product ? reviewsFor(product.slug) : []), [product, reviewsFor]);
  const { average, count } = ratingSummary(reviews);

  if (!product) {
    return (
      <div className="page">
        <EmptyState
          title="We cannot find that piece"
          copy="It may have sold through or the link is out of date. The full collection is one tap away."
          action={{ label: "Browse the collection", to: "/shop" }}
        />
      </div>
    );
  }

  const variant = product.variants[variantIndex] ?? product.variants[0];
  const colour = COLOURS[variant.colour];
  const sizesAvailable = availableSizesFor(variant);
  const variantAvailable = variantTotalStock(variant) > 0;
  const wishlisted = isWishlisted(product.slug);
  const wishlistEntry = wishlist.find((entry) => entry.slug === product.slug);
  const related = relatedProducts(product, 4);
  const look = completeTheLook(product, 4);
  const images = variant.images.length ? variant.images : product.variants[0].images;
  const delivery = region.shipping[0];

  const submit = () => {
    const chosen = size ?? (sizesAvailable.length === 1 ? sizesAvailable[0].size : null);
    if (!chosen) {
      setError("Select a size to add this to your bag.");
      return;
    }
    const result = addToCart({ slug: product.slug, variantId: variant.id, size: chosen });
    setError(result.ok ? null : result.message);
  };

  const panels = [
    {
      id: "description",
      title: "Description & details",
      body: (
        <>
          <p>{product.description}</p>
          <ul>
            {product.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        </>
      ),
    },
    {
      id: "materials",
      title: "Materials & care",
      body: (
        <>
          <p>{product.composition}</p>
          <ul>
            {product.care.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      ),
    },
    {
      id: "fit",
      title: "Fit & sizing",
      body: (
        <>
          <p>{product.fit.note}</p>
          <p>{product.fit.model}</p>
          <p>{product.fit.runs}</p>
          <button type="button" className="text-link" onClick={() => setGuideOpen(true)}>
            Open the size guide <Icon.Ruler />
          </button>
        </>
      ),
    },
    {
      id: "delivery",
      title: "Delivery & returns",
      body: (
        <>
          <p>
            <strong>{region.label}:</strong> {delivery.label} arrives in {delivery.eta} at{" "}
            {delivery.price === 0 ? "no cost" : formatMoney(delivery.price, region)}.
          </p>
          <p>{region.taxNote}</p>
          <p>{POLICIES.shipping}</p>
          <p>{POLICIES.returns}</p>
          <p>{POLICIES.exchanges}</p>
          <p>
            <strong>Need a hand?</strong> {POLICIES.support}
          </p>
        </>
      ),
    },
  ];

  return (
    <article className="page product-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <button type="button" onClick={() => navigate("/shop")}>
          Shop
        </button>
        <span>/</span>
        <button type="button" onClick={() => navigate(`/shop?category=${product.category}`)}>
          {product.category}
        </button>
        <span>/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className="pdp">
        <div className="pdp-gallery">
          <div
            className={`pdp-stage ${zoom ? "is-zoomed" : ""}`}
            ref={imageRef}
            onMouseEnter={() => setZoom(true)}
            onMouseLeave={() => setZoom(false)}
            onMouseMove={(event) => {
              const bounds = event.currentTarget.getBoundingClientRect();
              const x = ((event.clientX - bounds.left) / bounds.width) * 100;
              const y = ((event.clientY - bounds.top) / bounds.height) * 100;
              setOrigin(`${x}% ${y}%`);
            }}
          >
            <img
              key={images[imageIndex]}
              src={images[imageIndex]}
              alt={`${product.name} in ${colour.name}, view ${imageIndex + 1}`}
              style={{ transformOrigin: origin }}
            />
            <span className="pdp-zoom-hint">
              <Icon.Zoom /> Hover to zoom
            </span>
          </div>
          <div className="pdp-thumbs" role="tablist" aria-label="Product views">
            {images.map((image, index) => (
              <button
                key={image}
                type="button"
                role="tab"
                aria-selected={index === imageIndex}
                className={`pdp-thumb ${index === imageIndex ? "is-active" : ""}`}
                onClick={() => setImageIndex(index)}
                aria-label={`View image ${index + 1}`}
              >
                <img src={image} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        </div>

        <div className="pdp-detail">
          <p className="section-eyebrow">
            {product.category}
            {product.badges.length ? ` · ${product.badges.map((badge) => badgeLabel[badge]).join(" · ")}` : ""}
          </p>
          <h1 className="pdp-title">{product.name}</h1>
          <p className="pdp-subtitle">{product.subtitle}</p>
          <div className="pdp-price-row">
            <span className="pdp-price">{formatMoney(product.price, region)}</span>
            {count > 0 ? (
              <span className="pdp-rating">
                <Stars value={average} size="md" /> <span>{average.toFixed(1)} from {count} review{count === 1 ? "" : "s"}</span>
              </span>
            ) : (
              <span className="pdp-rating is-muted">No reviews yet</span>
            )}
          </div>
          <p className="pdp-tax">{region.taxNote}</p>

          <fieldset className="option-group">
            <legend>
              Colour — <span className="option-value">{colour.name}</span>
            </legend>
            <div className="swatch-row">
              {product.variants.map((entry, index) => {
                const out = variantTotalStock(entry) <= 0;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    className={`swatch ${index === variantIndex ? "is-active" : ""} ${out ? "is-out" : ""}`}
                    style={{ "--swatch": COLOURS[entry.colour].hex } as React.CSSProperties}
                    onClick={() => {
                      setVariantIndex(index);
                      setImageIndex(0);
                      setSize(null);
                      setError(null);
                    }}
                    aria-pressed={index === variantIndex}
                    aria-label={`${COLOURS[entry.colour].name}${out ? " (sold out)" : ""}`}
                  />
                );
              })}
            </div>
          </fieldset>

          <fieldset className="option-group">
            <legend>
              Size — <span className="option-value">{product.fit.runs}</span>
            </legend>
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
                    {low ? <em>{entry.stock} left</em> : null}
                  </button>
                );
              })}
            </div>
            <button type="button" className="text-link size-guide-link" onClick={() => setGuideOpen(true)}>
              Size guide &amp; fit notes <Icon.Ruler />
            </button>
          </fieldset>

          {variantAvailable ? (
            <p className="stock-note is-in">
              In stock in {colour.name}
              {sizesAvailable.length <= 2 && sizesAvailable.length ? ` — only ${sizesAvailable.length} size${sizesAvailable.length === 1 ? "" : "s"} left` : ""}
            </p>
          ) : (
            <p className="stock-note is-out">Sold out in {colour.name} — choose another colour or set an alert.</p>
          )}

          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="pdp-actions">
            <button type="button" className="button button-dark pdp-add" onClick={submit} disabled={!variantAvailable}>
              {variantAvailable ? "Add to bag" : "Sold out in this colour"} <Icon.ArrowRight />
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

          {!variantAvailable ? (
            <p className="notify-note">
              Alerts are stored with your wishlist on this device. Sending them requires our email notification
              service, which is not connected in this build.
            </p>
          ) : null}

          {!variantAvailable ? (
            <button
              type="button"
              className={`button button-ghost notify-button ${wishlistEntry?.notifyWhenBack ? "is-active" : ""}`}
              onClick={() => {
                if (!wishlistEntry) toggleWishlist(product.slug, variant.id);
                toggleBackInStock(product.slug);
                pushToast({
                  message: wishlistEntry?.notifyWhenBack
                    ? "Back-in-stock alerts are off for this piece."
                    : "Alert saved. Our notification service still needs to be connected to send it.",
                  tone: "neutral",
                });
              }}
            >
              {wishlistEntry?.notifyWhenBack ? "Alerts on — turn off" : "Tell me when it is back"}
            </button>
          ) : null}

          <ul className="assurance">
            <li>
              <Icon.Return /> 30-day returns and free exchanges
            </li>
            <li>
              <Icon.Truck /> {delivery.label} to {region.label} in {delivery.eta}
            </li>
            <li>
              <Icon.Leaf /> {product.composition.split(".")[0]}
            </li>
          </ul>

          <div className="pdp-panels">
            {panels.map((panel) => {
              const open = openPanel === panel.id;
              return (
                <div className="faq-item" key={panel.id}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenPanel(open ? null : panel.id)}
                  >
                    <span>{panel.title}</span>
                    <Icon.Plus open={open} />
                  </button>
                  <div className={`faq-answer ${open ? "show" : ""}`}>
                    <div className="panel-body">{panel.body}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Reveal className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-eyebrow">Complete the look</p>
            <h2 className="section-title">Built to be worn together.</h2>
          </div>
          <LinkButton to={`/shop?category=${product.category}`} variant="ghost">
            More {product.category} <Icon.ArrowRight />
          </LinkButton>
        </div>
        <ProductGrid products={look} listId="complete-the-look" />
      </Reveal>

      <Reviews product={product} reviews={reviews} onSubmit={addReview} />

      <Reveal className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-eyebrow">You may also like</p>
            <h2 className="section-title">Close in spirit.</h2>
          </div>
        </div>
        <ProductGrid products={related} listId="related-products" />
      </Reveal>

      <Modal open={guideOpen} onClose={() => setGuideOpen(false)} title="Size guide" wide>
        <div className="size-guide">
          <p className="size-guide-note">
            Measurements are body measurements in centimetres. Sizing shown in {region.sizeSystem} units — every product
            page states the fit before you choose.
          </p>
          {[SIZE_GUIDE.tops, SIZE_GUIDE.bottoms].map((table) => (
            <table key={table.heading}>
              <caption>{table.heading}</caption>
              <thead>
                <tr>
                  {table.columns.map((column) => (
                    <th key={column} scope="col">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell, index) =>
                      index === 0 ? (
                        <th key={cell} scope="row">
                          {cell}
                        </th>
                      ) : (
                        <td key={`${cell}-${index}`}>{cell}</td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
          <div className="size-guide-fit">
            <h3>This piece</h3>
            <p>{product.fit.note}</p>
            <p>{product.fit.model}</p>
            <p>{product.fit.runs}</p>
            <p>
              Still unsure? {POLICIES.support} We will help you choose before you order, and exchanges are free.
            </p>
          </div>
        </div>
      </Modal>
    </article>
  );
}

/* -------------------------------------------------------------------- reviews */

function Reviews({
  product,
  reviews,
  onSubmit,
}: {
  product: Product;
  reviews: { id: string; rating: number; title: string; body: string; author: string; createdAt: number }[];
  onSubmit: (input: { slug: string; author: string; rating: number; title: string; body: string }) => { ok: boolean; message: string };
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { average, count } = ratingSummary(reviews);
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    total: reviews.filter((review) => review.rating === star).length,
  }));

  const submit = () => {
    const result = onSubmit({ slug: product.slug, author, rating, title, body });
    if (result.ok) {
      setAuthor("");
      setTitle("");
      setBody("");
      setRating(0);
      setError(null);
      setOpen(false);
    } else {
      setError(result.message);
    }
  };

  return (
    <Reveal className="section-block reviews-block">
      <div className="section-heading">
        <div>
          <p className="section-eyebrow">Reviews</p>
          <h2 className="section-title">Worn, then written about.</h2>
        </div>
        <button type="button" className="button button-ghost" onClick={() => setOpen((value) => !value)}>
          Write a review <Icon.Plus open={open} />
        </button>
      </div>

      {open ? (
        <form
          className="review-form"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <fieldset className="option-group">
            <legend>Your rating</legend>
            <div className="rating-input">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  aria-pressed={rating === star}
                  aria-label={`${star} star${star === 1 ? "" : "s"}`}
                  className={star <= rating ? "is-active" : ""}
                >
                  <StarIcon fill={star <= rating ? 1 : 0} />
                </button>
              ))}
            </div>
          </fieldset>
          <div className="form-grid">
            <label>
              Name
              <input value={author} onChange={(event) => setAuthor(event.target.value)} autoComplete="name" required />
            </label>
            <label>
              Headline
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Sums it up in a line"
              />
            </label>
          </div>
          <label>
            Your review
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={4}
              placeholder="Fit, fabric, how you wear it — the things you would want to know."
              required
            />
          </label>
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="form-actions">
            <button type="submit" className="button button-dark">
              Publish review <Icon.ArrowRight />
            </button>
            <button type="button" className="ghost-button" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
          <p className="form-note">
            Reviews are stored in your browser for this demo storefront — connecting them to a moderated review service
            is listed as remaining work.
          </p>
        </form>
      ) : null}

      {count === 0 ? (
        <div className="reviews-empty">
          <p>
            No reviews for the {product.name} yet. If you own it, the first one helps everyone else choose well.
          </p>
        </div>
      ) : (
        <div className="reviews-layout">
          <div className="reviews-summary">
            <p className="reviews-average">{average.toFixed(1)}</p>
            <Stars value={average} size="md" />
            <p className="reviews-count">{count} review{count === 1 ? "" : "s"}</p>
            <ul>
              {distribution.map((row) => (
                <li key={row.star}>
                  <span>{row.star}★</span>
                  <span className="meter">
                    <span style={{ width: `${count ? (row.total / count) * 100 : 0}%` }} />
                  </span>
                  <span>{row.total}</span>
                </li>
              ))}
            </ul>
          </div>
          <ul className="reviews-list">
            {reviews.map((review) => (
              <li key={review.id}>
                <div className="review-head">
                  <Stars value={review.rating} />
                  <h3>{review.title}</h3>
                </div>
                <p>{review.body}</p>
                <p className="review-meta">
                  {review.author} ·{" "}
                  {new Date(review.createdAt).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Reveal>
  );
}


