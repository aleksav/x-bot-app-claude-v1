import { Router } from 'express';
import { postController } from '../controllers/postController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All post routes require authentication
router.use(authMiddleware);

router.get('/', postController.list);
router.patch('/:id', postController.update);

export default router;
