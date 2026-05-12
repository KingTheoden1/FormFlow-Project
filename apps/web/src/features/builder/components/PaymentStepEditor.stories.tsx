// PaymentStepEditor.stories.tsx
//
// PaymentStepEditor reads from and writes to the Redux builder slice,
// so every story needs a Redux <Provider>.
//
// We use `preloadedState` to set the store to the exact state each story
// needs — this is how we show "payment ON" vs "payment OFF" without
// having to click the checkbox inside Storybook.

import type { Meta, StoryObj } from '@storybook/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'

import PaymentStepEditor from './PaymentStepEditor'
import authReducer      from '@/features/auth/authSlice'
import builderReducer   from '@/features/builder/builderSlice'
import formsReducer     from '@/features/forms/formsSlice'
import responsesReducer from '@/features/responses/responsesSlice'

// preloadedState lets us set specific Redux values before the story renders.
// Type is Partial so we only have to specify the slices we care about.
function makeStore(builderOverrides: Record<string, unknown> = {}) {
  return configureStore({
    reducer: {
      auth:      authReducer,
      builder:   builderReducer,
      forms:     formsReducer,
      responses: responsesReducer,
    },
    preloadedState: {
      builder: {
        formId:             null,
        title:              'My Form',
        description:        '',
        steps:              [],
        activeStepIndex:    0,
        selectedFieldId:    null,
        isDirty:            false,
        saveStatus:         'idle' as const,
        hasPaymentStep:     false,
        paymentAmount:      0,
        paymentCurrency:    'usd',
        paymentDescription: '',
        ...builderOverrides,
      },
    },
  })
}

const meta = {
  title: 'Builder/PaymentStepEditor',
  component: PaymentStepEditor,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof PaymentStepEditor>

export default meta
type Story = StoryObj<typeof meta>

// ── Stories ──────────────────────────────────────────────────────────────────

// Payment is toggled OFF — the default state for new forms.
export const PaymentOff: Story = {
  name: 'Payment off (default)',
  decorators: [
    (Story) => (
      <Provider store={makeStore({ hasPaymentStep: false })}>
        <Story />
      </Provider>
    ),
  ],
}

// Payment is toggled ON and an amount + description are already set.
// This shows the amount input and description field that appear when
// the "Collect payment" checkbox is checked.
export const PaymentOn: Story = {
  name: 'Payment on — amount and description filled',
  decorators: [
    (Story) => (
      <Provider
        store={makeStore({
          hasPaymentStep:     true,
          paymentAmount:      2500, // $25.00 in cents
          paymentDescription: 'Conference registration fee',
        })}
      >
        <Story />
      </Provider>
    ),
  ],
}

// Payment on but amount not yet filled in — shows the empty input.
export const PaymentOnEmpty: Story = {
  name: 'Payment on — amount not yet set',
  decorators: [
    (Story) => (
      <Provider store={makeStore({ hasPaymentStep: true, paymentAmount: 0 })}>
        <Story />
      </Provider>
    ),
  ],
}
