const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/profile', async(req, res, next) => {
    try {
        res.json({
            success: true,
            data: { user: req.user }
        });
    } catch (error) {
        next(error);
    }
});

router.put('/profile', async(req, res, next) => {
    try {
        const { name, phone, timezone, language } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user._id, { name, phone, timezone, language }, { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: { user }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;