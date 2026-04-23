import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import BuilderPage from '@/pages/BuilderPage'
import ResponsesPage from '@/pages/ResponsesPage'

// Guards a route — redirects to /login if no token is present.
// In development (npm run dev), this check is bypassed so you can work on
// the UI without needing a running backend.
function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAppSelector((s) => s.auth.token)
  if (import.meta.env.DEV) return <>{children}</>
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/builder"
        element={
          <RequireAuth>
            <BuilderPage />
          </RequireAuth>
        }
      />
      <Route
        path="/builder/:formId"
        element={
          <RequireAuth>
            <BuilderPage />
          </RequireAuth>
        }
      />
      <Route
        path="/forms/:formId/responses"
        element={
          <RequireAuth>
            <ResponsesPage />
          </RequireAuth>
        }
      />
    </Routes>
  )
}
