/** Static copy for the home page. Policies mirror the prototype and move to the CMS with the legal pages (D7). */

export const POLICIES = {
  returns:
    "30 days to decide. Returns are free within the US, UK and EU — a prepaid label is included in your parcel. Items must be unworn with tags attached.",
  exchanges:
    "Size not right? Exchange within 30 days and we ship the new size before the original arrives back with us.",
  shipping:
    "Orders placed before 1pm local time ship the same working day. Every order is tracked door to door.",
} as const;

export const FAQS = [
  {
    question: "How do I know which size to take?",
    answer:
      "Every product page states the fit, the model's height and the size they wear, and links to a full size guide with body measurements in US, UK, EU and JP units. Still unsure? Write to the studio and we will help you choose before you order.",
  },
  {
    question: "Where does Vellum ship, and what does it cost?",
    answer:
      "We currently show delivery to the US, UK, EU, Japan, Canada and Australia, with per-region speeds and prices in the region selector at the top of the page. Duties and taxes are shown transparently before you check out.",
  },
  {
    question: "How do returns and exchanges work?",
    answer: `${POLICIES.returns} ${POLICIES.exchanges}`,
  },
  {
    question: "How does the Vellum Circle credit work?",
    answer:
      "Circle members receive credit to spend on any piece, first access to limited runs, and free shipping. Membership billing is handled by our checkout provider, so joining goes live once payments are connected.",
  },
  {
    question: "Will you restock sold-out pieces?",
    answer:
      "We produce in considered runs. Save a sold-out piece to your wishlist and switch on back-in-stock alerts — you will be first to know when it returns.",
  },
];

/** Prototype photography, referenced through the Pexels CDN until the brand shoot replaces it (D6). */
const px = (id: number, width: number, height: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${width}&h=${height}`;

export const HOME_IMAGES = {
  hero: px(7817717, 2200, 1500),
  manifesto: px(10211581, 1300, 1500),
  essentials: px(10211580, 1000, 1400),
} as const;

export const VALUE_PROPOSITIONS = [
  {
    title: "Shape-shifting design",
    copy: "Unexpected proportions, clean architecture, and room to make every look distinctly yours.",
  },
  {
    title: "Materials that matter",
    copy: "Responsible fibres, considered weight, and finishes chosen to get better with every wear.",
  },
  {
    title: "Sizing you can trust",
    copy: "Fit notes, model measurements and a four-region size guide on every single product page.",
  },
  {
    title: "Honest availability",
    copy: "Stock counts are per size and per colour. If it is sold out, we say so — and offer an alert.",
  },
] as const;
