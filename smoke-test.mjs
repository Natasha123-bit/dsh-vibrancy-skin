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
 *   6. all three stylesheets still declare material properties only.
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
      ? { dsDarkTheme: "", dshDesktopMaterial: "transparent", dshDesktopPlatform: "darwin" }
      : {},
    style: style(),
  };

  const document = {
    readyState: withBody ? "interactive" : "loading",
    head: { appendChild: (el) => headChildren.push(el) },
    documentElement: { appendChild: (el) => headChildren.push(el) },
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
  check("4 groups", nodes.filter((n) => classNameOf(n) === "dshDesktopSettingsGroup").length === 4);
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
  const list = nodes.find(
    (n) => classNameOf(n) === "dshDesktopSettingsList" && n.props.role === "radiogroup",
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
    "rows render as keyboard-accessible radios",
    radios.length === 3 &&
      radios.every(
        (r) => r.props.tabIndex === 0 && r.props["data-actionable"] === "true" && typeof r.props.onKeyDown === "function",
      ),
    `${radios.length} radio(s)`,
  );
  check("preset titles/bodies resolved through t()", choices[0].props.title === dict.presetFrostTitle && choices[0].props.body === dict.presetFrostBody);
  const input = byClass(tree, "dshDesktopSettingsInput");
  check("number input present with 0–100 bounds", input?.props?.type === "number" && input.props.min === "0" && input.props.max === "100");
  check("number input shows the current value", input?.props?.value === "40");
  const button = byClass(tree, "dshDesktopSettingsButton");
  check("reset button present and disabled at the default", button?.props?.disabled === true);
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
  env.body.dataset.dshDesktopMaterial = "off";
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
    'body[data-dsh-desktop-platform="darwin"][data-dsh-desktop-material="transparent"]';

  const parseRules = (css) => {
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
  };

  const auditSheet = (label, css, allowed) => {
    const { stripped, rules } = parseRules(css);
    check(
      `${label}: every selector is scoped to darwin + material=transparent`,
      rules.length > 0 &&
        rules.every((r) => r.selectors.every((s) => s.startsWith(WINDOW_SCOPE))),
      `${rules.length} rule(s)`,
    );
    const props = [
      ...new Set(rules.flatMap((r) => [...r.body.matchAll(/([a-zA-Z-][a-zA-Z0-9-]*)\s*:\s/g)].map((m) => m[1]))),
    ].sort();
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
    panel.textContent.includes(".dshDesktopRightbarSurface[data-rightbar-col]"),
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
    "sheet 1 snapshots the upstream opaque layers on <body> (before any retint)",
    /--dsh-vib-bg-base-solid:\s*var\(--dsw-alias-bg-base\)/.test(core.textContent) &&
      /--dsh-vib-bg-layer-1-solid:\s*var\(--dsw-alias-bg-layer-1\)/.test(core.textContent),
  );
  check(
    "sheet 1 restores the opaque sheet for dialog-like overlays",
    /:is\(dialog,\s*\[role="dialog"\],\s*\[role="alertdialog"\]\)\s*\{[\s\S]*?--dsw-alias-bg-base:\s*var\(--dsh-vib-bg-base-solid\)/.test(
      core.textContent,
    ),
  );
  check(
    "the overlay restore is not scoped to one pane (portals may move the dialog)",
    /^body\[data-dsh-desktop-platform="darwin"\]\[data-dsh-desktop-material="transparent"\] :is\(dialog/m.test(
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
      deep.textContent.includes(".dshDesktopRightbarSurface[data-rightbar-col]") &&
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

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
