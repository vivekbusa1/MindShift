import { Router } from 'express';
import { leaderboardController } from './leaderboard.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', leaderboardController.getLeaderboard);
router.get('/me', leaderboardController.getMyRank);
export default router;
