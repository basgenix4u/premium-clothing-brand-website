"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { observeRevealRoot } from "@/components/ui/reveal";

const LATE_SCAN_MS = 420;

/** Re-scans `.reveal` markup after each client navigation, once immediately and once after content settles. */
export function RouteReveal() {
  const pathname = usePathname();
  useEffect(() => {
    observeRevealRoot();
    const timer = window.setTimeout(() => observeRevealRoot(), LATE_SCAN_MS);
    return () => window.clearTimeout(timer);
  }, [pathname]);
  return null;
}
