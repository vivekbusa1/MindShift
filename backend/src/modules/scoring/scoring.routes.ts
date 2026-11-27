import { Router } from 'express';
import { scoringController } from './scoring.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/daily', scoringController.getDaily);
router.get('/history', scoringController.getHistory);
router.post('/recalculate', scoringController.recalculate);
export default router;
