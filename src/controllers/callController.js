const Call = require('../models/Call');
const User = require('../models/User');
const CallingRate = require('../models/CallingRate');
const { parsePhoneNumber } = require('libphonenumber-js');

const twilio = require('twilio');

exports.getToken = async(req, res, next) => {
    try {
        const AccessToken = twilio.jwt.AccessToken;
        const VoiceGrant = AccessToken.VoiceGrant;

        // Create an access token
        const token = new AccessToken(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_API_KEY,
            process.env.TWILIO_API_SECRET, { identity: req.user._id.toString() }
        );

        // Create a Voice grant
        const voiceGrant = new VoiceGrant({
            outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID,
            incomingAllow: true,
        });

        // Add the grant to the token
        token.addGrant(voiceGrant);

        res.json({
            success: true,
            data: {
                token: token.toJwt(),
                identity: req.user._id.toString(),
                expiresAt: new Date(Date.now() + 3600000).toISOString()
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.initiateCall = async(req, res, next) => {
    try {
        const { to, from } = req.body;

        // Parse and validate destination number
        let parsedNumber;
        try {
            parsedNumber = parsePhoneNumber(to);
            if (!parsedNumber.isValid()) {
                throw new Error('Invalid number');
            }
        } catch {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PHONE_NUMBER',
                    message: 'Invalid destination phone number'
                }
            });
        }

        // Initialize Twilio client
        const client = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );

        // Create a TwiML response
        const twiml = new twilio.twiml.VoiceResponse();
        twiml.dial({ callerId: from }, parsedNumber.format('E.164'));
        const rate = await CallingRate.findOne({
            countryCode: parsedNumber.country
        });

        if (!rate) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'RATE_NOT_FOUND',
                    message: 'Calling rate not available for this destination'
                }
            });
        }

        // Check user balance (minimum 1 minute)
        const minimumRequired = rate.ratePerMinute;
        if (req.user.creditBalance < minimumRequired) {
            return res.status(402).json({
                success: false,
                error: {
                    code: 'INSUFFICIENT_CREDITS',
                    message: 'Insufficient credits to make this call',
                    requiredBalance: minimumRequired,
                    currentBalance: req.user.creditBalance
                }
            });
        }

        // Create call record
        const call = await Call.create({
            userId: req.user._id,
            to: parsedNumber.format('E.164'),
            from: from || process.env.TWILIO_PHONE_NUMBER,
            status: 'initiating',
            country: rate.country,
            countryCode: rate.countryCode,
            ratePerMinute: rate.ratePerMinute,
            twilioCallSid: `CA${Math.random().toString(36).substr(2, 32)}`
        });

        // Simulate call progress (in production, Twilio handles this)
        setTimeout(async() => {
            call.status = 'ringing';
            call.startTime = new Date();
            await call.save();
        }, 1000);

        res.json({
            success: true,
            data: {
                callId: call._id,
                status: call.status,
                to: call.to,
                from: call.from,
                estimatedCostPerMinute: rate.ratePerMinute,
                currency: 'USD',
                createdAt: call.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.endCall = async(req, res, next) => {
    try {
        const call = await Call.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!call) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'CALL_NOT_FOUND',
                    message: 'Call not found'
                }
            });
        }

        // Calculate duration and cost
        const endTime = new Date();
        const duration = call.startTime ?
            Math.floor((endTime - call.startTime) / 1000) :
            0;

        const minutes = Math.ceil(duration / 60);
        const cost = minutes * call.ratePerMinute;

        // Update call
        call.status = 'completed';
        call.endTime = endTime;
        call.duration = duration;
        call.cost = cost;
        await call.save();

        // Deduct credits from user
        const user = await User.findById(req.user._id);
        user.creditBalance = Math.max(0, user.creditBalance - cost);
        await user.save();

        res.json({
            success: true,
            data: {
                call: {
                    id: call._id,
                    status: call.status,
                    duration,
                    cost
                },
                remainingBalance: user.creditBalance
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getRates = async(req, res, next) => {
    try {
        const { search, limit = 50 } = req.query;

        const filter = {};
        if (search) {
            filter.country = { $regex: search, $options: 'i' };
        }

        const rates = await CallingRate.find(filter)
            .limit(parseInt(limit))
            .sort({ country: 1 });

        res.json({
            success: true,
            data: {
                rates: rates.map(r => ({
                    country: r.country,
                    countryCode: r.countryCode,
                    prefix: r.prefix,
                    ratePerMinute: r.ratePerMinute,
                    currency: r.currency,
                    type: r.type
                })),
                lastUpdated: new Date().toISOString()
            }
        });
    } catch (error) {
        next(error);
    }
};