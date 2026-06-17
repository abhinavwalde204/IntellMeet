import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createMeeting,
  getMeetings,
  getMeeting,
  startMeeting,
  endMeeting,
  addTranscript,
  summarizeMeeting,
  updateActionItem
} from '../controllers/meetingController.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getMeetings).post(createMeeting);
router.route('/:id').get(getMeeting);
router.put('/:id/start', startMeeting);
router.put('/:id/end', endMeeting);
router.post('/:id/transcript', addTranscript);
router.post('/:id/summarize', summarizeMeeting);
router.put('/:id/action-items/:itemId', updateActionItem);

export default router;
