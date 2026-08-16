/**
 * AppFrame grid-state observation (M1, decisions D2/D6 in docs/impl-m1.md).
 *
 * The shell's three-column layout state lives ONLY in the frame's inline
 * `grid-template-columns` (verified: `56px minmax(0px, 1fr) 0px` rail,
 * `280px minmax(0px, 1fr) 0px` drawer open, third track > 0 when the details
 * panel is open). This module parses that inline value into a small state
 * object and observes changes via MutationObserver, so the client entry can
 * mirror the state onto `body[data-dsh-drawer]` / `body[data-dsh-details]`
 * attributes that the stylesheet keys off.
 *
 * The parse is a pure function so the state mapping is unit-testable without
 * a DOM.
 */

/** Rail width (collapsed sidebar) in the current shell; widths above are "drawer open". */
export const RAIL_WIDTH = 56

export interface FrameGridState {
  /** Sidebar in collapsed rail mode (first track ≤ RAIL_WIDTH). */
  rail: boolean
  /** Sidebar drawer expanded (first track above RAIL_WIDTH). */
  drawerOpen: boolean
  /** Details panel track open (third track > 0). */
  detailsOpen: boolean
}

const TRACKS = /^(\d+(?:\.\d+)?)px\s+minmax\(0px,\s*1fr\)\s+(\d+(?:\.\d+)?)px$/

/**
 * Parse an inline `grid-template-columns` value into frame state.
 * Malformed/unknown values fall back to the safe collapsed state (rail,
 * nothing open) so a future shell change degrades to today's desktop
 * behavior instead of an overlay surprise.
 */
export function parseGridState(styleText: string): FrameGridState {
  const match = TRACKS.exec(styleText.trim())
  if (match === null) {
    return { rail: true, drawerOpen: false, detailsOpen: false }
  }
  const sidebar = Number.parseFloat(match[1])
  const details = Number.parseFloat(match[2])
  return {
    rail: sidebar <= RAIL_WIDTH,
    drawerOpen: sidebar > RAIL_WIDTH,
    detailsOpen: details > 4, // tolerance for rounding
  }
}

/**
 * Observe a frame element's inline grid state. Calls `callback` immediately
 * with the current state, then on every style-attribute mutation. Returns a
 * disposer that stops the observer (plugin fiber owns it via ctx.effect).
 */
export function observeFrameState(
  frame: HTMLElement,
  callback: (state: FrameGridState) => void,
): () => void {
  const read = (): void => {
    callback(parseGridState(frame.style.gridTemplateColumns))
  }
  read()
  const observer = new MutationObserver(read)
  observer.observe(frame, { attributes: true, attributeFilter: ['style'] })
  return () => {
    observer.disconnect()
  }
}

/** AppFrame selector (verified against DSH 0.1.0-rc.6, see docs/impl-m1.md §1). */
export const FRAME_SELECTOR = '#root > [data-slot="root"] > div'

/**
 * Run `callback` with the AppFrame element once it exists, or as soon as it
 * appears. The client plugin applies early — the shell frame mounts later —
 * so a child-list observer waits for it. The callback may return a disposer
 * that is released when the returned outer disposer runs.
 */
export function whenFrame(callback: (frame: HTMLElement) => (() => void) | void): () => void {
  const existing = document.querySelector<HTMLElement>(FRAME_SELECTOR)
  if (existing !== null) {
    return callback(existing) ?? (() => {})
  }
  let inner: (() => void) | undefined
  const observer = new MutationObserver(() => {
    const frame = document.querySelector<HTMLElement>(FRAME_SELECTOR)
    if (frame === null) return
    observer.disconnect()
    inner = callback(frame) ?? undefined
  })
  observer.observe(document.documentElement, { childList: true, subtree: true })
  return () => {
    observer.disconnect()
    inner?.()
  }
}
