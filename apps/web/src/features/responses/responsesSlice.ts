import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { Submission } from '@/types/response'
import type { RootState } from '@/app/store'

interface ResponsesState {
  // Keyed by formId so we can hold submissions for multiple forms simultaneously
  byFormId: Record<string, Submission[]>
  // Socket.io connection status — shown as indicator in the dashboard UI
  connectionStatus: 'disconnected' | 'connecting' | 'connected'
}

const initialState: ResponsesState = {
  byFormId: {},
  connectionStatus: 'disconnected',
}

export const fetchSubmissionsAsync = createAsyncThunk(
  'responses/fetchByForm',
  async (formId: string, { getState, rejectWithValue }) => {
    const { auth } = getState() as RootState
    const res = await fetch(`/api/forms/${formId}/submissions`, {
      headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : {},
    })
    if (!res.ok) return rejectWithValue('Failed to load submissions')
    const data = (await res.json()) as Submission[]
    return { formId, submissions: data }
  }
)

const responsesSlice = createSlice({
  name: 'responses',
  initialState,
  reducers: {
    // Dispatched by the useSocket hook when Socket.io emits 'new_submission'
    submissionReceived(state, action: { payload: Submission }) {
      const { formId } = action.payload
      if (!state.byFormId[formId]) {
        state.byFormId[formId] = []
      }
      // Prepend so newest is always first in the feed
      state.byFormId[formId].unshift(action.payload)
    },
    setConnectionStatus(
      state,
      action: { payload: ResponsesState['connectionStatus'] }
    ) {
      state.connectionStatus = action.payload
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchSubmissionsAsync.fulfilled, (state, action) => {
      state.byFormId[action.payload.formId] = action.payload.submissions
    })
  },
})

export const { submissionReceived, setConnectionStatus } = responsesSlice.actions
export default responsesSlice.reducer
