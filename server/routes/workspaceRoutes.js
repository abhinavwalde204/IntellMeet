import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  inviteMember,
  joinWorkspace
} from '../controllers/workspaceController.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getWorkspaces).post(createWorkspace);
router.route('/:id').get(getWorkspace);
router.post('/:id/invite', inviteMember);
router.post('/join/:token', joinWorkspace);

export default router;
