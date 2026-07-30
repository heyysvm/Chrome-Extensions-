import { Router } from 'express';
import { createCollection, getCollections, deleteCollection, addPageToCollection } from '../controllers/collectionController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.post('/', createCollection);
router.get('/', getCollections);
router.delete('/:id', deleteCollection);
router.post('/:id/pages', addPageToCollection);

export default router;
