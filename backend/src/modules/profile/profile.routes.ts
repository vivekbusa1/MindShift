import { Router } from 'express';
import { profileController } from './profile.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { updateProfileSchema, updatePreferencesSchema } from './profile.schema';

const router = Router();
router.use(authenticate);

router.get('/', profileController.getProfile);
router.put('/', validate(updateProfileSchema), profileController.updateProfile);
router.get('/preferences', profileController.getPreferences);
router.put('/preferences', validate(updatePreferencesSchema), profileController.updatePreferences);

export default router;
