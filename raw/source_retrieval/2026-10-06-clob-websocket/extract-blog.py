"""Reproduce Markdown extraction from the archived site's JavaScript bundle.

This uses the same extraction logic as the successful inline Python command.
It reads local files, prints the full article, and never evaluates JavaScript.
"""
from pathlib import Path
import sys

default = Path(__file__).resolve().parents[2] / 'html' / 'zhinit-kalshi-polymarket-arbitrage-2026.bundle.js'
source = Path(sys.argv[1]) if len(sys.argv) > 1 else default
bundle = source.read_text()
marker = '"../../content/blog/kalshi-polymarket-arbitrage.md":`'
start = bundle.index(marker) + len(marker)
end = start
while end < len(bundle):
    if bundle[end] == '\\':
        end += 2
        continue
    if bundle[end] == '`':
        break
    end += 1
raw = bundle[start:end]
out = []
i = 0
while i < len(raw):
    if raw[i:i+2] == '${':
        raise ValueError('Template interpolation requires separate handling')
    if raw[i] != '\\':
        out.append(raw[i])
        i += 1
        continue
    i += 1
    char = raw[i]
    i += 1
    if char in '\\`$':
        out.append(char)
    elif char in 'nrtbfv':
        out.append({'n': '\n', 'r': '\r', 't': '\t', 'b': '\b', 'f': '\f', 'v': '\v'}[char])
    elif char == '\n':
        pass
    else:
        raise ValueError('Unexpected escape ' + repr(char))
sys.stdout.write(''.join(out))
