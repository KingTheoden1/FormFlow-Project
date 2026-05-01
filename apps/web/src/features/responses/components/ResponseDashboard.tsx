// ResponseDashboard — real-time submission viewer for a single form.
//
// What it does on mount:
//   1. Fetches the form definition (to get the title + hasPaymentStep flag).
//   2. Fetches existing submissions from the API.
//   3. Connects to Socket.io via useSocket() and joins the form's room.
//      From that point, any new submission triggers an automatic refetch.
//
// The live connection status (connecting / connected / disconnected) is read
// from Redux and shown as a coloured dot in the header.
//
// Props:
//   formId — comes from the :formId URL parameter in ResponsesPage

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchSubmissionsAsync } from '@/features/responses/responsesSlice'
import { useSocket } from '@/hooks/useSocket'
import ResponseTable from './ResponseTable'
import type { FormDefinition } from '@/types/form'

interface Props {
  formId: string
}

// Coloured dot + label for the Socket.io connection status
function ConnectionBadge({ status }: { status: string }) {
  const dot: Record<string, string> = {
    connected:    'bg-green-400',
    connecting:   'bg-yellow-400',
    disconnected: 'bg-red-400',
  }
  const label: Record<string, string> = {
    connected:    'Live',
    connecting:   'Connecting…',
    disconnected: 'Offline',
  }
  return (
    <span className="flex items-center gap-1.5 text-sm text-gray-500">
      {/* The dot pulses when connecting to give visual feedback */}
      <span
        className={`h-2 w-2 rounded-full ${dot[status] ?? 'bg-gray-400'} ${
          status === 'connecting' ? 'animate-pulse' : ''
        }`}
        aria-hidden="true"
      />
      {label[status] ?? status}
    </span>
  )
}

export default function ResponseDashboard({ formId }: Props) {
  const dispatch    = useAppDispatch()
  const submissions = useAppSelector((s) => s.responses.byFormId[formId] ?? [])
  const connStatus  = useAppSelector((s) => s.responses.connectionStatus)

  // Local state — form definition for title + hasPaymentStep
  const [form,    setForm]    = useState<FormDefinition | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  // Access token for authenticated API calls
  const token = useAppSelector((s) => s.auth.token)
  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {}

  // ── Fetch form definition ──────────────────────────────────────
  useEffect(() => {
    fetch(`/api/forms/${formId}`, { headers: authHeaders })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load form (${res.status})`)
        return res.json() as Promise<FormDefinition>
      })
      .then((data) => setForm(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId])

  // ── Fetch existing submissions ─────────────────────────────────
  useEffect(() => {
    void dispatch(fetchSubmissionsAsync(formId))
  }, [formId, dispatch])

  // ── Connect to Socket.io ───────────────────────────────────────
  // useSocket handles connect, room join, refetch on new_submission, cleanup
  useSocket(formId)

  // ── Loading / error states ─────────────────────────────────────
  if (loading) {
    return (
      <div className="p-8 text-gray-500" aria-live="polite">
        Loading…
      </div>
    )
  }

  if (error || !form) {
    return (
      <div className="p-8 text-red-600" role="alert">
        {error ?? 'Form not found.'}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          {/* Back link to the forms list */}
          <Link
            to="/"
            className="mb-1 flex items-center gap-1 text-sm text-brand-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            ← All forms
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{form.title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {submissions.length} response{submissions.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Live connection indicator */}
          <ConnectionBadge status={connStatus} />

          {/* Link to the form builder for quick edits */}
          <Link
            to={`/builder/${formId}`}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            Edit form
          </Link>
        </div>
      </div>

      {/* ── Submissions table ────────────────────────────────────── */}
      <ResponseTable
        submissions={submissions}
        hasPaymentStep={form.hasPaymentStep}
      />

    </div>
  )
}
