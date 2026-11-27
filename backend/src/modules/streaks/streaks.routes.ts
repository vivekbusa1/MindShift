import { Router } from 'express';
import { streaksController } from './streaks.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', streaksController.getStreak);
router.get('/calendar', streaksController.getCalendar);
router.get('/shields', streaksController.getShields);
router.post('/shields/use', streaksController.useShield);
export default router;
