import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

interface User {
  id: string
  email: string
  name: string
}

interface AuthState {
  user: User | null
  // SECURITY: Token lives in memory only — never persisted to localStorage.
  // On page refresh the user re-authenticates via HttpOnly refresh cookie.
  // This prevents XSS from stealing the access token.
  token: string | null
  status: 'idle' | 'loading' | 'failed'
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: null,
  status: 'idle',
  error: null,
}

export const loginAsync = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // sends/receives HttpOnly refresh cookie
      body: JSON.stringify(credentials),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return rejectWithValue((body as { message?: string }).message ?? 'Login failed')
    }
    return res.json() as Promise<{ user: User; accessToken: string }>
  }
)

export const logoutAsync = createAsyncThunk('auth/logout', async () => {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
})

export const refreshTokenAsync = createAsyncThunk(
  'auth/refresh',
  async (_, { rejectWithValue }) => {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })
    if (!res.ok) return rejectWithValue('Session expired')
    return res.json() as Promise<{ user: User; accessToken: string }>
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Called by the interceptor when a new token arrives via silent refresh
    tokenRefreshed(state, action: { payload: string }) {
      state.token = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAsync.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.status = 'idle'
        state.user = action.payload.user
        state.token = action.payload.accessToken
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.status = 'idle'
      })
      .addCase(refreshTokenAsync.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.token = action.payload.accessToken
        state.status = 'idle'
      })
      .addCase(refreshTokenAsync.rejected, (state) => {
        state.user = null
        state.token = null
      })
  },
})

export const { tokenRefreshed } = authSlice.actions
export default authSlice.reducer
