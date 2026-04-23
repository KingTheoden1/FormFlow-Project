// StepTabs — the tab bar above the canvas.
// Shows one tab per step. Clicking switches the active step.
// The "✕" button removes a step (only shown when there are 2+ steps).
// "+ Add Step" appends a blank step at the end.

import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { addStep, removeStep, setActiveStep } from '@/features/builder/builderSlice'

export default function StepTabs() {
  const dispatch = useAppDispatch()

  // Read steps array and which step is currently active from Redux state
  const steps = useAppSelector((s) => s.builder.steps)
  const activeStepIndex = useAppSelector((s) => s.builder.activeStepIndex)

  return (
    // role="tablist" tells screen readers this is a tab navigation bar
    <div
      className="flex items-center gap-1 border-b border-gray-200 bg-white px-4 pt-2"
      role="tablist"
      aria-label="Form steps"
    >
      {steps.map((step, index) => {
        const isActive = index === activeStepIndex
        return (
          <div key={step.id} className="flex items-center">
            {/* role="tab" + aria-selected tell screen readers this is a tab button */}
            <button
              role="tab"
              aria-selected={isActive}
              onClick={() => dispatch(setActiveStep(index))}
              className={`rounded-t px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? 'border-b-2 border-brand-600 text-brand-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {step.title}
            </button>

            {/* Only show the remove button when there's more than one step.
                You always need at least one step in a form. */}
            {steps.length > 1 && (
              <button
                onClick={() => dispatch(removeStep(step.id))}
                className="ml-1 rounded p-0.5 text-gray-400 hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                aria-label={`Remove ${step.title}`}
              >
                ✕
              </button>
            )}
          </div>
        )
      })}

      <button
        onClick={() => dispatch(addStep())}
        className="ml-2 rounded px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        aria-label="Add a new step"
      >
        + Add Step
      </button>
    </div>
  )
}
