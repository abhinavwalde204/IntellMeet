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
  updateActionItem,
  deleteMeeting,
  getParticipants,
  getMessages,
  addMessage
} from '../controllers/meetingController.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getMeetings).post(createMeeting);
router.route('/:id').get(getMeeting).delete(deleteMeeting);
router.put('/:id/start', startMeeting);
router.put('/:id/end', endMeeting);
router.post('/:id/transcript', addTranscript);
router.post('/:id/summarize', summarizeMeeting);
router.put('/:id/action-items/:itemId', updateActionItem);
router.get('/:id/participants', getParticipants);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', addMessage);

export default router;
