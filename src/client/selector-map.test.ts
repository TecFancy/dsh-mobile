import { describe, expect, it } from 'vitest'
import { SELECTOR_MAP } from './selector-map.ts'

describe('selector-map', () => {
  it('keeps every entry fully documented', () => {
    for (const entry of SELECTOR_MAP) {
      expect(entry.selector.startsWith('.')).toBe(true)
      expect(entry.dshVersion.length).toBeGreaterThan(0)
      expect(entry.usedBy.length).toBeGreaterThan(0)
      expect(entry.reason.length).toBeGreaterThan(0)
      expect(entry.fallback.length).toBeGreaterThan(0)
    }
  })

  it('allows M1 to be free of hashed selectors (all structural)', () => {
    // M1 drawer overlay intentionally uses zero hashed classes; when M2 adds
    // entries this test documents the map filling up.
    expect(Array.isArray(SELECTOR_MAP)).toBe(true)
  })
})
