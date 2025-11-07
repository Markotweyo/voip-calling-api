const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/register',
    authLimiter, [
        body('email').isEmail().withMessage('Valid email required'),
        body('password').isLength({ min: 8 }).withMessage('Password must be 8+ characters'),
        body('name').trim().notEmpty().withMessage('Name is required')
    ],
    register
);

router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;