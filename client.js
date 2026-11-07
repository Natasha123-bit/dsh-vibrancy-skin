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
   (verified against DSH Desktop 2.0.22-next, @deepseek-ai/dsh 0.2.2-rc.1 and
    the official DeepSeek Harness client 0.2.2-rc.1)
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
     1b. THE OFFICIAL CLIENT HAS THE SAME PRELOAD MINUS THE MATERIAL KEY. It
        writes data-platform only, and its main.js unconditionally creates the
        window with the vibrancy triple above (no macosMaterial switch exists
        in that build). The gate is therefore "darwin AND NOT material=off"
        instead of "material=transparent": NEXT keeps both behaviours
        (transparent matches, off is excluded) and the official client matches
        because the attribute is simply absent.
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
        html[data-platform="darwin"]:not([data-next-material="off"]),
        so the plugin is inert on every other platform (and on NEXT with the
        window material explicitly switched off), and falls back cleanly to
        the upstream look.

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
html[data-platform="darwin"]:not([data-next-material="off"]) body {
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

html[data-platform="darwin"]:not([data-next-material="off"]) body[data-ds-dark-theme] {
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
html[data-platform="darwin"]:not([data-next-material="off"]) [class*="_centerCol"] {
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
html[data-platform="darwin"]:not([data-next-material="off"]) [class*="_bottomRow"] {
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
html[data-platform="darwin"]:not([data-next-material="off"]) :is(dialog, [role="dialog"], [role="alertdialog"]) {
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

/* --- 5. Inline code keeps a faint chip ----------------------------------
   Upstream paints inline code with --dsw-alias-markdown-inline-code, which is
   opaque enough to read as a solid block on the frost. Blending it 45% into
   transparent keeps the chip recognisable without re-opaqueing the pane.
   Fenced blocks (<pre> > code) are deliberately NOT touched: they are large
   surfaces, and a translucent one would hurt long code reads. Material only —
   no layout property is declared here. */
html[data-platform="darwin"]:not([data-next-material="off"]) [class*="_markdown_"] :not(pre) > code {
  background-color: color-mix(in srgb, var(--dsw-alias-markdown-inline-code, #808080) 45%, transparent);
}

/* --- 6. Surfaces the theme keeps opaque ---------------------------------
   These five surfaces paint their own opaque fill and still read as solid
   holes in the frost. Every rule below changes only a colour (or a colour
   token) and leaves layout alone; none of them samples the window behind
   the pane, so backdrop-filter is not involved anywhere here.

   6a. User bubble — upstream paints .VnbZpq_bubble with
   var(--dsw-specific-bubble) and nothing else consumes that token, so
   re-pointing it on body stays local. body[data-ds-dark-theme] is the only
   dark switch upstream uses, same as rule 1. 58% keeps the bubble readable
   while the frost shows through.
   6b. Composer card — [data-composer-card] paints
   var(--dsw-specific-input-major); 64% keeps typed text legible.
   6c. Changed-files card — the card paints var(--dsw-alias-bg-layer-1); its
   header and hover use the local --changes-fill / --changes-hover tokens
   (neutral-50 / neutral-100 in light, neutral-850 / neutral-800 in dark).
   6d. Cost meter — the sidebar summary card is layer-1 at 44%; its inner
   boxes are made transparent so the card owns the single fill, while a
   standalone .cm-bbox (rail / dialogs) keeps a 50% fallback. .cm-chip and
   the "cost details" button get 42% / 46% so the meter reads as one
   translucent family. */
html[data-platform="darwin"]:not([data-next-material="off"]) body {
  --dsw-specific-bubble: color-mix(in srgb, var(--dsw-static-deepseek-50) 58%, transparent);
}

html[data-platform="darwin"]:not([data-next-material="off"]) body[data-ds-dark-theme] {
  --dsw-specific-bubble: color-mix(in srgb, var(--dsw-static-neutral-bluish-850) 58%, transparent);
}

html[data-platform="darwin"]:not([data-next-material="off"]) [data-composer-card] {
  background: color-mix(in srgb, var(--dsw-specific-input-major) 64%, transparent);
}

html[data-platform="darwin"]:not([data-next-material="off"]) [data-changed-files] {
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 52%, transparent);
  --changes-fill: color-mix(in srgb, var(--dsw-static-neutral-50) 52%, transparent);
  --changes-hover: color-mix(in srgb, var(--dsw-static-neutral-100) 70%, transparent);
}

html[data-platform="darwin"]:not([data-next-material="off"]) body[data-ds-dark-theme] [data-changed-files] {
  --changes-fill: color-mix(in srgb, var(--dsw-static-neutral-850) 52%, transparent);
  --changes-hover: color-mix(in srgb, var(--dsw-static-neutral-800) 70%, transparent);
}

html[data-platform="darwin"]:not([data-next-material="off"]) .cm-footer-stack.summary:not(.rail) {
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 44%, transparent);
}

html[data-platform="darwin"]:not([data-next-material="off"]) .cm-footer-stack.summary:not(.rail) .cm-bbox {
  background: transparent;
}

html[data-platform="darwin"]:not([data-next-material="off"]) .cm-bbox {
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 50%, transparent);
}

html[data-platform="darwin"]:not([data-next-material="off"]) .cm-chip {
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-2) 42%, transparent);
}

html[data-platform="darwin"]:not([data-next-material="off"]) .cm-btn.cm-stat-entry {
  background: color-mix(in srgb, var(--dsw-alias-button-elevated-fill) 46%, transparent);
}
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
html[data-platform="darwin"]:not([data-next-material="off"]) [class*="_rightbarCol"],
html[data-platform="darwin"]:not([data-next-material="off"]) [data-dsh-better-sidebar],
html[data-platform="darwin"]:not([data-next-material="off"]) [data-dockkit-host="dock"] {
  --dsw-alias-bg-base: var(--dsh-vib-pane);
}

html[data-platform="darwin"]:not([data-next-material="off"]) [class*="_rightbarCol"] {
  background: transparent !important;
}

html[data-platform="darwin"]:not([data-next-material="off"]) [data-dsh-better-sidebar] [class*="_tabBar"],
html[data-platform="darwin"]:not([data-next-material="off"]) [data-dsh-better-sidebar] [class*="_bottomPanel"],
html[data-platform="darwin"]:not([data-next-material="off"]) [class*="_rightbarCol"] [class*="_tabHost_"],
html[data-platform="darwin"]:not([data-next-material="off"]) [data-dockkit-host="dock"] [class*="_tabHost_"] {
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
html[data-platform="darwin"]:not([data-next-material="off"]) [class*="_rightbarCol"],
html[data-platform="darwin"]:not([data-next-material="off"]) [data-dsh-better-sidebar],
html[data-platform="darwin"]:not([data-next-material="off"]) [data-dockkit-host="dock"] {
  --dsw-alias-bg-layer-1: var(--dsh-vib-pane);
}
`;

    /* ======================================================================
       SHEET 4/4 — background image ("透到壁纸" wallpaper mode).
       Installed only while a local picture is active: the picture is exposed
       to CSS through one inline custom property on <body> and painted on a
       fixed pseudo element BEHIND the whole window content (z-index: -1).
       It is removed the moment the user switches back to "透到桌面", so the
       native vibrancy (real desktop) comes back with zero leftover CSS.

       No backdrop filter here on purpose: sampling a transparent vibrancy
       window paints a flat grey fog (see sheet 1). The blur is applied to
       the picture itself, never to the window.
       ====================================================================== */
    const BG_CSS_CONTENT = `
html[data-platform="darwin"]:not([data-next-material="off"]) body::before {
  content: "";
  position: fixed;
  inset: -64px;
  z-index: -1;
  pointer-events: none;
  background-image: var(--dsh-vib-bg-image);
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  filter: blur(var(--dsh-vib-frost, 36px));
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
      bgTitle: "背景图",
      bgIntro: "把一张自己的图片垫在玻璃后面。图片只在本机处理，不会上传；换回「透到桌面」即恢复原生效果。",
      bgDesktopTitle: "透到桌面",
      bgDesktopBody: "玻璃后面是真实的桌面（当前效果）。",
      bgWallpaperTitle: "透到壁纸",
      bgWallpaperBody: "用一张图片当壁纸，磨砂面板透出这张图。",
      bgPick: "选择图片…",
      bgReplace: "更换图片…",
      bgRemove: "移除",
      bgEmpty: "还没有选择图片 —— 选好后才会生效；现在仍按「透到桌面」显示。",
      bgHint: "图片会压缩到长边 2048 px 并保存在本机浏览器存储，不联网、不上传；清站点数据或换 profile 会丢失。",
      bgPreviewAlt: "当前背景图预览",
      bgDecodeFailed: "这张图片无法解码，换一张 JPG / PNG / WebP 试试。",
      bgTooLarge: "图片超过 30 MB，先压缩或换一张吧。",
      sidebarTitle: "侧边栏（better-sidebar）",
      sidebarIntro: "让第三方侧边栏插件的界面也用同一层玻璃。两级效果各自独立开关，都跟随上面的总开关与强度。",
      sidebarMissing: "当前没有检测到 dsh-better-sidebar，本组开关暂时不会产生任何效果。",
      panelsToggle: "侧边栏面板磨砂",
      panelsHint: "面板本体、标签栏、底部工作台、改动视图、任务图与浮动窗等大面积表面，变成与右侧会话面板同款的磨砂。",
      deepToggle: "深层玻璃（卡片 / 列表）",
      deepHint: "连侧边栏内部的卡片、列表、编辑器等嵌套表面也一起玻璃化。透出的桌面内容更多，文字对比度会下降；觉得累眼就关掉。",
      strengthTitle: "强度",
      strengthIntro: "强度越低越透（玻璃感越强），越高越接近原来的不透明面板。",
      frostTitle: "磨砂度",
      frostIntro: "调整壁纸自身被模糊的程度：0 完全不模糊、100 接近纯雾面，默认 36。只在「透到壁纸」模式下可调。",
      frostLabel: "模糊半径",
      frostHint: "拖动滑杆即时调节壁纸的模糊半径；数值越大越雾，0 则保留原图细节。",
      frostDesktopHint: "桌面模式下模糊由 macOS 固定，不可调；切到「透到壁纸」后即可拖动滑杆。",
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
      bgTitle: "Background image",
      bgIntro: "Put your own picture behind the glass. It is processed on this machine and never uploaded; switch back to “Desktop” for the native look.",
      bgDesktopTitle: "Desktop",
      bgDesktopBody: "The glass shows the real desktop (current look).",
      bgWallpaperTitle: "Wallpaper",
      bgWallpaperBody: "Use a picture as the wallpaper; the frosted panes show it.",
      bgPick: "Choose image…",
      bgReplace: "Replace image…",
      bgRemove: "Remove",
      bgEmpty: "No image yet — pick one to turn it on; until then the window keeps the desktop look.",
      bgHint: "The image is compressed to 2048 px on the long edge and stored in this browser profile. No network, no upload; clearing site data or switching profile loses it.",
      bgPreviewAlt: "Current background image preview",
      bgDecodeFailed: "This image could not be decoded. Try a JPG, PNG or WebP.",
      bgTooLarge: "The image is over 30 MB — compress it or pick another one.",
      sidebarTitle: "Sidebar (better-sidebar)",
      sidebarIntro: "Lets the third-party sidebar plugin use the same glass. Both levels have their own switch and follow the master switch and strength above.",
      sidebarMissing: "dsh-better-sidebar is not present right now — these switches have no effect at the moment.",
      panelsToggle: "Sidebar panel glass",
      panelsHint: "Frosts the large surfaces — panel body, tab strip, bottom workbench, changes view, task graph and floating windows — to match the conversation pane.",
      deepToggle: "Deep glass (cards / lists)",
      deepHint: "Also turn the nested surfaces inside the sidebar into glass (cards, lists, inline editors). More of the desktop shows through and text contrast drops; switch it off if it tires your eyes.",
      strengthTitle: "Strength",
      strengthIntro: "Lower is more transparent (more glass), higher is closer to the original opaque pane.",
      frostTitle: "Blur amount",
      frostIntro: "How much the wallpaper itself is blurred: 0 keeps it sharp, 100 is close to solid fog, and 36 is the default. Only adjustable in “Wallpaper” mode.",
      frostLabel: "Blur radius",
      frostHint: "Drag the slider to blur the wallpaper live; higher is foggier, 0 keeps the original detail.",
      frostDesktopHint: "Desktop mode uses the macOS-fixed blur. Switch to “Wallpaper” to adjust it.",
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

    /* --- wallpaper blur radius (v1.5.1) ---------------------------------- */
    const FROST_KEY = "dsh-vibrancy-skin:frost";
    const DEFAULT_FROST = 36;

    /* --- background image (v1.5.0) --------------------------------------- */
    const BG_STYLE_ID = "dsh-vibrancy-skin-bg-styles";
    const BG_KEY = "dsh-vibrancy-skin:bg-mode";
    const BG_NAME_KEY = "dsh-vibrancy-skin:bg-name";
    const BG_URL_VAR = "--dsh-vib-bg-image";
    const BG_DB_NAME = "dsh-vibrancy-skin";
    const BG_STORE = "bg";
    const BG_RECORD = "image";
    const BG_MAX_EDGE = 2048;
    const BG_QUALITY = 0.9;
    const BG_MAX_BYTES = 30 * 1024 * 1024;

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

    /* Integer px radius in 0–100. Empty means "reset to the default";
       anything unparseable returns null so callers can ignore it. Out-of-range
       values are clamped, fractions rounded. */
    function normalizeFrost(value) {
      if (value === null || value === undefined || value === "") return DEFAULT_FROST;
      const match = /^(-?[0-9]+(?:\.[0-9]+)?)\s*(?:px)?$/i.exec(String(value).trim());
      if (match === null) return null;
      const n = Number(match[1]);
      if (!Number.isFinite(n)) return null;
      return Math.round(Math.min(100, Math.max(0, n)));
    }

    const state = {
      enabled: readStore(ENABLED_KEY) !== "0",
      /* Sidebar frost is opt-out: it is part of the look, so a fresh profile
         gets it. Deep glass is opt-in: it trades text contrast for more
         transparency, so it must be asked for. */
      panels: readStore(PANELS_KEY) !== "0",
      deep: readStore(DEEP_KEY) === "1",
      tint: normalizeTint(readStore(TINT_KEY)) ?? DEFAULT_TINT,
      frost: normalizeFrost(readStore(FROST_KEY)) ?? DEFAULT_FROST,
      bgMode: readStore(BG_KEY) === "wallpaper" ? "wallpaper" : "desktop",
      bgName: readStore(BG_NAME_KEY) || "",
      bgUrl: null,
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
          frost: state.frost,
          bgMode: state.bgMode,
          bgName: state.bgName,
          bgUrl: state.bgUrl,
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
      { id: BG_STYLE_ID, css: BG_CSS_CONTENT, wanted: () => state.enabled && state.bgMode === "wallpaper" && state.bgUrl !== null },
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

    /* The wallpaper picture travels as an inline custom property, for the
       same reason the tint does: it must win over any stylesheet rule, and
       it must disappear exactly when the sheet does. */
    function applyBgInline() {
      whenBodyReady(() => {
        if (!document.body) return;
        if (state.enabled && state.bgMode === "wallpaper" && state.bgUrl !== null) {
          document.body.style.setProperty(BG_URL_VAR, 'url("' + state.bgUrl + '")');
        } else {
          document.body.style.removeProperty(BG_URL_VAR);
        }
      });
    }

    /* The wallpaper blur radius travels as an inline custom property too; it
       is read by sheet 4 only (`filter: blur(var(--dsh-vib-frost, 36px))`).
       Removing it while the skin is off keeps the body attribute clean. */
    function applyFrostInline() {
      whenBodyReady(() => {
        if (!document.body) return;
        if (state.enabled) {
          document.body.style.setProperty("--dsh-vib-frost", `${state.frost}px`);
        } else {
          document.body.style.removeProperty("--dsh-vib-frost");
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

    function setFrost(value) {
      const next = normalizeFrost(value);
      if (next === null) return state.frost;
      state.frost = next;
      writeStore(FROST_KEY, next === DEFAULT_FROST ? null : String(next));
      applyFrostInline();
      emit();
      console.info(`[dsh-vibrancy-skin] frost = ${next}px`);
      return next;
    }

    function setEnabled(value) {
      state.enabled = value !== false;
      writeStore(ENABLED_KEY, state.enabled ? "1" : "0");
      syncStylesheets();
      applyTintInline();
      applyBgInline();
      applyFrostInline();
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
       Background image (v1.5.0)

       A local picture can replace the real desktop behind the glass. The
       image never leaves the machine: it is decoded, downscaled to at most
       BG_MAX_EDGE px on the long edge, re-encoded as WebP and kept in
       IndexedDB. Only a freshly created blob: URL is ever handed to CSS.

       Every browser API here is optional: the whole feature must degrade to
       "not available" instead of throwing when object URLs, IndexedDB,
       createImageBitmap or canvas are missing.
       ===================================================================== */

    function makeObjectUrl(blob) {
      try {
        const api =
          (typeof window !== "undefined" && window && window.URL) ||
          (typeof URL !== "undefined" ? URL : null);
        if (api === null || api === undefined) return null;
        if (typeof api.createObjectURL !== "function") return null;
        return api.createObjectURL(blob);
      } catch {
        return null;
      }
    }

    function revokeObjectUrl(url) {
      if (url === null || url === undefined || url === "") return;
      try {
        const api =
          (typeof window !== "undefined" && window && window.URL) ||
          (typeof URL !== "undefined" ? URL : null);
        if (api === null || api === undefined) return;
        if (typeof api.revokeObjectURL === "function") api.revokeObjectURL(url);
      } catch {}
    }

    /* The stub in smoke-test.mjs has no window.indexedDB and Node has no
       global one either, so the lookup is fully guarded in both directions. */
    function indexedDbApi() {
      try {
        if (typeof window !== "undefined" && window && window.indexedDB) return window.indexedDB;
      } catch {}
      try {
        if (typeof indexedDB !== "undefined" && indexedDB) return indexedDB;
      } catch {}
      return null;
    }

    function openBgDb() {
      return new Promise((resolve) => {
        let request = null;
        try {
          const idb = indexedDbApi();
          if (idb === null || typeof idb.open !== "function") {
            resolve(null);
            return;
          }
          request = idb.open(BG_DB_NAME, 1);
        } catch {
          resolve(null);
          return;
        }
        if (request === null || request === undefined) {
          resolve(null);
          return;
        }
        request.onupgradeneeded = () => {
          try {
            const db = request.result;
            if (db && db.objectStoreNames && !db.objectStoreNames.contains(BG_STORE)) {
              db.createObjectStore(BG_STORE, { keyPath: "id" });
            }
          } catch {}
        };
        request.onsuccess = () => {
          resolve(request.result || null);
        };
        request.onerror = () => resolve(null);
        request.onblocked = () => resolve(null);
      });
    }

    /* One connection per operation: the plugin has no long-lived lifecycle
       hook, so opening, using and closing a connection keeps the code free
       of state that could leak across reloads. Any failure resolves null. */
    function withBgStore(mode, run) {
      return new Promise((resolve) => {
        openBgDb().then((db) => {
          if (db === null || db === undefined) {
            resolve(null);
            return;
          }
          try {
            const transaction = db.transaction(BG_STORE, mode);
            const store = transaction.objectStore(BG_STORE);
            let request = null;
            try {
              request = run(store);
            } catch {
              resolve(null);
              return;
            }
            if (request === null || request === undefined) {
              resolve(null);
              return;
            }
            request.onsuccess = () => resolve(request.result ?? null);
            request.onerror = () => resolve(null);
            transaction.onerror = () => resolve(null);
            transaction.onabort = () => resolve(null);
          } catch {
            resolve(null);
          } finally {
            try {
              if (typeof db.close === "function") db.close();
            } catch {}
          }
        });
      });
    }

    async function persistBgImage(blob, name) {
      try {
        await withBgStore("readwrite", (store) =>
          store.put({ id: BG_RECORD, blob, name, updatedAt: Date.now() }),
        );
        return true;
      } catch {
        return false;
      }
    }

    async function deleteStoredBg() {
      try {
        await withBgStore("readwrite", (store) => store.delete(BG_RECORD));
        return true;
      } catch {
        return false;
      }
    }

    async function readStoredBg() {
      try {
        return (await withBgStore("readonly", (store) => store.get(BG_RECORD))) ?? null;
      } catch {
        return null;
      }
    }

    function setBgMode(value) {
      const next = value === "wallpaper" ? "wallpaper" : "desktop";
      state.bgMode = next;
      writeStore(BG_KEY, next);
      syncStylesheets();
      applyBgInline();
      emit();
      console.info(`[dsh-vibrancy-skin] background mode = ${next}`);
      return next;
    }

    function setBgImage(blob, name) {
      if (blob === null || blob === undefined || typeof blob !== "object" || typeof blob.size !== "number") {
        return false;
      }
      const url = makeObjectUrl(blob);
      if (url === null) return false;
      revokeObjectUrl(state.bgUrl);
      state.bgUrl = url;
      state.bgName = typeof name === "string" ? name : "";
      state.bgMode = "wallpaper";
      writeStore(BG_KEY, "wallpaper");
      writeStore(BG_NAME_KEY, state.bgName);
      syncStylesheets();
      applyBgInline();
      emit();
      try {
        void persistBgImage(blob, state.bgName);
      } catch {}
      return true;
    }

    function clearBgImage() {
      revokeObjectUrl(state.bgUrl);
      state.bgUrl = null;
      state.bgName = "";
      state.bgMode = "desktop";
      writeStore(BG_KEY, "desktop");
      writeStore(BG_NAME_KEY, "");
      syncStylesheets();
      applyBgInline();
      emit();
      try {
        void deleteStoredBg();
      } catch {}
      return true;
    }

    /* Rehydrates the blob: URL after a restart. Only runs when the last
       session left the skin in wallpaper mode; every failure is silent, the
       window simply keeps the desktop look. The second mode check covers the
       case where the user switched back to "desktop" while IDB was opening. */
    async function restoreBgImage() {
      if (state.bgMode !== "wallpaper") return;
      try {
        const record = await readStoredBg();
        if (record === null || record === undefined || !record.blob) return;
        if (state.bgMode !== "wallpaper") return;
        const url = makeObjectUrl(record.blob);
        if (url === null) return;
        revokeObjectUrl(state.bgUrl);
        state.bgUrl = url;
        if (typeof record.name === "string" && record.name !== "") state.bgName = record.name;
        syncStylesheets();
        applyBgInline();
        emit();
      } catch {
        /* no IndexedDB / no record: silent */
      }
    }

    /* Decode -> downscale -> WebP. Runs on the UI thread only on the file
       pick, so the cost is paid once per chosen picture. */
    async function compressImageFile(file) {
      const createBitmap = typeof window !== "undefined" ? window.createImageBitmap : null;
      if (typeof createBitmap !== "function") throw new Error("decode");
      let bitmap;
      try {
        bitmap = await createBitmap.call(window, file, { imageOrientation: "from-image" });
      } catch {
        bitmap = await createBitmap.call(window, file);
      }
      try {
        const scale = Math.min(1, BG_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
        const w = Math.max(1, Math.round(bitmap.width * scale));
        const h = Math.max(1, Math.round(bitmap.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx2d = canvas.getContext("2d");
        if (!ctx2d) throw new Error("canvas");
        ctx2d.imageSmoothingQuality = "high";
        ctx2d.drawImage(bitmap, 0, 0, w, h);
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", BG_QUALITY));
        if (!blob) throw new Error("encode");
        return blob;
      } finally {
        try {
          if (bitmap && typeof bitmap.close === "function") bitmap.close();
        } catch {}
      }
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
      const inputRef = react.useRef(null);
      const [busy, setBusy] = react.useState(false);
      const [error, setError] = react.useState("");

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

      /* The window gate lives on <html> since DSH NEXT: preload-app.cjs writes
         documentElement.dataset.platform and ...dataset.nextMaterial, while the
         official DeepSeek Harness client writes only dataset.platform and lets
         main.js create the window with vibrancy unconditionally. Absent
         material therefore means "frost available" (official client), and only
         an explicit "off" means the window is opaque. Reading the root also
         covers the settings page rendering before <body> has been touched. */
      const root = document.documentElement;
      const active =
        root !== null &&
        root !== undefined &&
        root.dataset.platform === "darwin" &&
        root.dataset.nextMaterial !== "off";

      const sidebar = hasBetterSidebar();

      const pick = () => {
        const input = inputRef.current;
        if (input !== null && input !== undefined && typeof input.click === "function") input.click();
      };

      const onFile = async (event) => {
        const target = event === null || event === undefined ? null : event.target;
        const file = target && target.files && target.files.length > 0 ? target.files[0] : null;
        if (target !== null && target !== undefined) {
          try {
            target.value = "";
          } catch {}
        }
        if (!file) return;
        if (file.size > BG_MAX_BYTES) {
          setError("bgTooLarge");
          return;
        }
        setBusy(true);
        setError("");
        try {
          const blob = await compressImageFile(file);
          if (!setBgImage(blob, typeof file.name === "string" ? file.name : "")) {
            setError("bgDecodeFailed");
          }
        } catch (failure) {
          setError("bgDecodeFailed");
          console.error("[dsh-vibrancy-skin] background image failed", failure);
        } finally {
          setBusy(false);
        }
      };

      const bgGroup = group(
        "dsh-vibrancy-bg-title",
        t("bgTitle"),
        t("bgIntro"),
        jsxs("div", {
          children: [
            jsxs("div", {
              className: "dshDesktopSettingsList",
              role: "radiogroup",
              "aria-labelledby": "dsh-vibrancy-bg-title",
              children: [
                jsx(
                  SkinChoice,
                  {
                    t,
                    title: t("bgDesktopTitle"),
                    body: t("bgDesktopBody"),
                    selected: skin.bgMode !== "wallpaper",
                    onSelect: () => setBgMode("desktop"),
                  },
                  "desktop",
                ),
                jsx(
                  SkinChoice,
                  {
                    t,
                    title: t("bgWallpaperTitle"),
                    body: t("bgWallpaperBody"),
                    selected: skin.bgMode === "wallpaper",
                    onSelect: () => {
                      setBgMode("wallpaper");
                      if (!skin.bgUrl) pick();
                    },
                  },
                  "wallpaper",
                ),
              ],
            }),
            skin.bgMode === "wallpaper"
              ? skin.bgUrl !== null
                ? jsx("img", {
                    className: "dshVibrancyBgPreview",
                    src: skin.bgUrl,
                    alt: t("bgPreviewAlt"),
                    style: {
                      display: "block",
                      maxWidth: "360px",
                      maxHeight: "200px",
                      objectFit: "cover",
                      borderRadius: "10px",
                    },
                  })
                : jsx("p", { className: "dshDesktopSettingsHint", children: t("bgEmpty") })
              : null,
            jsxs("div", {
              className: "dshDesktopSettingsForm",
              children: [
                jsx("button", {
                  type: "button",
                  className: "dshDesktopSettingsButton",
                  disabled: busy,
                  onClick: pick,
                  children: t(skin.bgUrl ? "bgReplace" : "bgPick"),
                }),
                skin.bgUrl !== null &&
                  jsx("button", {
                    type: "button",
                    className: "dshDesktopSettingsButton",
                    onClick: () => clearBgImage(),
                    children: t("bgRemove"),
                  }),
              ],
            }),
            jsx("input", {
              type: "file",
              accept: "image/*",
              ref: inputRef,
              onChange: onFile,
              style: { display: "none" },
              tabIndex: -1,
              "aria-hidden": "true",
            }),
            error !== "" && jsx("p", { className: "dshDesktopSettingsNotice", children: t(error) }),
            jsx("p", { className: "dshDesktopSettingsHint", children: t("bgHint") }),
          ],
        }),
      );

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

          bgGroup,

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

          group("dsh-vibrancy-frost-title", t("frostTitle"), t("frostIntro"),
            jsxs("div", {
              children: [
                jsxs("div", {
                  className: "dshDesktopSettingsForm",
                  children: [
                    jsx("label", {
                      className: "dshDesktopSettingsField",
                      children: [
                        jsx("span", { children: t("frostLabel") }),
                        jsx("input", {
                          className: "dshDesktopSettingsInput",
                          type: "range",
                          min: "0",
                          max: "100",
                          step: "1",
                          value: String(skin.frost),
                          disabled: !skin.enabled || skin.bgMode !== "wallpaper",
                          onChange: (event) => setFrost(Number(event.target.value)),
                        }),
                        jsx("span", { children: `${skin.frost}px` }),
                      ],
                    }),
                    jsx("button", {
                      type: "button",
                      className: "dshDesktopSettingsButton",
                      disabled:
                        !skin.enabled ||
                        skin.bgMode !== "wallpaper" ||
                        skin.frost === DEFAULT_FROST,
                      onClick: () => setFrost(DEFAULT_FROST),
                      children: t("reset"),
                    }),
                  ],
                }),
                jsx("p", {
                  className: "dshDesktopSettingsHint",
                  children: t(skin.bgMode === "wallpaper" ? "frostHint" : "frostDesktopHint"),
                }),
              ],
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
          setFrost,
          setEnabled,
          setPanels,
          setDeep,
          setBgMode,
          setBgImage,
          clearBgImage,
          getState,
          subscribe,
          reset: () => setTint(""),
          resetAll: () => {
            setTint("");
            setPanels(true);
            setDeep(false);
            setEnabled(true);
            setBgMode("desktop");
            setFrost(DEFAULT_FROST);
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
        applyBgInline();
        applyFrostInline();
        expose();
        const body = document.body;
        const root = document.documentElement;
        console.info(
          `[dsh-vibrancy-skin] applied — enabled ${state.enabled}, sidebar panels ${state.panels}, deep glass ${state.deep}, tint ${state.tint}, frost ${state.frost}px, theme ${body && body.dataset.dsDarkTheme !== undefined ? "dark" : "light"}, platform ${(root && root.dataset.platform) || "n/a"}, material ${(root && root.dataset.nextMaterial) || "n/a"}`,
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
    applyBgInline();
    applyFrostInline();
    restoreBgImage();

    exports.inject = ["slots", "locale"];
    exports.apply = apply;
    return module.exports;
  },
});
