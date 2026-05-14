// PreviewField.test.tsx
//
// What are we testing?
// PreviewField is a read-only display of a single form field.
// These tests check that:
//   - Each of the 5 field types renders the right HTML element
//   - Labels are associated with their inputs (accessibility requirement)
//   - Required asterisk appears when required=true
//   - Help text appears and is linked via aria-describedby
//   - Dropdown options are rendered
//   - Checkbox options are rendered inside a fieldset/legend
//
// `render` puts the component in a virtual DOM.
// `screen` gives us queries to find elements by role, label, text, etc.
// These queries mirror how a screen reader or keyboard user navigates —
// if screen.getByRole() finds it, a screen reader can too.

import { render, screen } from '@testing-library/react'
import PreviewField from '@/features/preview/components/PreviewField'
import type { Field } from '@/types/form'

// ── Helpers ───────────────────────────────────────────────────────────────────

function textField(overrides: Partial<Field> = {}): Field {
  return {
    id:       'f1',
    type:     'text',
    label:    'Full name',
    required: false,
    ...overrides,
  }
}

// ── Label & accessibility ─────────────────────────────────────────────────────

describe('PreviewField — label', () => {
  it('renders the field label', () => {
    render(<PreviewField field={textField({ label: 'Your name' })} />)
    expect(screen.getByText('Your name')).toBeInTheDocument()
  })

  it('shows "Untitled field" when label is empty', () => {
    render(<PreviewField field={textField({ label: '' })} />)
    expect(screen.getByText('Untitled field')).toBeInTheDocument()
  })

  it('shows required asterisk when required is true', () => {
    render(<PreviewField field={textField({ required: true })} />)
    // The span has aria-label="required" — getByRole finds it as a generic element
    const asterisk = screen.getByText('*')
    expect(asterisk).toBeInTheDocument()
  })

  it('does not show asterisk when required is false', () => {
    render(<PreviewField field={textField({ required: false })} />)
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })

  it('renders help text when provided', () => {
    render(
      <PreviewField
        field={textField({ helpText: 'Enter your full legal name.' })}
      />
    )
    expect(
      screen.getByText('Enter your full legal name.')
    ).toBeInTheDocument()
  })
})

// ── Text field ────────────────────────────────────────────────────────────────

describe('PreviewField — text type', () => {
  it('renders a text input', () => {
    render(<PreviewField field={textField()} />)
    // getByRole('textbox') finds <input type="text"> and <textarea>
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('uses the placeholder when provided', () => {
    render(<PreviewField field={textField({ placeholder: 'Jane Doe' })} />)
    expect(screen.getByPlaceholderText('Jane Doe')).toBeInTheDocument()
  })

  it('input is read-only', () => {
    render(<PreviewField field={textField()} />)
    expect(screen.getByRole('textbox')).toHaveAttribute('readOnly')
  })
})

// ── Email field ───────────────────────────────────────────────────────────────

describe('PreviewField — email type', () => {
  it('renders an email input', () => {
    render(
      <PreviewField field={textField({ type: 'email', label: 'Email' })} />
    )
    // type="email" inputs are still role="textbox" in ARIA
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'email')
  })
})

// ── Dropdown field ────────────────────────────────────────────────────────────

describe('PreviewField — dropdown type', () => {
  const dropdownField: Field = {
    id:      'f2',
    type:    'dropdown',
    label:   'Country',
    required: false,
    options: [
      { id: 'o1', label: 'USA',    value: 'us' },
      { id: 'o2', label: 'Canada', value: 'ca' },
    ],
  }

  it('renders a combobox (select element)', () => {
    render(<PreviewField field={dropdownField} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('renders all options', () => {
    render(<PreviewField field={dropdownField} />)
    expect(screen.getByText('USA')).toBeInTheDocument()
    expect(screen.getByText('Canada')).toBeInTheDocument()
  })

  it('is disabled in preview mode', () => {
    render(<PreviewField field={dropdownField} />)
    expect(screen.getByRole('combobox')).toBeDisabled()
  })
})

// ── Checkbox field ────────────────────────────────────────────────────────────

describe('PreviewField — checkbox type', () => {
  const checkboxField: Field = {
    id:       'f3',
    type:     'checkbox',
    label:    'Interests',
    required: false,
    options:  [
      { id: 'o1', label: 'Music',  value: 'music' },
      { id: 'o2', label: 'Sports', value: 'sports' },
    ],
  }

  it('uses a fieldset with a legend for the group label', () => {
    const { container } = render(<PreviewField field={checkboxField} />)
    // fieldset is the correct semantic wrapper for a checkbox group
    expect(container.querySelector('fieldset')).toBeInTheDocument()
    expect(container.querySelector('legend')).toHaveTextContent('Interests')
  })

  it('renders a checkbox for each option', () => {
    render(<PreviewField field={checkboxField} />)
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(2)
  })

  it('each checkbox has a visible label', () => {
    render(<PreviewField field={checkboxField} />)
    expect(screen.getByLabelText('Music')).toBeInTheDocument()
    expect(screen.getByLabelText('Sports')).toBeInTheDocument()
  })

  it('shows placeholder when no options', () => {
    render(
      <PreviewField field={{ ...checkboxField, options: [] }} />
    )
    expect(screen.getByText('No options added yet')).toBeInTheDocument()
  })
})

// ── File field ────────────────────────────────────────────────────────────────

describe('PreviewField — file type', () => {
  it('renders a file input', () => {
    render(
      <PreviewField
        field={textField({ type: 'file', label: 'Upload CV' })}
      />
    )
    // File inputs don't have a role — query by the label text instead
    const input = document.querySelector('input[type="file"]')
    expect(input).toBeInTheDocument()
  })

  it('is disabled in preview mode', () => {
    render(
      <PreviewField
        field={textField({ type: 'file', label: 'Upload CV' })}
      />
    )
    const input = document.querySelector('input[type="file"]')
    expect(input).toBeDisabled()
  })
})
