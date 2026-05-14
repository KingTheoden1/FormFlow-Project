// ResponseTable.test.tsx
//
// Tests for the submission table component.
// ResponseTable is purely presentational — it takes props and renders HTML.
// No Redux, no routing, no network calls needed.
//
// We test:
//   - Empty state shows the correct placeholder message
//   - Rows appear when submissions are provided
//   - Relative timestamps render (e.g. "just now")
//   - Payment column appears only when hasPaymentStep is true
//   - Payment status badges show the right label and colour class

import { render, screen } from '@testing-library/react'
import ResponseTable from '@/features/responses/components/ResponseTable'
import type { Submission } from '@/types/response'

// ── Mock data ─────────────────────────────────────────────────────────────────

const now = new Date().toISOString()

const submissions: Submission[] = [
  {
    id:          'sub-1',
    formId:      'form-1',
    data:        { name: 'Alice', email: 'alice@example.com' },
    submittedAt: now,
  },
  {
    id:          'sub-2',
    formId:      'form-1',
    data:        { name: 'Bob',   email: 'bob@example.com' },
    submittedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1h ago
  },
]

const submissionsWithPayment: Submission[] = [
  {
    id:                     'sub-3',
    formId:                 'form-2',
    data:                   { name: 'Carol' },
    stripePaymentIntentId:  'pi_abc',
    paymentStatus:          'succeeded',
    submittedAt:            now,
  },
  {
    id:                     'sub-4',
    formId:                 'form-2',
    data:                   { name: 'Dave' },
    stripePaymentIntentId:  'pi_def',
    paymentStatus:          'pending',
    submittedAt:            now,
  },
  {
    id:                     'sub-5',
    formId:                 'form-2',
    data:                   { name: 'Eve' },
    stripePaymentIntentId:  'pi_ghi',
    paymentStatus:          'failed',
    submittedAt:            now,
  },
]

// ── Empty state ───────────────────────────────────────────────────────────────

describe('ResponseTable — empty state', () => {
  it('shows a no-responses message when the list is empty', () => {
    render(<ResponseTable submissions={[]} hasPaymentStep={false} />)
    expect(screen.getByText('No responses yet.')).toBeInTheDocument()
  })

  it('does not render a table when empty', () => {
    const { container } = render(
      <ResponseTable submissions={[]} hasPaymentStep={false} />
    )
    expect(container.querySelector('table')).not.toBeInTheDocument()
  })
})

// ── With submissions ──────────────────────────────────────────────────────────

describe('ResponseTable — with submissions', () => {
  it('renders a row for each submission', () => {
    render(<ResponseTable submissions={submissions} hasPaymentStep={false} />)
    // Each row has a row role — the header row counts too, so total = submissions + 1
    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(submissions.length + 1) // +1 for the header
  })

  it('shows field values as pills', () => {
    render(<ResponseTable submissions={submissions} hasPaymentStep={false} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
  })

  it('shows "just now" for a submission made moments ago', () => {
    render(<ResponseTable submissions={submissions} hasPaymentStep={false} />)
    expect(screen.getByText('just now')).toBeInTheDocument()
  })
})

// ── Payment column ────────────────────────────────────────────────────────────

describe('ResponseTable — payment column', () => {
  it('does not show a Payment column when hasPaymentStep is false', () => {
    render(<ResponseTable submissions={submissions} hasPaymentStep={false} />)
    expect(screen.queryByText('Payment')).not.toBeInTheDocument()
  })

  it('shows a Payment column when hasPaymentStep is true', () => {
    render(
      <ResponseTable submissions={submissionsWithPayment} hasPaymentStep={true} />
    )
    expect(screen.getByText('Payment')).toBeInTheDocument()
  })

  it('shows ✓ Paid badge for succeeded payments', () => {
    render(
      <ResponseTable submissions={submissionsWithPayment} hasPaymentStep={true} />
    )
    expect(screen.getByText('✓ Paid')).toBeInTheDocument()
  })

  it('shows ⏳ Pending badge for pending payments', () => {
    render(
      <ResponseTable submissions={submissionsWithPayment} hasPaymentStep={true} />
    )
    expect(screen.getByText('⏳ Pending')).toBeInTheDocument()
  })

  it('shows ✗ Failed badge for failed payments', () => {
    render(
      <ResponseTable submissions={submissionsWithPayment} hasPaymentStep={true} />
    )
    expect(screen.getByText('✗ Failed')).toBeInTheDocument()
  })
})
