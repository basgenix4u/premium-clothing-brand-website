import Link from "next/link";
import { Icon } from "@/components/ui/icons";
import { LinkButton } from "@/components/ui/link-button";
import { Photo } from "@/components/ui/photo";
import { Reveal } from "@/components/ui/reveal";
import { HOME_IMAGES, POLICIES, VALUE_PROPOSITIONS } from "@/features/home/home-content";
import { byPopularity } from "@/features/catalog/product-utils";
import { formatRegionMoney } from "@/lib/money-format";
import { useRegion } from "@/features/regions/region-context";
import type { ProductSummaryDto } from "@/shared/catalog-dto";

export function Manifesto() {
  return (
    <section className="manifesto" id="our-world" aria-labelledby="manifesto-title">
      <div className="manifesto-image-wrap reveal">
        <Photo
          src={HOME_IMAGES.manifesto}
          alt="Vellum models in an all-white editorial studio"
          loading="lazy"
        />
      </div>
      <div className="manifesto-content section-pad reveal reveal-delay-1">
        <p className="section-eyebrow">A wardrobe that moves with you</p>
        <h2 id="manifesto-title">
          No uniforms. No rules.
          <br />
          Just <em>you, amplified.</em>
        </h2>
        <p>
          Vellum is built as one system: a coat that closes over a knit that tucks into a trouser
          that works with the shoe you already own. Six styles, one wardrobe, no orphan pieces.
        </p>
        <div className="manifesto-actions">
          <Link className="text-link" href="/quiz">
            Discover your style <Icon.ArrowRight />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function ValuesSection() {
  return (
    <section className="values section-pad" id="women" aria-labelledby="values-title">
      <div className="values-intro reveal">
        <p className="section-eyebrow">The Vellum standard</p>
        <h2 id="values-title">
          Less compromise.
          <br />
          <em>More character.</em>
        </h2>
      </div>
      <div className="value-list">
        {VALUE_PROPOSITIONS.map((value, index) => (
          <Reveal as="article" className="value" key={value.title} delay={index * 70}>
            <span>0{index + 1}</span>
            <div>
              <h3>{value.title}</h3>
              <p>{value.copy}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function EditorialSection({ products }: { products: ProductSummaryDto[] | undefined }) {
  const { region } = useRegion();
  const mostReached = products ? byPopularity(products).slice(0, 4) : [];
  return (
    <section className="editorial" id="men" aria-labelledby="editorial-title">
      <div className="editorial-media reveal">
        <Photo
          src={HOME_IMAGES.essentials}
          alt="Models wearing elevated cream Vellum essentials"
          loading="lazy"
        />
        <p className="vertical-caption">THE DAILY UNIFORM, REWORKED</p>
      </div>
      <div className="editorial-copy reveal reveal-delay-1">
        <p className="section-eyebrow">Beyond the basics</p>
        <h2 id="editorial-title">
          The pieces that make getting dressed feel like <em>self-expression.</em>
        </h2>
        <p>
          Softness you feel. Structure you see. An everyday foundation with nothing ordinary about
          it.
        </p>
        <div className="editorial-actions">
          <LinkButton href="/shop?category=essentials" variant="dark">
            Shop essentials <Icon.ArrowRight />
          </LinkButton>
          <LinkButton href="/journal" variant="ghost">
            Read the Journal <Icon.ArrowRight />
          </LinkButton>
        </div>
        <div className="editorial-bestsellers">
          <p className="mega-heading">Most reached for this week</p>
          <ul>
            {mostReached.map((product) => (
              <li key={product.slug}>
                <Link href={`/product/${product.slug}`}>
                  <Photo src={product.variants[0]?.images[0]} alt="" loading="lazy" />
                  <span>
                    <strong>{product.name}</strong>
                    <em>{formatRegionMoney(product.price, region)}</em>
                  </span>
                  <Icon.ArrowUpRight />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function ServiceSection() {
  const { region } = useRegion();
  const items = [
    { icon: <Icon.Return />, title: "30-day returns", copy: POLICIES.returns },
    {
      icon: <Icon.Truck />,
      title: `Shipping to ${region?.label ?? "your region"}`,
      copy: `${POLICIES.shipping} ${region?.taxNote ?? ""}`.trim(),
    },
    {
      icon: <Icon.Ruler />,
      title: "Four-region sizing",
      copy: "US, UK, EU and JP measurements on every product page, plus fit notes from the studio.",
    },
    {
      icon: <Icon.Leaf />,
      title: "Materials listed in full",
      copy: "Every product page states composition and care, fibre by fibre, with no vague claims.",
    },
  ];
  return (
    <section className="section-pad service-section" aria-labelledby="service-title">
      <div className="section-heading reveal">
        <div>
          <p className="section-eyebrow">Service</p>
          <h2 className="section-title" id="service-title">
            The unglamorous part, done properly.
          </h2>
        </div>
      </div>
      <div className="service-grid">
        {items.map((item, index) => (
          <Reveal as="article" className="service-card" key={item.title} delay={index * 60}>
            {item.icon}
            <h3>{item.title}</h3>
            <p>{item.copy}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
