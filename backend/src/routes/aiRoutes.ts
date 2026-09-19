import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { parseTask, resolveDateTime } from '../controllers/aiController';

const router = Router();

router.use(requireAuth);

router.post('/parse-task', parseTask);
router.post('/resolve-datetime', resolveDateTime);

export default router;
