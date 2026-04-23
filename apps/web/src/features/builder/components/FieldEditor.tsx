// FieldEditor — the right panel that shows settings for the selected field.
//
// When no field is selected, it shows a prompt telling the user to click one.
// When a field IS selected, it renders inputs for:
//   - Label         (the question text shown to form respondents)
//   - Placeholder   (the grey hint text inside text/email inputs)
//   - Help text     (a note shown beneath the field)
//   - Required      (whether the form blocks submission without an answer)
//   - Options       (for dropdown and checkbox fields — the choices the user can pick)

import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { updateField } from '@/features/builder/builderSlice'
import type { Field, FieldOption } from '@/types/form'
import { nanoid } from 'nanoid'

export default function FieldEditor() {
  const dispatch = useAppDispatch()

  // Read current state from Redux
  const steps = useAppSelector((s) => s.builder.steps)
  const activeStepIndex = useAppSelector((s) => s.builder.activeStepIndex)
  const selectedFieldId = useAppSelector((s) => s.builder.selectedFieldId)

  const activeStep = steps[activeStepIndex]
  const field = activeStep?.fields.find((f) => f.id === selectedFieldId)

  // ── Empty state ──────────────────────────────────────────────
  if (!field || !activeStep) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <span className="text-4xl" aria-hidden="true">👆</span>
        <p className="mt-3 text-sm text-gray-400">
          Click any field in the canvas to edit its settings
        </p>
      </div>
    )
  }

  // Capture narrowed references in consts so TypeScript is confident they
  // can't become undefined inside the helper closures below.
  const safeStep = activeStep
  const safeField = field

  // ── Helper to dispatch a partial field update ────────────────
  // Instead of writing dispatch(updateField({...})) in every onChange,
  // we wrap it in a small helper that already knows the step and field IDs.
  function update(changes: Partial<Field>) {
    dispatch(updateField({ stepId: safeStep.id, fieldId: safeField.id, changes }))
  }

  // ── Options helpers (for dropdown and checkbox) ───────────────
  function addOption() {
    const newOption: FieldOption = {
      id: nanoid(),
      label: '',
      value: nanoid(), // temporary value — gets replaced when user types the label
    }
    update({ options: [...(safeField.options ?? []), newOption] })
  }

  function updateOption(optionId: string, label: string) {
    // When the user types a label, we also auto-generate a slug for the value
    // e.g. "Red Car" → "red_car"
    update({
      options: (safeField.options ?? []).map((o) =>
        o.id === optionId
          ? { ...o, label, value: label.toLowerCase().replace(/\s+/g, '_') || o.value }
          : o
      ),
    })
  }

  function removeOption(optionId: string) {
    update({ options: (safeField.options ?? []).filter((o) => o.id !== optionId) })
  }

  // Only dropdown and checkbox have a list of options to configure
  const showOptions = safeField.type === 'dropdown' || safeField.type === 'checkbox'

  return (
    <div className="p-4">
      <h2
        className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500"
        id="editor-heading"
      >
        Field Settings
      </h2>

      <div className="space-y-5" aria-labelledby="editor-heading">

        {/* ── Label ─────────────────────────────────────────────── */}
        <div>
          <label
            htmlFor="field-label"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Label{' '}
            <span className="text-red-500" aria-label="required">*</span>
          </label>
          <input
            id="field-label"
            type="text"
            value={safeField.label}
            onChange={(e) => update({ label: e.target.value })}
            placeholder="e.g. Full Name"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="mt-1 text-xs text-gray-400">
            This is the question text shown to your form respondents.
          </p>
        </div>

        {/* ── Placeholder (text + email + dropdown only) ──────────── */}
        {(safeField.type === 'text' || safeField.type === 'email' || safeField.type === 'dropdown') && (
          <div>
            <label
              htmlFor="field-placeholder"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Placeholder
            </label>
            <input
              id="field-placeholder"
              type="text"
              value={safeField.placeholder ?? ''}
              onChange={(e) => update({ placeholder: e.target.value })}
              placeholder="e.g. Enter your full name…"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="mt-1 text-xs text-gray-400">
              Grey hint text shown inside the input before the user types.
            </p>
          </div>
        )}

        {/* ── Help text ─────────────────────────────────────────── */}
        <div>
          <label
            htmlFor="field-help"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Help Text
          </label>
          <input
            id="field-help"
            type="text"
            value={safeField.helpText ?? ''}
            onChange={(e) => update({ helpText: e.target.value })}
            placeholder="e.g. Include your middle name if applicable"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="mt-1 text-xs text-gray-400">
            A small note shown beneath the field.
          </p>
        </div>

        {/* ── Required toggle ───────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <input
            id="field-required"
            type="checkbox"
            checked={safeField.required}
            onChange={(e) => update({ required: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <label htmlFor="field-required" className="text-sm font-medium text-gray-700">
            Required field
          </label>
        </div>

        {/* ── Options (dropdown + checkbox only) ────────────────── */}
        {showOptions && (
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Options</p>

            {(safeField.options ?? []).length === 0 && (
              <p className="mb-2 text-xs italic text-gray-400">
                No options yet — click "+ Add option" below.
              </p>
            )}

            <ul className="space-y-2" role="list" aria-label="Field options">
              {(safeField.options ?? []).map((option, index) => (
                <li key={option.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={option.label}
                    onChange={(e) => updateOption(option.id, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    aria-label={`Option ${index + 1} label`}
                  />
                  <button
                    onClick={() => removeOption(option.id)}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                    aria-label={`Remove option ${option.label || index + 1}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>

            <button
              onClick={addOption}
              className="mt-2 text-sm text-brand-600 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              + Add option
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
