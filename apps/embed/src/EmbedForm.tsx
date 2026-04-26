// EmbedForm — the interactive multi-step form shown to respondents.
//
// Responsibilities:
//   1. Track which step the user is on
//   2. Track the values typed into every field
//   3. Validate each step when the user clicks Next or Submit
//   4. POST the collected data to the API on final submission
//   5. Show a success screen when done
//
// State lives here in React — no Redux needed for the embed.
// This is intentional: the embed is completely standalone.

import { useState } from 'react'
import type { FormDefinition, Field } from './types'
import EmbedField from './EmbedField'

interface Props {
  form: FormDefinition
  apiUrl: string
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

export default function EmbedForm({ form, apiUrl }: Props) {
  const [stepIndex,   setStepIndex]   = useState(0)
  const [values,      setValues]      = useState<FieldValues>(getInitialValues(form))
  const [errors,      setErrors]      = useState<FieldErrors>({})
  const [submitting,  setSubmitting]  = useState(false)
  const [submitted,   setSubmitted]   = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const currentStep = form.steps[stepIndex]
  const isLastStep  = stepIndex === form.steps.length - 1

  // Update a single field's value and clear its error (if any)
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

  // Validate the current step. If valid, advance to the next step.
  function handleNext() {
    const stepErrors = validateStep(currentStep.fields, values)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }
    setErrors({})
    setStepIndex((i) => i + 1)
  }

  function handleBack() {
    setErrors({})
    setStepIndex((i) => i - 1)
  }

  // Validate the final step and POST all collected data to the API.
  async function handleSubmit() {
    const stepErrors = validateStep(currentStep.fields, values)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch(
        `${apiUrl}/api/forms/${form.id}/submissions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // `values` contains every field across all steps
          body: JSON.stringify({ data: values }),
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

  // ── Form ──────────────────────────────────────────────────────
  return (
    <div className="ff-form">
      <h1 className="ff-title">{form.title}</h1>

      {/* Step progress indicator — only shown when there are multiple steps */}
      {form.steps.length > 1 && (
        <p className="ff-step-indicator" aria-live="polite" aria-atomic="true">
          Step {stepIndex + 1} of {form.steps.length}
        </p>
      )}

      {/* noValidate disables the browser's built-in validation bubbles
          so we can show our own styled error messages instead */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          isLastStep ? handleSubmit() : handleNext()
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
              : isLastStep
              ? 'Submit'
              : 'Next →'}
          </button>
        </div>
      </form>
    </div>
  )
}
