"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icons";
import { LinkButton } from "@/components/ui/link-button";
import { Photo } from "@/components/ui/photo";
import { Reveal } from "@/components/ui/reveal";
import { useAddToCart } from "@/features/cart/use-add-to-cart";
import { availableSizes } from "@/features/catalog/product-utils";
import { useToast } from "@/features/feedback/toast-context";
import { useRegion } from "@/features/regions/region-context";
import { formatRegionMoney } from "@/lib/money-format";
import type { LookDto } from "@/shared/content-dto";
import type { ProductSummaryDto } from "@/shared/catalog-dto";

type ResolvedItem = { label: string; x: number; y: number; product: ProductSummaryDto };

/** One curated look. Hotspots link to pieces, and "Add the look" adds every piece that is in stock. */
export function ShopTheLook({
  look,
  products,
  index = 0,
}: {
  look: LookDto;
  products: ProductSummaryDto[];
  index?: number;
}) {
  const { region } = useRegion();
  const { toast } = useToast();
  const addToCart = useAddToCart();
  const [active, setActive] = useState<number | null>(null);

  const resolved = useMemo<ResolvedItem[]>(() => {
    const bySlug = new Map(products.map((product) => [product.slug, product]));
    return look.items.flatMap((item) => {
      const product = bySlug.get(item.slug);
      return product ? [{ label: item.label, x: item.x, y: item.y, product }] : [];
    });
  }, [look.items, products]);

  const addLook = async () => {
    let added = 0;
    for (const { product } of resolved) {
      const variant = product.variants.find((entry) => availableSizes(entry).length > 0);
      const size = variant ? availableSizes(variant)[0] : undefined;
      if (!variant || !size) continue;
      try {
        await addToCart.mutateAsync({ variantId: variant.id, size: size.size });
        added += 1;
      } catch {
        // A piece that cannot be added is skipped. The count below reports the outcome.
      }
    }
    if (added)
      toast(`${added} piece${added === 1 ? "" : "s"} from “${look.title}” added.`, "success");
    else toast("This look is sold out in every size right now.", "error");
  };

  return (
    <Reveal as="article" className="look" delay={index * 90}>
      <div className="look-media">
        <Photo src={look.imageUrl} alt={look.title} loading="lazy" />
        {resolved.map((entry, entryIndex) => (
          <button
            key={`${entry.product.slug}-${entryIndex}`}
            type="button"
            className={`look-hotspot ${active === entryIndex ? "is-active" : ""}`}
            style={{ left: `${entry.x}%`, top: `${entry.y}%` }}
            onClick={() => setActive(active === entryIndex ? null : entryIndex)}
            aria-pressed={active === entryIndex}
            aria-label={`${entry.label}: ${entry.product.name}`}
          >
            <span />
            <span className="look-pop">
              <Photo src={entry.product.variants[0]?.images[0]} alt="" />
              <span>
                <strong>{entry.product.name}</strong>
                <em>{formatRegionMoney(entry.product.price, region)}</em>
                <span className="look-pop-action">View piece</span>
              </span>
            </span>
          </button>
        ))}
      </div>
      <div className="look-copy">
        <p className="section-eyebrow">{look.season}</p>
        <h3>{look.title}</h3>
        <p>{look.copy}</p>
        <p className="look-styling">{look.styling}</p>
        <div className="look-items">
          {resolved.map((entry, entryIndex) => (
            <Link
              key={`${entry.product.slug}-item-${entryIndex}`}
              href={`/product/${entry.product.slug}`}
              className={`look-item ${active === entryIndex ? "is-active" : ""}`}
              onMouseEnter={() => setActive(entryIndex)}
            >
              <Photo src={entry.product.variants[0]?.images[0]} alt="" loading="lazy" />
              <span>
                <strong>{entry.product.name}</strong>
                <em>
                  {entry.product.variants[0]?.colour.name} ·{" "}
                  {formatRegionMoney(entry.product.price, region)}
                </em>
              </span>
            </Link>
          ))}
        </div>
        <div className="look-actions">
          <button
            type="button"
            className="button button-dark"
            onClick={() => void addLook()}
            disabled={addToCart.isPending}
          >
            Add the look <Icon.ArrowRight />
          </button>
          <LinkButton href="/lookbook" variant="ghost">
            All looks
          </LinkButton>
        </div>
      </div>
    </Reveal>
  );
}
