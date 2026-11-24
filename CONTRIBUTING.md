# Contributing to Blaude

Thanks for helping. Themes are the easiest place to start; bug reports and component ideas are welcome as issues.

## Setup

You need Node 20 or later.

```sh
npm ci
npx playwright install chromium
node tools/build.js          # rebuild the demo blog, theme previews and test pages
node tools/check-artifact.js # artifact rules on every built page
node tools/check-theme.js    # every theme: tokens, contrast, fonts, design rules, responsive check
node tools/test-export.js    # export the demo blog and check the zip
```

CI runs the same commands on every pull request, and fails if the built pages in `examples/` and the theme previews aren't committed up to date. Run `node tools/build.js` and commit its output with your change.

## Adding a theme

1. Copy `skills/blaude/themes/_template/` to `skills/blaude/themes/<your-theme>/` (lowercase letters and dashes).
2. Fill in `theme.json`: `name` (the folder name), `displayName`, `author`, `description`, `fonts` (Google Fonts family specs, e.g. `"Fraunces:wght@400;600"`), `blaude: "1.0"`, and `indexLayout` (`ledger` or `featured`).
3. Set every token in `tokens.css`. Colours take `light-dark(<light>, <dark>)`; keep the `[data-theme]` lines. The token list and the contrast rules are in `skills/blaude/themes/tokens.json`.
4. Only add `overrides.css` if tokens can't do it. Delete it otherwise.
5. Run `node tools/build.js` (it writes your `preview.html`) and `node tools/check-theme.js <your-theme>`. Screenshots land in `build/screenshots/<your-theme>/`.
6. Open a pull request with the screenshots of the index and preview at 390 px and 1280 px. CI uploads the same screenshots as an artifact of the run.

## The checks

**`tools/check-artifact.js [page.html …]`**: for any HTML page (all built pages by default):

- starts with `<!DOCTYPE html>` and stays under 16 MiB (warns above 12 MB);
- loads scripts only from cdnjs.cloudflare.com, cdn.jsdelivr.net/npm, unpkg.com, cdn.plot.ly, code.jquery.com or cdn.tailwindcss.com (pinned versions), styles only from Google Fonts, fonts only from fonts.gstatic.com, and images only as `data:` or `blob:` URIs;
- has no iframes, objects, embeds, `alert`/`confirm`/`prompt`, `window.open` or `text-wrap: balance`;
- has valid `blaude-config` and `blaude-post` blocks;
- in Chromium at 360 px: makes no request to a blocked host, throws no script error, and doesn't scroll sideways. `--static` skips the browser; `--offline` blocks Google Fonts too.

**`tools/check-theme.js [theme …]`**: for every theme (or the ones named):

- `theme.json` has the required fields and Google Fonts specs only;
- `tokens.css` sets every required token for light and dark;
- contrast: `--bl-ink` and `--bl-ink-muted` at least 4.5:1 on `--bl-bg` and `--bl-surface`; `--bl-accent` 3:1 on `--bl-bg`; `--bl-accent-ink` 4.5:1 on `--bl-accent`; `--bl-good`, `--bl-warn`, `--bl-bad` 3:1 on `--bl-surface`; terminal text 4.5:1 on the terminal background;
- limits: `--bl-size-body` 16-18px, `--bl-measure` at most 720px, the spacing scale exactly 8/16/24/40px, at least 30 characters per line on a 360 px screen;
- `overrides.css` selectors start with `.bl-`, with no fixed widths, `position: fixed`, `100vw` or `@import` of other hosts;
- design rules across `base.css`, the templates and every component: spacing only from `--bl-s1`..`--bl-s4`, no negative margins, radius only `var(--bl-radius)`, `50%` or `0` (no pills), no `text-wrap: balance`, `text-wrap: pretty` only on paragraphs;
- the responsive check: the preview, the demo index in the theme's layout, indexes with 0, 1 and 500 posts, both demo posts and a page with every component, rendered at 360, 390, 768 and 1280 px in light and dark. It fails on horizontal scroll, any element overflowing its container, visible text under 13 px (SVG text included, at its rendered size), any button or link under 44 × 44 px (inline text links excepted), inputs under 16 px, or header, body and footer left edges more than 1 px apart.

`--gallery` also copies the light-mode screenshots into `docs/gallery/` and rewrites its README.

## Review criteria

A theme or component is merged when CI is green and it keeps Blaude's design rules:

- **The author's words come first.** One calm reading column; nothing competes with the text.
- **One spacing scale.** Every margin, padding and gap is `--bl-s1`..`--bl-s4` (8, 16, 24, 40 px). No negative margins, no one-off values.
- **One column.** Header, body, figures and footer share the same max width and side padding, so their edges line up at every width.
- **No pills or chips.** Tags are plain text (`web, networking`); filters are text buttons with an underline for the active one.
- **No helper text on published pages.** No "sample", "demo" or explanatory notes. Meta is date, reading time and tags.
- **Headings wrap naturally.** No `text-wrap: balance`.
- **Figures size to their content.** No fixed-height boxes that leave empty bands.
- **Buttons never cover content.** Copy buttons sit in a toolbar row or reserved space.
- **Mobile first.** Works at 360 px; tap targets at least 44 px; tables and code scroll inside their own box.
- **Self-contained.** Theme tokens only (`var(--bl-*)`) for colour and type; Google Fonts only; no remote images.
- **Accessible.** Contrast as above, real text in SVGs, keyboard access for every control, `prefers-reduced-motion` respected.

## Adding a component

A component is `skills/blaude/components/<name>.html` (a `<style data-bl-component>`, a `<template data-bl-markup>` with Mustache placeholders, and an optional block-scoped `<script data-bl-component>`) plus `<name>.md` (when to use it, its inputs, an example). Register it in `skills/blaude/scripts/lib/components.js` with a `prepare()` that validates its inputs, add it to `tools/fixtures/components.md`, and list it in `skills/blaude/references/components.md`. The markup must make sense without the script; the script must find every instance on the page and never break other components if it fails.

## Releases

Tag `vX.Y.Z` on `master`. CI runs the checks, then builds `blaude-skill.zip` from `skills/blaude` (zipped from `skills/`, so `blaude/SKILL.md` is at the top of the archive) and attaches it to the GitHub release. Bump the version in `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `skills/blaude/SKILL.md` and `skills/blaude/scripts/lib/version.js` first.

## License

By contributing you agree your work is released under the MIT license. Blaude is a community project and is not affiliated with or endorsed by Anthropic.
