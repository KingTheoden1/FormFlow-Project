// nanoidMock.ts — replaces the nanoid package in Jest tests.
//
// Why is this needed?
// nanoid v5 is ESM-only (it uses `export` instead of `module.exports`).
// Jest runs in CommonJS mode by default and can't import ESM modules directly.
// This mock provides a simple deterministic replacement so tests that
// trigger nanoid (e.g. addField in builderSlice) don't crash.
//
// The fake IDs are unique per call (counter-based) which is enough for
// tests — they don't need to be cryptographically random.

let _counter = 0

export function nanoid(_size?: number): string {
  _counter += 1
  return `test-id-${_counter}`
}
