import { describe, expect, it } from 'vitest'
import { isNarrowWidth, NARROW_MAX_WIDTH, subscribeNarrow, viewportWidth } from './breakpoints.ts'

describe('breakpoints', () => {
  it('treats widths strictly below 768 as narrow', () => {
    expect(NARROW_MAX_WIDTH).toBe(768)
    expect(isNarrowWidth(0)).toBe(true)
    expect(isNarrowWidth(359)).toBe(true)
    expect(isNarrowWidth(767)).toBe(true)
    expect(isNarrowWidth(768)).toBe(false)
    expect(isNarrowWidth(1024)).toBe(false)
    expect(isNarrowWidth(1440)).toBe(false)
  })

  it('reads the viewport width', () => {
    window.innerWidth = 393
    expect(viewportWidth()).toBe(393)
  })

  it('fires immediately and on resize, and unsubscribes cleanly', () => {
    window.innerWidth = 1440
    const seen: boolean[] = []
    const off = subscribeNarrow((narrow) => seen.push(narrow))
    expect(seen).toEqual([false]) // 1440 is not narrow

    window.innerWidth = 390
    window.dispatchEvent(new Event('resize'))
    expect(seen).toEqual([false, true])

    off()
    window.innerWidth = 393
    window.dispatchEvent(new Event('resize'))
    expect(seen).toEqual([false, true]) // no further notifications
  })
})
