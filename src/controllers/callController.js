const Call = require('../models/Call');
const User = require('../models/User');
const CallingRate = require('../models/CallingRate');
const { parsePhoneNumber } = require('libphonenumber-js');

const twilio = require('twilio');
const { URL } = require('url');

exports.getToken = async(req, res, next) => {
    try {
        const requesterId = req.user && req.user._id ? req.user._id.toString() : 'unknown';
        console.info('[API] /api/calls/token requested by user:', requesterId);
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
        console.info('[API] Twilio token issued for user:', requesterId);
    } catch (error) {
        console.error('[API] Failed to issue Twilio token:', error);
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

        // Initialize Twilio client (REST)
        const client = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );

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

        // Create call record (status will be updated by Twilio callbacks)
        const call = await Call.create({
            userId: req.user._id,
            to: parsedNumber.format('E.164'),
            from: from || process.env.TWILIO_PHONE_NUMBER,
            status: 'initiating',
            country: rate.country,
            countryCode: rate.countryCode,
            ratePerMinute: rate.ratePerMinute
        });

        // Build the URL Twilio will request for TwiML when the call is answered
        // Ensure BASE_URL is configured (publicly reachable, use ngrok in dev)
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
        const twimlUrl = new URL('/api/calls/twilio/outbound-twiml', baseUrl);
        twimlUrl.searchParams.set('callId', call._id.toString());

        // Create a real call via Twilio REST API
        const twilioCall = await client.calls.create({
            from: call.from,
            to: call.to,
            url: twimlUrl.toString(),
            statusCallback: `${baseUrl}/api/calls/twilio/status?callId=${call._id}`,
            statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
        });

        // Persist Twilio SID
        call.twilioCallSid = twilioCall.sid;
        await call.save();

        res.json({
            success: true,
            data: {
                callId: call._id,
                status: call.status,
                to: call.to,
                from: call.from,
                estimatedCostPerMinute: rate.ratePerMinute,
                currency: 'USD',
                twilioSid: twilioCall.sid,
                createdAt: call.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
};

// Twilio will request this endpoint (GET or POST) to fetch TwiML for outbound calls
exports.outboundTwiml = async(req, res, next) => {
    try {
        const { callId } = req.query;
        const call = callId ? await Call.findById(callId) : null;

        const twiml = new twilio.twiml.VoiceResponse();

        if (call) {
            // Dial the destination number
            twiml.dial({ callerId: call.from }, call.to);
        } else if (req.query.to) {
            twiml.dial({ callerId: process.env.TWILIO_PHONE_NUMBER }, req.query.to);
        } else {
            twiml.say('Unable to find call information.');
        }

        res.type('text/xml');
        res.send(twiml.toString());
    } catch (error) {
        next(error);
    }
};

// Handler for incoming calls from Twilio (webhook). This answers the call with simple TwiML.
exports.incomingWebhook = async(req, res, next) => {
    try {
        // Twilio posts form-encoded body with From, To, CallSid, etc.
        const { From, To, CallSid } = req.body || req.query || {};

        // Try to find a user who owns the destination 'To' phone number
        let targetUser = null;
        try {
            let parsedTo;
            try {
                parsedTo = parsePhoneNumber(To);
            } catch (e) {
                parsedTo = null;
            }

            if (parsedTo && parsedTo.isValid && parsedTo.isValid()) {
                const formatted = parsedTo.format('E.164');
                targetUser = await User.findOne({ phone: formatted });
            }

            if (!targetUser) {
                targetUser = await User.findOne({ phone: To });
            }
        } catch (e) {
            console.warn('Error matching incoming To to a user', e);
        }

        // Create a call record for tracking, attach userId when possible
        const call = await Call.create({
            userId: targetUser ? targetUser._id : null,
            to: To,
            from: From,
            status: 'incoming',
            twilioCallSid: CallSid
        });

        const twiml = new twilio.twiml.VoiceResponse();

        if (targetUser) {
            // Route incoming PSTN call to the web client identity (user._id)
            const dial = twiml.dial();
            dial.client(targetUser._id.toString());
        } else {
            // If no matching user, reply with a greeting then hang up
            twiml.say('Hello, you have reached the Phonely demo. Please wait while we connect your call.');
            twiml.hangup();
        }

        res.type('text/xml');
        res.send(twiml.toString());
    } catch (error) {
        next(error);
    }
};

// Twilio status callbacks (updates call state)
exports.statusCallback = async(req, res, next) => {
    try {
        // Twilio sends status updates as form-encoded POSTs
        const { CallStatus, CallSid } = req.body || {};
        const callId = req.query.callId;

        // Try to update by Twilio SID first, then by local id
        let call = null;
        if (CallSid) call = await Call.findOne({ twilioCallSid: CallSid });
        if (!call && callId) call = await Call.findById(callId);

        if (call) {
            call.status = CallStatus || call.status;
            if (CallStatus === 'in-progress' && !call.startTime) call.startTime = new Date();
            if ((CallStatus === 'completed' || CallStatus === 'canceled') && !call.endTime) call.endTime = new Date();
            await call.save();
        }

        // Respond 200 to Twilio
        res.sendStatus(200);
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