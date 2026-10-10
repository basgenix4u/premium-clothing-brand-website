"use client";

import { createElement, useCallback, type ReactNode } from "react";

const seen = new WeakSet<Element>();
let sharedObserver: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            sharedObserver?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
  }
  return sharedObserver;
}

/**
 * Registers every `.reveal` element under `root` with the shared observer. Runs on
 * mount and on each route change, so statically authored markup animates like `<Reveal>`.
 */
export function observeRevealRoot(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>(".reveal:not(.is-visible)").forEach((node) => {
    if (seen.has(node)) return;
    seen.add(node);
    getObserver().observe(node);
    // Safety net: never leave above-the-fold content hidden.
    window.setTimeout(() => {
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight + 200) node.classList.add("is-visible");
    }, 2600);
  });
}

type RevealTag = "div" | "section" | "article" | "li" | "figure";

export function Reveal({
  children,
  delay = 0,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: RevealTag;
}) {
  // Callback ref: observer registration happens when the node mounts, and the cleanup clears the fallback timer.
  const attach = useCallback(
    (node: HTMLElement | null) => {
      if (!node) return undefined;
      if (delay) node.style.transitionDelay = `${delay}ms`;
      if (seen.has(node)) return undefined;
      seen.add(node);
      getObserver().observe(node);
      const fallback = window.setTimeout(() => node.classList.add("is-visible"), 2600);
      return () => window.clearTimeout(fallback);
    },
    [delay],
  );

  return createElement(as, { ref: attach, className: `reveal ${className}` }, children);
}
