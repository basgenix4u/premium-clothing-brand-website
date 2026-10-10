import {
  COLOURS,
  PRODUCTS,
  PROMO_RULES,
  REGIONS,
  type CategoryId,
  type Product,
  type PromoRule,
  type Region,
  type StyleId,
  type Variant,
} from "../data/catalog";

/* ------------------------------------------------------------------ helpers */

export const formatMoney = (amountUsd: number, region: Region) => {
  const value = amountUsd * region.rate;
  return new Intl.NumberFormat(region.locale, {
    style: "currency",
    currency: region.currency,
    maximumFractionDigits: region.currency === "JPY" ? 0 : value % 1 === 0 ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(value);
};

export const variantTotalStock = (variant: Variant) =>
  variant.sizes.reduce((total, size) => total + size.stock, 0);

export const productTotalStock = (product: Product) =>
  product.variants.reduce((total, variant) => total + variantTotalStock(variant), 0);

export const isProductAvailable = (product: Product) => productTotalStock(product) > 0;

export const availableSizesFor = (variant: Variant) => variant.sizes.filter((size) => size.stock > 0);

export const colourOf = (variant: Variant) => COLOURS[variant.colour];

export const badgeLabel: Record<string, string> = {
  new: "New",
  bestseller: "Most reached for",
  limited: "Limited run",
};

/** Weeks since release — used by "newest" sorting and the New filter. */
export const daysSinceRelease = (product: Product) =>
  Math.max(0, Math.round((Date.now() - new Date(product.releasedAt).getTime()) / 86_400_000));

/* ------------------------------------------------------------------- search */

/** Lightweight subsequence match — tolerant of missing letters and word order. */
const subsequence = (needle: string, haystack: string) => {
  let i = 0;
  for (let j = 0; j < haystack.length && i < needle.length; j += 1) {
    if (haystack[j] === needle[i]) i += 1;
  }
  return i === needle.length;
};

const normalise = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const productHaystack = (product: Product) =>
  normalise(
    [
      product.name,
      product.subtitle,
      product.category,
      product.description,
      ...product.styles,
      ...product.audience,
      ...product.details,
      product.composition,
      ...product.variants.map((variant) => COLOURS[variant.colour].name),
    ].join(" "),
  );

export type SearchMatch = { product: Product; score: number };

export const searchProducts = (query: string): SearchMatch[] => {
  const terms = normalise(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];

  return PRODUCTS.map((product) => {
    const haystack = productHaystack(product);
    const name = normalise(`${product.name} ${product.subtitle}`);
    let score = 0;

    for (const term of terms) {
      if (name.startsWith(term)) score += 14;
      else if (name.includes(term)) score += 11;
      else if (haystack.includes(term)) score += 6;
      else if (term.length >= 4 && subsequence(term, name)) score += 3;
      else return { product, score: 0 };
    }

    score += product.popularity / 40;
    if (isProductAvailable(product)) score += 1.5;
    return { product, score };
  })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score);
};

export const searchSuggestions = (query: string) => {
  const matches = searchProducts(query);
  const products = matches.slice(0, 5).map((match) => match.product);
  const terms = normalise(query).split(/\s+/).filter(Boolean);
  const categories = PRODUCTS.filter((product) =>
    terms.some((term) => normalise(product.category).includes(term)),
  )
    .map((product) => product.category)
    .filter((category, index, list) => list.indexOf(category) === index)
    .slice(0, 3);
  return { products, categories: categories as CategoryId[], total: matches.length };
};

/* ------------------------------------------------------------------ filters */

export type Filters = {
  categories: CategoryId[];
  styles: StyleId[];
  colours: string[];
  sizes: string[];
  audience: string[];
  priceMin: number;
  priceMax: number;
  inStockOnly: boolean;
  newOnly: boolean;
};

export const PRICE_BOUNDS = {
  min: Math.min(...PRODUCTS.map((product) => product.price)),
  max: Math.max(...PRODUCTS.map((product) => product.price)),
};

export const emptyFilters = (): Filters => ({
  categories: [],
  styles: [],
  colours: [],
  sizes: [],
  audience: [],
  priceMin: PRICE_BOUNDS.min,
  priceMax: PRICE_BOUNDS.max,
  inStockOnly: false,
  newOnly: false,
});

export const countActiveFilters = (filters: Filters) =>
  filters.categories.length +
  filters.styles.length +
  filters.colours.length +
  filters.sizes.length +
  filters.audience.length +
  (filters.inStockOnly ? 1 : 0) +
  (filters.newOnly ? 1 : 0) +
  (filters.priceMin !== PRICE_BOUNDS.min || filters.priceMax !== PRICE_BOUNDS.max ? 1 : 0);

export const filterProducts = (products: Product[], filters: Filters) =>
  products.filter((product) => {
    if (filters.categories.length && !filters.categories.includes(product.category)) return false;
    if (filters.styles.length && !product.styles.some((style) => filters.styles.includes(style))) return false;
    if (filters.audience.length && !product.audience.some((audience) => filters.audience.includes(audience)))
      return false;
    if (filters.colours.length && !product.variants.some((variant) => filters.colours.includes(variant.colour)))
      return false;
    if (
      filters.sizes.length &&
      !product.variants.some((variant) => variant.sizes.some((size) => filters.sizes.includes(size.size) && size.stock > 0))
    )
      return false;
    if (product.price < filters.priceMin || product.price > filters.priceMax) return false;
    if (filters.inStockOnly && !isProductAvailable(product)) return false;
    if (filters.newOnly && daysSinceRelease(product) > 60) return false;
    return true;
  });

export type SortKey = "featured" | "newest" | "price-asc" | "price-desc" | "popularity";

export const SORT_LABELS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "newest", label: "Newest arrivals" },
  { key: "popularity", label: "Most reached for" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
];

export const sortProducts = (products: Product[], sort: SortKey) => {
  const list = [...products];
  switch (sort) {
    case "newest":
      return list.sort((a, b) => +new Date(b.releasedAt) - +new Date(a.releasedAt));
    case "price-asc":
      return list.sort((a, b) => a.price - b.price);
    case "price-desc":
      return list.sort((a, b) => b.price - a.price);
    case "popularity":
      return list.sort((a, b) => b.popularity - a.popularity);
    default:
      return list.sort(
        (a, b) =>
          Number(isProductAvailable(b)) - Number(isProductAvailable(a)) ||
          b.popularity - a.popularity,
      );
  }
};

/* ---------------------------------------------------------- recommendations */

const styleOverlap = (a: Product, b: Product) => a.styles.filter((style) => b.styles.includes(style)).length;

/** Content-based recommendations: same category, shared style, shared colour family. */
export const relatedProducts = (product: Product, limit = 4) =>
  PRODUCTS.filter((candidate) => candidate.slug !== product.slug)
    .map((candidate) => {
      let score = styleOverlap(product, candidate) * 2;
      if (candidate.category === product.category) score += 2.5;
      if (candidate.audience.some((audience) => product.audience.includes(audience))) score += 1;
      if (
        candidate.variants.some((variant) =>
          product.variants.some((own) => own.colour === variant.colour),
        )
      )
        score += 0.5;
      score += candidate.popularity / 60;
      return { candidate, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.candidate);

/** Cross-category "complete the look" — deliberately avoids the product's own category. */
export const completeTheLook = (product: Product, limit = 4) =>
  PRODUCTS.filter((candidate) => candidate.slug !== product.slug && candidate.category !== product.category)
    .map((candidate) => {
      let score = styleOverlap(product, candidate) * 2 + candidate.popularity / 50;
      if (product.audience.some((audience) => candidate.audience.includes(audience))) score += 1.5;
      return { candidate, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.candidate);

/** Complements for an in-progress bag: fills categories the shopper hasn't touched. */
export const cartComplements = (slugs: string[], limit = 3) => {
  const inBag = slugs.map((slug) => PRODUCTS.find((product) => product.slug === slug)).filter(Boolean) as Product[];
  const ownedCategories = new Set(inBag.map((product) => product.category));
  const ownedStyles = new Set(inBag.flatMap((product) => product.styles));
  return PRODUCTS.filter((product) => !slugs.includes(product.slug) && isProductAvailable(product))
    .map((product) => {
      let score = product.popularity / 50;
      if (!ownedCategories.has(product.category)) score += 3;
      if (product.styles.some((style) => ownedStyles.has(style))) score += 2;
      if (inBag.some((bag) => bag.audience.some((audience) => product.audience.includes(audience)))) score += 1;
      return { product, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.product);
};

export const recommendForStyles = (styles: StyleId[], limit = 6) =>
  PRODUCTS.filter((product) => product.styles.some((style) => styles.includes(style)))
    .sort((a, b) => {
      const aScore = a.styles.filter((style) => styles.includes(style)).length * 10 + a.popularity / 20;
      const bScore = b.styles.filter((style) => styles.includes(style)).length * 10 + b.popularity / 20;
      return bScore - aScore;
    })
    .slice(0, limit);

export const lookProducts = (slugs: string[]) =>
  slugs
    .map((slug) => PRODUCTS.find((product) => product.slug === slug))
    .filter((product): product is Product => Boolean(product));

/* --------------------------------------------------------------- cart math */

export type CartTotals = {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  freeShippingRemaining: number;
};

export const DEFAULT_REGION = REGIONS[0];

export const regionByCode = (code: string) => REGIONS.find((region) => region.code === code) ?? DEFAULT_REGION;

export const applyPromo = (subtotal: number, shipping: number, rule: PromoRule | null): CartTotals => {
  let discount = 0;
  let adjustedShipping = shipping;
  if (rule && subtotal >= rule.minSubtotal) {
    if (rule.kind === "percent") discount = (subtotal * rule.value) / 100;
    if (rule.kind === "fixed") discount = Math.min(rule.value, subtotal);
    if (rule.kind === "shipping") adjustedShipping = 0;
  }
  const total = Math.max(0, subtotal - discount + adjustedShipping);
  return {
    subtotal,
    discount: Math.round(discount * 100) / 100,
    shipping: adjustedShipping,
    total,
    freeShippingRemaining: 0,
  };
};

export const findPromo = (code: string) => {
  const normalised = code.trim().toUpperCase();
  if (!normalised) return null;
  return PROMO_RULES.find((rule) => rule.code === normalised) ?? null;
};
