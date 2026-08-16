# dsh-mobile

Mobile adapter for the DSH web shell — a client-plane Cordis plugin that
retrofits a phone tier (< 768px) onto the desktop-first shell: overlay
sidebar/details drawers with a scrim, a non-overlapping composer row, and a
re-flowed settings dialog. Desktop (≥ 1024px) is untouched.

- 📋 Plan: [docs/dsh-mobile-plan.md](docs/dsh-mobile-plan.md) (简体中文,detailed)
- 📐 M1 spec: [docs/impl-m1.md](docs/impl-m1.md)
- 🔧 Conventions: [docs/development.md](docs/development.md)

## Why

The DSH shell's core layout packages (`dsh-client-ui-layout`,
`dsh-client-ui-conversation`, `dsh-client-ui-settings-general`) ship no width
media queries. Below 1024px the sidebar only auto-collapses to a rail; on
phones the expanded drawer squeezes the main column to ~105px, the composer
row's mode buttons overlap, and the settings dialog content column shrinks to
157px. This plugin adds the missing tier without forking the shell.

## Install

```bash
# publish path (into a dsh profile, alongside other bundles)
dsh plugin --profile web add ./tecfancy-dsh-mobile-0.1.0.tgz
# dev path
npm run watch
dsh web --patch ./cordis.yml
```

Add `@tecfancy/dsh-mobile` to `dsh.profile.bundles` (the `dsh plugin` command does
this automatically), then restart `dsh web`.

## How it works

- `body[data-dsh-mobile]` marks narrow viewports (JS breakpoint layer,
  `innerWidth` on resize; paired CSS `@media (max-width: 767px)`).
- A `MutationObserver` mirrors the AppFrame's inline
  `grid-template-columns` state to `body[data-dsh-drawer]` /
  `body[data-dsh-details]` so CSS can react to panel state.
- All rules anchor on `[data-slot="…"]` semantic hooks and `#root`
  structural paths; hashed class selectors are registered in
  `src/client/selector-map.ts` and version-pinned.
- Tap-outside closes the drawer through the shell's `layout` service.

## License

MIT
