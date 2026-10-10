import Link from "next/link";
import { Icon } from "@/components/ui/icons";

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
  action?: { label: string; href: string };
}) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{copy}</p>
      {action ? (
        <Link href={action.href} className="button button-dark">
          {action.label} <Icon.ArrowRight />
        </Link>
      ) : null}
    </div>
  );
}

/** Shown when a data view fails. The retry control re-runs the failed query. */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="empty-state" role="alert">
      <h3>We could not load this.</h3>
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="button button-dark" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}
