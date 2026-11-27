import { Router } from 'express';
import { reportsController } from './reports.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/daily', reportsController.getDaily);
router.get('/weekly', reportsController.getWeekly);
router.get('/monthly', reportsController.getMonthly);
router.get('/guidance', reportsController.getGuidance);
export default router;
