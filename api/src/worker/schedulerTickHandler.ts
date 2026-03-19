import { prisma } from '../utils/prisma.js';
import { postRepository } from '../repositories/postRepository.js';
import { jobRepository } from '../repositories/jobRepository.js';
import { log } from './activityLog.js';

/**
 * Scheduler tick: for each active bot (with-approval or auto mode),
 * checks the pipeline count gate and enqueues post-generation jobs.
 */
export async function handleSchedulerTick(_jobId: string): Promise<void> {
  const bots = await prisma.bot.findMany({
    where: {
      active: true,
      postMode: { in: ['with-approval', 'auto'] },
      user: { archivedAt: null },
      xAccessToken: { not: '' },
    },
  });

  log('scheduler-tick', `Checking ${bots.length} active bot(s)`);

  let enqueued = 0;
  let skipped = 0;

  for (const bot of bots) {
    try {
      // Pipeline count gate
      const pipelineCount = await getPipelineCount(bot.id);
      const dailyTarget = bot.postsPerDay;
      const generationBuffer = 1; // default buffer
      if (pipelineCount >= dailyTarget + generationBuffer) {
        skipped++;
        continue;
      }

      // Check if today's published count has reached postsPerDay (with ±10% jitter)
      const jitteredCap = Math.max(1, Math.round(bot.postsPerDay * (0.9 + Math.random() * 0.2)));
      const todayPublished = await postRepository.countPublishedByBotSince(
        bot.id,
        getStartOfTodayUtc(),
      );
      if (todayPublished >= jitteredCap) {
        skipped++;
        continue;
      }

      // Enqueue post-generation with idempotency key
      const slotKey = new Date().toISOString().slice(0, 13); // e.g. "2026-03-19T14"
      const idempotencyKey = `post-gen:${bot.id}:${slotKey}`;

      const created = await jobRepository.createIdempotent({
        type: 'post-generation',
        botId: bot.id,
        scheduledAt: new Date(),
        idempotencyKey,
      });

      if (created) {
        enqueued++;
        log('scheduler-tick', `Enqueued post-generation for bot ${bot.xAccountHandle || bot.id}`);
      } else {
        skipped++;
      }
    } catch (err) {
      log(
        'scheduler-tick',
        `Bot ${bot.xAccountHandle || bot.id}: error — ${err instanceof Error ? err.message : String(err)}`,
        'error',
      );
    }
  }

  log('scheduler-tick', `Completed: ${enqueued} enqueued, ${skipped} skipped`);
}

async function getPipelineCount(botId: string): Promise<number> {
  const startOfToday = getStartOfTodayUtc();

  // drafts + approved (in pipeline)
  const inPipeline = await prisma.post.count({
    where: {
      botId,
      status: { in: ['draft', 'approved'] },
    },
  });

  // published today
  const publishedToday = await prisma.post.count({
    where: {
      botId,
      status: 'published',
      publishedAt: { gte: startOfToday },
    },
  });

  return inPipeline + publishedToday;
}

function getStartOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
