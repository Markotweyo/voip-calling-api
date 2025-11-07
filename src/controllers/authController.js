const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../config/jwt');

exports.register = async(req, res, next) => {
    try {
        const { email, password, name, phone } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'EMAIL_EXISTS',
                    message: 'Email already registered'
                }
            });
        }

        // Create user with $10 welcome bonus
        const user = await User.create({
            email,
            password,
            name,
            phone,
            creditBalance: 10.00 // Welcome bonus
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful. Welcome bonus $10 added!',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    creditBalance: user.creditBalance
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.login = async(req, res, next) => {
    try {
        const { email, password } = req.body;

        // Get user with password
        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password'
                }
            });
        }

        if (user.accountStatus !== 'active') {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'ACCOUNT_INACTIVE',
                    message: 'Account is not active'
                }
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.json({
            success: true,
            data: {
                accessToken,
                refreshToken,
                expiresIn: 3600,
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    creditBalance: user.creditBalance
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getMe = async(req, res, next) => {
    try {
        res.json({
            success: true,
            data: {
                user: req.user
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.logout = async(req, res, next) => {
    try {
        res.clearCookie('refresh_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};