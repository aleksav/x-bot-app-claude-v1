import { prisma } from '../utils/prisma.js';
import { postRepository } from '../repositories/postRepository.js';
import { botTipRepository } from '../repositories/botTipRepository.js';
import { botBehaviourRepository } from '../repositories/botBehaviourRepository.js';
import { selectWeightedBehaviour } from '../controllers/botController.js';
import { generateTweet, OUTCOME_PROMPT_KEY_MAP } from '../services/aiService.js';
import { checkAndFlagPost } from '../services/urlValidationService.js';
import { generateLikePostDraft } from '../services/likePostService.js';
import { generateReplyPostDraft } from '../services/replyPostService.js';
import { log } from './activityLog.js';

/**
 * Post generation handler: generates a single draft for one bot.
 * Payload may include { postId } for regeneration of an existing post.
 */
export async function handlePostGeneration(jobId: string): Promise<void> {
  // Fetch the job to get botId and payload
  const job = await prisma.job.findUnique({ where: { id: jobId }, include: { bot: true } });
  if (!job?.bot) {
    log('post-generation', `Job ${jobId}: no bot found, skipping`, 'warn');
    return;
  }

  const bot = job.bot;
  if (!bot.active) {
    log('post-generation', `Bot ${bot.xAccountHandle || bot.id}: not active, skipping`);
    return;
  }

  const payload = job.payload ? (JSON.parse(job.payload) as { postId?: string }) : {};

  const tips = await botTipRepository.findByBotId(bot.id);
  const recentPosts = await postRepository.findRecentByBotId(bot.id, 10);
  const behaviours = await botBehaviourRepository.findActiveByBotId(bot.id);
  const selectedBehaviour = behaviours.length > 0 ? selectWeightedBehaviour(behaviours) : null;

  // Route like_post outcomes to the dedicated handler
  if (selectedBehaviour?.outcome === 'like_post') {
    await generateLikePostDraft(bot, selectedBehaviour, jobId);
    log('post-generation', `Bot ${bot.xAccountHandle || bot.id}: created like_post draft`);
    return;
  }

  // Route reply_to_post outcomes to the dedicated handler
  if (selectedBehaviour?.outcome === 'reply_to_post') {
    await generateReplyPostDraft(bot, selectedBehaviour, jobId);
    log('post-generation', `Bot ${bot.xAccountHandle || bot.id}: created reply_to_post draft`);
    return;
  }

  const effectiveSource =
    selectedBehaviour?.knowledgeSource && selectedBehaviour.knowledgeSource !== 'default'
      ? selectedBehaviour.knowledgeSource
      : bot.knowledgeSource;

  const outcomePromptKey = selectedBehaviour?.outcome
    ? (OUTCOME_PROMPT_KEY_MAP[selectedBehaviour.outcome] ?? 'tweet_generation')
    : 'tweet_generation';

  const result = await generateTweet(
    bot.prompt,
    tips.map((t: { content: string }) => t.content),
    recentPosts.map((p: { content: string }) => p.content),
    selectedBehaviour?.content,
    effectiveSource === 'ai+web',
    outcomePromptKey,
  );

  if (!result.success) {
    throw new Error(`AI generation failed: ${result.error}`);
  }

  if (payload.postId) {
    // Regenerate path: update existing post
    await postRepository.update(payload.postId, {
      content: result.content,
      flagged: false,
      flagReasons: [],
    });
    await checkAndFlagPost(payload.postId);
    log(
      'post-generation',
      `Bot ${bot.xAccountHandle || bot.id}: regenerated post ${payload.postId}`,
    );
  } else {
    // New generation path: create draft
    const post = await postRepository.create({
      botId: bot.id,
      jobId,
      content: result.content,
      status: 'draft',
      scheduledAt: null,
      behaviourPrompt: selectedBehaviour?.content ?? null,
      behaviourTitle: selectedBehaviour?.title || null,
      generationPrompt: result.prompt
        ? JSON.stringify({
            outcome: selectedBehaviour?.outcome ?? 'write_post',
            systemPromptKey: outcomePromptKey,
            messages: result.prompt,
          })
        : null,
    });

    await checkAndFlagPost(post.id);
    log('post-generation', `Bot ${bot.xAccountHandle || bot.id}: created draft post`);
  }
}
