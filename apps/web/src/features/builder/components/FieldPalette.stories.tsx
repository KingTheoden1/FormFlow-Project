// FieldPalette.stories.tsx
//
// FieldPalette dispatches Redux actions when buttons are clicked, so every
// story needs to be wrapped in a Redux <Provider>.
//
// We create a fresh store for each story using configureStore() with the same
// reducers as the real app.  This prevents state from leaking between stories
// while keeping the component behaviour identical to production.

import type { Meta, StoryObj } from '@storybook/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import FieldPalette from './FieldPalette'
import authReducer    from '@/features/auth/authSlice'
import builderReducer from '@/features/builder/builderSlice'
import formsReducer   from '@/features/forms/formsSlice'
import responsesReducer from '@/features/responses/responsesSlice'

// Helper — creates a fresh Redux store each time it is called.
// Each story gets its own store so actions in one story never affect another.
function makeStore() {
  return configureStore({
    reducer: {
      auth:      authReducer,
      builder:   builderReducer,
      forms:     formsReducer,
      responses: responsesReducer,
    },
  })
}

const meta = {
  title: 'Builder/FieldPalette',
  component: FieldPalette,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  // The decorator wraps every story in this file with a fresh Redux store.
  // `Story` is a function that renders the actual story component.
  decorators: [
    (Story) => (
      <Provider store={makeStore()}>
        <Story />
      </Provider>
    ),
  ],
} satisfies Meta<typeof FieldPalette>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    // Tell the a11y addon to check inside the whole panel
    a11y: { element: '#storybook-root' },
    docs: {
      description: {
        story:
          'The field type palette. Click any button to dispatch an `addField` action to Redux. ' +
          'In the real builder this inserts a new field into the active step.',
      },
    },
  },
}
