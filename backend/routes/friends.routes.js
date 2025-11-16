import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

const router = Router();

// Get all friends for current user
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('friends', 'username email photoURL status')
            .populate({
                path: 'friendRequests.from',
                select: 'username email photoURL status'
            })
            .populate({
                path: 'sentFriendRequests.to',
                select: 'username email photoURL status'
            });

        // Transform friendRequests to include populated from user
        const friendRequests = (user.friendRequests || []).map(req => ({
            _id: req._id,
            from: req.from,
            status: req.status,
            createdAt: req.createdAt
        }));

        // Transform sentFriendRequests to include populated to user
        const sentFriendRequests = (user.sentFriendRequests || []).map(req => ({
            _id: req._id,
            to: req.to,
            status: req.status,
            createdAt: req.createdAt
        }));

        res.json({
            friends: user.friends || [],
            friendRequests: friendRequests,
            sentFriendRequests: sentFriendRequests
        });
    } catch (error) {
        console.error('Error fetching friends:', error);
        res.status(500).json({ error: error.message });
    }
});

// Send friend request
router.post('/request', auth, async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        if (userId === req.user._id.toString()) {
            return res.status(400).json({ error: 'Cannot send friend request to yourself' });
        }

        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if already friends
        const currentUser = await User.findById(req.user._id);
        if (currentUser.friends.includes(userId)) {
            return res.status(400).json({ error: 'Already friends with this user' });
        }

        // Check if friend request already exists
        if (currentUser.sentFriendRequests.some(req => req.to.toString() === userId)) {
            return res.status(400).json({ error: 'Friend request already sent' });
        }

        // Check if target user already sent a request
        if (targetUser.sentFriendRequests.some(req => req.to.toString() === req.user._id.toString())) {
            return res.status(400).json({ error: 'This user already sent you a friend request' });
        }

        // Create friend request
        const friendRequest = {
            from: req.user._id,
            to: userId,
            status: 'pending',
            createdAt: new Date()
        };

        // Add to both users
        await User.findByIdAndUpdate(req.user._id, {
            $push: { sentFriendRequests: friendRequest }
        });

        await User.findByIdAndUpdate(userId, {
            $push: { friendRequests: friendRequest }
        });

        res.status(201).json({ message: 'Friend request sent successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Accept friend request
router.post('/accept', auth, async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Validate userId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        const currentUser = await User.findById(req.user._id);
        if (!currentUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Find friend request - check if request exists
        const friendRequest = currentUser.friendRequests.find(
            req => req.from && req.from.toString() === userId
        );

        if (!friendRequest) {
            return res.status(404).json({ 
                error: 'Friend request not found. The user may not have sent you a friend request.' 
            });
        }

        // Check if already friends
        if (currentUser.friends.some(friendId => friendId.toString() === userId)) {
            // Remove the request if already friends
            await User.findByIdAndUpdate(req.user._id, {
                $pull: { friendRequests: { from: userId } }
            });
            return res.status(400).json({ error: 'You are already friends with this user' });
        }

        // Use User model methods for proper handling
        await currentUser.acceptFriendRequest(userId);

        res.json({ message: 'Friend request accepted successfully' });
    } catch (error) {
        console.error('Error accepting friend request:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to accept friend request' 
        });
    }
});

// Decline friend request
router.post('/decline', auth, async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Remove friend request from both users
        await User.findByIdAndUpdate(req.user._id, {
            $pull: { friendRequests: { from: userId } }
        });

        await User.findByIdAndUpdate(userId, {
            $pull: { sentFriendRequests: { to: req.user._id } }
        });

        res.json({ message: 'Friend request declined successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Remove friend
router.delete('/:friendId', auth, async (req, res) => {
    try {
        const { friendId } = req.params;

        // Remove from friends list for both users
        await User.findByIdAndUpdate(req.user._id, {
            $pull: { friends: friendId }
        });

        await User.findByIdAndUpdate(friendId, {
            $pull: { friends: req.user._id }
        });

        res.json({ message: 'Friend removed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cancel sent friend request
router.delete('/request/:userId', auth, async (req, res) => {
    try {
        const { userId } = req.params;

        // Remove friend request from both users
        await User.findByIdAndUpdate(req.user._id, {
            $pull: { sentFriendRequests: { to: userId } }
        });

        await User.findByIdAndUpdate(userId, {
            $pull: { friendRequests: { from: req.user._id } }
        });

        res.json({ message: 'Friend request cancelled successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
