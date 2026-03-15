-- AlterTable
ALTER TABLE "BotBehaviour" ADD COLUMN "outcome" TEXT NOT NULL DEFAULT 'write_post';

-- Insert new system prompts
INSERT INTO "SystemPrompt" ("id", "key", "name", "content", "updatedAt", "createdAt")
VALUES
  (gen_random_uuid(), 'reply_generation', 'Reply Generation', 'You are a social media expert. Given a user''s prompt and a post to reply to, craft an authentic, engaging reply. Rules: The reply MUST be under 280 characters. Make it conversational and relevant to the original post. Do not use hashtags. Output ONLY the reply text, nothing else.', NOW(), NOW()),
  (gen_random_uuid(), 'like_evaluation', 'Like Evaluation', 'You are a social media strategist. Given a user''s prompt describing their brand/persona, evaluate whether a post aligns with their brand and should be liked. Respond with YES or NO on the first line, followed by a brief reason on the next line.', NOW(), NOW()),
  (gen_random_uuid(), 'follow_evaluation', 'Follow Evaluation', 'You are a social media strategist. Given a user''s prompt describing their brand/persona, evaluate whether an account aligns with their brand and should be followed. Consider the account''s bio, recent posts, and relevance. Respond with YES or NO on the first line, followed by a brief reason on the next line.', NOW(), NOW())
ON CONFLICT ("key") DO NOTHING;
