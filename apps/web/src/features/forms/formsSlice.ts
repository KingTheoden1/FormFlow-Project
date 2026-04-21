import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { FormSummary } from '@/types/form'
import type { RootState } from '@/app/store'

interface FormsState {
  items: FormSummary[]
  status: 'idle' | 'loading' | 'failed'
  error: string | null
}

const initialState: FormsState = {
  items: [],
  status: 'idle',
  error: null,
}

export const fetchFormsAsync = createAsyncThunk(
  'forms/fetchAll',
  async (_, { getState, rejectWithValue }) => {
    const { auth } = getState() as RootState
    const res = await fetch('/api/forms', {
      headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : {},
    })
    if (!res.ok) return rejectWithValue('Failed to load forms')
    return res.json() as Promise<FormSummary[]>
  }
)

export const deleteFormAsync = createAsyncThunk(
  'forms/delete',
  async (formId: string, { getState, rejectWithValue }) => {
    const { auth } = getState() as RootState
    const res = await fetch(`/api/forms/${formId}`, {
      method: 'DELETE',
      headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : {},
    })
    if (!res.ok) return rejectWithValue('Failed to delete form')
    return formId
  }
)

const formsSlice = createSlice({
  name: 'forms',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFormsAsync.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchFormsAsync.fulfilled, (state, action) => {
        state.status = 'idle'
        state.items = action.payload
      })
      .addCase(fetchFormsAsync.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(deleteFormAsync.fulfilled, (state, action) => {
        state.items = state.items.filter((f) => f.id !== action.payload)
      })
  },
})

export default formsSlice.reducer
