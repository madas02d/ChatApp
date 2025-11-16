import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: function() {
            return !this.room; // Required if no room
        }
    },
    content: {
        type: String,
        required: [true, 'Message content is required'],
        trim: true
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'audio', 'video', 'file'],
        default: 'text'
    },
    fileUrl: {
        type: String,
        default: null
    },
    fileName: {
        type: String,
        default: null
    },
    fileSize: {
        type: Number,
        default: null
    },
    fileMimeType: {
        type: String,
        default: null
    },
    thumbnailUrl: {
        type: String,
        default: null
    },
    isEncrypted: {
        type: Boolean,
        default: false
    },
    encryptedContent: {
        type: String,
        default: null
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date,
        default: null
    },
    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },
    reactions: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        emoji: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: function() {
            return !this.conversation; // Required if no conversation
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index for faster querying of messages
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ room: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });

// Virtual for formatted timestamp
messageSchema.virtual('formattedTime').get(function() {
    return this.createdAt.toLocaleTimeString();
});

// Method to mark message as read
messageSchema.methods.markAsRead = async function(userId) {
    if (!this.isRead) {
        this.isRead = true;
        this.readAt = new Date();
        this.readBy.push({
            user: userId,
            readAt: new Date()
        });
        await this.save();
    }
};

// Method to add reaction
messageSchema.methods.addReaction = async function(userId, emoji) {
    const existingReaction = this.reactions.find(
        r => r.user.toString() === userId.toString()
    );

    if (existingReaction) {
        existingReaction.emoji = emoji;
        existingReaction.createdAt = new Date();
    } else {
        this.reactions.push({
            user: userId,
            emoji,
            createdAt: new Date()
        });
    }

    await this.save();
};

// Method to remove reaction
messageSchema.methods.removeReaction = async function(userId) {
    this.reactions = this.reactions.filter(
        r => r.user.toString() !== userId.toString()
    );
    await this.save();
};

const Message = mongoose.model('Message', messageSchema);

export default Message;
