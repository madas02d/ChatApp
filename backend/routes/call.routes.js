import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

const router = Router();

// Store active calls in memory (in production, use Redis or database)
const activeCalls = new Map();

// Initiate a call
router.post('/initiate', auth, async (req, res) => {
    try {
        const { otherUserId, callType } = req.body; // callType: 'video' or 'audio'
        
        if (!otherUserId || !callType) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!['video', 'audio'].includes(callType)) {
            return res.status(400).json({ error: 'Invalid call type' });
        }

        const callerId = req.user._id.toString();
        const callId = `${callerId}-${otherUserId}-${Date.now()}`;

        // Store call info
        activeCalls.set(callId, {
            callId,
            callerId,
            receiverId: otherUserId,
            callType,
            status: 'ringing',
            createdAt: new Date()
        });

        // Set timeout to expire call after 60 seconds if not answered
        setTimeout(() => {
            if (activeCalls.has(callId) && activeCalls.get(callId).status === 'ringing') {
                activeCalls.delete(callId);
            }
        }, 60000);

        res.json({
            callId,
            message: 'Call initiated',
            callType
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Accept a call
router.post('/accept', auth, async (req, res) => {
    try {
        const { callId } = req.body;
        
        if (!callId) {
            return res.status(400).json({ error: 'Call ID required' });
        }

        const call = activeCalls.get(callId);
        if (!call) {
            return res.status(404).json({ error: 'Call not found or expired' });
        }

        if (call.receiverId !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        call.status = 'accepted';
        activeCalls.set(callId, call);

        res.json({
            callId,
            message: 'Call accepted',
            callType: call.callType
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reject a call
router.post('/reject', auth, async (req, res) => {
    try {
        const { callId } = req.body;
        
        if (!callId) {
            return res.status(400).json({ error: 'Call ID required' });
        }

        const call = activeCalls.get(callId);
        if (call) {
            activeCalls.delete(callId);
        }

        res.json({ message: 'Call rejected' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// End a call
router.post('/end', auth, async (req, res) => {
    try {
        const { callId } = req.body;
        
        if (callId && activeCalls.has(callId)) {
            activeCalls.delete(callId);
        }

        res.json({ message: 'Call ended' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get incoming calls (for polling)
router.get('/incoming', auth, async (req, res) => {
    try {
        const userId = req.user._id.toString();
        
        // Find calls where user is receiver
        const incomingCalls = Array.from(activeCalls.values())
            .filter(call => 
                call.receiverId === userId && 
                call.status === 'ringing'
            );

        res.json({ calls: incomingCalls });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get call status
router.get('/status/:callId', auth, async (req, res) => {
    try {
        const { callId } = req.params;
        const call = activeCalls.get(callId);
        
        if (!call) {
            return res.status(404).json({ error: 'Call not found' });
        }

        res.json({ call });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Handle ICE candidate (for WebRTC signaling)
router.post('/ice-candidate', auth, async (req, res) => {
    try {
        const { callId, candidate } = req.body;
        
        // In a full implementation, you would store and forward this to the other peer
        // For now, we'll just acknowledge it
        res.json({ message: 'ICE candidate received' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;

