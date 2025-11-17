const express = require('express');
const {
    createPaymentIntent,
    confirmPayment
} = require('../controllers/stripeController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protected routes
router.use(protect);
router.post('/create-payment-intent', createPaymentIntent);
router.post('/confirm-payment', confirmPayment);

module.exports = router;

