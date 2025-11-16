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
    displayName: {
        type: String,
        trim: true,
        maxlength: [50, 'Display name cannot exceed 50 characters']
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
    photoURL: {
        type: String,
        default: 'https://ui-avatars.com/api/?name=User&background=random&color=fff&size=150',
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
    // Friends system
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    friendRequests: [{
        from: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined'],
            default: 'pending'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    sentFriendRequests: [{
        to: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined'],
            default: 'pending'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Additional indexes for faster queries (username and email already have unique indexes)
userSchema.index({ status: 1 });
userSchema.index({ lastSeen: -1 });

// Virtual for full name (displayName or username)
userSchema.virtual('fullName').get(function() {
    return this.displayName || this.username;
});

// Virtual for formatted last seen
userSchema.virtual('formattedLastSeen').get(function() {
    const now = new Date();
    const diffInMinutes = Math.floor((now - this.lastSeen) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to add friend
userSchema.methods.addFriend = async function(friendId) {
    if (!this.friends.includes(friendId)) {
        this.friends.push(friendId);
        await this.save();
    }
};

// Method to remove friend
userSchema.methods.removeFriend = async function(friendId) {
    this.friends = this.friends.filter(id => !id.equals(friendId));
    await this.save();
};

// Method to send friend request
userSchema.methods.sendFriendRequest = async function(toUserId) {
    // Check if already friends
    if (this.friends.includes(toUserId)) {
        throw new Error('Already friends');
    }
    
    // Check if request already exists
    const existingRequest = this.sentFriendRequests.find(
        req => req.to.equals(toUserId) && req.status === 'pending'
    );
    
    if (existingRequest) {
        throw new Error('Friend request already sent');
    }
    
    // Check if there's a pending request from this user
    const existingReceivedRequest = this.friendRequests.find(
        req => req.from.equals(toUserId) && req.status === 'pending'
    );
    
    if (existingReceivedRequest) {
        throw new Error('This user has already sent you a friend request');
    }
    
    this.sentFriendRequests.push({
        to: toUserId,
        status: 'pending'
    });
    
    await this.save();
};

// Method to accept friend request
userSchema.methods.acceptFriendRequest = async function(fromUserId) {
    const request = this.friendRequests.find(
        req => req.from.equals(fromUserId) && req.status === 'pending'
    );
    
    if (!request) {
        throw new Error('Friend request not found');
    }
    
    // Add to friends
    await this.addFriend(fromUserId);
    
    // Update request status
    request.status = 'accepted';
    
    // Add this user to the requester's friends
    const requester = await this.constructor.findById(fromUserId);
    if (requester) {
        await requester.addFriend(this._id);
        
        // Update the sent request status
        const sentRequest = requester.sentFriendRequests.find(
            req => req.to.equals(this._id) && req.status === 'pending'
        );
        if (sentRequest) {
            sentRequest.status = 'accepted';
            await requester.save();
        }
    }
    
    await this.save();
};

// Method to decline friend request
userSchema.methods.declineFriendRequest = async function(fromUserId) {
    const request = this.friendRequests.find(
        req => req.from.equals(fromUserId) && req.status === 'pending'
    );
    
    if (!request) {
        throw new Error('Friend request not found');
    }
    
    request.status = 'declined';
    
    // Update the sent request status
    const requester = await this.constructor.findById(fromUserId);
    if (requester) {
        const sentRequest = requester.sentFriendRequests.find(
            req => req.to.equals(this._id) && req.status === 'pending'
        );
        if (sentRequest) {
            sentRequest.status = 'declined';
            await requester.save();
        }
    }
    
    await this.save();
};

// Method to cancel friend request
userSchema.methods.cancelFriendRequest = async function(toUserId) {
    const request = this.sentFriendRequests.find(
        req => req.to.equals(toUserId) && req.status === 'pending'
    );
    
    if (!request) {
        throw new Error('Friend request not found');
    }
    
    request.status = 'cancelled';
    
    // Update the received request status
    const recipient = await this.constructor.findById(toUserId);
    if (recipient) {
        const receivedRequest = recipient.friendRequests.find(
            req => req.from.equals(this._id) && req.status === 'pending'
        );
        if (receivedRequest) {
            receivedRequest.status = 'cancelled';
            await recipient.save();
        }
    }
    
    await this.save();
};

const User = mongoose.model('User', userSchema);

export default User;
