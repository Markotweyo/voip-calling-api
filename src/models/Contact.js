const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 100
    },
    phoneNumber: {
        type: String,
        required: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    profilePicture: {
        type: String
    },
    group: {
        type: String,
        default: 'General'
    },
    isFavorite: {
        type: Boolean,
        default: false
    },
    notes: {
        type: String,
        maxlength: 500
    },
    callCount: {
        type: Number,
        default: 0
    },
    lastCalled: {
        type: Date
    }
}, {
    timestamps: true
});

// Unique constraint
contactSchema.index({ userId: 1, phoneNumber: 1 }, { unique: true });
contactSchema.index({ userId: 1, name: 1 });
contactSchema.index({ userId: 1, isFavorite: 1 });

module.exports = mongoose.model('Contact', contactSchema);