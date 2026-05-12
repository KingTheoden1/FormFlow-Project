// DashboardPage.stories.tsx
//
// DashboardPage uses both React Router (useNavigate, Link) and Redux
// (forms list, auth token), so two wrappers are needed:
//   1. <MemoryRouter> — provides a fake browser history so Link and
//      useNavigate work without crashing outside a real browser.
//   2. <Provider store={...}> — supplies Redux state.
//
// We use preloadedState to show the page in different data states
// without making real API calls.

import type { Meta, StoryObj } from '@storybook/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { MemoryRouter } from 'react-router-dom'

import DashboardPage from './DashboardPage'
import authReducer      from '@/features/auth/authSlice'
import builderReducer   from '@/features/builder/builderSlice'
import formsReducer     from '@/features/forms/formsSlice'
import responsesReducer from '@/features/responses/responsesSlice'

// Mock form data — represents what the API returns after the user has created forms
const mockForms = [
  {
    id:              'form-1',
    title:           'Conference Registration',
    isPublished:     true,
    submissionCount: 42,
    createdAt:       '2025-04-01T10:00:00Z',
    updatedAt:       '2025-04-10T14:30:00Z',
  },
  {
    id:              'form-2',
    title:           'Customer Feedback Survey',
    isPublished:     true,
    submissionCount: 7,
    createdAt:       '2025-04-05T09:00:00Z',
    updatedAt:       '2025-04-05T09:00:00Z',
  },
  {
    id:              'form-3',
    title:           'Job Application (Draft)',
    isPublished:     false,
    submissionCount: 0,
    createdAt:       '2025-04-20T16:00:00Z',
    updatedAt:       '2025-04-20T16:00:00Z',
  },
]

function makeStore(formsOverrides: Record<string, unknown> = {}) {
  return configureStore({
    reducer: {
      auth:      authReducer,
      builder:   builderReducer,
      forms:     formsReducer,
      responses: responsesReducer,
    },
    preloadedState: {
      forms: {
        items:  [],
        status: 'idle' as const,
        error:  null,
        ...formsOverrides,
      },
    },
  })
}

// Both wrappers applied to every story in this file
function Wrapper({
  store,
  children,
}: {
  store: ReturnType<typeof makeStore>
  children: React.ReactNode
}) {
  return (
    <Provider store={store}>
      {/* initialEntries sets the starting URL — '/' matches our dashboard route */}
      <MemoryRouter initialEntries={['/']}>
        {children}
      </MemoryRouter>
    </Provider>
  )
}

const meta = {
  title: 'Pages/DashboardPage',
  component: DashboardPage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof DashboardPage>

export default meta
type Story = StoryObj<typeof meta>

// ── Stories ──────────────────────────────────────────────────────────────────

// No forms yet — shows the empty state with "Create your first form" prompt.
export const Empty: Story = {
  decorators: [
    (Story) => (
      <Wrapper store={makeStore({ items: [], status: 'idle' })}>
        <Story />
      </Wrapper>
    ),
  ],
}

// Typical use — three forms in the list, mix of published and draft.
export const WithForms: Story = {
  name: 'With forms',
  decorators: [
    (Story) => (
      <Wrapper store={makeStore({ items: mockForms, status: 'idle' })}>
        <Story />
      </Wrapper>
    ),
  ],
}

// The API call is in-flight — shows the "Loading…" text.
export const Loading: Story = {
  decorators: [
    (Story) => (
      <Wrapper store={makeStore({ items: [], status: 'loading' })}>
        <Story />
      </Wrapper>
    ),
  ],
}

// The API call failed — shows the error message.
export const Error: Story = {
  decorators: [
    (Story) => (
      <Wrapper
        store={makeStore({
          items:  [],
          status: 'failed',
          error:  'Failed to load forms. Check your connection and try again.',
        })}
      >
        <Story />
      </Wrapper>
    ),
  ],
}
