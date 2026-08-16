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
  {
    selector: '._7KE1Ra_trigger',
    dshVersion: '0.1.0-rc.6',
    usedBy: 'D2 model selector truncation (shell.css.ts)',
    reason:
      'The model selector button (inside .uV2eYG_trailing) has no semantic anchor; it must shrink on one-row layouts.',
    fallback:
      'Re-anchor structurally (first button of the trailing group); invariant: 命令/access/model share one row at ≤767px.',
  },
  {
    selector: '._7KE1Ra_triggerLabel',
    dshVersion: '0.1.0-rc.6',
    usedBy: 'D2 model label ellipsis (shell.css.ts)',
    reason:
      'The model name label inside the trigger needs min-width:0 + ellipsis to truncate; no semantic anchor exists.',
    fallback:
      'Re-anchor structurally (first span of the trigger); invariant: overflow shows an ellipsis, never wraps.',
  },
  {
    selector: '._7KE1Ra_triggerEffort',
    dshVersion: '0.1.0-rc.6',
    usedBy: 'D2 model effort chip (shell.css.ts)',
    reason: 'The effort chip must never shrink or wrap when the label truncates.',
    fallback:
      'Re-anchor structurally (second span of the trigger); invariant: the effort chip stays intact on one row.',
  },
  {
    selector: '.uV2eYG_add',
    dshVersion: '0.1.0-rc.6',
    usedBy: 'D6 touch targets (shell.css.ts)',
    reason:
      'The 28px commands icon button needs a wider hit area on phones; no semantic anchor exists below the bar slot.',
    fallback:
      'Re-anchor structurally (first button of the row); invariant: effective touch area >= 44px at <=767px.',
  },
  {
    selector: '.uV2eYG_primary',
    dshVersion: '0.1.0-rc.6',
    usedBy: 'D2 one-row layout + D6 touch targets (shell.css.ts)',
    reason:
      'The send button must not shrink in the one-row layout and needs a 44px hit area on phones.',
    fallback:
      'Re-anchor structurally (last button of the trailing group); invariants: flex none + >= 44px touch area.',
  },
  {
    selector: '.Sh0Q9G_trigger',
    dshVersion: '0.1.0-rc.6',
    usedBy: 'D6 touch targets (shell.css.ts)',
    reason:
      'The access-mode trigger is 44px wide but only 28px tall; the hit area needs vertical expansion on phones.',
    fallback:
      'Re-anchor structurally (second button of the row); invariant: >= 44px tall touch area at <=767px.',
  },
]
