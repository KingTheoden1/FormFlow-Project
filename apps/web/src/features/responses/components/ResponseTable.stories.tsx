// ResponseTable.stories.tsx
//
// Documents the submission table in its three main states:
//   1. Empty — no responses received yet
//   2. With responses — typical data from a text/email form
//   3. With payment — includes the payment status column

import type { Meta, StoryObj } from '@storybook/react'
import ResponseTable from './ResponseTable'

const meta = {
  title: 'Responses/ResponseTable',
  component: ResponseTable,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ResponseTable>

export default meta
type Story = StoryObj<typeof meta>

// ── Shared mock data ─────────────────────────────────────────────────────────

const mockSubmissions = [
  {
    id: 'sub-1',
    formId: 'form-abc',
    data: {
      'field-name':    'Alice Johnson',
      'field-email':   'alice@example.com',
      'field-country': 'United States',
    },
    submittedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 min ago
  },
  {
    id: 'sub-2',
    formId: 'form-abc',
    data: {
      'field-name':    'Bob Smith',
      'field-email':   'bob@example.com',
      'field-country': 'United Kingdom',
    },
    submittedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
  },
  {
    id: 'sub-3',
    formId: 'form-abc',
    data: {
      'field-name':    'Carol White',
      'field-email':   'carol@example.com',
      'field-country': 'Canada',
    },
    submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  },
]

const mockWithPayment = [
  {
    id: 'sub-4',
    formId: 'form-pay',
    data: { 'field-name': 'Dave Lee', 'field-email': 'dave@example.com' },
    stripePaymentIntentId: 'pi_abc123',
    paymentStatus: 'succeeded' as const,
    submittedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'sub-5',
    formId: 'form-pay',
    data: { 'field-name': 'Eve Brown', 'field-email': 'eve@example.com' },
    stripePaymentIntentId: 'pi_def456',
    paymentStatus: 'pending' as const,
    submittedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'sub-6',
    formId: 'form-pay',
    data: { 'field-name': 'Frank Davis', 'field-email': 'frank@example.com' },
    stripePaymentIntentId: 'pi_ghi789',
    paymentStatus: 'failed' as const,
    submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
]

// ── Stories ──────────────────────────────────────────────────────────────────

export const Empty: Story = {
  args: {
    submissions: [],
    hasPaymentStep: false,
  },
}

export const WithResponses: Story = {
  args: {
    submissions: mockSubmissions,
    hasPaymentStep: false,
  },
}

export const WithPayment: Story = {
  name: 'With payment column',
  args: {
    submissions: mockWithPayment,
    hasPaymentStep: true,
  },
}

export const SingleResponse: Story = {
  name: 'Single response',
  args: {
    submissions: [mockSubmissions[0]!],
    hasPaymentStep: false,
  },
}
