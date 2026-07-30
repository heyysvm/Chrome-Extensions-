import { Router } from 'express';
import { getUserAnalytics } from '../controllers/analyticsController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);
router.get('/', getUserAnalytics);

export default router;
