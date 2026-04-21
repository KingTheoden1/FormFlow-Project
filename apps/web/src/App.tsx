import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import BuilderPage from '@/pages/BuilderPage'
import ResponsesPage from '@/pages/ResponsesPage'

// Placeholder protected route wrapper — will add proper auth guard next milestone
function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAppSelector((s) => s.auth.token)
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
