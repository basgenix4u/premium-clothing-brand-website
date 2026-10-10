import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "@/lib/api-client";

export type AddToBagInput = { variantId: string; size: string; quantity?: number };

/** Adds one line to the bag. The server checks stock and prices the line. The bag cache is refreshed on success. */
export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddToBagInput) =>
      apiPost<unknown>("/api/v1/cart/items", { quantity: 1, ...input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });
}
