import { useEffect, useMemo, useState } from "react";
import {
  ARTICLES,
  COLOURS,
  LOOKS,
  PRODUCTS,
  QUIZ,
  type Look,
  type StyleId,
} from "../data/catalog";
import { availableSizesFor, formatMoney, recommendForStyles } from "../lib/commerce";
import { navigate, track, useStore } from "../lib/store";
import { ProductCard, ProductGrid } from "../components/ProductCard";
import { EmptyState, Icon, LinkButton, Modal, Reveal } from "../components/ui";

/* ----------------------------------------------------------- shop the look */

export function ShopTheLook({ look, index = 0 }: { look: Look; index?: number }) {
  const { region, addToCart, setCartOpen, pushToast } = useStore();
  const [active, setActive] = useState<number | null>(null);
  const items = useMemo(
    () => look.items.map((item) => ({ item, product: PRODUCTS.find((product) => product.slug === item.slug) })),
    [look.items],
  );
  const valid = items.filter((entry): entry is { item: Look["items"][number]; product: NonNullable<typeof entry.product> } => Boolean(entry.product));

  const addLook = () => {
    let added = 0;
    valid.forEach(({ product }) => {
      const variant =
        product.variants.find((entry) => availableSizesFor(entry).length) ?? product.variants[0];
      const size = availableSizesFor(variant)[0];
      if (size) {
        const result = addToCart({
          slug: product.slug,
          variantId: variant.id,
          size: size.size,
          qty: 1,
          silent: true,
        });
        if (result.ok) added += 1;
      }
    });
    if (added) {
      pushToast({ message: `${added} piece${added === 1 ? "" : "s"} from “${look.title}” added.`, tone: "success" });
      setCartOpen(true);
    } else {
      pushToast({ message: "This look is sold out in every size right now.", tone: "error" });
    }
  };

  return (
    <Reveal as="article" className="look" delay={index * 90}>
      <div className="look-media">
        <img src={look.image} alt={look.title} loading="lazy" />
        {valid.map((entry, entryIndex) => (
          <button
            key={entry.item.slug}
            type="button"
            className={`look-hotspot ${active === entryIndex ? "is-active" : ""}`}
            style={{ left: `${entry.item.x}%`, top: `${entry.item.y}%` }}
            onClick={() => setActive(active === entryIndex ? null : entryIndex)}
            aria-pressed={active === entryIndex}
            aria-label={`${entry.item.label}: ${entry.product.name}`}
          >
            <span />
            <span className="look-pop">
              <img src={entry.product.variants[0].images[0]} alt="" />
              <span>
                <strong>{entry.product.name}</strong>
                <em>{formatMoney(entry.product.price, region)}</em>
                <span className="look-pop-action">View piece</span>
              </span>
            </span>
          </button>
        ))}
      </div>
      <div className="look-copy">
        <p className="section-eyebrow">{look.season}</p>
        <h3>{look.title}</h3>
        <p>{look.copy}</p>
        <p className="look-styling">{look.styling}</p>
        <div className="look-items">
          {valid.map(({ item, product }, entryIndex) => (
            <button
              key={item.slug}
              type="button"
              className={`look-item ${active === entryIndex ? "is-active" : ""}`}
              onClick={() => navigate(`/product/${product.slug}`)}
              onMouseEnter={() => setActive(entryIndex)}
            >
              <img src={product.variants[0].images[0]} alt="" loading="lazy" />
              <span>
                <strong>{product.name}</strong>
                <em>
                  {COLOURS[product.variants[0].colour].name} · {formatMoney(product.price, region)}
                </em>
              </span>
            </button>
          ))}
        </div>
        <div className="look-actions">
          <button type="button" className="button button-dark" onClick={addLook}>
            Add the look <Icon.ArrowRight />
          </button>
          <LinkButton to="/lookbook" variant="ghost">
            All looks
          </LinkButton>
        </div>
      </div>
    </Reveal>
  );
}

/* ------------------------------------------------------------- lookbook page */

export function LookbookPage() {
  useEffect(() => {
    document.title = "Lookbook — Vellum";
    return () => {
      document.title = "Vellum — Wear your next chapter";
    };
  }, []);

  return (
    <div className="page lookbook-page">
      <header className="page-head">
        <div>
          <p className="section-eyebrow">Fall / Winter</p>
          <h1 className="page-title">The lookbook.</h1>
          <p className="page-lede">
            Four looks, every piece in stock or flagged otherwise. Tap a marker on the image to shop the exact item.
          </p>
        </div>
      </header>
      <div className="look-list">
        {LOOKS.map((look, index) => (
          <ShopTheLook key={look.id} look={look} index={index} />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- quiz */

export function QuizPage() {
  const { setQuizResult, quizResult, region } = useStore();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(Boolean(quizResult));

  const questions = QUIZ;
  const progress = Math.round(((step + (done ? 1 : 0)) / questions.length) * 100);

  const choose = (questionId: string, value: string) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
    if (step + 1 < questions.length) setStep(step + 1);
    else setDone(true);
  };

  const resultStyles = useMemo<StyleId[]>(() => {
    const chosen = questions.flatMap((question) => {
      const value = answers[question.id];
      const option = question.options.find((entry) => entry.value === value);
      return option?.styles ?? [];
    });
    const tally = chosen.reduce<Record<string, number>>((acc, style) => {
      acc[style] = (acc[style] ?? 0) + 1;
      return acc;
    }, {});
    return (Object.entries(tally)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([style]) => style) as StyleId[]);
  }, [answers, questions]);

  useEffect(() => {
    if (done && resultStyles.length) {
      setQuizResult(resultStyles);
      track({ name: "style_quiz_complete", styles: resultStyles });
      document.title = "Your style — Vellum";
    }
  }, [done, resultStyles, setQuizResult]);

  const recommended = useMemo(
    () => (resultStyles.length ? recommendForStyles(resultStyles, 6) : []),
    [resultStyles],
  );

  return (
    <div className="page quiz-page">
      <header className="page-head">
        <div>
          <p className="section-eyebrow">Discover your style</p>
          <h1 className="page-title">Four questions. No wrong answers.</h1>
          <p className="page-lede">
            We will match you to the pieces already in the collection that fit how you actually dress.
          </p>
        </div>
      </header>

      {!done ? (
        <div className="quiz">
          <div className="quiz-progress">
            <span style={{ width: `${progress}%` }} />
          </div>
          <p className="quiz-count">
            Question {step + 1} of {questions.length}
          </p>
          <h2 className="quiz-question">{questions[step].question}</h2>
          <div className="quiz-options">
            {questions[step].options.map((option) => (
              <button
                key={option.value}
                type="button"
                className="quiz-option"
                onClick={() => choose(questions[step].id, option.value)}
              >
                {option.label}
                <Icon.ArrowRight />
              </button>
            ))}
          </div>
          {step > 0 ? (
            <button type="button" className="ghost-button" onClick={() => setStep(step - 1)}>
              Back
            </button>
          ) : null}
        </div>
      ) : (
        <div className="quiz-result">
          <div className="quiz-result-head">
            <p className="section-eyebrow">Your result</p>
            <h2>
              {resultStyles.map((style) => style[0].toUpperCase() + style.slice(1)).join(" & ")}
            </h2>
            <p>
              Six pieces from the current collection that suit that line. Save what you like — nothing is added to your
              bag automatically.
            </p>
            <div className="quiz-result-actions">
              <LinkButton to="/shop" variant="dark">
                Shop everything <Icon.ArrowRight />
              </LinkButton>
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  setDone(false);
                  setStep(0);
                  setAnswers({});
                }}
              >
                Take it again
              </button>
            </div>
          </div>
          {recommended.length ? (
            <ProductGrid products={recommended} listId="quiz-results" />
          ) : (
            <EmptyState
              title="No match yet"
              copy="Your answers did not line up with the current drop. Browse the collection instead."
              action={{ label: "Browse the collection", to: "/shop" }}
            />
          )}
          <p className="quiz-footnote">Prices shown in {region.currency} for {region.label}.</p>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- journal */

export function JournalPage({ slug }: { slug?: string }) {
  const article = slug ? ARTICLES.find((entry) => entry.slug === slug) : undefined;

  useEffect(() => {
    document.title = article ? `${article.title} — Vellum Journal` : "Journal — Vellum";
    return () => {
      document.title = "Vellum — Wear your next chapter";
    };
  }, [article]);

  if (slug && !article) {
    return (
      <div className="page">
        <EmptyState
          title="That story has moved"
          copy="The Journal index has everything we have published so far."
          action={{ label: "Go to the Journal", to: "/journal" }}
        />
      </div>
    );
  }

  if (article) {
    const related = article.related
      .map((productSlug) => PRODUCTS.find((product) => product.slug === productSlug))
      .filter((product): product is NonNullable<typeof product> => Boolean(product));
    return (
      <article className="page article-page">
        <header className="article-head">
          <button type="button" className="text-link" onClick={() => navigate("/journal")}>
            <Icon.ArrowLeft /> Journal
          </button>
          <p className="section-eyebrow">
            {article.kicker} · {article.readTime}
          </p>
          <h1>{article.title}</h1>
        </header>
        <div className="article-hero">
          <img src={article.image} alt="" />
        </div>
        <div className="article-body">
          {article.body.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
        <Reveal className="section-block">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">Shop the story</p>
              <h2 className="section-title">Pieces we mentioned.</h2>
            </div>
          </div>
          <ProductGrid products={related} listId="journal-related" />
        </Reveal>
      </article>
    );
  }

  return (
    <div className="page journal-page">
      <header className="page-head">
        <div>
          <p className="section-eyebrow">The Journal</p>
          <h1 className="page-title">Notes on dressing well.</h1>
          <p className="page-lede">Styling advice, craft notes and the thinking behind the pieces.</p>
        </div>
        <div className="page-tools">
          <LinkButton to="/quiz" variant="dark">
            Discover your style <Icon.ArrowRight />
          </LinkButton>
        </div>
      </header>
      <div className="journal-list">
        {ARTICLES.map((entry, index) => (
          <Reveal as="article" className="journal-card" key={entry.slug} delay={index * 80}>
            <button type="button" className="journal-media" onClick={() => navigate(`/journal/${entry.slug}`)}>
              <img src={entry.image} alt="" loading="lazy" />
            </button>
            <div className="journal-copy">
              <p className="section-eyebrow">
                {entry.kicker} · {entry.readTime}
              </p>
              <h2>{entry.title}</h2>
              <p>{entry.excerpt}</p>
              <button type="button" className="text-link" onClick={() => navigate(`/journal/${entry.slug}`)}>
                Read the piece <Icon.ArrowRight />
              </button>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- wishlist */

export function WishlistPage() {
  const { wishlist, moveWishlistToCart, removeWishlist, toggleBackInStock, recentlyViewed, region } = useStore();
  const [moved, setMoved] = useState<string | null>(null);

  const rows = wishlist
    .map((entry) => ({ entry, product: PRODUCTS.find((product) => product.slug === entry.slug) }))
    .filter((row): row is { entry: (typeof wishlist)[number]; product: NonNullable<typeof row.product> } => Boolean(row.product));

  const recent = recentlyViewed
    .map((productSlug) => PRODUCTS.find((product) => product.slug === productSlug))
    .filter((product): product is NonNullable<typeof product> => Boolean(product))
    .slice(0, 4);

  return (
    <div className="page wishlist-page">
      <header className="page-head">
        <div>
          <p className="section-eyebrow">Saved</p>
          <h1 className="page-title">Your wishlist.</h1>
          <p className="page-lede">
            {rows.length
              ? `${rows.length} piece${rows.length === 1 ? "" : "s"} saved on this device.`
              : "Nothing saved yet — tap the heart on any piece to keep it here."}
          </p>
        </div>
        {rows.length ? (
          <div className="page-tools">
            <button
              type="button"
              className="button button-dark"
              onClick={() =>
                rows.forEach(({ entry }) => {
                  const result = moveWishlistToCart(entry.slug);
                  if (result.ok) setMoved(entry.slug);
                })
              }
            >
              Move all available to bag <Icon.ArrowRight />
            </button>
          </div>
        ) : null}
      </header>

      {rows.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          copy="Save coats, tailoring and accessories as you browse — they stay put between visits on this device."
          action={{ label: "Browse the collection", to: "/shop" }}
        />
      ) : (
        <ul className="wishlist-list">
          {rows.map(({ entry, product }) => {
            const variant = product.variants.find((item) => item.id === entry.variantId) ?? product.variants[0];
            const available = variant.sizes.some((size) => size.stock > 0);
            return (
              <li key={entry.slug} className="wishlist-row">
                <button
                  type="button"
                  className="wishlist-thumb"
                  onClick={() => navigate(`/product/${product.slug}`)}
                  aria-label={`View ${product.name}`}
                >
                  <img src={variant.images[0]} alt="" loading="lazy" />
                </button>
                <div className="wishlist-copy">
                  <h2>{product.name}</h2>
                  <p className="wishlist-meta">
                    {COLOURS[variant.colour].name} · {product.subtitle}
                  </p>
                  <p className="wishlist-price">{formatMoney(product.price, region)}</p>
                  <p className={`stock-note ${available ? "is-in" : "is-out"}`}>
                    {available ? "Available now" : "Sold out in this colour"}
                  </p>
                  <div className="wishlist-actions">
                    <button
                      type="button"
                      className="button button-dark button-small"
                      disabled={!available}
                      onClick={() => {
                        const result = moveWishlistToCart(entry.slug);
                        setMoved(result.ok ? entry.slug : null);
                      }}
                    >
                      {available ? "Move to bag" : "Sold out"}
                    </button>
                    {!available ? (
                      <button
                        type="button"
                        className={`ghost-button ${entry.notifyWhenBack ? "is-active" : ""}`}
                        onClick={() => toggleBackInStock(entry.slug)}
                        aria-pressed={entry.notifyWhenBack}
                      >
                        {entry.notifyWhenBack ? "Alerts on" : "Alert me"}
                      </button>
                    ) : null}
                    <button type="button" className="ghost-button" onClick={() => removeWishlist(entry.slug)}>
                      Remove
                    </button>
                  </div>
                  {moved === entry.slug ? <p className="wishlist-moved">Moved to your bag.</p> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {recent.length ? (
        <Reveal className="section-block">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">Recently viewed</p>
              <h2 className="section-title">Where you have been.</h2>
            </div>
          </div>
          <ProductGrid products={recent} listId="wishlist-recent" />
        </Reveal>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------- outfit builder */

export function OutfitBuilder({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  const { addToCart, region } = useStore();
  const [open, setOpen] = useState(false);
  const [slots, setSlots] = useState<Record<string, string | null>>({
    outerwear: null,
    top: null,
    bottom: null,
    accessory: null,
  });

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  const topPool = PRODUCTS.filter((product) =>
    ["essentials", "knitwear"].includes(product.category),
  );
  const bottomPool = PRODUCTS.filter((product) =>
    ["tailoring", "denim", "essentials"].includes(product.category) && product.slug !== slots.top,
  );

  const total = Object.values(slots).reduce((sum, slug) => {
    const product = PRODUCTS.find((entry) => entry.slug === slug);
    return sum + (product?.price ?? 0);
  }, 0);

  return (
    <>
      <button type="button" className="button button-ghost" onClick={() => setOpen(true)}>
        Build an outfit <Icon.ArrowRight />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Outfit builder" wide>
        <div className="builder">
          <p className="builder-lede">
            Pick one piece per slot. We only show what is in stock, and nothing is added to your bag until you say so.
          </p>
          {(["outerwear", "top", "bottom", "accessory"] as const).map((slot) => {
            const pool =
              slot === "outerwear"
                ? PRODUCTS.filter((product) => product.category === "outerwear")
                : slot === "top"
                  ? topPool
                  : slot === "bottom"
                    ? bottomPool
                    : PRODUCTS.filter((product) => product.category === "accessories");
            const selected = PRODUCTS.find((product) => product.slug === slots[slot]);
            return (
              <section className="builder-slot" key={slot}>
                <div className="builder-slot-head">
                  <h3>{slot === "top" ? "Top" : slot[0].toUpperCase() + slot.slice(1)}</h3>
                  {selected ? (
                    <span className="stock-note is-in">
                      {selected.name} · {formatMoney(selected.price, region)}
                    </span>
                  ) : (
                    <span className="stock-note is-out">Empty</span>
                  )}
                </div>
                <div className="builder-options">
                  {pool.map((product) => {
                    const variant =
                      product.variants.find((entry) => entry.sizes.some((size) => size.stock > 0)) ??
                      product.variants[0];
                    const available = variant.sizes.some((size) => size.stock > 0);
                    return (
                      <button
                        key={product.slug}
                        type="button"
                        className={`builder-option ${slots[slot] === product.slug ? "is-active" : ""}`}
                        onClick={() => setSlots((current) => ({ ...current, [slot]: current[slot] === product.slug ? null : product.slug }))}
                        aria-pressed={slots[slot] === product.slug}
                      >
                        <img src={variant.images[0]} alt="" loading="lazy" />
                        <span>
                          <strong>{product.name}</strong>
                          <em>{available ? formatMoney(product.price, region) : "Sold out"}</em>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
          <div className="builder-foot">
            <div>
              <p className="builder-total-label">Outfit total</p>
              <p className="builder-total">{formatMoney(total, region)}</p>
            </div>
            <button
              type="button"
              className="button button-dark"
              onClick={() => {
                let added = 0;
                Object.values(slots).forEach((slug) => {
                  if (!slug) return;
                  const product = PRODUCTS.find((entry) => entry.slug === slug);
                  if (!product) return;
                  const variant =
                    product.variants.find((entry) => entry.sizes.some((size) => size.stock > 0)) ??
                    product.variants[0];
                  const size = variant.sizes.find((entry) => entry.stock > 0);
                  if (
                    size &&
                    addToCart({ slug, variantId: variant.id, size: size.size, silent: true }).ok
                  )
                    added += 1;
                });
                if (added) setOpen(false);
              }}
            >
              Add {Object.values(slots).filter(Boolean).length} pieces <Icon.ArrowRight />
            </button>
          </div>
          <div className="builder-cards">
            {Object.values(slots)
              .filter(Boolean)
              .map((slug) => PRODUCTS.find((product) => product.slug === slug))
              .filter((product): product is NonNullable<typeof product> => Boolean(product))
              .map((product, index) => (
                <ProductCard key={product.slug} product={product} index={index} listId="outfit-builder" compact />
              ))}
          </div>
        </div>
      </Modal>
    </>
  );
}
