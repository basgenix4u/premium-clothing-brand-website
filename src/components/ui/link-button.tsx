import Link from "next/link";
import type { ReactNode } from "react";

export function LinkButton({
  href,
  children,
  variant = "dark",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "dark" | "light" | "ghost";
  className?: string;
}) {
  return (
    <Link href={href} className={`button button-${variant} ${className}`.trim()}>
      {children}
    </Link>
  );
}
