# Components

Each component is one `<name>.html` file with three parts:

- `<style data-bl-component>`: its CSS. Theme tokens (`var(--bl-*)`) only; spacing from `--bl-s1`..`--bl-s4`.
- `<template data-bl-markup>`: its markup, with Mustache placeholders. `{{x}}` is escaped text, `{{{x}}}` is markup Blaude made (never the author's text), `{{#list}}...{{/list}}` repeats.
- `<script data-bl-component>` (most components): a block-scoped script that finds every instance on the page and enhances it. The markup works without the script.

In a post source, a component is a block:

```text
::: name [args]
{ ...JSON inputs... }
:::
```

`callout` and `pullquote` take Markdown text instead of JSON, and `code` is an ordinary fenced code block. `scripts/blaude.js post` fills the markup, adds each used component's CSS and JS once, and records the list in the post's `blaude-post` block. To assemble by hand, copy the style into the page `<style>`, fill the template, and put the script before `</body>`.

Rules for every component: all motion respects `prefers-reduced-motion`; one script failing never stops another; tap targets are at least 44 px; nothing widens a 360 px screen; images are `data:` URIs.
