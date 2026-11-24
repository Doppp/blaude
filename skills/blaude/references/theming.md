# Themes

A theme sets the design tokens (colour, type, spacing) and the index layout (`ledger` or `featured`). It never changes how posts or components are built, so any valid theme works with every component.

Shipped themes:

- **ledger** (default): a contents page. Name, intro, posts grouped by year, About. White paper, near-black ink, one ink-blue accent; Instrument Sans headings, Literata body, JetBrains Mono dates.
- **featured**: the same tokens and post design; the index shows the latest post large with a generated cover, older posts below, About in a sidebar.

## Switch theme

"Switch to the Featured theme."

1. Set `theme` in the config: `{ "name": "featured" }`. Rebuild the index and republish it.
2. Old posts keep their theme: each post carries its tokens. Say so, and offer "retheme all my posts".

## Retheme all posts

"Retheme all my posts."

For each post in `posts[]`: read it, get its source (`blaude.js source`), rebuild with the blog's current theme, republish the same artifact. Keep going if one fails; at the end list any that failed and why. Update each entry's `theme` in `posts[]` and republish the index once.

## Personal themes

"Make my blog look like this" with a description or a screenshot.

1. **Pick a layout.** Keep their current one unless the description clearly fits the other (a magazine-like front page suggests `featured`).
2. **Write a full token set.** Every token in `themes/tokens.json` (`required`, plus the optional `--bl-term-*` for the terminal), as JSON: `{ "--bl-bg": "light-dark(#fffdf8, #15130f)", … }`. Colours are `light-dark(<light>, <dark>)` in hex. Design both modes: a screenshot usually shows one, so derive the other.
3. **Fonts.** Only Google Fonts. Choose up to three families (body, headings, mono) that match the look; list them as Google Fonts specs, such as `"Fraunces:wght@400;600"`. Body text must fit at least 30 characters per line on a 360 px phone: avoid very wide display faces for body text.
4. **Keep the fixed parts.** The spacing scale is shared: `--bl-s1: 8px`, `--bl-s2: 16px`, `--bl-s3: 24px`, `--bl-s4: 40px`. `--bl-size-body` 16-18px; `--bl-measure` at most 720px (680px is the default).
5. **Check.** Run `blaude.js tokens tokens.json`. It checks contrast in both modes: body and muted text 4.5:1 on background and surface, accent 3:1 on background, text on accent 4.5:1, callout colours 3:1 on surface. Fix every failure by adjusting lightness, not by dropping the colour. Without code execution, compute the WCAG contrast ratios yourself for the same pairs.
6. **Preview.** Store the theme in a copy of the config as `"theme": { "name": "custom", "layout": "ledger", "fonts": [ … ], "tokens": { … } }` and build the author's newest post (or a short sample if they have none) with it. **Create** it as a private preview artifact titled `Theme preview · <blog name>`. Ask: keep it, adjust it, or drop it?
7. **Apply.** On a yes, save the theme into the real config, rebuild and republish the index, and offer to retheme existing posts. Then offer to delete the preview artifact (the author confirms the delete).

Never copy another site's logo, name or exact branding into a theme. Take the feel: colours, type and density.

## Export a theme for contributing

"Can I share this theme?" Write a folder named after the theme (lowercase, dashes) with:

- `tokens.css`: `:root{ color-scheme: light dark; …every token… }` plus `:root[data-theme=light]{color-scheme:light}` and `:root[data-theme=dark]{color-scheme:dark}`.
- `theme.json`: `name`, `displayName`, `author`, `description`, `fonts`, `blaude: "1.0"`, `indexLayout`.
- A short README with how to submit: copy into `skills/blaude/themes/` in the Blaude repository, run `node tools/build.js` and `node tools/check-theme.js <name>`, and open a pull request.

Give it to them as a zip they can download.
