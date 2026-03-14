import { Router } from 'express';
import { userController } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, userController.list);
router.patch('/:id/password', authMiddleware, userController.updatePassword);
router.patch('/:id/archive', authMiddleware, userController.archive);
router.patch('/:id/reinstate', authMiddleware, userController.reinstate);
router.patch('/:id/admin', authMiddleware, userController.setAdmin);

export default router;
