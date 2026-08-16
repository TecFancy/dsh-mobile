/**
 * Client half of dsh-mobile — the mobile adapter for the DSH web shell.
 *
 * Responsibilities:
 *   1. Injects the global shell stylesheet (<style data-dsh-mobile="shell">),
 *      removed on fiber disposal.
 *   2. Tracks the narrow-viewport state onto `body[data-dsh-mobile]`.
 *   3. Mirrors the AppFrame grid state (inline grid-template-columns) onto
 *      `body[data-dsh-drawer]` / `body[data-dsh-details]` so the stylesheet
 *      can render the overlay drawer/scrim (D1/D5).
 *   4. Closes the drawer on outside clicks through the `layout` service
 *      (tap-outside, decision D5). If the service is missing the plugin
 *      degrades to pure CSS mode (decision D12).
 */
import type { Context } from '@deepseek-ai/cordis'
// Pulls in the module augmentation that types ctx.layout (ILayout) — the
// layout service face provided by @deepseek-ai/dsh-client-ui-layout.
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import { subscribeNarrow } from './breakpoints.ts'
import { observeFrameState, whenFrame, FRAME_SELECTOR } from './drawer-state.ts'
import { SHELL_CSS } from './shell.css.ts'

export const name = 'dsh-mobile'

/**
 * Hard dependency on the shell layout face (provided by
 * @deepseek-ai/dsh-client-ui-layout): toggleSidebar/openDetails/closeDetails.
 */
export const inject = ['layout'] as const

export function apply(ctx: Context): void {
  console.log('[dsh-mobile] client loaded')

  // Stylesheet injection: owned by the fiber, removed on stop/update.
  ctx.effect(() => {
    const style = document.createElement('style')
    style.setAttribute('data-dsh-mobile', 'shell')
    style.textContent = SHELL_CSS
    document.head.appendChild(style)
    return () => {
      style.remove()
    }
  }, 'dsh-mobile: shell stylesheet')

  // Narrow-viewport state → body[data-dsh-mobile]. Disposer unsubscribes.
  ctx.effect(() => {
    return subscribeNarrow((narrow) => {
      document.body.toggleAttribute('data-dsh-mobile', narrow)
    })
  }, 'dsh-mobile: narrow viewport state')

  // AppFrame grid state → body[data-dsh-drawer] / body[data-dsh-details].
  ctx.effect(() => {
    return whenFrame((frame) => {
      return observeFrameState(frame, (state) => {
        document.body.toggleAttribute('data-dsh-drawer', state.drawerOpen)
        document.body.toggleAttribute('data-dsh-details', state.detailsOpen)
      })
    })
  }, 'dsh-mobile: frame state bridge')

  // Tap-outside close for the overlay drawer (D5). Capture phase so the
  // click is seen before any target handler; anything outside the drawer's
  // sidebar column closes it. The scrim (frame ::after) and the center
  // content both report targets outside the drawer, so both close it.
  ctx.effect(() => {
    const onClick = (event: MouseEvent): void => {
      // Desktop (and tablet) must behave exactly like the stock shell: no
      // tap-outside close. Only the narrow tier gets the overlay behavior.
      if (!document.body.hasAttribute('data-dsh-mobile')) return
      if (!document.body.hasAttribute('data-dsh-drawer')) return
      const frame = document.querySelector<HTMLElement>(FRAME_SELECTOR)
      const sidebar = frame?.firstElementChild
      if (sidebar === null || sidebar === undefined) return
      if (sidebar.contains(event.target as Node)) return
      if (typeof ctx.layout.toggleSidebar === 'function') {
        ctx.layout.toggleSidebar()
      }
    }
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
    }
  }, 'dsh-mobile: tap outside closes drawer')
}
