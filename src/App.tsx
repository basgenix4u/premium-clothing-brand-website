import { useEffect, useRef } from "react";
import { StoreProvider, navigate, useRoute, useStore } from "./lib/store";
import { Header } from "./components/Header";
import { CartDrawer, WishlistDrawer } from "./components/CartDrawer";
import { Toaster, LinkButton, Icon, observeRevealRoot } from "./components/ui";
import { HomePage } from "./pages/Home";
import { ShopPage } from "./pages/Shop";
import { ProductPage } from "./pages/Product";
import { JournalPage, LookbookPage, QuizPage, WishlistPage } from "./pages/Discover";

function Routes() {
  const path = useRoute();
  const [pathname, search = ""] = path.split("?");
  const segments = pathname.split("/").filter(Boolean);

  useEffect(() => {
    if (!window.location.hash) window.location.replace("#/");
  }, []);

  // Register scroll-reveal targets whenever the route (or its content) changes.
  useEffect(() => {
    observeRevealRoot();
    const timer = window.setTimeout(observeRevealRoot, 420);
    return () => window.clearTimeout(timer);
  }, [path]);

  let page = <HomePage />;
  if (segments[0] === "shop") page = <ShopPage query={search} />;
  else if (segments[0] === "product" && segments[1]) page = <ProductPage slug={segments[1]} />;
  else if (segments[0] === "wishlist") page = <WishlistPage />;
  else if (segments[0] === "lookbook") page = <LookbookPage />;
  else if (segments[0] === "quiz") page = <QuizPage />;
  else if (segments[0] === "journal") page = <JournalPage slug={segments[1]} />;
  else if (segments.length) {
    page = (
      <div className="page">
        <div className="empty-state">
          <h3>That page does not exist</h3>
          <p>The link may be old, or the piece has moved into the archive.</p>
          <LinkButton to="/" variant="dark">
            Back to the homepage <Icon.ArrowRight />
          </LinkButton>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header path={path} />
      <main id="main-content">{page}</main>
      <Footer />
      <CartDrawer />
      <WishlistDrawer />
      <Toaster />
    </>
  );
}

function Footer() {
  const { setCartOpen, wishlistCount, region } = useStore();
  const pathRef = useRef(useRoute());
  const currentPath = useRoute();
  pathRef.current = currentPath;

  const goToSection = (id: string) => {
    const scroll = () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (pathRef.current !== "/") {
      navigate("/");
      window.setTimeout(scroll, 220);
    } else {
      scroll();
    }
  };

  return (
    <footer className="site-footer">
      <div className="footer-top">
        <a className="footer-wordmark" href="#/">
          VELLUM<span>.</span>
        </a>
        <div className="footer-columns">
          <div>
            <p className="footer-heading">Shop</p>
            <button type="button" onClick={() => navigate("/shop?category=outerwear")}>Outerwear</button>
            <button type="button" onClick={() => navigate("/shop?category=tailoring")}>Tailoring</button>
            <button type="button" onClick={() => navigate("/shop?category=knitwear")}>Knitwear</button>
            <button type="button" onClick={() => navigate("/shop?category=denim")}>Denim</button>
            <button type="button" onClick={() => navigate("/shop?category=accessories")}>Accessories</button>
          </div>
          <div>
            <p className="footer-heading">Discover</p>
            <button type="button" onClick={() => navigate("/lookbook")}>Lookbook</button>
            <button type="button" onClick={() => navigate("/journal")}>Journal</button>
            <button type="button" onClick={() => navigate("/quiz")}>Discover your style</button>
            <button type="button" onClick={() => navigate("/wishlist")}>
              Wishlist{wishlistCount ? ` (${wishlistCount})` : ""}
            </button>
          </div>
          <div>
            <p className="footer-heading">Service</p>
            <button type="button" onClick={() => setCartOpen(true)}>Your bag</button>
            <button type="button" onClick={() => goToSection("faq")}>Delivery &amp; returns</button>
            <button type="button" onClick={() => goToSection("faq")}>Sizing &amp; fit</button>
            <a href="mailto:hello@vellum.example">Contact the studio</a>
            <span className="footer-region">Shopping {region.label} · {region.currency}</span>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Vellum Studio. All rights reserved.</span>
        <div>
          <button type="button" onClick={() => goToSection("faq")}>Privacy</button>
          <button type="button" onClick={() => goToSection("faq")}>Terms</button>
          <button type="button" onClick={() => goToSection("faq")}>Accessibility</button>
        </div>
        <button type="button" className="back-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          Back to top <Icon.ArrowUpRight />
        </button>
      </div>
      <p className="footer-disclaimer">
        Demonstration storefront: product, stock, delivery and promotion data is configured locally, reviews are stored
        in your browser, and no payment provider is connected. Privacy, terms and accessibility pages are not yet
        published — connect a commerce API, checkout and consented email service to go live.
      </p>
    </footer>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Routes />
    </StoreProvider>
  );
}
