const twilio = require('twilio');

/**
 * Express middleware to validate Twilio request signatures.
 * Requires process.env.TWILIO_AUTH_TOKEN to be set.
 */
module.exports = (req, res, next) => {
    try {
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        if (!authToken) {
            console.error('TWILIO_AUTH_TOKEN not set for Twilio validation');
            return res.status(500).json({ success: false, error: { code: 'TWILIO_CONFIG', message: 'Twilio auth token not configured' } });
        }

        const signature = req.headers['x-twilio-signature'] || req.headers['X-Twilio-Signature'];
        if (!signature) {
            return res.status(403).json({ success: false, error: { code: 'TWILIO_SIGNATURE_MISSING', message: 'Missing Twilio signature header' } });
        }

        // Build full URL used by Twilio to sign the request
        const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

        // The request params (body or query) are used for validation
        const params = req.body || req.query || {};

        const valid = twilio.validateRequest(authToken, signature, url, params);
        if (!valid) {
            console.warn('Invalid Twilio signature for', url);
            return res.status(403).json({ success: false, error: { code: 'TWILIO_INVALID_SIGNATURE', message: 'Invalid Twilio signature' } });
        }

        return next();
    } catch (err) {
        console.error('Error validating Twilio signature', err);
        return res.status(500).json({ success: false, error: { code: 'TWILIO_VALIDATION_ERROR', message: 'Error validating Twilio request' } });
    }
};