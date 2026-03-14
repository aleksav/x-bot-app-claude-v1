import { prisma } from '../utils/prisma.js';
import { botRepository } from '../repositories/botRepository.js';
import { botShareRepository } from '../repositories/botShareRepository.js';
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/errors.js';

export const botShareService = {
  async shareBot(botId: string, ownerUserId: string, targetEmail: string) {
    const bot = await botRepository.findById(botId);
    if (!bot) {
      throw new NotFoundError('Bot not found');
    }
    if (bot.userId !== ownerUserId) {
      throw new ForbiddenError('Only the bot owner can share this bot');
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: targetEmail },
      select: { id: true, email: true, name: true },
    });
    if (!targetUser) {
      throw new NotFoundError('User not found with that email');
    }

    if (targetUser.id === ownerUserId) {
      throw new ConflictError('Cannot share a bot with yourself');
    }

    const existing = await botShareRepository.findByBotIdAndUserId(botId, targetUser.id);
    if (existing) {
      throw new ConflictError('Bot is already shared with this user');
    }

    return botShareRepository.create(botId, targetUser.id);
  },

  async unshareBot(botId: string, ownerUserId: string, targetUserId: string) {
    const bot = await botRepository.findById(botId);
    if (!bot) {
      throw new NotFoundError('Bot not found');
    }
    if (bot.userId !== ownerUserId) {
      throw new ForbiddenError('Only the bot owner can unshare this bot');
    }

    const existing = await botShareRepository.findByBotIdAndUserId(botId, targetUserId);
    if (!existing) {
      throw new NotFoundError('Share not found');
    }

    await botShareRepository.delete(botId, targetUserId);
  },

  async listShares(botId: string, requestingUserId: string) {
    const bot = await botRepository.findById(botId);
    if (!bot) {
      throw new NotFoundError('Bot not found');
    }

    // Owner or shared user can view shares
    if (bot.userId !== requestingUserId) {
      const share = await botShareRepository.findByBotIdAndUserId(botId, requestingUserId);
      if (!share) {
        throw new ForbiddenError('You do not have access to this bot');
      }
    }

    return botShareRepository.findByBotId(botId);
  },
};
