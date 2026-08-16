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
   hashed classes: selector-map.ts. */
@media (max-width: 767px) {
  body[data-dsh-mobile] [data-slot="conversation.composer.bar"] .uV2eYG_row {
    flex-wrap: wrap;
    gap: 8px 12px;
  }
  body[data-dsh-mobile] [data-slot="conversation.composer.bar"] .uV2eYG_tools {
    flex: 1 1 auto;
    min-width: 0;
    flex-wrap: wrap;
    gap: 8px 12px;
  }
  body[data-dsh-mobile] [data-slot="conversation.composer.bar"] .uV2eYG_trailing {
    flex: 1 1 auto;
    min-width: 0;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px 12px;
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
