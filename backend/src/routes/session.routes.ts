import { Router } from 'express';
import { createSession, getSession, completeSession } from '@/controllers/session.controller';

const router = Router();

// Public routes (no authentication required for customers)
router.post('/sessions', createSession);
router.get('/sessions/:token', getSession);
router.patch('/sessions/:token/complete', completeSession);

export default router;
