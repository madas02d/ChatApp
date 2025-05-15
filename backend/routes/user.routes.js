import { Router } from 'express';
import { auth } from '../middleware/auth.js';

const router = Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        // TODO: Get user from database using req.user.userId
        res.json({ user: user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { username, email } = req.body;
        // TODO: Update user in database
        res.json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's chat rooms
router.get('/rooms', auth, async (req, res) => {
    try {
        // TODO: Get user's rooms from database
        res.json({ rooms: rooms });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router; 