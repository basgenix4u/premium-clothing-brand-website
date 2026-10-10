"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icons";
import { useRegion } from "@/features/regions/region-context";

const SHOP_LINKS = [
  { label: "Outerwear", slug: "outerwear" },
  { label: "Tailoring", slug: "tailoring" },
  { label: "Knitwear", slug: "knitwear" },
  { label: "Denim", slug: "denim" },
  { label: "Accessories", slug: "accessories" },
] as const;

/** Delivery, sizing and legal links point at the FAQ until the dedicated pages are published (D7). */
const FAQ_HREF = "/#faq";

export function Footer() {
  const { region } = useRegion();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-top">
        <Link className="footer-wordmark" href="/">
          VELLUM<span>.</span>
        </Link>
        <div className="footer-columns">
          <div>
            <p className="footer-heading">Shop</p>
            {SHOP_LINKS.map((link) => (
              <Link key={link.slug} href={`/shop?category=${link.slug}`}>
                {link.label}
              </Link>
            ))}
          </div>
          <div>
            <p className="footer-heading">Discover</p>
            <Link href="/lookbook">Lookbook</Link>
            <Link href="/journal">Journal</Link>
            <Link href="/quiz">Discover your style</Link>
            <Link href="/wishlist">Wishlist</Link>
          </div>
          <div>
            <p className="footer-heading">Service</p>
            <Link href="/bag">Your bag</Link>
            <Link href={FAQ_HREF}>Delivery &amp; returns</Link>
            <Link href={FAQ_HREF}>Sizing &amp; fit</Link>
            <a href="mailto:hello@vellum.example">Contact the studio</a>
            <span className="footer-region">
              Shopping {region?.label ?? "United States"} · {region?.currency ?? "USD"}
            </span>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {year} Vellum Studio. All rights reserved.</span>
        <div>
          <Link href={FAQ_HREF}>Privacy</Link>
          <Link href={FAQ_HREF}>Terms</Link>
          <Link href={FAQ_HREF}>Accessibility</Link>
        </div>
        <a className="back-top" href="#top">
          Back to top <Icon.ArrowUpRight />
        </a>
      </div>
      <p className="footer-disclaimer">
        Storefront in development. No payment provider is connected yet, so checkout is a stub.
        Privacy, terms and accessibility statements are drafts awaiting owner review and are not yet
        published.
      </p>
    </footer>
  );
}
