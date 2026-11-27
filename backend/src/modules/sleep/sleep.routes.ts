import { Router } from 'express';
import { sleepController } from './sleep.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { logSleepSchema, updateSleepSchema } from './sleep.schema';

const router = Router();
router.use(authenticate);
router.get('/', sleepController.getSessions);
router.post('/', validate(logSleepSchema), sleepController.logSleep);
router.put('/:id', validate(updateSleepSchema), sleepController.updateSession);
router.delete('/:id', sleepController.deleteSession);
router.get('/analysis', sleepController.getAnalysis);
export default router;
