import { Router } from 'express';
import { goalsController } from './goals.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { updateGoalsSchema } from './goals.schema';

const router = Router();
router.use(authenticate);
router.get('/', goalsController.getGoals);
router.put('/', validate(updateGoalsSchema), goalsController.updateGoals);
export default router;
