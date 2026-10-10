import type { Metadata } from "next";
import { HomeView } from "@/components/home/home-view";

export const metadata: Metadata = {
  title: "Wear your next chapter",
  description:
    "Outerwear, tailoring, knitwear and denim, built as one wardrobe so every piece works with the last.",
};

export default function HomePage() {
  return <HomeView />;
}
