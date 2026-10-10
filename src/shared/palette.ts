/** Colour names and swatches. Generated from the seed snapshot; keep ids stable. */
export type ColourDefinition = { id: string; name: string; hex: string };

export const COLOUR_PALETTE: Readonly<Record<string, ColourDefinition>> = {
  ink: { id: "ink", name: "Ink", hex: "#1b1b19" },
  bone: { id: "bone", name: "Bone", hex: "#e8e1d5" },
  camel: { id: "camel", name: "Camel", hex: "#b08a5f" },
  oat: { id: "oat", name: "Oat", hex: "#d6c8b2" },
  charcoal: { id: "charcoal", name: "Charcoal", hex: "#4a4a46" },
  crimson: { id: "crimson", name: "Crimson", hex: "#d93324" },
  espresso: { id: "espresso", name: "Espresso", hex: "#3a2a22" },
  olive: { id: "olive", name: "Olive", hex: "#6a6f4a" },
  indigo: { id: "indigo", name: "Indigo", hex: "#33415c" },
  sage: { id: "sage", name: "Sage", hex: "#9fae94" },
  violet: { id: "violet", name: "Violet", hex: "#7b6ab0" },
  cream: { id: "cream", name: "Cream", hex: "#f4efe4" },
};
