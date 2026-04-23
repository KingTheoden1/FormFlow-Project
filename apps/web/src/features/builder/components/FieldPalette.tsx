// FieldPalette — the left sidebar showing all available field types.
// Clicking a button adds that field type to the end of the active step.

import { useAppDispatch } from '@/app/hooks'
import { addField } from '@/features/builder/builderSlice'
import type { FieldType } from '@/types/form'

// Each entry describes one field type button.
const FIELD_TYPES: {
  type: FieldType
  label: string
  icon: string
  description: string
}[] = [
  {
    type: 'text',
    label: 'Short Text',
    icon: '✏️',
    description: 'Single-line text input, e.g. name or address',
  },
  {
    type: 'email',
    label: 'Email',
    icon: '✉️',
    description: 'Email address — browsers validate the format automatically',
  },
  {
    type: 'dropdown',
    label: 'Dropdown',
    icon: '▾',
    description: 'Pick one option from a list',
  },
  {
    type: 'checkbox',
    label: 'Checkboxes',
    icon: '☑',
    description: 'Pick one or more options from a list',
  },
  {
    type: 'file',
    label: 'File Upload',
    icon: '📎',
    description: 'Let respondents attach a file',
  },
]

export default function FieldPalette() {
  // useAppDispatch gives us the Redux "dispatch" function.
  // Dispatching an action is how we tell Redux to update state.
  const dispatch = useAppDispatch()

  return (
    <div className="p-4">
      <h2
        className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500"
        id="palette-heading"
      >
        Add a Field
      </h2>

      {/* role="list" + role="listitem" ensure screen readers announce this as a list */}
      <ul className="space-y-2" role="list" aria-labelledby="palette-heading">
        {FIELD_TYPES.map(({ type, label, icon, description }) => (
          <li key={type} role="listitem">
            <button
              onClick={() => dispatch(addField(type))}
              className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 text-left transition hover:border-brand-300 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              aria-label={`Add ${label} field`}
              title={description}
            >
              {/* aria-hidden hides the emoji from screen readers — the aria-label above covers it */}
              <span className="text-lg" aria-hidden="true">
                {icon}
              </span>
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
