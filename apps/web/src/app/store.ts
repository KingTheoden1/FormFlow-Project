import { configureStore } from '@reduxjs/toolkit'
import authReducer from '@/features/auth/authSlice'
import builderReducer from '@/features/builder/builderSlice'
import formsReducer from '@/features/forms/formsSlice'
import responsesReducer from '@/features/responses/responsesSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    builder: builderReducer,
    forms: formsReducer,
    responses: responsesReducer,
  },
})

// Inferred types — always derive from store, never write by hand
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
