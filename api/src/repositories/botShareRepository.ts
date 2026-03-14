import { prisma } from '../utils/prisma.js';

export const botShareRepository = {
  async create(botId: string, userId: string) {
    return prisma.botShare.create({
      data: { botId, userId },
      select: {
        id: true,
        botId: true,
        userId: true,
        createdAt: true,
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  },

  async delete(botId: string, userId: string) {
    return prisma.botShare.delete({
      where: {
        botId_userId: { botId, userId },
      },
    });
  },

  async findByBotId(botId: string) {
    return prisma.botShare.findMany({
      where: { botId },
      select: {
        id: true,
        botId: true,
        userId: true,
        createdAt: true,
        user: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findByBotIdAndUserId(botId: string, userId: string) {
    return prisma.botShare.findUnique({
      where: {
        botId_userId: { botId, userId },
      },
    });
  },

  async findSharedBotsByUserId(userId: string) {
    return prisma.botShare.findMany({
      where: { userId },
      select: {
        bot: {
          select: {
            id: true,
            userId: true,
            xAccountHandle: true,
            prompt: true,
            postMode: true,
            postsPerDay: true,
            minIntervalHours: true,
            preferredHoursStart: true,
            preferredHoursEnd: true,
            active: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};
