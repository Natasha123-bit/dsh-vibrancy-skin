window.__ModuleLoader__.load({
  id: "dsh-vibrancy-skin",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    const react = require("react");
    const { jsx, jsxs } = require("react/jsx-runtime");

    const STYLE_ID = "dsh-vibrancy-skin-styles";
    const NS = "dsh-vibrancy-skin";

    const CSS_CONTENT = `
/* ==========================================================================
   dsh-vibrancy-skin — macOS native vibrancy for the DSH Desktop main pane
   --------------------------------------------------------------------------
   HOW THE FROST IS PRODUCED
     dsh-plugin-desktop already creates the window with
         { transparent: true, vibrancy: "sidebar", visualEffectState: "followWindow" }
     whenever macosMaterial = "transparent" (see lib/electron-runtime-*.js).
     That is a real NSVisualEffectView behind the whole window. The only
     reason the right-hand conversation pane is NOT frosted today is a CSS
     decision made upstream: ".dshDesktopConversationSurface { background:
     var(--dsw-alias-bg-base) }" — one fully opaque layer.

     So this stylesheet does not blur anything itself. It removes that
     opaque layer and leaves a readable tint in its place.

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
     4. Everything is scoped to body[data-dsh-desktop-platform="darwin"]
        [data-dsh-desktop-material="transparent"], so the plugin is inert on
        every other platform / material setting and falls back cleanly to
        the upstream look.

   TUNABLING
     One knob: --dsh-vib-tint-strength (below), also exposed in
     Settings -> 磨砂玻璃 / Vibrancy. Lower = more frost, less text contrast.
     Higher = closer to the original opaque pane.
   ========================================================================== */

/* --- 1. Tint -------------------------------------------------------------
   Light and dark are separate rules because the palette is expressed as
   theme-invariant static tokens; body[data-ds-dark-theme] is the only
   switch upstream uses for dark mode. */
body[data-dsh-desktop-platform="darwin"][data-dsh-desktop-material="transparent"] {
  --dsh-vib-tint-strength: 40%;
  --dsh-vib-pane: color-mix(
    in srgb,
    var(--dsw-static-neutral-bluish-00, #fff) var(--dsh-vib-tint-strength),
    transparent
  );
}

body[data-dsh-desktop-platform="darwin"][data-dsh-desktop-material="transparent"][data-ds-dark-theme] {
  --dsh-vib-pane: color-mix(
    in srgb,
    var(--dsw-static-neutral-bluish-950, #151517) var(--dsh-vib-tint-strength),
    transparent
  );
}

/* --- 2. Main pane --------------------------------------------------------
   --dsw-alias-bg-base is the one token upstream uses for EVERY opaque layer
   inside the conversation pane. Grep of the shipped client bundles shows its
   complete blast radius: ConversationRoot root, the composer fade-out seat,
   attachment cards/thumbs/editor, sticky table rows, ask-question and
   inspect cards. Re-pointing it here turns all of them into one consistent
   translucency, and because custom properties inherit, the whole subtree
   follows — including whatever panel the main slot is currently showing.

   The pane itself is set transparent on purpose: the active panel paints the
   tint, so the frost is exactly one layer deep instead of two stacked
   semi-transparent layers (which would silently double the opacity). */
body[data-dsh-desktop-platform="darwin"][data-dsh-desktop-material="transparent"] .dshDesktopConversationSurface {
  background: transparent !important;
  --dsw-alias-bg-base: var(--dsh-vib-pane);
}

/* --- 3. Title bar strip --------------------------------------------------
   Keeps its upstream 'background: var(--dsw-alias-bg-base)' declaration and
   its '-webkit-app-region: drag'; it only needs the tint so the top 32px
   does not become a different shade from the pane below it. */
body[data-dsh-desktop-platform="darwin"][data-dsh-desktop-material="transparent"] .dshDesktopMacCaptionRow {
  --dsw-alias-bg-base: var(--dsh-vib-pane);
}

/* Deliberately NOT touched:
   .dshDesktopSidebarSurface  — already transparent upstream; this is the
                                reference look the pane is matching.
   .dshDesktopRightbarSurface — host of third-party panels (better-sidebar);
                                it paints nothing itself, and forcing a tint
                                on other plugins' UI would be a layout-level
                                intrusion we do not want.
   Menus / popovers / inputs  — they resolve --dsw-specific-menu and
                                --dsw-specific-input-major, which derive from
                                the static palette and are unaffected by the
                                scoped --dsw-alias-bg-base override. They stay
                                opaque and readable.
*/
`;

    /* =====================================================================
       Locale
       ===================================================================== */

    const zh = {
      nav: "磨砂玻璃",
      title: "磨砂玻璃",
      intro: "调节会话面板的玻璃强度。所有改动立即生效，不需要重启，也不需要打开控制台。",
      appearanceTitle: "外观",
      appearanceIntro: "把不透明的会话面板换成一层半透明染色，让窗口背后的桌面透出来。",
      enable: "启用磨砂玻璃",
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
      inactive: "当前窗口没有启用玻璃背景：请在「桌面」页把材质设为「玻璃背景」，且仅在 macOS 上生效。",
    };

    const en = {
      nav: "Vibrancy",
      title: "Vibrancy",
      intro: "Tune the glass strength of the conversation pane. Changes apply instantly — no restart and no console needed.",
      appearanceTitle: "Appearance",
      appearanceIntro: "Replaces the opaque conversation pane with a translucent tint so the desktop behind the window shows through.",
      enable: "Enable vibrancy",
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
      inactive: "This window does not use a glass background: set Material to “Glass background” on the Desktop page (macOS only).",
    };

    /* =====================================================================
       State (single source of truth for both the stylesheet and the UI)
       ===================================================================== */

    const TINT_KEY = "dsh-vibrancy-skin:tint";
    const ENABLED_KEY = "dsh-vibrancy-skin:enabled";
    const DEFAULT_TINT = "40%";

    const PRESETS = [
      { id: "frost", tint: "24%", title: "presetFrostTitle", body: "presetFrostBody" },
      { id: "balanced", tint: DEFAULT_TINT, title: "presetBalancedTitle", body: "presetBalancedBody" },
      { id: "solid", tint: "62%", title: "presetSolidTitle", body: "presetSolidBody" },
    ];

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
      tint: normalizeTint(readStore(TINT_KEY)) ?? DEFAULT_TINT,
    };

    const listeners = new Set();
    let snapshot = null;

    function getState() {
      if (snapshot === null) {
        snapshot = Object.freeze({
          enabled: state.enabled,
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
       Stylesheet + tint plumbing
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

    function installStylesheet() {
      const host = document.head || document.documentElement;
      if (!host) return false;
      if (document.getElementById(STYLE_ID) !== null) return true;
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = CSS_CONTENT;
      host.appendChild(style);
      return true;
    }

    function removeStylesheet() {
      const style = document.getElementById(STYLE_ID);
      if (style !== null) style.remove();
    }

    /* The "enabled" switch is the presence of the stylesheet. Removing it
       restores the upstream look exactly, with zero extra CSS: forcing a
       100% tint instead would leave .dshDesktopConversationSurface
       transparent while only the conversation panel repaints, so any other
       main-slot panel would leak the window material. */
    function syncStylesheet() {
      if (state.enabled) installStylesheet();
      else removeStylesheet();
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
      syncStylesheet();
      applyTintInline();
      emit();
      console.info(`[dsh-vibrancy-skin] enabled = ${state.enabled}`);
      return state.enabled;
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

    function SkinToggle({ t, checked, onChange }) {
      const labelId = react.useId();
      return jsxs("div", {
        className: "dshDesktopSettingsToggleRow",
        children: [
          jsx("span", { className: "dshDesktopSettingsToggleLabel", id: labelId, children: t("enable") }),
          jsx("button", {
            type: "button",
            role: "switch",
            className: "dshDesktopSettingsToggle",
            "aria-checked": checked,
            "aria-labelledby": labelId,
            onClick: () => onChange(!checked),
            children: jsx("span", { className: "dshDesktopSettingsToggleKnob", "aria-hidden": "true" }),
          }),
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

      const active =
        document.body !== null &&
        document.body.dataset.dshDesktopPlatform === "darwin" &&
        document.body.dataset.dshDesktopMaterial === "transparent";

      return jsxs("div", {
        className: "dshDesktopSettings",
        children: [
          jsxs("header", {
            className: "dshDesktopSettingsHeader",
            children: [jsx("h2", { children: t("title") }), jsx("p", { children: t("intro") })],
          }),
          !active &&
            jsx("p", { className: "dshDesktopSettingsNotice", children: t("inactive") }),
          jsxs("section", {
            className: "dshDesktopSettingsGroup",
            "aria-labelledby": "dsh-vibrancy-appearance-title",
            children: [
              jsx("div", {
                children: [
                  jsx("h3", { id: "dsh-vibrancy-appearance-title", children: t("appearanceTitle") }),
                  jsx("p", { className: "dshDesktopSettingsGroupIntro", children: t("appearanceIntro") }),
                ],
              }),
              jsx(SkinToggle, { t, checked: skin.enabled, onChange: (next) => setEnabled(next) }),
            ],
          }),
          jsxs("section", {
            className: "dshDesktopSettingsGroup",
            "aria-labelledby": "dsh-vibrancy-strength-title",
            children: [
              jsx("div", {
                children: [
                  jsx("h3", { id: "dsh-vibrancy-strength-title", children: t("strengthTitle") }),
                  jsx("p", { className: "dshDesktopSettingsGroupIntro", children: t("strengthIntro") }),
                ],
              }),
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
            ],
          }),
          jsxs("section", {
            className: "dshDesktopSettingsGroup",
            "aria-labelledby": "dsh-vibrancy-fine-title",
            children: [
              jsx("div", {
                children: [
                  jsx("h3", { id: "dsh-vibrancy-fine-title", children: t("fineTitle") }),
                  jsx("p", { className: "dshDesktopSettingsGroupIntro", children: t("fineIntro") }),
                ],
              }),
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
          getState,
          subscribe,
          reset: () => setTint(""),
        };
      } catch {}
    }

    function apply(ctx) {
      /* The stylesheet is already installed by the factory body below; this
         is just a reconciliation in case the stylesheet was claimed and
         removed by a module reload. */
      syncStylesheet();

      whenBodyReady(() => {
        applyTintInline();
        expose();
        const body = document.body;
        console.info(
          `[dsh-vibrancy-skin] applied — enabled ${state.enabled}, tint ${state.tint}, theme ${body && body.dataset.dsDarkTheme !== undefined ? "dark" : "light"}, material ${(body && body.dataset.dshDesktopMaterial) || "n/a"}`,
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
        removeStylesheet();
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
    syncStylesheet();
    applyTintInline();

    exports.inject = ["slots", "locale"];
    exports.apply = apply;
    return module.exports;
  },
});
