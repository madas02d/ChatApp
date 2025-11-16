import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import ConversationKey from '../models/ConversationKey.js';
import mongoose from 'mongoose';

const router = Router();

// Get all conversations for current user
router.get('/', auth, async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user._id
        })
        .populate('participants', 'username email photoURL status')
        .populate({
            path: 'lastMessage',
            populate: {
                path: 'sender',
                select: 'username photoURL'
            }
        })
        .sort({ updatedAt: -1 });

        res.json({ conversations });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create new conversation
router.post('/', auth, async (req, res) => {
    try {
        const { participants, isGroup = false, groupName } = req.body;

        // Validate participants
        if (!participants || !Array.isArray(participants)) {
            return res.status(400).json({ error: 'Participants must be an array' });
        }

        // Ensure all participants are valid ObjectIds
        const validParticipants = participants.filter(p => mongoose.Types.ObjectId.isValid(p));
        
        if (validParticipants.length < 1) {
            return res.status(400).json({ error: 'At least one valid participant is required' });
        }

        // Add current user to participants if not already included
        const currentUserIdStr = req.user._id.toString();
        if (!validParticipants.includes(currentUserIdStr)) {
            validParticipants.push(currentUserIdStr);
        }

        // Remove duplicates
        const uniqueParticipants = [...new Set(validParticipants.map(p => p.toString()))];

        // For direct messages, check if conversation already exists
        if (!isGroup && uniqueParticipants.length === 2) {
            try {
                const existingConversation = await Conversation.findOne({
                    participants: { $all: uniqueParticipants },
                    isGroup: false
                }).populate('participants', 'username email photoURL status');

                if (existingConversation) {
                    return res.json({ conversation: existingConversation });
                }
            } catch (findError) {
                console.warn('Error checking for existing conversation:', findError);
                // Continue to create new conversation
            }
        }

        // Create new conversation
        const conversation = new Conversation({
            participants: uniqueParticipants,
            isGroup,
            groupName: isGroup ? groupName : null
        });

        await conversation.save();

        const populatedConversation = await Conversation.findById(conversation._id)
            .populate('participants', 'username email photoURL status');

        res.status(201).json({ conversation: populatedConversation });
    } catch (error) {
        console.error('Error creating conversation:', error);
        
        // Handle MongoDB validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            return res.status(409).json({ error: 'Conversation already exists' });
        }
        
        res.status(500).json({ 
            error: error.message || 'Failed to create conversation' 
        });
    }
});

// Get conversation by ID
router.get('/:conversationId', auth, async (req, res) => {
    try {
        const { conversationId } = req.params;

        const conversation = await Conversation.findById(conversationId)
            .populate('participants', 'username email photoURL status')
            .populate({
                path: 'lastMessage',
                populate: {
                    path: 'sender',
                    select: 'username photoURL'
                }
            });

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Check if user is participant
        const isParticipant = conversation.participants.some(
            p => p._id.toString() === req.user._id.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json({ conversation });
    } catch (error) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get messages for conversation
router.get('/:conversationId/messages', auth, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Check if user is participant
        const isParticipant = conversation.participants.some(
            p => p.toString() === req.user._id.toString()
        );
        if (!isParticipant) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const messages = await Message.find({ conversation: conversationId })
            .populate('sender', 'username photoURL')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        res.json({ messages: messages.reverse() });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: error.message });
    }
});

// Send message to conversation (supports encrypted messages and files)
router.post('/:conversationId/messages', auth, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { 
            content, 
            encryptedContent,
            messageType = 'text',
            isEncrypted = false,
            fileUrl = null,
            fileName = null,
            fileSize = null,
            fileMimeType = null,
            thumbnailUrl = null
        } = req.body;

        // Content is required unless it's an encrypted message or file message
        if (!content && !encryptedContent && !fileUrl && messageType === 'text') {
            return res.status(400).json({ error: 'Message content is required' });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Check if user is participant
        const isParticipant = conversation.participants.some(
            p => p.toString() === req.user._id.toString()
        );
        if (!isParticipant) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const messageData = {
            sender: req.user._id,
            conversation: conversationId,
            messageType,
            isEncrypted: isEncrypted || !!encryptedContent,
        };

        // Set content based on encryption status
        if (isEncrypted && encryptedContent) {
            messageData.encryptedContent = encryptedContent;
            // Also store plain content if provided (for backwards compatibility)
            messageData.content = content || '[Encrypted]';
        } else if (content) {
            messageData.content = content.trim();
        }

        // Set file metadata if provided
        if (fileUrl) {
            messageData.fileUrl = fileUrl;
            messageData.fileName = fileName;
            messageData.fileSize = fileSize;
            messageData.fileMimeType = fileMimeType;
            messageData.thumbnailUrl = thumbnailUrl;
            
            // Ensure messageType matches file type
            if (!['image', 'audio', 'video'].includes(messageType)) {
                if (fileMimeType?.startsWith('image/')) {
                    messageData.messageType = 'image';
                } else if (fileMimeType?.startsWith('audio/')) {
                    messageData.messageType = 'audio';
                } else if (fileMimeType?.startsWith('video/')) {
                    messageData.messageType = 'video';
                }
            }
        }

        const message = new Message(messageData);
        await message.save();

        // Update conversation
        conversation.lastMessage = message._id;
        if (!conversation.messages) {
            conversation.messages = [];
        }
        conversation.messages.push(message._id);
        conversation.updatedAt = new Date();
        
        // Increment unread count for other participants
        // Manual update to avoid multiple saves
        if (!conversation.unreadCount) {
            conversation.unreadCount = new Map();
        }
        conversation.participants.forEach(participantId => {
            if (participantId.toString() !== req.user._id.toString()) {
                const participantIdStr = participantId.toString();
                const currentCount = conversation.unreadCount.get(participantIdStr) || 0;
                conversation.unreadCount.set(participantIdStr, currentCount + 1);
            }
        });
        
        await conversation.save();

        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'username photoURL');

        res.status(201).json({ message: populatedMessage });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get or create encryption key for conversation
router.get('/:conversationId/keys', auth, async (req, res) => {
    try {
        const { conversationId } = req.params;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Check if user is participant
        const isParticipant = conversation.participants.some(
            p => p.toString() === req.user._id.toString()
        );
        if (!isParticipant) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Find or create conversation key
        let conversationKey = await ConversationKey.findOne({ conversation: conversationId });
        
        if (!conversationKey) {
            conversationKey = new ConversationKey({ conversation: conversationId });
            await conversationKey.save();
        }

        // Get user's encrypted key
        const encryptedKey = conversationKey.getParticipantKey(req.user._id);

        res.json({
            hasKey: !!encryptedKey,
            conversationId: conversationId
        });
    } catch (error) {
        console.error('Error fetching conversation key:', error);
        res.status(500).json({ error: error.message });
    }
});

// Store encrypted key for conversation (for key exchange)
router.post('/:conversationId/keys', auth, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { encryptedKey, encryptionMethod = 'password' } = req.body;

        if (!encryptedKey) {
            return res.status(400).json({ error: 'Encrypted key is required' });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Check if user is participant
        const isParticipant = conversation.participants.some(
            p => p.toString() === req.user._id.toString()
        );
        if (!isParticipant) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Find or create conversation key
        let conversationKey = await ConversationKey.findOne({ conversation: conversationId });
        
        if (!conversationKey) {
            conversationKey = new ConversationKey({ conversation: conversationId });
        }

        // Store encrypted key for this user
        await conversationKey.setParticipantKey(req.user._id, encryptedKey, encryptionMethod);

        res.status(201).json({
            success: true,
            message: 'Key stored successfully'
        });
    } catch (error) {
        console.error('Error storing conversation key:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
