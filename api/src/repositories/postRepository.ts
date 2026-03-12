import { prisma } from '../utils/prisma.js';

export const postRepository = {
  async create(data: {
    botId: string;
    jobId: string;
    content: string;
    status: string;
    scheduledAt?: Date | null;
  }) {
    return prisma.post.create({
      data: {
        botId: data.botId,
        jobId: data.jobId,
        content: data.content,
        status: data.status,
        scheduledAt: data.scheduledAt ?? null,
      },
    });
  },

  async findByStatus(status: string, limit = 50) {
    return prisma.post.findMany({
      where: { status },
      take: limit,
      orderBy: { scheduledAt: 'asc' },
    });
  },

  async updateStatus(
    id: string,
    status: string,
    extra?: { publishedAt?: Date; scheduledAt?: Date },
  ) {
    return prisma.post.update({
      where: { id },
      data: {
        status,
        ...extra,
      },
    });
  },
};
