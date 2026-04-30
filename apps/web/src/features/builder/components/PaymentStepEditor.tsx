// PaymentStepEditor — lets the form owner configure the optional payment step.
//
// Shown at the bottom of the left sidebar in BuilderLayout.
// When the "Collect payment" toggle is ON the owner sets:
//   • Amount  — entered in dollars (e.g. 12.50), stored in Redux as cents (1250)
//   • Description — shown to respondents on the payment screen
//
// Why dollars in the input but cents in Redux?
// Stripe requires amounts in the smallest currency unit (cents for USD).
// Storing cents in Redux avoids floating-point rounding bugs when we later
// send the amount to the server.
//
// The currency is fixed to USD for now — multi-currency support is M7.

import { useAppDispatch, useAppSelector } from '@/app/hooks'
import {
  setHasPaymentStep,
  setPaymentAmount,
  setPaymentDescription,
} from '@/features/builder/builderSlice'

export default function PaymentStepEditor() {
  const dispatch    = useAppDispatch()
  const hasPayment  = useAppSelector((s) => s.builder.hasPaymentStep)
  const amountCents = useAppSelector((s) => s.builder.paymentAmount)
  const description = useAppSelector((s) => s.builder.paymentDescription)

  // Convert cents → display dollars for the input field
  const amountDollars = amountCents > 0 ? (amountCents / 100).toFixed(2) : ''

  function handleAmountChange(raw: string) {
    // Parse the dollar amount and convert back to cents.
    // parseFloat handles "12.50" → 12.5 → 1250
    const dollars = parseFloat(raw)
    if (!isNaN(dollars) && dollars > 0) {
      dispatch(setPaymentAmount(Math.round(dollars * 100)))
    } else {
      dispatch(setPaymentAmount(0))
    }
  }

  return (
    <section
      className="border-t border-gray-200 p-4"
      aria-label="Payment settings"
    >
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Payment
      </h3>

      {/* Toggle — enables/disables the payment step */}
      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={hasPayment}
          onChange={(e) => dispatch(setHasPaymentStep(e.target.checked))}
          className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-2 focus:ring-brand-500"
          aria-describedby="payment-toggle-hint"
        />
        Collect payment
      </label>
      <p
        id="payment-toggle-hint"
        className="mt-1 text-xs text-gray-400"
      >
        Adds a Stripe payment step at the end of your form.
      </p>

      {/* Amount + description fields — only visible when payment is on */}
      {hasPayment && (
        <div className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="payment-amount"
              className="mb-1 block text-xs font-medium text-gray-600"
            >
              Amount (USD)
            </label>
            {/* type="number" with step="0.01" allows decimals like 12.50 */}
            <div className="relative">
              <span
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              >
                $
              </span>
              <input
                id="payment-amount"
                type="number"
                min="0.50"
                step="0.01"
                value={amountDollars}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                className="w-full rounded border border-gray-300 py-1.5 pl-7 pr-3 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            {amountCents > 0 && (
              <p className="mt-0.5 text-xs text-gray-400">
                Respondents will be charged ${(amountCents / 100).toFixed(2)} USD
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="payment-description"
              className="mb-1 block text-xs font-medium text-gray-600"
            >
              Payment description
            </label>
            <input
              id="payment-description"
              type="text"
              value={description}
              onChange={(e) => dispatch(setPaymentDescription(e.target.value))}
              placeholder="e.g. Registration fee"
              className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              maxLength={200}
            />
          </div>
        </div>
      )}
    </section>
  )
}
