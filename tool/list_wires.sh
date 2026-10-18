#!/usr/bin/env bash
# Lists every open placeholder marker (// WIRE:) in src/ and checks each ID is in docs/WIRING.md.
# Usage: tool/list_wires.sh
set -u
cd "$(dirname "$0")/.." || exit 1

echo "== Open placeholders in code =="
if [ -d src ]; then
  grep -rn "// WIRE:" src --include="*.ts" --include="*.tsx" || echo "  none"
else
  echo "  src/ not found yet"
fi

echo
echo "== Marker IDs not registered in docs/WIRING.md =="
missing=0
if [ -d src ]; then
  for id in $(grep -rhoE "// WIRE: [a-z0-9._-]+" src --include="*.ts" --include="*.tsx" 2>/dev/null | awk '{print $3}' | sort -u); do
    if ! grep -q "\`$id\`" docs/WIRING.md; then
      echo "  $id"
      missing=1
    fi
  done
fi
[ "$missing" -eq 0 ] && echo "  all registered"
exit 0
