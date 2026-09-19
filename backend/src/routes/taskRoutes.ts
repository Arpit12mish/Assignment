import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  listTasks,
  createTask,
  updateTask,
  toggleComplete,
  deleteTask,
} from '../controllers/taskController';

const router = Router();

router.use(requireAuth);

router.get('/', listTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.patch('/:id/complete', toggleComplete);
router.delete('/:id', deleteTask);

export default router;
