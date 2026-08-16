/**
 * Host half of dsh-mobile — deliberately thin.
 *
 * The whole adapter is client-plane (browser CSS + DOM state). The host
 * half exists so the bundle row resolves on the host side the same way
 * every other shell-level bundle does (main entry + dsh.client metadata);
 * it registers no services and no tools.
 *
 * Whether the client entry of an npm bundle needs any host-side serving
 * hook is verified in the M0 mount spike (docs/impl-m1.md §1); if the
 * loader requires one, it lands here.
 */
import type { Context } from '@deepseek-ai/cordis'

export const name = 'dsh-mobile'
export const inject = [] as const

export function apply(_ctx: Context): void {
  console.log('[dsh-mobile] host half loaded (no-op)')
}
