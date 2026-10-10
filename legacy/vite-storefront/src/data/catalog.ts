/**
 * VELLUM — catalogue & commerce configuration layer.
 *
 * IMPORTANT (integration note):
 * This module is the single source of truth for product, pricing, shipping, promo
 * and editorial data in the client. There is no backend in this project yet, so the
 * data lives here instead of being fetched. Every consumer goes through
 * `src/lib/commerce.ts` + `src/lib/store.tsx`, so swapping this file for a
 * headless commerce API (Shopify Storefront API, Commerce.js, Sanity + a price
 * service, etc.) requires no UI changes — only replacing the loaders below.
 *
 * Nothing here should be treated as live inventory: stock counts, delivery windows
 * and promo rules are configuration, and must be sourced from the commerce backend
 * before this storefront takes payment.
 */

export type CategoryId =
  | "outerwear"
  | "tailoring"
  | "knitwear"
  | "dresses"
  | "essentials"
  | "denim"
  | "accessories";

export type StyleId = "minimal" | "tailored" | "sport" | "evening" | "utility" | "romantic";
export type Audience = "women" | "men" | "unisex";
export type Badge = "new" | "bestseller" | "limited";
export type ColourId =
  | "ink"
  | "bone"
  | "camel"
  | "oat"
  | "charcoal"
  | "crimson"
  | "espresso"
  | "olive"
  | "indigo"
  | "sage"
  | "violet"
  | "cream";

export type Colour = { id: ColourId; name: string; hex: string };

export type SizeStock = { size: string; stock: number };

export type Variant = {
  id: string;
  colour: ColourId;
  images: string[];
  sizes: SizeStock[];
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  price: number;
  category: CategoryId;
  audience: Audience[];
  styles: StyleId[];
  badges: Badge[];
  releasedAt: string;
  popularity: number;
  description: string;
  details: string[];
  composition: string;
  care: string[];
  fit: { note: string; model: string; runs: string };
  variants: Variant[];
};

export type Look = {
  id: string;
  title: string;
  season: string;
  image: string;
  copy: string;
  styling: string;
  items: { slug: string; x: number; y: number; label: string }[];
};

export type Article = {
  slug: string;
  title: string;
  kicker: string;
  readTime: string;
  image: string;
  excerpt: string;
  body: string[];
  related: string[];
};

export type ShippingOption = { id: string; label: string; eta: string; price: number; note?: string };

export type Region = {
  code: string;
  label: string;
  currency: "USD" | "EUR" | "GBP" | "JPY" | "CAD" | "AUD";
  locale: string;
  /** Units of this currency per 1 USD. Fixed, indicative rate — replace with a live FX feed. */
  rate: number;
  /** Duty/tax presentation rule configured per region. */
  taxNote: string;
  sizeSystem: "US" | "UK" | "EU" | "JP";
  shipping: ShippingOption[];
};

export type PromoRule = {
  code: string;
  kind: "percent" | "fixed" | "shipping";
  value: number;
  minSubtotal: number;
  description: string;
};

const px = (id: number, w = 900, h = 1180) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${h}`;

export const IMAGES = {
  hero: px(7817717, 2200, 1500),
  campaign: px(10211581, 1600, 1100),
  studio: px(10211580, 1200, 1500),
  manifesto: px(10211581, 1300, 1500),
  essentials: px(10211580, 1000, 1400),
  editorial: px(20381280, 1000, 1400),
  night: px(7817714, 1000, 1400),
  journal: px(29503794, 1400, 1000),
  lookbook: px(20413748, 1400, 1000),
  newsletter: px(5618808, 2200, 1500),
};

export const COLOURS: Record<ColourId, Colour> = {
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

export const CATEGORIES: { id: CategoryId; name: string; blurb: string; image: string }[] = [
  { id: "outerwear", name: "Outerwear", blurb: "Coats with architecture", image: px(7760024) },
  { id: "tailoring", name: "Tailoring", blurb: "Soft structure, sharp lines", image: px(19222080) },
  { id: "knitwear", name: "Knitwear", blurb: "Weight, warmth, drape", image: px(19354456) },
  { id: "dresses", name: "Dresses", blurb: "One piece, whole mood", image: px(8441561) },
  { id: "essentials", name: "Essentials", blurb: "The daily foundation", image: px(10211580) },
  { id: "denim", name: "Denim", blurb: "Indigo, honest and worn in", image: px(4271568) },
  { id: "accessories", name: "Accessories", blurb: "Finishing the sentence", image: px(16073739) },
];

export const STYLES: { id: StyleId; name: string; blurb: string }[] = [
  { id: "minimal", name: "Minimal", blurb: "Quiet lines, nothing extra" },
  { id: "tailored", name: "Tailored", blurb: "Precision with softness" },
  { id: "sport", name: "Sport", blurb: "Movement, ease, pace" },
  { id: "evening", name: "Evening", blurb: "After dark drama" },
  { id: "utility", name: "Utility", blurb: "Built for the day" },
  { id: "romantic", name: "Romantic", blurb: "Volume, fluid, tender" },
];

export const SIZE_GUIDE = {
  tops: {
    heading: "Tops, knitwear & outerwear",
    columns: ["Size", "US", "UK", "EU", "JP", "Chest (cm)", "Waist (cm)"],
    rows: [
      ["XS", "0–2", "4–6", "32–34", "5–7", "82–86", "62–66"],
      ["S", "4–6", "8–10", "36–38", "9–11", "88–92", "68–72"],
      ["M", "8–10", "12–14", "40–42", "13–15", "94–98", "74–78"],
      ["L", "12–14", "16–18", "44–46", "17–19", "100–106", "80–86"],
      ["XL", "16–18", "20–22", "48–50", "21–23", "108–114", "88–94"],
    ],
  },
  bottoms: {
    heading: "Trousers, denim & skirts",
    columns: ["Size", "US", "UK", "EU", "JP", "Waist (cm)", "Hip (cm)"],
    rows: [
      ["XS", "24–26", "6–8", "34–36", "5–7", "62–66", "86–90"],
      ["S", "27–28", "10–12", "38–40", "9–11", "68–72", "92–96"],
      ["M", "29–31", "14–16", "42–44", "13–15", "74–78", "98–102"],
      ["L", "32–34", "18–20", "46–48", "17–19", "80–86", "104–110"],
      ["XL", "36–38", "22–24", "50–52", "21–23", "88–94", "112–118"],
    ],
  },
};

const SIZES = ["XS", "S", "M", "L", "XL"];

type Seed = Omit<Product, "id" | "variants"> & {
  variants: { colour: ColourId; images: number[]; stock: number[] }[];
};

const seeds: Seed[] = [
  {
    slug: "meridian-coat",
    name: "The Meridian Coat",
    subtitle: "Double-faced wool contour coat",
    price: 420,
    category: "outerwear",
    audience: ["women", "unisex"],
    styles: ["minimal", "tailored"],
    badges: ["bestseller"],
    releasedAt: "2025-09-18",
    popularity: 96,
    description:
      "Our most-reached-for coat, cut long and clean with a shoulder that sits exactly where it should. Double-faced wool means no lining, no bulk, and a drape that moves when you do.",
    details: ["Concealed press-stud placket", "Deep welt pockets", "Dropped shoulder, relaxed sleeve", "Unlined, clean-finished interior"],
    composition: "78% virgin wool, 22% recycled polyamide. Woven in Italy.",
    care: ["Dry clean by a specialist only", "Steam to release creases", "Store on a broad hanger"],
    fit: { note: "Cut relaxed through the body with a straight line.", model: "Model is 178cm and wears a size S.", runs: "True to size — size down for a closer line." },
    variants: [
      { colour: "camel", images: [7760024, 7760027, 7760014], stock: [2, 6, 9, 4, 0] },
      { colour: "ink", images: [7760014, 7760024], stock: [0, 0, 0, 0, 0] },
      { colour: "bone", images: [7760027, 7760024], stock: [3, 5, 4, 3, 2] },
    ],
  },
  {
    slug: "noire-longline-coat",
    name: "Noire Longline Coat",
    subtitle: "Full-length city coat",
    price: 445,
    category: "outerwear",
    audience: ["women"],
    styles: ["minimal", "evening"],
    badges: ["new"],
    releasedAt: "2025-11-04",
    popularity: 88,
    description:
      "A floor-skimming column in dense wool melton. Built for late trains, cold platforms and entrances you want to make.",
    details: ["Ankle-grazing length", "Single button closure", "Back vent for stride", "Hand-finished collar"],
    composition: "90% wool, 10% cashmere. Woven in Italy.",
    care: ["Dry clean only", "Brush after wear", "Rest 24 hours between wears"],
    fit: { note: "Long and lean, with room for a knit underneath.", model: "Model is 180cm and wears a size S.", runs: "True to size." },
    variants: [
      { colour: "ink", images: [20439798, 33772505], stock: [1, 3, 5, 2, 1] },
      { colour: "espresso", images: [33772505, 6726841], stock: [2, 4, 0, 3, 2] },
    ],
  },
  {
    slug: "signal-jacket",
    name: "Signal Jacket",
    subtitle: "Sharp-shoulder evening jacket",
    price: 520,
    category: "outerwear",
    audience: ["women"],
    styles: ["evening", "tailored"],
    badges: ["limited"],
    releasedAt: "2025-10-22",
    popularity: 82,
    description:
      "The loudest quiet piece in the room. A sculpted shoulder, a cropped hem, and enough weight to hold its shape all night.",
    details: ["Structured shoulder with light padding", "Cropped at the high hip", "Satin-faced lapel", "Hook-and-eye front"],
    composition: "68% wool, 26% polyamide, 6% elastane. Satin: 100% cupro.",
    care: ["Dry clean only", "Do not iron trim", "Store folded to protect the shoulder"],
    fit: { note: "Fitted at the shoulder, cropped at the hem.", model: "Model is 175cm and wears a size S.", runs: "Runs fitted — size up to layer." },
    variants: [
      { colour: "crimson", images: [7817714, 7817717], stock: [2, 3, 2, 1, 0] },
      { colour: "ink", images: [7817717, 7817714], stock: [1, 2, 0, 2, 1] },
    ],
  },
  {
    slug: "atlas-trench",
    name: "Atlas Trench",
    subtitle: "Cotton gabardine trench",
    price: 365,
    category: "outerwear",
    audience: ["women", "unisex"],
    styles: ["utility", "minimal"],
    badges: ["bestseller"],
    releasedAt: "2025-08-11",
    popularity: 91,
    description:
      "The trench, stripped back to what matters: a storm flap, a belt you can knot, and gabardine that shrugs off a shower.",
    details: ["Water-repellent finish", "Removable self belt", "Storm flap and back vent", "Corozo buttons"],
    composition: "100% organic cotton gabardine with a PFC-free water-repellent finish.",
    care: ["Machine wash cold on a gentle cycle", "Line dry", "Warm iron on reverse"],
    fit: { note: "Relaxed and belt-cinched — two shapes in one coat.", model: "Model is 179cm and wears a size S.", runs: "Oversized by design." },
    variants: [
      { colour: "camel", images: [7760014, 7760024], stock: [4, 8, 10, 6, 3] },
      { colour: "sage", images: [7760027, 7760014], stock: [2, 3, 4, 2, 0] },
    ],
  },
  {
    slug: "field-jacket",
    name: "Field Jacket",
    subtitle: "Washed cotton utility jacket",
    price: 265,
    category: "outerwear",
    audience: ["men", "unisex"],
    styles: ["utility", "sport"],
    badges: [],
    releasedAt: "2025-07-29",
    popularity: 74,
    description:
      "Four pockets, one honest jacket. Washed down until it feels like it has already been everywhere with you.",
    details: ["Four utility pockets", "Adjustable hem drawcord", "Two-way zip", "Washed finish, softer with every wash"],
    composition: "100% washed cotton twill, 220gsm.",
    care: ["Machine wash cold", "Tumble dry low", "Warm iron if needed"],
    fit: { note: "Boxy and cropped, roomy through the chest.", model: "Model is 186cm and wears a size M.", runs: "Relaxed — take your usual size." },
    variants: [
      { colour: "olive", images: [16794689, 29503794], stock: [3, 6, 7, 5, 2] },
      { colour: "charcoal", images: [29503794, 16794689], stock: [2, 4, 3, 4, 1] },
    ],
  },
  {
    slug: "after-hours-set",
    name: "After Hours Set",
    subtitle: "Fluid tailoring, two pieces",
    price: 310,
    category: "tailoring",
    audience: ["women"],
    styles: ["evening", "tailored"],
    badges: ["bestseller"],
    releasedAt: "2025-09-30",
    popularity: 94,
    description:
      "A jacket and trouser in fluid crepe that reads as one look and works as two. Wear it together, split it, or sleep in the jacket on the way home.",
    details: ["Sold as a two-piece set", "Elasticated trouser waist", "Unlined jacket", "Packs down for travel"],
    composition: "94% recycled polyester crepe, 6% elastane.",
    care: ["Machine wash cold, mesh bag", "Line dry", "Cool iron"],
    fit: { note: "Fluid and easy through both pieces.", model: "Model is 177cm and wears a size S.", runs: "True to size." },
    variants: [
      { colour: "crimson", images: [7817717, 7817714], stock: [3, 5, 6, 2, 0] },
      { colour: "ink", images: [7817714, 7817717], stock: [2, 4, 4, 3, 1] },
    ],
  },
  {
    slug: "hourglass-blazer",
    name: "Hourglass Blazer",
    subtitle: "Single-button sculpted blazer",
    price: 340,
    category: "tailoring",
    audience: ["women"],
    styles: ["tailored", "minimal"],
    badges: [],
    releasedAt: "2025-06-14",
    popularity: 79,
    description:
      "Nipped at the waist, sharp at the lapel. Cut from a stretch wool blend so it holds a line without holding you back.",
    details: ["Single covered button", "Princess seams for shape", "Functional cuff buttons", "Half-canvas front"],
    composition: "72% wool, 25% polyamide, 3% elastane.",
    care: ["Dry clean only", "Steam to refresh", "Store buttoned on a hanger"],
    fit: { note: "Close to the body through the waist.", model: "Model is 176cm and wears a size S.", runs: "Runs fitted." },
    variants: [
      { colour: "ink", images: [19222080, 20381280], stock: [3, 6, 8, 4, 2] },
      { colour: "bone", images: [20381280, 19222080], stock: [1, 3, 2, 3, 0] },
    ],
  },
  {
    slug: "the-line-pant",
    name: "The Line Pant",
    subtitle: "Precision pleat trouser",
    price: 180,
    category: "tailoring",
    audience: ["women", "unisex"],
    styles: ["tailored", "minimal"],
    badges: ["bestseller"],
    releasedAt: "2025-05-20",
    popularity: 92,
    description:
      "One crisp pleat, a high waist, and a leg that falls straight to the floor. The trouser we build whole outfits around.",
    details: ["Single forward pleat", "High rise, floor length", "Hidden hook-and-bar closure", "Side adjusters"],
    composition: "64% viscose, 34% polyamide, 2% elastane.",
    care: ["Machine wash cold", "Hang to dry", "Warm iron on reverse"],
    fit: { note: "High rise with a long, straight leg.", model: "Model is 178cm and wears a size S.", runs: "True to size. Petite? We offer free hemming." },
    variants: [
      { colour: "ink", images: [19222080, 20413748], stock: [5, 9, 12, 6, 3] },
      { colour: "bone", images: [20413748, 19222080], stock: [2, 4, 5, 2, 1] },
    ],
  },
  {
    slug: "contour-knit-dress",
    name: "Contour Knit Dress",
    subtitle: "Ribbed midi dress",
    price: 245,
    category: "knitwear",
    audience: ["women"],
    styles: ["minimal", "romantic"],
    badges: ["new"],
    releasedAt: "2025-11-12",
    popularity: 85,
    description:
      "A fine rib that follows you, with a hem heavy enough to swing. Warm enough for winter, light enough for inside.",
    details: ["Fine 2x2 rib", "Midi length with a slight flare", "Mock neck", "Fully opaque"],
    composition: "55% merino wool, 45% organic cotton.",
    care: ["Hand wash cold", "Dry flat", "Fold, do not hang"],
    fit: { note: "Close to the body through the bodice, eased at the hem.", model: "Model is 174cm and wears a size S.", runs: "True to size." },
    variants: [
      { colour: "oat", images: [19354456, 6730044], stock: [4, 7, 6, 3, 1] },
      { colour: "charcoal", images: [6730044, 19354456], stock: [2, 5, 4, 2, 0] },
    ],
  },
  {
    slug: "meridian-wool-knit",
    name: "Meridian Wool Knit",
    subtitle: "Heavyweight crewneck",
    price: 195,
    category: "knitwear",
    audience: ["women", "men", "unisex"],
    styles: ["minimal", "sport"],
    badges: ["bestseller"],
    releasedAt: "2025-09-02",
    popularity: 89,
    description:
      "The sweater you reach for first. Dense merino, ribbed cuffs, and a neckline that keeps its shape after a hundred wears.",
    details: ["7-gauge merino", "Ribbed collar, cuffs and hem", "Reinforced shoulder seams", "Machine washable"],
    composition: "100% extra-fine merino wool, mulesing-free.",
    care: ["Machine wash wool cycle, 30°C", "Dry flat", "Do not tumble dry"],
    fit: { note: "Easy through the body with a neat shoulder.", model: "Model is 182cm and wears a size M.", runs: "Relaxed." },
    variants: [
      { colour: "cream", images: [10211580, 19354456], stock: [6, 11, 14, 9, 4] },
      { colour: "oat", images: [19354456, 10211580], stock: [3, 6, 5, 4, 2] },
    ],
  },
  {
    slug: "slate-column-dress",
    name: "Slate Column Dress",
    subtitle: "Bias-cut column",
    price: 285,
    category: "dresses",
    audience: ["women"],
    styles: ["evening", "romantic"],
    badges: [],
    releasedAt: "2025-08-25",
    popularity: 76,
    description:
      "Cut on the bias so it pours rather than hangs. A column that needs nothing but a shoulder and a shoe.",
    details: ["Bias cut", "Cowl back", "Adjustable strap length", "Fully lined bodice"],
    composition: "100% Cupro satin, lining 100% viscose.",
    care: ["Dry clean recommended", "Cool iron on reverse", "Store on a padded hanger"],
    fit: { note: "Skims the body and falls straight.", model: "Model is 179cm and wears a size S.", runs: "True to size." },
    variants: [
      { colour: "bone", images: [8441561, 6730044], stock: [2, 4, 4, 2, 0] },
      { colour: "ink", images: [6730044, 8441561], stock: [1, 3, 3, 2, 1] },
    ],
  },
  {
    slug: "drift-shirt",
    name: "Drift Shirt",
    subtitle: "Oversized poplin shirt",
    price: 125,
    category: "essentials",
    audience: ["women", "men", "unisex"],
    styles: ["minimal", "sport"],
    badges: [],
    releasedAt: "2025-04-16",
    popularity: 83,
    description:
      "Crisp cotton poplin, cut wide and long so it works buttoned, open or thrown over a swimsuit.",
    details: ["Relaxed oversized fit", "Drop shoulder", "Curved shirttail hem", "Mother-of-pearl buttons"],
    composition: "100% organic cotton poplin, GOTS certified.",
    care: ["Machine wash cold", "Tumble dry low", "Warm iron"],
    fit: { note: "Generously oversized.", model: "Model is 175cm and wears a size S.", runs: "Oversized — size down for a classic fit." },
    variants: [
      { colour: "cream", images: [5325899, 17770530], stock: [8, 14, 16, 10, 5] },
      { colour: "indigo", images: [17770530, 5325899], stock: [4, 7, 6, 4, 2] },
    ],
  },
  {
    slug: "studio-heavy-tee",
    name: "Studio Heavy Tee",
    subtitle: "260gsm everyday tee",
    price: 68,
    category: "essentials",
    audience: ["women", "men", "unisex"],
    styles: ["sport", "minimal"],
    badges: ["bestseller"],
    releasedAt: "2025-03-08",
    popularity: 97,
    description:
      "Heavy enough to hold a shape, soft enough to sleep in. The tee we make in the hundreds because you asked.",
    details: ["260gsm jersey", "Boxy body, neat ribbed neck", "Pre-shrunk", "Garment-dyed"],
    composition: "100% long-staple organic cotton.",
    care: ["Machine wash cold, inside out", "Tumble dry low", "Cool iron"],
    fit: { note: "Boxy with a slightly cropped body.", model: "Model is 170cm and wears a size S.", runs: "Boxy — true to size." },
    variants: [
      { colour: "cream", images: [10211580, 10211581], stock: [12, 20, 24, 15, 8] },
      { colour: "ink", images: [10211581, 10211580], stock: [9, 16, 18, 12, 6] },
    ],
  },
  {
    slug: "atlas-straight-jean",
    name: "Atlas Straight Jean",
    subtitle: "Rigid straight-leg denim",
    price: 155,
    category: "denim",
    audience: ["women", "men", "unisex"],
    styles: ["utility", "minimal"],
    badges: [],
    releasedAt: "2025-06-02",
    popularity: 80,
    description:
      "Rigid Japanese-style denim with a straight leg and a high waist. Fades where you fold, softens where you move.",
    details: ["13.5oz rigid denim", "High rise, straight leg", "Button fly", "Chain-stitched hem"],
    composition: "99% organic cotton, 1% elastane.",
    care: ["Wash rarely, cold, inside out", "Line dry", "Fades are yours to keep"],
    fit: { note: "High rise with a true straight leg.", model: "Model is 180cm and wears a size S.", runs: "Rigid — takes a week to break in." },
    variants: [
      { colour: "indigo", images: [4271568, 5325899], stock: [5, 10, 12, 7, 3] },
      { colour: "charcoal", images: [5325899, 4271568], stock: [3, 6, 5, 4, 2] },
    ],
  },
  {
    slug: "motion-trouser",
    name: "Motion Trouser",
    subtitle: "Technical pleated trouser",
    price: 140,
    category: "essentials",
    audience: ["women", "men", "unisex"],
    styles: ["sport", "utility"],
    badges: ["new"],
    releasedAt: "2025-11-20",
    popularity: 71,
    description:
      "A trouser shaped like tailoring and built like kit. Four-way stretch, elastic cuff, and a leg you can cycle in.",
    details: ["Four-way stretch woven", "Elasticated cuff", "Zip pocket at the back", "Water-repellent finish"],
    composition: "82% recycled polyamide, 18% elastane.",
    care: ["Machine wash cold", "Line dry", "Do not iron print"],
    fit: { note: "Relaxed at the hip, tapered at the ankle.", model: "Model is 181cm and wears a size M.", runs: "True to size." },
    variants: [
      { colour: "charcoal", images: [30742691, 17770530], stock: [4, 8, 9, 5, 2] },
      { colour: "olive", images: [17770530, 30742691], stock: [2, 5, 4, 3, 1] },
    ],
  },
  {
    slug: "vanguard-coord",
    name: "Vanguard Co-ord",
    subtitle: "Printed shirt and trouser",
    price: 230,
    category: "essentials",
    audience: ["men", "unisex"],
    styles: ["sport", "evening"],
    badges: ["limited"],
    releasedAt: "2025-10-08",
    popularity: 68,
    description:
      "A print, twice. Wear it loud as a set or split it across a week of plain pieces.",
    details: ["Matching shirt and trouser", "Camp collar", "Elasticated waist trouser", "Limited run of 200 sets"],
    composition: "100% LENZING™ ECOVERO™ viscose.",
    care: ["Machine wash cold", "Line dry", "Cool iron"],
    fit: { note: "Relaxed shirt, straight trouser.", model: "Model is 184cm and wears a size M.", runs: "True to size." },
    variants: [
      { colour: "violet", images: [17770529, 17770530], stock: [2, 4, 4, 2, 0] },
      { colour: "olive", images: [17770530, 17770529], stock: [1, 3, 3, 2, 1] },
    ],
  },
  {
    slug: "vesper-shoulder-bag",
    name: "Vesper Shoulder Bag",
    subtitle: "Structured leather shoulder bag",
    price: 210,
    category: "accessories",
    audience: ["women", "unisex"],
    styles: ["minimal", "evening"],
    badges: ["bestseller"],
    releasedAt: "2025-07-15",
    popularity: 86,
    description:
      "One compartment, one strap, no hardware to rattle. Vegetable-tanned leather that takes on the shape of your day.",
    details: ["Vegetable-tanned leather", "Magnetic closure", "Suede-lined interior", "Fits a 13\" laptop"],
    composition: "Full-grain vegetable-tanned leather, brass hardware, suede lining.",
    care: ["Wipe with a dry cloth", "Condition twice a year", "Keep out of direct sun"],
    fit: { note: "Shoulder or cross-body wear.", model: "Strap drop 58cm.", runs: "One size." },
    variants: [
      { colour: "ink", images: [16073739, 16794733], stock: [14] },
      { colour: "espresso", images: [16794733, 16073739], stock: [7] },
    ],
  },
  {
    slug: "dusk-wool-scarf",
    name: "Dusk Wool Scarf",
    subtitle: "Brushed lambswool scarf",
    price: 95,
    category: "accessories",
    audience: ["women", "men", "unisex"],
    styles: ["minimal", "romantic"],
    badges: [],
    releasedAt: "2025-09-26",
    popularity: 64,
    description:
      "Brushed until it is almost weightless, then fringed by hand. Long enough to loop twice.",
    details: ["200 x 40cm", "Hand-knotted fringe", "Brushed finish", "Woven in Scotland"],
    composition: "100% brushed lambswool.",
    care: ["Hand wash cold", "Dry flat", "Do not wring"],
    fit: { note: "One size, 200 x 40cm.", model: "—", runs: "One size." },
    variants: [
      { colour: "camel", images: [20413748, 20381280], stock: [22] },
      { colour: "crimson", images: [20381280, 20413748], stock: [0] },
    ],
  },
];

export const PRODUCTS: Product[] = seeds.map((seed) => ({
  ...seed,
  id: seed.slug,
  variants: seed.variants.map((variant) => ({
    id: `${seed.slug}-${variant.colour}`,
    colour: variant.colour,
    images: variant.images.map((id) => px(id)),
    sizes:
      seed.category === "accessories" && variant.stock.length === 1
        ? [{ size: "One size", stock: variant.stock[0] }]
        : SIZES.map((size, i) => ({ size, stock: variant.stock[i] ?? 0 })),
  })),
}));

export const LOOKS: Look[] = [
  {
    id: "city-editorial",
    title: "The City Edit",
    season: "Fall / Winter — Look 01",
    image: px(7760024, 1200, 900),
    copy: "Camel over ink, one pleat, no noise. Built for a day that ends somewhere better than it started.",
    styling: "Keep the coat open and let the pleat do the work. Add the scarf only when the wind says so.",
    items: [
      { slug: "meridian-coat", x: 44, y: 30, label: "Coat" },
      { slug: "the-line-pant", x: 60, y: 62, label: "Trouser" },
      { slug: "meridian-wool-knit", x: 40, y: 45, label: "Knit" },
      { slug: "vesper-shoulder-bag", x: 72, y: 55, label: "Bag" },
    ],
  },
  {
    id: "after-dark",
    title: "After Dark",
    season: "Fall / Winter — Look 02",
    image: px(7817717, 1200, 900),
    copy: "Crimson, cropped and unbothered. The set you wear to the thing you actually wanted to go to.",
    styling: "One strong colour, black shoes, hair up. Nothing else required.",
    items: [
      { slug: "after-hours-set", x: 50, y: 42, label: "Set" },
      { slug: "signal-jacket", x: 38, y: 28, label: "Jacket" },
      { slug: "slate-column-dress", x: 66, y: 55, label: "Dress" },
      { slug: "vesper-shoulder-bag", x: 74, y: 70, label: "Bag" },
    ],
  },
  {
    id: "soft-structure",
    title: "Soft Structure",
    season: "Fall / Winter — Look 03",
    image: px(10211580, 1200, 900),
    copy: "Cream on cream, rib and poplin. The quiet uniform for people with too much to do.",
    styling: "Layer the knit under the shirt and let the collar sit flat. Swap the jean for the pant at night.",
    items: [
      { slug: "studio-heavy-tee", x: 34, y: 38, label: "Tee" },
      { slug: "meridian-wool-knit", x: 52, y: 30, label: "Knit" },
      { slug: "drift-shirt", x: 66, y: 45, label: "Shirt" },
      { slug: "atlas-straight-jean", x: 46, y: 70, label: "Denim" },
    ],
  },
  {
    id: "field-notes",
    title: "Field Notes",
    season: "Fall / Winter — Look 04",
    image: px(16794689, 1200, 900),
    copy: "Utility, but polite. Four pockets, one drawcord, and a trouser that moves at your pace.",
    styling: "Roll the jacket sleeves once. Cinch the hem if the weather turns.",
    items: [
      { slug: "field-jacket", x: 48, y: 32, label: "Jacket" },
      { slug: "motion-trouser", x: 54, y: 66, label: "Trouser" },
      { slug: "atlas-straight-jean", x: 34, y: 68, label: "Denim" },
      { slug: "dusk-wool-scarf", x: 70, y: 30, label: "Scarf" },
    ],
  },
];

export const ARTICLES: Article[] = [
  {
    slug: "how-to-layer-without-bulk",
    title: "How to layer without the bulk",
    kicker: "Styling",
    readTime: "4 min",
    image: px(19354456, 1200, 900),
    excerpt:
      "Three thin layers beat two thick ones. Here is the order we build in, and the one piece that quietly does most of the work.",
    body: [
      "Start with the finest layer you own and work outward in weight. A merino crew under a poplin shirt under a wool coat will always look sharper than a chunky knit under a padded jacket, because each layer keeps its own shape.",
      "Keep the shoulders consistent. If the outer layer has a dropped shoulder, the piece beneath it must too, or the sleeve will bunch at the armhole and add visual weight you never asked for.",
      "Leave one thing unfinished. An unbuttoned cuff, an open collar, a hem left loose. Precision everywhere reads as effort; one loose end reads as confidence.",
    ],
    related: ["meridian-wool-knit", "drift-shirt", "meridian-coat"],
  },
  {
    slug: "the-case-for-one-good-coat",
    title: "The case for one good coat",
    kicker: "Craft",
    readTime: "5 min",
    image: px(7760027, 1200, 900),
    excerpt:
      "Double-faced wool has no lining, no glue and no shortcuts. We explain why that changes how a coat falls — and how long it lasts.",
    body: [
      "A double-faced fabric is woven twice and joined in the middle, so there is no separate lining and no fusible interlining holding the front panel in shape. The result is a coat that drapes from the shoulder instead of standing away from the body.",
      "Because the seams are sewn and then closed by hand, the join lies flat and never bubbles after dry cleaning. It is slower and more expensive to make, which is exactly why so few coats are made this way.",
      "Look after it simply: brush after wear, rest it a day between wears, and dry clean no more than twice a season. A good coat should outlive the trend that brought you to it.",
    ],
    related: ["meridian-coat", "noire-longline-coat", "dusk-wool-scarf"],
  },
  {
    slug: "dressing-for-a-day-with-two-plans",
    title: "Dressing for a day with two plans",
    kicker: "Styling",
    readTime: "3 min",
    image: px(20413748, 1200, 900),
    excerpt:
      "Desk, then dinner, then whatever comes after. The three-piece formula we use when the day refuses to stay in one lane.",
    body: [
      "Choose one base that works hard — a fluid trouser or a straight jean — then build two tops around it. The first should be quiet enough for a morning, the second strong enough for a night.",
      "Outerwear is your pivot. A long coat over a plain tee is a completely different sentence to the same tee under a cropped, sharp-shoulder jacket. Change only that and you have changed the whole look.",
      "Shoes and one accessory carry the rest. Keep them deliberate, and let the clothes stay easy.",
    ],
    related: ["the-line-pant", "signal-jacket", "contour-knit-dress"],
  },
];

export const REGIONS: Region[] = [
  {
    code: "US",
    label: "United States",
    currency: "USD",
    locale: "en-US",
    rate: 1,
    taxNote: "Sales tax calculated at checkout.",
    sizeSystem: "US",
    shipping: [
      { id: "us-standard", label: "Standard", eta: "3–5 business days", price: 0 },
      { id: "us-express", label: "Express", eta: "1–2 business days", price: 18 },
    ],
  },
  {
    code: "GB",
    label: "United Kingdom",
    currency: "GBP",
    locale: "en-GB",
    rate: 0.79,
    taxNote: "VAT included. No duties on orders under £135.",
    sizeSystem: "UK",
    shipping: [
      { id: "gb-standard", label: "Standard", eta: "3–5 business days", price: 12 },
      { id: "gb-express", label: "Express", eta: "1–2 business days", price: 22 },
    ],
  },
  {
    code: "EU",
    label: "European Union",
    currency: "EUR",
    locale: "de-DE",
    rate: 0.92,
    taxNote: "VAT included. Duties prepaid by Vellum.",
    sizeSystem: "EU",
    shipping: [
      { id: "eu-standard", label: "Standard", eta: "4–6 business days", price: 10 },
      { id: "eu-express", label: "Express", eta: "2–3 business days", price: 24 },
    ],
  },
  {
    code: "JP",
    label: "Japan",
    currency: "JPY",
    locale: "ja-JP",
    rate: 152,
    taxNote: "Consumption tax included. Duties prepaid by Vellum.",
    sizeSystem: "JP",
    shipping: [{ id: "jp-standard", label: "Standard", eta: "5–8 business days", price: 15 }],
  },
  {
    code: "CA",
    label: "Canada",
    currency: "CAD",
    locale: "en-CA",
    rate: 1.36,
    taxNote: "Duties and taxes calculated at checkout.",
    sizeSystem: "US",
    shipping: [{ id: "ca-standard", label: "Standard", eta: "4–7 business days", price: 14 }],
  },
  {
    code: "AU",
    label: "Australia",
    currency: "AUD",
    locale: "en-AU",
    rate: 1.52,
    taxNote: "GST included. Duties prepaid by Vellum.",
    sizeSystem: "UK",
    shipping: [{ id: "au-standard", label: "Standard", eta: "6–9 business days", price: 18 }],
  },
];

export const PROMO_RULES: PromoRule[] = [
  { code: "WELCOME10", kind: "percent", value: 10, minSubtotal: 0, description: "10% off your first order." },
  { code: "CIRCLE15", kind: "percent", value: 15, minSubtotal: 300, description: "15% off orders over $300 for Circle members." },
  { code: "FREESHIP", kind: "shipping", value: 0, minSubtotal: 150, description: "Complimentary shipping over $150." },
];

export const POLICIES = {
  returns:
    "30 days to decide. Returns are free within the US, UK and EU — a prepaid label is included in your parcel. Items must be unworn with tags attached.",
  exchanges:
    "Size not right? Exchange within 30 days and we ship the new size before the original arrives back with us.",
  shipping:
    "Orders placed before 1pm local time ship the same working day. Every order is tracked door to door.",
  support:
    "Our studio team answers every message. Write to hello@vellum.example — expect a reply within one working day.",
  payments:
    "Payment is handled by our checkout provider at the final step. Cards, Apple Pay, Google Pay and PayPal are supported where available.",
};

export const QUIZ: {
  id: string;
  question: string;
  options: { label: string; value: string; styles: StyleId[]; categories?: CategoryId[] }[];
}[] = [
  {
    id: "moment",
    question: "Where does most of your week actually go?",
    options: [
      { label: "Meetings, then more meetings", value: "work", styles: ["tailored", "minimal"] },
      { label: "Studio, street, somewhere in between", value: "city", styles: ["utility", "sport"] },
      { label: "Nights out and long dinners", value: "night", styles: ["evening", "romantic"] },
      { label: "Wherever the day takes me", value: "mixed", styles: ["minimal", "sport", "utility"] },
    ],
  },
  {
    id: "silhouette",
    question: "Which line do you want your clothes to draw?",
    options: [
      { label: "Sharp and structured", value: "structure", styles: ["tailored", "evening"] },
      { label: "Soft and easy", value: "soft", styles: ["romantic", "minimal"] },
      { label: "Loose and practical", value: "loose", styles: ["utility", "sport"] },
    ],
  },
  {
    id: "colour",
    question: "Choose a palette.",
    options: [
      { label: "Ink, bone, nothing loud", value: "neutral", styles: ["minimal", "tailored"] },
      { label: "Camel, oat, warm neutral", value: "warm", styles: ["romantic", "utility"] },
      { label: "One strong colour", value: "bold", styles: ["evening", "sport"] },
    ],
  },
  {
    id: "priority",
    question: "What should your clothes do best?",
    options: [
      { label: "Last forever", value: "longevity", styles: ["minimal", "tailored"], categories: ["outerwear", "knitwear"] },
      { label: "Move with me", value: "movement", styles: ["sport", "utility"], categories: ["essentials", "denim"] },
      { label: "Turn heads", value: "impact", styles: ["evening", "romantic"], categories: ["dresses", "tailoring"] },
    ],
  },
];

export const productBySlug = (slug: string) => PRODUCTS.find((product) => product.slug === slug);
