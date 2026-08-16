/**
 * Selector map — the single registry for hashed CSS-module class selectors
 * used by this plugin (decision D11 in docs/impl-m1.md).
 *
 * Policy: prefer `[data-slot="…"]` anchors and `#root` structural paths.
 * A hashed class may only be used when no anchor suffices, and every use
 * MUST be registered here with the DSH version it was verified against, the
 * reason no anchor worked, and a fallback. A CI probe (M3) checks the
 * registered selectors still match the live DOM of the pinned DSH version.
 *
 * M1 (drawer overlay) uses zero hashed classes — everything anchors on
 * `[data-slot]` + structural paths. Entries are added as M2 lands
 * (composer row, settings dialog internals).
 */
export interface SelectorEntry {
  /** The hashed class selector, e.g. '.uV2eYG_row'. */
  selector: string
  /** DSH version the selector was verified against. */
  dshVersion: string
  /** Milestone/feature that uses it. */
  usedBy: string
  /** Why no [data-slot]/structural anchor sufficed. */
  reason: string
  /** Fallback behavior if the class drifts in a future DSH build. */
  fallback: string
}

export const SELECTOR_MAP: SelectorEntry[] = [
  {
    selector: '.uV2eYG_row',
    dshVersion: '0.1.0-rc.6',
    usedBy: 'D2 composer row (shell.css.ts)',
    reason:
      'The composer bottom row has no [data-slot] anchor below conversation.composer.bar; the row itself is a CSS-module class.',
    fallback:
      'If the class drifts, re-anchor on [data-slot="conversation.composer.bar"] structural descendants (row = 4th flex child) or drop the rules and re-verify.',
  },
  {
    selector: '.uV2eYG_tools',
    dshVersion: '0.1.0-rc.6',
    usedBy: 'D2 composer row (shell.css.ts)',
    reason:
      'Same as .uV2eYG_row: the shrinkable tools group needs a flex override; no semantic anchor below the bar slot.',
    fallback:
      'Re-anchor structurally (first child of the row) or re-verify with a fresh probe; keep min-width:0 + wrap behavior as the invariant.',
  },
  {
    selector: '.uV2eYG_trailing',
    dshVersion: '0.1.0-rc.6',
    usedBy: 'D2 composer row (shell.css.ts)',
    reason:
      'The flex:none trailing group (model selector + send) must yield width on phones; no semantic anchor below the bar slot.',
    fallback:
      'Re-anchor structurally (last child of the row); the invariant is: trailing never overlaps tools at ≤767px.',
  },
]
