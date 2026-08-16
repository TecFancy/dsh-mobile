/**
 * Narrow-viewport ("mobile") breakpoint for the shell adapter. Width-based,
 * shared by the JS state layer (body attribute toggling) and the CSS layer
 * (shell.css.ts). The CSS side pairs with this file via
 * `@media (max-width: 767px)` — 767px ≡ widths below NARROW_MAX_WIDTH,
 * documented at both ends.
 *
 * Deliberately aligned with dsh-better-sidebar's NARROW_MAX_WIDTH (768), so
 * the two shell-level adapters agree on what "mobile" means. It is NOT
 * aligned to the DSH app shell's own 1024px auto-collapse: 768–1023px
 * windows (small laptops, split panes) keep the desktop layout; the mobile
 * tier (drawer overlays, wrapped composer, re-flowed settings) is a phone /
 * portrait-tablet experience.
 *
 * The narrow flag is measured from `window.innerWidth` on `resize`. It
 * deliberately avoids `matchMedia`: jsdom does not implement it and the
 * resize listener is equally exact for a breakpoint that never changes
 * while the page is open (same trade-off as dsh-better-sidebar).
 */

/** Viewport widths strictly below this are "mobile" (paired CSS: max-width: 767px). */
export const NARROW_MAX_WIDTH = 768

/** Whether a viewport width is narrow (mobile). */
export function isNarrowWidth(width: number): boolean {
  return width < NARROW_MAX_WIDTH
}

/** Current viewport width; 0 outside a browser (SSR/import safety). */
export function viewportWidth(): number {
  return typeof window === 'undefined' ? 0 : window.innerWidth
}

/**
 * Subscribe to narrow-viewport changes. Calls `callback` once immediately
 * with the current width, then on every window resize. Returns a disposer
 * that removes the listener (plugin fiber owns it via ctx.effect).
 */
export function subscribeNarrow(callback: (narrow: boolean) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }
  const onResize = (): void => {
    callback(isNarrowWidth(window.innerWidth))
  }
  onResize()
  window.addEventListener('resize', onResize)
  return () => {
    window.removeEventListener('resize', onResize)
  }
}
