import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  batchCreateTasks
} from '../controllers/taskController.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getTasks).post(createTask);
router.post('/batch', batchCreateTasks);
router.route('/:id').put(updateTask).patch(updateTask).delete(deleteTask);


export default router;
