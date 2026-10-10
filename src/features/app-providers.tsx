"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { RegionProvider } from "@/features/regions/region-context";
import { ToastProvider } from "@/features/feedback/toast-context";

/** Client-side state boundary: server-state cache, shopper region and transient notifications. */
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <RegionProvider>
        <ToastProvider>{children}</ToastProvider>
      </RegionProvider>
    </QueryClientProvider>
  );
}
