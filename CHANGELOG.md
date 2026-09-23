# Changelog

All notable changes to `@tecfancy/dsh-mobile` are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions are published to npm via the `publish` workflow (PR merge to `main`).

## [0.1.8] - 2026-09-23

### Fixed

- Frame state bridge against `dsh-client-ui-layout` 0.1.5-rc.x, which renamed
  the details column to "rightbar" and the frame attribute with it
  (`data-details-collapsed` → `data-rightbar-collapsed`). The attribute fast
  path only knew the old name, so a collapsed details panel was reported as
  open whenever the sidebar was collapsed: `body[data-dsh-details]` stayed set
  and the details overlay covered ~90% of a phone viewport (#13).
- The grid parser accepts both spellings of the middle track — `minmax(0, 1fr)`
  as written in the shell source and `minmax(0px, 1fr)` as the CSSOM serializes
  it back (#12).

### Changed

- Removed the stale `@deepseek-ai/dsh-client-runtime` peer dependency and
  client `inject` entry: the client bundle has zero runtime externals and the
  package is not part of the 0.1.2+ shell line (#12).

## [0.1.7] - 2026-08-16

### Added

- Composer touch targets on phones: toolbar buttons (commands 28px, send 34px,
  access/model triggers) gain ≥ 44px effective touch areas at ≤ 767px through
  an invisible `::after` overlay; the visual layout and the one-row contract
  stay untouched.
- Mobile focus guard: the shell auto-focuses the composer and pops the keyboard
  on phones; the guard blurs composer focus before any pointer interaction
  (mount-time autofocus, late re-focus, and desktop-to-mobile resize), then
  stands down after the first pointerdown.

## [0.1.6] - 2026-08-16

### Fixed

- Settings dialog on phones: the content column keeps `min-height: 0` in the
  stacked mobile layout so the options area scrolls internally instead of
  growing past the dialog; the dialog uses `100dvh` where the browser chrome
  would otherwise clip it.

## [0.1.5] - 2026-08-16

### Fixed

- Composer bottom row on phones: 命令 / access / model selector now share
  one row (≤767px); the model selector caps at `calc(100vw - 258px)` and
  its label truncates with an ellipsis instead of wrapping.
- e2e script probes are now bilingual (EN/CN UI) and assert the one-row +
  ellipsis composer layout.

### Changed

- Screenshots re-captured in the English UI with the API-key onboarding
  dialog suppressed at the source (provider config + env key): new-session,
  drawer before/after, settings, desktop.

## [0.1.4] - 2026-08-16

### Changed

- `README.md` (English) and `README.zh.md` (Chinese) link to each other.
- All screenshots re-captured in the English UI.

## [0.1.3] - 2026-08-16

### Changed

- New-session screenshot retaken with a workspace selected and all dialogs
  dismissed.

## [0.1.2] - 2026-08-16

### Added

- Mobile new-session screenshot in both READMEs.

## [0.1.1] - 2026-08-16

### Added

- Bilingual user-facing READMEs with Ubuntu verification screenshots
  (before/after drawer, settings, desktop).

## [0.1.0] - 2026-08-16

### Added

- Mobile tier (< 768px) for the DSH web shell as a client plugin:
  - Overlay sidebar drawer with scrim and tap-outside close (D1/D5).
  - Overlay details panel (D4).
  - Non-overlapping composer row (D2).
  - Re-flowed settings dialog (D3).
  - Zero desktop regression (all rules gated by `body[data-dsh-mobile]`).
- Unit tests (breakpoints, drawer state, selector map), Playwright viewport
  matrix e2e, and coexistence verification with `dsh-better-sidebar`.
