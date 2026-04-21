// ============================================================
// FormFlow — Core domain types
// Shared between the builder, the renderer, and the embed.
// ============================================================

export type FieldType = 'text' | 'email' | 'dropdown' | 'checkbox' | 'file'

export interface ValidationRule {
  type: 'minLength' | 'maxLength' | 'pattern' | 'min' | 'max'
  value: string | number
  message: string
}

export interface FieldOption {
  id: string
  label: string
  value: string
}

export interface Field {
  id: string              // nanoid — stable across saves
  type: FieldType
  label: string
  placeholder?: string
  helpText?: string       // Shown below the field; linked via aria-describedby
  required: boolean
  options?: FieldOption[] // Only used by 'dropdown' and 'checkbox' types
  validation?: ValidationRule[]
  // a11y
  ariaLabel?: string      // Override the label for screen readers if needed
}

export interface Step {
  id: string
  title: string
  description?: string
  fields: Field[]         // Ordered array — order here === render order
}

export interface FormDefinition {
  id: string
  ownerId: string
  title: string
  description?: string
  steps: Step[]
  // Payment
  hasPaymentStep: boolean
  paymentAmount?: number       // In cents (e.g. 999 = $9.99)
  paymentCurrency?: string     // ISO 4217, e.g. 'usd'
  paymentDescription?: string  // Shown on Stripe checkout
  // Meta
  isPublished: boolean
  embedKey: string             // Public key used in <script> tag
  createdAt: string            // ISO 8601
  updatedAt: string
}

export interface FormSummary {
  id: string
  title: string
  isPublished: boolean
  submissionCount: number
  createdAt: string
  updatedAt: string
}
