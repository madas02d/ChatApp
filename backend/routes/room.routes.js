import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import Room from '../models/Room.js';
import { 
    catchAsync, 
    ValidationError, 
    NotFoundError,
    RoomError,
    RoomNotFoundError,
    RoomAccessError
} from '../controllers/error.controller.js';
import mongoose from 'mongoose';

const router = Router();

// Get all rooms
router.get('/', auth, catchAsync(async (req, res) => {
    try {
        const rooms = await Room.find()
            .populate('createdBy', 'username avatar')
            .populate('members', 'username avatar status')
            .sort({ lastActivity: -1 });

        res.json({ rooms });
    } catch (error) {
        console.error('Error fetching rooms:', error);
        throw new RoomError('Failed to fetch rooms');
    }
}));

// Create new room
router.post('/', auth, catchAsync(async (req, res) => {
    try {
        const { name, description, isPrivate } = req.body;

        if (!name) {
            throw new ValidationError('Room name is required');
        }

        // Check if room with same name exists
        const existingRoom = await Room.findOne({ name });
        if (existingRoom) {
            throw new ValidationError('Room with this name already exists');
        }

        // Create new room
        const room = await Room.create({
            name,
            description,
            isPrivate: isPrivate || false,
            createdBy: req.user.id,
            members: [req.user.id] // Creator is automatically a member
        });

        // Populate the room data
        await room.populate('createdBy', 'username avatar');
        await room.populate('members', 'username avatar status');

        res.status(201).json({ room });
    } catch (error) {
        console.error('Error creating room:', error);
        if (error instanceof ValidationError) {
            throw error;
        }
        throw new RoomError('Failed to create room');
    }
}));

// Get room by ID
router.get('/:roomId', auth, catchAsync(async (req, res) => {
    try {
        const { roomId } = req.params;

        const room = await Room.findById(roomId)
            .populate('createdBy', 'username avatar')
            .populate('members', 'username avatar status')
            .populate({
                path: 'messages',
                populate: {
                    path: 'sender',
                    select: 'username avatar'
                }
            });

        if (!room) {
            throw new RoomNotFoundError('Room not found');
        }

        // Check if user has access to the room
        if (room.isPrivate && !room.members.includes(req.user.id)) {
            throw new RoomAccessError('You do not have access to this room');
        }

        res.json({ room });
    } catch (error) {
        console.error('Error fetching room:', error);
        if (error instanceof RoomNotFoundError || error instanceof RoomAccessError) {
            throw error;
        }
        throw new RoomError('Failed to fetch room details');
    }
}));

// Join room
router.post('/:roomId/join', auth, catchAsync(async (req, res) => {
    try {
        const { roomId } = req.params;

        const room = await Room.findById(roomId);
        if (!room) {
            throw new RoomNotFoundError('Room not found');
        }

        // Check if room is private
        if (room.isPrivate) {
            throw new RoomAccessError('This is a private room. You need an invitation to join.');
        }

        // Check if user is already a member
        if (room.members.includes(req.user.id)) {
            throw new ValidationError('You are already a member of this room');
        }

        // Add user to room
        await room.addMember(req.user.id);

        // Populate the room data
        await room.populate('createdBy', 'username avatar');
        await room.populate('members', 'username avatar status');

        res.json({ 
            message: 'Joined room successfully',
            room
        });
    } catch (error) {
        console.error('Error joining room:', error);
        if (error instanceof RoomNotFoundError || 
            error instanceof RoomAccessError || 
            error instanceof ValidationError) {
            throw error;
        }
        throw new RoomError('Failed to join room');
    }
}));

// Leave room
router.post('/:roomId/leave', auth, catchAsync(async (req, res) => {
    try {
        const { roomId } = req.params;

        const room = await Room.findById(roomId);
        if (!room) {
            throw new RoomNotFoundError('Room not found');
        }

        // Check if user is a member
        if (!room.members.includes(req.user.id)) {
            throw new ValidationError('You are not a member of this room');
        }

        // Don't allow creator to leave
        if (room.createdBy.toString() === req.user.id) {
            throw new RoomAccessError('Room creator cannot leave the room');
        }

        // Remove user from room
        await room.removeMember(req.user.id);

        res.json({ message: 'Left room successfully' });
    } catch (error) {
        console.error('Error leaving room:', error);
        if (error instanceof RoomNotFoundError || 
            error instanceof RoomAccessError || 
            error instanceof ValidationError) {
            throw error;
        }
        throw new RoomError('Failed to leave room');
    }
}));

// Add user to room
router.post('/:roomId/participants', auth, catchAsync(async (req, res) => {
    const { roomId } = req.params;
    const { userId } = req.body;

    // Validate room ID
    if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
        throw new ValidationError('Invalid room ID');
    }

    // Validate user ID
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ValidationError('Invalid user ID');
    }

    const room = await Room.findById(roomId);
    if (!room) {
        throw new NotFoundError('Room not found');
    }

    // Add user to participants if not already present
    if (!room.participants.includes(userId)) {
        room.participants.push(userId);
        await room.save();
    }

    res.json({ message: 'User added to room successfully', room });
}));

// Get room details
router.get('/:roomId', auth, catchAsync(async (req, res) => {
    const { roomId } = req.params;

    const room = await Room.findById(roomId)
        .populate('participants', 'username avatar')
        .populate('lastMessage');

    if (!room) {
        throw new NotFoundError('Room not found');
    }

    res.json({ room });
}));

export default router; 