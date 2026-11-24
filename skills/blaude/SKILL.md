---
name: blaude
description: Blaude blogs made of Claude artifacts. Use to set up a blog, turn writing into a post, publish, edit or delete posts, change the blog's look or sections, or export it.
license: MIT
metadata:
  version: 1.0.0
  homepage: https://github.com/Doppp/blaude
---

# Blaude: blogging with Claude

Blaude turns a person's writing into a blog made of artifacts in their own Claude account: **one index artifact** (the blog's permanent address, holding all its settings) and **one artifact per post**. There is no server and nothing to host. You build and update the pages; the author only writes, and presses Share.

The author is not a developer. Every action is a sentence in chat. Never show them templates, JSON, file paths or commands unless they ask. Many will be on a phone: keep replies short.

## Rules that always apply

1. **The author's words are theirs.** Put their text in the post exactly as given. You may fix Markdown structure (headings, lists, links), and typos only when asked. Never rewrite, shorten, summarise, "improve" or add sentences. Propose any other change in chat first. Pull quotes and callouts use only their words.
2. **Ask only for what is missing.** For a post: a title if there isn't one, and alt text for images. Don't interview them.
3. **Components on request.** Add the figures and components the author asks for. You may suggest others in one line; add them only on a yes.
4. **Never make, or claim to make, anything public.** New artifacts are private. Only the author can share a page, from the page itself on claude.ai. Always tell them how (see "After publishing").
5. **One index per blog, forever.** The index URL is the blog's address. Update it in place by republishing the same artifact. Never create a second index for the same `blogId`. If you can't find it, follow "Rebuild the index" in references/editing.md, which finds it before rebuilding.
6. **Every page stands alone.** All CSS, JS and images are inside the page; images are `data:` URIs; fonts come only from Google Fonts. No page depends on another to render.
7. **Never leave a dead link.** After any workflow, every link on the index points to a post that exists.
8. **Keep the author's other pages untouched.** Only change artifacts that carry a Blaude block for this blog.

## The artifact actions you use

Use whatever artifact-publishing tool this Claude app provides. You need four actions:

- **Create** an artifact from an HTML file. It returns the new artifact's URL. Use this for a new post, or once for a new blog's index.
- **Republish** an existing artifact from an HTML file. The URL stays the same. Use this for every index update and every post edit.
- **List** the author's artifacts (titles and URLs).
- **Read** an artifact: its HTML, and its sharing state when the tool reports it.

Deleting a post uses the tool's delete action, and the author confirms it.

The index artifact is titled `<blog name>`. Each post is titled `<post title> · <blog name>`. Find pages by their data blocks, never by title alone:

- The index holds `<script type="application/json" id="blaude-config">`, the blog's config: `blogId`, `blog` (name, tagline, author, bio, email, links), `theme`, `sections`, `posts[]`.
- Each post holds `<script type="application/json" id="blaude-post">` (its `blogId`, `indexUrl`, title, date, tags, theme, components, related) and `id="blaude-source"` (its Markdown source).

## Building pages

This skill's files sit in the folder that holds this SKILL.md (for example `/mnt/skills/user/blaude/`); call it `$BLAUDE`. With code execution available, build every page with the script. It escapes text, adds only the components used, embeds the source and checks the result against the artifact rules:

```text
node $BLAUDE/scripts/blaude.js new-config --name "…" --author "…" [--tagline "…"] [--email …] [--theme ledger|featured]
node $BLAUDE/scripts/blaude.js index config.json --out index.html
node $BLAUDE/scripts/blaude.js post post.md --config config.json --index-url <index URL> [--url <post URL> --update config.json] --out post.html
node $BLAUDE/scripts/blaude.js config index.html --out config.json     # config out of a saved index page
node $BLAUDE/scripts/blaude.js source post.html --out post.md          # a post's Markdown, images restored
node $BLAUDE/scripts/blaude.js check page.html                         # artifact rules
node $BLAUDE/scripts/blaude.js tokens theme.json                       # contrast and limits for a custom theme
node $BLAUDE/scripts/blaude.js export pages/ --out blog.zip
```

A post source is Markdown with front matter:

```text
---
title: How a post gets published
date: 2026-11-24
description: One line for the index and link previews.
tags: [guide, basics]
---
The author's text, exactly as given…

::: stepper
{ "steps": [ … ] }
:::
```

Components are `::: name` blocks (`callout` and `pullquote` take Markdown text; `code` is a normal fenced block). See references/components.md.

Without code execution, build the page by hand from `templates/post.html` or `templates/index-<layout>.html`: put the theme's `tokens.css` and `templates/base.css` in the `<style>`, add each used component's `<style>` and `<script>` once from `components/<name>.html`, fill its `<template>` markup, escape every value (`& < > " '`), and write the data blocks as JSON with `<` written as `<`. Then read the page through against the checklist below.

## Workflows

Each sentence below starts a workflow. Read the named reference file before you begin it.

| The author says | Workflow | Read |
| --- | --- | --- |
| "Set up my Blaude blog", or publishes with no blog yet | Setup | references/setup.md |
| "Turn this into a post", "publish this" | Publish a post | references/publishing.md |
| "I've shared it", or any index update | Sync public status | references/publishing.md |
| "Fix the typo in my last post", "add a diagram to the X post" | Edit a post | references/editing.md |
| "Delete the post about X" | Delete a post | references/editing.md |
| "Add a Talks section", "update my bio", "move About to the top" | Edit the index | references/editing.md |
| "Add related posts", "link to my post on X" | Related links | references/editing.md |
| "Switch to the Featured theme", "retheme all my posts" | Change theme | references/theming.md |
| "Make my blog look like this" + a description or screenshot | Personal theme | references/theming.md |
| "I lost my blog link" | Rebuild the index | references/editing.md |
| "Export my blog" | Export | references/export.md |
| Attaches images for a post | Images | references/images.md |

### Find the blog first

Before any workflow except Setup:

1. If this chat already has the index URL, use it.
2. Otherwise list the author's artifacts. Read candidates (start with titles matching a blog name) until you find one with a `blaude-config` block. If there are several blogs, ask which one.
3. If none is found, look for posts (`blaude-post` blocks) and follow "Rebuild the index". If there are no posts either, run Setup.

Keep the config you read as the source of truth; change it, rebuild the index from it, republish.

### Publish a post, in short

1. Find the blog. Take the author's text as given; ask only for a missing title or alt text.
2. Write the post source with the components they asked for. Build it with the blog's current theme. Check it.
3. **Create** the post artifact. Add the post to `posts[]` with `status: "draft"` (the `--update` option does this), rebuild the index, **republish** it.
4. Tell the author it's published privately and how to share it.

## After publishing

Say it plainly, in two or three short lines:

- "Your post is published privately: <post link>."
- "To make it public, open it on claude.ai and choose **Share**. Once it's public, your blog lists it the next time I update the index, or say 'I've shared it'."

For a new blog, say the index link is the blog's address and needs sharing the same way. Never say a page is public, live or visible to others unless you read that it is shared.

## Checklist before every publish

- Starts with `<!DOCTYPE html>`; under 16 MiB (aim under 12 MB); `check` passes.
- Scripts, styles and fonts only from allowed hosts (Google Fonts for fonts); images are `data:` URIs; no iframes, `alert`, `window.open` or downloads.
- The post's text matches the author's words. Titles and tags are as they gave them.
- Header links to the index URL and `<index URL>#about`; footer "← All posts" links to the index.
- Index: every post link resolves to an existing post; only `public` posts are listed; `blogId` unchanged; one posts section; the About section is filled or the author has been asked.
- Mobile: nothing wider than a 360 px screen; long code and tables scroll inside their own box.

## Files

- `templates/`: `post.html`, `index-ledger.html`, `index-featured.html`, `base.css`, `config.schema.json`.
- `components/`: one `<name>.html` (style, markup, script) and `<name>.md` (when to use, inputs, example) per component.
- `sections/`: the index section types.
- `themes/`: `ledger` (default), `featured`, `_template`, and `tokens.json` (the token list and contrast rules).
- `scripts/blaude.js` and `scripts/lib/`: the builder and checks (Node, no dependencies).
- `references/`: the workflow details listed above.
