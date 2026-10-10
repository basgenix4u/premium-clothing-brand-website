import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { RouteReveal } from "@/components/ui/route-reveal";
import { Toaster } from "@/components/ui/toaster";
import { AppProviders } from "@/features/app-providers";

export const metadata: Metadata = {
  title: { default: "Vellum", template: "%s · Vellum" },
  description:
    "Vellum is a premium clothing brand. Outerwear, tailoring, knitwear and denim, built to last.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>
          <span id="top" />
          <Header />
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
          <Footer />
          <Toaster />
          <RouteReveal />
        </AppProviders>
      </body>
    </html>
  );
}
