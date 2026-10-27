window.__ModuleLoader__.load({
  id: "dsh-vibrancy-skin",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    const react = require("react");
    const { jsx, jsxs } = require("react/jsx-runtime");

    const STYLE_ID = "dsh-vibrancy-skin-styles";
    const PANEL_STYLE_ID = "dsh-vibrancy-skin-panel-styles";
    const DEEP_STYLE_ID = "dsh-vibrancy-skin-deep-styles";
    const NS = "dsh-vibrancy-skin";

    /* ======================================================================
       SHEET 1/3 — the main pane (conversation). Always on when enabled.
       ====================================================================== */
    const CSS_CONTENT = `
/* ==========================================================================
   dsh-vibrancy-skin — macOS native vibrancy for DSH NEXT / DeepSeek Harness
   (verified against DSH Desktop 2.0.20-next + @deepseek-ai/dsh 0.2.1-rc.3)
   --------------------------------------------------------------------------
   HOW THE FROST IS PRODUCED
     The window is still created with
         { vibrancy: "sidebar", visualEffectState: "active",
           backgroundColor: "#00000000" }
     whenever macosMaterial = "transparent" (app.asar/lib/main.js), so a real
     NSVisualEffectView still sits behind the whole window. Nothing in this
     file blurs anything; it only removes the opaque sheets painted on top.

   WHAT CHANGED IN DSH NEXT (and why v1.3.2 went completely dark)
     1. THE GATE MOVED FROM <body> TO <html>. lib/preload-app.cjs now does
            document.documentElement.dataset.platform = process.platform
            document.documentElement.dataset.nextMaterial = "off"|"transparent"
        The old body-level data-dsh-desktop-* keys appear ZERO times in
        2.0.20-next, so every v1.3.2 selector silently stopped matching. This
        is the whole reason the skin "died" at once rather than on one panel.
     2. THE SHELL LEARNED TO BE TRANSLUCENT ITSELF. On darwin the app frame is
        already 'background: 0 0' and the sidebar column is already
        'color-mix(in srgb, var(--dsw-specific-sidebar-fill) 90%,
        transparent)'. The surfaces that are STILL opaque are the center
        column, the right column and the bottom row:
            ._1qAH1q_centerCol / ._1qAH1q_rightbarCol / ._1qAH1q_bottomRow
            { background: var(--dsw-alias-bg-base) }
     3. THE SHELL CLASS NAMES ARE GONE. .dshDesktopConversationSurface,
        .dshDesktopMacCaptionRow and .dshDesktopRightbarSurface do not exist
        any more; ui-layout ships hashed CSS-module names instead
        (._1qAH1q_centerCol). The hash prefix changes on every upstream build,
        so the anchors below match on the stable local part only
        ([class*="_centerCol"]), which is the same trick sheet 2 already used
        for dsh-better-sidebar. A renamed local part costs a missed tint, never
        a broken layout.
     4. OVERLAYS ARE HEALTHIER NOW. The rebuilt Modal resolves
        --dsw-alias-bg-layer-2 instead of --dsw-alias-bg-base, so dialogs are
        opaque without help. Rule 4 is kept only for panels that paint
        themselves with an INLINE 'background: var(--dsw-alias-bg-base)' — the
        measured case is dsh-cost-meter's 费用明细 sheet, which is a plain
        element in the normal DOM flow inside the retinted subtree.

   RULES THIS FILE MUST KEEP (learned the hard way)
     1. NEVER use backdrop-filter. Upstream documents the reason verbatim:
        "... an opaque themed layer stays readable even when Chromium cannot
        blur the transparent vibrancy window". Sampling a transparent
        vibrancy window paints a flat grey fog over the whole UI.
     2. Material only, never layout. Only 'background' and custom properties
        are touched. No grid / width / height / display / position /
        border-radius / padding / overflow. The native layout must be
        bit-for-bit identical.
     3. The tint must be cycle-free. It is built from the static, theme
        independent palette; it must NEVER reference --dsw-alias-bg-base,
        because that is the very property being overridden (a self reference
        resolves to the guaranteed-invalid value and blanks the pane).
     4. Everything is scoped to
        html[data-platform="darwin"][data-next-material="transparent"],
        so the plugin is inert on every other platform / material setting and
        falls back cleanly to the upstream look.

   TUNABLING
     One knob: --dsh-vib-tint-strength (below), also exposed in
     Settings -> 磨砂玻璃 / Vibrancy. Lower = more frost, less text contrast.
     Higher = closer to the original opaque pane. All three sheets share it,
     so one slider drives the conversation pane and the sidebar together.
   ========================================================================== */

/* --- 1. Tint -------------------------------------------------------------
   Light and dark are separate rules because the palette is expressed as
   theme-invariant static tokens; body[data-ds-dark-theme] is the only
   switch upstream uses for dark mode. */
html[data-platform="darwin"][data-next-material="transparent"] body {
  --dsh-vib-tint-strength: 40%;
  --dsh-vib-pane: color-mix(
    in srgb,
    var(--dsw-static-neutral-bluish-00, #fff) var(--dsh-vib-tint-strength),
    transparent
  );

  /* --- 1b. Snapshots of the upstream opaque layers -----------------------
     v1.3.2 captured these with 'var(--dsw-alias-bg-base)' because upstream
     declared that property on <body> and a var() captures the value where it
     is declared. That trick still works, but it is needlessly indirect now
     that ui-theme spells the values out: --dsw-alias-bg-base is exactly
     var(--dsw-static-neutral-bluish-00) in light and -950 in dark, layer-1
     is -00 / -875. Naming the static token directly is cycle-free by
     construction and survives upstream moving the alias elsewhere. */
  --dsh-vib-bg-base-solid: var(--dsw-static-neutral-bluish-00, #fff);
  --dsh-vib-bg-layer-1-solid: var(--dsw-static-neutral-bluish-00, #fff);
}

html[data-platform="darwin"][data-next-material="transparent"] body[data-ds-dark-theme] {
  --dsh-vib-pane: color-mix(
    in srgb,
    var(--dsw-static-neutral-bluish-950, #151517) var(--dsh-vib-tint-strength),
    transparent
  );
  --dsh-vib-bg-base-solid: var(--dsw-static-neutral-bluish-950, #151517);
  --dsh-vib-bg-layer-1-solid: var(--dsw-static-neutral-bluish-875, #1c1c1f);
}

/* --- 2. Center column (the conversation pane) ----------------------------
   --dsw-alias-bg-base is the one token upstream uses for EVERY opaque layer
   inside the conversation pane. Grep of the shipped client bundles shows its
   complete blast radius: ConversationRoot root, the composer fade-out seat,
   attachment cards/thumbs/editor, sticky table rows, ask-question and
   inspect cards. Re-pointing it here turns all of them into one consistent
   translucency, and because custom properties inherit, the whole subtree
   follows — including whatever panel the main slot is currently showing.

   The column itself is set transparent on purpose: the active panel paints
   the tint, so the frost is exactly one layer deep instead of two stacked
   semi-transparent layers (which would silently double the opacity). */
html[data-platform="darwin"][data-next-material="transparent"] [class*="_centerCol"] {
  background: transparent !important;
  --dsw-alias-bg-base: var(--dsh-vib-pane);
}

/* --- 3. Bottom row -------------------------------------------------------
   The AppFrame's second grid row ('grid-column: 1/-1') spans the full width
   under both columns and is still 'background: var(--dsw-alias-bg-base)', so
   it is handled like the center column. The 32px caption strip is gone: on
   darwin the frame itself is 'background: 0 0' and --dsh-frame-top-clearance
   (48px) keeps the traffic lights over the frozen sidebar, so there is no
   strip left to tint. */
html[data-platform="darwin"][data-next-material="transparent"] [class*="_bottomRow"] {
  background: transparent !important;
  --dsw-alias-bg-base: var(--dsh-vib-pane);
}

/* --- 4. Overlays keep the upstream opaque sheet -------------------------
   The retint in rules 2/3 is inherited by every descendant of those columns.
   That is what makes nested content frosted — but it also reaches things that
   are NOT pane material: dialog-like overlays, which are meant to be a solid,
   readable sheet floating above the frost.

   Measured case (dsh-cost-meter, "本会话费用明细"): the entry button and the
   panel are one React fragment, so the panel is a plain <dialog> in the
   normal DOM flow (no portal) and it paints itself with an INLINE style
   "background: var(--dsw-alias-bg-base, #fff)". Under the retint that token
   is the translucent tint, so the whole panel turned see-through and the
   conversation text underneath showed through its numbers.

   Restoring the tokens (not a background) keeps such a sheet opaque all the
   way down, including any nested card inside it that also consumes
   --dsw-alias-bg-base / --dsw-alias-bg-layer-1. This is a no-op anywhere the
   skin is off or the tokens were never retinted, so it cannot change the
   native look of a dialog that is portaled outside the pane.

   Scope: the whole gated document, not one pane. Dialogs are few, are always
   meant to be readable, and a portal can move the same dialog between the
   pane, the title strip and <body> without any CSS change on our side. */
html[data-platform="darwin"][data-next-material="transparent"] :is(dialog, [role="dialog"], [role="alertdialog"]) {
  --dsw-alias-bg-base: var(--dsh-vib-bg-base-solid);
  --dsw-alias-bg-layer-1: var(--dsh-vib-bg-layer-1-solid);
}

/* Deliberately NOT touched here:
   [class*="_sidebarCol"]   — already color-mix(...,90%,transparent) upstream
                              on darwin; this is the reference look the pane
                              is matching. Retinting it would double the tint.
   [class*="_frame"]        — already 'background: 0 0' on darwin.
   [class*="_rightbarCol"]  — the app's own third column; handled by sheet 2
                              behind the sidebar switch, exactly like v1.3.2
                              treated .dshDesktopRightbarSurface.
   Menus / popovers / inputs  — they resolve --dsw-specific-menu and
                              --dsw-specific-input-major, which derive from
                              the static palette and are unaffected by the
                              scoped --dsw-alias-bg-base override. Those that
                              DO consume --dsw-alias-bg-base while sitting in
                              a retinted subtree are covered by rule 4 above.
*/
`;

    /* ======================================================================
       SHEET 2/3 — third-party sidebar (dsh-better-sidebar), "panel" level.
       Switch: panels (default on).
       ====================================================================== */
    const PANEL_CSS_CONTENT = `
/* ==========================================================================
   dsh-vibrancy-skin — sidebar surfaces, behind the "侧边栏面板磨砂" switch
   --------------------------------------------------------------------------
   Three anchors. (a) and (c) are provider-owned attributes that survived the
   DSH NEXT rewrite untouched; (b) is a hashed CSS-module name, matched on its
   stable local part only.

   (a) [data-dsh-better-sidebar] — the host element the plugin appends to
       <body> itself (src/client/index.tsx:289:
       'host.setAttribute("data-dsh-better-sidebar", ""); document.body.appendChild(host)')
       and renders its UI into.

   (b) [class*="_rightbarCol"] — the app frame's third grid column. In
       2.0.20-next the column moved into ui-layout's AppFrame and is now
       '._1qAH1q_rightbarCol{background: var(--dsw-alias-bg-base)}' (the darwin
       override repeats the same declaration, so being on macOS does NOT make
       it translucent). v1.3.2 anchored this on
       '.dshDesktopRightbarSurface[data-rightbar-col]', which no longer exists
       anywhere in the shipped bundle; the slot children are still
       renderSlot("rightbar", …), so retinting the column root still covers
       everything hung under it.

   (c) [data-dockkit-host="dock"] — the dockkit cell that hosts a docked
       panel. DSH's dock paints its tab host with
       '._tabHost_<hash>_<idx>:not(._float_<hash>_<idx>) { background:
       var(--dsw-alias-bg-base) }' (dsh-web-frontend index-*.css).

   WHY (b) AND (c) ARE NEEDED, NOT JUST (a): measured live on this machine,
   dsh-better-sidebar's own host only carries the hidden bottom workbench —
   its visible file tree / editor is slot content inside the right column, and
   that column's surface is painted by the APP's dock, not by the plugin:
   'section._tabHost_<hash>_<idx>._pane_<hash>_<idx>' resolved to the raw
   --dsw-alias-bg-base, because it sits outside [data-dsh-better-sidebar].
   Frosting only (a) therefore left the whole visible sidebar opaque. (b) is
   the column root and covers the dock, (c) is the dock itself, so the tint
   lands even if the dock is ever portaled elsewhere.

   WHY A TOKEN, NOT PER-ELEMENT RULES: dsh-better-sidebar documents the
   extension point itself (src/client/sidebar.module.css:13-21) — "every
   surface here consumes DSH's generic tokens (--dsw-alias-*)" so that skins
   can restyle it. --dsw-alias-bg-base is consumed by the panel body
   (.nArs4W_pane), the dock tab host, the changes view root, the task graph
   and the floating window; re-pointing it once at a column root covers all of
   them at once, which is exactly how sheet 1 treats the conversation pane.

   The column root itself is transparent for the same reason the center column
   is: the dock inside it paints the tint ('._tabHost_…{background:
   var(--dsw-alias-bg-base)}' upstream), so the frost stays exactly one layer
   deep instead of two stacked semi-transparent layers.

   The two layer-1 chrome bars (the 34px tab strip and the bottom workbench)
   keep an explicit rule so they are frosted even while the deeper sheet is
   off. Their class names are hashed by the CSS-module build
   (nArs4W_tabBar / nArs4W_bottomPanel); only the hash prefix changes between
   builds, the local name is stable, and a miss costs nothing but a missed
   tint.
   ========================================================================== */
html[data-platform="darwin"][data-next-material="transparent"] [class*="_rightbarCol"],
html[data-platform="darwin"][data-next-material="transparent"] [data-dsh-better-sidebar],
html[data-platform="darwin"][data-next-material="transparent"] [data-dockkit-host="dock"] {
  --dsw-alias-bg-base: var(--dsh-vib-pane);
}

html[data-platform="darwin"][data-next-material="transparent"] [class*="_rightbarCol"] {
  background: transparent !important;
}

html[data-platform="darwin"][data-next-material="transparent"] [data-dsh-better-sidebar] [class*="_tabBar"],
html[data-platform="darwin"][data-next-material="transparent"] [data-dsh-better-sidebar] [class*="_bottomPanel"],
html[data-platform="darwin"][data-next-material="transparent"] [class*="_rightbarCol"] [class*="_tabHost_"],
html[data-platform="darwin"][data-next-material="transparent"] [data-dockkit-host="dock"] [class*="_tabHost_"] {
  background: var(--dsh-vib-pane);
}
`;

    /* ======================================================================
       SHEET 3/3 — third-party sidebar, "deep" level (nested surfaces).
       Switch: deep (default off).
       ====================================================================== */
    const DEEP_CSS_CONTENT = `
/* ==========================================================================
   dsh-vibrancy-skin — sidebar, behind the "深层玻璃" switch (default off)
   --------------------------------------------------------------------------
   Retints --dsw-alias-bg-layer-1 across the same three anchors sheet 2 uses
   (see that sheet for why all three are required): the nested cards, list
   rows, chips, node cards and inline editors inside the sidebar all consume
   layer-1, so re-pointing it once makes the *inside* of every surface glass
   as well instead of only the big flat panels.

   The anchor for the visible side column is the AppFrame's rightbar column
   ([class*="_rightbarCol"]) + [data-dockkit-host="dock"], not just
   [data-dsh-better-sidebar]: on this machine the latter only holds the hidden
   bottom workbench while the visible dock lives in the app's own third column
   (measured live — see sheet 2's comment).

   Off by default on purpose: the panel surfaces still carry the tint from
   sheet 2, so text there keeps the same contrast as the conversation pane,
   while layering more translucency behind text is a taste call.
   ========================================================================== */
html[data-platform="darwin"][data-next-material="transparent"] [class*="_rightbarCol"],
html[data-platform="darwin"][data-next-material="transparent"] [data-dsh-better-sidebar],
html[data-platform="darwin"][data-next-material="transparent"] [data-dockkit-host="dock"] {
  --dsw-alias-bg-layer-1: var(--dsh-vib-pane);
}
`;

    /* =====================================================================
       Locale
       ===================================================================== */

    const zh = {
      nav: "磨砂玻璃",
      title: "磨砂玻璃",
      intro: "调节会话面板与侧边栏的玻璃强度。所有改动立即生效，不需要重启，也不需要打开控制台。",
      appearanceTitle: "外观",
      appearanceIntro: "把不透明的会话面板换成一层半透明染色，让窗口背后的桌面透出来。",
      enable: "启用磨砂玻璃",
      sidebarTitle: "侧边栏（better-sidebar）",
      sidebarIntro: "让第三方侧边栏插件的界面也用同一层玻璃。两级效果各自独立开关，都跟随上面的总开关与强度。",
      sidebarMissing: "当前没有检测到 dsh-better-sidebar，本组开关暂时不会产生任何效果。",
      panelsToggle: "侧边栏面板磨砂",
      panelsHint: "面板本体、标签栏、底部工作台、改动视图、任务图与浮动窗等大面积表面，变成与右侧会话面板同款的磨砂。",
      deepToggle: "深层玻璃（卡片 / 列表）",
      deepHint: "连侧边栏内部的卡片、列表、编辑器等嵌套表面也一起玻璃化。透出的桌面内容更多，文字对比度会下降；觉得累眼就关掉。",
      strengthTitle: "强度",
      strengthIntro: "强度越低越透（玻璃感越强），越高越接近原来的不透明面板。",
      presetFrostTitle: "磨砂",
      presetFrostBody: "最通透，桌面内容隐约可见。",
      presetBalancedTitle: "均衡",
      presetBalancedBody: "默认值，透感与文字可读性的折中。",
      presetSolidTitle: "实心",
      presetSolidBody: "接近原生面板，只有轻微透出。",
      current: "当前",
      fineTitle: "微调",
      fineIntro: "预设不够用时，可以直接指定一个 0–100 之间的数值。",
      fineLabel: "不透明度",
      fineSuffix: "%",
      fineHint: "0% 完全透明，100% 等同于原生不透明面板。",
      reset: "恢复默认",
      inactive: "当前窗口没有启用玻璃背景：请在「桌面设置」页把「窗口材质」设为「玻璃背景」，且仅在 macOS 上生效。",
    };

    const en = {
      nav: "Vibrancy",
      title: "Vibrancy",
      intro: "Tune the glass strength of the conversation pane and the sidebar. Changes apply instantly — no restart and no console needed.",
      appearanceTitle: "Appearance",
      appearanceIntro: "Replaces the opaque conversation pane with a translucent tint so the desktop behind the window shows through.",
      enable: "Enable vibrancy",
      sidebarTitle: "Sidebar (better-sidebar)",
      sidebarIntro: "Lets the third-party sidebar plugin use the same glass. Both levels have their own switch and follow the master switch and strength above.",
      sidebarMissing: "dsh-better-sidebar is not present right now — these switches have no effect at the moment.",
      panelsToggle: "Sidebar panel glass",
      panelsHint: "Frosts the large surfaces — panel body, tab strip, bottom workbench, changes view, task graph and floating windows — to match the conversation pane.",
      deepToggle: "Deep glass (cards / lists)",
      deepHint: "Also turn the nested surfaces inside the sidebar into glass (cards, lists, inline editors). More of the desktop shows through and text contrast drops; switch it off if it tires your eyes.",
      strengthTitle: "Strength",
      strengthIntro: "Lower is more transparent (more glass), higher is closer to the original opaque pane.",
      presetFrostTitle: "Frosted",
      presetFrostBody: "Most transparent; the desktop stays faintly visible.",
      presetBalancedTitle: "Balanced",
      presetBalancedBody: "The default — a compromise between glass and text contrast.",
      presetSolidTitle: "Solid",
      presetSolidBody: "Close to the native pane, only slightly translucent.",
      current: "Current",
      fineTitle: "Fine tuning",
      fineIntro: "When the presets are not enough, set an exact value between 0 and 100.",
      fineLabel: "Opacity",
      fineSuffix: "%",
      fineHint: "0% is fully transparent, 100% matches the native opaque pane.",
      reset: "Reset to default",
      inactive: "This window does not use a glass background: set “Window material” to “Glass background” on the Desktop settings page (macOS only).",
    };

    /* =====================================================================
       State (single source of truth for both the stylesheets and the UI)
       ===================================================================== */

    const TINT_KEY = "dsh-vibrancy-skin:tint";
    const ENABLED_KEY = "dsh-vibrancy-skin:enabled";
    const PANELS_KEY = "dsh-vibrancy-skin:panels";
    const DEEP_KEY = "dsh-vibrancy-skin:deep";
    const DEFAULT_TINT = "40%";

    const PRESETS = [
      { id: "frost", tint: "24%", title: "presetFrostTitle", body: "presetFrostBody" },
      { id: "balanced", tint: DEFAULT_TINT, title: "presetBalancedTitle", body: "presetBalancedBody" },
      { id: "solid", tint: "62%", title: "presetSolidTitle", body: "presetSolidBody" },
    ];

    const SIDEBAR_ANCHOR = "[data-dsh-better-sidebar]";

    function readStore(key) {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }

    function writeStore(key, value) {
      try {
        if (value === null) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, value);
        }
      } catch {
        /* private mode / blocked storage: the session still works, it just
           does not remember the choice. */
      }
    }

    /* Accepts "40%", "40", 40, " 40 % ". Empty means "reset to default";
       anything unparseable returns null so callers can ignore it. */
    function normalizeTint(value) {
      if (value === null || value === undefined || value === "") return DEFAULT_TINT;
      const match = /^([0-9]+(?:\.[0-9]+)?)\s*%?$/.exec(String(value).trim());
      if (match === null) return null;
      const n = Number(match[1]);
      if (!Number.isFinite(n)) return null;
      const clamped = Math.min(100, Math.max(0, n));
      return `${Math.round(clamped * 10) / 10}%`;
    }

    const state = {
      enabled: readStore(ENABLED_KEY) !== "0",
      /* Sidebar frost is opt-out: it is part of the look, so a fresh profile
         gets it. Deep glass is opt-in: it trades text contrast for more
         transparency, so it must be asked for. */
      panels: readStore(PANELS_KEY) !== "0",
      deep: readStore(DEEP_KEY) === "1",
      tint: normalizeTint(readStore(TINT_KEY)) ?? DEFAULT_TINT,
    };

    const listeners = new Set();
    let snapshot = null;

    function getState() {
      if (snapshot === null) {
        snapshot = Object.freeze({
          enabled: state.enabled,
          panels: state.panels,
          deep: state.deep,
          tint: state.tint,
          defaultTint: DEFAULT_TINT,
          presets: PRESETS.map((preset) => preset.tint),
        });
      }
      return snapshot;
    }

    function subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }

    function emit() {
      snapshot = null;
      for (const listener of Array.from(listeners)) {
        try {
          listener();
        } catch (error) {
          console.error("[dsh-vibrancy-skin] subscriber failed", error);
        }
      }
    }

    /* =====================================================================
       Stylesheets + tint plumbing
       ===================================================================== */

    function whenBodyReady(fn) {
      if (document.body) {
        fn();
        return;
      }
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", fn, { once: true });
        return;
      }
      fn();
    }

    /* Each switch is the presence of its own <style> element. Removing a
       sheet restores the upstream look exactly, with zero extra CSS: forcing
       a 100% tint instead would leave .dshDesktopConversationSurface
       transparent while only the conversation panel repaints, so any other
       main-slot panel would leak the window material. It also keeps the
       three features independent — turning the sidebar off cannot perturb
       the pane, and vice versa. */
    const SHEETS = [
      { id: STYLE_ID, css: CSS_CONTENT, wanted: () => state.enabled },
      { id: PANEL_STYLE_ID, css: PANEL_CSS_CONTENT, wanted: () => state.enabled && state.panels },
      { id: DEEP_STYLE_ID, css: DEEP_CSS_CONTENT, wanted: () => state.enabled && state.deep },
    ];

    function toggleSheet(id, css, wanted) {
      const existing = document.getElementById(id);
      if (!wanted) {
        if (existing !== null) existing.remove();
        return false;
      }
      if (existing !== null) return true;
      const host = document.head || document.documentElement;
      if (!host) return false;
      const style = document.createElement("style");
      style.id = id;
      style.textContent = css;
      host.appendChild(style);
      return true;
    }

    function syncStylesheets() {
      for (const sheet of SHEETS) toggleSheet(sheet.id, sheet.css, sheet.wanted());
    }

    /* Inline custom properties beat every selector rule, so tuning only has
       to touch the body's style attribute. */
    function applyTintInline() {
      whenBodyReady(() => {
        if (!document.body) return;
        if (state.enabled && state.tint !== DEFAULT_TINT) {
          document.body.style.setProperty("--dsh-vib-tint-strength", state.tint);
        } else {
          document.body.style.removeProperty("--dsh-vib-tint-strength");
        }
      });
    }

    function setTint(value) {
      const next = normalizeTint(value);
      if (next === null) return state.tint;
      state.tint = next;
      writeStore(TINT_KEY, next === DEFAULT_TINT ? null : next);
      applyTintInline();
      emit();
      console.info(`[dsh-vibrancy-skin] tint = ${next}`);
      return next;
    }

    function setEnabled(value) {
      state.enabled = value !== false;
      writeStore(ENABLED_KEY, state.enabled ? "1" : "0");
      syncStylesheets();
      applyTintInline();
      emit();
      console.info(`[dsh-vibrancy-skin] enabled = ${state.enabled}`);
      return state.enabled;
    }

    function setPanels(value) {
      state.panels = value !== false;
      writeStore(PANELS_KEY, state.panels ? "1" : "0");
      syncStylesheets();
      emit();
      console.info(`[dsh-vibrancy-skin] sidebar panels = ${state.panels}`);
      return state.panels;
    }

    function setDeep(value) {
      state.deep = value !== false;
      writeStore(DEEP_KEY, state.deep ? "1" : "0");
      syncStylesheets();
      emit();
      console.info(`[dsh-vibrancy-skin] deep glass = ${state.deep}`);
      return state.deep;
    }

    /* =====================================================================
       Settings section (Settings -> 磨砂玻璃)

       DSH Desktop's own settings page declares no child slots, so a plugin
       cannot append rows inside it; the upstream-supported way is a sibling
       settings.section entry. It reuses the page's own classes
       (dshDesktopSettings*, installed unconditionally by
       dsh-plugin-desktop) so the result is visually native, in both themes.
       ===================================================================== */

    function useSkinState() {
      return react.useSyncExternalStore(subscribe, getState, getState);
    }

    function hasBetterSidebar() {
      try {
        return (
          typeof document.querySelector === "function" &&
          document.querySelector(SIDEBAR_ANCHOR) !== null
        );
      } catch {
        return false;
      }
    }

    function SkinChoice({ t, title, body, badge, selected, onSelect }) {
      return jsxs("div", {
        role: "radio",
        className: "dshDesktopSettingsChoice",
        "data-selected": selected ? "true" : undefined,
        "data-actionable": "true",
        "aria-checked": selected,
        tabIndex: 0,
        onClick: onSelect,
        onKeyDown: (event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          onSelect();
        },
        children: [
          jsxs("span", {
            className: "dshDesktopSettingsChoiceCopy",
            children: [
              jsxs("span", {
                className: "dshDesktopSettingsChoiceTitle",
                children: [
                  title,
                  badge !== undefined && jsx("span", { className: "dshDesktopSettingsBadge", children: badge }),
                ],
              }),
              jsx("span", { className: "dshDesktopSettingsChoiceBody", children: body }),
            ],
          }),
          selected && jsx("span", { className: "dshDesktopSettingsBadge", children: t("current") }),
        ],
      });
    }

    function SkinToggle({ label, checked, disabled, onChange }) {
      const labelId = react.useId();
      return jsxs("div", {
        className: "dshDesktopSettingsToggleRow",
        children: [
          jsx("span", { className: "dshDesktopSettingsToggleLabel", id: labelId, children: label }),
          jsx("button", {
            type: "button",
            role: "switch",
            className: "dshDesktopSettingsToggle",
            "aria-checked": checked,
            "aria-labelledby": labelId,
            disabled: disabled === true,
            onClick: () => onChange(!checked),
            children: jsx("span", { className: "dshDesktopSettingsToggleKnob", "aria-hidden": "true" }),
          }),
        ],
      });
    }

    function group(titleId, title, intro, body) {
      return jsxs("section", {
        className: "dshDesktopSettingsGroup",
        "aria-labelledby": titleId,
        children: [
          jsx("div", {
            children: [
              jsx("h3", { id: titleId, children: title }),
              intro !== undefined && jsx("p", { className: "dshDesktopSettingsGroupIntro", children: intro }),
            ],
          }),
          body,
        ],
      });
    }

    function VibrancySection({ t }) {
      const skin = useSkinState();
      const numeric = Math.round(parseFloat(skin.tint) * 10) / 10;
      const [draft, setDraft] = react.useState(() => String(numeric));
      const lastExternal = react.useRef(numeric);

      react.useEffect(() => {
        if (lastExternal.current === numeric) return;
        lastExternal.current = numeric;
        setDraft(String(numeric));
      }, [numeric]);

      const commit = (text) => {
        setDraft(text);
        const trimmed = text.trim();
        if (trimmed === "") return;
        const n = Number(trimmed);
        if (!Number.isFinite(n)) return;
        setTint(`${n}%`);
      };

      /* The window-material gate lives on <html> since DSH NEXT: preload-app.cjs
         writes documentElement.dataset.platform and ...dataset.nextMaterial.
         Reading the root also covers the settings page rendering before <body>
         has been touched by the shell. */
      const root = document.documentElement;
      const active =
        root !== null &&
        root !== undefined &&
        root.dataset.platform === "darwin" &&
        root.dataset.nextMaterial === "transparent";

      const sidebar = hasBetterSidebar();

      return jsxs("div", {
        className: "dshDesktopSettings",
        children: [
          jsxs("header", {
            className: "dshDesktopSettingsHeader",
            children: [jsx("h2", { children: t("title") }), jsx("p", { children: t("intro") })],
          }),
          !active && jsx("p", { className: "dshDesktopSettingsNotice", children: t("inactive") }),

          group("dsh-vibrancy-appearance-title", t("appearanceTitle"), t("appearanceIntro"),
            jsx("div", {
              className: "dshDesktopSettingsList",
              children: jsx(SkinToggle, {
                label: t("enable"),
                checked: skin.enabled,
                onChange: (next) => setEnabled(next),
              }),
            }),
          ),

          group("dsh-vibrancy-sidebar-title", t("sidebarTitle"), t("sidebarIntro"),
            jsxs("div", {
              children: [
                !sidebar && jsx("p", { className: "dshDesktopSettingsNotice", children: t("sidebarMissing") }),
                jsxs("div", {
                  className: "dshDesktopSettingsList",
                  children: [
                    jsx(SkinToggle, {
                      label: t("panelsToggle"),
                      checked: skin.enabled && skin.panels,
                      disabled: !skin.enabled,
                      onChange: (next) => setPanels(next),
                    }),
                    jsx("p", { className: "dshDesktopSettingsHint", children: t("panelsHint") }),
                    jsx(SkinToggle, {
                      label: t("deepToggle"),
                      checked: skin.enabled && skin.deep,
                      disabled: !skin.enabled,
                      onChange: (next) => setDeep(next),
                    }),
                    jsx("p", { className: "dshDesktopSettingsHint", children: t("deepHint") }),
                  ],
                }),
              ],
            }),
          ),

          group("dsh-vibrancy-strength-title", t("strengthTitle"), t("strengthIntro"),
            jsx("div", {
              className: "dshDesktopSettingsList",
              role: "radiogroup",
              "aria-labelledby": "dsh-vibrancy-strength-title",
              children: PRESETS.map((preset) =>
                jsx(
                  SkinChoice,
                  {
                    t,
                    title: t(preset.title),
                    body: t(preset.body),
                    badge: preset.tint,
                    selected: skin.enabled && skin.tint === preset.tint,
                    onSelect: () => setTint(preset.tint),
                  },
                  preset.id,
                ),
              ),
            }),
          ),

          group("dsh-vibrancy-fine-title", t("fineTitle"), t("fineIntro"),
            jsxs("div", {
              children: [
                jsxs("div", {
                  className: "dshDesktopSettingsForm",
                  children: [
                    jsx("label", {
                      className: "dshDesktopSettingsField",
                      children: [
                        jsx("span", { children: t("fineLabel") }),
                        jsx("input", {
                          className: "dshDesktopSettingsInput",
                          type: "number",
                          min: "0",
                          max: "100",
                          step: "1",
                          value: draft,
                          disabled: !skin.enabled,
                          onChange: (event) => commit(event.target.value),
                          onBlur: () => setDraft(String(numeric)),
                        }),
                      ],
                    }),
                    jsx("button", {
                      type: "button",
                      className: "dshDesktopSettingsButton",
                      disabled: !skin.enabled || skin.tint === skin.defaultTint,
                      onClick: () => setTint(""),
                      children: t("reset"),
                    }),
                  ],
                }),
                jsx("p", { className: "dshDesktopSettingsHint", children: t("fineHint") }),
              ],
            }),
          ),
        ],
      });
    }

    /* =====================================================================
       Plugin lifecycle
       ===================================================================== */

    function expose() {
      try {
        window.dshVibrancySkin = {
          variants: { frost: "24%", balanced: DEFAULT_TINT, solid: "62%" },
          presets: PRESETS.map((preset) => preset.tint),
          default: DEFAULT_TINT,
          setTint,
          setEnabled,
          setPanels,
          setDeep,
          getState,
          subscribe,
          reset: () => setTint(""),
          resetAll: () => {
            setTint("");
            setPanels(true);
            setDeep(false);
            setEnabled(true);
          },
        };
      } catch {}
    }

    function apply(ctx) {
      /* The stylesheets are already installed by the factory body below; this
         is just a reconciliation in case they were claimed and removed by a
         module reload. */
      syncStylesheets();

      whenBodyReady(() => {
        applyTintInline();
        expose();
        const body = document.body;
        const root = document.documentElement;
        console.info(
          `[dsh-vibrancy-skin] applied — enabled ${state.enabled}, sidebar panels ${state.panels}, deep glass ${state.deep}, tint ${state.tint}, theme ${body && body.dataset.dsDarkTheme !== undefined ? "dark" : "light"}, platform ${(root && root.dataset.platform) || "n/a"}, material ${(root && root.dataset.nextMaterial) || "n/a"}`,
        );
      });

      const t = ctx.locale.bind(NS);
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-vibrancy-skin: locale");

      ctx.slots.inject("settings.section", () =>
        ctx.slots.register(
          {
            name: "settings.section",
            id: "vibrancy",
            order: 101,
            label: () => t("nav"),
            locale: NS,
          },
          VibrancySection,
        ),
      );

      return () => {
        for (const sheet of SHEETS) {
          const style = document.getElementById(sheet.id);
          if (style !== null) style.remove();
        }
        try {
          delete window.dshVibrancySkin;
        } catch {}
      };
    }

    /* Runs at module materialization, i.e. during the boot prefetch tier
       (dsh.client.immediately), before the React tree mounts — so the tint is
       already in place when the desktop shell installs its own stylesheet.
       Doing it here and not in apply() also means the skin keeps working even
       if the settings UI never comes up. */
    syncStylesheets();
    applyTintInline();

    exports.inject = ["slots", "locale"];
    exports.apply = apply;
    return module.exports;
  },
});
