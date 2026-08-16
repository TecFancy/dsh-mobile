#!/usr/bin/env bash
# dsh-mobile e2e — viewport matrix + mobile walkthrough (M1: D1/D5).
#
# Usage:  bash scripts/e2e-mobile.sh [DSH_URL] [SESSION_PREFIX]
#   DSH_URL default: http://127.0.0.1:3091 (scratch instance; pass the live
#   instance URL to re-run against production).
#
# Requires `playwright-cli` on PATH. Uses one throwaway session per viewport.
# Every assertion failure exits non-zero.
set -euo pipefail

DSH_URL="${1:-http://127.0.0.1:3091}"
PREFIX="${2:-m1}"
BASE=/Users/randal/source/dsh-mobile

probe() { # $1 session, $2 js — raw result
  playwright-cli -s="$1" --raw eval "$2"
}

fail() { echo "FAIL: $*" >&2; exit 1; }

assert_mobile_geometry() { # $1 session $2 label
  local s="$1" label="$2" json
  json=$(probe "$s" "({
    mobile: document.body.hasAttribute('data-dsh-mobile'),
    frameStyle: document.querySelector('#root > [data-slot=\"root\"] > div')?.getAttribute('style'),
    vw: document.documentElement.clientWidth,
    hOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  })")
  echo "  [$label] $json"
  echo "$json" | grep -Eq '"mobile": ?true' || fail "$label: data-dsh-mobile not set"
}

for entry in "360|740" "390|844" "430|932"; do
  IFS='|' read -r w h <<<"$entry"
  s="${PREFIX}-${w}"
  echo "== viewport ${w}x${h}"
  # clear any leftover session from an aborted run (a stale page would serve
  # stale probe results otherwise)
  playwright-cli -s="$s" close >/dev/null 2>&1 || true
  playwright-cli -s="$s" open "$DSH_URL" --device="Desktop Chrome"
  playwright-cli -s="$s" resize "$w" "$h"
  sleep 2

  # dismiss any onboarding dialog
  probe "$s" "(() => { const d = document.querySelector('[role=dialog]'); if (d) { const b = [...d.querySelectorAll('button')].find(x => /继续|Continue|Configure later|Later/.test(x.innerText||'')); if (b) b.click(); } return 'ok' })()" >/dev/null

  # wait for the plugin to apply (cold-start safe): body[data-dsh-mobile]
  for i in 1 2 3 4 5 6 7 8 9 10; do
    ready=$(probe "$s" "document.body.hasAttribute('data-dsh-mobile')")
    [ "$ready" = "true" ] && break
    sleep 1
  done

  assert_mobile_geometry "$s" "initial"

  # open drawer
  probe "$s" "(() => { const b = [...document.querySelectorAll('button')].find(b => /打开侧边栏|Open sidebar/.test(b.getAttribute('aria-label')||'')); if (!b) return 'no-toggle'; b.click(); return 'opened' })()" >/dev/null
  sleep 1.5
  json=$(probe "$s" "({
    drawer: document.body.hasAttribute('data-dsh-drawer'),
    sidebar: (() => { const f = document.querySelector('#root > [data-slot=\"root\"] > div'); const r = f.firstElementChild.getBoundingClientRect(); const c = getComputedStyle(f.firstElementChild); return { w: Math.round(r.width), pos: c.position, z: c.zIndex }; })(),
    scrim: (() => { const f = document.querySelector('#root > [data-slot=\"root\"] > div'); return getComputedStyle(f, '::after').content !== 'none'; })(),
    centerW: (() => { const f = document.querySelector('#root > [data-slot=\"root\"] > div'); return Math.round(f.children[1].getBoundingClientRect().width); })(),
  })")
  echo "  [drawer-open] $json"
  echo "$json" | grep -Eq '"drawer": ?true' || fail "drawer attr"
  echo "$json" | grep -Eq '"pos": ?"fixed"' || fail "sidebar not fixed"
  echo "$json" | grep -Eq '"scrim": ?true' || fail "no scrim"
  # center column must stay near full width (>= 75% of viewport)
  cw=$(echo "$json" | sed -n 's/.*"centerW": *\([0-9]*\).*/\1/p')
  [ "${cw:-0}" -ge $((w * 75 / 100)) ] || fail "center squeezed to ${cw}px at ${w}px"

  # tap outside closes
  probe "$s" "(() => { const el = document.elementFromPoint($((w-40)), 300); el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: $((w-40)), clientY: 300 })); return 'tapped' })()" >/dev/null
  sleep 1.5
  closed=$(probe "$s" "({ drawer: document.body.hasAttribute('data-dsh-drawer') })")
  echo "  [tap-outside] $closed"
  echo "$closed" | grep -Eq '"drawer": ?false' || fail "tap-outside did not close drawer"

  # --- D2: composer row one-line + model ellipsis ---
  probe "$s" "(() => { const c = [...document.querySelectorAll('button')].find(b => /收起侧边栏|Collapse sidebar/.test(b.innerText||'')); if (c) c.click(); return 'rail' })()" >/dev/null
  sleep 1
  json=$(probe "$s" "({ oneRow: (() => { const row = document.querySelector('.uV2eYG_row'); if (!row) return true; const ts = [...row.querySelectorAll('button')].map(b => Math.round(b.getBoundingClientRect().top)); return Math.max(...ts) - Math.min(...ts) <= 8; })(), modelW: (() => { const t = document.querySelector('._7KE1Ra_trigger'); return t ? Math.round(t.getBoundingClientRect().width) : 0 })(), labelEllipsis: (() => { const l = document.querySelector('._7KE1Ra_triggerLabel'); return l ? l.scrollWidth > l.clientWidth : false })() })")
  echo "  [composer] $json"
  echo "$json" | grep -Eq '"oneRow": ?true' || fail "composer buttons not on one row"
  echo "$json" | grep -Eq '"labelEllipsis": ?true' || fail "model label not ellipsized"

  # --- M2: settings dialog re-flow (D3) ---
  probe "$s" "(() => { const collapse = [...document.querySelectorAll('button')].find(b => /收起侧边栏|Collapse sidebar/.test(b.innerText||'')); if (collapse) collapse.click(); const open = [...document.querySelectorAll('button')].find(b => /打开侧边栏|Open sidebar/.test(b.getAttribute('aria-label')||'')); if (open) open.click(); return 'drawer' })()" >/dev/null
  sleep 1.5
  probe "$s" "(() => { const b = [...document.querySelectorAll('button')].find(x => ['设置','Settings'].includes((x.innerText||'').trim())); if (b) b.click(); return 'settings' })()" >/dev/null
  sleep 1.5
  json=$(probe "$s" "({ dlgW: (() => { const d = document.querySelector('[role=dialog]'); return d ? Math.round(d.getBoundingClientRect().width) : 0 })(), navDir: (() => { const d = document.querySelector('[role=dialog]'); return d ? getComputedStyle(d.querySelector('nav')).flexDirection : '' })(), contentW: (() => { const d = document.querySelector('[role=dialog]'); return d ? Math.round(d.querySelector(':scope > div:last-child').getBoundingClientRect().width) : 0 })() })")
  echo "  [settings] $json"
  echo "$json" | grep -Eq '"navDir": ?"row"' || fail "settings nav not horizontal"
  echo "$json" | grep -Eq '"contentW": ?[0-9]{3,}' || fail "settings content too narrow"
  probe "$s" "(() => { const c = [...document.querySelectorAll('[role=dialog] button')].find(b => /关闭|Close/.test(b.getAttribute('aria-label')||'')); if (c) c.click(); return 'closed' })()" >/dev/null
  sleep 1

  # --- M2: details panel overlay (D4) ---
  probe "$s" "(() => { const f = document.querySelector('#root > [data-slot="root"] > div'); f.style.gridTemplateColumns = '56px minmax(0px, 1fr) 360px'; return 'details' })()" >/dev/null
  sleep 1
  json=$(probe "$s" "({ details: document.body.hasAttribute('data-dsh-details'), dPos: (() => { const f = document.querySelector('#root > [data-slot="root"] > div'); return getComputedStyle(f.children[2]).position })(), centerW: (() => { const f = document.querySelector('#root > [data-slot="root"] > div'); return Math.round(f.children[1].getBoundingClientRect().width) })() })")
  echo "  [details] $json"
  echo "$json" | grep -Eq '"details": ?true' || fail "details attr not set"
  echo "$json" | grep -Eq '"dPos": ?"fixed"' || fail "details not fixed"
  probe "$s" "(() => { const f = document.querySelector('#root > [data-slot="root"] > div'); f.style.gridTemplateColumns = '56px minmax(0px, 1fr) 0px'; return 'restored' })()" >/dev/null

  playwright-cli -s="$s" close >/dev/null 2>&1 || true
done

echo "== tablet boundary 768x1024 (must stay desktop)"
s="${PREFIX}-768"
playwright-cli -s="$s" open "$DSH_URL" --device="Desktop Chrome"
playwright-cli -s="$s" resize 768 1024 >/dev/null 2>&1 || true
sleep 2.5
probe "$s" "(() => { const d = document.querySelector('[role=dialog]'); if (d) { const b = [...d.querySelectorAll('button')].find(x => /继续|Continue|Configure later|Later/.test(x.innerText||'')); if (b) b.click(); } return 'ok' })()" >/dev/null
json=$(probe "$s" "({ mobile: document.body.hasAttribute('data-dsh-mobile'), frameStyle: document.querySelector('#root > [data-slot=\"root\"] > div')?.getAttribute('style') })")
echo "  $json"
echo "$json" | grep -Eq '"mobile": ?false' || fail "768px must not activate mobile tier"
playwright-cli -s="$s" close >/dev/null 2>&1 || true

echo "== desktop 1440x900 (zero regression)"
s="${PREFIX}-1440"
playwright-cli -s="$s" open "$DSH_URL" --device="Desktop Chrome"
playwright-cli -s="$s" resize 1440 900 >/dev/null 2>&1 || true
sleep 2.5
probe "$s" "(() => { const d = document.querySelector('[role=dialog]'); if (d) { const b = [...d.querySelectorAll('button')].find(x => /继续|Continue|Configure later|Later/.test(x.innerText||'')); if (b) b.click(); } return 'ok' })()" >/dev/null
json=$(probe "$s" "({ mobile: document.body.hasAttribute('data-dsh-mobile'), frameStyle: document.querySelector('#root > [data-slot=\"root\"] > div')?.getAttribute('style'), sidebarPos: getComputedStyle(document.querySelector('#root > [data-slot=\"root\"] > div').firstElementChild).position })")
echo "  $json"
echo "$json" | grep -Eq '"mobile": ?false' || fail "desktop must not activate mobile tier"
echo "$json" | grep -Eq '"sidebarPos": ?"static"' || fail "desktop sidebar must stay static"
playwright-cli -s="$s" close >/dev/null 2>&1 || true

echo "ALL E2E PASSED (M1 drawer overlay + M2 settings/details)"
