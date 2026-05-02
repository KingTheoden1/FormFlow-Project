// ResponsesPage — route wrapper for /forms/:formId/responses.
//
// React Router puts the formId from the URL into `useParams()`.
// This page just reads it and passes it to ResponseDashboard, which
// owns all the data-fetching and Socket.io logic.

import { useParams } from 'react-router-dom'
import ResponseDashboard from '@/features/responses/components/ResponseDashboard'

export default function ResponsesPage() {
  // useParams() reads dynamic segments from the current URL.
  // Our route is /forms/:formId/responses, so formId comes from the URL.
  const { formId } = useParams<{ formId: string }>()

  if (!formId) {
    return (
      <main className="p-8 text-red-600" role="alert">
        No form ID in URL.
      </main>
    )
  }

  return (
    <main>
      <ResponseDashboard formId={formId} />
    </main>
  )
}
