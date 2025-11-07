const Contact = require('../models/Contact');
const { parsePhoneNumber } = require('libphonenumber-js');

exports.getContacts = async(req, res, next) => {
    try {
        const { search, group, favorite } = req.query;

        const filter = { userId: req.user._id };

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phoneNumber: { $regex: search, $options: 'i' } }
            ];
        }

        if (group) filter.group = group;
        if (favorite !== undefined) filter.isFavorite = favorite === 'true';

        const contacts = await Contact.find(filter).sort({ name: 1 });

        res.json({
            success: true,
            data: { contacts }
        });
    } catch (error) {
        next(error);
    }
};

exports.createContact = async(req, res, next) => {
    try {
        const { name, phoneNumber, email, group, notes } = req.body;

        // Normalize phone number
        let normalizedPhone;
        try {
            const parsed = parsePhoneNumber(phoneNumber);
            normalizedPhone = parsed.format('E.164');
        } catch {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PHONE',
                    message: 'Invalid phone number format'
                }
            });
        }

        // Check for duplicate
        const existing = await Contact.findOne({
            userId: req.user._id,
            phoneNumber: normalizedPhone
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'DUPLICATE_CONTACT',
                    message: 'Contact with this number already exists'
                }
            });
        }

        const contact = await Contact.create({
            userId: req.user._id,
            name,
            phoneNumber: normalizedPhone,
            email,
            group: group || 'General',
            notes
        });

        res.status(201).json({
            success: true,
            data: { contact }
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteContact = async(req, res, next) => {
    try {
        const contact = await Contact.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Contact not found'
                }
            });
        }

        res.json({
            success: true,
            message: 'Contact deleted'
        });
    } catch (error) {
        next(error);
    }
};