import { Router } from 'express';
import { xOAuthController } from '../controllers/xOAuthController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Initiate X OAuth - requires auth
router.get('/connect', authMiddleware, xOAuthController.connect);

// X OAuth callback - public (Twitter redirects here)
router.get('/callback', xOAuthController.callback);

export default router;
