import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

/** Subset of the bag view that the header needs. */
export type CartCount = { itemCount: number };

export function useCartCount() {
  return useQuery({
    queryKey: ["cart"],
    queryFn: () => apiGet<CartCount>("/api/v1/cart"),
    select: (cart) => cart.itemCount,
  });
}
