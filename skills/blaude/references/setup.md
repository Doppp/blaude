# Setup: create the blog's index

Triggered by "set up my Blaude blog", or by a first publish when no index exists.

## 1. Check for an existing blog

List the author's artifacts and look for a `blaude-config` block (see "Find the blog first" in SKILL.md). If a blog exists, say so and give its link instead of making another. Only set up a second blog if the author clearly wants a separate one.

## 2. Ask, in one message

- The blog's name.
- Their name, as it should appear.
- A one-line intro (optional). In the Ledger layout this is the paragraph under the name, so it reads best in their own voice.
- A look: **Ledger** (default: a contents page, posts grouped by year, best for most blogs) or **Featured** (the latest post large with a cover, for people who post less often). Mention they can describe or show something else for a personal theme.

If they already gave some of this, don't ask again. If they say "just set it up", use the name of their choice or ask only for the name, use their name if you know it, and Ledger.

## 3. Build and publish

1. Create the config: `blaude.js new-config --name … --author … [--tagline …] [--email …] [--theme …]`. It generates a new `blogId` (a UUID) with `posts` and `about` sections. Without code execution, write the same JSON by hand, generating a UUID, following `templates/config.schema.json`.
2. Build the index (`blaude.js index config.json --out index.html`) and check it.
3. **Create** the index artifact, titled with the blog name. Keep its URL: it is the blog's address, and every post links to it.

## 4. Tell the author

- "Your blog is ready: <index link>. This link is your blog's address."
- "It's private for now. Open it on claude.ai and choose **Share** to make it public."
- Ask for a short bio now, or say they can add one any time ("update my bio"). Until there is one, the About section reads "Tell Claude about yourself to fill this in." Before they share the index, ask again: fill it or remove the section.

Offer an email address for the footer (shown as text with a Copy button, never only a mailto link) and links (GitHub, a newsletter, a portfolio) if they want them.

## Personal theme at setup

If the author describes or shows a look, follow references/theming.md ("Personal themes") before publishing the index. Show a preview post first.
