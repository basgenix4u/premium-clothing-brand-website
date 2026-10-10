-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "looks" ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0;
