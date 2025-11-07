require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Contact = require('../models/Contact');
const Call = require('../models/Call');
const Transaction = require('../models/Transaction');
const CallingRate = require('../models/CallingRate');
const { MOCK_USERS, MOCK_CONTACTS_TEMPLATE, MOCK_RATES } = require('./mockData');

const seedDatabase = async() => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('📦 Connected to MongoDB');

        // Clear existing data
        await Promise.all([
            User.deleteMany({}),
            Contact.deleteMany({}),
            Call.deleteMany({}),
            Transaction.deleteMany({}),
            CallingRate.deleteMany({})
        ]);

        console.log('🧹 Cleared existing data');

        // Seed users
        const users = await User.create(MOCK_USERS);
        console.log(`✅ Created ${users.length} users`);

        // Seed calling rates
        const rates = await CallingRate.create(MOCK_RATES);
        console.log(`✅ Created ${rates.length} calling rates`);

        // Seed contacts, calls, and transactions for each user
        for (const user of users) {
            // Create contacts
            const contacts = MOCK_CONTACTS_TEMPLATE.map(c => ({
                userId: user._id,
                name: c.name,
                phoneNumber: c.phone,
                group: c.group,
                isFavorite: Math.random() > 0.7
            }));
            await Contact.create(contacts);

            // Create call history
            const calls = [];
            for (let i = 0; i < 20; i++) {
                const contact = contacts[Math.floor(Math.random() * contacts.length)];
                const rate = rates[Math.floor(Math.random() * rates.length)];
                const duration = Math.floor(Math.random() * 600) + 30; // 30-630 seconds
                const cost = (Math.ceil(duration / 60) * rate.ratePerMinute).toFixed(2);

                calls.push({
                    userId: user._id,
                    to: contact.phoneNumber,
                    from: process.env.TWILIO_PHONE_NUMBER || '+19876543210',
                    contactName: contact.name,
                    status: Math.random() > 0.1 ? 'completed' : 'failed',
                    startTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                    endTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000 + duration * 1000),
                    duration,
                    cost: parseFloat(cost),
                    ratePerMinute: rate.ratePerMinute,
                    country: rate.country,
                    countryCode: rate.countryCode,
                    twilioCallSid: `CA${Math.random().toString(36).substr(2, 32)}`
                });
            }
            await Call.create(calls);

            // Create transactions
            const transactions = [{
                    userId: user._id,
                    type: 'credit_purchase',
                    amount: 20.00,
                    creditAmount: 25.00,
                    status: 'completed',
                    paymentMethod: 'stripe',
                    description: 'Popular Pack - 25 credits'
                },
                {
                    userId: user._id,
                    type: 'credit_purchase',
                    amount: 35.00,
                    creditAmount: 50.00,
                    status: 'completed',
                    paymentMethod: 'paypal',
                    description: 'Pro Pack - 50 credits'
                }
            ];
            await Transaction.create(transactions);
        }

        console.log('✅ Seeded contacts, calls, and transactions for all users');
        console.log('\n🎉 Database seeding completed successfully!');
        console.log('\n📝 Test user credentials:');
        MOCK_USERS.forEach(u => {
            console.log(`   Email: ${u.email}`);
            console.log(`   Password: ${u.password}`);
            console.log(`   Balance: $${u.creditBalance}\n`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
};

seedDatabase();