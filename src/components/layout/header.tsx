"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MegaMenu } from "@/components/layout/mega-menu";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { RegionMenu } from "@/components/layout/region-menu";
import { Icon } from "@/components/ui/icons";
import { useCartCount } from "@/features/cart/use-cart";

const SCROLL_THRESHOLD_PX = 40;

export function Header() {
  const pathname = usePathname();
  const cartCount = useCartCount().data ?? 0;
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const overHero = pathname === "/";
  const solid = scrolled || !overHero || menuOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={`site-header ${solid ? "is-solid is-scrolled" : ""}`}>
      <div className="header-inner">
        <div className="header-left">
          <button
            type="button"
            className="menu-toggle"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((value) => !value)}
          >
            <span />
            <span />
          </button>
          <Link className="wordmark" href="/" aria-label="Vellum home" onClick={closeMenu}>
            VELLUM<span className="wordmark-mark">.</span>
          </Link>
        </div>

        <nav className="desktop-nav" aria-label="Primary">
          <MegaMenu />
          <Link className="nav-link" href="/shop?audience=women">
            Women
          </Link>
          <Link className="nav-link" href="/shop?audience=men">
            Men
          </Link>
          <Link className="nav-link" href="/lookbook">
            Lookbook
          </Link>
          <Link className="nav-link" href="/journal">
            Journal
          </Link>
        </nav>

        <div className="nav-actions">
          <RegionMenu />
          <Link className="nav-text-button hide-small" href="/wishlist" aria-label="Wishlist">
            <Icon.Heart /> Wishlist
          </Link>
          <Link
            className="nav-text-button"
            href="/bag"
            aria-label={`Shopping bag, ${cartCount} items`}
          >
            <Icon.Bag /> {cartCount > 0 ? `(${cartCount})` : ""}
          </Link>
        </div>
      </div>

      <MobileMenu open={menuOpen} onNavigate={closeMenu} />
    </header>
  );
}
