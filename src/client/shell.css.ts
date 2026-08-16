/**
 * Global shell stylesheet injected by the client half into <head> as a
 * `<style data-dsh-mobile="shell">` node, removed on fiber disposal.
 *
 * Every rule is scoped under `body[data-dsh-mobile]` (the narrow-viewport
 * marker set by the client entry) and/or an explicit `@media` guard, so the
 * desktop rendering path is never touched.
 *
 * Selector policy (see docs/dsh-mobile-plan.md §4 and docs/impl-m1.md §2):
 *   1. `[data-slot="…"]` semantic anchors first — stable across DSH builds.
 *   2. Structural paths from #root for the AppFrame grid — verified against
 *      DSH 0.1.0-rc.6 (see the verified selector map in impl-m1.md).
 *   3. Hashed CSS-module classes only where no anchor exists, and only when
 *      registered in impl-m1.md's selector map with a version pin.
 *
 * This file currently carries ONLY the infrastructure rules. The per-defect
 * rule blocks (D1 drawer overlay, D2 composer row, D3 settings dialog,
 * D4 details panel) are specified in docs/impl-m1.md and land here during
 * M1 execution.
 */
export const SHELL_CSS = /* css */ `
/* ---------- dsh-mobile infrastructure ---------- */

/* Reduced motion: the shell animates column widths; the overlay mode below
   767px must not replay that squeeze animation. Honor the OS preference. */
@media (prefers-reduced-motion: reduce) {
  body[data-dsh-mobile],
  body[data-dsh-mobile] *,
  body[data-dsh-mobile] *::before,
  body[data-dsh-mobile] *::after {
    transition: none !important;
    animation: none !important;
  }
}

/* Mobile-tier rules below are added per milestone:
   D1 drawer overlay + scrim (M1) — anchors: #root > [data-slot="root"] > div
   D2 composer row wrap (M1)    — anchors: [data-slot="conversation.composer.bar"]
   D3 settings dialog re-flow (M2) — anchors: [role="dialog"]
   D4 details panel overlay (M2)   — anchors: frame > div:nth-child(3)
   See docs/impl-m1.md for the exact frozen selectors and verification steps. */

/* ---------- D1 + D5: drawer overlay + scrim (M1, decisions D3/D4) ----------
   The shell drives the three-column grid through inline grid-template-columns;
   on narrow viewports the expanded 280px drawer track would squeeze the
   center column to ~105px. Under body[data-dsh-mobile] the track is forced
   back to the rail+content+0 shape (!important beats the inline style), the
   sidebar column becomes a fixed overlay drawer (leaving the rail's own 56px
   visible through it is not needed — the drawer itself carries the collapse
   button), and a frame ::after pseudo-element renders the full-screen scrim.
   Tap-outside close is handled in JS (index.ts) via the layout service. */
@media (max-width: 767px) {
  body[data-dsh-mobile] #root > [data-slot="root"] > div {
    grid-template-columns: 56px minmax(0, 1fr) 0px !important;
    transition: none !important;
  }

  /* Explicit track placement: once the sidebar becomes position:fixed it
     leaves grid auto-placement, which would shift center/details left into
     tracks 1/2. Pinning every column to its own track keeps the center at
     track 2 regardless of the sidebar's flow participation. */
  body[data-dsh-mobile] #root > [data-slot="root"] > div > div:nth-child(1) {
    grid-column: 1;
  }
  body[data-dsh-mobile] #root > [data-slot="root"] > div > div:nth-child(2) {
    grid-column: 2;
  }
  body[data-dsh-mobile] #root > [data-slot="root"] > div > div:nth-child(3) {
    grid-column: 3;
  }

  /* Drawer open: sidebar column floats over the content. */
  body[data-dsh-mobile][data-dsh-drawer] #root > [data-slot="root"] > div > div:nth-child(1) {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: min(280px, 85vw);
    z-index: 40;
    box-shadow: var(--dsw-shadow-lv3);
  }

  /* Scrim: full-viewport mask between content (z < 30) and drawer (40),
     below the settings dialog overlay (z-index 1000). */
  body[data-dsh-mobile][data-dsh-drawer] #root > [data-slot="root"] > div::after {
    content: "";
    position: fixed;
    inset: 0;
    z-index: 30;
    background: var(--dsw-alias-bg-mask-1);
    backdrop-filter: var(--dsw-mask-blur);
  }
}

/* ---------- D2: composer bottom row must never overlap (M2) ----------
   The row is flex without wrap; the tools group (.uV2eYG_tools) has no
   min-width and shrinks to ~13px while the trailing group (flex:none) keeps
   its width, so the mode buttons spill under the model selector. Registered
   hashed classes: selector-map.ts.
   Layout contract on phones (≤767px): 命令 / access / model selector all on
   ONE row; the model selector (._7KE1Ra_trigger) yields width and its label
   truncates with an ellipsis instead of wrapping. */
@media (max-width: 767px) {
  body[data-dsh-mobile] [data-slot="conversation.composer.bar"] .uV2eYG_row {
    flex-wrap: nowrap;
    gap: 8px;
  }
  body[data-dsh-mobile] [data-slot="conversation.composer.bar"] .uV2eYG_tools {
    flex: none;
    min-width: 0;
    gap: 8px;
  }
  body[data-dsh-mobile] [data-slot="conversation.composer.bar"] .uV2eYG_trailing {
    flex: 0 1 auto;
    min-width: 0;
    justify-content: flex-end;
    gap: 8px;
  }
  body[data-dsh-mobile] [data-slot="conversation.composer.bar"] .uV2eYG_primary {
    flex: none;
  }
  /* Model selector: fixed layout with a viewport-derived cap so 命令/access/
     model stay on one row; the label ellipsizes when the cap bites.
     Formula verified at 360/390/430 (row ≈ vw-98px, tools 80 + gaps 24 +
     send 34 → trigger budget = vw-236px; 258 keeps 8-22px slack). */
  body[data-dsh-mobile] [data-slot="conversation.composer.bar"] ._7KE1Ra_trigger {
    flex: none;
    min-width: 0;
    max-width: calc(100vw - 258px);
  }
  body[data-dsh-mobile] [data-slot="conversation.composer.bar"] ._7KE1Ra_trigger ._7KE1Ra_triggerLabel {
    flex: 0 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  body[data-dsh-mobile] [data-slot="conversation.composer.bar"] ._7KE1Ra_trigger ._7KE1Ra_triggerEffort {
    flex: none;
    white-space: nowrap;
  }
}

/* ---------- D6: composer touch targets on phones (0.1.7) ----------
   The toolbar icon buttons are 28-34px — below the 44px touch guideline.
   Expand the hit area with an invisible ::after overlay so the visual
   layout (and the one-row contract) stays untouched: 28px buttons gain
   8px on every side (44), 34px send gains 5px (44), the 28px-tall
   triggers gain 8px top/bottom (44 tall; access trigger is already 44
   wide). Registered hashed classes: selector-map.ts. */
@media (max-width: 767px) {
  body[data-dsh-mobile] [data-slot="conversation.composer.bar"] .uV2eYG_add,
  body[data-dsh-mobile] [data-slot="conversation.composer.bar"] .uV2eYG_primary,
  body[data-dsh-mobile] [data-slot="conversation.composer.bar"] .Sh0Q9G_trigger,
  body[data-dsh-mobile] [data-slot="conversation.composer.bar"] ._7KE1Ra_trigger {
    position: relative;
  }
  body[data-dsh-mobile] [data-slot="conversation.composer.bar"] .uV2eYG_add::after,
  body[data-dsh-mobile] [data-slot="conversation.composer.bar"] .uV2eYG_primary::after,
  body[data-dsh-mobile] [data-slot="conversation.composer.bar"] .Sh0Q9G_trigger::after,
  body[data-dsh-mobile] [data-slot="conversation.composer.bar"] ._7KE1Ra_trigger::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: -8px;
    bottom: -8px;
  }
  /* square icon buttons also widen: 28+16 = 44; send 34+10 = 44 */
  body[data-dsh-mobile] [data-slot="conversation.composer.bar"] .uV2eYG_add::after,
  body[data-dsh-mobile] [data-slot="conversation.composer.bar"] .uV2eYG_primary::after {
    left: -8px;
    right: -8px;
  }
}

/* ---------- D3: settings dialog re-flow (M2) ----------
   The dialog is a fixed 800px flex row (nav 188px + content); on phones the
   content column is squeezed to ~157px and selectors overflow the panel
   edge. Stack the panel vertically and turn the nav into a horizontal,
   scrollable tab bar. All selectors are structural from [role="dialog"]
   (verified: panel itself carries the role; children are nav + content). */
@media (max-width: 767px) {
  body[data-dsh-mobile] [role="dialog"] {
    flex-direction: column;
    /* 100vh on phones includes the browser chrome; dvh tracks the visible
       viewport so the dialog never extends past the screen */
    height: min(800px, 100dvh - 48px);
  }
  body[data-dsh-mobile] [role="dialog"] > nav {
    flex-direction: row;
    flex: none;
    width: 100%;
    gap: 4px;
    padding: 12px 12px 0;
    overflow-x: auto;
  }
  body[data-dsh-mobile] [role="dialog"] > nav > div:first-child {
    display: none; /* nav title consumes width on phones */
  }
  body[data-dsh-mobile] [role="dialog"] > nav > div:nth-child(2) {
    flex-direction: row;
    gap: 4px;
  }
  body[data-dsh-mobile] [role="dialog"] > nav button {
    height: 36px;
    padding: 6px 12px;
    flex: none;
    white-space: nowrap;
  }
  body[data-dsh-mobile] [role="dialog"] > div:last-child {
    width: 100%;
    min-width: 0;
    min-height: 0; /* the shell only sets min-width:0; in the stacked
                      column layout min-height:auto would let the content
                      grow past the dialog and break the inner scroll */
    flex: 1 1 auto;
  }
  body[data-dsh-mobile] [role="dialog"] > div:last-child > div {
    padding-left: 14px;
    padding-right: 14px;
  }
}

/* ---------- D4: details panel overlay (M2) ----------
   Same mechanism as D1 on the third grid column: track forced to 0 by the
   frame override; the column floats fixed on the right when
   body[data-dsh-details] is set by the state bridge. */
@media (max-width: 767px) {
  body[data-dsh-mobile][data-dsh-details] #root > [data-slot="root"] > div > div:nth-child(3) {
    position: fixed;
    right: 0;
    top: 0;
    bottom: 0;
    width: min(360px, 90vw);
    z-index: 40;
    box-shadow: var(--dsw-shadow-lv3);
  }
}
`
