// EmbedForm — the interactive multi-step form shown to respondents.
//
// Responsibilities:
//   1. Track which step the user is on
//   2. Track the values typed into every field
//   3. Validate each step when the user clicks Next or Submit
//   4. If the form has a payment step:
//      a. Fetch a PaymentIntent clientSecret from the server
//      b. Show the PaymentStep component (Stripe Elements card form)
//      c. After payment succeeds, POST submission data + paymentIntentId
//   5. POST the collected data to the API on final submission
//   6. Show a success screen when done
//
// State lives here in React — no Redux needed for the embed.
// This is intentional: the embed is completely standalone.

import { useState } from 'react'
import type { FormDefinition, Field } from './types'
import EmbedField from './EmbedField'
import PaymentStep from './PaymentStep'

interface Props {
  form: FormDefinition
  apiUrl: string
  // Stripe publishable key — only required when form.hasPaymentStep is true
  stripeKey?: string
}

// FieldValues maps each field's ID to its current value.
// Checkbox fields store string[] (multiple selections); all others store string.
type FieldValues = Record<string, string | string[]>
type FieldErrors = Record<string, string>

// Build an initial values object with empty values for every field.
// We do this upfront so controlled inputs always have a defined value.
function getInitialValues(form: FormDefinition): FieldValues {
  const values: FieldValues = {}
  for (const step of form.steps) {
    for (const field of step.fields) {
      values[field.id] = field.type === 'checkbox' ? [] : ''
    }
  }
  return values
}

// Validate all fields in a single step. Returns a map of fieldId → error message.
// An empty object means the step is valid.
function validateStep(fields: Field[], values: FieldValues): FieldErrors {
  const errors: FieldErrors = {}

  for (const field of fields) {
    const value = values[field.id]

    // Required check
    if (field.required) {
      if (field.type === 'checkbox') {
        if ((value as string[]).length === 0) {
          errors[field.id] = 'Please select at least one option.'
        }
      } else if (!value || (value as string).trim() === '') {
        errors[field.id] = 'This field is required.'
      }
    }

    // Email format check — only run if the field has a value
    if (
      field.type === 'email' &&
      value &&
      (value as string).trim() !== ''
    ) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailPattern.test(value as string)) {
        errors[field.id] = 'Please enter a valid email address.'
      }
    }
  }

  return errors
}

export default function EmbedForm({ form, apiUrl, stripeKey }: Props) {
  const [stepIndex,      setStepIndex]      = useState(0)
  const [values,         setValues]         = useState<FieldValues>(getInitialValues(form))
  const [errors,         setErrors]         = useState<FieldErrors>({})
  const [submitting,     setSubmitting]     = useState(false)
  const [submitted,      setSubmitted]      = useState(false)
  const [submitError,    setSubmitError]    = useState<string | null>(null)

  // Payment step state
  const [showPayment,    setShowPayment]    = useState(false)
  const [clientSecret,   setClientSecret]   = useState<string | null>(null)
  const [loadingPayment, setLoadingPayment] = useState(false)
  const [paymentError,   setPaymentError]   = useState<string | null>(null)

  const currentStep    = form.steps[stepIndex]
  // isLastFormStep = we're on the last regular (non-payment) step
  const isLastFormStep = stepIndex === form.steps.length - 1
  // isLastStep = clicking the primary button should submit (no payment)
  const isLastStep     = isLastFormStep && !form.hasPaymentStep

  // Total step count including the optional payment step
  const totalSteps = form.steps.length + (form.hasPaymentStep ? 1 : 0)
  // Which step number to show in the progress indicator
  const displayStep = showPayment ? totalSteps : stepIndex + 1

  // ── Field changes ─────────────────────────────────────────────
  function handleChange(fieldId: string, value: string | string[]) {
    setValues((prev) => ({ ...prev, [fieldId]: value }))
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[fieldId]
        return next
      })
    }
  }

  // ── Navigation ────────────────────────────────────────────────
  function handleNext() {
    const stepErrors = validateStep(currentStep.fields, values)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }
    setErrors({})

    if (isLastFormStep && form.hasPaymentStep) {
      // Move to payment step — fetch a PaymentIntent first
      void fetchPaymentIntent()
    } else {
      setStepIndex((i) => i + 1)
    }
  }

  function handleBack() {
    if (showPayment) {
      // Going back from payment step → return to last form step
      setShowPayment(false)
      setClientSecret(null)
      setPaymentError(null)
    } else {
      setErrors({})
      setStepIndex((i) => i - 1)
    }
  }

  // ── Payment intent fetch ──────────────────────────────────────
  // Called when the user reaches the last form step and clicks Next.
  // We ask our server to create a Stripe PaymentIntent and return the
  // clientSecret — this is what Stripe Elements needs to render the card form.
  async function fetchPaymentIntent() {
    setLoadingPayment(true)
    setPaymentError(null)

    try {
      const res = await fetch(`${apiUrl}/api/stripe/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId: form.id }),
      })
      if (!res.ok) throw new Error(`Server error (${res.status})`)
      const data = await res.json() as { clientSecret: string }
      setClientSecret(data.clientSecret)
      setShowPayment(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setPaymentError(`Could not load payment form — ${message}. Please try again.`)
    } finally {
      setLoadingPayment(false)
    }
  }

  // ── Submission ────────────────────────────────────────────────
  // Called after successful payment (or directly on submit if no payment).
  async function submitForm(paymentIntentId?: string) {
    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch(
        `${apiUrl}/api/forms/${form.id}/submissions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: values,
            // Include the paymentIntentId so the server can link
            // this submission to the Stripe charge
            ...(paymentIntentId ? { paymentIntentId } : {}),
          }),
        }
      )
      if (!res.ok) throw new Error(`Server error (${res.status})`)
      setSubmitted(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setSubmitError(`Something went wrong — ${message}. Please try again.`)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmit() {
    const stepErrors = validateStep(currentStep.fields, values)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }
    await submitForm()
  }

  // Called by PaymentStep when Stripe confirms the charge
  async function handlePaymentComplete(paymentIntentId: string) {
    await submitForm(paymentIntentId)
  }

  // ── Success screen ────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="ff-form">
        <div className="ff-success" role="status" aria-live="polite">
          <div className="ff-success-icon" aria-hidden="true">✅</div>
          <h2 className="ff-success-title">Thank you!</h2>
          <p className="ff-success-msg">
            Your response has been submitted successfully.
          </p>
        </div>
      </div>
    )
  }

  // ── Payment step ──────────────────────────────────────────────
  // Shown after all regular form steps when hasPaymentStep is true.
  if (showPayment && clientSecret && stripeKey) {
    return (
      <div className="ff-form">
        <h1 className="ff-title">{form.title}</h1>

        {totalSteps > 1 && (
          <p className="ff-step-indicator" aria-live="polite" aria-atomic="true">
            Step {displayStep} of {totalSteps}
          </p>
        )}

        <PaymentStep
          stripeKey={stripeKey}
          clientSecret={clientSecret}
          amount={form.paymentAmount ?? 0}
          currency={form.paymentCurrency ?? 'usd'}
          onComplete={(id) => void handlePaymentComplete(id)}
          onBack={handleBack}
        />

        {/* Show submission error after payment if the API call fails */}
        {submitError && (
          <div className="ff-submit-error" role="alert" style={{ marginTop: 12 }}>
            {submitError} Your payment went through — please contact support.
          </div>
        )}
      </div>
    )
  }

  // ── Loading payment intent ────────────────────────────────────
  if (loadingPayment) {
    return (
      <div className="ff-form">
        <p className="ff-loading" aria-live="polite">Loading payment form…</p>
      </div>
    )
  }

  // ── Regular form steps ────────────────────────────────────────
  return (
    <div className="ff-form">
      <h1 className="ff-title">{form.title}</h1>

      {/* Step progress indicator — shown when there are multiple steps */}
      {totalSteps > 1 && (
        <p className="ff-step-indicator" aria-live="polite" aria-atomic="true">
          Step {displayStep} of {totalSteps}
        </p>
      )}

      {/* Error loading payment intent */}
      {paymentError && (
        <div className="ff-submit-error" role="alert">
          {paymentError}
        </div>
      )}

      {/* noValidate disables browser built-in validation bubbles */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          isLastStep ? void handleSubmit() : handleNext()
        }}
        noValidate
        aria-label={form.title}
      >
        {currentStep.fields.map((field) => (
          <EmbedField
            key={field.id}
            field={field}
            value={values[field.id] ?? (field.type === 'checkbox' ? [] : '')}
            error={errors[field.id]}
            onChange={(val) => handleChange(field.id, val)}
          />
        ))}

        {/* Submission error — shown if the API call fails */}
        {submitError && (
          <div className="ff-submit-error" role="alert">
            {submitError}
          </div>
        )}

        <div className="ff-nav">
          <button
            type="button"
            onClick={handleBack}
            disabled={stepIndex === 0}
            className="ff-btn ff-btn-secondary"
            aria-label="Go to previous step"
          >
            ← Back
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="ff-btn ff-btn-primary"
          >
            {submitting
              ? 'Submitting…'
              : isLastFormStep && form.hasPaymentStep
              ? 'Next → Payment'
              : isLastStep
              ? 'Submit'
              : 'Next →'}
          </button>
        </div>
      </form>
    </div>
  )
}
