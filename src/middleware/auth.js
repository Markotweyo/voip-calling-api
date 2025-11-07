const { verifyAccessToken } = require('../config/jwt');
const User = require('../models/User');

const protect = async(req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Not authorized to access this route'
                }
            });
        }

        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.userId);

        if (!user || user.accountStatus !== 'active') {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'User not found or account inactive'
                }
            });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_TOKEN',
                message: 'Invalid or expired token'
            }
        });
    }
};

module.exports = { protect };