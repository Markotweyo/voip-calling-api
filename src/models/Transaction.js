const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['credit_purchase', 'call_deduction', 'refund', 'bonus'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    creditAmount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String
    },
    paymentId: {
        type: String
    },
    description: {
        type: String
    },
    callId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Call'
    }
}, {
    timestamps: true
});

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);