// types.ts — shared domain types for the server.
// Mirrors the types in apps/web/src/types/form.ts.

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
}

export interface Step {
  id: string
  title: string
  description?: string
  fields: Field[]
}
