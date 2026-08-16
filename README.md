# dsh-mobile

**A mobile adapter for the DeepSeek Harness (DSH) web shell.** The stock
shell is desktop-first: below 1024px the sidebar only collapses to a rail, and
on phones the expanded drawer squeezes the main column to ~110px, composer
buttons overlap, and the settings dialog shrinks to a sliver. `dsh-mobile`
adds the missing phone tier (< 768px) as a client plugin — no shell fork, no
desktop changes.

[![npm version](https://img.shields.io/npm/v/@tecfancy/dsh-mobile)](https://www.npmjs.com/package/@tecfancy/dsh-mobile)
[![License](https://img.shields.io/npm/l/@tecfancy/dsh-mobile)](LICENSE)

## Features

- **Overlay sidebar drawer** — opening the sidebar on a phone floats it over
  the content with a scrim instead of squeezing the main column to 110px;
  tapping outside closes it.
- **Overlay details panel** — the tool-details panel opens as a right-side
  overlay and never squeezes the conversation.
- **Non-overlapping composer** — the mode buttons and the model selector wrap
  onto separate rows instead of covering each other.
- **Re-flowed settings dialog** — the dialog stacks vertically with a
  horizontally scrollable tab bar; the content column gets full width.
- **Zero desktop regression** — every rule hangs under a narrow-viewport
  marker; viewports ≥ 1024px behave exactly like the stock shell.

## Screenshots

Verified on Ubuntu 24.04 (x86_64) with DSH `0.1.0-rc.6`, iPhone-15 viewport
(390×844).

**New-session screen on a phone** (hero + composer laid out for the narrow
viewport):

![new session](assets/screenshots/after-new-session.png)

**Sidebar drawer: before (stock shell) vs after**

| Before — content squeezed to 110px              | After — overlay drawer + scrim                |
| ----------------------------------------------- | --------------------------------------------- |
| ![before](assets/screenshots/before-drawer.png) | ![after](assets/screenshots/after-drawer.png) |

**Settings dialog on a phone** (vertical layout, full-width content):

![settings](assets/screenshots/after-settings.png)

**Desktop ≥ 1024px — untouched**:

![desktop](assets/screenshots/after-desktop.png)

## Install

Requires Node ≥ 22 and a DSH installation (`dsh` CLI). Install into your
profile and restart `dsh web`:

```bash
dsh plugin --profile web add @tecfancy/dsh-mobile
# restart: dsh web
```

> Note: if your npm registry is a mirror (e.g. `registry.npmmirror.com`),
> brand-new packages can lag behind the official registry for a while —
> add `--registry=https://registry.npmjs.org/` if the install reports 404.

The plugin activates automatically on narrow viewports (< 768px) and stays
inert on desktop. Removing it is one command: `dsh plugin --profile web remove
@tecfancy/dsh-mobile`.

## How it works

- A JS breakpoint layer marks narrow viewports as `body[data-dsh-mobile]`.
- A state bridge mirrors the shell's layout state onto `body[data-dsh-drawer]`
  / `body[data-dsh-details]`.
- A stylesheet (anchored on the shell's stable `[data-slot]` hooks) turns the
  sidebar/details columns into fixed overlays on phones, re-flows the
  composer and the settings dialog, and never runs outside the mobile tier.

No shell source is modified, no server component is required, and the plugin
coexists with other shell-level plugins (verified with `dsh-better-sidebar`).

## Compatibility

- DSH `0.1.0-rc.6` (tested on macOS and Ubuntu 24.04; full viewport matrix:
  360 / 390 / 430 / 768 / 1440).
- The 768–1023px tablet range keeps the stock shell behavior (by design).
- `prefers-reduced-motion` is honored.

## License

MIT
