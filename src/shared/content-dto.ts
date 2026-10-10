/** Editorial content shapes shared by the API and the browser. */
export type LookItemDto = { slug: string; x: number; y: number; label: string };

export type LookDto = {
  slug: string;
  title: string;
  season: string;
  imageUrl: string;
  copy: string;
  styling: string;
  items: LookItemDto[];
};

export type ArticleSummaryDto = {
  slug: string;
  title: string;
  kicker: string;
  readTime: string;
  imageUrl: string;
  excerpt: string;
  publishedAt: string;
};

export type ArticleDto = ArticleSummaryDto & {
  body: string[];
  related: string[];
};
