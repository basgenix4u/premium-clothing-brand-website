import Link from "next/link";
import { Icon } from "@/components/ui/icons";
import { LinkButton } from "@/components/ui/link-button";
import { Photo } from "@/components/ui/photo";
import { Reveal } from "@/components/ui/reveal";
import { STYLES } from "@/features/catalog/styles";
import { countInCategory, countWithStyle } from "@/features/catalog/product-utils";
import type { CategoryDto, ProductSummaryDto } from "@/shared/catalog-dto";

const pieces = (count: number) => `${count} piece${count === 1 ? "" : "s"}`;

export function StyleNav({ products }: { products: ProductSummaryDto[] | undefined }) {
  return (
    <section className="section-pad style-nav" id="shop-by-style" aria-labelledby="styles-title">
      <div className="section-heading reveal">
        <div>
          <p className="section-eyebrow">Shop by style</p>
          <h2 className="section-title" id="styles-title">
            Six ways to wear Vellum.
          </h2>
        </div>
        <LinkButton href="/quiz" variant="ghost">
          Not sure? Take the quiz <Icon.ArrowRight />
        </LinkButton>
      </div>
      <div className="style-grid">
        {STYLES.map((style, index) => (
          <Reveal as="article" className="style-card" key={style.id} delay={index * 60}>
            <Link href={`/shop?style=${style.id}`}>
              <h3>{style.name}</h3>
              <p>{style.blurb}</p>
              <span className="style-count">
                {products ? pieces(countWithStyle(products, style.id)) : "…"} <Icon.ArrowUpRight />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function CategoryNav({
  categories,
  products,
}: {
  categories: CategoryDto[] | undefined;
  products: ProductSummaryDto[] | undefined;
}) {
  return (
    <section className="section-pad category-nav" aria-labelledby="categories-title">
      <div className="section-heading reveal">
        <div>
          <p className="section-eyebrow">Shop by category</p>
          <h2 className="section-title" id="categories-title">
            Start where you like.
          </h2>
        </div>
        <LinkButton href="/shop" variant="ghost">
          Browse everything <Icon.ArrowUpRight />
        </LinkButton>
      </div>
      <div className="category-grid">
        {(categories ?? []).map((category, index) => {
          const count = products ? countInCategory(products, category.slug) : null;
          return (
            <Reveal as="article" className="category-card" key={category.slug} delay={index * 55}>
              <Link href={`/shop?category=${category.slug}`}>
                <Photo src={category.imageUrl} alt="" loading="lazy" />
                <span className="category-copy">
                  <strong>{category.name}</strong>
                  <em>
                    {category.blurb}
                    {count === null ? "" : ` · ${pieces(count)}`}
                  </em>
                </span>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
