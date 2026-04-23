// BuilderPage — the route component for /builder and /builder/:formId
//
// This file is intentionally thin. It just renders BuilderLayout.
// All the real logic lives in the feature components under features/builder/.
//
// In a later milestone, this page will also:
//   - Read the :formId param from the URL
//   - Dispatch loadFormAsync(formId) to populate Redux with a saved form

import BuilderLayout from '@/features/builder/components/BuilderLayout'

export default function BuilderPage() {
  return <BuilderLayout />
}
