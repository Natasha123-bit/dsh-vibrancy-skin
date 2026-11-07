#!/usr/bin/env bash
# dsh-vibrancy-skin — one-command verification (read-only, safe to run anytime).
#
# Usage: bash verify.sh
set -uo pipefail

P="$HOME/.dsh/profiles/desktop"
PKG="$P/node_modules/dsh-vibrancy-skin"
# 自定位：脚本所在目录就是源码目录（2026-10-04 迁到 DSH-Projects 后不再写死绝对路径）
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# DSH NEXT writes its host log to ~/.dsh/logs (desktop-next.log + a jsonl twin);
# the old "DSH Desktop/logs/host" location is kept as a fallback for 2.0.17.
LOGDIR="$HOME/.dsh/logs"
[ -d "$LOGDIR" ] || LOGDIR="$HOME/Library/Application Support/DSH Desktop/logs/host"

ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
bad()  { printf '  \033[31m✗\033[0m %s\n' "$1"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$1"; }

echo "== 1. workspace source == installed copy =="
for f in package.json index.js client.js cordis.patch.yml; do
  if [ -f "$SRC/$f" ] && [ -f "$PKG/$f" ] && [ "$(md5 -q "$SRC/$f")" = "$(md5 -q "$PKG/$f")" ]; then
    ok "$f in sync"
  else
    bad "$f out of sync (re-copy from $SRC)"
  fi
done

echo "== 2. profile mount state =="
node -e '
const p = require("'"$P"'/package.json");
const inBundles = p.dsh.profile.bundles.includes("dsh-vibrancy-skin");
const inDeps = Boolean(p.dependencies["dsh-vibrancy-skin"]);
console.log((inBundles ? "\u2713" : "\u2717") + " dsh.profile.bundles entry");
console.log((inDeps ? "\u2713" : "\u2717") + " dependencies entry (\"" + p.dependencies["dsh-vibrancy-skin"] + "\")");
' 2>&1 | sed 's/^/  /'

echo "== 3. profile patch rows for vibrancy-skin =="
# The plugin manager / market writes its own toggle row here. A row with
# 'disabled: false' is a no-op; only 'disabled: true' would unload the plugin.
if grep -qE '^\s*-?\s*id:\s*vibrancy-skin' "$P/cordis.patch.yml"; then
  if grep -A1 -E '^\s*-\s*id:\s*vibrancy-skin' "$P/cordis.patch.yml" | grep -qE '^\s*disabled:\s*true'; then
    bad "toggle row has 'disabled: true' -> the plugin will not load"
  else
    ok "toggle row present, not disabled (manager bookkeeping, harmless)"
  fi
else
  ok "no patch row for vibrancy-skin (bundle insert is the only mount)"
fi

echo "== 4. package resolves from the profile =="
(cd "$P" && node -e '
const { createRequire } = require("module");
const req = createRequire("'"$P"'/package.json");
for (const s of ["dsh-vibrancy-skin","dsh-vibrancy-skin/client"]) {
  try { console.log("\u2713 " + s + " -> " + req.resolve(s)); }
  catch (e) { console.log("\u2717 " + s + " unresolved: " + e.code); }
}' 2>&1 | sed 's/^/  /')

echo "== 5. plugin manifest is acceptable to dsh-client-modules =="
node -e '
const p = require("'"$PKG"'/package.json");
const c = p.dsh.client;
console.log((typeof c.platform === "string" ? "\u2713" : "\u2717") + " dsh.client.platform = " + JSON.stringify(c.platform));
const ex = p.exports["./client"];
const rel = typeof ex === "string" ? ex : ex && ex.default;
console.log((typeof rel === "string" ? "\u2713" : "\u2717") + " exports[\"./client\"] -> " + rel);
console.log((p.dsh.bundle.patch ? "\u2713" : "\u2717") + " dsh.bundle.patch -> " + p.dsh.bundle.patch);
' 2>&1 | sed 's/^/  /'

echo "== 6. host log: plugin-relevant rows =="
# DSH NEXT logs to ~/.dsh/logs/desktop-next.log with ISO-8601 (UTC) stamps, so
# the old "newer than the installed file" filter — which assumed local time —
# no longer applies; the plugin's own rows are simply searched for below.
# The 2.0.17 layout ("DSH Desktop/logs/host/dsh-<date>.log") is still checked
# if it happens to exist.
FOUND_LOG=0
for LOG in "$LOGDIR/desktop-next.log" "$LOGDIR"/dsh-"$(date +%Y-%m-%d)".log; do
  [ -f "$LOG" ] || continue
  FOUND_LOG=1
  N=$(grep -c . "$LOG" 2>/dev/null || true)
  echo "  -- $(basename "$LOG"): $N row(s) on disk"
  grep -E 'vibrancy|client-modules|ClientPackage|boot activation' "$LOG" 2>/dev/null | tail -5 | sed 's/^/       /' || true
  # Match the documented loader warning exactly. A loose "vibrancy-skin.*not
  # found" also hits unrelated host.tools errors that merely quote the repo
  # path ("old_string was not found in .../dsh-vibrancy-skin/client.js").
  if grep -qE 'patch: entry "vibrancy-skin" not found' "$LOG"; then
    bad "mount NOT effective ('patch: entry \"vibrancy-skin\" not found' present)"
  else
    ok "no 'patch entry not found' warning for the plugin"
  fi
  if grep -qE 'ClientPackageCompositionError|FAILED to' "$LOG"; then
    bad "client-modules rejected a package declaration (see rows above)"
  else
    ok "no client-modules composition error"
  fi
done
[ "$FOUND_LOG" -eq 1 ] || ok "no host log on disk yet (nothing recorded, cannot be a failure)"


echo "== 7. HTTP probing is not usable here =="
echo "  /plugins/<pkg>/client.js is token-guarded even on loopback: unauthenticated curl gets 403."
echo "  Real confirmation is the renderer console line:"
echo "    [dsh-vibrancy-skin] applied — enabled true, sidebar panels true, deep glass false,"
echo "                                            tint 40%, theme ..., platform darwin, material transparent"
echo "  (official DeepSeek Harness client: the same line ends with \"material n/a\" — it writes no material key)"
echo "  Open it with Cmd+Opt+I (DSH NEXT: View -> Developer -> Toggle Developer Tools);"
echo "  if the line is absent, the client half was not served."
echo "  UI confirmation: Settings -> 磨砂玻璃 / Vibrancy (a sibling of the built-in 桌面设置 page),"
echo "  with the switches '侧边栏面板磨砂' (default on) and '深层玻璃' (default off)."

echo "== 8. installed client half carries all four sheets =="
for marker in dsh-vibrancy-skin-styles dsh-vibrancy-skin-panel-styles dsh-vibrancy-skin-deep-styles dsh-vibrancy-skin-bg-styles; do
  grep -q "$marker" "$PKG/client.js" && ok "sheet id $marker" || bad "sheet id $marker missing"
done
grep -q 'data-dsh-better-sidebar' "$PKG/client.js" \
  && ok "sidebar scoped to [data-dsh-better-sidebar] (plugin-owned marker, hash-proof)" \
  || bad "sidebar scope anchor missing"
grep -q '\[class\*="_rightbarCol"\]' "$PKG/client.js" \
  && ok "sidebar also scoped to the AppFrame's rightbar column (where the visible dock lives)" \
  || bad "rightbar-column anchor missing (the visible sidebar is painted by the app's dock)"
grep -q '\[class\*="_centerCol"\]' "$PKG/client.js" \
  && ok "main pane anchored on the AppFrame center column (2.0.22-next / official shell)" \
  || bad "center-column anchor missing — the conversation pane would stay opaque"
grep -q '\[class\*="_bottomRow"\]' "$PKG/client.js" \
  && ok "bottom row anchored on the AppFrame grid row" \
  || bad "bottom-row anchor missing"
grep -qF 'html[data-platform="darwin"]:not([data-next-material="off"])' "$PKG/client.js" \
  && ok "gated on html[data-platform=darwin] minus material=off (NEXT + official client)" \
  || bad "window gate missing — the skin would be inert"
grep -qF '[data-next-material="transparent"]' "$PKG/client.js" \
  && bad "an exact material=transparent gate survived — inert in the official client (which writes no material key)" \
  || ok "no exact material=transparent gate left"
grep -q 'data-dsh-desktop-platform' "$PKG/client.js" \
  && bad "a retired body-level data-dsh-desktop-* gate survived (it matches nothing in 2.0.20-next)" \
  || ok "no retired body-level gate left"
grep -q 'data-dockkit-host="dock"' "$PKG/client.js" \
  && ok "sidebar also scoped to the dockkit dock cell" \
  || bad "dockkit anchor missing"
grep -qE '\[class\*="_tabHost_"\]' "$PKG/client.js" \
  && ok "dock tab host background pinned explicitly" \
  || bad "dock tab host rule missing"
grep -qE '\-\-dsh-vib-bg-base-solid:[[:space:]]*var\(--dsw-static-neutral-bluish-00' "$PKG/client.js" \
  && ok "opaque dialog snapshot comes from the theme-invariant static palette" \
  || bad "opaque snapshot missing (dialogs would stay see-through)"
grep -qE ':is\(dialog, \[role="dialog"\], \[role="alertdialog"\]\)' "$PKG/client.js" \
  && ok "dialog-like overlays get the opaque sheet back (dsh-cost-meter 费用明细 fix)" \
  || bad "overlay restore rule missing — dialog-style panels render transparent"
grep -qE 'backdrop-filter[[:space:]]*:' "$PKG/client.js" \
  && bad "a backdrop-filter declaration is present — must never be used (grey fog on a transparent vibrancy window)" \
  || ok "no backdrop-filter declaration (comments explaining why are fine)"
# --- v1.5.0: background-image sheet + state keys -------------------------
grep -q 'body::before' "$PKG/client.js" \
  && ok "background sheet paints one body::before decoration layer" \
  || bad "body::before decoration layer missing"
grep -qE 'background-image:[[:space:]]*var\(--dsh-vib-bg-image\)' "$PKG/client.js" \
  && ok "background-image is driven by var(--dsh-vib-bg-image)" \
  || bad "--dsh-vib-bg-image wiring missing"
grep -qE 'filter:[[:space:]]*blur\(var\(--dsh-vib-frost,[[:space:]]*36px\)\)' "$PKG/client.js" \
  && ok "background blur radius is driven by --dsh-vib-frost (36px fallback)" \
  || bad "blur(var(--dsh-vib-frost, 36px)) on the background layer missing"
grep -qE 'filter:[[:space:]]*blur\(36px\)' "$PKG/client.js" \
  && bad "a hard-coded blur(36px) survived — the frost slider would do nothing" \
  || ok "no hard-coded blur(36px) literal (radius is adjustable)"
grep -q -- '--dsh-vib-frost' "$PKG/client.js" \
  && ok "frost radius travels as --dsh-vib-frost" \
  || bad "--dsh-vib-frost wiring missing"
grep -q 'dsh-vibrancy-skin:frost' "$PKG/client.js" \
  && ok "frost radius persists under dsh-vibrancy-skin:frost" \
  || bad "frost storage key missing"
grep -qE '\[class\*="_markdown_"\]' "$PKG/client.js" \
  && ok "inline-code chip is scoped to markdown content" \
  || bad "markdown inline-code rule missing"
grep -qF 'color-mix(in srgb, var(--dsw-alias-markdown-inline-code, #808080) 45%, transparent)' "$PKG/client.js" \
  && ok "inline code blends 45% into transparent (no re-opaque pane)" \
  || bad "inline-code color-mix rule missing"
grep -qE ':not\(pre\)[[:space:]]*>[[:space:]]*code' "$PKG/client.js" \
  && ok "fenced code blocks are deliberately left opaque" \
  || bad ":not(pre) > code guard missing"
# --- v1.5.2: five opaque surfaces become translucent ---------------------
for anchor in \
  '--dsw-specific-bubble' \
  '[data-composer-card]' \
  '[data-changed-files]' \
  '--changes-fill' \
  '--changes-hover' \
  '.cm-footer-stack.summary:not(.rail)' \
  '.cm-bbox' \
  '.cm-chip' \
  '.cm-btn.cm-stat-entry'; do
  grep -qF -- "$anchor" "$PKG/client.js" \
    && ok "v1.5.2 surface anchor present: $anchor" \
    || bad "v1.5.2 surface anchor missing: $anchor"
done
for opacity in 42 44 46 50 52 58 64 70; do
  grep -qF -- " ${opacity}%, transparent" "$PKG/client.js" \
    && ok "v1.5.2 surface opacity present: ${opacity}%" \
    || bad "v1.5.2 surface opacity missing: ${opacity}%"
done
for token in \
  '--dsw-static-neutral-bluish-850' \
  '--dsw-static-neutral-850' \
  '--dsw-static-neutral-800'; do
  grep -qF -- "$token" "$PKG/client.js" \
    && ok "v1.5.2 dark surface token present: $token" \
    || bad "v1.5.2 dark surface token missing: $token"
done
grep -qE 'pointer-events:[[:space:]]*none' "$PKG/client.js" \
  && ok "background layer is pointer-events: none" \
  || bad "background layer missing pointer-events: none"
grep -q 'dsh-vibrancy-skin:bg-mode' "$PKG/client.js" \
  && ok "background mode persists under dsh-vibrancy-skin:bg-mode" \
  || bad "bg-mode storage key missing"
grep -q 'indexedDB' "$PKG/client.js" \
  && ok "picture storage goes through IndexedDB (local only, never uploaded)" \
  || bad "IndexedDB storage path missing"
node -e '
const v = require("'"$PKG"'/package.json").version;
console.log((v === "1.6.0" ? "\u2713" : "\u2717") + " installed version = " + v + (v === "1.6.0" ? "" : " (expected 1.6.0)"));
' 2>&1 | sed 's/^/  /'

