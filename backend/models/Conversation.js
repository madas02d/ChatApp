import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },
    unreadCount: {
        type: Map,
        of: Number,
        default: new Map()
    },
    isGroup: {
        type: Boolean,
        default: false
    },
    groupName: {
        type: String,
        default: null
    },
    groupAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    groupAvatar: {
        type: String,
        default: null
    },
    groupDescription: {
        type: String,
        default: null
    },
    groupSettings: {
        onlyAdminCanPost: {
            type: Boolean,
            default: false
        },
        onlyAdminCanAddMembers: {
            type: Boolean,
            default: false
        }
    },
    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }],
    pinnedMessages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for faster querying
conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });
conversationSchema.index({ isGroup: 1 });

// Virtual for conversation name
conversationSchema.virtual('name').get(function() {
    if (this.isGroup) {
        return this.groupName;
    }
    return null; // For direct messages, name will be handled in the frontend
});

// Method to add participant
conversationSchema.methods.addParticipant = async function(userId) {
    if (!this.participants.includes(userId)) {
        this.participants.push(userId);
        this.unreadCount.set(userId.toString(), 0);
        await this.save();
    }
};

// Method to remove participant
conversationSchema.methods.removeParticipant = async function(userId) {
    this.participants = this.participants.filter(
        id => id.toString() !== userId.toString()
    );
    this.unreadCount.delete(userId.toString());
    await this.save();
};

// Method to increment unread count
conversationSchema.methods.incrementUnreadCount = async function(userId) {
    const currentCount = this.unreadCount.get(userId.toString()) || 0;
    this.unreadCount.set(userId.toString(), currentCount + 1);
    await this.save();
};

// Method to reset unread count
conversationSchema.methods.resetUnreadCount = async function(userId) {
    this.unreadCount.set(userId.toString(), 0);
    await this.save();
};

// Method to pin message
conversationSchema.methods.pinMessage = async function(messageId) {
    if (!this.pinnedMessages.includes(messageId)) {
        this.pinnedMessages.push(messageId);
        await this.save();
    }
};

// Method to unpin message
conversationSchema.methods.unpinMessage = async function(messageId) {
    this.pinnedMessages = this.pinnedMessages.filter(
        id => id.toString() !== messageId.toString()
    );
    await this.save();
};

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation; 