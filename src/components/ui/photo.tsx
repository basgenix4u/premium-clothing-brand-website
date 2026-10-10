import type { ImgHTMLAttributes } from "react";

type PhotoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "alt"> & {
  /** Required. Use an empty string only for purely decorative images. */
  alt: string;
};

/**
 * Single entry point for editorial and product photography. Images are currently remote
 * (prototype placeholders). They move to self-hosted assets under decision D6 before launch.
 */
export function Photo({ alt, ...rest }: PhotoProps) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={alt} {...rest} />;
}
