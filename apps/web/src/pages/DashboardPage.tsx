// DashboardPage — lists all forms owned by the logged-in user.
//
// What it shows:
//   - A card for each form with its title, published status, and submission count
//   - Buttons to open the builder, view responses, and delete
//   - A "New form" button at the top
//
// Data flow:
//   1. On mount, dispatch fetchFormsAsync() to load the list from the API.
//   2. The list lives in Redux (formsSlice) so navigating away and back
//      doesn't trigger an unnecessary reload.
//   3. Deleting dispatches deleteFormAsync() which removes the item from Redux
//      optimistically (the slice filters it out on fulfilled).

import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchFormsAsync, deleteFormAsync } from '@/features/forms/formsSlice'

export default function DashboardPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const forms  = useAppSelector((s) => s.forms.items)
  const status = useAppSelector((s) => s.forms.status)
  const error  = useAppSelector((s) => s.forms.error)
  const token  = useAppSelector((s) => s.auth.token)

  // Load forms on first render
  useEffect(() => {
    void dispatch(fetchFormsAsync())
  }, [dispatch])

  async function handleDelete(formId: string, title: string) {
    // window.confirm is a simple built-in dialog — good enough for now
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return
    await dispatch(deleteFormAsync(formId))
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Forms</h1>
          {token && (
            <p className="mt-0.5 text-sm text-gray-500">
              {forms.length} form{forms.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* New form — goes to the builder with no formId (creates a fresh form) */}
        <Link
          to="/builder"
          className="rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          + New form
        </Link>
      </div>

      {/* ── Loading state ───────────────────────────────────────── */}
      {status === 'loading' && (
        <p className="text-gray-500" aria-live="polite">Loading…</p>
      )}

      {/* ── Error state ─────────────────────────────────────────── */}
      {status === 'failed' && (
        <p className="text-red-600" role="alert">
          {error ?? 'Failed to load forms.'}
        </p>
      )}

      {/* ── Empty state ─────────────────────────────────────────── */}
      {status === 'idle' && forms.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">No forms yet.</p>
          <Link
            to="/builder"
            className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            Create your first form →
          </Link>
        </div>
      )}

      {/* ── Forms list ──────────────────────────────────────────── */}
      {forms.length > 0 && (
        <ul className="space-y-3" aria-label="Your forms">
          {forms.map((form) => (
            <li
              key={form.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-5 py-4 shadow-sm transition hover:shadow-md"
            >
              {/* Left — title + meta */}
              <div>
                <h2 className="font-semibold text-gray-900">{form.title}</h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  {form.submissionCount} response{form.submissionCount !== 1 ? 's' : ''}
                  {' · '}
                  {/* Published badge */}
                  <span
                    className={`font-medium ${
                      form.isPublished ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    {form.isPublished ? 'Published' : 'Draft'}
                  </span>
                </p>
              </div>

              {/* Right — action buttons */}
              <div className="flex items-center gap-2">
                {/* Edit in builder */}
                <button
                  onClick={() => void navigate(`/builder/${form.id}`)}
                  className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  Edit
                </button>

                {/* View responses */}
                <button
                  onClick={() => void navigate(`/forms/${form.id}/responses`)}
                  className="rounded border border-brand-300 px-3 py-1.5 text-sm font-medium text-brand-600 transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  Responses
                  {form.submissionCount > 0 && (
                    <span className="ml-1.5 rounded-full bg-brand-100 px-1.5 py-0.5 text-xs font-semibold text-brand-700">
                      {form.submissionCount}
                    </span>
                  )}
                </button>

                {/* Delete */}
                <button
                  onClick={() => void handleDelete(form.id, form.title)}
                  className="rounded border border-red-200 px-3 py-1.5 text-sm font-medium text-red-500 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  aria-label={`Delete ${form.title}`}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

    </div>
  )
}
