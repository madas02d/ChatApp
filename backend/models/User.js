import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    avatar: {
        type: String,
        default: 'default-avatar.png'
    },
    status: {
        type: String,
        enum: ['online', 'offline', 'away'],
        default: 'offline'
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },
    // Relationships
    conversations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation"
    }],
    sentMessages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }],
    contacts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    blockedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true,
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            // Remove sensitive fields
            delete ret.password;
            // Set default unread count
            ret.unreadMessagesCount = 0;
            return ret;
        }
    },
    toObject: { 
        virtuals: true,
        transform: function(doc, ret) {
            // Remove sensitive fields
            delete ret.password;
            // Set default unread count
            ret.unreadMessagesCount = 0;
            return ret;
        }
    }
});

// ✅ Safe Virtual for unread messages count
userSchema.virtual('unreadMessagesCount').get(function () {
    let count = 0;

    try {
        const conversations = this.conversations;

        // Ensure conversations exist, are populated, and are an array
        if (
            !this.populated('conversations') ||
            !Array.isArray(conversations) ||
            conversations.length === 0
        ) {
            return count;
        }

        // Safe to use reduce now
        count = conversations.reduce((total, conversation) => {
            if (!conversation || !conversation.unreadCount || typeof conversation.unreadCount.get !== 'function') {
                return total;
            }

            const unreadCount = conversation.unreadCount.get(this._id);
            return total + (unreadCount || 0);
        }, 0);
    } catch (error) {
        console.error('Error calculating unread messages count:', error);
    }

    return count;
});

// Simple password comparison method
userSchema.methods.comparePassword = async function(password) {
    try {
        return await bcrypt.compare(password, this.password);
    } catch (error) {
        console.error('Error comparing password:', error);
        return false;
    }
};

// Method to add contact
userSchema.methods.addContact = async function(userId) {
    if (!this.contacts.includes(userId)) {
        this.contacts.push(userId);
        await this.save();
    }
};

// Method to block user
userSchema.methods.blockUser = async function(userId) {
    if (!this.blockedUsers.includes(userId)) {
        this.blockedUsers.push(userId);
        // Remove from contacts if exists
        this.contacts = this.contacts.filter(id => id.toString() !== userId.toString());
        await this.save();
    }
};

const User = mongoose.model('User', userSchema);

export default User;
