/**
 * Smoke test for the dsh-vibrancy-skin client half.
 *
 * The browser half is a plain script that talks to `window.__ModuleLoader__`,
 * so it can be executed against a minimal DOM stub plus a minimal React stub.
 * This proves, without a browser and without restarting DSH Desktop:
 *
 *   1. the module registers, exports `apply`, and declares its cordis deps;
 *   2. the stylesheets are installed at materialization — i.e. during the
 *      `dsh.client.immediately` prefetch tier, before React mounts, and even
 *      if `apply()` is never called;
 *   3. `apply()` survives head parsing (document.body === null);
 *   4. the tint/enabled/sidebar state machine persists and re-applies correctly;
 *   5. the settings section is registered on the native `settings.section`
 *      slot with a native-shaped, fully localized element tree;
 *   6. all stylesheets still declare material properties only — including the
 *      opt-in background-image sheet, which is audited separately because it
 *      legitimately uses `position`/`inset`/`filter` (a decoration layer, not
 *      a material retint);
 *   7. the v1.5.0 background-image state machine (bgMode / bgUrl / sheet 4)
 *      installs, persists, revokes object URLs and degrades without IndexedDB.
 *
 * Run: node smoke-test.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(join(here, "client.js"), "utf8");

let failures = 0;
const check = (label, cond, extra = "") => {
  console.log(`  ${cond ? "✓" : "✗"} ${label}${extra ? `  ${extra}` : ""}`);
  if (!cond) failures += 1;
};

/** Minimal React stub: enough to execute the section component once. */
function makeReact() {
  const slots = [];
  let cursor = 0;
  const api = {
    useState: (init) => {
      const i = cursor++;
      if (slots[i] === undefined) slots[i] = typeof init === "function" ? init() : init;
      return [
        slots[i],
        (value) => {
          slots[i] = typeof value === "function" ? value(slots[i]) : value;
        },
      ];
    },
    useRef: (init) => {
      const i = cursor++;
      if (slots[i] === undefined) slots[i] = { current: init };
      return slots[i];
    },
    useEffect: () => {},
    useId: () => "dsh-vibrancy-test-id",
    useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot(),
    createElement: () => ({}),
  };
  return {
    module: api,
    beginRender() {
      cursor = 0;
    },
  };
}

const jsxRuntime = {
  jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
  jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
  Fragment: Symbol("Fragment"),
};

/** Minimal DOM stub. `withBody` controls whether <body> exists yet. */
function makeEnv({ withBody }) {
  const listeners = new Map();
  const headChildren = [];
  const props = new Map();

  const style = () => ({
    setProperty: (k, v) => props.set(k, v),
    removeProperty: (k) => props.delete(k),
    getPropertyValue: (k) => props.get(k) ?? "",
  });

  const body = {
    dataset: withBody
      ? { dsDarkTheme: "" }
      : {},
    style: style(),
  };

  const document = {
    readyState: withBody ? "interactive" : "loading",
    head: { appendChild: (el) => headChildren.push(el) },
    /* DSH NEXT announces the window on <html>: lib/preload-app.cjs sets
       documentElement.dataset.platform and ...dataset.nextMaterial. */
    documentElement: {
      dataset: { platform: "darwin", nextMaterial: "transparent" },
      appendChild: (el) => headChildren.push(el),
    },
    body: withBody ? body : null,
    getElementById: (id) => headChildren.find((el) => el.id === id) ?? null,
    /* Pretend dsh-better-sidebar is mounted; one section overrides this back
       to null to prove the "sidebar missing" path. */
    querySelector: () => ({ present: true }),
    createElement: () => {
      const el = { id: "", textContent: "", remove: () => headChildren.splice(headChildren.indexOf(el), 1) };
      return el;
    },
    addEventListener: (type, fn) => listeners.set(type, fn),
  };

  const store = new Map();
  const localStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
  };

  const logs = [];
  const console = { info: (...a) => logs.push(a.join(" ")), error: (...a) => logs.push("ERR " + a.join(" ")) };

  const react = makeReact();
  const requires = [];
  const requireFn = (spec) => {
    requires.push(spec);
    if (spec === "react") return react.module;
    if (spec === "react/jsx-runtime") return jsxRuntime;
    throw new Error(`unexpected require("${spec}")`);
  };

  let loaded = null;
  const window = {
    __ModuleLoader__: { load: (spec) => { loaded = spec; } },
  };

  new Function("window", "document", "localStorage", "console", SRC)(
    window,
    document,
    localStorage,
    console,
  );

  return {
    loaded,
    win: window,
    document,
    listeners,
    headChildren,
    logs,
    body,
    props,
    store,
    react,
    requires,
    requireFn,
    /** materialize <body> the way the real parser does, then fire DOMContentLoaded */
    attachBody() {
      this.document.body = body;
      this.document.readyState = "interactive";
      this.listeners.get("DOMContentLoaded")?.();
    },
    /** load the module (factory body runs = materialization) and return exports */
    module() {
      return this.loaded.factory(this.requireFn);
    },
  };
}

/** React stub used while expanding function components (set before rendering). */
let CURRENT_REACT = null;

/** Walk a jsx tree, expanding function components (with their own hooks). */
function walk(node, out = [], react = null) {
  const rt = react ?? CURRENT_REACT;
  if (node === null || node === undefined || typeof node === "boolean") return out;
  if (Array.isArray(node)) {
    for (const child of node) walk(child, out, react);
    return out;
  }
  if (typeof node !== "object") return out;
  if (node.props === undefined) return out;
  out.push(node);
  if (typeof node.type === "function" && rt) {
    rt.beginRender();
    walk(node.type(node.props), out, rt);
    return out;
  }
  walk(node.props.children, out, rt);
  return out;
}

const classNameOf = (node) => node?.props?.className;
const byClass = (tree, className) => walk(tree).find((n) => classNameOf(n) === className);

/** Brace-aware CSS parser shared by the sheet audits (J and M). */
function parseRules(css) {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  /* Top-level comma split only: selectors like
     ':is(dialog, [role="dialog"], [role="alertdialog"])' contain commas that
     must not be mistaken for selector-list separators. */
  const splitSelectors = (text) => {
    const out = [];
    let depth = 0;
    let current = "";
    for (const ch of text) {
      if (ch === "(" || ch === "[") depth += 1;
      else if (ch === ")" || ch === "]") depth -= 1;
      if (ch === "," && depth === 0) {
        out.push(current);
        current = "";
        continue;
      }
      current += ch;
    }
    out.push(current);
    return out.map((s) => s.trim()).filter((s) => s.length > 0);
  };
  const rules = [];
  for (const m of stripped.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    rules.push({ selectors: splitSelectors(m[1]), body: m[2] });
  }
  return { stripped, rules };
}

/** Property names declared anywhere in a rule body, deduped + sorted. */
const declaredProps = (rules) =>
  [
    ...new Set(
      rules.flatMap((r) => [...r.body.matchAll(/([a-zA-Z-][a-zA-Z0-9-]*)\s*:\s/g)].map((m) => m[1])),
    ),
  ].sort();

/** A real-ish ctx stub, recording everything the plugin touches. */
function makeCtx({ missingLocaleKeys }) {
  const calls = {
    localeBind: [],
    localeRegister: [],
    slotInject: [],
    slotRegister: [],
    effects: [],
  };
  const ctx = {
    effect: (fn, label) => {
      calls.effects.push(label);
      return fn() ?? (() => {});
    },
    locale: {
      bind: (ns) => {
        calls.localeBind.push(ns);
        return (key) => {
          if (missingLocaleKeys) missingLocaleKeys.push(key);
          return key;
        };
      },
      register: (ns, dicts) => {
        calls.localeRegister.push({ ns, dicts });
        return () => {};
      },
    },
    slots: {
      inject: (key, callback) => {
        calls.slotInject.push(key);
        callback();
        return () => {};
      },
      register: (options, component) => {
        calls.slotRegister.push({ options, component });
        return () => {};
      },
    },
  };
  return { ctx, calls };
}

console.log("A. registers a module under the package id");
{
  const env = makeEnv({ withBody: false });
  check("__ModuleLoader__.load was called", env.loaded !== null);
  check("id === dsh-vibrancy-skin", env.loaded?.id === "dsh-vibrancy-skin", `got ${JSON.stringify(env.loaded?.id)}`);
  const exported = env.module();
  check("exports.apply is a function", typeof exported.apply === "function");
  check(
    'exports.inject === ["slots","locale"]',
    JSON.stringify(exported.inject) === JSON.stringify(["slots", "locale"]),
    JSON.stringify(exported.inject),
  );
  check("only seed words were required", JSON.stringify(env.requires) === JSON.stringify(["react", "react/jsx-runtime"]), env.requires.join(", "));
}

console.log("B. materialization (prefetch tier) installs the skin without apply()");
{
  const env = makeEnv({ withBody: false });
  env.module();
  check(
    "core sheet injected into <head> by the factory body",
    env.headChildren.length === 2 && env.headChildren[0].id === "dsh-vibrancy-skin-styles",
    env.headChildren.map((e) => e.id).join(", "),
  );
  check("sidebar sheet injected too (on by default)", env.headChildren[1].id === "dsh-vibrancy-skin-panel-styles");
  check("deep sheet stays off until asked for", env.document.getElementById("dsh-vibrancy-skin-deep-styles") === null);
  check("no apply() needed", env.win.dshVibrancySkin === undefined);
  check("body untouched while it does not exist", env.props.size === 0);
}

console.log("C. apply() during head parsing, body not yet parsed");
{
  const env = makeEnv({ withBody: false });
  const exported = env.module();
  const { ctx } = makeCtx({});
  let threw = null;
  try { exported.apply(ctx); } catch (e) { threw = e; }
  check("apply() does not throw with document.body === null", threw === null, threw ? String(threw) : "");
  check("deferred: nothing touched the body yet", env.props.size === 0 && env.win.dshVibrancySkin === undefined);
  check("deferred: DOMContentLoaded listener registered", typeof env.listeners.get("DOMContentLoaded") === "function");
  env.attachBody();
  check(
    "after DOMContentLoaded: no inline override, so the stylesheet's 40% stands",
    env.props.get("--dsh-vib-tint-strength") === undefined,
  );
  check("api exposed after ready", typeof env.win.dshVibrancySkin?.setTint === "function");
  check(
    "console banner reports the effective state",
    env.logs.some((l) => l.includes("[dsh-vibrancy-skin] applied") && l.includes("tint 40%") && l.includes("enabled true")),
    env.logs.at(-1) ?? "",
  );
}

console.log("D. apply() with body already parsed");
{
  const env = makeEnv({ withBody: true });
  const exported = env.module();
  const { ctx } = makeCtx({});
  exported.apply(ctx);
  check("no inline override (stylesheet default applies)", env.props.get("--dsh-vib-tint-strength") === undefined);
  check("api exposed immediately", typeof env.win.dshVibrancySkin?.setTint === "function");
  check("banner fired", env.logs.some((l) => l.includes("[dsh-vibrancy-skin] applied")));
}

console.log("E. setTint() normalizes, overrides, persists");
{
  const env = makeEnv({ withBody: true });
  const exported = env.module();
  exported.apply(makeCtx({}).ctx);
  const api = env.win.dshVibrancySkin;
  check("setTint returns the value", api.setTint("24%") === "24%");
  check("inline custom property set", env.props.get("--dsh-vib-tint-strength") === "24%");
  check("persisted to localStorage", env.store.get("dsh-vibrancy-skin:tint") === "24%");
  check("bare number accepted", api.setTint(37) === "37%");
  check("out of range clamped", api.setTint(180) === "100%");
  check("garbage ignored", api.setTint("how about no") === "100%");
  check("empty means default", api.setTint("") === "40%");
  check("reset clears inline property", env.props.get("--dsh-vib-tint-strength") === undefined);
  check("reset clears localStorage", env.store.get("dsh-vibrancy-skin:tint") === undefined);
  check("getState reports the tint", api.getState().tint === "40%");
}

console.log("F. setEnabled() is the presence of the stylesheet");
{
  const env = makeEnv({ withBody: true });
  const exported = env.module();
  exported.apply(makeCtx({}).ctx);
  const api = env.win.dshVibrancySkin;
  check("enabled by default", api.getState().enabled === true);
  check("stylesheet present", env.document.getElementById("dsh-vibrancy-skin-styles") !== null);
  check("setEnabled(false) returns false", api.setEnabled(false) === false);
  check("stylesheet removed → upstream look restored", env.document.getElementById("dsh-vibrancy-skin-styles") === null);
  check("sidebar sheet is gated by the master switch too", env.document.getElementById("dsh-vibrancy-skin-panel-styles") === null);
  check("persisted off", env.store.get("dsh-vibrancy-skin:enabled") === "0");
  check("setEnabled(true) restores it", api.setEnabled(true) === true && env.document.getElementById("dsh-vibrancy-skin-styles") !== null);
  // a fresh load must honour the stored switch
  const off = makeEnv({ withBody: true });
  off.store.set("dsh-vibrancy-skin:enabled", "0");
  off.module();
  check("a stored off survives the next boot", off.document.getElementById("dsh-vibrancy-skin-styles") === null);
}

console.log("G. settings section is registered natively");
{
  const env = makeEnv({ withBody: true });
  const exported = env.module();
  const { ctx, calls } = makeCtx({});
  exported.apply(ctx);
  check("locale namespace registered once", calls.localeRegister.length === 1 && calls.localeRegister[0].ns === "dsh-vibrancy-skin");
  check(
    "locale dicts carry zh + en",
    Object.keys(calls.localeRegister[0].dicts).join(",") === "zh,en",
    Object.keys(calls.localeRegister[0].dicts).join(","),
  );
  check("locale bound for the nav label", calls.localeBind[0] === "dsh-vibrancy-skin");
  check('injects only the "settings.section" slot', JSON.stringify(calls.slotInject) === JSON.stringify(["settings.section"]));
  const { options, component } = calls.slotRegister[0];
  check("slot name", options.name === "settings.section");
  check("nav id", options.id === "vibrancy");
  check("order 101 (right after the built-in Desktop page at 100)", options.order === 101);
  check("declares its locale namespace so it receives t()", options.locale === "dsh-vibrancy-skin");
  check("label is a function (upstream shape)", typeof options.label === "function");
  check("component is a function", typeof component === "function");
  check("registered inside ctx.effect for reload disposal", calls.effects.length === 1, calls.effects.join(", "));
}

console.log("H. the section renders a native-shaped, localized tree");
{
  const env = makeEnv({ withBody: true });
  const exported = env.module();
  const { ctx, calls } = makeCtx({});
  exported.apply(ctx);
  const { dicts } = calls.localeRegister[0];
  const dict = dicts.zh;
  const missing = [];
  const t = (key) => {
    if (!(key in dict)) missing.push(key);
    return dict[key] ?? key;
  };
  env.react.beginRender();
  const tree = calls.slotRegister[0].component({ t });
  CURRENT_REACT = env.react;
  const nodes = walk(tree);

  check("root uses the native settings shell class", classNameOf(tree) === "dshDesktopSettings");
  check("has a page header", !!byClass(tree, "dshDesktopSettingsHeader"));
  check("5 groups (appearance / background / sidebar / strength / fine-tuning)", nodes.filter((n) => classNameOf(n) === "dshDesktopSettingsGroup").length === 5);
  check("native switch row", !!byClass(tree, "dshDesktopSettingsToggleRow"));
  const toggles = nodes.filter(
    (n) => classNameOf(n) === "dshDesktopSettingsToggle" && n.type === "button",
  );
  const toggle = toggles[0];
  check('switch is a role=switch button', toggle?.type === "button" && toggle?.props?.role === "switch");
  check("switch reflects enabled state", toggle?.props?.["aria-checked"] === true);
  check(
    "3 switches: master + sidebar panels + deep glass",
    toggles.length === 3,
    `${toggles.length} switch(es)`,
  );
  check(
    "sidebar switches default to panels on / deep off",
    toggles[1]?.props?.["aria-checked"] === true && toggles[2]?.props?.["aria-checked"] === false,
  );
  check("sidebar switches are enabled while the skin is on", toggles[1]?.props?.disabled === false);
  check("has a native segmented list", !!byClass(tree, "dshDesktopSettingsList"));
  /* v1.5.0 added a second radiogroup (background desktop/wallpaper) that also
     uses .dshDesktopSettingsList, so pick the strength group by its label id. */
  const list = nodes.find(
    (n) =>
      classNameOf(n) === "dshDesktopSettingsList" &&
      n.props.role === "radiogroup" &&
      n.props["aria-labelledby"] === "dsh-vibrancy-strength-title",
  );
  const choices = list.props.children;
  check("3 preset rows", choices.length === 3);
  check(
    "preset badges are the exposed presets",
    JSON.stringify(choices.map((c) => c.props.badge)) === JSON.stringify(["24%", "40%", "62%"]),
    choices.map((c) => c.props.badge).join(", "),
  );
  check(
    "the current tint is the selected row",
    choices.filter((c) => c.props.selected).length === 1 && choices[1].props.selected === true,
  );
  const radios = nodes.filter((n) => n.props?.role === "radio");
  check(
    "5 radios (3 presets + 2 background modes) are all keyboard-accessible",
    radios.length === 5 &&
      radios.every(
        (r) => r.props.tabIndex === 0 && r.props["data-actionable"] === "true" && typeof r.props.onKeyDown === "function",
      ),
    `${radios.length} radio(s)`,
  );
  check("preset titles/bodies resolved through t()", choices[0].props.title === dict.presetFrostTitle && choices[0].props.body === dict.presetFrostBody);
  const input = byClass(tree, "dshDesktopSettingsInput");
  check("number input present with 0–100 bounds", input?.props?.type === "number" && input.props.min === "0" && input.props.max === "100");
  check("number input shows the current value", input?.props?.value === "40");
  /* The reset button is not the first .dshDesktopSettingsButton any more:
     the background group's pick/replace button comes first. Locate it by its
     localized label instead of weakening the disabled semantics. */
  const buttons = nodes.filter((n) => classNameOf(n) === "dshDesktopSettingsButton");
  const button = buttons.find((n) => n.props.children === dict.reset);
  check(
    "reset button present and disabled at the default",
    !!button && button.props.disabled === true,
    `${buttons.length} button(s)`,
  );
  check("hint line present", !!byClass(tree, "dshDesktopSettingsHint"));
  check("no missing locale key in zh", missing.length === 0, missing.join(", "));
  const missingEn = [];
  const tEn = (key) => {
    if (!(key in dicts.en)) missingEn.push(key);
    return dicts.en[key] ?? key;
  };
  env.react.beginRender();
  calls.slotRegister[0].component({ t: tEn });
  check("no missing locale key in en", missingEn.length === 0, missingEn.join(", "));
  check("no CSS is injected by the section itself", env.headChildren.length === 2);
}

console.log("I. does not touch the body when the window is not frosted");
{
  const env = makeEnv({ withBody: true });
  env.document.documentElement.dataset.nextMaterial = "off";
  const exported = env.module();
  const { ctx, calls } = makeCtx({});
  exported.apply(ctx);
  const { dicts } = calls.localeRegister[0];
  const t = (key) => dicts.zh[key] ?? key;
  env.react.beginRender();
  const tree = calls.slotRegister[0].component({ t });
  check("warns that the material is not transparent", !!byClass(tree, "dshDesktopSettingsNotice"));
}

console.log("J. every stylesheet touches material properties only");
{
  const WINDOW_SCOPE =
    'html[data-platform="darwin"][data-next-material="transparent"]';

  const auditSheet = (label, css, allowed) => {
    const { stripped, rules } = parseRules(css);
    check(
      `${label}: every selector is scoped to darwin + material=transparent`,
      rules.length > 0 &&
        rules.every((r) => r.selectors.every((s) => s.startsWith(WINDOW_SCOPE))),
      `${rules.length} rule(s)`,
    );
    const props = declaredProps(rules);
    check(`${label}: material-only declarations`, JSON.stringify(props) === JSON.stringify(allowed), props.join(", "));
    check(`${label}: no backdrop-filter`, !/backdrop-filter\s*:/.test(stripped));
    check(
      `${label}: no layout property`,
      !/\b(grid-template|width|height|display|position|border-radius|padding|margin|overflow)\s*:/.test(stripped),
    );
    check(`${label}: braces balanced`, (stripped.match(/{/g) || []).length === (stripped.match(/}/g) || []).length);
    return stripped;
  };

  const env = makeEnv({ withBody: true });
  env.module();
  check(
    "materialization installs exactly the two default sheets",
    env.headChildren.length === 2,
    env.headChildren.map((e) => e.id).join(", "),
  );
  const core = env.headChildren[0];
  const panel = env.headChildren[1];
  auditSheet("sheet 1 core", core.textContent, [
    "--dsh-vib-bg-base-solid",
    "--dsh-vib-bg-layer-1-solid",
    "--dsh-vib-pane",
    "--dsh-vib-tint-strength",
    "--dsw-alias-bg-base",
    "--dsw-alias-bg-layer-1",
    "background",
  ]);
  auditSheet("sheet 2 sidebar", panel.textContent, ["--dsw-alias-bg-base", "background"]);
  check(
    "sheet 2 is anchored on the sidebar's own attribute marker, not a class hash",
    panel.textContent.includes("[data-dsh-better-sidebar]"),
  );
  check(
    "sheet 2 reuses the tint variable exported by sheet 1",
    panel.textContent.includes("var(--dsh-vib-pane)"),
  );
  check(
    "sheet 2 also covers the app's third column (visible sidebar lives there)",
    panel.textContent.includes('[class*="_rightbarCol"]'),
  );
  check(
    "sheet 2 also covers the dockkit dock (surface painted by the app's dock)",
    panel.textContent.includes('[data-dockkit-host="dock"]'),
  );
  check(
    "sheet 2 paints the dock tab host explicitly (defends against hash churn)",
    /\[class\*="_tabHost_"\]\s*\{[\s\S]*?background:\s*var\(--dsh-vib-pane\)/.test(
      panel.textContent,
    ),
  );
  check(
    "tint never references --dsw-alias-bg-base (no cycle)",
    !/--dsh-vib-pane:\s*color-mix\([^;]*--dsw-alias-bg-base/.test(core.textContent),
  );
  check(
    "sheet 1 restores dialogs from the static palette, not from the retinted token",
    /--dsh-vib-bg-base-solid:\s*var\(--dsw-static-neutral-bluish-00/.test(core.textContent) &&
      /--dsh-vib-bg-layer-1-solid:\s*var\(--dsw-static-neutral-bluish-00/.test(core.textContent),
  );
  check(
    "sheet 1 has a dark-theme twin for both the tint and the snapshots",
    /\[data-ds-dark-theme\]\s*\{[\s\S]*?--dsh-vib-pane:[\s\S]*?--dsh-vib-bg-base-solid:[\s\S]*?--dsh-vib-bg-layer-1-solid:/.test(
      core.textContent,
    ),
  );
  check(
    "sheet 1 anchors the AppFrame center column and bottom row by stable local name",
    /\[class\*="_centerCol"\]\s*\{[\s\S]*?background:\s*transparent !important;[\s\S]*?--dsw-alias-bg-base:\s*var\(--dsh-vib-pane\)/.test(
      core.textContent,
    ) &&
      /\[class\*="_bottomRow"\]\s*\{[\s\S]*?background:\s*transparent !important;/.test(
        core.textContent,
      ),
  );
  check(
    "sheet 1 leaves the already-translucent upstream surfaces alone (no double tint)",
    (() => {
      const noComments = core.textContent.replace(/\/\*[\s\S]*?\*\//g, "");
      return !/\[class\*="_sidebarCol"\]/.test(noComments) &&
        !/\[class\*="_frame"\]/.test(noComments);
    })(),
  );
  check(
    "no sheet still gates on the retired body-level data-dsh-desktop-* keys",
    ![ core, panel ].some((sheet) =>
      /data-dsh-desktop-/.test(sheet.textContent.replace(/\/\*[\s\S]*?\*\//g, "")),
    ),
  );
  check(
    "the sidebar column is unpainted by us so its dock supplies the single layer",
    /\[class\*="_rightbarCol"\]\s*\{\s*background:\s*transparent !important;/.test(
      panel.textContent,
    ),
  );
  check(
    "sheet 1 restores the opaque sheet for dialog-like overlays",
    /:is\(dialog,\s*\[role="dialog"\],\s*\[role="alertdialog"\]\)\s*\{[\s\S]*?--dsw-alias-bg-base:\s*var\(--dsh-vib-bg-base-solid\)/.test(
      core.textContent,
    ),
  );
  check(
    "the overlay restore is not scoped to one pane (portals may move the dialog)",
    /^html\[data-platform="darwin"\]\[data-next-material="transparent"\] :is\(dialog/m.test(
      core.textContent,
    ),
  );

  const deepEnv = makeEnv({ withBody: true });
  deepEnv.store.set("dsh-vibrancy-skin:deep", "1");
  deepEnv.module();
  const deep = deepEnv.headChildren.find((e) => e.id === "dsh-vibrancy-skin-deep-styles");
  check("sheet 3 installs when deep glass is on", !!deep);
  auditSheet("sheet 3 deep", deep.textContent, ["--dsw-alias-bg-layer-1"]);
  check(
    "sheet 3 only retints the nested surface token",
    !/background\s*:/.test(deep.textContent.replace(/\/\*[\s\S]*?\*\//g, "")),
  );
  check(
    "sheet 3 uses the same three anchors as sheet 2",
    deep.textContent.includes("[data-dsh-better-sidebar]") &&
      deep.textContent.includes('[class*="_rightbarCol"]') &&
      deep.textContent.includes('[data-dockkit-host="dock"]'),
  );
}

console.log("K. the two sidebar switches gate their own sheet");
{
  const env = makeEnv({ withBody: true });
  const exported = env.module();
  exported.apply(makeCtx({}).ctx);
  const api = env.win.dshVibrancySkin;
  const has = (id) => env.document.getElementById(id) !== null;

  check("panel sheet on by default", has("dsh-vibrancy-skin-panel-styles"));
  check("deep sheet off by default", !has("dsh-vibrancy-skin-deep-styles"));
  check(
    "setPanels(false) removes only the sidebar panel sheet",
    api.setPanels(false) === false && !has("dsh-vibrancy-skin-panel-styles") && has("dsh-vibrancy-skin-styles"),
  );
  check("panels choice persisted", env.store.get("dsh-vibrancy-skin:panels") === "0");
  check(
    "setDeep(true) adds only the deep sheet",
    api.setDeep(true) === true && has("dsh-vibrancy-skin-deep-styles") && !has("dsh-vibrancy-skin-panel-styles"),
  );
  check("deep choice persisted", env.store.get("dsh-vibrancy-skin:deep") === "1");
  check(
    "getState reports both switches",
    api.getState().panels === false && api.getState().deep === true,
  );
  check("the master switch still controls everything", api.setEnabled(false) === false && env.headChildren.length === 0);
  check(
    "and restores the stored combination",
    api.setEnabled(true) === true && has("dsh-vibrancy-skin-deep-styles") && !has("dsh-vibrancy-skin-panel-styles"),
  );
  check(
    "console banner reports both switches",
    env.logs.some((l) => l.includes("[dsh-vibrancy-skin] applied") && l.includes("sidebar panels") && l.includes("deep glass")),
  );

  const fresh = makeEnv({ withBody: true });
  fresh.store.set("dsh-vibrancy-skin:panels", "0");
  fresh.store.set("dsh-vibrancy-skin:deep", "1");
  fresh.module();
  check(
    "stored switches survive the next boot",
    fresh.document.getElementById("dsh-vibrancy-skin-panel-styles") === null &&
      fresh.document.getElementById("dsh-vibrancy-skin-deep-styles") !== null,
  );
}

console.log("L. the sidebar group degrades gracefully without dsh-better-sidebar");
{
  const env = makeEnv({ withBody: true });
  env.document.querySelector = () => null; // plugin not installed
  const exported = env.module();
  const { ctx, calls } = makeCtx({});
  exported.apply(ctx);
  const { dicts } = calls.localeRegister[0];
  const t = (key) => dicts.zh[key] ?? key;
  env.react.beginRender();
  const tree = calls.slotRegister[0].component({ t });
  CURRENT_REACT = env.react;
  const nodes = walk(tree);
  const notices = nodes.filter((n) => classNameOf(n) === "dshDesktopSettingsNotice");
  check(
    "shows the 'sidebar missing' notice",
    notices.some((n) => n.props.children === dicts.zh.sidebarMissing),
  );
  check("still renders all 3 switches", nodes.filter((n) => classNameOf(n) === "dshDesktopSettingsToggle").length === 3);
}

console.log("M. background image: sheet 4, state machine, settings group");
{
  const BG_ID = "dsh-vibrancy-skin-bg-styles";
  const BG_VAR = "--dsh-vib-bg-image";
  const BG_SELECTOR =
    'html[data-platform="darwin"][data-next-material="transparent"] body::before';
  /* The decoration layer legitimately uses position/inset/filter/z-index —
     it must not be run through J's "no layout property" regex. */
  const BG_ALLOWED = [
    "background-image",
    "background-position",
    "background-repeat",
    "background-size",
    "content",
    "filter",
    "inset",
    "pointer-events",
    "position",
    "z-index",
  ];

  /** Deterministic objectURL pair; every call is recorded for revoke checks. */
  const stubObjectUrl = (env) => {
    const created = [];
    const revoked = [];
    let next = 0;
    env.win.URL = {
      createObjectURL(blob) {
        const url = `blob:test-${++next}`;
        created.push({ url, blob });
        return url;
      },
      revokeObjectURL(url) {
        revoked.push(url);
      },
    };
    return { created, revoked };
  };

  const blob = { size: 3, type: "image/png" };

  // (a) default boot: desktop, no picture -> no sheet, no inline property.
  {
    const env = makeEnv({ withBody: true });
    env.module();
    check(
      "bg: a default boot installs no background sheet",
      env.headChildren.length === 2 && env.document.getElementById(BG_ID) === null,
      env.headChildren.map((e) => e.id).join(", "),
    );
    check("bg: a default boot leaves --dsh-vib-bg-image unset", env.props.get(BG_VAR) === undefined);
  }

  // (b) wallpaper without a picture is inert.
  {
    const env = makeEnv({ withBody: true });
    const exported = env.module();
    exported.apply(makeCtx({}).ctx);
    const api = env.win.dshVibrancySkin;
    check("bg: setBgMode('wallpaper') returns the new mode", api.setBgMode("wallpaper") === "wallpaper");
    check("bg: wallpaper without a picture installs no sheet", env.document.getElementById(BG_ID) === null);
    check("bg: getState reports the wallpaper mode", api.getState().bgMode === "wallpaper");
    check("bg: the wallpaper choice is persisted", env.store.get("dsh-vibrancy-skin:bg-mode") === "wallpaper");
    check("bg: wallpaper without a picture keeps the inline property unset", env.props.get(BG_VAR) === undefined);
  }

  // (c)-(f) one session walks the whole picture lifecycle.
  {
    const env = makeEnv({ withBody: true });
    const exported = env.module();
    exported.apply(makeCtx({}).ctx);
    const api = env.win.dshVibrancySkin;
    const urls = stubObjectUrl(env);

    check("bg: setBgImage accepts a blob-shaped file", api.setBgImage(blob, "x.png") === true);
    const sheet = env.document.getElementById(BG_ID);
    check("bg: sheet 4 appears with the expected id", sheet !== null && sheet.id === BG_ID);
    check('bg: body carries the picture as url("blob:...")', env.props.get(BG_VAR) === 'url("blob:test-1")', env.props.get(BG_VAR));
    check(
      "bg: state reports wallpaper mode + the file name",
      api.getState().bgMode === "wallpaper" && api.getState().bgName === "x.png" && api.getState().bgUrl === "blob:test-1",
    );
    check("bg: the mode is persisted as wallpaper", env.store.get("dsh-vibrancy-skin:bg-mode") === "wallpaper");
    check("bg: the file name is persisted", env.store.get("dsh-vibrancy-skin:bg-name") === "x.png");
    check(
      "bg: a second pick revokes the previous object URL",
      api.setBgImage(blob, "y.png") === true && JSON.stringify(urls.revoked) === JSON.stringify(["blob:test-1"]),
      urls.revoked.join(", "),
    );
    check("bg: a second pick swaps the inline URL", env.props.get(BG_VAR) === 'url("blob:test-2")');

    check("bg: setEnabled(false) removes sheet 4", api.setEnabled(false) === false && env.document.getElementById(BG_ID) === null);
    check("bg: setEnabled(false) clears the inline property", env.props.get(BG_VAR) === undefined);
    check(
      "bg: setEnabled(true) restores sheet 4 and the picture",
      api.setEnabled(true) === true &&
        env.document.getElementById(BG_ID) !== null &&
        env.props.get(BG_VAR) === 'url("blob:test-2")',
    );

    check(
      "bg: setBgMode('desktop') removes sheet 4",
      api.setBgMode("desktop") === "desktop" && env.document.getElementById(BG_ID) === null,
    );
    check("bg: setBgMode('desktop') clears the inline property", env.props.get(BG_VAR) === undefined);

    api.setBgImage(blob, "z.png");
    check("bg: clearBgImage removes sheet 4", api.clearBgImage() === true && env.document.getElementById(BG_ID) === null);
    const cleared = api.getState();
    check(
      "bg: clearBgImage resets url/name/mode",
      cleared.bgUrl === null && cleared.bgName === "" && cleared.bgMode === "desktop",
      `bgUrl=${cleared.bgUrl} bgName=${cleared.bgName} bgMode=${cleared.bgMode}`,
    );
    check("bg: clearBgImage revokes the live object URL", urls.revoked.at(-1) === "blob:test-3", urls.revoked.join(", "));
    check(
      "bg: clearBgImage persists the desktop mode and forgets the name",
      env.store.get("dsh-vibrancy-skin:bg-mode") === "desktop" && env.store.get("dsh-vibrancy-skin:bg-name") === "",
    );
  }

  // (g) boot without IndexedDB must stay silent (the stub has none).
  {
    const env = makeEnv({ withBody: true });
    env.store.set("dsh-vibrancy-skin:bg-mode", "wallpaper");
    let threw = null;
    try {
      env.module();
    } catch (error) {
      threw = error;
    }
    check("bg: a wallpaper boot without IndexedDB does not throw", threw === null, threw ? String(threw) : "");
    check(
      "bg: without IndexedDB the sheet stays absent (desktop look, no error)",
      env.headChildren.length === 2 && env.document.getElementById(BG_ID) === null,
    );
  }

  // (h) independent audit of sheet 4 (it is a decoration layer, not a retint).
  {
    const env = makeEnv({ withBody: true });
    const exported = env.module();
    exported.apply(makeCtx({}).ctx);
    stubObjectUrl(env);
    env.win.dshVibrancySkin.setBgImage(blob, "x.png");
    const css = env.document.getElementById(BG_ID).textContent;
    const { stripped, rules } = parseRules(css);
    check("bg sheet: exactly one rule", rules.length === 1, `${rules.length} rule(s)`);
    check(
      "bg sheet: the only selector is the gated body::before layer",
      rules.length === 1 &&
        rules[0].selectors.length === 1 &&
        rules[0].selectors[0] === BG_SELECTOR,
      rules.map((r) => r.selectors.join(" | ")).join(" ; "),
    );
    const props = declaredProps(rules);
    check(
      "bg sheet: declarations stay inside the decoration allowlist",
      props.length > 0 && props.every((p) => BG_ALLOWED.includes(p)),
      props.join(", "),
    );
    check(
      "bg sheet: fixed, inset, z-index -1 (behind the window content)",
      /position:\s*fixed/.test(stripped) && /inset:\s*-64px/.test(stripped) && /z-index:\s*-1/.test(stripped),
    );
    check("bg sheet: pointer-events: none", /pointer-events:\s*none/.test(stripped));
    check("bg sheet: picture blurred at 36px", /filter:\s*blur\(36px\)/.test(stripped));
    check(
      "bg sheet: picture comes from the inline variable, cover/center/no-repeat",
      /background-image:\s*var\(--dsh-vib-bg-image\)/.test(stripped) &&
        /background-size:\s*cover/.test(stripped) &&
        /background-position:\s*center/.test(stripped) &&
        /background-repeat:\s*no-repeat/.test(stripped),
    );
    check("bg sheet: no backdrop-filter", !/backdrop-filter\s*:/.test(stripped));
    check(
      "bg sheet: no layout property beyond the decoration layer",
      !/\b(width|height|display|padding|margin|overflow|border-radius|grid-template)\s*:/.test(stripped),
    );
    check("bg sheet: braces balanced", (stripped.match(/{/g) || []).length === (stripped.match(/}/g) || []).length);
  }

  // (i) settings: the new background group and its three UI states.
  {
    const env = makeEnv({ withBody: true });
    const exported = env.module();
    const { ctx, calls } = makeCtx({});
    exported.apply(ctx);
    const { dicts } = calls.localeRegister[0];
    const dict = dicts.zh;
    const missing = [];
    const t = (key) => {
      if (!(key in dict)) missing.push(key);
      return dict[key] ?? key;
    };
    const missingEn = [];
    const tEn = (key) => {
      if (!(key in dicts.en)) missingEn.push(key);
      return dicts.en[key] ?? key;
    };
    stubObjectUrl(env);

    const render = (translate) => {
      env.react.beginRender();
      CURRENT_REACT = env.react;
      const tree = calls.slotRegister[0].component({ t: translate });
      return { tree, nodes: walk(tree) };
    };

    let { nodes } = render(t);
    const groups = nodes.filter((n) => classNameOf(n) === "dshDesktopSettingsGroup");
    check("bg group: the section now has 5 groups", groups.length === 5, `${groups.length} group(s)`);
    check(
      "bg group: sits between appearance and sidebar",
      groups[1]?.props?.["aria-labelledby"] === "dsh-vibrancy-bg-title" &&
        groups[0]?.props?.["aria-labelledby"] === "dsh-vibrancy-appearance-title" &&
        groups[2]?.props?.["aria-labelledby"] === "dsh-vibrancy-sidebar-title",
    );
    const bgSection = nodes.find(
      (n) =>
        classNameOf(n) === "dshDesktopSettingsGroup" &&
        n.props["aria-labelledby"] === "dsh-vibrancy-bg-title",
    );
    const bgNodes = walk(bgSection);
    const bgList = bgNodes.find(
      (n) => classNameOf(n) === "dshDesktopSettingsList" && n.props["aria-labelledby"] === "dsh-vibrancy-bg-title",
    );
    check("bg group: exposes a radiogroup with two choices", bgList?.props?.role === "radiogroup" && bgList.props.children.length === 2);
    check(
      "bg group: both radio labels resolve through t()",
      bgList.props.children[0].props.title === dict.bgDesktopTitle &&
        bgList.props.children[1].props.title === dict.bgWallpaperTitle,
      bgList.props.children.map((c) => c.props.title).join(", "),
    );
    check(
      "bg group: desktop is the selected mode by default",
      bgList.props.children[0].props.selected === true && bgList.props.children[1].props.selected === false,
    );
    const fileInput = bgNodes.find((n) => n.type === "input");
    check(
      "bg group: a hidden image file input is present",
      fileInput?.props?.type === "file" &&
        fileInput.props.accept === "image/*" &&
        fileInput.props.style?.display === "none",
    );
    check("bg group: no preview while the desktop mode is active", bgNodes.every((n) => classNameOf(n) !== "dshVibrancyBgPreview"));

    // wallpaper without a picture -> bgEmpty hint, still no preview
    env.win.dshVibrancySkin.setBgMode("wallpaper");
    ({ nodes } = render(t));
    const emptyHints = nodes.filter(
      (n) => classNameOf(n) === "dshDesktopSettingsHint" && n.props.children === dict.bgEmpty,
    );
    check("bg group: wallpaper without a picture explains bgEmpty", emptyHints.length === 1);
    check(
      "bg group: wallpaper without a picture keeps the pick button",
      nodes.some(
        (n) => classNameOf(n) === "dshDesktopSettingsButton" && n.props.children === dict.bgPick,
      ),
    );

    // picture picked -> preview img + replace/remove buttons
    env.win.dshVibrancySkin.setBgImage(blob, "x.png");
    ({ nodes } = render(t));
    const preview = nodes.find((n) => classNameOf(n) === "dshVibrancyBgPreview");
    check("bg group: a picked picture renders the preview image", preview?.type === "img" && preview.props.src === "blob:test-1");
    check("bg group: preview alt resolves through t()", preview?.props?.alt === dict.bgPreviewAlt);
    check(
      "bg group: preview inline style stays positional-only",
      JSON.stringify(Object.keys(preview.props.style).sort()) ===
        JSON.stringify(["borderRadius", "display", "maxHeight", "maxWidth", "objectFit"]),
      Object.keys(preview.props.style).join(", "),
    );
    const bgButtons = nodes
      .filter((n) => classNameOf(n) === "dshDesktopSettingsButton")
      .map((n) => n.props.children);
    check(
      "bg group: replace + remove buttons appear once a picture exists",
      bgButtons.includes(dict.bgReplace) && bgButtons.includes(dict.bgRemove),
      bgButtons.join(" | "),
    );

    ({ nodes } = render(tEn));
    check("bg group: no missing locale key in zh", missing.length === 0, [...new Set(missing)].join(", "));
    check("bg group: no missing locale key in en", missingEn.length === 0, [...new Set(missingEn)].join(", "));
  }
}

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
