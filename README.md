# wiki-project-template

A starter template for projects with an agent-maintained research wiki,
following Andrej Karpathy's LLM Wiki pattern. Archive primary sources, build
cited pages around topics, and keep project documentation and results separate
from the research.

Project instructions and workflows are shared. Claude Code commands and Codex
skills provide entry points to the same workflow files.

## Getting started

1. Clone or copy this template into a new project directory.
2. Edit `AGENTS.md` with your project name, description, and project directories
   such as `src/`, `analysis/`, or `db/`.
3. Open your agent in the project directory and start researching:
   - Claude Code: `/research <topic>`
   - Codex: `$research <topic>`
   - Other agents that read `AGENTS.md`: ask for `research <topic>` in chat.

If the skills do not appear in Codex's `$` picker, restart Codex.

## Project structure

| Location | Contents |
|---|---|
| `raw/html/` | Archived source HTML |
| `raw/md/` | Full source content converted to Markdown |
| `wiki/` | Neutral topic pages with claims cited to archived sources |
| `docs/` | Project architecture and documentation |
| Your project directories | Code, data, experiments, and results from your own work |

Archived sources are immutable once saved. Wiki pages describe topics rather
than individual sources. One source can support several pages, and one page
can draw from several sources. Project opinions, conclusions, and results stay
outside the wiki.

When answering questions, the agent checks `wiki/index.md`, relevant wiki
pages, `docs/`, and project directories. It cites the relevant pages. If the
answer is missing, it labels any response from general knowledge and suggests
research.

## Workflows

| Workflow | Claude Code | Codex |
|---|---|---|
| Research a topic | `/research <topic>` | `$research <topic>` |
| Audit the wiki | `/lint_wiki` | `$lint-wiki` |
| Retract a source | `/retract_source <file>` | `$retract-source <file>` |

**Research** finds primary sources on the web and arXiv, presents candidates
for approval, and archives approved sources in `raw/`. The agent discusses
key takeaways before creating or updating cited topic pages, the wiki index,
and the operation log.

**Wiki audit** checks citations, contradictions, links, missing or orphan
pages, stale claims, formatting, and separation of concerns. It reports
findings before applying approved fixes.

**Source retraction** identifies every wiki claim affected by a source,
reports the impact, and waits for approval. It then removes the source and
repairs affected claims, links, and index entries. This is the workflow for
removing archived sources.

## Shared instructions and agent integration

```text
AGENTS.md                         # canonical project instructions
CLAUDE.md -> AGENTS.md            # Claude instruction entry point
.agents/
  workflows/
    research.md                  # shared workflow definitions
    lint_wiki.md
    retract_source.md
  skills/
    research/SKILL.md            # Codex skill wrappers
    lint-wiki/SKILL.md
    retract-source/SKILL.md
  hooks/protect-raw.sh            # shared raw-file protection logic
  style-reminder.md              # condensed project rules
.claude/
  commands/*.md                  # symlinks to shared workflows
  hooks/protect-raw.sh            # Claude hook input adapter
  settings.json                  # Claude hook registration
```

Edit project rules in `AGENTS.md` and workflow instructions in
`.agents/workflows/`. Claude's command symlinks and Codex's skill wrappers
reference those shared files. Adding another agent requires its own entry
points where needed.

Claude's configured hooks inject the style reminder on each prompt and block
Edit/Write operations on existing files under `raw/`. New source files are
allowed. Shell writes and deletion are outside that hook's coverage. Codex
hook registration is not included.

The shared protection script accepts a repository root and target file path.
It requires Bash and Python 3.9 or newer. Other agents need their own hook
registration and input adapter to call it.

## Wiki conventions

- Each topic page starts with one H1 title and uses `##` sections.
- Factual claims cite archived sources with `(source: <file>.md)`, referring
  to a file in `raw/md/`.
- Pages link to related topics with `[[page-name]]` or
  `[[page-name|display text]]`.
- `wiki/index.md` lists every topic page with a one-line description.
- `wiki/log.md` records wiki operations and is append-only.
