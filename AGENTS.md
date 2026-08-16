# Agent Instructions

Repo-specific rules for any agent (Codex, Claude Code, DeepSeek Harness, ...)
working _on_ this repo.

## What this repo is

`@tecfancy/dsh-mobile` — a client-plane Cordis plugin for the DSH web shell that
retrofits a mobile tier (< 768px): overlay sidebar/details drawers with a
scrim, a non-overlapping composer row, and a re-flowed settings dialog.
Desktop (≥ 1024px) must never change.

- **Plan**: `docs/dsh-mobile-plan.md` — background, measured defects D1–D5,
  architecture, milestones M0–M4, risks. Read it before touching `src/`.
- **M1 executable spec**: `docs/impl-m1.md` — frozen decisions D1–D12,
  verified selector/environment facts, file blueprints, test matrix, DoD.
  It is the sole authority for M1; where plan and spec conflict, the spec
  wins. Cite only harness internals that appear in its §1 — never explore
  further.
- **Engineering conventions**: `docs/development.md` (commands, branch
  model, selector-map rule, verify gate). Authoritative; update it there,
  not here.

## Hard rules

- **PRs and commit messages are written in English** (title and body).
- Every CSS rule must hang under `body[data-dsh-mobile]`; the desktop path
  is untouchable.
- Hashed CSS-module class selectors require a `src/client/selector-map.ts`
  entry (DSH version, purpose, fallback) first.
- Every global side effect belongs to the plugin fiber: register through
  `ctx.effect` and return a complete disposer.
- Never commit unless the user asks; never push unless the user asks.
  `npm run verify` must pass first. `lib/` ships with its `src/` change.

## Reference repos (read before mirroring conventions)

- `dsh-auth-gate` — engineering rigor model (AGENTS.md, docs plan/spec/handoff
  discipline, verify gate, release flow).
- `dsh-deeptutor` — bundle mounting pattern (`cordis.yml` dev overlay,
  `cordis.patch.yml` bundle patch, `dsh.bundle.patch` metadata).
- `dsh-better-sidebar` (installed in the local profile) — shell-level client
  plugin precedent: `[data-slot]` anchors, `body[data-*]` state hooks, 768px
  breakpoint alignment.
