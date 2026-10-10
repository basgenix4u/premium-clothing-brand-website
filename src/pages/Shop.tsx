import { useEffect, useMemo, useState } from "react";
import {
  CATEGORIES,
  COLOURS,
  PRODUCTS,
  STYLES,
  type CategoryId,
  type StyleId,
} from "../data/catalog";
import {
  SORT_LABELS,
  countActiveFilters,
  emptyFilters,
  filterProducts,
  isProductAvailable,
  sortProducts,
  type Filters,
  type SortKey,
} from "../lib/commerce";
import { navigate, track, useStore } from "../lib/store";
import { ProductCard, ProductGrid } from "../components/ProductCard";
import { Drawer, EmptyState, Icon, ProductSkeletonGrid } from "../components/ui";

const AUDIENCES = ["women", "men", "unisex"] as const;
const ALL_SIZES = ["XS", "S", "M", "L", "XL", "One size"];

const param = (query: string, key: string) => new URLSearchParams(query).get(key);

export function ShopPage({ query }: { query: string }) {
  const { recentlyViewed } = useStore();
  const [filters, setFilters] = useState<Filters>(() => emptyFilters());
  const [sort, setSort] = useState<SortKey>("featured");
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const searchQuery = param(query, "q") ?? "";
  const editParam = param(query, "edit");

  /* Hydrate filters from the URL — deep links from nav, search and looks. */
  useEffect(() => {
    const next = emptyFilters();
    const category = param(query, "category");
    const style = param(query, "style");
    const audience = param(query, "audience");
    if (category && CATEGORIES.some((entry) => entry.id === category))
      next.categories = [category as CategoryId];
    if (style && STYLES.some((entry) => entry.id === style)) next.styles = [style as StyleId];
    if (audience) next.audience = [audience];
    if (editParam === "new") next.newOnly = true;
    if (editParam === "available") next.inStockOnly = true;
    setFilters(next);
    setSort(editParam === "bestsellers" ? "popularity" : editParam === "new" ? "newest" : "featured");
    setLoading(true);
    const timer = window.setTimeout(() => setLoading(false), 260);
    return () => window.clearTimeout(timer);
  }, [editParam, query]);

  const base = useMemo(() => {
    if (!searchQuery.trim()) return PRODUCTS;
    const term = searchQuery.trim().toLowerCase();
    return PRODUCTS.filter((product) =>
      [product.name, product.subtitle, product.description, product.category, ...product.styles, ...product.variants.map((variant) => COLOURS[variant.colour].name)]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [searchQuery]);

  const results = useMemo(() => sortProducts(filterProducts(base, filters), sort), [base, filters, sort]);

  useEffect(() => {
    track({ name: "view_item_list", listId: searchQuery ? "search" : "shop", itemCount: results.length });
  }, [results.length, searchQuery]);

  const toggle = <K extends "categories" | "styles" | "colours" | "sizes" | "audience">(key: K, value: string) => {
    setFilters((current) => {
      const list = current[key] as string[];
      const nextList = list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
      return { ...current, [key]: nextList } as Filters;
    });
  };

  const activeCount = countActiveFilters(filters);
  const heading = searchQuery
    ? `Results for “${searchQuery}”`
    : filters.categories.length === 1
      ? CATEGORIES.find((category) => category.id === filters.categories[0])!.name
      : filters.styles.length === 1
        ? `${STYLES.find((style) => style.id === filters.styles[0])!.name} edit`
        : "The collection";

  const recentProducts = recentlyViewed
    .map((slug) => PRODUCTS.find((product) => product.slug === slug))
    .filter((product): product is NonNullable<typeof product> => Boolean(product))
    .slice(0, 4);

  const filterPanel = (
    <div className="filter-panel">
      <FilterGroup title="Category">
        {CATEGORIES.map((category) => (
          <Toggle
            key={category.id}
            label={category.name}
            count={PRODUCTS.filter((product) => product.category === category.id).length}
            active={filters.categories.includes(category.id)}
            onChange={() => toggle("categories", category.id)}
          />
        ))}
      </FilterGroup>
      <FilterGroup title="Style">
        <div className="mega-chips">
          {STYLES.map((style) => (
            <button
              key={style.id}
              type="button"
              className={`chip ${filters.styles.includes(style.id) ? "chip-active" : ""}`}
              onClick={() => toggle("styles", style.id)}
              aria-pressed={filters.styles.includes(style.id)}
            >
              {style.name}
            </button>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Colour">
        <div className="swatch-row swatch-wrap">
          {Object.values(COLOURS).map((colour) => (
            <button
              key={colour.id}
              type="button"
              className={`swatch ${filters.colours.includes(colour.id) ? "is-active" : ""}`}
              style={{ "--swatch": colour.hex } as React.CSSProperties}
              onClick={() => toggle("colours", colour.id)}
              aria-pressed={filters.colours.includes(colour.id)}
              aria-label={colour.name}
              title={colour.name}
            />
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Size">
        <div className="size-row">
          {ALL_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              className={`size-chip ${filters.sizes.includes(size) ? "is-active" : ""}`}
              onClick={() => toggle("sizes", size)}
              aria-pressed={filters.sizes.includes(size)}
            >
              {size === "One size" ? "OS" : size}
            </button>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Shop for">
        <div className="mega-chips">
          {AUDIENCES.map((audience) => (
            <button
              key={audience}
              type="button"
              className={`chip ${filters.audience.includes(audience) ? "chip-active" : ""}`}
              onClick={() => toggle("audience", audience)}
              aria-pressed={filters.audience.includes(audience)}
            >
              {audience === "unisex" ? "Everyone" : audience[0].toUpperCase() + audience.slice(1)}
            </button>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Price">
        <div className="price-inputs">
          <label>
            Min
            <input
              type="number"
              min={0}
              value={filters.priceMin}
              onChange={(event) =>
                setFilters((current) => ({ ...current, priceMin: Number(event.target.value) || 0 }))
              }
            />
          </label>
          <label>
            Max
            <input
              type="number"
              min={0}
              value={filters.priceMax}
              onChange={(event) =>
                setFilters((current) => ({ ...current, priceMax: Number(event.target.value) || 0 }))
              }
            />
          </label>
        </div>
      </FilterGroup>
      <FilterGroup title="Availability">
        <Toggle
          label="In stock only"
          active={filters.inStockOnly}
          onChange={() => setFilters((current) => ({ ...current, inStockOnly: !current.inStockOnly }))}
        />
        <Toggle
          label="New in the last 60 days"
          active={filters.newOnly}
          onChange={() => setFilters((current) => ({ ...current, newOnly: !current.newOnly }))}
        />
      </FilterGroup>
      <button type="button" className="ghost-button filter-clear" onClick={() => setFilters(emptyFilters())}>
        Clear all filters
      </button>
    </div>
  );

  return (
    <div className="page shop-page">
      <header className="page-head">
        <div>
          <p className="section-eyebrow">{searchQuery ? "Search" : "Shop"}</p>
          <h1 className="page-title">{heading}</h1>
          <p className="page-lede">
            {results.length} {results.length === 1 ? "piece" : "pieces"}
            {activeCount ? ` · ${activeCount} filter${activeCount === 1 ? "" : "s"} applied` : ""}
            {searchQuery ? " · sorted by relevance" : ""}
          </p>
        </div>
        <div className="page-tools">
          <button type="button" className="button button-ghost" onClick={() => setFiltersOpen(true)}>
            <Icon.Filter /> Filters {activeCount ? `(${activeCount})` : ""}
          </button>
          <div className="sort-wrap">
            <button
              type="button"
              className="button button-ghost"
              onClick={() => setSortOpen((open) => !open)}
              aria-expanded={sortOpen}
              aria-haspopup="listbox"
            >
              {SORT_LABELS.find((entry) => entry.key === sort)?.label} <Icon.ChevronDown />
            </button>
            <div className={`sort-menu ${sortOpen ? "is-open" : ""}`} role="listbox">
              {SORT_LABELS.map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  role="option"
                  aria-selected={entry.key === sort}
                  className={`sort-option ${entry.key === sort ? "is-active" : ""}`}
                  onClick={() => {
                    setSort(entry.key);
                    setSortOpen(false);
                  }}
                >
                  {entry.label}
                  {entry.key === sort ? <Icon.Check /> : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {searchQuery ? (
        <p className="search-refine">
          Refine within these results, or{" "}
          <button type="button" className="text-link" onClick={() => navigate("/shop")}>
            browse the full collection
          </button>
          .
        </p>
      ) : null}

      <div className="shop-layout">
        <aside className="shop-aside" aria-label="Product filters">
          {filterPanel}
        </aside>

        <div className="shop-results">
          {activeCount ? (
            <div className="active-chips">
              {filters.categories.map((category) => (
                <Chip key={category} label={CATEGORIES.find((entry) => entry.id === category)!.name} onRemove={() => toggle("categories", category)} />
              ))}
              {filters.styles.map((style) => (
                <Chip key={style} label={STYLES.find((entry) => entry.id === style)!.name} onRemove={() => toggle("styles", style)} />
              ))}
              {filters.colours.map((colour) => (
                <Chip key={colour} label={COLOURS[colour as keyof typeof COLOURS].name} onRemove={() => toggle("colours", colour)} />
              ))}
              {filters.sizes.map((size) => (
                <Chip key={size} label={`Size ${size}`} onRemove={() => toggle("sizes", size)} />
              ))}
              {filters.audience.map((audience) => (
                <Chip key={audience} label={audience} onRemove={() => toggle("audience", audience)} />
              ))}
              {filters.inStockOnly ? (
                <Chip label="In stock" onRemove={() => setFilters((current) => ({ ...current, inStockOnly: false }))} />
              ) : null}
              {filters.newOnly ? (
                <Chip label="New" onRemove={() => setFilters((current) => ({ ...current, newOnly: false }))} />
              ) : null}
            </div>
          ) : null}

          {loading ? (
            <ProductSkeletonGrid count={6} />
          ) : results.length ? (
            <ProductGrid products={results} listId={searchQuery ? "search-results" : "shop"} />
          ) : (
            <div className="empty-wrap">
              <EmptyState
                title="No pieces match those filters"
                copy="Try removing a filter or two — or start again from the full collection."
                action={{ label: "Reset filters", to: "/shop" }}
              />
              <div className="empty-suggestions">
                <p className="mega-heading">Available right now</p>
                <div className="product-grid cols-3">
                  {PRODUCTS.filter(isProductAvailable)
                    .slice(0, 3)
                    .map((product, index) => (
                      <ProductCard key={product.slug} product={product} index={index} listId="shop-fallback" compact />
                    ))}
                </div>
              </div>
            </div>
          )}

          {recentProducts.length && !loading ? (
            <section className="recent-section">
              <h2 className="section-title">Recently viewed</h2>
              <ProductGrid products={recentProducts} listId="recently-viewed" />
            </section>
          ) : null}
        </div>
      </div>

      <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters" label="Product filters" side="left">
        {filterPanel}
        <div className="filter-footer">
          <button type="button" className="button button-dark" onClick={() => setFiltersOpen(false)}>
            Show {results.length} {results.length === 1 ? "piece" : "pieces"} <Icon.ArrowRight />
          </button>
        </div>
      </Drawer>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="filter-group">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function Toggle({
  label,
  count,
  active,
  onChange,
}: {
  label: string;
  count?: number;
  active: boolean;
  onChange: () => void;
}) {
  return (
    <label className={`toggle ${active ? "is-active" : ""}`}>
      <input type="checkbox" checked={active} onChange={onChange} />
      <span className="toggle-box" aria-hidden="true">
        {active ? <Icon.Check /> : null}
      </span>
      <span className="toggle-label">{label}</span>
      {count !== undefined ? <span className="toggle-count">{count}</span> : null}
    </label>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button type="button" className="active-chip" onClick={onRemove}>
      {label} <Icon.Close />
    </button>
  );
}
