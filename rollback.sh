#!/usr/bin/env bash
# dsh-vibrancy-skin — one-command rollback / uninstall.
#
#   bash rollback.sh            # unmount + delete the package directory
#   bash rollback.sh --keep     # unmount but keep the files (for re-enabling)
#
# The profile files are backed up first, so this is itself reversible.
set -euo pipefail

P="$HOME/.dsh/profiles/desktop"
PKG="$P/node_modules/dsh-vibrancy-skin"
KEEP=0
[ "${1:-}" = "--keep" ] && KEEP=1

TS=$(date +%Y%m%d-%H%M%S)
cp -p "$P/package.json" "$P/package.json.bak-rollback-$TS"
cp -p "$P/cordis.patch.yml" "$P/cordis.patch.yml.bak-rollback-$TS"

# 1) drop the bundle entry + dependency entry, keeping the JSON formatting tight.
node - <<EOF
const fs = require("fs");
const f = "$P/package.json";
const p = JSON.parse(fs.readFileSync(f, "utf8"));
delete p.dependencies["dsh-vibrancy-skin"];
p.dsh.profile.bundles = p.dsh.profile.bundles.filter((b) => b !== "dsh-vibrancy-skin");
fs.writeFileSync(f, JSON.stringify(p, null, 2) + "\n");
console.log("unmounted: bundles =", p.dsh.profile.bundles.length, "entries");
EOF

# 2) drop any orphan mount row left in the profile patch by hand edits.
if grep -qE '^\s*-?\s*id:\s*vibrancy-skin' "$P/cordis.patch.yml"; then
  python3 - "$P/cordis.patch.yml" <<'PY'
import sys, re
p = sys.argv[1]
txt = open(p, encoding="utf-8").read()
txt = re.sub(r"\n- id: vibrancy-skin\n(?:  .*\n)*", "\n", txt)
open(p, "w", encoding="utf-8").write(txt)
print("removed orphan vibrancy-skin mount row")
PY
fi

# 3) keep the market from re-listing it as disabled.
python3 - "$P/.dsh-market/state.json" <<'PY'
import json, sys
p = sys.argv[1]
try:
    s = json.load(open(p, encoding="utf-8"))
except Exception:
    sys.exit(0)
d = s.get("disabled")
if isinstance(d, list) and "dsh-vibrancy-skin" in d:
    s["disabled"] = [x for x in d if x != "dsh-vibrancy-skin"]
    json.dump(s, open(p, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print("removed dsh-vibrancy-skin from market disabled list")
PY

if [ "$KEEP" = "0" ]; then
  rm -rf "$PKG"
  echo "deleted $PKG"
else
  echo "kept $PKG (still present, just unmounted)"
fi

echo
echo "backups: package.json.bak-rollback-$TS / cordis.patch.yml.bak-rollback-$TS"
echo "restart DSH Desktop to finish."
