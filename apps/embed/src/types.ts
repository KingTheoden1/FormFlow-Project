// types.ts — local copy of the core domain types for the embed bundle.
//
// The embed is a completely separate build from apps/web, so it can't import
// from the web app. We duplicate the types we need here rather than sharing
// them via a package — keeps the embed bundle self-contained and simple.

export type FieldType = 'text' | 'email' | 'dropdown' | 'checkbox' | 'file'

export interface FieldOption {
  id: string
  label: string
  value: string
}

export interface Field {
  id: string
  type: FieldType
  label: string
  placeholder?: string
  helpText?: string
  required: boolean
  options?: FieldOption[]
  ariaLabel?: string
}

export interface Step {
  id: string
  title: string
  description?: string
  fields: Field[]
}

export interface FormDefinition {
  id: string
  title: string
  description?: string
  steps: Step[]
  hasPaymentStep: boolean
  paymentAmount?: number     // In cents, e.g. 999 = $9.99
  paymentCurrency?: string   // e.g. 'usd'
  paymentDescription?: string
}
