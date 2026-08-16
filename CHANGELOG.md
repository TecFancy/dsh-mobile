# Changelog

All notable changes to `@tecfancy/dsh-mobile` are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions are published to npm via the `publish` workflow (PR merge to `main`).

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
