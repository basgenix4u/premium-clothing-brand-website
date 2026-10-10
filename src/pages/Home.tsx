import { useEffect, useState } from "react";
import {
  ARTICLES,
  CATEGORIES,
  IMAGES,
  LOOKS,
  POLICIES,
  PRODUCTS,
  STYLES,
} from "../data/catalog";
import { formatMoney, isProductAvailable, sortProducts } from "../lib/commerce";
import { navigate, track, useStore } from "../lib/store";
import { ProductGrid } from "../components/ProductCard";
import { Icon, LinkButton, Reveal, Stars, ratingSummary } from "../components/ui";
import { OutfitBuilder, ShopTheLook } from "./Discover";

const FAQS = [
  {
    question: "How do I know which size to take?",
    answer:
      "Every product page states the fit, the model's height and the size they wear, and links to a full size guide with body measurements in US, UK, EU and JP units. Still unsure? Write to the studio and we will help you choose before you order.",
  },
  {
    question: "Where does Vellum ship, and what does it cost?",
    answer:
      "We currently show delivery to the US, UK, EU, Japan, Canada and Australia, with per-region speeds and prices in the region selector at the top of the page. Duties and taxes are shown transparently before you check out.",
  },
  {
    question: "How do returns and exchanges work?",
    answer: POLICIES.returns + " " + POLICIES.exchanges,
  },
  { question: "How does the Vellum Circle credit work?", answer: "Circle members receive credit to spend on any piece, first access to limited runs, and free shipping. Membership billing is handled by our checkout provider, so joining goes live once payments are connected." },
  { question: "Will you restock sold-out pieces?", answer: "We produce in considered runs. Save a sold-out piece to your wishlist and switch on back-in-stock alerts — you will be first to know when it returns." },
];

export function HomePage() {
  const { region, recentlyViewed, reviews, setCartOpen, cart } = useStore();
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [formState, setFormState] = useState<{ status: "idle" | "ok" | "error"; message: string }>({
    status: "idle",
    message: "",
  });

  useEffect(() => {
    document.title = "Vellum — Wear your next chapter";
  }, []);

  const newArrivals = sortProducts(PRODUCTS, "newest").slice(0, 6);
  const mostReached = sortProducts(PRODUCTS, "popularity").slice(0, 4);
  const availableNow = PRODUCTS.filter(isProductAvailable);
  const recent = recentlyViewed
    .map((slug) => PRODUCTS.find((product) => product.slug === slug))
    .filter((product): product is NonNullable<typeof product> => Boolean(product))
    .slice(0, 4);
  const reviewed = PRODUCTS.map((product) => ({ product, ...ratingSummary(reviews.filter((review) => review.slug === product.slug)) }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  const totalReviews = reviews.length;

  const joinList = (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setFormState({ status: "error", message: "Please enter a valid email address." });
      return;
    }
    if (!consent) {
      setFormState({ status: "error", message: "Please confirm you are happy to hear from us." });
      return;
    }
    track({ name: "view_promotion", promo: "newsletter-signup" });
    setFormState({
      status: "ok",
      message: "You are on the list. Check your inbox for a note from the studio.",
    });
    setEmail("");
    setConsent(false);
  };

  return (
    <>
      <section className="hero" id="top" aria-labelledby="hero-title">
        <img className="hero-image" src={IMAGES.hero} alt="Model in a sculptural crimson Vellum look at night" />
        <div className="hero-scrim" />
        <div className="hero-content">
          <p className="hero-kicker entrance entrance-1">FALL / WINTER — NOW LIVE</p>
          <p className="hero-brand entrance entrance-2" aria-hidden="true">
            VELLUM<span>.</span>
          </p>
          <h1 id="hero-title" className="entrance entrance-3">
            Wear your
            <br />
            <em>next chapter.</em>
          </h1>
          <p className="hero-copy entrance entrance-4">
            Outerwear, tailoring, knitwear and denim — built as one wardrobe, so every piece works with the last.
          </p>
          <div className="hero-cta entrance entrance-5">
            <LinkButton to="/shop" variant="light">
              Shop the collection <Icon.ArrowRight />
            </LinkButton>
            <button type="button" className="text-link light-link" onClick={() => navigate("/lookbook")}>
              See the lookbook <span>01</span>
            </button>
          </div>
          {availableNow.length ? (
            <p className="hero-meta entrance entrance-5">
              {availableNow.length} pieces available now · Free 30-day returns
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="scroll-cue entrance entrance-5"
          onClick={() =>
            document.getElementById("shop-by-style")?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
        >
          <span>Scroll to explore</span>
          <i />
        </button>
      </section>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          <span>MADE FOR NOW</span><b>*</b><span>EVERY STYLE, ONE WARDROBE</span><b>*</b><span>DESIGNED IN NEW YORK</span><b>*</b>
          <span>MADE FOR NOW</span><b>*</b><span>EVERY STYLE, ONE WARDROBE</span><b>*</b><span>DESIGNED IN NEW YORK</span><b>*</b>
        </div>
      </div>

      <section className="section-pad style-nav" id="shop-by-style" aria-labelledby="styles-title">
        <div className="section-heading reveal">
          <div>
            <p className="section-eyebrow">Shop by style</p>
            <h2 className="section-title" id="styles-title">
              Six ways to wear Vellum.
            </h2>
          </div>
          <LinkButton to="/quiz" variant="ghost">
            Not sure? Take the quiz <Icon.ArrowRight />
          </LinkButton>
        </div>
        <div className="style-grid">
          {STYLES.map((style, index) => {
            const count = PRODUCTS.filter((product) => product.styles.includes(style.id)).length;
            return (
              <Reveal as="article" className="style-card" key={style.id} delay={index * 60}>
                <button type="button" onClick={() => navigate(`/shop?style=${style.id}`)}>
                  <h3>{style.name}</h3>
                  <p>{style.blurb}</p>
                  <span className="style-count">
                    {count} piece{count === 1 ? "" : "s"} <Icon.ArrowUpRight />
                  </span>
                </button>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="section-pad category-nav" aria-labelledby="categories-title">
        <div className="section-heading reveal">
          <div>
            <p className="section-eyebrow">Shop by category</p>
            <h2 className="section-title" id="categories-title">
              Start where you like.
            </h2>
          </div>
          <LinkButton to="/shop" variant="ghost">
            Browse everything <Icon.ArrowUpRight />
          </LinkButton>
        </div>
        <div className="category-grid">
          {CATEGORIES.map((category, index) => {
            const count = PRODUCTS.filter((product) => product.category === category.id).length;
            return (
              <Reveal as="article" className="category-card" key={category.id} delay={index * 55}>
                <button type="button" onClick={() => navigate(`/shop?category=${category.id}`)}>
                  <img src={category.image} alt="" loading="lazy" />
                  <span className="category-copy">
                    <strong>{category.name}</strong>
                    <em>
                      {category.blurb} · {count} piece{count === 1 ? "" : "s"}
                    </em>
                  </span>
                </button>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="collection section-pad" id="new-arrivals" aria-labelledby="collection-title">
        <div className="section-heading reveal">
          <div>
            <p className="section-eyebrow">New this season</p>
            <h2 className="section-title" id="collection-title">
              Pieces with a point of view.
            </h2>
          </div>
          <LinkButton to="/shop?edit=new" variant="ghost">
            Shop all arrivals <Icon.ArrowUpRight />
          </LinkButton>
        </div>
        <ProductGrid products={newArrivals} listId="home-new-arrivals" />
      </section>

      <section className="look-section section-pad" aria-labelledby="look-title">
        <div className="section-heading reveal">
          <div>
            <p className="section-eyebrow">Shop the look</p>
            <h2 className="section-title" id="look-title">
              Four looks, head to toe.
            </h2>
          </div>
          <LinkButton to="/lookbook" variant="ghost">
            All looks <Icon.ArrowUpRight />
          </LinkButton>
        </div>
        <ShopTheLook look={LOOKS[0]} />
      </section>

      <section className="manifesto" id="our-world" aria-labelledby="manifesto-title">
        <div className="manifesto-image-wrap reveal">
          <img src={IMAGES.manifesto} alt="Vellum models in an all-white editorial studio" loading="lazy" />
        </div>
        <div className="manifesto-content section-pad reveal reveal-delay-1">
          <p className="section-eyebrow">A wardrobe that moves with you</p>
          <h2 id="manifesto-title">
            No uniforms. No rules.
            <br />
            Just <em>you, amplified.</em>
          </h2>
          <p>
            Vellum is built as one system: a coat that closes over a knit that tucks into a trouser that works with the
            shoe you already own. Six styles, one wardrobe, no orphan pieces.
          </p>
          <div className="manifesto-actions">
            <OutfitBuilder />
            <button type="button" className="text-link" onClick={() => navigate("/quiz")}>
              Discover your style <Icon.ArrowRight />
            </button>
          </div>
        </div>
      </section>

      <section className="values section-pad" id="women" aria-labelledby="values-title">
        <div className="values-intro reveal">
          <p className="section-eyebrow">The Vellum standard</p>
          <h2 id="values-title">
            Less compromise.
            <br />
            <em>More character.</em>
          </h2>
        </div>
        <div className="value-list">
          {[
            { title: "Shape-shifting design", copy: "Unexpected proportions, clean architecture, and room to make every look distinctly yours." },
            { title: "Materials that matter", copy: "Responsible fibres, considered weight, and finishes chosen to get better with every wear." },
            { title: "Sizing you can trust", copy: "Fit notes, model measurements and a four-region size guide on every single product page." },
            { title: "Honest availability", copy: "Stock counts are per size and per colour. If it is sold out, we say so — and offer an alert." },
          ].map((value, index) => (
            <Reveal as="article" className="value" key={value.title} delay={index * 70}>
              <span>0{index + 1}</span>
              <div>
                <h3>{value.title}</h3>
                <p>{value.copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="editorial" id="men" aria-labelledby="editorial-title">
        <div className="editorial-media reveal">
          <img src={IMAGES.essentials} alt="Models wearing elevated cream Vellum essentials" loading="lazy" />
          <p className="vertical-caption">THE DAILY UNIFORM, REWORKED</p>
        </div>
        <div className="editorial-copy reveal reveal-delay-1">
          <p className="section-eyebrow">Beyond the basics</p>
          <h2 id="editorial-title">
            The pieces that make getting dressed feel like <em>self-expression.</em>
          </h2>
          <p>Softness you feel. Structure you see. An everyday foundation with nothing ordinary about it.</p>
          <div className="editorial-actions">
            <LinkButton to="/shop?category=essentials" variant="dark">
              Shop essentials <Icon.ArrowRight />
            </LinkButton>
            <LinkButton to="/journal" variant="ghost">
              Read the Journal <Icon.ArrowRight />
            </LinkButton>
          </div>
          <div className="editorial-bestsellers">
            <p className="mega-heading">Most reached for this week</p>
            <ul>
              {mostReached.map((product) => (
                <li key={product.slug}>
                  <button type="button" onClick={() => navigate(`/product/${product.slug}`)}>
                    <img src={product.variants[0].images[0]} alt="" loading="lazy" />
                    <span>
                      <strong>{product.name}</strong>
                      <em>{formatMoney(product.price, region)}</em>
                    </span>
                    <Icon.ArrowUpRight />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section-pad service-section" aria-labelledby="service-title">
        <div className="section-heading reveal">
          <div>
            <p className="section-eyebrow">Service</p>
            <h2 className="section-title" id="service-title">
              The unglamorous part, done properly.
            </h2>
          </div>
        </div>
        <div className="service-grid">
          {[
            { icon: <Icon.Return />, title: "30-day returns", copy: POLICIES.returns },
            { icon: <Icon.Truck />, title: `Shipping to ${region.label}`, copy: `${POLICIES.shipping} ${region.taxNote}` },
            { icon: <Icon.Ruler />, title: "Four-region sizing", copy: "US, UK, EU and JP measurements on every product page, plus fit notes from the studio." },
            { icon: <Icon.Leaf />, title: "Materials listed in full", copy: "Every product page states composition and care, fibre by fibre, with no vague claims." },
          ].map((item, index) => (
            <Reveal as="article" className="service-card" key={item.title} delay={index * 60}>
              {item.icon}
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section-pad reviews-home" aria-labelledby="reviews-title">
        <div className="section-heading reveal">
          <div>
            <p className="section-eyebrow">Reviews</p>
            <h2 className="section-title" id="reviews-title">
              What people say after wearing it.
            </h2>
          </div>
          <LinkButton to="/shop" variant="ghost">
            Write the first one <Icon.ArrowUpRight />
          </LinkButton>
        </div>
        {totalReviews === 0 ? (
          <div className="reviews-empty-home reveal">
            <p>
              No reviews have been written yet, so we will not show you any. Buy something, wear it, and come back to
              tell us honestly how it went — the first review of every piece helps the next person choose.
            </p>
            <div className="reviews-empty-actions">
              <LinkButton to="/shop" variant="dark">
                Browse the collection <Icon.ArrowRight />
              </LinkButton>
              <LinkButton to="/journal" variant="ghost">
                Read styling notes instead <Icon.ArrowRight />
              </LinkButton>
            </div>
          </div>
        ) : (
          <div className="home-review-grid">
            {reviewed.map((entry, index) => (
              <Reveal as="article" className="home-review" key={entry.product.slug} delay={index * 70}>
                <button type="button" onClick={() => navigate(`/product/${entry.product.slug}`)}>
                  <img src={entry.product.variants[0].images[0]} alt="" loading="lazy" />
                  <span>
                    <strong>{entry.product.name}</strong>
                    <Stars value={entry.average} />
                    <em>
                      {entry.average.toFixed(1)} from {entry.count} review{entry.count === 1 ? "" : "s"}
                    </em>
                  </span>
                  <Icon.ArrowUpRight />
                </button>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {recent.length ? (
        <section className="section-pad recent-home" aria-labelledby="recent-title">
          <div className="section-heading reveal">
            <div>
              <p className="section-eyebrow">Recently viewed</p>
              <h2 className="section-title" id="recent-title">
                Pick up where you left off.
              </h2>
            </div>
          </div>
          <ProductGrid products={recent} listId="home-recent" />
        </section>
      ) : null}

      <section className="journal-teaser" aria-labelledby="journal-title">
        <div className="section-pad journal-teaser-head reveal">
          <div>
            <p className="section-eyebrow">The Journal</p>
            <h2 className="section-title" id="journal-title">
              Styling notes, not adverts.
            </h2>
          </div>
          <LinkButton to="/journal" variant="ghost">
            All stories <Icon.ArrowUpRight />
          </LinkButton>
        </div>
        <div className="journal-list section-pad">
          {ARTICLES.map((article, index) => (
            <Reveal as="article" className="journal-card" key={article.slug} delay={index * 80}>
              <button type="button" className="journal-media" onClick={() => navigate(`/journal/${article.slug}`)}>
                <img src={article.image} alt="" loading="lazy" />
              </button>
              <div className="journal-copy">
                <p className="section-eyebrow">
                  {article.kicker} · {article.readTime}
                </p>
                <h3>{article.title}</h3>
                <p>{article.excerpt}</p>
                <button type="button" className="text-link" onClick={() => navigate(`/journal/${article.slug}`)}>
                  Read the piece <Icon.ArrowRight />
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="circle" id="circle" aria-labelledby="circle-title">
        <div className="circle-glow" />
        <div className="circle-inner reveal">
          <p className="section-eyebrow">Vellum Circle</p>
          <h2 id="circle-title">
            A closer way
            <br />
            to wear <em>Vellum.</em>
          </h2>
          <p className="circle-description">
            Credit to spend on anything, first call on limited runs, and free shipping on every order. Cancel whenever
            you like.
          </p>
          <div className="membership-options">
            {[
              { label: "Monthly", price: "$25", unit: "/ month", note: "Skip any month" },
              { label: "Annual", price: "$240", unit: "/ year", note: "Two months free", featured: true },
            ].map((option) => (
              <div className={`membership-card ${option.featured ? "is-featured" : ""}`} key={option.label}>
                <span className="membership-label">{option.label}</span>
                <strong>
                  {option.price} <small>{option.unit}</small>
                </strong>
                <em>{option.note}</em>
                <button
                  type="button"
                  className="button button-light"
                  onClick={() => {
                    track({ name: "view_promotion", promo: `circle-${option.label.toLowerCase()}` });
                    document.getElementById("newsletter")?.scrollIntoView({ behavior: "smooth", block: "center" });
                    window.setTimeout(() => {
                      const input = document.getElementById("email") as HTMLInputElement | null;
                      input?.focus({ preventScroll: true });
                    }, 620);
                  }}
                >
                  Choose {option.label} <Icon.ArrowRight />
                </button>
              </div>
            ))}
          </div>
          <ul className="circle-benefits">
            <li>
              <Icon.Check /> $25 monthly credit toward anything
            </li>
            <li>
              <Icon.Check /> First access to limited releases
            </li>
            <li>
              <Icon.Check /> Complimentary shipping
            </li>
          </ul>
          <p className="circle-note">
            Membership billing runs through our checkout provider, so joining goes live once payments are connected. In
            the meantime, everything in the shop is open to everyone.
          </p>
        </div>
      </section>

      <section className="faq section-pad" id="faq" aria-labelledby="faq-title">
        <div className="faq-intro reveal">
          <p className="section-eyebrow">Know before you go</p>
          <h2 id="faq-title">
            The details,
            <br />
            <em>considered.</em>
          </h2>
        </div>
        <div className="faq-list reveal reveal-delay-1">
          {FAQS.map((faq, index) => {
            const open = activeFaq === index;
            return (
              <div className="faq-item" key={faq.question}>
                <button type="button" aria-expanded={open} onClick={() => setActiveFaq(open ? null : index)}>
                  <span>{faq.question}</span>
                  <Icon.Plus open={open} />
                </button>
                <div className={`faq-answer ${open ? "show" : ""}`}>
                  <p>{faq.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="newsletter" id="newsletter" aria-labelledby="newsletter-title">
        <div className="newsletter-image" role="img" aria-label="Vellum editorial in deep green" />
        <div className="newsletter-content reveal">
          <p className="section-eyebrow">The next chapter starts here</p>
          <h2 id="newsletter-title">
            Get dressed for what is <em>next.</em>
          </h2>
          <p>
            New collections, styling notes and the pieces we think you will actually wear. No more than twice a month.
          </p>
          <form onSubmit={joinList} noValidate>
            <label className="sr-only" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={formState.status === "error"}
              aria-describedby="newsletter-status"
            />
            <button className="button button-light" type="submit" disabled={formState.status === "ok"}>
              {formState.status === "ok" ? "You are in" : "Join the list"} <Icon.ArrowRight />
            </button>
          </form>
          <label className="consent">
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
            <span>Email me new arrivals and styling notes. Unsubscribe in one click, any time.</span>
          </label>
          <p id="newsletter-status" role="status" aria-live="polite" className={`form-status ${formState.status}`}>
            {formState.message}
          </p>
          {cart.length ? (
            <p className="newsletter-cart">
              You have {cart.length} item{cart.length === 1 ? "" : "s"} saved in your bag.{" "}
              <button type="button" className="text-link" onClick={() => setCartOpen(true)}>
                Open your bag
              </button>
            </p>
          ) : null}
        </div>
      </section>
    </>
  );
}
