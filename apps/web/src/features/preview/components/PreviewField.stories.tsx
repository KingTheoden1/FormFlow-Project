// PreviewField.stories.tsx
//
// What is a story?
// A story is an isolated snapshot of a component in one specific state.
// Storybook renders each story in its own browser frame so you can see
// exactly what the component looks like — without running the whole app.
//
// This file documents every field type PreviewField can render.
// The a11y addon (axe-core) will automatically run WCAG 2.1 AA checks
// on every story shown here.

import type { Meta, StoryObj } from '@storybook/react'
import PreviewField from './PreviewField'

// ── Meta ────────────────────────────────────────────────────────────────────
// `meta` configures the story group: where it appears in the sidebar
// and default settings shared by all stories in this file.
const meta = {
  title: 'Builder/PreviewField',
  component: PreviewField,
  tags: ['autodocs'],  // generates a Docs page automatically
  parameters: {
    layout: 'padded',  // add whitespace around the component
  },
} satisfies Meta<typeof PreviewField>

export default meta
type Story = StoryObj<typeof meta>

// ── Stories ─────────────────────────────────────────────────────────────────
// Each `export const` below is one story — one state of the component.

export const ShortText: Story = {
  args: {
    field: {
      id: 'field-1',
      type: 'text',
      label: 'Full name',
      placeholder: 'e.g. Jane Smith',
      required: true,
      helpText: 'Enter your first and last name.',
    },
  },
}

export const Email: Story = {
  args: {
    field: {
      id: 'field-2',
      type: 'email',
      label: 'Work email',
      placeholder: 'you@company.com',
      required: true,
    },
  },
}

export const Dropdown: Story = {
  args: {
    field: {
      id: 'field-3',
      type: 'dropdown',
      label: 'Country',
      placeholder: 'Select your country…',
      required: false,
      options: [
        { id: 'o1', label: 'United States', value: 'us' },
        { id: 'o2', label: 'United Kingdom', value: 'uk' },
        { id: 'o3', label: 'Canada',         value: 'ca' },
      ],
    },
  },
}

export const DropdownEmpty: Story = {
  name: 'Dropdown (no options yet)',
  args: {
    field: {
      id: 'field-4',
      type: 'dropdown',
      label: 'Category',
      required: false,
      options: [],
    },
  },
}

export const Checkbox: Story = {
  args: {
    field: {
      id: 'field-5',
      type: 'checkbox',
      label: 'Which features do you use?',
      required: false,
      options: [
        { id: 'o1', label: 'Form builder',   value: 'builder' },
        { id: 'o2', label: 'Embed widget',   value: 'embed' },
        { id: 'o3', label: 'Stripe payments', value: 'payments' },
        { id: 'o4', label: 'Live dashboard', value: 'dashboard' },
      ],
    },
  },
}

export const CheckboxEmpty: Story = {
  name: 'Checkbox (no options yet)',
  args: {
    field: {
      id: 'field-6',
      type: 'checkbox',
      label: 'Select all that apply',
      required: false,
      options: [],
    },
  },
}

export const FileUpload: Story = {
  args: {
    field: {
      id: 'field-7',
      type: 'file',
      label: 'Upload your CV',
      required: true,
      helpText: 'PDF or Word document, max 5 MB.',
    },
  },
}

export const OptionalWithHelpText: Story = {
  name: 'Optional field with help text',
  args: {
    field: {
      id: 'field-8',
      type: 'text',
      label: 'Company name',
      placeholder: 'Where do you work?',
      required: false,
      helpText: 'Leave blank if you are self-employed.',
    },
  },
}

export const NoLabel: Story = {
  name: 'Field with no label (edge case)',
  args: {
    field: {
      id: 'field-9',
      type: 'text',
      label: '',
      required: false,
    },
  },
}
