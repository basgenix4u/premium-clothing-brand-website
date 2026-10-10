import { useEffect, useId, useRef, type ReactNode } from "react";
import { navigate, useStore } from "../lib/store";

/* --------------------------------------------------------------------- icons */

const base = {
  viewBox: "0 0 24 24",
  "aria-hidden": true as const,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const Icon = {
  ArrowUpRight: () => <svg {...base} className="icon"><path d="M5 19 19 5M8 5h11v11" /></svg>,
  ArrowRight: () => <svg {...base} className="icon"><path d="M5 12h14M13 6l6 6-6 6" /></svg>,
  ArrowLeft: () => <svg {...base} className="icon"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>,
  ChevronDown: () => <svg {...base} className="icon"><path d="m6 9 6 6 6-6" /></svg>,
  Plus: ({ open }: { open?: boolean }) => (
    <svg {...base} className={`icon plus ${open ? "open" : ""}`}><path d="M12 5v14M5 12h14" /></svg>
  ),
  Check: () => <svg {...base} className="check-icon"><path d="m5 12 4.5 4.5L19 7" /></svg>,
  Search: () => <svg {...base} className="icon"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>,
  Close: () => <svg {...base} className="icon"><path d="M6 6l12 12M18 6 6 18" /></svg>,
  Bag: () => <svg {...base} className="icon"><path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9.5 8V6.5a2.5 2.5 0 0 1 5 0V8" /></svg>,
  Heart: ({ filled }: { filled?: boolean }) => (
    <svg {...base} className="icon" fill={filled ? "currentColor" : "none"}><path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.6-7 9-7 9Z" /></svg>
  ),
  Filter: () => <svg {...base} className="icon"><path d="M4 7h16M7 12h10M10 17h4" /></svg>,
  Globe: () => <svg {...base} className="icon"><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.6 2.5 14.4 0 17M12 3.5c-2.5 2.6-2.5 14.4 0 17" /></svg>,
  Zoom: () => <svg {...base} className="icon"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5M11 8.5v5M8.5 11h5" /></svg>,
  Truck: () => <svg {...base} className="icon"><path d="M3 7h10v9H3zM13 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" /></svg>,
  Return: () => <svg {...base} className="icon"><path d="M4 10h11a4 4 0 0 1 0 8H8" /><path d="m4 10 4-4M4 10l4 4" /></svg>,
  Leaf: () => <svg {...base} className="icon"><path d="M5 19c9 0 14-5 14-14C9 5 5 10 5 19Z" /><path d="M5 19c3-4 6-6 9-7" /></svg>,
  Ruler: () => <svg {...base} className="icon"><path d="M4 8h16v8H4z" /><path d="M8 8v3M12 8v3M16 8v3" /></svg>,
};

/** Partial-fill star: background shape plus a clipped foreground, no per-render ids. */
export function StarIcon({ fill = 1 }: { fill?: number }) {
  const id = useId();
  const pct = Math.round(Math.max(0, Math.min(1, fill)) * 100);
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="star">
      <defs>
        <clipPath id={id}>
          <rect x="0" y="0" width={`${pct}%`} height="24" />
        </clipPath>
      </defs>
      <path d="m12 4 2.4 5 5.6.7-4 3.9 1 5.4-5-2.7-5 2.7 1-5.4-4-3.9 5.6-.7Z" fill="currentColor" opacity="0.24" />
      {pct > 0 ? (
        <path
          d="m12 4 2.4 5 5.6.7-4 3.9 1 5.4-5-2.7-5 2.7 1-5.4-4-3.9 5.6-.7Z"
          fill="currentColor"
          clipPath={`url(#${id})`}
        />
      ) : null}
    </svg>
  );
}

/* -------------------------------------------------------------- scroll reveal */

const seen = new WeakSet<Element>();
let sharedObserver: IntersectionObserver | null = null;

const observer = () => {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            sharedObserver?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
  }
  return sharedObserver;
};

/**
 * Scans a subtree for `.reveal` elements and registers them with the shared
 * observer. Called on mount and on every route change so that statically
 * authored markup (`.reveal` classes in JSX) animates exactly like the
 * `<Reveal>` component.
 */
export function observeRevealRoot(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>(".reveal:not(.is-visible)").forEach((node) => {
    if (seen.has(node)) return;
    seen.add(node);
    observer().observe(node);
    // Safety net: never trap content above the fold in a hidden state.
    window.setTimeout(() => {
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight + 200) node.classList.add("is-visible");
    }, 2600);
  });
}

export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "article" | "li" | "figure";
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (delay) node.style.transitionDelay = `${delay}ms`;
    if (seen.has(node)) return;
    seen.add(node);
    observer().observe(node);
    // Safety net: never leave content invisible if the observer never fires.
    const fallback = window.setTimeout(() => node.classList.add("is-visible"), 2600);
    return () => window.clearTimeout(fallback);
  }, [delay]);

  return (
    <Tag ref={ref as never} className={`reveal ${className}`}>
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ overlays */

export function useLockBody(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}

export function useEscape(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onEscape();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, onEscape]);
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  side = "right",
  label,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  side?: "right" | "left";
  label: string;
}) {
  useLockBody(open);
  useEscape(open, onClose);
  return (
    <div className={`drawer-root ${open ? "is-open" : ""}`} aria-hidden={!open}>
      <div className="drawer-scrim" onClick={onClose} />
      <aside
        className={`drawer drawer-${side}`}
        role="dialog"
        aria-modal={open}
        aria-label={label}
        aria-hidden={!open}
        inert={!open ? true : undefined}
      >
        <header className="drawer-head">
          <h2>{title}</h2>
          <button type="button" className="ghost-button" onClick={onClose} aria-label={`Close ${label}`}>
            <Icon.Close />
          </button>
        </header>
        <div className="drawer-body">{children}</div>
        {footer ? <footer className="drawer-foot">{footer}</footer> : null}
      </aside>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useLockBody(open);
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <div className="modal-root is-open">
      <div className="drawer-scrim" onClick={onClose} />
      <div className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="drawer-head">
          <h2>{title}</h2>
          <button type="button" className="ghost-button" onClick={onClose} aria-label={`Close ${title}`}>
            <Icon.Close />
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- stars */

export function Stars({ value, count, size = "sm" }: { value: number; count?: number; size?: "sm" | "md" }) {
  return (
    <span className={`stars-row stars-${size}`} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((index) => (
        <StarIcon key={index} fill={Math.max(0, Math.min(1, value - index))} />
      ))}
      {count !== undefined ? <span className="stars-count">{count}</span> : null}
    </span>
  );
}

export function ratingSummary(reviews: { rating: number }[]) {
  if (!reviews.length) return { average: 0, count: 0 };
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return { average: Math.round((total / reviews.length) * 10) / 10, count: reviews.length };
}

/* ------------------------------------------------------------------ feedback */

export function Skeleton({ className = "" }: { className?: string }) {
  return <span className={`skeleton ${className}`} aria-hidden="true" />;
}

export function ProductSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="product-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div className="product" key={index}>
          <Skeleton className="skeleton-image" />
          <div className="product-meta">
            <div>
              <Skeleton className="skeleton-line w-60" />
              <Skeleton className="skeleton-line w-40" />
            </div>
            <Skeleton className="skeleton-line w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  copy,
  action,
}: {
  title: string;
  copy: string;
  action?: { label: string; to: string };
}) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{copy}</p>
      {action ? (
        <button type="button" className="button button-dark" onClick={() => navigate(action.to)}>
          {action.label} <Icon.ArrowRight />
        </button>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------- toasts */

export function Toaster() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="toaster" role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item toast-${toast.tone}`} role="status">
          <span>{toast.message}</span>
          {toast.action ? (
            <button
              type="button"
              className="toast-action"
              onClick={() => {
                toast.action?.onClick?.();
                dismissToast(toast.id);
              }}
            >
              {toast.action.label}
            </button>
          ) : null}
          <button type="button" className="toast-close" onClick={() => dismissToast(toast.id)} aria-label="Dismiss">
            <Icon.Close />
          </button>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------- links */

export function LinkButton({
  to,
  children,
  variant = "dark",
  onClick,
  className = "",
}: {
  to: string;
  children: ReactNode;
  variant?: "dark" | "light" | "ghost";
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`button button-${variant} ${className}`}
      onClick={() => {
        onClick?.();
        navigate(to);
      }}
    >
      {children}
    </button>
  );
}
