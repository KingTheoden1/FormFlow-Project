// ============================================================
// FormFlow Embed Entry Point
//
// Usage on any external page:
//   <div id="formflow-container" data-form-id="abc123"></div>
//   <script src="https://your-cdn/formflow.js"></script>
//
// The script finds all [data-form-id] elements, fetches the form
// definition from the API, and mounts a React tree into a Shadow
// DOM root — isolating our styles from the host page completely.
// Full implementation: embed milestone
// ============================================================

import React from 'react'
import ReactDOM from 'react-dom/client'

function EmbedPlaceholder({ formId }: { formId: string }) {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '1rem', border: '1px solid #e5e7eb' }}>
      <p>FormFlow embed — form ID: <strong>{formId}</strong></p>
      <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
        Full embed implementation coming in the embed milestone.
      </p>
    </div>
  )
}

function mountEmbed(container: HTMLElement, formId: string) {
  // Mount into a Shadow DOM so host-page CSS cannot bleed in
  const shadow = container.attachShadow({ mode: 'open' })
  const mountPoint = document.createElement('div')
  shadow.appendChild(mountPoint)
  ReactDOM.createRoot(mountPoint).render(
    <React.StrictMode>
      <EmbedPlaceholder formId={formId} />
    </React.StrictMode>
  )
}

// Auto-initialize on DOMContentLoaded
function init() {
  const containers = document.querySelectorAll<HTMLElement>('[data-form-id]')
  containers.forEach((el) => {
    const formId = el.getAttribute('data-form-id')
    if (formId) mountEmbed(el, formId)
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
