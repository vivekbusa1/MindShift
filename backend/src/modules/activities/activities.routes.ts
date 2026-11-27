import { Router } from 'express';
import { activitiesController } from './activities.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  createActivitySchema,
  logActivitySchema,
  parseMessageSchema,
} from './activities.schema';

const router = Router();
router.use(authenticate);

// Activity definitions
router.get('/', activitiesController.getActivities);
router.post('/', validate(createActivitySchema), activitiesController.createActivity);
router.put('/:id', activitiesController.updateActivity);
router.delete('/:id', activitiesController.deleteActivity);

// Activity logs
router.get('/logs', activitiesController.getLogs);
router.post('/logs', validate(logActivitySchema), activitiesController.logActivity);
router.put('/logs/:id', activitiesController.updateLog);
router.delete('/logs/:id', activitiesController.deleteLog);

// Natural language parsing
router.post('/logs/parse', validate(parseMessageSchema), activitiesController.parseMessage);

export default router;
