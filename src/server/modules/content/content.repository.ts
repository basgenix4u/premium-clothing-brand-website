import type { Db } from "@/server/db/client";

/** Read-only queries for editorial content. Ordering follows the curated `sortOrder`, then publish date. */
export class ContentRepository {
  constructor(private readonly db: Db) {}

  listLooks() {
    return this.db.look.findMany({ orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }] });
  }

  listArticles() {
    return this.db.article.findMany({ orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }] });
  }

  findArticle(slug: string) {
    return this.db.article.findUnique({ where: { slug } });
  }
}
