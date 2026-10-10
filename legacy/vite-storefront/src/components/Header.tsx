import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, REGIONS, STYLES, type CategoryId } from "../data/catalog";
import { formatMoney, isProductAvailable, searchSuggestions } from "../lib/commerce";
import { navigate, track, useStore } from "../lib/store";
import { Icon, useEscape, useLockBody } from "./ui";

const NAV = [
  { label: "Shop", to: "/shop", mega: true },
  { label: "Women", to: "/shop?audience=women" },
  { label: "Men", to: "/shop?audience=men" },
  { label: "Lookbook", to: "/lookbook" },
  { label: "Journal", to: "/journal" },
];

export function Header({ path }: { path: string }) {
  const { cartCount, setCartOpen, wishlistCount, setWishlistOpen, region, setRegionCode } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const overHero = path === "/" || path === "" || path.split("?")[0] === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setMegaOpen(false);
  }, [path]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && /^(input|textarea|select)$/i.test(target.tagName);
      if (event.key === "/" && !typing) {
        event.preventDefault();
        setSearchOpen(true);
      }
      if ((event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setMegaOpen(false);
        setRegionOpen(false);
      }
    };
    const onClick = (event: MouseEvent) => {
      const node = event.target as HTMLElement | null;
      if (!node?.closest(".mega-wrap")) setMegaOpen(false);
      if (!node?.closest(".region-wrap")) setRegionOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
    };
  }, []);

  const solid = scrolled || !overHero || megaOpen || menuOpen;

  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          const target = document.getElementById("main-content");
          if (target) {
            target.setAttribute("tabindex", "-1");
            target.focus({ preventScroll: false });
          }
        }}
      >
        Skip to content
      </a>
      <header className={`site-header ${solid ? "is-solid is-scrolled" : ""}`}>
        <div className="header-inner">
          <div className="header-left">
            <button
              type="button"
              className="menu-toggle"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span />
              <span />
            </button>
            <a
              className="wordmark"
              href="#/"
              onClick={(event) => {
                event.preventDefault();
                navigate("/");
              }}
              aria-label="Vellum home"
            >
              VELLUM<span className="wordmark-mark">.</span>
            </a>
          </div>

          <nav className="desktop-nav" aria-label="Primary">
            {NAV.map((item) =>
              item.mega ? (
                <div key={item.label} className="mega-wrap" onMouseLeave={() => setMegaOpen(false)}>
                  <button
                    type="button"
                    className="nav-link"
                    aria-expanded={megaOpen}
                    aria-haspopup="true"
                    onClick={() => setMegaOpen((open) => !open)}
                    onMouseEnter={() => setMegaOpen(true)}
                    onFocus={() => setMegaOpen(true)}
                  >
                    {item.label} <Icon.ChevronDown />
                  </button>
                  <div className={`mega ${megaOpen ? "is-open" : ""}`} aria-hidden={!megaOpen}>
                    <div className="mega-col mega-categories">
                      <p className="mega-heading">Shop by category</p>
                      {CATEGORIES.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          className="mega-link"
                          onClick={() => navigate(`/shop?category=${category.id}`)}
                        >
                          <span>{category.name}</span>
                          <em>{category.blurb}</em>
                        </button>
                      ))}
                    </div>
                    <div className="mega-col">
                      <p className="mega-heading">Shop by style</p>
                      <div className="mega-chips">
                        {STYLES.map((style) => (
                          <button
                            key={style.id}
                            type="button"
                            className="chip"
                            onClick={() => navigate(`/shop?style=${style.id}`)}
                          >
                            {style.name}
                          </button>
                        ))}
                      </div>
                      <p className="mega-heading mega-heading-gap">Edits</p>
                      <div className="mega-chips">
                        <button type="button" className="chip" onClick={() => navigate("/shop?edit=new")}>
                          New arrivals
                        </button>
                        <button type="button" className="chip" onClick={() => navigate("/shop?edit=bestsellers")}>
                          Most reached for
                        </button>
                        <button type="button" className="chip" onClick={() => navigate("/shop?edit=available")}>
                          In stock now
                        </button>
                      </div>
                    </div>
                    <div className="mega-feature">
                      <img
                        src={CATEGORIES[0].image}
                        alt=""
                        loading="lazy"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="mega-heading">The Fall Study</p>
                        <p className="mega-copy">
                          Coats, tailoring and knits built to carry you through the season.
                        </p>
                        <button
                          type="button"
                          className="text-link"
                          onClick={() => {
                            setMegaOpen(false);
                            navigate("/shop");
                          }}
                        >
                          Browse everything <Icon.ArrowRight />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  key={item.label}
                  type="button"
                  className="nav-link"
                  onClick={() => navigate(item.to)}
                >
                  {item.label}
                </button>
              ),
            )}
          </nav>

          <div className="nav-actions">
            <div className="region-wrap">
              <button
                type="button"
                className="nav-text-button"
                onClick={() => setRegionOpen((open) => !open)}
                aria-expanded={regionOpen}
                aria-haspopup="true"
              >
                <Icon.Globe /> {region.code} · {region.currency}
              </button>
              <div className={`region-menu ${regionOpen ? "is-open" : ""}`}>
                <p className="mega-heading">Region &amp; currency</p>
                {REGIONS.map((option) => (
                  <button
                    key={option.code}
                    type="button"
                    className={`region-option ${option.code === region.code ? "is-active" : ""}`}
                    onClick={() => {
                      setRegionCode(option.code);
                      setRegionOpen(false);
                    }}
                  >
                    <span>{option.label}</span>
                    <span className="region-meta">
                      {option.currency} · {option.sizeSystem} sizes
                    </span>
                  </button>
                ))}
                <p className="region-note">
                  Prices are converted at a fixed rate and shown for guidance. The amount you pay is set at checkout.
                </p>
              </div>
            </div>

            <button type="button" className="nav-text-button hide-small" onClick={() => setSearchOpen(true)}>
              <Icon.Search /> Search
            </button>
            <button
              type="button"
              className="nav-text-button hide-small"
              onClick={() => setWishlistOpen(true)}
              aria-label={`Wishlist, ${wishlistCount} items`}
            >
              <Icon.Heart /> {wishlistCount > 0 ? `(${wishlistCount})` : ""}
            </button>
            <button
              type="button"
              className="nav-text-button"
              onClick={() => setCartOpen(true)}
              aria-label={`Shopping bag, ${cartCount} items`}
            >
              <Icon.Bag /> {cartCount > 0 ? `(${cartCount})` : ""}
            </button>
          </div>
        </div>

        <div className={`mobile-menu ${menuOpen ? "is-open" : ""}`}>
          <div className="mobile-group">
            <p className="mega-heading">Categories</p>
            <div className="mobile-links">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(`/shop?category=${category.id}`);
                  }}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
          <div className="mobile-group">
            <p className="mega-heading">Styles</p>
            <div className="mega-chips">
              {STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  className="chip"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(`/shop?style=${style.id}`);
                  }}
                >
                  {style.name}
                </button>
              ))}
            </div>
          </div>
          <div className="mobile-group">
            <p className="mega-heading">More</p>
            <div className="mobile-links">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/lookbook");
                }}
              >
                Lookbook
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/journal");
                }}
              >
                Journal
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/quiz");
                }}
              >
                Discover your style
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setWishlistOpen(true);
                }}
              >
                Wishlist {wishlistCount ? `(${wishlistCount})` : ""}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setSearchOpen(true);
                }}
              >
                Search
              </button>
            </div>
          </div>
          <div className="mobile-region">
            <p className="mega-heading">Region</p>
            <div className="mega-chips">
              {REGIONS.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  className={`chip ${option.code === region.code ? "chip-active" : ""}`}
                  onClick={() => setRegionCode(option.code)}
                >
                  {option.code} · {option.currency}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

/* ------------------------------------------------------------------- search */

function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { region } = useStore();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  useEscape(open, onClose);
  useLockBody(open);

  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 60);
      return () => window.clearTimeout(timer);
    }
    setQuery("");
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = window.setTimeout(() => setLoading(false), 220);
    return () => window.clearTimeout(timer);
  }, [query]);

  const results = useMemo(() => (query.trim() ? searchSuggestions(query) : null), [query]);

  useEffect(() => {
    if (results && query.trim().length > 2) track({ name: "search", term: query.trim(), results: results.total });
  }, [results, query]);

  const submit = () => {
    if (!query.trim()) return;
    onClose();
    navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className={`search-root ${open ? "is-open" : ""}`} aria-hidden={!open} inert={!open ? true : undefined}>
      <div className="drawer-scrim" onClick={onClose} />
      <div className="search-panel" role="dialog" aria-modal="true" aria-label="Search Vellum">
        <div className="search-bar">
          <Icon.Search />
          <input
            ref={inputRef}
            type="search"
            value={query}
            placeholder="Search coats, tailoring, colour…"
            aria-label="Search products"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submit();
            }}
          />
          {query ? (
            <button type="button" className="ghost-button" onClick={() => setQuery("")} aria-label="Clear search">
              <Icon.Close />
            </button>
          ) : null}
          <button type="button" className="ghost-button search-close" onClick={onClose} aria-label="Close search">
            <Icon.Close />
          </button>
        </div>

        <div className="search-body">
          {results ? (
            <>
              <div className="search-heading">
                <p className="mega-heading">Products</p>
                {loading ? <span className="search-status">Searching…</span> : <span className="search-status">{results.total} match{results.total === 1 ? "" : "es"}</span>}
              </div>
              {loading ? (
                <div className="search-suggestions" aria-hidden="true">
                  {[0, 1, 2].map((index) => (
                    <div className="search-suggestion skeleton-row" key={index}>
                      <span className="skeleton skeleton-thumb" />
                      <span style={{ flex: 1 }}>
                        <span className="skeleton skeleton-line w-60" />
                        <span className="skeleton skeleton-line w-40" />
                      </span>
                    </div>
                  ))}
                </div>
              ) : results.products.length ? (
                <ul className="search-suggestions">
                  {results.products.map((product) => {
                    const colour = product.variants[0];
                    return (
                      <li key={product.slug}>
                        <button
                          type="button"
                          className="search-suggestion"
                          onClick={() => {
                            onClose();
                            navigate(`/product/${product.slug}`);
                          }}
                        >
                          <img src={colour.images[0]} alt="" loading="lazy" />
                          <span className="search-suggestion-copy">
                            <span className="search-suggestion-name">{product.name}</span>
                            <span className="search-suggestion-meta">
                              {product.subtitle} · {formatMoney(product.price, region)}
                            </span>
                            <span className={`stock-note ${isProductAvailable(product) ? "is-in" : "is-out"}`}>
                              {isProductAvailable(product) ? "In stock" : "Sold out"}
                            </span>
                          </span>
                          <Icon.ArrowUpRight />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="search-empty">
                  <p>
                    Nothing matched “{query}”. Try a colour like <em>camel</em>, a category like <em>outerwear</em>, or a
                    fabric like <em>merino</em>.
                  </p>
                  <button type="button" className="button button-dark" onClick={() => navigate("/shop")}>
                    Browse everything <Icon.ArrowRight />
                  </button>
                </div>
              )}

              {results.categories.length ? (
                <div className="search-categories">
                  <p className="mega-heading">Categories</p>
                  <div className="mega-chips">
                    {results.categories.map((category: CategoryId) => (
                      <button
                        key={category}
                        type="button"
                        className="chip"
                        onClick={() => {
                          onClose();
                          navigate(`/shop?category=${category}`);
                        }}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <p className="mega-heading">Start with</p>
              <div className="mega-chips">
                {["outerwear", "camel", "merino", "tailoring", "denim", "evening"].map((term) => (
                  <button key={term} type="button" className="chip" onClick={() => setQuery(term)}>
                    {term}
                  </button>
                ))}
              </div>
              <p className="mega-heading mega-heading-gap">Jump to</p>
              <div className="mega-chips">
                {CATEGORIES.slice(0, 6).map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    className="chip"
                    onClick={() => {
                      onClose();
                      navigate(`/shop?category=${category.id}`);
                    }}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
              <p className="search-hint">
                Press <kbd>/</kbd> to search from anywhere, or <kbd>⌘K</kbd>.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
