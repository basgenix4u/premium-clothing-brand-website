"use client";

import { CategoryNav, StyleNav } from "@/components/home/discovery-sections";
import { Faq } from "@/components/home/faq";
import { ShopTheLook } from "@/components/home/look-section";
import { Newsletter } from "@/components/home/newsletter";
import { CircleSection, JournalTeaser } from "@/components/home/journal-circle-sections";
import {
  EditorialSection,
  ServiceSection,
  ValuesSection,
  Manifesto,
} from "@/components/home/story-sections";
import { Hero, Marquee } from "@/components/home/hero";
import { LinkButton } from "@/components/ui/link-button";
import { ErrorState } from "@/components/ui/feedback";
import { ProductSkeletonGrid } from "@/components/ui/feedback";
import { ProductGrid } from "@/components/product/product-card";
import { Icon } from "@/components/ui/icons";
import { useCategories } from "@/features/catalog/use-categories";
import { isProductAvailable, newestFirst } from "@/features/catalog/product-utils";
import { useAllProducts } from "@/features/catalog/use-products";
import { useArticles, useLooks } from "@/features/content/use-content";

/** Home page composition. Each data-backed section handles its own loading and error states. */
export function HomeView() {
  const products = useAllProducts();
  const categories = useCategories();
  const looks = useLooks();
  const articles = useArticles();
  const list = products.data;
  const availableCount = list ? list.filter(isProductAvailable).length : null;
  const newArrivals = list ? newestFirst(list).slice(0, 6) : [];

  return (
    <>
      <Hero availableCount={availableCount} />
      <Marquee />
      <StyleNav products={list} />
      <CategoryNav categories={categories.data} products={list} />

      <section
        className="collection section-pad"
        id="new-arrivals"
        aria-labelledby="collection-title"
      >
        <div className="section-heading reveal">
          <div>
            <p className="section-eyebrow">New this season</p>
            <h2 className="section-title" id="collection-title">
              Pieces with a point of view.
            </h2>
          </div>
          <LinkButton href="/shop?edit=new" variant="ghost">
            Shop all arrivals <Icon.ArrowUpRight />
          </LinkButton>
        </div>
        {products.isPending ? <ProductSkeletonGrid count={6} /> : null}
        {products.isError ? (
          <ErrorState message={products.error.message} onRetry={() => void products.refetch()} />
        ) : null}
        {list ? <ProductGrid products={newArrivals} listId="home-new-arrivals" /> : null}
      </section>

      <section className="look-section section-pad" aria-labelledby="look-title">
        <div className="section-heading reveal">
          <div>
            <p className="section-eyebrow">Shop the look</p>
            <h2 className="section-title" id="look-title">
              Four looks, head to toe.
            </h2>
          </div>
          <LinkButton href="/lookbook" variant="ghost">
            All looks <Icon.ArrowUpRight />
          </LinkButton>
        </div>
        {looks.isError ? (
          <ErrorState message={looks.error.message} onRetry={() => void looks.refetch()} />
        ) : null}
        {looks.data?.[0] && list ? <ShopTheLook look={looks.data[0]} products={list} /> : null}
      </section>

      <Manifesto />
      <ValuesSection />
      <EditorialSection products={list} />
      <ServiceSection />

      {articles.isError ? (
        <ErrorState message={articles.error.message} onRetry={() => void articles.refetch()} />
      ) : (
        <JournalTeaser articles={articles.data} />
      )}
      <CircleSection />
      <Faq />
      <Newsletter />
    </>
  );
}
