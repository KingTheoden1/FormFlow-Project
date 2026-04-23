// FormCanvas — the center drop zone that lists all fields for the active step.
//
// Drag-and-drop is powered by @dnd-kit. Here's how it works:
//
//  DndContext     → the invisible controller that tracks dragging globally.
//                   It needs a collision-detection strategy (closestCenter) and
//                   event handlers (onDragEnd).
//
//  SortableContext → tells dnd-kit which items are sortable and in what order.
//                    We pass it the list of field IDs.
//
//  useSensors     → controls HOW a drag starts.
//                   PointerSensor = mouse + touch.
//                   The `distance: 8` constraint means the user must move the
//                   pointer at least 8px before dnd-kit considers it a drag —
//                   this prevents accidental drags when clicking.

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { reorderFields } from '@/features/builder/builderSlice'
import FieldCard from './FieldCard'

export default function FormCanvas() {
  const dispatch = useAppDispatch()
  const steps = useAppSelector((s) => s.builder.steps)
  const activeStepIndex = useAppSelector((s) => s.builder.activeStepIndex)
  const activeStep = steps[activeStepIndex]

  // Set up input sensors.
  // PointerSensor handles mouse and touch.
  // KeyboardSensor handles keyboard navigation (arrows to move cards).
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Must drag 8px before the drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Called when the user drops a field onto a new position.
  // `active` = the card being dragged; `over` = the card it was dropped on.
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id || !activeStep) return

    const oldIndex = activeStep.fields.findIndex((f) => f.id === active.id)
    const newIndex = activeStep.fields.findIndex((f) => f.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    // Tell Redux to swap the two fields in the state
    dispatch(
      reorderFields({
        stepId: activeStep.id,
        fromIndex: oldIndex,
        toIndex: newIndex,
      })
    )
  }

  // Guard: if something went wrong and activeStep is undefined, render nothing
  if (!activeStep) return null

  // Empty state — shown when there are no fields yet
  if (activeStep.fields.length === 0) {
    return (
      <div
        className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white text-center"
        aria-label="Empty step — no fields added yet"
      >
        <p className="text-lg text-gray-400">No fields yet</p>
        <p className="mt-1 text-sm text-gray-400">
          Click a field type on the left to add it here
        </p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      {/* SortableContext needs the array of item IDs in their current order */}
      <SortableContext
        items={activeStep.fields.map((f) => f.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul
          className="space-y-3"
          role="list"
          aria-label={`Fields in ${activeStep.title}`}
        >
          {activeStep.fields.map((field) => (
            <li key={field.id}>
              <FieldCard field={field} step={activeStep} />
            </li>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
