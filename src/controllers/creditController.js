const User = require('../models/User');
const Transaction = require('../models/Transaction');

const CREDIT_PACKAGES = [{
        id: 'pkg_starter',
        name: 'Starter Pack',
        credits: 5.00,
        price: 5.00,
        bonus: 0,
        popular: false
    },
    {
        id: 'pkg_popular',
        name: 'Popular Pack',
        credits: 25.00,
        price: 20.00,
        bonus: 5.00,
        popular: true,
        savings: '20%'
    },
    {
        id: 'pkg_pro',
        name: 'Pro Pack',
        credits: 50.00,
        price: 35.00,
        bonus: 15.00,
        popular: false,
        savings: '30%'
    },
    {
        id: 'pkg_enterprise',
        name: 'Enterprise Pack',
        credits: 100.00,
        price: 60.00,
        bonus: 40.00,
        popular: false,
        savings: '40%'
    }
];

exports.getBalance = async(req, res, next) => {
    try {
        res.json({
            success: true,
            data: {
                balance: req.user.creditBalance,
                currency: 'USD',
                lastUpdated: new Date().toISOString(),
                lowBalanceThreshold: 5.00,
                isLowBalance: req.user.creditBalance < 5.00
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getPackages = async(req, res, next) => {
    try {
        res.json({
            success: true,
            data: {
                packages: CREDIT_PACKAGES.map(pkg => ({
                    ...pkg,
                    currency: 'USD'
                }))
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.purchaseCredits = async(req, res, next) => {
    try {
        const { packageId, paymentMethod = 'mock' } = req.body;

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

        // Create transaction
        const transaction = await Transaction.create({
            userId: req.user._id,
            type: 'credit_purchase',
            amount: pkg.price,
            creditAmount: pkg.credits + pkg.bonus,
            currency: 'USD',
            status: 'completed', // Mock payment always succeeds
            paymentMethod,
            paymentId: `mock_${Date.now()}`,
            description: `${pkg.name} - ${pkg.credits + pkg.bonus} credits`
        });

        // Update user balance
        const user = await User.findById(req.user._id);
        user.creditBalance += (pkg.credits + pkg.bonus);
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

exports.getTransactions = async(req, res, next) => {
    try {
        const { page = 1, limit = 20, type } = req.query;

        const filter = { userId: req.user._id };
        if (type && type !== 'all') {
            filter.type = type;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [transactions, total] = await Promise.all([
            Transaction.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean(),
            Transaction.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: {
                transactions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalRecords: total
                }
            }
        });
    } catch (error) {
        next(error);
    }
};