# Debugging Stripe API Key Errors

If you're getting "Invalid API KEY provided" errors, follow these steps:

## 1. Check Backend Environment Variables

### Verify `.env` file exists in `voip-calling-api/` directory:

```bash
cd voip-calling-api
ls -la .env
```

### Check the key format:

The `STRIPE_SECRET_KEY` should:
- Start with `sk_test_` (for test mode) or `sk_live_` (for production)
- Be exactly as shown in your Stripe Dashboard
- Have no extra spaces or quotes

**Correct format:**
```env
STRIPE_SECRET_KEY=sk_test_51AbC123...
```

**Wrong formats:**
```env
# ❌ Don't include quotes
STRIPE_SECRET_KEY="sk_test_51AbC123..."

# ❌ Don't have spaces
STRIPE_SECRET_KEY = sk_test_51AbC123...

# ❌ Don't use publishable key here
STRIPE_SECRET_KEY=pk_test_51AbC123...
```

## 2. Check Frontend Environment Variables

### Verify `.env` file exists in `phonely/` directory:

```bash
cd phonely
ls -la .env
```

### Check the key format:

The `VITE_STRIPE_PUBLISHABLE_KEY` should:
- Start with `pk_test_` (for test mode) or `pk_live_` (for production)
- Have the `VITE_` prefix (required for Vite)
- Have no extra spaces or quotes

**Correct format:**
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51AbC123...
```

**Wrong formats:**
```env
# ❌ Missing VITE_ prefix
STRIPE_PUBLISHABLE_KEY=pk_test_51AbC123...

# ❌ Don't include quotes
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_51AbC123..."

# ❌ Don't have spaces
VITE_STRIPE_PUBLISHABLE_KEY = pk_test_51AbC123...
```

## 3. Restart Your Servers

**IMPORTANT:** After changing `.env` files, you MUST restart:

### Backend:
```bash
cd voip-calling-api
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

### Frontend:
```bash
cd phonely
# Stop the dev server (Ctrl+C)
# Then restart:
npm run dev
```

Environment variables are loaded when the server starts, so changes won't take effect until restart.

## 4. Verify Keys in Stripe Dashboard

1. Go to https://dashboard.stripe.com/test/apikeys
2. Make sure you're in **Test mode** (toggle in top right)
3. Copy the **Secret key** (starts with `sk_test_`)
4. Copy the **Publishable key** (starts with `pk_test_`)
5. Verify they match what's in your `.env` files

## 5. Check Console Logs

### Backend console should show:
```
🚀 Server running on port 5000
📍 Environment: development
🌐 API URL: http://localhost:5000/api
```

If you see Stripe errors, they'll appear in the backend console.

### Frontend browser console should show:
- Check for any Stripe initialization errors
- Look for "Invalid API KEY" messages
- Verify the key format in console

## 6. Common Issues

### Issue: "STRIPE_SECRET_KEY is not set"
**Solution:** 
- Check `.env` file exists in `voip-calling-api/`
- Verify variable name is exactly `STRIPE_SECRET_KEY`
- Restart backend server

### Issue: "Invalid STRIPE_SECRET_KEY format"
**Solution:**
- Key must start with `sk_test_` or `sk_live_`
- Remove any quotes or spaces
- Copy directly from Stripe Dashboard

### Issue: Frontend shows "Invalid API KEY"
**Solution:**
- Check `.env` file exists in `phonely/`
- Verify variable name starts with `VITE_`
- Verify key starts with `pk_test_` or `pk_live_`
- Restart frontend dev server

### Issue: Keys seem correct but still get errors
**Solution:**
- Make sure test keys match (both must be test mode or both live mode)
- Verify you copied the entire key (they're long!)
- Check for hidden characters (try retyping)
- Restart both servers

## 7. Test Keys

For testing, use Stripe test keys:
- **Publishable key:** `pk_test_...`
- **Secret key:** `sk_test_...`

These can be used with test card: `4242 4242 4242 4242`

## 8. Quick Verification

### Backend:
```bash
cd voip-calling-api
node -e "require('dotenv').config(); console.log('Key exists:', !!process.env.STRIPE_SECRET_KEY); console.log('Key starts with:', process.env.STRIPE_SECRET_KEY?.substring(0, 7));"
```

### Frontend:
Check in browser console:
```javascript
console.log('Stripe Key:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.substring(0, 10) + '...');
```

If these don't show your keys, the environment variables aren't loading correctly.

