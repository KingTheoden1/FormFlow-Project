// ============================================================
// FormFlow — Submission / response types
// ============================================================

export interface Submission {
  id: string
  formId: string
  // Map of fieldId → submitted value
  // Value type depends on field type:
  //   text/email  → string
  //   dropdown    → string (option value)
  //   checkbox    → string[] (selected option values)
  //   file        → string (Azure Blob Storage URL)
  data: Record<string, unknown>
  // Payment — undefined if form has no payment step
  stripePaymentIntentId?: string
  paymentStatus?: 'pending' | 'succeeded' | 'failed'
  // Meta
  submittedAt: string   // ISO 8601
  ipHash?: string       // SHA-256 of IP — stored for abuse detection, not raw IP
}

export interface SubmissionListItem {
  id: string
  formId: string
  submittedAt: string
  paymentStatus?: 'pending' | 'succeeded' | 'failed'
}
