"use client";

import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { apiGet } from "@/lib/api-client";

export type Region = {
  code: string;
  label: string;
  currency: string;
  locale: string;
  sizeSystem: string;
  taxNote: string;
  fxRate: number;
};

const STORAGE_KEY = "vellum.region";
const DEFAULT_CODE = "US";

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readCode(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? DEFAULT_CODE;
  } catch {
    return DEFAULT_CODE;
  }
}

function writeCode(code: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Storage can be unavailable (private mode). The selection then lasts for the page only.
  }
  listeners.forEach((listener) => listener());
}

type RegionValue = {
  region: Region | null;
  regions: Region[];
  setRegionCode: (code: string) => void;
};

const RegionContext = createContext<RegionValue | null>(null);

/** Shopper's region. The list and FX rates come from the server, and only the choice is stored locally. */
export function RegionProvider({ children }: { children: ReactNode }) {
  const code = useSyncExternalStore(subscribe, readCode, () => DEFAULT_CODE);
  const query = useQuery({
    queryKey: ["regions"],
    queryFn: () => apiGet<{ items: Region[] }>("/api/v1/regions").then((body) => body.items),
    staleTime: 60 * 60 * 1000,
  });
  const regions = useMemo(() => query.data ?? [], [query.data]);
  const region =
    regions.find((item) => item.code === code) ??
    regions.find((item) => item.code === DEFAULT_CODE) ??
    null;
  const setRegionCode = useCallback((next: string) => writeCode(next), []);
  const value = useMemo(
    () => ({ region, regions, setRegionCode }),
    [region, regions, setRegionCode],
  );
  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>;
}

export function useRegion(): RegionValue {
  const value = useContext(RegionContext);
  if (!value) throw new Error("useRegion must be used inside AppProviders");
  return value;
}
