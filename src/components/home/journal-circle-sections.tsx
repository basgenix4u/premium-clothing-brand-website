"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icons";
import { LinkButton } from "@/components/ui/link-button";
import { Photo } from "@/components/ui/photo";
import { Reveal } from "@/components/ui/reveal";
import type { ArticleSummaryDto } from "@/shared/content-dto";

export function JournalTeaser({ articles }: { articles: ArticleSummaryDto[] | undefined }) {
  return (
    <section className="journal-teaser" aria-labelledby="journal-title">
      <div className="section-pad journal-teaser-head reveal">
        <div>
          <p className="section-eyebrow">The Journal</p>
          <h2 className="section-title" id="journal-title">
            Styling notes, not adverts.
          </h2>
        </div>
        <LinkButton href="/journal" variant="ghost">
          All stories <Icon.ArrowUpRight />
        </LinkButton>
      </div>
      <div className="journal-list section-pad">
        {(articles ?? []).map((article, index) => (
          <Reveal as="article" className="journal-card" key={article.slug} delay={index * 80}>
            <Link href={`/journal/${article.slug}`} className="journal-media">
              <Photo src={article.imageUrl} alt="" loading="lazy" />
            </Link>
            <div className="journal-copy">
              <p className="section-eyebrow">
                {article.kicker} · {article.readTime}
              </p>
              <h3>{article.title}</h3>
              <p>{article.excerpt}</p>
              <Link href={`/journal/${article.slug}`} className="text-link">
                Read the piece <Icon.ArrowRight />
              </Link>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const MEMBERSHIPS = [
  { label: "Monthly", price: "$25", unit: "/ month", note: "Skip any month" },
  { label: "Annual", price: "$240", unit: "/ year", note: "Two months free", featured: true },
] as const;

export function CircleSection() {
  const chooseMembership = () => {
    document.getElementById("newsletter")?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => {
      const input = document.getElementById("email") as HTMLInputElement | null;
      input?.focus({ preventScroll: true });
    }, 620);
  };

  return (
    <section className="circle" id="circle" aria-labelledby="circle-title">
      <div className="circle-glow" />
      <div className="circle-inner reveal">
        <p className="section-eyebrow">Vellum Circle</p>
        <h2 id="circle-title">
          A closer way
          <br />
          to wear <em>Vellum.</em>
        </h2>
        <p className="circle-description">
          Credit to spend on anything, first call on limited runs, and free shipping on every order.
          Cancel whenever you like.
        </p>
        <div className="membership-options">
          {MEMBERSHIPS.map((option) => (
            <div
              className={`membership-card ${"featured" in option ? "is-featured" : ""}`}
              key={option.label}
            >
              <span className="membership-label">{option.label}</span>
              <strong>
                {option.price} <small>{option.unit}</small>
              </strong>
              <em>{option.note}</em>
              <button type="button" className="button button-light" onClick={chooseMembership}>
                Choose {option.label} <Icon.ArrowRight />
              </button>
            </div>
          ))}
        </div>
        <ul className="circle-benefits">
          <li>
            <Icon.Check /> $25 monthly credit toward anything
          </li>
          <li>
            <Icon.Check /> First access to limited releases
          </li>
          <li>
            <Icon.Check /> Complimentary shipping
          </li>
        </ul>
        <p className="circle-note">
          Membership billing runs through our checkout provider, so joining goes live once payments
          are connected. In the meantime, everything in the shop is open to everyone.
        </p>
      </div>
    </section>
  );
}
