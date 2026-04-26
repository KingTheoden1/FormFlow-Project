// embed.tsx — the entry point for the self-contained embed bundle.
//
// This file is what gets compiled into formflow.js (the single script tag
// that website owners drop onto their pages).
//
// How it works end-to-end:
//   1. Website owner adds a <div> and a <script> to their HTML page:
//
//        <div data-form-id="abc123"></div>
//        <script
//          src="https://your-cdn/formflow.js"
//          data-api-url="https://your-api.azurewebsites.net"
//        ></script>
//
//   2. This script runs, finds every element with [data-form-id],
//      and calls mountEmbed() for each one.
//
//   3. mountEmbed() creates a Shadow DOM inside the container.
//      Shadow DOM is a browser feature that creates a completely isolated
//      DOM subtree — the host page's CSS cannot affect our form, and our
//      CSS cannot affect the host page.
//
//   4. We inject our CSS string into the shadow root, then mount a React
//      tree (EmbedApp) inside it.
//
// API URL resolution (in priority order):
//   1. data-api-url on the <script> tag
//   2. window.FORMFLOW_API_URL global variable
//   3. Empty string (relative URLs — works if embed is served from same domain as API)

import React from 'react'
import ReactDOM from 'react-dom/client'
import EmbedApp from './EmbedApp'
import { EMBED_STYLES } from './styles'

// Extend the Window type so TypeScript knows about our optional global
declare global {
  interface Window {
    FORMFLOW_API_URL?: string
  }
}

function mountEmbed(container: HTMLElement, formId: string, apiUrl: string): void {
  // attachShadow creates the isolated DOM tree.
  // mode: 'open' means JavaScript on the host page CAN still access
  // the shadow DOM via element.shadowRoot — acceptable for a form widget.
  const shadow = container.attachShadow({ mode: 'open' })

  // Inject our styles into the shadow root as a <style> element.
  // This is the only way to style elements inside a Shadow DOM.
  const styleEl = document.createElement('style')
  styleEl.textContent = EMBED_STYLES
  shadow.appendChild(styleEl)

  // Create a mount point div inside the shadow root and render React into it.
  const mountPoint = document.createElement('div')
  shadow.appendChild(mountPoint)

  ReactDOM.createRoot(mountPoint).render(
    <React.StrictMode>
      <EmbedApp formId={formId} apiUrl={apiUrl} />
    </React.StrictMode>
  )
}

function init(): void {
  // Read the API URL from the script tag's data-api-url attribute.
  // document.currentScript points to the <script> element that is
  // currently executing — it's only available during the initial run.
  const scriptTag = document.currentScript as HTMLScriptElement | null
  const apiUrl =
    scriptTag?.getAttribute('data-api-url') ??
    window.FORMFLOW_API_URL ??
    ''

  // Find every container element that has a data-form-id attribute
  // and mount an embed inside each one.
  const containers = document.querySelectorAll<HTMLElement>('[data-form-id]')
  containers.forEach((el) => {
    const formId = el.getAttribute('data-form-id')
    if (formId) mountEmbed(el, formId, apiUrl)
  })
}

// If the script tag is in <head> or loads before the DOM is ready,
// wait for DOMContentLoaded. If the DOM is already parsed (e.g. script
// is at the bottom of <body>), run immediately.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
