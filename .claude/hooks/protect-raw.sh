#!/bin/bash
# Claude PreToolUse adapter. Shared logic accepts a root and a file path.
set -euo pipefail

file_path=$(python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input", {}).get("file_path", ""))')
[ -z "$file_path" ] && exit 0
exec bash "$CLAUDE_PROJECT_DIR/.agents/hooks/protect-raw.sh" "$CLAUDE_PROJECT_DIR" "$file_path"
