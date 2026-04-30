// EmbedApp — fetches the form definition and hands it to EmbedForm.
//
// This component handles three states:
//   1. Loading — waiting for the API to respond
//   2. Error   — the API returned an error or the network failed
//   3. Ready   — form definition is loaded, render EmbedForm
//
// Why fetch here and not in EmbedForm?
// Separation of concerns: EmbedApp owns data fetching, EmbedForm owns
// interaction. This makes each piece easier to test and reason about.

import { useEffect, useState } from 'react'
import type { FormDefinition } from './types'
import EmbedForm from './EmbedForm'

interface Props {
  formId: string
  apiUrl: string
  // Stripe publishable key — read from data-stripe-key on the <script> tag.
  // Optional: forms without a payment step work fine without it.
  stripeKey?: string
}

export default function EmbedApp({ formId, apiUrl, stripeKey }: Props) {
  const [form,    setForm]    = useState<FormDefinition | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  // useEffect with an empty dependency array [] runs once — when this
  // component first mounts on the page. It's where we kick off the API call.
  useEffect(() => {
    // The /public endpoint requires no authentication — it returns only
    // published form definitions that are safe to expose to the public.
    fetch(`${apiUrl}/api/forms/${formId}/public`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            res.status === 404
              ? 'Form not found. Check the form ID.'
              : `API error (${res.status})`
          )
        }
        return res.json() as Promise<FormDefinition>
      })
      .then((data) => setForm(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [formId, apiUrl]) // Re-fetch if formId or apiUrl ever changes

  if (loading) {
    return <p className="ff-loading" aria-live="polite">Loading form…</p>
  }

  if (error || !form) {
    return (
      <p className="ff-error-state" role="alert">
        Could not load form: {error ?? 'Unknown error'}
      </p>
    )
  }

  return <EmbedForm form={form} apiUrl={apiUrl} stripeKey={stripeKey} />
}
