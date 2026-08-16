window.__ModuleLoader__.load({
  id: "@tecfancy/dsh-mobile",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
/** Whether a viewport width is narrow (mobile). */
function isNarrowWidth(width) {
	return width < 768;
}
/**
* Subscribe to narrow-viewport changes. Calls `callback` once immediately
* with the current width, then on every window resize. Returns a disposer
* that removes the listener (plugin fiber owns it via ctx.effect).
*/
function subscribeNarrow(callback) {
	if (typeof window === "undefined") return () => {};
	const onResize = () => {
		callback(isNarrowWidth(window.innerWidth));
	};
	onResize();
	window.addEventListener("resize", onResize);
	return () => {
		window.removeEventListener("resize", onResize);
	};
}
const TRACKS = /^(\d+(?:\.\d+)?)px\s+minmax\(0px,\s*1fr\)\s+(\d+(?:\.\d+)?)px$/;
/**
* Parse an inline `grid-template-columns` value into frame state.
* Malformed/unknown values fall back to the safe collapsed state (rail,
* nothing open) so a future shell change degrades to today's desktop
* behavior instead of an overlay surprise.
*/
function parseGridState(styleText) {
	const match = TRACKS.exec(styleText.trim());
	if (match === null) return {
		rail: true,
		drawerOpen: false,
		detailsOpen: false
	};
	const sidebar = Number.parseFloat(match[1]);
	const details = Number.parseFloat(match[2]);
	return {
		rail: sidebar <= 56,
		drawerOpen: sidebar > 56,
		detailsOpen: details > 4
	};
}
/**
* Observe a frame element's inline grid state. Calls `callback` immediately
* with the current state, then on every style-attribute mutation. Returns a
* disposer that stops the observer (plugin fiber owns it via ctx.effect).
*/
function observeFrameState(frame, callback) {
	const read = () => {
		callback(parseGridState(frame.style.gridTemplateColumns));
	};
	read();
	const observer = new MutationObserver(read);
	observer.observe(frame, {
		attributes: true,
		attributeFilter: ["style"]
	});
	return () => {
		observer.disconnect();
	};
}
/** AppFrame selector (verified against DSH 0.1.0-rc.6, see docs/impl-m1.md §1). */
const FRAME_SELECTOR = "#root > [data-slot=\"root\"] > div";
/**
* Run `callback` with the AppFrame element once it exists, or as soon as it
* appears. The client plugin applies early — the shell frame mounts later —
* so a child-list observer waits for it. The callback may return a disposer
* that is released when the returned outer disposer runs.
*/
function whenFrame(callback) {
	const existing = document.querySelector(FRAME_SELECTOR);
	if (existing !== null) return callback(existing) ?? (() => {});
	let inner;
	const observer = new MutationObserver(() => {
		const frame = document.querySelector(FRAME_SELECTOR);
		if (frame === null) return;
		observer.disconnect();
		inner = callback(frame) ?? void 0;
	});
	observer.observe(document.documentElement, {
		childList: true,
		subtree: true
	});
	return () => {
		observer.disconnect();
		inner?.();
	};
}
//#endregion
//#region src/client/shell.css.ts
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
const SHELL_CSS = `
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
`;
//#endregion
//#region src/client/index.ts
const name = "dsh-mobile";
/**
* Hard dependency on the shell layout face (provided by
* @deepseek-ai/dsh-client-ui-layout): toggleSidebar/openDetails/closeDetails.
*/
const inject = ["layout"];
function apply(ctx) {
	console.log("[dsh-mobile] client loaded");
	ctx.effect(() => {
		const style = document.createElement("style");
		style.setAttribute("data-dsh-mobile", "shell");
		style.textContent = SHELL_CSS;
		document.head.appendChild(style);
		return () => {
			style.remove();
		};
	}, "dsh-mobile: shell stylesheet");
	ctx.effect(() => {
		return subscribeNarrow((narrow) => {
			document.body.toggleAttribute("data-dsh-mobile", narrow);
		});
	}, "dsh-mobile: narrow viewport state");
	ctx.effect(() => {
		return whenFrame((frame) => {
			return observeFrameState(frame, (state) => {
				document.body.toggleAttribute("data-dsh-drawer", state.drawerOpen);
				document.body.toggleAttribute("data-dsh-details", state.detailsOpen);
			});
		});
	}, "dsh-mobile: frame state bridge");
	ctx.effect(() => {
		const onClick = (event) => {
			if (!document.body.hasAttribute("data-dsh-mobile")) return;
			if (!document.body.hasAttribute("data-dsh-drawer")) return;
			const sidebar = document.querySelector(FRAME_SELECTOR)?.firstElementChild;
			if (sidebar === null || sidebar === void 0) return;
			if (sidebar.contains(event.target)) return;
			if (typeof ctx.layout.toggleSidebar === "function") ctx.layout.toggleSidebar();
		};
		document.addEventListener("click", onClick, true);
		return () => {
			document.removeEventListener("click", onClick, true);
		};
	}, "dsh-mobile: tap outside closes drawer");
}
//#endregion
exports.apply = apply;
exports.inject = inject;
exports.name = name;


    return module.exports;
  }
});