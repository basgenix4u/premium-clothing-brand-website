import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  PROMO_RULES,
  REGIONS,
  productBySlug,
  type PromoRule,
  type Region,
  type StyleId,
} from "../data/catalog";
import { findPromo, regionByCode } from "./commerce";

/* ------------------------------------------------------------- persistence */

const KEY = "vellum:store:v1";

type Persisted = {
  cart: CartLine[];
  wishlist: WishlistEntry[];
  recentlyViewed: string[];
  regionCode: string;
  promoCode: string | null;
  shippingId: string | null;
  reviews: Review[];
  quizResult: StyleId[] | null;
};

export type CartLine = {
  key: string;
  slug: string;
  variantId: string;
  size: string;
  qty: number;
  addedAt: number;
};

export type WishlistEntry = { slug: string; variantId: string; addedAt: number; notifyWhenBack: boolean };

export type Review = {
  id: string;
  slug: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  createdAt: number;
};

const emptyState: Persisted = {
  cart: [],
  wishlist: [],
  recentlyViewed: [],
  regionCode: REGIONS[0].code,
  promoCode: null,
  shippingId: null,
  reviews: [],
  quizResult: null,
};

const readStorage = (): Persisted => {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyState;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return {
      ...emptyState,
      ...parsed,
      // Defensive: drop anything that no longer resolves against the catalogue.
      cart: (parsed.cart ?? []).filter((line) => {
        const product = productBySlug(line.slug);
        return product?.variants.some((variant) => variant.id === line.variantId);
      }),
      wishlist: (parsed.wishlist ?? []).filter((entry) => productBySlug(entry.slug)),
      recentlyViewed: (parsed.recentlyViewed ?? []).filter((slug) => productBySlug(slug)),
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
    };
  } catch {
    return emptyState;
  }
};

/* -------------------------------------------------------------- analytics */

/**
 * Analytics facade. Events are pushed to `window.dataLayer` (GTM-compatible) so a
 * tag manager can route them to GA4, Meta or any other destination without any
 * key or endpoint living in this bundle. Enable GTM and the events flow.
 */
export type AnalyticsEvent =
  | { name: "view_item"; slug: string; variant?: string; value?: number }
  | { name: "view_item_list"; listId: string; itemCount: number }
  | { name: "search"; term: string; results: number }
  | { name: "add_to_cart"; slug: string; variant: string; size: string; value: number; quantity: number }
  | { name: "remove_from_cart"; slug: string; value: number }
  | { name: "add_to_wishlist"; slug: string }
  | { name: "remove_from_wishlist"; slug: string }
  | { name: "begin_checkout"; value: number; itemCount: number }
  | { name: "view_promotion"; promo: string }
  | { name: "select_promotion"; promo: string }
  | { name: "style_quiz_complete"; styles: string[] };

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export const track = (event: AnalyticsEvent) => {
  const payload = { event: event.name, ...event };
  if (typeof window !== "undefined") {
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push(payload);
    if (window.location.hostname === "localhost") console.info("[analytics]", payload);
  }
};

/* ------------------------------------------------------------------ router */

const readHash = () => {
  const raw = window.location.hash.replace(/^#/, "");
  return raw.startsWith("/") ? raw : "/";
};

export const navigate = (to: string, options?: { replace?: boolean; keepScroll?: boolean }) => {
  const target = `#${to.startsWith("/") ? to : `/${to}`}`;
  if (window.location.hash === target) return;
  if (options?.replace) window.history.replaceState(null, "", target);
  else window.location.hash = target;
  if (!options?.keepScroll) window.scrollTo({ top: 0, behavior: "auto" });
};

export const useRoute = () => {
  const [path, setPath] = useState(() => (typeof window === "undefined" ? "/" : readHash()));

  useEffect(() => {
    const onChange = () => setPath(readHash());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return path;
};

/* -------------------------------------------------------------------- toasts */

export type Toast = {
  id: number;
  message: string;
  tone: "neutral" | "success" | "error";
  action?: { label: string; to?: string; onClick?: () => void };
};

/* ------------------------------------------------------------------- context */

type StoreValue = {
  /* cart */
  cart: CartLine[];
  cartCount: number;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (input: {
    slug: string;
    variantId: string;
    size: string;
    qty?: number;
    silent?: boolean;
  }) => { ok: boolean; message: string };
  updateQty: (key: string, qty: number) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
  lineProduct: (line: CartLine) => ReturnType<typeof productBySlug>;
  /* wishlist */
  wishlist: WishlistEntry[];
  wishlistCount: number;
  wishlistOpen: boolean;
  setWishlistOpen: (open: boolean) => void;
  toggleWishlist: (slug: string, variantId: string) => boolean;
  removeWishlist: (slug: string) => void;
  toggleBackInStock: (slug: string) => void;
  moveWishlistToCart: (slug: string) => { ok: boolean; message: string };
  isWishlisted: (slug: string) => boolean;
  /* discovery */
  recentlyViewed: string[];
  recordView: (slug: string) => void;
  quizResult: StyleId[] | null;
  setQuizResult: (styles: StyleId[]) => void;
  /* commerce config */
  region: Region;
  setRegionCode: (code: string) => void;
  promo: PromoRule | null;
  promoError: string | null;
  applyPromoCode: (code: string) => { ok: boolean; message: string };
  clearPromo: () => void;
  shippingId: string;
  setShippingId: (id: string) => void;
  /* reviews (guest-persisted, UGC only — no seeded content) */
  reviews: Review[];
  addReview: (input: { slug: string; author: string; rating: number; title: string; body: string }) => { ok: boolean; message: string };
  reviewsFor: (slug: string) => Review[];
  /* feedback */
  toasts: Toast[];
  pushToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: number) => void;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(() => (typeof window === "undefined" ? emptyState : readStorage()));
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(1);

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* Storage unavailable (private mode) — session-only state is fine. */
    }
  }, [state]);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = toastId.current++;
      setToasts((current) => [...current.slice(-2), { ...toast, id }]);
      window.setTimeout(() => setToasts((current) => current.filter((entry) => entry.id !== id)), 4200);
    },
    [],
  );

  const region = useMemo(() => regionByCode(state.regionCode), [state.regionCode]);

  const promo = useMemo(
    () => PROMO_RULES.find((rule) => rule.code === state.promoCode) ?? null,
    [state.promoCode],
  );

  const shippingId = useMemo(() => {
    const ids = region.shipping.map((option) => option.id);
    if (state.shippingId && ids.includes(state.shippingId)) return state.shippingId;
    return ids[0];
  }, [region, state.shippingId]);

  const setRegionCode = useCallback((code: string) => {
    setState((current) => ({ ...current, regionCode: regionByCode(code).code, shippingId: null }));
  }, []);

  const setShippingId = useCallback((id: string) => {
    setState((current) => ({ ...current, shippingId: id }));
  }, []);

  /* --------------------------------------------------------------- cart */

  const addToCart: StoreValue["addToCart"] = useCallback(
    ({ slug, variantId, size, qty = 1, silent = false }) => {
      const product = productBySlug(slug);
      const variant = product?.variants.find((entry) => entry.id === variantId);
      if (!product || !variant) return { ok: false, message: "That piece is no longer available." };

      const sizeEntry = variant.sizes.find((entry) => entry.size === size);
      if (!sizeEntry) return { ok: false, message: "Choose a size first." };
      if (sizeEntry.stock <= 0)
        return { ok: false, message: `${size} is sold out in this colour — try another size or colour.` };

      const key = `${slug}|${variantId}|${size}`;
      const currentLine = state.cart.find((line) => line.key === key);
      const nextQty = Math.min(sizeEntry.stock, (currentLine?.qty ?? 0) + qty);

      if (currentLine && nextQty === currentLine.qty) {
        if (!silent) pushToast({ message: `That is all the ${size} we have in this colour.`, tone: "error" });
        return { ok: false, message: "Maximum available quantity reached." };
      }

      setState((current) => {
        const existing = current.cart.find((line) => line.key === key);
        return {
          ...current,
          cart: existing
            ? current.cart.map((line) => (line.key === key ? { ...line, qty: nextQty } : line))
            : [...current.cart, { key, slug, variantId, size, qty: nextQty, addedAt: Date.now() }],
        };
      });

      track({
        name: "add_to_cart",
        slug,
        variant: variantId,
        size,
        value: product.price,
        quantity: qty,
      });
      if (!silent) {
        pushToast({
          message: `${product.name} — ${variant.sizes.length === 1 ? "One size" : `size ${size}`} added to your bag.`,
          tone: "success",
          action: { label: "View bag", onClick: () => setCartOpen(true) },
        });
      }
      return { ok: true, message: "Added to bag." };
    },
    [pushToast, state.cart],
  );

  const updateQty = useCallback((key: string, qty: number) => {
    setState((current) => {
      const line = current.cart.find((entry) => entry.key === key);
      if (!line) return current;
      const product = productBySlug(line.slug);
      const variant = product?.variants.find((entry) => entry.id === line.variantId);
      const max = variant?.sizes.find((entry) => entry.size === line.size)?.stock ?? 1;
      const nextQty = Math.max(0, Math.min(max, qty));
      if (nextQty === 0) return { ...current, cart: current.cart.filter((entry) => entry.key !== key) };
      return { ...current, cart: current.cart.map((entry) => (entry.key === key ? { ...entry, qty: nextQty } : entry)) };
    });
  }, []);

  const removeLine = useCallback((key: string) => {
    setState((current) => {
      const line = current.cart.find((entry) => entry.key === key);
      if (line) track({ name: "remove_from_cart", slug: line.slug, value: productBySlug(line.slug)?.price ?? 0 });
      return { ...current, cart: current.cart.filter((entry) => entry.key !== key) };
    });
  }, []);

  const clearCart = useCallback(() => setState((current) => ({ ...current, cart: [], promoCode: null })), []);

  const lineProduct = useCallback((line: CartLine) => productBySlug(line.slug), []);

  /* ----------------------------------------------------------- wishlist */

  const toggleWishlist = useCallback((slug: string, variantId: string) => {
    const product = productBySlug(slug);
    const already = state.wishlist.some((entry) => entry.slug === slug);
    setState((current) => ({
      ...current,
      wishlist: already
        ? current.wishlist.filter((entry) => entry.slug !== slug)
        : [...current.wishlist, { slug, variantId, addedAt: Date.now(), notifyWhenBack: false }],
    }));
    track({ name: already ? "remove_from_wishlist" : "add_to_wishlist", slug });
    pushToast({
      message: already ? `${product?.name ?? "Piece"} removed from your wishlist.` : `${product?.name ?? "Piece"} saved to your wishlist.`,
      tone: "neutral",
    });
    return !already;
  }, [pushToast, state.wishlist]);

  const removeWishlist = useCallback((slug: string) => {
    setState((current) => ({ ...current, wishlist: current.wishlist.filter((entry) => entry.slug !== slug) }));
  }, []);

  const toggleBackInStock = useCallback((slug: string) => {
    setState((current) => ({
      ...current,
      wishlist: current.wishlist.map((entry) =>
        entry.slug === slug ? { ...entry, notifyWhenBack: !entry.notifyWhenBack } : entry,
      ),
    }));
  }, []);

  const moveWishlistToCart: StoreValue["moveWishlistToCart"] = useCallback(
    (slug: string) => {
      const entry = state.wishlist.find((item) => item.slug === slug);
      const product = productBySlug(slug);
      if (!entry || !product) return { ok: false, message: "That piece is no longer available." };
      const variant =
        product.variants.find((item) => item.id === entry.variantId && item.sizes.some((size) => size.stock > 0)) ??
        product.variants.find((item) => item.sizes.some((size) => size.stock > 0));
      if (!variant) return { ok: false, message: "Every size is sold out — turn on back-in-stock alerts instead." };
      const size = variant.sizes.find((option) => option.stock > 0)!.size;
      const result = addToCart({ slug, variantId: variant.id, size });
      if (result.ok) removeWishlist(slug);
      return result;
    },
    [addToCart, removeWishlist, state.wishlist],
  );

  const isWishlisted = useCallback((slug: string) => state.wishlist.some((entry) => entry.slug === slug), [state.wishlist]);

  /* -------------------------------------------------------- discovery */

  const recordView = useCallback((slug: string) => {
    setState((current) => ({
      ...current,
      recentlyViewed: [slug, ...current.recentlyViewed.filter((entry) => entry !== slug)].slice(0, 8),
    }));
  }, []);

  const setQuizResult = useCallback((styles: StyleId[]) => {
    setState((current) => ({ ...current, quizResult: styles }));
  }, []);

  /* -------------------------------------------------------------- promo */

  const applyPromoCode = useCallback((code: string) => {
    const rule = findPromo(code);
    if (!rule) {
      setPromoError("That code is not recognised. Check the spelling and try again.");
      return { ok: false, message: "Invalid code." };
    }
    const subtotal = state.cart.reduce((total, line) => {
      const product = productBySlug(line.slug);
      return total + (product?.price ?? 0) * line.qty;
    }, 0);
    if (subtotal < rule.minSubtotal) {
      setPromoError(`${rule.code} needs a subtotal of at least $${rule.minSubtotal}.`);
      return { ok: false, message: "Minimum subtotal not met." };
    }
    setPromoError(null);
    setState((current) => ({ ...current, promoCode: rule.code }));
    track({ name: "select_promotion", promo: rule.code });
    pushToast({ message: `${rule.code} applied — ${rule.description}`, tone: "success" });
    return { ok: true, message: rule.description };
  }, [pushToast, state.cart]);

  const clearPromo = useCallback(() => {
    setPromoError(null);
    setState((current) => ({ ...current, promoCode: null }));
  }, []);

  /* ------------------------------------------------------------ reviews */

  const addReview: StoreValue["addReview"] = useCallback(
    ({ slug, author, rating, title, body }) => {
      if (!productBySlug(slug)) return { ok: false, message: "Unknown product." };
      if (rating < 1 || rating > 5) return { ok: false, message: "Choose a rating between 1 and 5." };
      if (author.trim().length < 2) return { ok: false, message: "Please add a name we can attribute the review to." };
      if (body.trim().length < 12) return { ok: false, message: "Please add a little more detail (12 characters minimum)." };
      setState((current) => ({
        ...current,
        reviews: [
          {
            id: `r${Date.now()}`,
            slug,
            author: author.trim().slice(0, 60),
            rating: Math.round(rating),
            title: title.trim().slice(0, 80) || "Review",
            body: body.trim().slice(0, 900),
            createdAt: Date.now(),
          },
          ...current.reviews,
        ],
      }));
      pushToast({ message: "Thank you — your review is published.", tone: "success" });
      return { ok: true, message: "Review added." };
    },
    [pushToast],
  );

  const reviewsFor = useCallback(
    (slug: string) => state.reviews.filter((review) => review.slug === slug),
    [state.reviews],
  );

  const value: StoreValue = {
    cart: state.cart,
    cartCount: state.cart.reduce((total, line) => total + line.qty, 0),
    cartOpen,
    setCartOpen,
    addToCart,
    updateQty,
    removeLine,
    clearCart,
    lineProduct,
    wishlist: state.wishlist,
    wishlistCount: state.wishlist.length,
    wishlistOpen,
    setWishlistOpen,
    toggleWishlist,
    removeWishlist,
    toggleBackInStock,
    moveWishlistToCart,
    isWishlisted,
    recentlyViewed: state.recentlyViewed,
    recordView,
    quizResult: state.quizResult,
    setQuizResult,
    region,
    setRegionCode,
    promo,
    promoError,
    applyPromoCode,
    clearPromo,
    shippingId,
    setShippingId,
    reviews: state.reviews,
    addReview,
    reviewsFor,
    toasts,
    pushToast,
    dismissToast,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used inside <StoreProvider>");
  return context;
}


