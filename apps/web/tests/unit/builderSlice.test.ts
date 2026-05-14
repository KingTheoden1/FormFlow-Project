// builderSlice.test.ts
//
// Tests for the Redux builder slice — pure logic, no React components.
//
// How Redux reducer tests work:
//   1. Import the reducer function and action creators.
//   2. Call `reducer(currentState, action)` to get the next state.
//   3. Assert the next state is what you expect.
//
// There's no DOM, no rendering — just plain TypeScript function calls.
// This makes these tests very fast (< 1ms each).

import builderReducer, {
  setTitle,
  addField,
  removeField,
  selectField,
  setHasPaymentStep,
  setPaymentAmount,
  setPaymentDescription,
  addStep,
  removeStep,
} from '@/features/builder/builderSlice'

// ── Helpers ───────────────────────────────────────────────────────────────────

// Returns the initial state by calling the reducer with undefined state
// and a no-op action.  This is the standard way to get the initial state.
function getInitialState() {
  return builderReducer(undefined, { type: '@@INIT' })
}

// ── Initial state ─────────────────────────────────────────────────────────────

describe('builderSlice — initial state', () => {
  it('starts with an untitled form', () => {
    const state = getInitialState()
    expect(state.title).toBe('Untitled Form')
  })

  it('starts with one empty step', () => {
    const state = getInitialState()
    expect(state.steps).toHaveLength(1)
    expect(state.steps[0]!.fields).toHaveLength(0)
  })

  it('starts with hasPaymentStep false', () => {
    const state = getInitialState()
    expect(state.hasPaymentStep).toBe(false)
  })

  it('starts with isDirty false', () => {
    const state = getInitialState()
    expect(state.isDirty).toBe(false)
  })
})

// ── setTitle ──────────────────────────────────────────────────────────────────

describe('setTitle', () => {
  it('updates the title', () => {
    const state = builderReducer(getInitialState(), setTitle('My Survey'))
    expect(state.title).toBe('My Survey')
  })

  it('marks the form as dirty', () => {
    const state = builderReducer(getInitialState(), setTitle('Any title'))
    expect(state.isDirty).toBe(true)
  })
})

// ── addField ──────────────────────────────────────────────────────────────────

describe('addField', () => {
  it('adds a text field to the active step', () => {
    const state = builderReducer(getInitialState(), addField('text'))
    expect(state.steps[0]!.fields).toHaveLength(1)
    expect(state.steps[0]!.fields[0]!.type).toBe('text')
  })

  it('adds an email field', () => {
    const state = builderReducer(getInitialState(), addField('email'))
    expect(state.steps[0]!.fields[0]!.type).toBe('email')
  })

  it('adds multiple fields in order', () => {
    let state = getInitialState()
    state = builderReducer(state, addField('text'))
    state = builderReducer(state, addField('email'))
    expect(state.steps[0]!.fields).toHaveLength(2)
    expect(state.steps[0]!.fields[0]!.type).toBe('text')
    expect(state.steps[0]!.fields[1]!.type).toBe('email')
  })

  it('marks the form as dirty', () => {
    const state = builderReducer(getInitialState(), addField('text'))
    expect(state.isDirty).toBe(true)
  })

  it('selects the newly added field', () => {
    const state = builderReducer(getInitialState(), addField('text'))
    const newFieldId = state.steps[0]!.fields[0]!.id
    expect(state.selectedFieldId).toBe(newFieldId)
  })
})

// ── removeField ───────────────────────────────────────────────────────────────

describe('removeField', () => {
  it('removes the field with the given id', () => {
    let state = getInitialState()
    state = builderReducer(state, addField('text'))
    const stepId  = state.steps[0]!.id
    const fieldId = state.steps[0]!.fields[0]!.id

    state = builderReducer(state, removeField({ stepId, fieldId }))
    expect(state.steps[0]!.fields).toHaveLength(0)
  })

  it('does nothing if the field id does not exist', () => {
    let state = getInitialState()
    state = builderReducer(state, addField('text'))
    const stepId = state.steps[0]!.id
    const before = state.steps[0]!.fields.length

    state = builderReducer(state, removeField({ stepId, fieldId: 'non-existent-id' }))
    expect(state.steps[0]!.fields).toHaveLength(before)
  })

  it('clears selectedFieldId when the selected field is removed', () => {
    let state = getInitialState()
    state = builderReducer(state, addField('text'))
    const stepId  = state.steps[0]!.id
    const fieldId = state.steps[0]!.fields[0]!.id

    state = builderReducer(state, removeField({ stepId, fieldId }))
    expect(state.selectedFieldId).toBeNull()
  })
})

// ── selectField ───────────────────────────────────────────────────────────────

describe('selectField', () => {
  it('sets the selectedFieldId', () => {
    let state = getInitialState()
    state = builderReducer(state, addField('text'))
    const fieldId = state.steps[0]!.fields[0]!.id

    state = builderReducer(state, selectField(fieldId))
    expect(state.selectedFieldId).toBe(fieldId)
  })

  it('deselects when called with null', () => {
    let state = getInitialState()
    state = builderReducer(state, addField('text'))
    const fieldId = state.steps[0]!.fields[0]!.id
    state = builderReducer(state, selectField(fieldId))

    state = builderReducer(state, selectField(null))
    expect(state.selectedFieldId).toBeNull()
  })
})

// ── Payment ───────────────────────────────────────────────────────────────────

describe('setHasPaymentStep', () => {
  it('enables the payment step', () => {
    const state = builderReducer(getInitialState(), setHasPaymentStep(true))
    expect(state.hasPaymentStep).toBe(true)
  })

  it('disables the payment step', () => {
    let state = builderReducer(getInitialState(), setHasPaymentStep(true))
    state     = builderReducer(state,             setHasPaymentStep(false))
    expect(state.hasPaymentStep).toBe(false)
  })

  it('marks the form as dirty', () => {
    const state = builderReducer(getInitialState(), setHasPaymentStep(true))
    expect(state.isDirty).toBe(true)
  })
})

describe('setPaymentAmount', () => {
  it('stores the amount in cents', () => {
    const state = builderReducer(getInitialState(), setPaymentAmount(1250))
    expect(state.paymentAmount).toBe(1250)
  })
})

describe('setPaymentDescription', () => {
  it('updates the payment description', () => {
    const state = builderReducer(
      getInitialState(),
      setPaymentDescription('Registration fee')
    )
    expect(state.paymentDescription).toBe('Registration fee')
  })
})

// ── Steps ─────────────────────────────────────────────────────────────────────

describe('addStep', () => {
  it('adds a new step', () => {
    const state = builderReducer(getInitialState(), addStep())
    expect(state.steps).toHaveLength(2)
  })

  it('the new step has no fields', () => {
    const state = builderReducer(getInitialState(), addStep())
    expect(state.steps[1]!.fields).toHaveLength(0)
  })
})

describe('removeStep', () => {
  it('removes a step by id', () => {
    let state = getInitialState()
    state = builderReducer(state, addStep())
    const stepId = state.steps[1]!.id

    state = builderReducer(state, removeStep(stepId))
    expect(state.steps).toHaveLength(1)
  })

  it('does not remove the last remaining step', () => {
    let state = getInitialState()
    const stepId = state.steps[0]!.id

    state = builderReducer(state, removeStep(stepId))
    // Should still have 1 step — can't have zero
    expect(state.steps).toHaveLength(1)
  })
})
