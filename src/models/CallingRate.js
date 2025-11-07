const mongoose = require('mongoose');

const callingRateSchema = new mongoose.Schema({
    country: {
        type: String,
        required: true
    },
    countryCode: {
        type: String,
        required: true,
        uppercase: true
    },
    prefix: {
        type: String,
        required: true
    },
    ratePerMinute: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    type: {
        type: String,
        enum: ['mobile', 'landline', 'standard'],
        default: 'standard'
    }
}, {
    timestamps: true
});

callingRateSchema.index({ countryCode: 1 });
callingRateSchema.index({ country: 'text' });

module.exports = mongoose.model('CallingRate', callingRateSchema);