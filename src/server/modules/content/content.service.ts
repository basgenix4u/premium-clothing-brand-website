import { NotFoundError } from "@/server/http/errors";
import type { ContentRepository } from "@/server/modules/content/content.repository";
import { lookItemsSchema } from "@/server/modules/content/content.schemas";
import type { ArticleDto, ArticleSummaryDto, LookDto } from "@/shared/content-dto";

export type { ArticleDto, ArticleSummaryDto, LookDto, LookItemDto } from "@/shared/content-dto";

/** Editorial content: shop-the-look sets and journal articles. */
export class ContentService {
  constructor(private readonly repository: ContentRepository) {}

  async listLooks(): Promise<LookDto[]> {
    const rows = await this.repository.listLooks();
    return rows.map((look) => ({
      slug: look.slug,
      title: look.title,
      season: look.season,
      imageUrl: look.imageUrl,
      copy: look.copy,
      styling: look.styling,
      items: lookItemsSchema.parse(look.items),
    }));
  }

  async listArticles(): Promise<ArticleSummaryDto[]> {
    const rows = await this.repository.listArticles();
    return rows.map(toArticleSummary);
  }

  async getArticle(slug: string): Promise<ArticleDto> {
    const row = await this.repository.findArticle(slug);
    if (!row) throw new NotFoundError("We could not find that story.");
    return { ...toArticleSummary(row), body: row.body, related: row.related };
  }
}

function toArticleSummary(row: {
  slug: string;
  title: string;
  kicker: string;
  readTime: string;
  imageUrl: string;
  excerpt: string;
  publishedAt: Date;
}): ArticleSummaryDto {
  return {
    slug: row.slug,
    title: row.title,
    kicker: row.kicker,
    readTime: row.readTime,
    imageUrl: row.imageUrl,
    excerpt: row.excerpt,
    publishedAt: row.publishedAt.toISOString(),
  };
}
