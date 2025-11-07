# VoIP Calling API - Complete Backend

A fully functional VoIP calling API backend with WebRTC, Twilio integration, credit management, and comprehensive call history tracking.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your MongoDB connection and other settings
```

### 3. Seed Mock Data
```bash
npm run seed
```

### 4. Start Server
```bash
npm run dev
```

The API will be running at `http://localhost:5000`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Credits
- `GET /api/credits/balance` - Get credit balance
- `GET /api/credits/packages` - Get available packages
- `POST /api/credits/purchase` - Purchase credits
- `GET /api/credits/transactions` - Get transaction history

### Calls
- `POST /api/calls/token` - Get Twilio token
- `POST /api/calls/initiate` - Initiate call
- `POST /api/calls/:id/end` - End call
- `GET /api/calls/rates` - Get calling rates

### Call History
- `GET /api/call-history` - Get call history (paginated)
- `GET /api/call-history/:id` - Get specific call
- `GET /api/call-history/stats` - Get statistics
- `DELETE /api/call-history/:id` - Delete call

### Contacts
- `GET /api/contacts` - Get all contacts
- `POST /api
- `POST /api/contacts` - Create contact
- `DELETE /api/contacts/:id` - Delete contact

### User Profile
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile

## 🧪 Test Credentials

After seeding the database, use these credentials:

```
Email: john.doe@example.com
Password: Password123!
Balance: $50.00

Email: jane.smith@example.com
Password: Password123!
Balance: $25.00

Email: bob.johnson@example.com
Password: Password123!
Balance: $100.00
```

## 📦 Features

- ✅ JWT Authentication
- ✅ User Management
- ✅ Credit System with Packages
- ✅ Call Management (Initiate/End)
- ✅ Call History with Statistics
- ✅ Contact Management
- ✅ Calling Rates by Country
- ✅ Transaction History
- ✅ Mock Data for Testing
- ✅ Error Handling
- ✅ Rate Limiting
- ✅ Security Headers

## 🛠️ Tech Stack

- Node.js & Express
- MongoDB & Mongoose
- JWT Authentication
- bcryptjs for Password Hashing
- Twilio (ready for integration)
- Express Validator
- Rate Limiting
- Helmet for Security
- Nodemailer (ready for email notifications)


## 📝 Example API Calls

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "name": "Test User",
    "phone": "+15555551234"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "Password123!"
  }'
```

### Get Call History
```bash
curl -X GET http://localhost:5000/api/call-history?page=1&limit=20 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Initiate Call
```bash
curl -X POST http://localhost:5000/api/calls/initiate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+15555551234",
    "from": "+19876543210"
  }'
```

### Purchase Credits
```bash
curl -X POST http://localhost:5000/api/credits/purchase \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": "pkg_popular",
    "paymentMethod": "mock"
  }'
```

## 🔧 Configuration

Edit `.env` file:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/voip-calling-db
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
TWILIO_PHONE_NUMBER=+15555551234
```

## 📂 Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── models/         # Mongoose models
├── routes/         # API routes
├── mock/           # Mock data and seeding
├── app.js          # Express app setup
└── server.js       # Server entry point
```

## 🚨 Important Notes

1. **Mock Payments**: Currently uses mock payment processing. Integrate Stripe/PayPal for production.
2. **Twilio**: Uses mock Twilio tokens. Add real Twilio credentials for production calls.
3. **Email**: Email service is configured but not implemented. Add nodemailer for production.
4. **Redis**: Optional caching layer not included. Add for production performance.

## 🔐 Security Features

- Helmet.js for security headers
- JWT token authentication
- Password hashing with bcrypt
- Input validation
- Rate limiting on auth endpoints
- CORS configuration

## 📊 Database Schema

### User
- name, email, password (hashed)
- phone, timezone, language
- creditBalance, accountStatus
- timestamps

### Call
- userId, to, from, status
- duration, cost, ratePerMinute
- country, countryCode
- timestamps

### Contact
- userId, name, phoneNumber
- email, group, isFavorite
- notes, callCount
- timestamps

### Transaction
- userId, type, amount
- creditAmount, status
- paymentMethod, paymentId
- timestamps

### CallingRate
- country, countryCode, prefix
- ratePerMinute, currency, type
- timestamps

## 🧪 Testing

Run tests (when test files are added):
```bash
npm test
```

## 📈 Next Steps

1. **Frontend Integration**: Connect React/Vue frontend
2. **Real Twilio Integration**: Add actual Twilio credentials
3. **Payment Gateway**: Integrate Stripe or PayPal
4. **Email Service**: Implement email notifications
5. **Redis Caching**: Add Redis for performance
6. **File Upload**: Add profile picture upload
7. **WebSocket**: Real-time call status updates
8. **Call Recording**: Implement call recording feature
9. **Analytics**: Advanced analytics dashboard
10. **Deployment**: Deploy to AWS/Heroku/DigitalOcean

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Make sure MongoDB is running
mongod

# Or update MONGODB_URI in .env to use MongoDB Atlas
```

### Port Already in Use
```bash
# Change PORT in .env
PORT=5001
```

### Dependencies Not Installing
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review error logs in console
3. Ensure all environment variables are set
4. Verify MongoDB is running

## 📄 License

MIT License - Free to use for commercial projects

---

**Built with ❤️ for the VoIP calling community**