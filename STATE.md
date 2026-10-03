# STATE — dsh-vibrancy-skin install

**Install time:** 2026-09-28 03:28, redeployed **04:14** as v1.2.0, **05:47** as v1.3.0, then
**06:12** as **v1.3.1**, **06:20** as the same 1.3.1 with the temporary diagnostic probe
stripped back out, and **2026-10-02 23:57 (+0800)** as **v1.3.2** (dialog/overlay opacity fix)
**Source of truth:** this directory. `~/.dsh/profiles/desktop/node_modules/dsh-vibrancy-skin`
is a **symlink to this directory**, so an edit here is already the installed copy — there is no
copy step and no second place to keep in sync.

**2026-10-04 migration:** this directory *is* the migration — the plug-in was moved from
`~/Documents/DSH-Default/dsh-vibrancy-skin` to `~/Documents/DSH-Projects/dsh-vibrancy-skin`,
turned into a git repository (`main`, tags `v1.2.0` and `v1.3.2`), and the profile mount was
re-pointed at the new path (old directory kept as a symlink to it). No plugin code changed:
`client.js` md5 is `83db8447697538981563052b27dc951d` before and after. See `CHANGELOG.md`.

**迁移切换后的复验（2026-10-04 03:3x，切换挂载 + 旧目录改软链之后）**
- `node smoke-test.mjs` → 112/112；`bash verify.sh` → 27 ✓ / 0 ✗（§1 源码↔安装逐字节一致、
  §2 `link:/Users/leixiaokang/Documents/DSH-Projects/dsh-vibrancy-skin`、§4 两条解析路径都指向新仓库、
  §6 宿主日志自切换以来 0 条新行、§8 三张 sheet + 弹层快照/规则断言齐全、installed version = 1.3.2）。
- 旧目录 `/Users/leixiaokang/Documents/DSH-Default/dsh-vibrancy-skin` 已 `mv` 到**同一父目录下的隐藏目录**
  `/Users/leixiaokang/Documents/DSH-Default/.dsh-vibrancy-skin-old-20261004-033509`（**不是** `~/` 下——
  2026-10-04 实测校正），原位置改挂软链 → 新仓库（经旧路径读 `client.js` md5 相同）。
- 已知陈旧元数据（**故意不手改**）：profile 的 `pnpm-lock.yaml`、`node_modules/.pnpm/lock.yaml`、
  `node_modules/.package-map.json` 仍写着旧 `link:` 路径。因为旧路径现在是有效软链，即便将来真跑一次
  `pnpm install` 也能解析到同一份代码；手改 lockfile 反而有破坏完整性校验的风险（见 AGENTS.md 规则 1）。

**2026-10-04 复核与文档校正（未改一行插件代码，`client.js` md5 仍为 `83db8447697538981563052b27dc951d`）**
- **用户验收通过**：`Cmd+R` 后 dsh-cost-meter「费用明细」面板实心可读、弹层不透明 → v1.3.2 的弹层修复确认有效；
  README §5「弹层可读性」那两行由 `[ ]` 改 `[x]`（其余 9 条 `[ ]` 保持未勾，属"顺手扫一眼"级别）。
- **计数漂移校正**：文档里 6 处 `verify.sh 25 项` 一律改为 **27 项**（AGENTS.md 文件地图 + 硬规则 2、
  本文件迁移复验段 + v1.3.2 delta、CHANGELOG 迁移段 + v1.3.2 段）。`smoke-test.mjs` 的 112 条本来就是对的。
- **校正取证**（不是凭印象）：① 活体实测 `bash verify.sh | grep -o '✓' | wc -l` = 27，`✗` = 0；
  ② 拆开 `.backup/dsh-vibrancy-skin-pre-migration-v1.3.2-20261004-033509.tar.gz`，其中 `verify.sh`
  与当前**逐检查项完全一致**（`diff` 只多出第 9 行那条自定位注释）→ 27 自 v1.3.2 部署起即成立，
  25 是**加那 2 条断言之前**（v1.3.1 时期）的数，当时忘记 +2。
- **路径校正**：旧目录实际在 `/Users/leixiaokang/Documents/DSH-Default/.dsh-vibrancy-skin-old-20261004-033509`。
- 顺手发现、**未动**（留作待办）：`.backup/LAST_BACKUP_TS` 仍写 `20260928-054614`，未反映 2026-10-04 的迁前备份。

## v1.3.2 delta (fix: dsh-cost-meter's "本会话费用明细" panel rendered fully transparent)

* **Symptom reported by the user (2026-10-02):** opening dsh-cost-meter's new per-conversation
  cost detail panel turned the whole panel transparent — the conversation text behind it bled
  through the numbers, unreadable. The user had already checked that better-sidebar settings were
  not involved, and asked whether it could be fixed from this plugin.
* **Root cause, from the shipped code** (`dsh-cost-meter@1.8.6/lib/client.js`, component `fs()`):
  the entry button and the panel are one React fragment (`e(E, null, button, dialog)`) and the
  panel is an ordinary `<dialog>` in the normal DOM flow — **no portal**, so `showModal()`
  (top-layer paint) does not change CSS inheritance. It paints itself with an INLINE style:

  ```js
  e("dialog", { ref: l, role: "dialog", style: { …, background: "var(--dsw-alias-bg-base,#fff)" } }, …)
  ```

  `--dsw-alias-bg-base` is exactly the token sheets 1/2/3 retint, so the dialog inherited the
  translucent tint (tint was 15% at the time → effectively transparent).
* **Fix (rule 4 in sheet 1):** custom properties are substituted where they are *declared*, and
  upstream declares `--dsw-alias-bg-base`/`-bg-layer-1` on `<body>`
  (`dsh-client-ui-theme`: `body{…bluish-00}` + `body[data-ds-dark-theme]{…bluish-950}`). So the
  sheet now snapshots both on `<body>` (`--dsh-vib-bg-base-solid`, `--dsh-vib-bg-layer-1-solid`)
  and hands them back to overlays on the overlay element itself:

  ```css
  body[<gate>] :is(dialog, [role="dialog"], [role="alertdialog"]) {
    --dsw-alias-bg-base: var(--dsh-vib-bg-base-solid);
    --dsw-alias-bg-layer-1: var(--dsh-vib-bg-layer-1-solid);
  }
  ```

  Deliberate choices: (1) restore the **tokens**, not a hard-coded `background`, so nested cards
  inside the dialog go opaque too; (2) **not scoped to a pane** — a third party may portal the
  dialog to the pane, the title strip or `<body>`, and outside our retint scopes the rule is a
  no-op anyway; (3) it lives in sheet 1, so the master switch still removes it.
* `smoke-test.mjs` gained 3 checks (snapshot taken from the upstream token; the overlay rule
  restores both tokens; the rule is not pane-scoped) → **112/112**. Its `parseRules()` helper is now
  paren-aware when splitting top-level selector lists, because `:is(a, b, c)` contains commas.
* `verify.sh` §8 gained 2 assertions (snapshot present, overlay rule present) and now expects
  version 1.3.2 → **27/27**. (2026-10-04 校正：当时记成 **25/25** 是漏加了这 2 条——25 是加断言**之前**
  的旧值。27 = §1 4 + §2 2 + §3 1 + §4 2 + §5 3 + §6 4 + §8 11。取证：迁前快照
  `.backup/dsh-vibrancy-skin-pre-migration-v1.3.2-20261004-033509.tar.gz` 里的 `verify.sh` 与当前
  逐检查项一致，只多一行自定位注释 → 27 自 v1.3.2 部署起即成立。)
* Also checked for the user: DSH Desktop 2.0.17 / kernel 0.2.0-rc.2 added a **peerDependencies
  compatibility gate** (`evaluatePluginCompatibility` in `dsh-app-boot`). This plugin declares no
  `peerDependencies`, so the gate returns early and passes; adding a range would risk the plugin
  being *rejected* on the next kernel bump, so it is deliberately omitted. README §6 documents the
  rule, the current per-plugin verdicts, and why the 2026-09-29 `0.2.0-rc.1` warnings in
  `.plugin-manager/logs/` are stale.
* **Not yet confirmed by eye:** the user must reload (`Cmd+R`) and reopen the panel once.

## v1.3.1 delta (fix: the visible sidebar is painted by the app's dock, not by the plugin host)

* **Symptom reported by the user after v1.3.0:** with both sidebar switches on, only the top
  strip of better-sidebar looked frosted; the sidebar body stayed opaque.
* **Root cause, measured live** (temporary in-client probe, reports in
  `/tmp/dsh-vibrancy-probe.ndjson`): on this machine dsh-better-sidebar 0.22.0's own host
  `[data-dsh-better-sidebar]` is an **empty, zero-height div** (`rect=[0,1033,1012,0]`); its
  `[data-dsh-panel-host]` carries nothing but the **hidden** bottom workbench
  (`.nArs4W_bottomPanel.nArs4W_bottomPanelHidden`, y beyond the viewport). The sidebar the user
  actually sees is DSH Desktop's **third grid column**, and the opaque surface is the app's own
  dockkit dock:

  ```
  section._tabHost_1s7ij_162._pane_1s7ij_209   bg = rgb(21,21,23) = raw --dsw-alias-bg-base
  dsh-web-frontend index-DUvMhLle.css:
    ._tabHost_1s7ij_162:not(._float_1s7ij_156),._emptyTabHost_1s7ij_143 { background: var(--dsw-alias-bg-base) }
    ._pane_1s7ij_209 { display:flex;flex:1 1 auto;flex-direction:column;min-width:0;min-height:0;overflow:hidden }
  ```

  Measured rects: `[557,32,455,1001]` (1012px-wide window) and `[1012,32,455,1001]`
  (1467px-wide window) — exactly the right-hand column. It is **outside**
  `[data-dsh-better-sidebar]`, which is why retinting only that anchor changed nothing.
* **Fix:** sheets 2 and 3 now retint the token on three anchors —
  (a) `[data-dsh-better-sidebar]` (plugin-owned marker), (b)
  `.dshDesktopRightbarSurface[data-rightbar-col]` (the column root the desktop shell renders as
  `aside.dshDesktopRightbarSurface[data-rightbar-col]`, children = `renderSlot("rightbar", …)`),
  (c) `[data-dockkit-host="dock"]` (the dock cell itself, in case it is ever portaled). Sheet 2
  also forces `background: var(--dsh-vib-pane)` on `[class*="_tabHost_"]`, the dock's tab host.
* The probe also proved the plumbing was otherwise fine: all three `<style>` present,
  `--dsw-alias-bg-base`/`layer-1` resolving to `color-mix(in srgb, #151517 15%, transparent)` at
  the old anchor, 0 iframes, all our rules kept by the parser.
* Version 1.3.1; `verify.sh` §8 now asserts the two extra anchors; `smoke-test.mjs` gained 4
  checks (visible-sidebar anchors + tab-host rule + sheet 3 uses the same anchors).
* **Confirmed by the user** after one `Cmd+R`: 整列磨砂了，已达成我目前的需求 — the whole visible
  column is frosted. The temporary in-client probe used to prove the root cause has since been
  removed from `client.js`; the raw reports are kept at
  `/tmp/dsh-vibrancy-probe.ndjson.done` (242 KB).

## v1.3.0 delta (frosted third-party sidebar, two independent switches)

* Two more stylesheets, each gated by its own switch, both under the master switch:

  | Sheet id | Switch (`localStorage`) | Default | Declares |
  | --- | --- | --- | --- |
  | `dsh-vibrancy-skin-styles` | `enabled` (master) | on | `background`, `--dsh-vib-pane`, `--dsh-vib-tint-strength`, `--dsw-alias-bg-base` |
  | `dsh-vibrancy-skin-panel-styles` | `panels` | **on** | `--dsw-alias-bg-base`, `background` |
  | `dsh-vibrancy-skin-deep-styles` | `deep` | **off** | `--dsw-alias-bg-layer-1` |

* Sidebar scope is `[data-dsh-better-sidebar]` — the **plugin-owned attribute marker** that
  dsh-better-sidebar sets on the host element it appends to `<body>`
  (`src/client/index.tsx:289`), i.e. hash-proof, unlike the CSS-module class names.
* Justification is the plugin author's own contract (`src/client/sidebar.module.css:13-21`):
  every surface consumes the generic `--dsw-alias-*` tokens **so that skins can override
  them**. `--dsw-alias-bg-base` is consumed by `.pane`, the changes view root, the task graph
  and floating windows; `--dsw-alias-bg-layer-1` by the tab strip, bottom workbench and the
  nested cards/inputs (≈25 rules in the shipped bundle).
* Panel level additionally forces `background: var(--dsh-vib-pane)` on
  `[class*="_tabBar"]` / `[class*="_bottomPanel"]` so those two chrome bars are frosted even
  with the deep sheet off. Only the hash **prefix** can change between builds.
* New public API: `setPanels(bool)`, `setDeep(bool)`, `resetAll()`;
  `getState()` gains `panels` / `deep`. Console banner now prints both switches.
* Settings page: 4 groups (Appearance / Sidebar / Strength / Fine tuning), 3 switches. When
  `[data-dsh-better-sidebar]` is absent it shows a notice and the two sidebar switches are
  disabled — the pane keeps working.
* **No dsh-better-sidebar file is touched**, at any level. Failure mode is "the frost does not
  appear", never a crash, never a layout change.

## v1.2.0 delta (settings integration)

* `client.js` now registers a sibling Settings page — **Settings → 磨砂玻璃 / Vibrancy**
  (`settings.section`, `id: "vibrancy"`, `order: 101`, right after the built-in Desktop page).
  It reuses the desktop page's own classes (`dshDesktopSettings*`, installed unconditionally
  by `dsh-plugin-desktop`), so it looks native in both themes:
  enable switch + 3 preset cards (24% / 40% / 62%) + 0–100 fine-tune + reset.
* New public API: `setEnabled(bool)`, `getState()`, `subscribe(fn)`; `setTint` unchanged.
* The stylesheet is now installed in the **factory body** (module materialization, during the
  `immediately` boot prefetch tier) instead of only in `apply()`, so the skin keeps working
  even if `exports.inject = ["slots","locale"]` never saturates.
* `exports.inject = ["slots","locale"]`; `dsh.client.inject` lists the two client module
  names (non-graph entries are skipped silently by `arriveGraphRow`).
* "Disabled" is the **absence of the `<style>` element** — no new body attribute, no 100% tint.
  Removing the stylesheet restores the upstream look exactly, and avoids leaking the window
  material through main-slot panels that do not repaint `--dsw-alias-bg-base`.

## Files changed on disk (outside this directory)

| Path | Change |
| --- | --- |
| `~/.dsh/profiles/desktop/node_modules/dsh-vibrancy-skin` | **symlink** to this directory — writing here deploys instantly. **2026-10-04 迁移**：插件源码由 `~/Documents/DSH-Default/dsh-vibrancy-skin` 搬到 `~/Documents/DSH-Projects/dsh-vibrancy-skin`（本仓库），该软链已重指到新路径；旧目录留成指向新路径的软链 |
| `~/.dsh/profiles/desktop/package.json` | `dsh.profile.bundles` gains a trailing `"dsh-vibrancy-skin"`; `dependencies` 原为 `"link:/Users/leixiaokang/Documents/DSH-Default/dsh-vibrancy-skin"`，2026-10-04 改为 `"link:/Users/leixiaokang/Documents/DSH-Projects/dsh-vibrancy-skin"` |
| `~/.dsh/profiles/desktop/cordis.patch.yml` | removed the dangling tail pair `- id: vibrancy-skin` / `disabled: true`; the plugin manager later wrote its own `disabled: false` row (no-op, left in place) |
| `~/.dsh/profiles/desktop/.dsh-market/state.json` | `dsh-vibrancy-skin` removed from `disabled` |

## Backups created before the change

```
<this dir>/.backup/LAST_BACKUP_TS                       -> 20260928-054614
<this dir>/.backup/v1.2.0-20260928-054614/              full source snapshot (9 files)
<this dir>/.backup/dsh-vibrancy-skin-v1.2.0-20260928-054614.tar.gz   23 KB, the real rollback point
<this dir>/.backup/profile-20260928-054614/{package.json,cordis.patch.yml}
<this dir>/.backup/installed-v1.2.0-20260928-054614     SYMLINK — NOT a rollback point
~/.dsh/profiles/desktop/{package.json,cordis.patch.yml}.bak-20260928-032324
~/.dsh/profiles/desktop/{package.json,cordis.patch.yml}.bak   (pre-existing, 02:41 / 01:04)
```

## What has been verified

* `node smoke-test.mjs` — **109/109 checks pass** (v1.3.1). Covers the `__ModuleLoader__`
  contract, `apply()` running while `document.body` is still null (`dsh.client.immediately`
  does exactly that), the live tint API, all three sheets (installed/removed per switch,
  persisted across a fresh boot, gated by the master), the sidebar switches
  (`setPanels`/`setDeep` each move only their own sheet; banner reports both), mount state,
  both locale dictionaries (`zh`/`en`, no missing key), the rendered settings tree (native
  classes, 4 groups, 3 switches with the right defaults and disabled state, 3
  keyboard-accessible radios, current row selected, 0–100 input, reset disabled at default,
  "sidebar missing" notice path), and a rule-by-rule audit of **all three** stylesheets
  (every selector carries the darwin+transparent scope, material-only declarations, no
  `backdrop-filter`, no layout property, balanced braces).
* `bash verify.sh` — all green (8 sections): source == installed (it is a symlink), profile
  mount state consistent, patch row not disabled, package resolves through the profile's own
  `createRequire`, the manifest satisfies `dsh-client-modules`' validators, no new host-log
  rows, and the deployed client half carries all three sheet ids, all three sidebar anchors
  (`[data-dsh-better-sidebar]`, `.dshDesktopRightbarSurface[data-rightbar-col]`,
  `[data-dockkit-host="dock"]`), the `[class*="_tabHost_"]` rule, and no `backdrop-filter:`
  declaration.
* The mount shape is the one already observed working on 2026-09-28 02:44:05
  (plain `insert`, package resolvable, entry in `dsh.profile.bundles`).

### Runtime evidence that the mount is live (2026-09-28 04:01)

The host did two live patch reloads at **04:01:11** and **04:01:14** (+0800). The profile's
`cordis.patch.yml` contains a `- id: vibrancy-skin` row, and a patch row for a missing entry
always logs `patch: entry "vibrancy-skin" not found` (it did, at 01:19:25 / 02:56:33–02:59:16,
before the fix). **No such warning appears after 03:23** — the only remaining warnings are
unrelated (`ui-settings-unarchive-sessions` not found, `llm-deepseek` name mismatch). Therefore
the loader stack really does contain the `vibrancy-skin` entry: the bundle insert worked.
`.dsh-market/state.json` also no longer lists it under `disabled`.

## Confirmed working (2026-09-28 06:15, by the user's own eyes)

After the v1.3.1 anchor fix and one `Cmd+R`, the user reported:

> 整列磨砂了，已达成我目前的需求

That closes the last open question: with both sidebar switches on, the whole third column (the
visible dsh-better-sidebar UI) is frosted, in the same material as the conversation pane. The
causation is also pinned down, not just the outcome — see the v1.3.1 delta and the probe
evidence in `/tmp/dsh-vibrancy-probe.ndjson.done` (242 KB, kept as a record; the collector
script `/tmp/dsh-probe-server.py` and the temporary probe inside `client.js` have been
**removed**, so the shipped client half is probe-free).

Nothing about the fix depends on the probe: the probe was read-only diagnostics that wrote to
`localStorage` + a loopback beacon. Its removal changed `client.js` (md5
`9ce04cf397b49e587d9875ab2bff72f3`), and the file still passes `node --check`,
`node smoke-test.mjs` (109/109) and `bash verify.sh` (23 green checks).

## What is NOT verified automatically

The visual result is confirmed by a human, not by a test — the remaining automated gap is that
the CSS rules cannot be matched against a live sidebar DOM in CI. What *is* locked in is the
rule text (all three anchors, material-only declarations, no `backdrop-filter`, no layout
property) and the switch wiring.

Known limits, recorded for later:

* If the sidebar is ever dragged to a column other than the third one (e.g. a bottom dock or a
  floating window), the anchors may not cover it; the failure mode is "no frost", never a
  crash. Adding one anchor selector is the whole fix.
* Only a dark theme has been looked at with the sidebar levels on.

## How to undo

```bash
bash rollback.sh          # unmount + delete the package; profile files backed up first
bash rollback.sh --keep   # unmount but keep the files
```

Worst case, if the app will not start at all (it should — everything above is statically
validated — the fix is three edits): delete `"dsh-vibrancy-skin"` from
`dsh.profile.bundles` in `~/.dsh/profiles/desktop/package.json`, and remove the package
directory. The stylesheet cannot break the boot on its own: it is served to the renderer
only after the host half has already loaded successfully.

## Design invariants (do not relax)

1. No `backdrop-filter` anywhere — upstream states Chromium cannot blur the transparent
   vibrancy window; in-window blur paints uniform grey fog.
2. Material only — the stylesheet declares `background` and three custom properties, and
   nothing else. Layout is untouched by construction.
3. The tint is cycle-free — built from `--dsw-static-neutral-bluish-00/950`, never from
   `--dsw-alias-bg-base` (self-reference would blank the pane).
4. Everything is scoped to `body[data-dsh-desktop-platform="darwin"][data-dsh-desktop-material="transparent"]`
   so any failure degrades to the upstream opaque look instead of an unreadable window.
5. Third-party plugins are never modified, not even their shipped CSS. Only two things may be
   relied upon: (a) the plugin-owned attribute markers it writes itself
   (`[data-dsh-better-sidebar]`), and (b) the generic `--dsw-alias-*` tokens its author
   documents as the skin extension point. Hashed class names may only be used as
   `[class*="_localName"]`, where a miss costs a missed tint and nothing else.
6. Every switch is the presence/absence of a `<style>` element. No switch may be implemented by
   a "neutral" value of a live style, because that leaves a half-applied state behind.
