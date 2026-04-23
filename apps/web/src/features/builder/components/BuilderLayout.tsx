// BuilderLayout — the full-page 3-column shell for the form builder.
//
// Layout:
//   ┌────────────────────────────────────────────────────────────┐
//   │  [Form title input]           [Preview toggle] [Save btn] │  ← top bar
//   ├──────────────┬─────────────────────────┬───────────────────┤
//   │              │  [Step 1][Step 2][+]     │                   │
//   │ FieldPalette │─────────────────────────│  FieldEditor      │
//   │  (left)      │  FormCanvas             │  or LivePreview   │
//   │              │  (center, scrollable)   │  (right)          │
//   └──────────────┴─────────────────────────┴───────────────────┘
//
// `showPreview` is local state — it controls whether the right panel shows
// the FieldEditor (edit mode) or the LivePreview (preview mode).

import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { setTitle, saveFormAsync } from '@/features/builder/builderSlice'
import FieldPalette from './FieldPalette'
import StepTabs from './StepTabs'
import FormCanvas from './FormCanvas'
import FieldEditor from './FieldEditor'
import LivePreview from '@/features/preview/components/LivePreview'

export default function BuilderLayout() {
  const dispatch = useAppDispatch()

  // Local state — only this component needs to know whether preview is shown
  const [showPreview, setShowPreview] = useState(false)

  // Read form metadata from Redux
  const title = useAppSelector((s) => s.builder.title)
  const isDirty = useAppSelector((s) => s.builder.isDirty)
  const saveStatus = useAppSelector((s) => s.builder.saveStatus)

  return (
    // h-screen = fill the full browser window height
    // flex flex-col = stack children top-to-bottom
    <div className="flex h-screen flex-col bg-gray-50">

      {/* ── Top bar ──────────────────────────────────────────────── */}
      <header className="flex shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-6 py-3">
        {/* Form title — clicking it lets you rename the form inline */}
        <input
          type="text"
          value={title}
          onChange={(e) => dispatch(setTitle(e.target.value))}
          className="flex-1 rounded border border-transparent px-2 py-1 text-lg font-semibold text-gray-900 transition hover:border-gray-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="Form title"
          placeholder="Untitled Form"
        />

        {/* Preview toggle — switches the right panel between editor and preview */}
        <button
          onClick={() => setShowPreview((prev) => !prev)}
          aria-pressed={showPreview}
          className={`rounded px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
            showPreview
              ? 'bg-brand-100 text-brand-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {showPreview ? 'Hide Preview' : '👁 Preview'}
        </button>

        {/* Save button — disabled when there are no unsaved changes */}
        <button
          onClick={() => dispatch(saveFormAsync())}
          disabled={!isDirty || saveStatus === 'saving'}
          className="rounded bg-brand-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          aria-label={saveStatus === 'saving' ? 'Saving form…' : 'Save form'}
        >
          {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' && !isDirty ? '✓ Saved' : 'Save'}
        </button>
      </header>

      {/* ── Body: 3 columns ──────────────────────────────────────── */}
      {/* overflow-hidden on this container + overflow-y-auto on children
          lets each column scroll independently without the whole page scrolling */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left sidebar — field type palette */}
        <aside
          className="w-52 shrink-0 overflow-y-auto border-r border-gray-200 bg-white"
          aria-label="Field types"
        >
          <FieldPalette />
        </aside>

        {/* Center — step tabs + field canvas */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <StepTabs />
          {/* This div scrolls when there are many fields */}
          <div className="flex-1 overflow-y-auto p-6">
            <FormCanvas />
          </div>
        </main>

        {/* Right sidebar — field editor (or live preview when toggled) */}
        <aside
          className="w-80 shrink-0 overflow-y-auto border-l border-gray-200 bg-white"
          aria-label={showPreview ? 'Form preview' : 'Field settings'}
        >
          {showPreview ? <LivePreview /> : <FieldEditor />}
        </aside>

      </div>
    </div>
  )
}
