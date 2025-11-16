import mongoose from 'mongoose';

const conversationKeySchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
        unique: true
    },
    // Store encrypted keys for each participant
    // Keys are encrypted with each user's public key or password-derived key
    participantKeys: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        // Base64 encoded encrypted key
        encryptedKey: {
            type: String,
            required: true
        },
        // Key encryption method (e.g., 'password', 'publicKey')
        encryptionMethod: {
            type: String,
            enum: ['password', 'publicKey'],
            default: 'password'
        }
    }],
    // IV for key encryption (if needed)
    iv: {
        type: String,
        default: null
    },
    // Key generation timestamp
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Last key rotation timestamp
    rotatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index for faster querying
// Note: conversation already has unique: true which creates an index, so don't duplicate it
conversationKeySchema.index({ 'participantKeys.user': 1 });

// Method to add/update participant key
conversationKeySchema.methods.setParticipantKey = async function(userId, encryptedKey, encryptionMethod = 'password') {
    const existingIndex = this.participantKeys.findIndex(
        pk => pk.user.toString() === userId.toString()
    );

    if (existingIndex >= 0) {
        this.participantKeys[existingIndex].encryptedKey = encryptedKey;
        this.participantKeys[existingIndex].encryptionMethod = encryptionMethod;
    } else {
        this.participantKeys.push({
            user: userId,
            encryptedKey,
            encryptionMethod
        });
    }

    await this.save();
};

// Method to get participant key
conversationKeySchema.methods.getParticipantKey = function(userId) {
    const participantKey = this.participantKeys.find(
        pk => pk.user.toString() === userId.toString()
    );
    return participantKey ? participantKey.encryptedKey : null;
};

// Method to remove participant key
conversationKeySchema.methods.removeParticipantKey = async function(userId) {
    this.participantKeys = this.participantKeys.filter(
        pk => pk.user.toString() !== userId.toString()
    );
    await this.save();
};

// Method to rotate keys (create new keys for all participants)
conversationKeySchema.methods.rotateKeys = async function() {
    this.rotatedAt = new Date();
    // Clear existing keys - they will be regenerated
    this.participantKeys = [];
    await this.save();
};

const ConversationKey = mongoose.model('ConversationKey', conversationKeySchema);

export default ConversationKey;

