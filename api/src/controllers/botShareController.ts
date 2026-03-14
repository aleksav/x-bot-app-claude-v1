import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { botShareService } from '../services/botShareService.js';
import { uuidSchema, emailSchema } from '../utils/validation.js';

const botIdParamSchema = z.object({
  id: uuidSchema,
});

const shareParamsSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
});

const shareBotSchema = z.object({
  email: emailSchema,
});

export const botShareController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { id: botId } = botIdParamSchema.parse(req.params);
      const { email } = shareBotSchema.parse(req.body);
      const share = await botShareService.shareBot(botId, userId, email);

      res.status(201).json({ data: share });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { id: botId, userId: targetUserId } = shareParamsSchema.parse(req.params);
      await botShareService.unshareBot(botId, userId, targetUserId);

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { id: botId } = botIdParamSchema.parse(req.params);
      const shares = await botShareService.listShares(botId, userId);

      res.status(200).json({ data: shares });
    } catch (err) {
      next(err);
    }
  },
};
