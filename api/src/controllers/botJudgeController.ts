import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { botJudgeRepository } from '../repositories/botJudgeRepository.js';
import { botRepository } from '../repositories/botRepository.js';
import { botShareRepository } from '../repositories/botShareRepository.js';
import { judgeRepository } from '../repositories/judgeRepository.js';
import { uuidSchema } from '../utils/validation.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.js';

const botIdParamSchema = z.object({
  id: uuidSchema,
});

const botJudgeParamSchema = z.object({
  id: uuidSchema,
  judgeId: uuidSchema,
});

const assignJudgeSchema = z.object({
  judgeId: uuidSchema,
});

async function assertBotAccess(botId: string, userId: string): Promise<void> {
  const bot = await botRepository.findById(botId);
  if (!bot) {
    throw new NotFoundError('Bot not found');
  }
  if (bot.userId !== userId) {
    const share = await botShareRepository.findByBotIdAndUserId(botId, userId);
    if (!share) {
      throw new ForbiddenError('You do not have access to this bot');
    }
  }
}

export const botJudgeController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { id } = botIdParamSchema.parse(req.params);
      await assertBotAccess(id, userId);

      const botJudges = await botJudgeRepository.findByBotId(id);
      res.status(200).json({ data: botJudges });
    } catch (err) {
      next(err);
    }
  },

  async assign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { id } = botIdParamSchema.parse(req.params);
      await assertBotAccess(id, userId);

      const { judgeId } = assignJudgeSchema.parse(req.body);

      // Verify judge exists
      const judge = await judgeRepository.findById(judgeId);
      if (!judge) {
        throw new NotFoundError('Judge not found');
      }

      // Check max 5 judges per bot
      const count = await botJudgeRepository.countByBotId(id);
      if (count >= 5) {
        throw new ValidationError('A bot can have at most 5 judges assigned');
      }

      // Check not already assigned
      const existing = await botJudgeRepository.findByBotIdAndJudgeId(id, judgeId);
      if (existing) {
        throw new ValidationError('Judge is already assigned to this bot');
      }

      const botJudge = await botJudgeRepository.create({ botId: id, judgeId });
      res.status(201).json({ data: botJudge });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { id, judgeId } = botJudgeParamSchema.parse(req.params);
      await assertBotAccess(id, userId);

      const existing = await botJudgeRepository.findByBotIdAndJudgeId(id, judgeId);
      if (!existing) {
        throw new NotFoundError('Judge assignment not found');
      }

      await botJudgeRepository.delete(id, judgeId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
