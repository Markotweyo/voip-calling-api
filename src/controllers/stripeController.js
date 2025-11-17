// Initialize Stripe lazily to ensure env variables are loaded
let stripe;
const getStripe = () => {
    if (!stripe) {
        const secretKey = process.env.STRIPE_SECRET_KEY;
        
        if (!secretKey) {
            const error = new Error('STRIPE_SECRET_KEY is not set in environment variables');
            console.error('Stripe Error:', error.message);
            console.error('Please add STRIPE_SECRET_KEY to your .env file');
            throw error;
        }
        
        if (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('sk_live_')) {
            const error = new Error('Invalid STRIPE_SECRET_KEY format. Expected format: sk_test_... or sk_live_...');
            console.error('Stripe Error:', error.message);
            console.error('Current key starts with:', secretKey.substring(0, 10) + '...');
            throw error;
        }
        
        try {
            stripe = require('stripe')(secretKey);
        } catch (err) {
            console.error('Failed to initialize Stripe:', err.message);
            throw new Error('Failed to initialize Stripe: ' + err.message);
        }
    }
    return stripe;
};

const User = require('../models/User');
const Transaction = require('../models/Transaction');

const CREDIT_PACKAGES = [{
    id: 'pkg_starter',
    name: 'Starter',
    credits: 5.00,
    price: 5.00,
    bonus: 0,
    popular: false
}, {
    id: 'pkg_basic',
    name: 'Basic',
    credits: 10.00,
    price: 10.00,
    bonus: 1.00,
    popular: true
}, {
    id: 'pkg_popular',
    name: 'Popular',
    credits: 25.00,
    price: 25.00,
    bonus: 5.00,
    popular: false
}, {
    id: 'pkg_pro',
    name: 'Pro',
    credits: 50.00,
    price: 50.00,
    bonus: 15.00,
    popular: false
}, {
    id: 'pkg_enterprise',
    name: 'Enterprise',
    credits: 100.00,
    price: 100.00,
    bonus: 35.00,
    popular: false
}];

/**
 * Create a Stripe Payment Intent for credit purchase
 */
exports.createPaymentIntent = async (req, res, next) => {
    try {
        const { packageId } = req.body;

        const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
        if (!pkg) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PACKAGE',
                    message: 'Invalid credit package'
                }
            });
        }

        // Create payment intent
        const stripeInstance = getStripe();
        const paymentIntent = await stripeInstance.paymentIntents.create({
            amount: Math.round(pkg.price * 100), // Convert to cents
            currency: 'usd',
            metadata: {
                userId: req.user._id.toString(),
                packageId: pkg.id,
                packageName: pkg.name,
                credits: (pkg.credits + pkg.bonus).toString(),
                price: pkg.price.toString()
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.json({
            success: true,
            data: {
                clientSecret: paymentIntent.client_secret,
                amount: pkg.price,
                credits: pkg.credits + pkg.bonus,
                packageId: pkg.id,
                packageName: pkg.name
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Confirm payment and add credits to user account
 */
exports.confirmPayment = async (req, res, next) => {
    try {
        const { paymentIntentId } = req.body;

        if (!paymentIntentId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_PAYMENT_INTENT',
                    message: 'Payment intent ID is required'
                }
            });
        }

        // Retrieve payment intent from Stripe
        const stripeInstance = getStripe();
        const paymentIntent = await stripeInstance.paymentIntents.retrieve(paymentIntentId);

        // Verify payment was successful
        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'PAYMENT_NOT_SUCCEEDED',
                    message: `Payment status: ${paymentIntent.status}`
                }
            });
        }

        // Verify user matches
        if (paymentIntent.metadata.userId !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Payment intent does not belong to this user'
                }
            });
        }

        // Check if transaction already exists
        const existingTransaction = await Transaction.findOne({
            paymentId: paymentIntentId
        });

        if (existingTransaction) {
            // Transaction already processed
            const user = await User.findById(req.user._id);
            return res.json({
                success: true,
                message: 'Payment already processed',
                data: {
                    transaction: existingTransaction,
                    newBalance: user.creditBalance
                }
            });
        }

        // Get package details from metadata
        const packageId = paymentIntent.metadata.packageId;
        const credits = parseFloat(paymentIntent.metadata.credits);
        const amount = parseFloat(paymentIntent.metadata.price);

        const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
        if (!pkg) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PACKAGE',
                    message: 'Package not found'
                }
            });
        }

        // Create transaction record
        const transaction = await Transaction.create({
            userId: req.user._id,
            type: 'credit_purchase',
            amount: amount,
            creditAmount: credits,
            currency: 'USD',
            status: 'completed',
            paymentMethod: 'stripe',
            paymentId: paymentIntentId,
            description: `${pkg.name} - ${credits} credits`
        });

        // Update user balance
        const user = await User.findById(req.user._id);
        user.creditBalance += credits;
        await user.save();

        res.json({
            success: true,
            message: 'Credits purchased successfully',
            data: {
                transaction: {
                    id: transaction._id,
                    amount: transaction.amount,
                    credits: transaction.creditAmount,
                    status: transaction.status
                },
                newBalance: user.creditBalance
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Stripe webhook handler for payment events
 */
exports.handleWebhook = async (req, res, next) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        const stripeInstance = getStripe();
        event = stripeInstance.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;

        try {
            // Verify payment intent has required metadata
            if (!paymentIntent.metadata.userId || !paymentIntent.metadata.packageId) {
                console.error('Payment intent missing required metadata');
                return res.status(400).json({ received: false });
            }

            // Check if transaction already exists
            const existingTransaction = await Transaction.findOne({
                paymentId: paymentIntent.id
            });

            if (existingTransaction) {
                // Already processed
                return res.json({ received: true });
            }

            // Create transaction record
            const credits = parseFloat(paymentIntent.metadata.credits);
            const amount = parseFloat(paymentIntent.metadata.price);
            const pkg = CREDIT_PACKAGES.find(p => p.id === paymentIntent.metadata.packageId);

            const transaction = await Transaction.create({
                userId: paymentIntent.metadata.userId,
                type: 'credit_purchase',
                amount: amount,
                creditAmount: credits,
                currency: 'USD',
                status: 'completed',
                paymentMethod: 'stripe',
                paymentId: paymentIntent.id,
                description: `${pkg?.name || 'Credit Package'} - ${credits} credits`
            });

            // Update user balance
            const user = await User.findById(paymentIntent.metadata.userId);
            if (user) {
                user.creditBalance += credits;
                await user.save();
            }
        } catch (error) {
            console.error('Error processing webhook:', error);
            return res.status(500).json({ received: false, error: error.message });
        }
    }

    res.json({ received: true });
};

