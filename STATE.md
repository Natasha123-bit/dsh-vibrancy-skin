# STATE — dsh-vibrancy-skin install

**Install time:** 2026-09-28 03:28, redeployed **04:14** as **v1.2.0** (+0800)
**Source of truth:** this directory. The copy under `~/.dsh/profiles/desktop/node_modules/dsh-vibrancy-skin/` is a deployment, never edited directly.

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
| `~/.dsh/profiles/desktop/node_modules/dsh-vibrancy-skin/{package.json,index.js,client.js,cordis.patch.yml}` | replaced with this directory's contents (v1.2.0) |
| `~/.dsh/profiles/desktop/package.json` | `dsh.profile.bundles` gains a trailing `"dsh-vibrancy-skin"` (dependencies already had `"*"`) |
| `~/.dsh/profiles/desktop/cordis.patch.yml` | removed the dangling tail pair `- id: vibrancy-skin` / `disabled: true`; the plugin manager later wrote its own `disabled: false` row (no-op, left in place) |
| `~/.dsh/profiles/desktop/.dsh-market/state.json` | `dsh-vibrancy-skin` removed from `disabled` |

## Backups created before the change

```
~/.dsh/profiles/desktop/package.json.bak-20260928-032324
~/.dsh/profiles/desktop/cordis.patch.yml.bak-20260928-032324
~/.dsh/profiles/desktop/package.json.bak              (pre-existing, 02:41)
~/.dsh/profiles/desktop/cordis.patch.yml.bak          (pre-existing, 01:04)
```

## What has been verified

* `node smoke-test.mjs` — **71/71 checks pass** (v1.2.0). Covers the `__ModuleLoader__` contract,
  `apply()` running while `document.body` is still null (`dsh.client.immediately` does exactly
  that), the live tint API, mount state + `document.body` state, both locale dictionaries
  (`zh`/`en`, no missing key), the rendered settings tree (native classes, 3 groups, switch row
  as `role="switch"`, 3 keyboard-accessible radios, current row selected, 0–100 input, reset
  disabled at default), and a property-level audit of the stylesheet.
* `bash verify.sh` — all green: source/installed copies in sync, profile mount state
  consistent, patch row not disabled, package resolves through the profile's own
  `createRequire`, and the manifest satisfies `dsh-client-modules`' validators
  (`dsh.client.platform` string, `exports["./client"]` resolvable, `dsh.bundle.patch` present).
* The mount shape is the one already observed working on 2026-09-28 02:44:05
  (plain `insert`, blobs in `node_modules`, entry in `dsh.profile.bundles`).

### Runtime evidence that the mount is live (2026-09-28 04:01)

The host did two live patch reloads at **04:01:11** and **04:01:14** (+0800). The profile's
`cordis.patch.yml` contains a `- id: vibrancy-skin` row, and a patch row for a missing entry
always logs `patch: entry "vibrancy-skin" not found` (it did, at 01:19:25 / 02:56:33–02:59:16,
before the fix). **No such warning appears after 03:23** — the only remaining warnings are
unrelated (`ui-settings-unarchive-sessions` not found, `llm-deepseek` name mismatch). Therefore
the loader stack really does contain the `vibrancy-skin` entry: the bundle insert worked.
`.dsh-market/state.json` also no longer lists it under `disabled`.

## What is NOT yet verified

**The visual result and the new Settings page.** Neither the frost nor the settings section has
been seen by a human eye yet; the CSS/JS half only reaches the renderer after the boot graph is
refetched by the window.

Steps, in order of least disruption:

1. `Cmd+R` in the DSH Desktop window. If the host already re-resolved its layer stack live
   (`patchReload: live`), this is enough.
2. Otherwise quit and relaunch DSH Desktop.

Then:

* DevTools (`Cmd+Opt+I`) console must show
  `[dsh-vibrancy-skin] applied — enabled true, tint 40%, theme …, material transparent`.
* Settings must list a **磨砂玻璃 / Vibrancy** page right after the built-in **Desktop** page,
  and switching presets must change the pane instantly with no reload.
* `bash verify.sh` must show no new `vibrancy-skin … not found` rows.
* Eyeball the acceptance list in `README.md` §5.

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
