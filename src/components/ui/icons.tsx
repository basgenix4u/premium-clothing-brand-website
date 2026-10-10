import type { ReactNode, SVGProps } from "react";

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  "aria-hidden": true as const,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Svg({ children, ...rest }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg {...base} {...rest}>
      {children}
    </svg>
  );
}

/** Stroke icon set ported 1:1 from the prototype. Names match the original `Icon` object. */
export const Icon = {
  ArrowUpRight: ({ className = "icon" }: IconProps) => (
    <Svg className={className}>
      <path d="M5 19 19 5M8 5h11v11" />
    </Svg>
  ),
  ArrowRight: ({ className = "icon" }: IconProps) => (
    <Svg className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  ),
  ArrowLeft: ({ className = "icon" }: IconProps) => (
    <Svg className={className}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </Svg>
  ),
  ChevronDown: ({ className = "icon" }: IconProps) => (
    <Svg className={className}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  ),
  Plus: ({ open = false }: { open?: boolean }) => (
    <Svg className={`icon plus ${open ? "open" : ""}`}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  ),
  Check: ({ className = "check-icon" }: IconProps) => (
    <Svg className={className}>
      <path d="m5 12 4.5 4.5L19 7" />
    </Svg>
  ),
  Search: ({ className = "icon" }: IconProps) => (
    <Svg className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Svg>
  ),
  Close: ({ className = "icon" }: IconProps) => (
    <Svg className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  ),
  Bag: ({ className = "icon" }: IconProps) => (
    <Svg className={className}>
      <path d="M6 8h12l-1 12H7L6 8Z" />
      <path d="M9.5 8V6.5a2.5 2.5 0 0 1 5 0V8" />
    </Svg>
  ),
  Heart: ({ filled = false, className = "icon" }: IconProps & { filled?: boolean }) => (
    <Svg className={className} fill={filled ? "currentColor" : "none"}>
      <path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.6-7 9-7 9Z" />
    </Svg>
  ),
  Filter: ({ className = "icon" }: IconProps) => (
    <Svg className={className}>
      <path d="M4 7h16M7 12h10M10 17h4" />
    </Svg>
  ),
  Globe: ({ className = "icon" }: IconProps) => (
    <Svg className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.6 2.5 14.4 0 17M12 3.5c-2.5 2.6-2.5 14.4 0 17" />
    </Svg>
  ),
  Zoom: ({ className = "icon" }: IconProps) => (
    <Svg className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5M11 8.5v5M8.5 11h5" />
    </Svg>
  ),
  Truck: ({ className = "icon" }: IconProps) => (
    <Svg className={className}>
      <path d="M3 7h10v9H3zM13 10h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17" cy="18" r="1.6" />
    </Svg>
  ),
  Return: ({ className = "icon" }: IconProps) => (
    <Svg className={className}>
      <path d="M4 10h11a4 4 0 0 1 0 8H8" />
      <path d="m4 10 4-4M4 10l4 4" />
    </Svg>
  ),
  Leaf: ({ className = "icon" }: IconProps) => (
    <Svg className={className}>
      <path d="M5 19c9 0 14-5 14-14C9 5 5 10 5 19Z" />
      <path d="M5 19c3-4 6-6 9-7" />
    </Svg>
  ),
  Ruler: ({ className = "icon" }: IconProps) => (
    <Svg className={className}>
      <path d="M4 8h16v8H4z" />
      <path d="M8 8v3M12 8v3M16 8v3" />
    </Svg>
  ),
};
