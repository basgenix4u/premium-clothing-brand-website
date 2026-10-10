import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export type Category = { slug: string; name: string; blurb: string; imageUrl: string };

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGet<{ items: Category[] }>("/api/v1/categories").then((body) => body.items),
    staleTime: 10 * 60 * 1000,
  });
}
