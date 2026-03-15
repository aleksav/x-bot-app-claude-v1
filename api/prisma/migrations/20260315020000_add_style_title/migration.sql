-- AlterTable
ALTER TABLE "BotStyle" ADD COLUMN "title" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Post" ADD COLUMN "styleTitle" TEXT;
