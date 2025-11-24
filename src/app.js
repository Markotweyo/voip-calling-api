const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const creditRoutes = require('./routes/creditRoutes');
const callRoutes = require('./routes/callRoutes');
const callHistoryRoutes = require('./routes/callHistoryRoutes');
const contactRoutes = require('./routes/contactRoutes');
const stripeRoutes = require('./routes/stripeRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Trust proxy headers (needed for correct client IP detection behind proxies like ngrok, Heroku, etc.)
// See: https://express-rate-limit.github.io/ERR_ERL_UNEXPECTED_X_FORWARDED_FOR/
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS - Allow multiple origins for development
const defaultOrigins = ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000'];
const envOrigins = process.env.CORS_ORIGIN ?
    process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) : [];

// Merge environment origins with defaults, ensuring localhost:8080 is always included
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

const isDevelopment = process.env.NODE_ENV !== 'production';

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // In development, allow all origins for flexibility
        if (isDevelopment) {
            return callback(null, true);
        }

        // In production, only allow specified origins
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Stripe webhook route (must be before body parser - uses raw body)
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), require('./controllers/stripeController').handleWebhook);

// Body parser (after Stripe webhook)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Twilio webhooks - these must be public endpoints but are validated by Twilio signature
// They expect application/x-www-form-urlencoded bodies from Twilio
const verifyTwilio = require('./middleware/verifyTwilio');
app.post('/api/calls/twilio/incoming', express.urlencoded({ extended: true }), verifyTwilio, require('./controllers/callController').incomingWebhook);
app.post('/api/calls/twilio/status', express.urlencoded({ extended: true }), verifyTwilio, require('./controllers/callController').statusCallback);
app.all('/api/calls/twilio/outbound-twiml', express.urlencoded({ extended: true }), verifyTwilio, require('./controllers/callController').outboundTwiml);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/call-history', callHistoryRoutes);
app.use('/api/contacts', contactRoutes);
// Stripe routes (after body parser)
app.use('/api/stripe', stripeRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'Route not found'
        }
    });
});

// Error handler
app.use(errorHandler);

module.exports = app;