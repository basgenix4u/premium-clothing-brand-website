"use client";

import Link from "next/link";
import { useCategories } from "@/features/catalog/use-categories";
import { STYLES } from "@/features/catalog/styles";
import { useRegion } from "@/features/regions/region-context";

/** Full-width menu for small screens. Each link closes the menu through `onNavigate`. */
export function MobileMenu({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const categories = useCategories();
  const { region, regions, setRegionCode } = useRegion();
  const code = region?.code ?? "US";

  return (
    <div id="mobile-menu" className={`mobile-menu ${open ? "is-open" : ""}`}>
      <div className="mobile-group">
        <p className="mega-heading">Categories</p>
        <div className="mobile-links">
          {(categories.data ?? []).map((category) => (
            <Link key={category.slug} href={`/shop?category=${category.slug}`} onClick={onNavigate}>
              {category.name}
            </Link>
          ))}
        </div>
      </div>
      <div className="mobile-group">
        <p className="mega-heading">Styles</p>
        <div className="mega-chips">
          {STYLES.map((style) => (
            <Link
              key={style.id}
              href={`/shop?style=${style.id}`}
              className="chip"
              onClick={onNavigate}
            >
              {style.name}
            </Link>
          ))}
        </div>
      </div>
      <div className="mobile-group">
        <p className="mega-heading">More</p>
        <div className="mobile-links">
          <Link href="/lookbook" onClick={onNavigate}>
            Lookbook
          </Link>
          <Link href="/journal" onClick={onNavigate}>
            Journal
          </Link>
          <Link href="/quiz" onClick={onNavigate}>
            Discover your style
          </Link>
          <Link href="/wishlist" onClick={onNavigate}>
            Wishlist
          </Link>
        </div>
      </div>
      <div className="mobile-region">
        <p className="mega-heading">Region</p>
        <div className="mega-chips">
          {regions.map((option) => (
            <button
              key={option.code}
              type="button"
              className={`chip ${option.code === code ? "chip-active" : ""}`}
              onClick={() => setRegionCode(option.code)}
            >
              {option.code} · {option.currency}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
