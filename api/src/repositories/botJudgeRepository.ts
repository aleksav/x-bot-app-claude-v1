import { prisma } from '../utils/prisma.js';

export const botJudgeRepository = {
  async findByBotId(botId: string) {
    return prisma.botJudge.findMany({
      where: { botId },
      include: { judge: true },
      orderBy: { createdAt: 'asc' },
    });
  },

  async countByBotId(botId: string) {
    return prisma.botJudge.count({ where: { botId } });
  },

  async findByBotIdAndJudgeId(botId: string, judgeId: string) {
    return prisma.botJudge.findUnique({
      where: { botId_judgeId: { botId, judgeId } },
    });
  },

  async create(data: { botId: string; judgeId: string }) {
    return prisma.botJudge.create({
      data: {
        botId: data.botId,
        judgeId: data.judgeId,
      },
      include: { judge: true },
    });
  },

  async delete(botId: string, judgeId: string) {
    return prisma.botJudge.delete({
      where: { botId_judgeId: { botId, judgeId } },
    });
  },
};
