const bcrypt = require('bcryptjs');

const MOCK_USERS = [{
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'Password123!',
        phone: '+15555551234',
        creditBalance: 50.00,
        emailVerified: true,
        accountStatus: 'active'
    },
    {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        password: 'Password123!',
        phone: '+15555555678',
        creditBalance: 25.00,
        emailVerified: true,
        accountStatus: 'active'
    },
    {
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        password: 'Password123!',
        phone: '+15555559999',
        creditBalance: 100.00,
        emailVerified: true,
        accountStatus: 'active'
    }
];

const MOCK_CONTACTS_TEMPLATE = [
    { name: 'Alice Williams', phone: '+15551234567', group: 'Friends' },
    { name: 'Charlie Brown', phone: '+15552345678', group: 'Family' },
    { name: 'David Miller', phone: '+15553456789', group: 'Work' },
    { name: 'Emma Davis', phone: '+15554567890', group: 'Friends' },
    { name: 'Frank Wilson', phone: '+15555678901', group: 'Work' },
    { name: 'Grace Taylor', phone: '+15556789012', group: 'Family' },
    { name: 'Henry Anderson', phone: '+15557890123', group: 'Friends' },
    { name: 'Ivy Thomas', phone: '+15558901234', group: 'Work' },
    { name: 'Jack Moore', phone: '+15559012345', group: 'Friends' },
    { name: 'Kelly Martin', phone: '+15550123456', group: 'Family' }
];

const MOCK_RATES = [
    { country: 'United States', countryCode: 'US', prefix: '+1', ratePerMinute: 0.012, type: 'mobile' },
    { country: 'United Kingdom', countryCode: 'GB', prefix: '+44', ratePerMinute: 0.025, type: 'mobile' },
    { country: 'Canada', countryCode: 'CA', prefix: '+1', ratePerMinute: 0.012, type: 'mobile' },
    { country: 'Australia', countryCode: 'AU', prefix: '+61', ratePerMinute: 0.030, type: 'mobile' },
    { country: 'Germany', countryCode: 'DE', prefix: '+49', ratePerMinute: 0.028, type: 'mobile' },
    { country: 'France', countryCode: 'FR', prefix: '+33', ratePerMinute: 0.026, type: 'mobile' },
    { country: 'Spain', countryCode: 'ES', prefix: '+34', ratePerMinute: 0.024, type: 'mobile' },
    { country: 'Italy', countryCode: 'IT', prefix: '+39', ratePerMinute: 0.027, type: 'mobile' },
    { country: 'Japan', countryCode: 'JP', prefix: '+81', ratePerMinute: 0.045, type: 'mobile' },
    { country: 'China', countryCode: 'CN', prefix: '+86', ratePerMinute: 0.035, type: 'mobile' },
    { country: 'India', countryCode: 'IN', prefix: '+91', ratePerMinute: 0.018, type: 'mobile' },
    { country: 'Brazil', countryCode: 'BR', prefix: '+55', ratePerMinute: 0.032, type: 'mobile' },
    { country: 'Mexico', countryCode: 'MX', prefix: '+52', ratePerMinute: 0.022, type: 'mobile' },
    { country: 'South Africa', countryCode: 'ZA', prefix: '+27', ratePerMinute: 0.029, type: 'mobile' },
    { country: 'Nigeria', countryCode: 'NG', prefix: '+234', ratePerMinute: 0.038, type: 'mobile' }
];

module.exports = {
    MOCK_USERS,
    MOCK_CONTACTS_TEMPLATE,
    MOCK_RATES
};