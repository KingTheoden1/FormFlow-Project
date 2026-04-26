// EmbedField — renders a single form field for the embed.
//
// This is the public-facing version of PreviewField from the builder.
// Key differences:
//   - Fields are interactive (not read-only)
//   - Validation errors are displayed
//   - Uses inline CSS classes (.ff-*) instead of Tailwind
//   - onChange bubbles the new value up to EmbedForm

import type { Field } from './types'

interface Props {
  field: Field
  value: string | string[]         // string[] only for checkbox fields
  error?: string                   // Validation error message, if any
  onChange: (value: string | string[]) => void
}

export default function EmbedField({ field, value, error, onChange }: Props) {
  // Unique IDs link labels to inputs — required for screen reader accessibility
  const inputId = `ff-${field.id}`
  const helpId  = field.helpText ? `${inputId}-help`  : undefined
  const errorId = error           ? `${inputId}-error` : undefined

  // aria-describedby can point to multiple IDs — join them with a space
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined
  const hasError    = Boolean(error)

  return (
    <div className="ff-field">

      {/* Label — not rendered for checkbox because <fieldset>/<legend> handles it */}
      {field.type !== 'checkbox' && (
        <label htmlFor={inputId} className="ff-label">
          {field.label || 'Untitled field'}
          {field.required && (
            <span className="ff-required" aria-label="required">*</span>
          )}
        </label>
      )}

      {/* Help text — shown above the input, linked via aria-describedby */}
      {field.helpText && (
        <p id={helpId} className="ff-help">
          {field.helpText}
        </p>
      )}

      {/* ── Short text ──────────────────────────────────────────── */}
      {field.type === 'text' && (
        <input
          id={inputId}
          type="text"
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          aria-describedby={describedBy}
          aria-invalid={hasError || undefined}
          className={hasError ? 'ff-input ff-input--error' : 'ff-input'}
        />
      )}

      {/* ── Email ───────────────────────────────────────────────── */}
      {field.type === 'email' && (
        <input
          id={inputId}
          type="email"
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || 'name@example.com'}
          required={field.required}
          aria-describedby={describedBy}
          aria-invalid={hasError || undefined}
          className={hasError ? 'ff-input ff-input--error' : 'ff-input'}
        />
      )}

      {/* ── Dropdown ────────────────────────────────────────────── */}
      {field.type === 'dropdown' && (
        <select
          id={inputId}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          aria-describedby={describedBy}
          aria-invalid={hasError || undefined}
          className="ff-select"
        >
          <option value="">{field.placeholder || 'Select an option…'}</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt.id} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {/* ── Checkboxes ──────────────────────────────────────────────
          A group of checkboxes must use <fieldset> + <legend>.
          This is the correct HTML structure for grouped inputs — screen
          readers will read the legend before each checkbox. */}
      {field.type === 'checkbox' && (
        <fieldset
          style={{ border: 'none', padding: 0, margin: 0 }}
          aria-describedby={describedBy}
        >
          <legend className="ff-label">
            {field.label || 'Untitled field'}
            {field.required && (
              <span className="ff-required" aria-label="required">*</span>
            )}
          </legend>

          <div className="ff-checkbox-group">
            {(field.options ?? []).map((opt) => {
              const isChecked = (value as string[]).includes(opt.value)
              return (
                <div key={opt.id} className="ff-checkbox-item">
                  <input
                    type="checkbox"
                    id={`${inputId}-${opt.id}`}
                    checked={isChecked}
                    onChange={() => {
                      const current = value as string[]
                      // Toggle: if already checked → remove it; if not → add it
                      onChange(
                        isChecked
                          ? current.filter((v) => v !== opt.value)
                          : [...current, opt.value]
                      )
                    }}
                    className="ff-checkbox"
                  />
                  <label
                    htmlFor={`${inputId}-${opt.id}`}
                    className="ff-checkbox-label"
                  >
                    {opt.label}
                  </label>
                </div>
              )
            })}
          </div>
        </fieldset>
      )}

      {/* ── File upload ─────────────────────────────────────────── */}
      {field.type === 'file' && (
        <input
          id={inputId}
          type="file"
          onChange={(e) => onChange(e.target.files?.[0]?.name ?? '')}
          required={field.required}
          aria-describedby={describedBy}
          className="ff-file"
        />
      )}

      {/* ── Validation error message ─────────────────────────────
          role="alert" makes screen readers announce this immediately
          when it appears — important for live validation feedback. */}
      {error && (
        <p
          id={errorId}
          className="ff-error-text"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  )
}
