import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { xOAuthService } from '../services/xOAuthService.js';
import { botRepository } from '../repositories/botRepository.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import { config } from '../config/index.js';

const connectQuerySchema = z.object({
  botId: z.string().min(1, 'botId is required'),
});

const callbackQuerySchema = z.object({
  oauth_token: z.string().min(1),
  oauth_verifier: z.string().min(1),
});

export const xOAuthController = {
  async connect(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { botId } = connectQuerySchema.parse(req.query);

      const bot = await botRepository.findById(botId);
      if (!bot) {
        throw new NotFoundError('Bot not found');
      }
      if (bot.userId !== userId) {
        throw new ForbiddenError('You do not have access to this bot');
      }

      const { oauthToken } = await xOAuthService.getRequestToken(botId);
      const authUrl = xOAuthService.generateAuthUrl(oauthToken);

      res.status(200).json({
        data: { url: authUrl },
      });
    } catch (err) {
      next(err);
    }
  },

  async callback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { oauth_token, oauth_verifier } = callbackQuerySchema.parse(req.query);

      const { accessToken, accessTokenSecret, screenName, botId } =
        await xOAuthService.getAccessToken(oauth_token, oauth_verifier);

      await botRepository.update(botId, {
        xAccessToken: accessToken,
        xAccessSecret: accessTokenSecret,
        xAccountHandle: screenName,
      });

      res.redirect(`${config.app.frontendUrl}/dashboard`);
    } catch (err) {
      next(err);
    }
  },
};
