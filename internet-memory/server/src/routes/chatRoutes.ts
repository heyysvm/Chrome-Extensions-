import { Router } from 'express';
import { chatWithMemory } from '../controllers/chatController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);
router.post('/', chatWithMemory);

export default router;
