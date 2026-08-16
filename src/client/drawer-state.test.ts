import { describe, expect, it, vi } from 'vitest'
import {
  parseGridState,
  whenFrame,
  observeFrameState,
  FRAME_SELECTOR,
  RAIL_WIDTH,
} from './drawer-state.ts'

describe('parseGridState', () => {
  it('recognizes the collapsed rail state', () => {
    const state = parseGridState('56px minmax(0px, 1fr) 0px')
    expect(state).toEqual({ rail: true, drawerOpen: false, detailsOpen: false })
  })

  it('recognizes the expanded drawer', () => {
    const state = parseGridState('280px minmax(0px, 1fr) 0px')
    expect(state).toEqual({ rail: false, drawerOpen: true, detailsOpen: false })
  })

  it('recognizes the open details panel', () => {
    const state = parseGridState('56px minmax(0px, 1fr) 360px')
    expect(state).toEqual({ rail: true, drawerOpen: false, detailsOpen: true })
  })

  it('recognizes drawer and details open together', () => {
    const state = parseGridState('280px minmax(0px, 1fr) 360px')
    expect(state).toEqual({ rail: false, drawerOpen: true, detailsOpen: true })
  })

  it('falls back to the safe collapsed state on malformed input', () => {
    const safe = { rail: true, drawerOpen: false, detailsOpen: false }
    expect(parseGridState('')).toEqual(safe)
    expect(parseGridState('280px 1fr 0px')).toEqual(safe)
    expect(parseGridState('grid-template-columns: 56px minmax(0px, 1fr) 0px')).toEqual(safe)
    expect(parseGridState('minmax(0px, 1fr)')).toEqual(safe)
  })

  it('treats a zero-width sidebar as rail (not drawer)', () => {
    const state = parseGridState('0px minmax(0px, 1fr) 0px')
    expect(state.rail).toBe(true)
    expect(state.drawerOpen).toBe(false)
  })

  it('keeps the rail constant aligned with the shell', () => {
    expect(RAIL_WIDTH).toBe(56)
  })
})

describe('observeFrameState', () => {
  it('fires immediately with the current state, then on style mutations', async () => {
    const frame = document.createElement('div')
    frame.style.gridTemplateColumns = '56px minmax(0px, 1fr) 0px'
    const seen: string[] = []
    const off = observeFrameState(frame, (state) => {
      seen.push(state.drawerOpen ? 'open' : 'rail')
    })
    frame.style.gridTemplateColumns = '280px minmax(0px, 1fr) 0px'
    // MutationObserver callbacks are delivered asynchronously (microtask).
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(seen).toEqual(['rail', 'open'])

    off()
    frame.style.gridTemplateColumns = '56px minmax(0px, 1fr) 360px'
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(seen).toEqual(['rail', 'open']) // no notification after dispose
  })
})

describe('whenFrame', () => {
  it('calls back immediately when the frame already exists', () => {
    const root = document.createElement('div')
    root.setAttribute('data-slot', 'root')
    const frame = document.createElement('div')
    root.appendChild(frame)
    const host = document.createElement('div')
    host.id = 'root'
    host.appendChild(root)
    document.body.appendChild(host)

    const callback = vi.fn(() => () => {})
    const off = whenFrame(callback)
    expect(callback).toHaveBeenCalledWith(frame)
    off()
    host.remove()
  })

  it('waits for the frame to appear and cleans up', () => {
    const callback = vi.fn(() => () => {})
    const off = whenFrame(callback)
    expect(callback).not.toHaveBeenCalled()

    const root = document.createElement('div')
    root.setAttribute('data-slot', 'root')
    root.appendChild(document.createElement('div'))
    const host = document.createElement('div')
    host.id = 'root'
    host.appendChild(root)
    document.body.appendChild(host)

    // MutationObserver in jsdom fires asynchronously (microtask queue).
    return Promise.resolve().then(() => {
      expect(callback).toHaveBeenCalledTimes(1)
      expect(FRAME_SELECTOR).toBe('#root > [data-slot="root"] > div')
      off()
      host.remove()
    })
  })
})
