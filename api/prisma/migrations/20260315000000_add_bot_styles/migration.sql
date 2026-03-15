-- CreateTable
CREATE TABLE "BotStyle" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "botId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BotStyle_pkey" PRIMARY KEY ("id")
);

-- AddColumn
ALTER TABLE "Post" ADD COLUMN "stylePrompt" TEXT;

-- AddForeignKey
ALTER TABLE "BotStyle" ADD CONSTRAINT "BotStyle_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
