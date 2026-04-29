// PaymentStep — Stripe Elements payment form for the embed widget.
//
// How Stripe Elements works (high level):
//   1. We call loadStripe() with the publishable key to load the Stripe.js SDK.
//   2. We wrap the form in <Elements> and give it the clientSecret that was
//      returned by our server's /api/stripe/create-payment-intent endpoint.
//   3. <PaymentElement> renders Stripe's hosted UI inside an <iframe>.
//      The card details NEVER touch our code — they go directly to Stripe.
//   4. On submit, stripe.confirmPayment() tells Stripe to charge the card.
//   5. If it succeeds, we get back a PaymentIntent with status 'succeeded'.
//      We pass the paymentIntent.id to the parent so it can be stored with
//      the form submission (the server links them via the Stripe webhook).
//
// Props:
//   stripeKey    — Stripe publishable key (pk_test_... or pk_live_...)
//   clientSecret — from /api/stripe/create-payment-intent
//   amount       — in cents (e.g. 1250 = $12.50)
//   currency     — ISO code, e.g. 'usd'
//   onComplete   — called with paymentIntentId when payment succeeds
//   onBack       — called when user clicks Back

import { useMemo, useState, type FormEvent } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

interface PaymentStepProps {
  stripeKey: string
  clientSecret: string
  amount: number
  currency: string
  onComplete: (paymentIntentId: string) => void
  onBack: () => void
}

// ── Inner form ────────────────────────────────────────────────────────────
// This component MUST live inside <Elements> to access the useStripe() and
// useElements() hooks.  It's a separate component from PaymentStep so the
// hooks can run after the provider has mounted.

interface InnerProps {
  amount: number
  currency: string
  onComplete: (paymentIntentId: string) => void
  onBack: () => void
}

function PaymentForm({ amount, currency, onComplete, onBack }: InnerProps) {
  // useStripe gives access to the Stripe object (for confirmPayment)
  // useElements gives access to the PaymentElement's data (Stripe manages this)
  const stripe   = useStripe()
  const elements = useElements()

  const [error,      setError]      = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  // Format the amount as a currency string for display (e.g. "$12.50")
  const formatted = (amount / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  })

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    // Stripe SDK not loaded yet — shouldn't happen but guard anyway
    if (!stripe || !elements) return

    setProcessing(true)
    setError(null)

    // confirmPayment submits the card details from <PaymentElement> to Stripe.
    // redirect: 'if_required' means we stay on the page for most card types.
    // (3D Secure cards may still redirect, but Stripe handles the return URL.)
    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })

    if (stripeError) {
      // stripeError.message is a user-friendly string (e.g. "Your card was declined.")
      setError(stripeError.message ?? 'Payment failed. Please try again.')
      setProcessing(false)
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      // Pass the ID back up — EmbedForm will include it in the submission POST
      onComplete(paymentIntent.id)
    } else {
      setError('Payment was not completed. Please try again.')
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Amount label shown above the card input */}
      <p className="ff-payment-amount">
        Amount due: <strong>{formatted}</strong>
      </p>

      {/* PaymentElement renders Stripe's card input inside an iframe.
          The card number, expiry, and CVC never touch our JavaScript. */}
      <div className="ff-payment-element">
        <PaymentElement />
      </div>

      {/* Stripe error message (e.g. "Your card was declined") */}
      {error && (
        <div className="ff-submit-error" role="alert">
          {error}
        </div>
      )}

      <div className="ff-nav">
        <button
          type="button"
          onClick={onBack}
          disabled={processing}
          className="ff-btn ff-btn-secondary"
          aria-label="Go back to the previous step"
        >
          ← Back
        </button>

        <button
          type="submit"
          disabled={!stripe || processing}
          className="ff-btn ff-btn-primary"
        >
          {processing ? 'Processing…' : `Pay ${formatted}`}
        </button>
      </div>
    </form>
  )
}

// ── Outer wrapper ─────────────────────────────────────────────────────────
// Loads Stripe.js and wraps the form in the <Elements> provider.

export default function PaymentStep({
  stripeKey,
  clientSecret,
  amount,
  currency,
  onComplete,
  onBack,
}: PaymentStepProps) {
  // useMemo stops us from calling loadStripe() on every re-render.
  // loadStripe() is memoized by the Stripe SDK anyway, but this is cleaner.
  const stripePromise = useMemo(() => loadStripe(stripeKey), [stripeKey])

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm
        amount={amount}
        currency={currency}
        onComplete={onComplete}
        onBack={onBack}
      />
    </Elements>
  )
}
