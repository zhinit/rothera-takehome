# lint_wiki

Audit the wiki for quality and consistency. Report findings first; only fix
once the user approves.

Usage: `/lint_wiki`

## Checks

Start from `wiki/index.md`, then walk the pages and check:

1. **Contradictions** — claims in one page that conflict with another. Name both
   pages and the conflicting claims.
2. **Orphan pages** — pages with no inbound `[[wiki-link]]` from any other page.
3. **Missing pages** — concepts referenced or linked (`[[...]]`) that have no
   page of their own.
4. **Broken links** — `[[wiki-links]]` whose target page doesn't exist
   (for pipe links `[[target|display]]`, check the target), plus otherwise
   malformed links.
5. **Stale claims** — claims that may be outdated given newer sources in
   `raw/md/` or newer entries in `wiki/log.md`.
6. **Format violations** — pages that don't follow this page format:
   - H1 title on line 1; content organized into `##` sections of prose.
   - Every factual claim or section carries an inline citation
     `(source: <file>.md)` naming a file that exists in `raw/md/`. Citations
     point to raw sources only, never to other wiki pages.
   - Wiki links are `[[page-name]]`, or `[[page-name|display text]]` for
     custom display text. The target page must exist.
   - A closing **Related pages** section is optional.
   - `wiki/index.md` lists every page with a one-line description;
     `wiki/log.md` is append-only.
   Check for: missing H1 title, citations pointing to wiki pages instead of
   `raw/md/` files, or citations naming files that don't exist in `raw/md/`.
7. **Uncited claims** — factual claims with no `(source: ...)` reference.
8. **Separation-of-concerns violations** — project conclusions, recommendations,
   or our own results in wiki pages. Red flags: "for this project",
   "recommended", "our code/data/results", numbers produced by our own work.
   Conclusions belong in `docs/`, results in the project directories; a wiki
   page may carry a one-line pointer, never the content.
9. **Style-reminder drift** — compare `.agents/style-reminder.md` against
   `AGENTS.md`. Flag rules in the reminder that contradict or no longer appear
   in `AGENTS.md`, and `AGENTS.md` rules central enough that their absence
   from the reminder would cause drift in long sessions.

## Output

Report findings as a numbered list grouped by check, each with the page(s)
involved and a suggested fix. **Do not edit any files** until the user picks
what to fix.

After applying approved fixes, append a one-line entry to `wiki/log.md`
describing what was corrected.
