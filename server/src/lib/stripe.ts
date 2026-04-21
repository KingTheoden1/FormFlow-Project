import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required')
}

// Single Stripe instance — reused across all requests
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-09-30.acacia',
  // Telemetry is disabled — don't send usage data to Stripe
  telemetry: false,
})
