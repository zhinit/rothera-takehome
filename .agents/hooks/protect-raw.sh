#!/bin/bash
# Usage: protect-raw.sh <repository-root> <target-file>
# Reject writes to existing raw/ files. New files are allowed.
# Agent adapters handle input parsing and hook registration.
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: protect-raw.sh <repository-root> <target-file>" >&2
  exit 2
fi

python3 - "$1" "$2" <<'HOOK_PY'
from pathlib import Path
import sys

root = Path(sys.argv[1]).resolve()
target = Path(sys.argv[2])
if not target.is_absolute():
    target = root / target
target = target.resolve()
raw = (root / 'raw').resolve()
if target.is_relative_to(raw) and target.exists():
    print('Blocked: files under raw/ are immutable once saved. '
          'To remove a bad source, use /retract_source.', file=sys.stderr)
    sys.exit(2)
HOOK_PY
