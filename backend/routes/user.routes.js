import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import User from '../models/User.js';

const router = Router();

// Search users
router.get('/search', auth, async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.length < 2) {
            return res.json({ users: [] });
        }

        const users = await User.find({
            $and: [
                { _id: { $ne: req.user._id } }, // Exclude current user
                {
                    $or: [
                        { username: { $regex: q, $options: 'i' } },
                        { email: { $regex: q, $options: 'i' } }
                    ]
                }
            ]
        })
        .select('username email photoURL status lastSeen')
        .limit(10);

        res.json({ users });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get online users
router.get('/online', auth, async (req, res) => {
    try {
        const onlineUsers = await User.find({
            _id: { $ne: req.user._id }, // Exclude current user
            status: 'online'
        })
        .select('username email photoURL status lastSeen')
        .sort({ lastSeen: -1 });

        res.json({ users: onlineUsers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user status
router.patch('/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!['online', 'offline', 'away'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { 
                status,
                lastSeen: new Date()
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ 
            message: 'Status updated successfully', 
            user: {
                _id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                status: updatedUser.status,
                lastSeen: updatedUser.lastSeen,
                photoURL: updatedUser.photoURL
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Heartbeat to keep user online
router.post('/heartbeat', auth, async (req, res) => {
    try {
        await User.findByIdAndUpdate(
            req.user._id,
            { 
                status: 'online',
                lastSeen: new Date()
            }
        );

        res.json({ message: 'Heartbeat received' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password -__v');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user profile
router.patch('/profile', auth, async (req, res) => {
    try {
        const { username, email, photoURL, displayName } = req.body;
        
        // Only update fields that are provided
        const updateFields = {};
        if (username) updateFields.username = username;
        if (email) updateFields.email = email;
        if (photoURL) updateFields.photoURL = photoURL;
        if (displayName) updateFields.displayName = displayName;

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).select('-password -__v');

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ 
            message: 'Profile updated successfully', 
            user: updatedUser 
        });
    } catch (error) {
        if (error.code === 11000) {
            // Duplicate key error
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ 
                error: `${field} already exists` 
            });
        }
        res.status(500).json({ error: error.message });
    }
});

// Update user password
router.patch('/password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters long' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's chat rooms
router.get('/rooms', auth, async (req, res) => {
    try {
        // TODO: Get user's rooms from database
        res.json({ rooms: [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
