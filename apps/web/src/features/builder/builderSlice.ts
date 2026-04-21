import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { nanoid } from 'nanoid'
import type { Field, FieldType, Step, FormDefinition } from '@/types/form'

interface BuilderState {
  formId: string | null          // null = new unsaved form
  title: string
  description: string
  steps: Step[]
  activeStepIndex: number
  selectedFieldId: string | null
  isDirty: boolean               // true = unsaved changes
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  hasPaymentStep: boolean
  paymentAmount: number          // cents
  paymentCurrency: string
  paymentDescription: string
}

const defaultStep = (): Step => ({
  id: nanoid(),
  title: 'Step 1',
  fields: [],
})

const initialState: BuilderState = {
  formId: null,
  title: 'Untitled Form',
  description: '',
  steps: [defaultStep()],
  activeStepIndex: 0,
  selectedFieldId: null,
  isDirty: false,
  saveStatus: 'idle',
  hasPaymentStep: false,
  paymentAmount: 0,
  paymentCurrency: 'usd',
  paymentDescription: '',
}

// ── Async thunks ───────────────────────────────────────────────────────────

export const saveFormAsync = createAsyncThunk(
  'builder/save',
  async (_, { getState, rejectWithValue }) => {
    const { builder, auth } = getState() as {
      builder: BuilderState
      auth: { token: string | null }
    }
    const endpoint = builder.formId
      ? `/api/forms/${builder.formId}`
      : '/api/forms'
    const method = builder.formId ? 'PUT' : 'POST'

    const payload: Partial<FormDefinition> = {
      title: builder.title,
      description: builder.description,
      steps: builder.steps,
      hasPaymentStep: builder.hasPaymentStep,
      paymentAmount: builder.paymentAmount,
      paymentCurrency: builder.paymentCurrency,
      paymentDescription: builder.paymentDescription,
    }

    const res = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}),
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return rejectWithValue('Save failed')
    return res.json() as Promise<FormDefinition>
  }
)

export const loadFormAsync = createAsyncThunk(
  'builder/load',
  async (formId: string, { getState, rejectWithValue }) => {
    const { auth } = getState() as { auth: { token: string | null } }
    const res = await fetch(`/api/forms/${formId}`, {
      headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : {},
    })
    if (!res.ok) return rejectWithValue('Load failed')
    return res.json() as Promise<FormDefinition>
  }
)

// ── Slice ──────────────────────────────────────────────────────────────────

const builderSlice = createSlice({
  name: 'builder',
  initialState,
  reducers: {
    // Form metadata
    setTitle(state, action: { payload: string }) {
      state.title = action.payload
      state.isDirty = true
    },
    setDescription(state, action: { payload: string }) {
      state.description = action.payload
      state.isDirty = true
    },

    // Steps
    addStep(state) {
      state.steps.push({
        id: nanoid(),
        title: `Step ${state.steps.length + 1}`,
        fields: [],
      })
      state.activeStepIndex = state.steps.length - 1
      state.isDirty = true
    },
    removeStep(state, action: { payload: string }) {
      if (state.steps.length === 1) return // Always keep at least one step
      const idx = state.steps.findIndex((s) => s.id === action.payload)
      state.steps.splice(idx, 1)
      state.activeStepIndex = Math.min(state.activeStepIndex, state.steps.length - 1)
      state.isDirty = true
    },
    setActiveStep(state, action: { payload: number }) {
      state.activeStepIndex = action.payload
      state.selectedFieldId = null
    },
    updateStepTitle(state, action: { payload: { stepId: string; title: string } }) {
      const step = state.steps.find((s) => s.id === action.payload.stepId)
      if (step) {
        step.title = action.payload.title
        state.isDirty = true
      }
    },
    reorderSteps(state, action: { payload: { fromIndex: number; toIndex: number } }) {
      const { fromIndex, toIndex } = action.payload
      const [moved] = state.steps.splice(fromIndex, 1)
      state.steps.splice(toIndex, 0, moved)
      state.activeStepIndex = toIndex
      state.isDirty = true
    },

    // Fields
    addField(state, action: { payload: FieldType }) {
      const step = state.steps[state.activeStepIndex]
      if (!step) return
      const newField: Field = {
        id: nanoid(),
        type: action.payload,
        label: '',
        required: false,
      }
      step.fields.push(newField)
      state.selectedFieldId = newField.id
      state.isDirty = true
    },
    removeField(state, action: { payload: { stepId: string; fieldId: string } }) {
      const step = state.steps.find((s) => s.id === action.payload.stepId)
      if (!step) return
      step.fields = step.fields.filter((f) => f.id !== action.payload.fieldId)
      if (state.selectedFieldId === action.payload.fieldId) {
        state.selectedFieldId = null
      }
      state.isDirty = true
    },
    updateField(
      state,
      action: { payload: { stepId: string; fieldId: string; changes: Partial<Field> } }
    ) {
      const step = state.steps.find((s) => s.id === action.payload.stepId)
      if (!step) return
      const field = step.fields.find((f) => f.id === action.payload.fieldId)
      if (!field) return
      Object.assign(field, action.payload.changes)
      state.isDirty = true
    },
    reorderFields(
      state,
      action: {
        payload: { stepId: string; fromIndex: number; toIndex: number }
      }
    ) {
      const step = state.steps.find((s) => s.id === action.payload.stepId)
      if (!step) return
      const [moved] = step.fields.splice(action.payload.fromIndex, 1)
      step.fields.splice(action.payload.toIndex, 0, moved)
      state.isDirty = true
    },
    selectField(state, action: { payload: string | null }) {
      state.selectedFieldId = action.payload
    },

    // Payment step
    setHasPaymentStep(state, action: { payload: boolean }) {
      state.hasPaymentStep = action.payload
      state.isDirty = true
    },
    setPaymentAmount(state, action: { payload: number }) {
      state.paymentAmount = action.payload
      state.isDirty = true
    },
    setPaymentDescription(state, action: { payload: string }) {
      state.paymentDescription = action.payload
      state.isDirty = true
    },

    // Reset to a blank form
    resetBuilder() {
      return { ...initialState, steps: [defaultStep()] }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveFormAsync.pending, (state) => {
        state.saveStatus = 'saving'
      })
      .addCase(saveFormAsync.fulfilled, (state, action) => {
        state.saveStatus = 'saved'
        state.formId = action.payload.id
        state.isDirty = false
      })
      .addCase(saveFormAsync.rejected, (state) => {
        state.saveStatus = 'error'
      })
      .addCase(loadFormAsync.fulfilled, (state, action) => {
        const form = action.payload
        state.formId = form.id
        state.title = form.title
        state.description = form.description ?? ''
        state.steps = form.steps
        state.hasPaymentStep = form.hasPaymentStep
        state.paymentAmount = form.paymentAmount ?? 0
        state.paymentCurrency = form.paymentCurrency ?? 'usd'
        state.paymentDescription = form.paymentDescription ?? ''
        state.isDirty = false
        state.activeStepIndex = 0
        state.selectedFieldId = null
      })
  },
})

export const {
  setTitle,
  setDescription,
  addStep,
  removeStep,
  setActiveStep,
  updateStepTitle,
  reorderSteps,
  addField,
  removeField,
  updateField,
  reorderFields,
  selectField,
  setHasPaymentStep,
  setPaymentAmount,
  setPaymentDescription,
  resetBuilder,
} = builderSlice.actions

export default builderSlice.reducer
