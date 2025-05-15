import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import Message from '../models/Message.js';
import Room from '../models/Room.js';
import {
  catchAsync,
  NotFoundError,
  AuthorizationError,
  ValidationError
} from '../controllers/error.controller.js';
import mongoose from 'mongoose';

const router = Router();

// GET messages in room
router.get('/:roomId', auth, catchAsync(async (req, res) => {
  const { roomId } = req.params;

  if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
    throw new ValidationError('Invalid room ID');
  }

  const room = await Room.findById(roomId);
  if (!room) throw new NotFoundError('Room not found');

  console.log('Room participants:', room.participants);
  console.log('Current user ID:', req.user.id);

  if (!room.participants || !Array.isArray(room.participants)) {
    throw new ValidationError('Invalid room structure');
  }

  if (!room.participants.includes(req.user.id)) {
    throw new AuthorizationError('You are not a participant in this room');
  }

  const messages = await Message.find({ conversation: roomId })
    .populate('sender', 'username avatar')
    .sort({ createdAt: -1 });

  res.json({ messages });
}));

// POST new message
router.post('/:roomId', auth, catchAsync(async (req, res) => {
  const { roomId } = req.params;
  const { content, messageType = 'text', fileUrl = null } = req.body;

  if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
    throw new ValidationError('Invalid room ID');
  }

  if (!content || content.trim().length === 0) {
    throw new ValidationError('Message content is required');
  }

  const room = await Room.findById(roomId);
  if (!room) throw new NotFoundError('Room not found');

  const participants = room.participants || [];
  const userId = req.user?.id || req.user?._id;

  const isParticipant = participants.map(p => p.toString()).includes(userId.toString());
  if (!isParticipant) {
    throw new AuthorizationError('You are not a participant in this room');
  }

  const newMessage = new Message({
    sender: userId,
    conversation: roomId,
    content: content.trim(),
    messageType,
    fileUrl
  });

  await newMessage.save();

  // Update room
  await Room.findByIdAndUpdate(roomId, {
    lastMessage: newMessage._id,
    $inc: { [`unreadCount.${userId}`]: 1 }
  });

  await newMessage.populate('sender', 'username avatar');

  res.status(201).json({ message: newMessage });
}));

// DELETE message
router.delete('/:messageId', auth, catchAsync(async (req, res) => {
  const { messageId } = req.params;

  if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
    throw new ValidationError('Invalid message ID');
  }

  const message = await Message.findById(messageId);
  if (!message) throw new NotFoundError('Message not found');

  const userId = req.user?.id || req.user?._id;

  if (message.sender.toString() !== userId.toString()) {
    throw new AuthorizationError('Not authorized to delete this message');
  }

  await message.deleteOne();
  res.json({ message: 'Message deleted successfully' });
}));

// Send message
router.post('/', auth, catchAsync(async (req, res) => {
  const { content, roomId } = req.body;
  
  const message = new Message({
    content,
    sender: req.user._id,
    room: roomId
  });

  await message.save();

  // Update room's lastMessage
  await Room.findByIdAndUpdate(roomId, {
    lastMessage: message._id
  });

  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'username avatar');

  res.status(201).json(populatedMessage);
}));

// Get messages for a room
router.get('/room/:roomId', auth, catchAsync(async (req, res) => {
  const { roomId } = req.params;
  
  const messages = await Message.find({ room: roomId })
    .populate('sender', 'username avatar')
    .sort({ createdAt: 1 });

  res.json({ messages });
}));

export default router;
