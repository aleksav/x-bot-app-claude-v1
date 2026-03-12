import { v4 as uuidv4 } from 'uuid';
import { jobRepository } from '../repositories/jobRepository.js';
import { postRepository } from '../repositories/postRepository.js';
import { generateTweet } from '../services/aiService.js';
import { computeNextScheduledAt } from '../services/scheduler.js';

const POLL_INTERVAL_MS = parseInt(process.env.WORKER_POLL_INTERVAL_MS || '30000', 10);

let intervalHandle: ReturnType<typeof setInterval> | null = null;
let running = false;

async function processJobs(): Promise<void> {
  if (running) return;
  running = true;

  try {
    const pendingJobs = await jobRepository.findPendingJobs(10);

    for (const job of pendingJobs) {
      const lockToken = uuidv4();
      const claimed = await jobRepository.claimJob(job.id, lockToken);

      if (!claimed) {
        continue;
      }

      try {
        const bot = job.bot;
        const result = await generateTweet(bot.prompt);

        if (!result.success) {
          console.error(`[jobWorker] AI generation failed for job ${job.id}: ${result.error}`);
          await jobRepository.markFailed(job.id);
          continue;
        }

        const postStatus = bot.postMode === 'auto' ? 'scheduled' : 'draft';
        const scheduledAt = bot.postMode === 'auto' ? new Date() : null;

        await postRepository.create({
          botId: bot.id,
          jobId: job.id,
          content: result.content,
          status: postStatus,
          scheduledAt,
        });

        await jobRepository.markCompleted(job.id);

        // Schedule next job
        const nextScheduledAt = computeNextScheduledAt(
          {
            postsPerDay: bot.postsPerDay,
            minIntervalHours: bot.minIntervalHours,
            preferredHoursStart: bot.preferredHoursStart,
            preferredHoursEnd: bot.preferredHoursEnd,
          },
          new Date(),
        );

        await jobRepository.create({
          botId: bot.id,
          scheduledAt: nextScheduledAt,
          status: 'pending',
        });

        console.log(
          `[jobWorker] Job ${job.id} completed. Next job scheduled at ${nextScheduledAt.toISOString()}`,
        );
      } catch (err) {
        console.error(`[jobWorker] Error processing job ${job.id}:`, err);
        await jobRepository.markFailed(job.id);
      }
    }
  } catch (err) {
    console.error('[jobWorker] Error polling for jobs:', err);
  } finally {
    running = false;
  }
}

export function start(): void {
  console.log(`[jobWorker] Starting with poll interval ${POLL_INTERVAL_MS}ms`);
  // Run immediately on start
  void processJobs();
  intervalHandle = setInterval(() => void processJobs(), POLL_INTERVAL_MS);
}

export function stop(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
  console.log('[jobWorker] Stopped');
}
