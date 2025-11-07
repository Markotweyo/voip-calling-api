const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    twilioCallSid: {
        type: String,
        unique: true,
        sparse: true
    },
    to: {
        type: String,
        required: true
    },
    from: {
        type: String,
        required: true
    },
    contactName: {
        type: String
    },
    status: {
        type: String,
        enum: ['initiating', 'ringing', 'in-progress', 'completed', 'failed', 'busy', 'no-answer', 'canceled'],
        default: 'initiating'
    },
    startTime: {
        type: Date
    },
    endTime: {
        type: Date
    },
    duration: {
        type: Number,
        default: 0
    },
    cost: {
        type: Number,
        default: 0
    },
    ratePerMinute: {
        type: Number
    },
    country: {
        type: String
    },
    countryCode: {
        type: String
    },
    failureReason: {
        type: String
    },
    qualityRating: {
        type: Number,
        min: 1,
        max: 5
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes
callSchema.index({ userId: 1, createdAt: -1 });
callSchema.index({ userId: 1, status: 1 });
callSchema.index({ userId: 1, isDeleted: 1 });

module.exports = mongoose.model('Call', callSchema);