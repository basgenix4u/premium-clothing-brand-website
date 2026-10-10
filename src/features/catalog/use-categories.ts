import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { CategoryDto } from "@/shared/catalog-dto";

export type Category = CategoryDto;

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGet<{ items: Category[] }>("/api/v1/categories").then((body) => body.items),
    staleTime: 10 * 60 * 1000,
  });
}
