import { Icon } from "@/components/ui/icons";
import { LinkButton } from "@/components/ui/link-button";
import { Photo } from "@/components/ui/photo";
import { HOME_IMAGES } from "@/features/home/home-content";
import Link from "next/link";

export function Hero({ availableCount }: { availableCount: number | null }) {
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <Photo
        className="hero-image"
        src={HOME_IMAGES.hero}
        alt="Model in a sculptural crimson Vellum look at night"
      />
      <div className="hero-scrim" />
      <div className="hero-content">
        <p className="hero-kicker entrance entrance-1">FALL / WINTER — NOW LIVE</p>
        <p className="hero-brand entrance entrance-2" aria-hidden="true">
          VELLUM<span>.</span>
        </p>
        <h1 id="hero-title" className="entrance entrance-3">
          Wear your
          <br />
          <em>next chapter.</em>
        </h1>
        <p className="hero-copy entrance entrance-4">
          Outerwear, tailoring, knitwear and denim — built as one wardrobe, so every piece works
          with the last.
        </p>
        <div className="hero-cta entrance entrance-5">
          <LinkButton href="/shop" variant="light">
            Shop the collection <Icon.ArrowRight />
          </LinkButton>
          <Link className="text-link light-link" href="/lookbook">
            See the lookbook <span>01</span>
          </Link>
        </div>
        {availableCount ? (
          <p className="hero-meta entrance entrance-5">
            {availableCount} pieces available now · Free 30-day returns
          </p>
        ) : null}
      </div>
      <a className="scroll-cue entrance entrance-5" href="#shop-by-style">
        <span>Scroll to explore</span>
        <i />
      </a>
    </section>
  );
}

export function Marquee() {
  const line = (
    <>
      <span>MADE FOR NOW</span>
      <b>*</b>
      <span>EVERY STYLE, ONE WARDROBE</span>
      <b>*</b>
      <span>DESIGNED IN NEW YORK</span>
      <b>*</b>
    </>
  );
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {line}
        {line}
      </div>
    </div>
  );
}
