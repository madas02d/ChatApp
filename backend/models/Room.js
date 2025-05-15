import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Room name is required'],
        trim: true,
        unique: true
    },
    description: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    isPrivate: {
        type: Boolean,
        default: false
    },
    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }],
    lastActivity: {
        type: Date,
        default: Date.now
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    unreadCount: {
        type: Map,
        of: Number,
        default: new Map()
    }
}, {
    timestamps: true
});

// Method to add member to room
roomSchema.methods.addMember = async function(userId) {
    if (!this.participants.includes(userId)) {
        this.participants.push(userId);
        this.lastActivity = new Date();
        await this.save();
    }
};

// Method to remove member from room
roomSchema.methods.removeMember = async function(userId) {
    this.participants = this.participants.filter(id => id.toString() !== userId.toString());
    this.lastActivity = new Date();
    await this.save();
};

// Method to add message to room
roomSchema.methods.addMessage = async function(messageId) {
    this.messages.push(messageId);
    this.lastActivity = new Date();
    await this.save();
};

const Room = mongoose.model('Room', roomSchema);

export default Room; 