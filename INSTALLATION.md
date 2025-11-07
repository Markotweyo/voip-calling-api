## Installation & Setup Instructions

### Prerequisites
- Node.js v16+ and npm
- MongoDB (local or MongoDB Atlas)
- Redis (optional, for caching)
- Twilio Account (for production)

### Quick Start

1. **Clone/Download and Navigate:**
```bash
cd voip-calling-api
```

2. **Install Dependencies:**
```bash
npm install
```

3. **Configure Environment:**
```bash
cp .env.example .env
# Edit .env with your settings
```

4. **Seed Mock Data:**
```bash
npm run seed
```

5. **Run Development Server:**
```bash
npm run dev
```

6. **Run Tests:**
```bash
npm test
```