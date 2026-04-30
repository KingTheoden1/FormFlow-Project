// styles.ts — the CSS string injected into each Shadow DOM root.
//
// Why a CSS string instead of a .css file?
// Shadow DOM is completely isolated from the host page — the host page's
// stylesheets don't reach inside it, and our styles don't leak out.
// To style elements inside Shadow DOM, we inject a <style> tag directly
// into the shadow root at mount time. This string becomes that <style> tag.
//
// Why not Tailwind?
// Tailwind works by scanning your source files and generating a CSS file.
// Because the embed is injected at runtime into unknown host pages, we can't
// use a pre-generated Tailwind file — we need the CSS self-contained in the JS.
// Plain CSS strings are the standard approach for embeddable widgets.

export const EMBED_STYLES = `
  /* Box-sizing reset — makes width/padding calculations predictable */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* ── Form card ──────────────────────────────────────────────── */
  .ff-form {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    max-width: 600px;
    padding: 28px;
    background: #ffffff;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    color: #111827;
    line-height: 1.5;
  }

  .ff-title {
    font-size: 1.375rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 6px;
  }

  .ff-step-indicator {
    font-size: 0.75rem;
    color: #9ca3af;
    margin-bottom: 20px;
  }

  /* ── Field wrapper ──────────────────────────────────────────── */
  .ff-field {
    margin-bottom: 20px;
  }

  .ff-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 5px;
  }

  .ff-required {
    color: #ef4444;
    margin-left: 2px;
  }

  .ff-help {
    font-size: 0.75rem;
    color: #6b7280;
    margin-bottom: 5px;
  }

  .ff-error-text {
    font-size: 0.75rem;
    color: #ef4444;
    margin-top: 5px;
  }

  /* ── Text and email inputs ──────────────────────────────────── */
  .ff-input {
    width: 100%;
    padding: 9px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    font-family: inherit;
    color: #111827;
    background: #fff;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .ff-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
  }

  /* Applied when the field has a validation error */
  .ff-input--error {
    border-color: #ef4444;
  }

  .ff-input--error:focus {
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.25);
  }

  /* ── Dropdown / select ──────────────────────────────────────── */
  .ff-select {
    width: 100%;
    padding: 9px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    font-family: inherit;
    color: #111827;
    background: #fff;
    outline: none;
    cursor: pointer;
  }

  .ff-select:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
  }

  /* ── Checkbox group ─────────────────────────────────────────── */
  .ff-checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 4px;
  }

  .ff-checkbox-item {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .ff-checkbox {
    width: 16px;
    height: 16px;
    accent-color: #2563eb;
    cursor: pointer;
    flex-shrink: 0;
  }

  .ff-checkbox-label {
    font-size: 0.875rem;
    color: #374151;
    cursor: pointer;
  }

  /* ── File input ─────────────────────────────────────────────── */
  .ff-file {
    font-size: 0.875rem;
    color: #6b7280;
    cursor: pointer;
    width: 100%;
  }

  .ff-file::file-selector-button {
    margin-right: 12px;
    padding: 6px 14px;
    background: #eff6ff;
    color: #1d4ed8;
    border: none;
    border-radius: 5px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
  }

  .ff-file::file-selector-button:hover {
    background: #dbeafe;
  }

  /* ── Navigation buttons ─────────────────────────────────────── */
  .ff-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 28px;
  }

  .ff-btn {
    padding: 9px 22px;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    border: none;
    transition: background 0.15s;
    outline: none;
  }

  /* WCAG 2.4.7 — focus must always be visible */
  .ff-btn:focus-visible {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
  }

  .ff-btn-primary {
    background: #2563eb;
    color: #ffffff;
  }

  .ff-btn-primary:hover:not(:disabled) {
    background: #1d4ed8;
  }

  .ff-btn-primary:disabled {
    background: #93c5fd;
    cursor: not-allowed;
  }

  .ff-btn-secondary {
    background: #f3f4f6;
    color: #374151;
  }

  .ff-btn-secondary:hover:not(:disabled) {
    background: #e5e7eb;
  }

  .ff-btn-secondary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* ── Success state ──────────────────────────────────────────── */
  .ff-success {
    text-align: center;
    padding: 40px 24px;
  }

  .ff-success-icon {
    font-size: 3rem;
    margin-bottom: 14px;
  }

  .ff-success-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 8px;
  }

  .ff-success-msg {
    font-size: 0.875rem;
    color: #6b7280;
  }

  /* ── Loading / error states ─────────────────────────────────── */
  .ff-loading {
    text-align: center;
    padding: 40px;
    color: #9ca3af;
    font-size: 0.875rem;
    font-family: system-ui, sans-serif;
  }

  .ff-error-state {
    text-align: center;
    padding: 40px;
    color: #ef4444;
    font-size: 0.875rem;
    font-family: system-ui, sans-serif;
  }

  /* ── Payment step ───────────────────────────────────────────── */
  .ff-payment-amount {
    margin-bottom: 16px;
    font-size: 1rem;
    color: #374151;
    font-family: system-ui, sans-serif;
  }

  /* Wrapper that gives the Stripe iframe room to breathe */
  .ff-payment-element {
    margin-bottom: 16px;
  }

  /* ── Submit error banner ────────────────────────────────────── */
  .ff-submit-error {
    margin-top: 12px;
    padding: 10px 14px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    color: #dc2626;
    font-size: 0.875rem;
  }
`
