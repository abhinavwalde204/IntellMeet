import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getAnalyticsSummary, getTeamAnalytics } from '../controllers/analyticsController.js';

const router = express.Router();
router.use(protect);

router.get('/summary', getAnalyticsSummary);
router.get('/team', getTeamAnalytics);

export default router;
