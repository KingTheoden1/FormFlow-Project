// ResponseTable — displays submitted responses in a sortable table.
//
// Each row = one submission.  Columns:
//   #           — row number (newest first, so #1 is most recent)
//   Submitted   — relative time ("2 minutes ago") or absolute date
//   Fields      — all field values from the submission flattened into pills
//   Payment     — status badge, only shown when the form has a payment step
//
// Why flatten field data into pills instead of columns?
// The form owner can add/remove/rename fields freely.  Dynamic columns would
// require knowing the current form definition here.  Pills work for any shape
// of data and are easy to read at a glance.

import type { Submission } from '@/types/response'

interface Props {
  submissions: Submission[]
  hasPaymentStep: boolean
}

// Format an ISO timestamp as a human-readable relative string.
// Returns strings like "just now", "3 minutes ago", "2 days ago".
function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)

  if (diff < 10)  return 'just now'
  if (diff < 60)  return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(iso).toLocaleDateString()
}

// Badge colours for Stripe payment statuses
function PaymentBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-gray-400 text-xs">—</span>

  const styles: Record<string, string> = {
    paid:    'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    failed:  'bg-red-100   text-red-700',
  }
  const label: Record<string, string> = {
    paid: '✓ Paid', pending: '⏳ Pending', failed: '✗ Failed',
  }

  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {label[status] ?? status}
    </span>
  )
}

export default function ResponseTable({ submissions, hasPaymentStep }: Props) {
  if (submissions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
        <p className="text-gray-500">No responses yet.</p>
        <p className="mt-1 text-sm text-gray-400">
          Responses will appear here in real time as they come in.
        </p>
      </div>
    )
  }

  return (
    // overflow-x-auto lets the table scroll sideways on small screens
    // instead of overflowing outside the page
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="w-12 px-4 py-3 text-left font-semibold text-gray-600">#</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Submitted</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Fields</th>
            {hasPaymentStep && (
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Payment</th>
            )}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 bg-white">
          {submissions.map((sub, i) => (
            <tr
              key={sub.id}
              className="transition-colors hover:bg-gray-50"
            >
              {/* Row number — newest is #1 */}
              <td className="px-4 py-3 font-mono text-xs text-gray-400">
                {i + 1}
              </td>

              {/* Submitted time */}
              <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                <span title={new Date(sub.submittedAt).toLocaleString()}>
                  {timeAgo(sub.submittedAt)}
                </span>
              </td>

              {/* Field data — each key:value shown as a pill */}
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(sub.data).map(([key, val]) => {
                    const display = Array.isArray(val)
                      ? val.join(', ')
                      : String(val ?? '')
                    if (!display) return null
                    return (
                      <span
                        key={key}
                        className="inline-block max-w-xs truncate rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                        title={`${key}: ${display}`}
                      >
                        {display}
                      </span>
                    )
                  })}
                </div>
              </td>

              {/* Payment status — only when form has a payment step */}
              {hasPaymentStep && (
                <td className="px-4 py-3">
                  <PaymentBadge status={sub.paymentStatus} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
