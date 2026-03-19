-- Delete all old jobs (clean slate for new job architecture)
DELETE FROM "Job";

-- Ensure job configs exist for all recurring job types
-- Use ON CONFLICT to avoid duplicates if they already exist
INSERT INTO "JobConfig" ("id", "jobType", "intervalMs", "description", "enabled", "updatedAt", "createdAt")
VALUES
  (gen_random_uuid(), 'scheduler-tick', 900000, 'Checks each active bot pipeline and enqueues post generation when needed', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'post-approver', 900000, 'Auto-approves and schedules drafts for autonomous bots', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'cleanup', 21600000, 'Expires stale drafts, deletes old discarded posts and completed jobs', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("jobType") DO UPDATE SET
  "description" = EXCLUDED."description",
  "updatedAt" = CURRENT_TIMESTAMP;
