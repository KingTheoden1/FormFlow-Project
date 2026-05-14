// builder.spec.ts — Playwright end-to-end tests for the form builder.
//
// What is an E2E test?
// Unlike unit tests which test one function in isolation, E2E tests launch a
// real browser, navigate to a real URL, and interact with the page just like
// a human would — clicking, typing, checking what's visible.
//
// Prerequisites:
//   - `npm run dev` must be running (or Playwright starts it automatically
//     via the webServer config in playwright.config.ts)
//   - No backend needed for these tests — the builder works fully offline
//     in DEV mode (auth is bypassed and saving is skipped until the user clicks Save)
//
// Selectors:
//   page.getByRole()    — finds by ARIA role (preferred — matches what screen readers see)
//   page.getByLabel()   — finds by associated label text
//   page.getByText()    — finds by visible text content
//   page.locator()      — CSS / XPath selector (last resort)

import { test, expect } from '@playwright/test'

// ── Builder page loads ────────────────────────────────────────────────────────

test.describe('Builder page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the builder before each test in this group
    await page.goto('/builder')
  })

  test('page title input is visible', async ({ page }) => {
    // The form title input has aria-label="Form title"
    const titleInput = page.getByLabel('Form title')
    await expect(titleInput).toBeVisible()
  })

  test('default title is "Untitled Form"', async ({ page }) => {
    const titleInput = page.getByLabel('Form title')
    await expect(titleInput).toHaveValue('Untitled Form')
  })

  test('field palette shows all 5 field types', async ({ page }) => {
    await expect(page.getByLabel('Add Short Text field')).toBeVisible()
    await expect(page.getByLabel('Add Email field')).toBeVisible()
    await expect(page.getByLabel('Add Dropdown field')).toBeVisible()
    await expect(page.getByLabel('Add Checkboxes field')).toBeVisible()
    await expect(page.getByLabel('Add File Upload field')).toBeVisible()
  })

  test('Save button is visible', async ({ page }) => {
    await expect(page.getByLabel('Save form')).toBeVisible()
  })

  test('Preview toggle is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /preview/i })).toBeVisible()
  })
})

// ── Adding fields ─────────────────────────────────────────────────────────────

test.describe('Adding fields', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder')
  })

  test('clicking Short Text adds a text field to the canvas', async ({ page }) => {
    await page.getByLabel('Add Short Text field').click()

    // After clicking, a field card should appear in the canvas.
    // The field card has a delete button with aria-label matching the field label.
    // We look for any element with the text "Short Text" which appears as the
    // default label on a newly added text field.
    await expect(page.getByText('Short Text').first()).toBeVisible()
  })

  test('clicking Email adds an email field', async ({ page }) => {
    await page.getByLabel('Add Email field').click()
    await expect(page.getByText('Email').first()).toBeVisible()
  })

  test('can add multiple fields', async ({ page }) => {
    await page.getByLabel('Add Short Text field').click()
    await page.getByLabel('Add Email field').click()

    // Both field labels should be visible in the canvas
    await expect(page.getByText('Short Text').first()).toBeVisible()
    await expect(page.getByText('Email').first()).toBeVisible()
  })
})

// ── Form title editing ────────────────────────────────────────────────────────

test.describe('Form title', () => {
  test('user can edit the form title', async ({ page }) => {
    await page.goto('/builder')

    const titleInput = page.getByLabel('Form title')
    await titleInput.clear()
    await titleInput.fill('My Test Survey')

    await expect(titleInput).toHaveValue('My Test Survey')
  })
})

// ── Preview toggle ────────────────────────────────────────────────────────────

test.describe('Preview toggle', () => {
  test('clicking Preview shows the live preview panel', async ({ page }) => {
    await page.goto('/builder')

    const previewBtn = page.getByRole('button', { name: /preview/i })
    await previewBtn.click()

    // After toggling, the button label changes to "Hide Preview"
    await expect(
      page.getByRole('button', { name: /hide preview/i })
    ).toBeVisible()
  })

  test('clicking Hide Preview restores the editor panel', async ({ page }) => {
    await page.goto('/builder')

    // Toggle preview on then off
    await page.getByRole('button', { name: /preview/i }).click()
    await page.getByRole('button', { name: /hide preview/i }).click()

    // Button goes back to "Preview"
    await expect(
      page.getByRole('button', { name: /👁 preview/i })
    ).toBeVisible()
  })
})
