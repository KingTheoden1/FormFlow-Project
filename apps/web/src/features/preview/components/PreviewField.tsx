// PreviewField — renders a single form field as it will look to respondents.
//
// This is a READ-ONLY display. Inputs have `readOnly` or `disabled` on them
// because in the builder we're just previewing — no actual data is collected here.
//
// Accessibility notes:
//   - Every input is linked to a <label> via matching `id` / `htmlFor`
//   - Help text is linked via `aria-describedby` so screen readers read it after the label
//   - Checkbox groups use <fieldset> + <legend> (the correct semantic structure for groups)
//   - Required fields show an asterisk with an aria-label so screen readers say "required"

import type { Field } from '@/types/form'

interface Props {
  field: Field
}

export default function PreviewField({ field }: Props) {
  // Unique IDs so each label points to its own input
  const inputId = `preview-${field.id}`
  const helpId = field.helpText ? `${inputId}-help` : undefined

  // Shared Tailwind classes for text-like inputs
  const inputClass =
    'w-full rounded border border-gray-300 px-3 py-2 text-sm bg-gray-50 cursor-not-allowed focus:outline-none'

  return (
    <div className="space-y-1.5">
      {/* ── Label ─────────────────────────────────────────────────
          htmlFor must match the input's id — this is how browsers (and screen
          readers) know which label belongs to which input. */}
      {field.type !== 'checkbox' && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {field.label || (
            <span className="italic text-gray-400">Untitled field</span>
          )}
          {field.required && (
            <span
              className="ml-1 text-red-500"
              aria-label="required"
              aria-hidden="false"
            >
              *
            </span>
          )}
        </label>
      )}

      {/* ── Help text ─────────────────────────────────────────────
          id={helpId} is referenced by aria-describedby on the input below */}
      {field.helpText && (
        <p id={helpId} className="text-xs text-gray-500">
          {field.helpText}
        </p>
      )}

      {/* ── Short text ──────────────────────────────────────────── */}
      {field.type === 'text' && (
        <input
          id={inputId}
          type="text"
          placeholder={field.placeholder || 'Short answer'}
          readOnly
          aria-describedby={helpId}
          className={inputClass}
        />
      )}

      {/* ── Email ───────────────────────────────────────────────── */}
      {field.type === 'email' && (
        <input
          id={inputId}
          type="email"
          placeholder={field.placeholder || 'name@example.com'}
          readOnly
          aria-describedby={helpId}
          className={inputClass}
        />
      )}

      {/* ── Dropdown ────────────────────────────────────────────── */}
      {field.type === 'dropdown' && (
        <select
          id={inputId}
          disabled
          aria-describedby={helpId}
          defaultValue=""
          className={inputClass}
        >
          <option value="" disabled>
            {field.placeholder || 'Select an option…'}
          </option>
          {(field.options ?? []).map((opt) => (
            <option key={opt.id} value={opt.value}>
              {opt.label || opt.value}
            </option>
          ))}
        </select>
      )}

      {/* ── Checkboxes ──────────────────────────────────────────────
          A group of checkboxes must be wrapped in <fieldset> with a <legend>.
          The legend acts as the group label for screen readers.
          The individual <label>s are still needed for each checkbox. */}
      {field.type === 'checkbox' && (
        <fieldset aria-describedby={helpId} className="space-y-1">
          <legend className="mb-1 text-sm font-medium text-gray-700">
            {field.label || (
              <span className="italic text-gray-400">Untitled field</span>
            )}
            {field.required && (
              <span className="ml-1 text-red-500" aria-label="required">
                *
              </span>
            )}
          </legend>

          {(field.options ?? []).length === 0 ? (
            <p className="text-xs italic text-gray-400">No options added yet</p>
          ) : (
            <ul className="space-y-1.5" role="list">
              {(field.options ?? []).map((opt) => (
                <li key={opt.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`${inputId}-${opt.id}`}
                    disabled
                    className="h-4 w-4 rounded border-gray-300 text-brand-600"
                  />
                  <label
                    htmlFor={`${inputId}-${opt.id}`}
                    className="text-sm text-gray-700"
                  >
                    {opt.label || opt.value}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </fieldset>
      )}

      {/* ── File upload ─────────────────────────────────────────── */}
      {field.type === 'file' && (
        <input
          id={inputId}
          type="file"
          disabled
          aria-describedby={helpId}
          className="block w-full cursor-not-allowed text-sm text-gray-400 file:mr-4 file:rounded file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700"
        />
      )}
    </div>
  )
}
