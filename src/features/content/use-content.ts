import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { ArticleSummaryDto, LookDto } from "@/shared/content-dto";

export function useLooks() {
  return useQuery({
    queryKey: ["looks"],
    queryFn: () => apiGet<{ items: LookDto[] }>("/api/v1/looks").then((body) => body.items),
    staleTime: 10 * 60 * 1000,
  });
}

export function useArticles() {
  return useQuery({
    queryKey: ["journal"],
    queryFn: () =>
      apiGet<{ items: ArticleSummaryDto[] }>("/api/v1/journal").then((body) => body.items),
    staleTime: 10 * 60 * 1000,
  });
}
