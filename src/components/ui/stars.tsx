import { useId } from "react";

const STAR_PATH = "m12 4 2.4 5 5.6.7-4 3.9 1 5.4-5-2.7-5 2.7 1-5.4-4-3.9 5.6-.7Z";

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
      <path d={STAR_PATH} fill="currentColor" opacity="0.24" />
      {pct > 0 ? <path d={STAR_PATH} fill="currentColor" clipPath={`url(#${id})`} /> : null}
    </svg>
  );
}

export function Stars({
  value,
  count,
  size = "sm",
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
}) {
  return (
    <span className={`stars-row stars-${size}`} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((index) => (
        <StarIcon key={index} fill={Math.max(0, Math.min(1, value - index))} />
      ))}
      {count !== undefined ? <span className="stars-count">{count}</span> : null}
    </span>
  );
}

/** Average rating rounded to one decimal place. Returns zero for an empty list. */
export function ratingSummary(reviews: { rating: number }[]): { average: number; count: number } {
  if (!reviews.length) return { average: 0, count: 0 };
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return { average: Math.round((total / reviews.length) * 10) / 10, count: reviews.length };
}
