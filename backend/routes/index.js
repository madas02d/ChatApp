import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import roomRoutes from './room.routes.js';
import messageRoutes from './message.routes.js';
import conversationRoutes from './conversation.routes.js';
import friendsRoutes from './friends.routes.js';
import uploadRoutes from './upload.routes.js';
import callRoutes from './call.routes.js';

const router = Router();

// Health check route
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/rooms', roomRoutes);
router.use('/messages', messageRoutes);
router.use('/conversations', conversationRoutes);
router.use('/friends', friendsRoutes);
router.use('/upload', uploadRoutes);
router.use('/calls', callRoutes);

export default router;
