"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui/icons";
import { Photo } from "@/components/ui/photo";
import { useCategories } from "@/features/catalog/use-categories";
import { STYLES } from "@/features/catalog/styles";

const EDITS = [
  { id: "new", label: "New arrivals" },
  { id: "bestsellers", label: "Most reached for" },
  { id: "available", label: "In stock now" },
] as const;

/** "Shop" mega menu. Opens on hover or focus, and toggles on click for touch. */
export function MegaMenu({ onNavigate }: { onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  const categories = useCategories();
  const featured = categories.data?.[0];

  return (
    <div className="mega-wrap" onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className="nav-link"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
        onMouseEnter={() => setOpen(true)}
        onFocus={() => setOpen(true)}
      >
        Shop <Icon.ChevronDown />
      </button>
      <div className={`mega ${open ? "is-open" : ""}`} aria-hidden={!open}>
        <div className="mega-col mega-categories">
          <p className="mega-heading">Shop by category</p>
          {(categories.data ?? []).map((category) => (
            <Link
              key={category.slug}
              href={`/shop?category=${category.slug}`}
              className="mega-link"
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
            >
              <span>{category.name}</span>
              <em>{category.blurb}</em>
            </Link>
          ))}
        </div>
        <div className="mega-col">
          <p className="mega-heading">Shop by style</p>
          <div className="mega-chips">
            {STYLES.map((style) => (
              <Link
                key={style.id}
                href={`/shop?style=${style.id}`}
                className="chip"
                onClick={() => setOpen(false)}
              >
                {style.name}
              </Link>
            ))}
          </div>
          <p className="mega-heading mega-heading-gap">Edits</p>
          <div className="mega-chips">
            {EDITS.map((edit) => (
              <Link
                key={edit.id}
                href={`/shop?edit=${edit.id}`}
                className="chip"
                onClick={() => setOpen(false)}
              >
                {edit.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="mega-feature">
          {featured ? (
            <Photo src={featured.imageUrl} alt="" loading="lazy" aria-hidden="true" />
          ) : null}
          <div>
            <p className="mega-heading">The Fall Study</p>
            <p className="mega-copy">
              Coats, tailoring and knits built to carry you through the season.
            </p>
            <Link
              href="/shop"
              className="text-link"
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
            >
              Browse everything <Icon.ArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
