"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icons";
import { useRegion } from "@/features/regions/region-context";

/** Desktop region and currency dropdown. The list and FX rates come from the server. */
export function RegionMenu() {
  const { region, regions, setRegionCode } = useRegion();
  const [open, setOpen] = useState(false);
  const code = region?.code ?? "US";
  const currency = region?.currency ?? "USD";

  return (
    <div className="region-wrap">
      <button
        type="button"
        className="nav-text-button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Icon.Globe /> {code} · {currency}
      </button>
      <div className={`region-menu ${open ? "is-open" : ""}`}>
        <p className="mega-heading">Region &amp; currency</p>
        {regions.map((option) => (
          <button
            key={option.code}
            type="button"
            className={`region-option ${option.code === code ? "is-active" : ""}`}
            onClick={() => {
              setRegionCode(option.code);
              setOpen(false);
            }}
          >
            <span>{option.label}</span>
            <span className="region-meta">
              {option.currency} · {option.sizeSystem} sizes
            </span>
          </button>
        ))}
        <p className="region-note">
          Prices are converted at a fixed rate and shown for guidance. The amount you pay is set at
          checkout.
        </p>
      </div>
    </div>
  );
}
