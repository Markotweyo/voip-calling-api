const Call = require('../models/Call');
const Contact = require('../models/Contact');

exports.getCallHistory = async(req, res, next) => {
    try {
        const {
            page = 1,
                limit = 20,
                status,
                startDate,
                endDate,
                search,
                sortBy = 'createdAt',
                sortOrder = 'desc'
        } = req.query;

        const filter = {
            userId: req.user._id,
            isDeleted: false
        };

        if (status && status !== 'all') {
            filter.status = status;
        }

        if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        if (search) {
            filter.$or = [
                { to: { $regex: search, $options: 'i' } },
                { contactName: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOption = {
            [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        const [calls, total] = await Promise.all([
            Call.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit))
            .lean(),
            Call.countDocuments(filter)
        ]);

        // Enrich with contact names
        const phoneNumbers = calls.map(c => c.to);
        const contacts = await Contact.find({
            userId: req.user._id,
            phoneNumber: { $in: phoneNumbers }
        }).lean();

        const contactMap = new Map(contacts.map(c => [c.phoneNumber, c.name]));

        const enrichedCalls = calls.map(call => ({
            ...call,
            contactName: contactMap.get(call.to) || null
        }));

        res.json({
            success: true,
            data: {
                calls: enrichedCalls,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalRecords: total,
                    hasNext: skip + calls.length < total,
                    hasPrevious: page > 1
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getCallDetails = async(req, res, next) => {
    try {
        const call = await Call.findOne({
            _id: req.params.id,
            userId: req.user._id,
            isDeleted: false
        }).lean();

        if (!call) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'CALL_NOT_FOUND',
                    message: 'Call not found'
                }
            });
        }

        // Try to get contact name
        const contact = await Contact.findOne({
            userId: req.user._id,
            phoneNumber: call.to
        });

        res.json({
            success: true,
            data: {
                call: {
                    ...call,
                    contactName: contact ? contact.name : null
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getCallStats = async(req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        const filter = {
            userId: req.user._id,
            isDeleted: false
        };

        if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const stats = await Call.aggregate([
            { $match: filter },
            {
                $facet: {
                    summary: [{
                        $group: {
                            _id: null,
                            totalCalls: { $sum: 1 },
                            completedCalls: {
                                $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                            },
                            failedCalls: {
                                $sum: { $cond: [{ $ne: ['$status', 'completed'] }, 1, 0] }
                            },
                            totalDuration: { $sum: '$duration' },
                            totalCost: { $sum: '$cost' },
                            avgDuration: { $avg: '$duration' },
                            avgCost: { $avg: '$cost' }
                        }
                    }],
                    byCountry: [{
                            $group: {
                                _id: '$country',
                                calls: { $sum: 1 },
                                duration: { $sum: '$duration' },
                                cost: { $sum: '$cost' }
                            }
                        },
                        { $sort: { calls: -1 } },
                        { $limit: 10 }
                    ]
                }
            }
        ]);

        const summary = stats[0].summary[0] || {
            totalCalls: 0,
            completedCalls: 0,
            failedCalls: 0,
            totalDuration: 0,
            totalCost: 0,
            avgDuration: 0,
            avgCost: 0
        };

        const successRate = summary.totalCalls > 0 ?
            ((summary.completedCalls / summary.totalCalls) * 100).toFixed(2) :
            0;

        res.json({
            success: true,
            data: {
                summary: {
                    ...summary,
                    successRate: parseFloat(successRate)
                },
                byCountry: stats[0].byCountry.map(c => ({
                    country: c._id,
                    calls: c.calls,
                    duration: c.duration,
                    cost: c.cost
                }))
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteCall = async(req, res, next) => {
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

        call.isDeleted = true;
        call.deletedAt = new Date();
        await call.save();

        res.json({
            success: true,
            message: 'Call deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};