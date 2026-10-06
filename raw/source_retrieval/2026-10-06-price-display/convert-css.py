"""Reproduce the full CSS Markdown conversion without changing archives."""
from pathlib import Path
import re
import subprocess
import sys

root = Path(__file__).resolve().parents[3]
html = (root / "raw/html/w3c-css-animations-full-2026.html").read_text()
# Pandoc otherwise selects only <main>, omitting front matter and indexes.
html = re.sub(r"<(/?)main\b", r"<\1div", html)
result = subprocess.run(
    ["pandoc", "--from=html", "--to=gfm"],
    input=html.encode(), capture_output=True, check=True,
)
sys.stdout.buffer.write(result.stdout)
