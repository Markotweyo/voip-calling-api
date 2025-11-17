# Stripe Payment Integration Setup

This guide explains how to set up Stripe payment processing for credit purchases.

## Backend Configuration

### 1. Environment Variables

Add the following to your `.env` file in `voip-calling-api`:

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 2. Get Stripe API Keys

1. Sign up for a [Stripe account](https://stripe.com)
2. Go to [Stripe Dashboard](https://dashboard.stripe.com)
3. Navigate to **Developers** > **API keys**
4. Copy your **Publishable key** and **Secret key** (use test keys for development)
5. Add them to your `.env` file

### 3. Set Up Webhook Endpoint

For production, set up a Stripe webhook to handle payment confirmations:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** > **Webhooks**
3. Click **Add endpoint**
4. Enter your webhook URL: `https://yourdomain.com/api/stripe/webhook`
5. Select events: `payment_intent.succeeded`
6. Copy the **Signing secret** and add it to `.env` as `STRIPE_WEBHOOK_SECRET`

### 4. Local Webhook Testing

For local development, use [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
# Install Stripe CLI
# macOS: brew install stripe/stripe-cli/stripe
# Windows: Download from https://github.com/stripe/stripe-cli/releases

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:5000/api/stripe/webhook
```

The CLI will output a webhook signing secret. Use this for `STRIPE_WEBHOOK_SECRET` in development.

## Frontend Configuration

### 1. Environment Variables

Add the following to your `.env` file in `phonely`:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
VITE_API_URL=http://localhost:5000
```

### 2. Install Dependencies

The Stripe dependencies are already added to `package.json`. Install them:

```bash
cd phonely
npm install
```

## API Endpoints

### Backend Endpoints

- `POST /api/stripe/create-payment-intent` - Create a payment intent for a credit package
  - Requires authentication
  - Body: `{ packageId: string }`
  - Returns: `{ clientSecret: string, amount: number, credits: number }`

- `POST /api/stripe/confirm-payment` - Confirm payment and add credits
  - Requires authentication
  - Body: `{ paymentIntentId: string }`
  - Returns: `{ transaction: {...}, newBalance: number }`

- `POST /api/stripe/webhook` - Stripe webhook endpoint (no auth)
  - Handles `payment_intent.succeeded` events
  - Automatically processes payments and adds credits

## Payment Flow

1. **User clicks "Purchase"** on a credit package
2. **Frontend calls** `/api/stripe/create-payment-intent` with packageId
3. **Backend creates** Stripe Payment Intent and returns clientSecret
4. **Frontend opens** Stripe payment modal with payment form
5. **User enters** payment details and submits
6. **Stripe processes** payment client-side
7. **Frontend confirms** payment with backend via `/api/stripe/confirm-payment`
8. **Backend verifies** payment with Stripe and adds credits to user account
9. **Webhook also processes** payment (redundant confirmation for reliability)

## Testing with Stripe Test Cards

Use these test card numbers:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`

Use any future expiry date, any 3-digit CVC, and any ZIP code.

## Security Notes

1. **Never expose** `STRIPE_SECRET_KEY` on the frontend
2. **Always verify** webhook signatures in production
3. **Use HTTPS** in production for webhook endpoints
4. **Validate** payment intents server-side before crediting accounts
5. **Handle** payment failures gracefully

## Troubleshooting

### Payment form doesn't appear
- Check that `VITE_STRIPE_PUBLISHABLE_KEY` is set correctly
- Verify Stripe is loaded in browser console

### Payment fails
- Check Stripe dashboard for error logs
- Verify API keys are correct (test vs live keys)
- Check browser console for errors

### Webhook not receiving events
- Verify webhook URL is correct
- Check webhook secret matches
- Use Stripe CLI for local testing
- Check server logs for webhook errors

