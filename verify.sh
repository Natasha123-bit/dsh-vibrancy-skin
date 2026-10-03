#!/usr/bin/env bash
# dsh-vibrancy-skin — one-command verification (read-only, safe to run anytime).
#
# Usage: bash verify.sh
set -uo pipefail

P="$HOME/.dsh/profiles/desktop"
PKG="$P/node_modules/dsh-vibrancy-skin"
# 自定位：脚本所在目录就是源码目录（2026-10-04 迁到 DSH-Projects 后不再写死绝对路径）
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOGDIR="$HOME/Library/Application Support/DSH Desktop/logs/host"

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

echo "== 6. host log, lines newer than the installed plugin =="
# The .error.log carries only W/E rows, so a clean boot means no new rows at all.
SINCE=$(date -r "$PKG/client.js" "+%Y-%m-%d %H:%M:%S")
echo "  installed at: $SINCE (lines older than this are stale history)"
for LOG in "$LOGDIR"/dsh-"$(date +%Y-%m-%d)".error.log "$LOGDIR"/dsh-"$(date +%Y-%m-%d)".log; do
  [ -f "$LOG" ] || continue
  NEW=$(awk -v since="$SINCE" 'match($0, /^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}/) && substr($0, RSTART, RLENGTH) >= since' "$LOG")
  N=$(printf '%s' "$NEW" | grep -c . || true)
  echo "  -- $(basename "$LOG"): $N new row(s)"
  if [ "${N:-0}" -gt 0 ]; then
    printf '%s\n' "$NEW" | grep -E 'vibrancy|client-modules|ClientPackage|FAILED|boot activation' | sed 's/^/       /' || true
    printf '%s\n' "$NEW" | grep -qE 'vibrancy-skin.*not found' \
      && bad "mount NOT effective (new 'not found' warnings)" \
      || ok "no 'not found' warning since install"
    printf '%s\n' "$NEW" | grep -qE 'ClientPackageCompositionError|FAILED' \
      && bad "client-modules rejected a package declaration (see rows above)" \
      || ok "no client-modules composition error"
  else
    ok "no new log rows at all"
  fi
done

echo "== 7. HTTP probing is not usable here =="
echo "  /plugins/<pkg>/client.js is token-guarded even on loopback: unauthenticated curl gets 403."
echo "  Real confirmation is the renderer console line:"
echo "    [dsh-vibrancy-skin] applied — enabled true, sidebar panels true, deep glass false,"
echo "                                            tint 40%, theme ..., material transparent"
echo "  Open it with Cmd+Opt+I; if absent, the client half was not served."
echo "  UI confirmation: Settings -> 磨砂玻璃 / Vibrancy (a sibling of the built-in Desktop page),"
echo "  with the switches '侧边栏面板磨砂' (default on) and '深层玻璃' (default off)."

echo "== 8. installed client half carries all three sheets =="
for marker in dsh-vibrancy-skin-styles dsh-vibrancy-skin-panel-styles dsh-vibrancy-skin-deep-styles; do
  grep -q "$marker" "$PKG/client.js" && ok "sheet id $marker" || bad "sheet id $marker missing"
done
grep -q 'data-dsh-better-sidebar' "$PKG/client.js" \
  && ok "sidebar scoped to [data-dsh-better-sidebar] (plugin-owned marker, hash-proof)" \
  || bad "sidebar scope anchor missing"
grep -q 'dshDesktopRightbarSurface\[data-rightbar-col\]' "$PKG/client.js" \
  && ok "sidebar also scoped to the app's third column (where the visible dock lives)" \
  || bad "rightbar-column anchor missing (the visible sidebar is painted by the app's dock)"
grep -q 'data-dockkit-host="dock"' "$PKG/client.js" \
  && ok "sidebar also scoped to the dockkit dock cell" \
  || bad "dockkit anchor missing"
grep -qE '\[class\*="_tabHost_"\]' "$PKG/client.js" \
  && ok "dock tab host background pinned explicitly" \
  || bad "dock tab host rule missing"
grep -qE '\-\-dsh-vib-bg-base-solid:[[:space:]]*var\(--dsw-alias-bg-base\)' "$PKG/client.js" \
  && ok "opaque --dsw-alias-bg-base snapshot captured on <body>" \
  || bad "opaque snapshot of --dsw-alias-bg-base missing (dialogs would stay see-through)"
grep -qE ':is\(dialog, \[role="dialog"\], \[role="alertdialog"\]\)' "$PKG/client.js" \
  && ok "dialog-like overlays get the opaque sheet back (dsh-cost-meter 费用明细 fix)" \
  || bad "overlay restore rule missing — dialog-style panels render transparent"
grep -qE 'backdrop-filter[[:space:]]*:' "$PKG/client.js" \
  && bad "a backdrop-filter declaration is present — must never be used (grey fog on a transparent vibrancy window)" \
  || ok "no backdrop-filter declaration (comments explaining why are fine)"
node -e '
const v = require("'"$PKG"'/package.json").version;
console.log((v === "1.3.2" ? "\u2713" : "\u2717") + " installed version = " + v + (v === "1.3.2" ? "" : " (expected 1.3.2)"));
' 2>&1 | sed 's/^/  /'

