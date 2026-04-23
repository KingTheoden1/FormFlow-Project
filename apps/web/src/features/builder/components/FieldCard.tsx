// FieldCard — a single draggable field row inside the canvas.
//
// This uses @dnd-kit/sortable's `useSortable` hook.
// That hook gives us:
//   - `setNodeRef`  → attach to the DOM element so dnd-kit can track its position
//   - `listeners`   → mouse/touch event handlers that start a drag
//   - `attributes`  → ARIA attributes for keyboard accessibility
//   - `transform`   → CSS transform applied while dragging (moves the card visually)
//   - `transition`  → smooth animation when cards snap into their new positions
//   - `isDragging`  → true while this specific card is being dragged

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { selectField, removeField } from '@/features/builder/builderSlice'
import type { Field, Step } from '@/types/form'

// Human-readable labels for the field type badge
const FIELD_TYPE_LABELS: Record<string, string> = {
  text: 'Short Text',
  email: 'Email',
  dropdown: 'Dropdown',
  checkbox: 'Checkboxes',
  file: 'File Upload',
}

interface Props {
  field: Field
  step: Step
}

export default function FieldCard({ field, step }: Props) {
  const dispatch = useAppDispatch()
  const selectedFieldId = useAppSelector((s) => s.builder.selectedFieldId)
  const isSelected = selectedFieldId === field.id

  // Wire up drag-and-drop. The field's `id` is what dnd-kit uses to
  // identify this item when computing new sort order.
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  // Convert dnd-kit's transform object into a CSS string, e.g. "translate3d(0, -40px, 0)"
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 rounded-lg border bg-white p-3 shadow-sm transition ${
        isSelected
          ? 'border-brand-500 ring-2 ring-brand-200'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* ── Drag handle ─────────────────────────────────────────────
          `listeners` adds the mouse/touch events that start dragging.
          `attributes` adds aria-roledescription="sortable" and other a11y attrs.
          The user grabs this dot-grid icon to reorder the field. */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none select-none text-gray-300 hover:text-gray-500 active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        aria-label={`Drag to reorder "${field.label || 'untitled field'}"`}
        tabIndex={0}
      >
        {/* Unicode braille pattern — commonly used as a drag handle icon */}
        ⠿
      </button>

      {/* ── Field info ───────────────────────────────────────────────
          Clicking this area selects the field, opening it in the FieldEditor. */}
      <button
        className="flex flex-1 flex-col items-start gap-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        onClick={() => dispatch(selectField(isSelected ? null : field.id))}
        aria-pressed={isSelected}
        aria-label={`${isSelected ? 'Deselect' : 'Edit'} "${field.label || 'untitled'}" field`}
      >
        {/* Field type badge */}
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          {FIELD_TYPE_LABELS[field.type]}
        </span>

        {/* Field label — or italic placeholder if not yet set */}
        <span className="text-sm text-gray-800">
          {field.label ? (
            field.label
          ) : (
            <span className="italic text-gray-400">Untitled field</span>
          )}
        </span>

        {/* Required badge */}
        {field.required && (
          <span className="text-xs text-red-500">Required</span>
        )}
      </button>

      {/* ── Delete button ────────────────────────────────────────────
          opacity-0 hides it until the card is hovered (group-hover:opacity-100) */}
      <button
        onClick={() =>
          dispatch(removeField({ stepId: step.id, fieldId: field.id }))
        }
        className="rounded p-1 text-gray-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        aria-label={`Delete "${field.label || 'untitled'}" field`}
      >
        🗑
      </button>
    </div>
  )
}
