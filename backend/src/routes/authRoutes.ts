import { Router } from 'express';
import { register, login, googleAuth, me, updateMe } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', requireAuth, me);
router.put('/me', requireAuth, updateMe);

export default router;
