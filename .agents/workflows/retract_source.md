# retract_source

Remove a bad source from `raw/` and clean up every wiki claim that cites it.
This is the only sanctioned way to delete from `raw/`, which is otherwise
immutable.

Usage: `/retract_source <source-file>` (a filename in `raw/md/`, with or
without the `.md` extension)

## 1. Locate

Confirm `raw/md/<source-file>.md` exists and find its `raw/html/` counterpart
if one exists. If the file isn't found, list the closest-matching filenames in
`raw/md/` and stop.

## 2. Map the blast radius

Sweep `wiki/` for citations of the form `(source: <source-file>.md)`. For
every affected claim, record:

- the page and the claim text;
- whether another file in `raw/md/` also supports the claim (re-sourceable)
  or this was its only support (must be removed).

## 3. Report and wait

Present the blast radius: the source to delete, each affected page, each
claim, and its fate (re-cite or remove). Note any page that would be left
with no cited content. **Do not delete or edit anything until the user
approves.**

## 4. Execute on approval

1. Delete `raw/md/<source-file>.md` and its `raw/html/` counterpart using
   `rm` through the available shell tool. Deletion here is intentional and
   requires the approval from step 3.
2. Fix the wiki: re-cite the re-sourceable claims, remove the rest. Delete
   any page left with no cited content, then update `wiki/index.md` and fix
   `[[wiki-links]]` that pointed to deleted pages.
3. Append an entry to `wiki/log.md`: date, retracted source, reason, and the
   pages changed.
