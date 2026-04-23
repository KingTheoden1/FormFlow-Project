// LivePreview — shows what the form will look like to respondents.
//
// This panel sits in the right sidebar when "Preview" is toggled on.
// It has its own local step counter (previewStep) so you can click
// through the steps without affecting the builder's active step.
//
// Everything here is read-only — it's a visual snapshot of the Redux state.

import { useState } from 'react'
import { useAppSelector } from '@/app/hooks'
import PreviewField from './PreviewField'

export default function LivePreview() {
  // Pull the form data we need from Redux
  const steps = useAppSelector((s) => s.builder.steps)
  const title = useAppSelector((s) => s.builder.title)
  const hasPaymentStep = useAppSelector((s) => s.builder.hasPaymentStep)

  // Local state — which step the preview is showing.
  // This is separate from the builder's activeStepIndex on purpose:
  // you should be able to preview step 2 while still editing step 1.
  const [previewStep, setPreviewStep] = useState(0)

  const currentStep = steps[previewStep]
  const isLastStep = previewStep === steps.length - 1

  return (
    <div className="p-4">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
        Live Preview
      </h2>

      {/* The form card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {/* Form title */}
        <h3 className="mb-1 text-xl font-bold text-gray-900">
          {title || 'Untitled Form'}
        </h3>

        {/* Step indicator — only shown when there are multiple steps */}
        {steps.length > 1 && (
          <p className="mb-4 text-xs text-gray-400" aria-live="polite">
            Step {previewStep + 1} of {steps.length}
            {hasPaymentStep ? ` (+ payment step)` : ''}
          </p>
        )}

        {/* Step title */}
        {currentStep && (
          <p className="mb-4 text-sm font-semibold text-gray-600">
            {currentStep.title}
          </p>
        )}

        {/* Fields */}
        {currentStep && (
          <div className="space-y-5">
            {currentStep.fields.length === 0 ? (
              <p className="text-sm italic text-gray-400">
                No fields in this step yet. Add some from the left panel.
              </p>
            ) : (
              currentStep.fields.map((field) => (
                <PreviewField key={field.id} field={field} />
              ))
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => setPreviewStep((p) => Math.max(0, p - 1))}
            disabled={previewStep === 0}
            className="rounded px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Go to previous step"
          >
            ← Back
          </button>

          <button
            onClick={() =>
              setPreviewStep((p) => Math.min(steps.length - 1, p + 1))
            }
            disabled={isLastStep}
            className="rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label={isLastStep ? 'Submit form' : 'Go to next step'}
          >
            {isLastStep ? (hasPaymentStep ? 'Proceed to Payment →' : 'Submit') : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}
