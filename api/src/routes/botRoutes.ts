import { Router } from 'express';
import { botController } from '../controllers/botController.js';
import { botShareController } from '../controllers/botShareController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All bot routes require authentication
router.use(authMiddleware);

router.post('/', botController.create);
router.get('/', botController.list);
router.get('/:id', botController.getById);
router.patch('/:id', botController.update);

// Share routes
router.post('/:id/shares', botShareController.create);
router.get('/:id/shares', botShareController.list);
router.delete('/:id/shares/:userId', botShareController.remove);

export default router;
