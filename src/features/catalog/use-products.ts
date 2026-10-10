import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { ProductSummaryDto } from "@/shared/catalog-dto";

type ProductPage = { items: ProductSummaryDto[]; nextCursor: string | null };

const PAGE_SIZE = 100;

/** Walks every page of the published catalogue. The catalogue is small, so one cached list serves home and shop. */
async function fetchAllProducts(): Promise<ProductSummaryDto[]> {
  const items: ProductSummaryDto[] = [];
  let cursor: string | null = null;
  do {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
    if (cursor) params.set("cursor", cursor);
    const page: ProductPage = await apiGet<ProductPage>(`/api/v1/products?${params.toString()}`);
    items.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor);
  return items;
}

export function useAllProducts() {
  return useQuery({
    queryKey: ["products", "all"],
    queryFn: fetchAllProducts,
    staleTime: 5 * 60 * 1000,
  });
}
