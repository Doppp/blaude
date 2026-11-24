# Editing, deleting and repairing

## Edit a post

"Fix the typo in my last post", "add a diagram to the X post", "change the title".

1. Find the blog, then the post: "last post" is the newest in `posts[]`; otherwise match the title. If two could match, ask.
2. **Read** the post artifact. Get its exact source: `blaude.js source post.html --out post.md` (images are restored). Without code execution, copy the JSON `markdown` value from the `blaude-source` block.
3. Change only what was asked. A typo fix touches only that word. Don't reflow, reword or "tidy" anything else.
4. Set `updated: <today>` in the front matter. Keep `date`.
5. Rebuild with the post's own theme (the `theme` in its `blaude-post` block) unless the author asked to retheme. **Republish the same post artifact**: the link must not change.
6. If the title, description or tags changed, update that entry in `posts[]` (rerun with `--url <post URL> --update config.json`), rebuild and republish the index. Otherwise the index needs no change.
7. Tell the author what changed, in one line, with the link.

A post without a `blaude-source` block (made by hand or by an older version): rebuild its Markdown from the page's text and components, and show the author the result before republishing if anything is uncertain.

## Delete a post

1. Confirm in chat: "Delete '<title>'? Its link will stop working." Wait for a yes.
2. Delete the post artifact with the tool's delete action (the author confirms it there too).
3. Remove the entry from `posts[]`.
4. Find other posts whose `related` list links to it (read each public post's `blaude-post` block). Remove the link, rebuild each from its source and republish it. List them for the author.
5. Rebuild and republish the index. Never leave a dead link.

## Edit the index

"Add a Talks section", "move About to the top", "update my bio", "change my intro", "add my GitHub".

Edit only the config, rebuild the index, republish the same artifact. Section types and their fields are in `sections/`:

- New section: `list` (dated links: talks, press, reading), `projects` (name + one line), `featured` (a few highlighted links). Give it an `id` (lowercase, dashes), a title, and the first items.
- Move or remove: reorder or delete entries in `sections`. Keep exactly one `posts` section. If they remove About, say that the "About" link in posts' headers will then land at the top of the index.
- Bio: `blog.bio`, in their words. Markdown: paragraphs, bold, italic, links.
- Intro: `blog.tagline`. Email: `blog.email` (shown as text with a Copy button). Links: `blog.links` (label + https URL).
- A section the author wants as its own page (large, or interactive): build it as a separate artifact and link it from a `featured` or `list` item.

Posts don't need republishing when the index changes: they only link to the index URL and `#about`.

## Related links

"Add related posts", "link to my post on X".

- A post can have a Related block above its footer: up to five links, each a title and an optional one-line note. They can be the author's posts or outside pages.
- To suggest related posts, pick from public posts sharing tags first, then topic. Show the list and wait for a yes.
- Put them in the post's front matter as `related: [{"title": "…", "url": "…", "note": "…"}]`, rebuild and republish that post only.
- Older posts are never updated automatically. "Add my new post to related on the X post" republishes just that post.

## Rebuild the index

"I lost my blog link", or no index can be found.

1. List the author's artifacts. Read every candidate and sort what you find: pages with `blaude-config` (indexes) and pages with `blaude-post` (posts). Group by `blogId`.
2. If an index exists for that `blogId`, that's the blog: give the link. Done.
3. If only posts exist, ask before rebuilding: "I found N posts from '<blog name>' but no index. Rebuild it?" Then build a config with the same `blogId` (from the posts), name from the post titles' `· <blog name>` suffix, `posts[]` from each post's metadata and URL, theme from the newest post. The index URL in the posts' `indexUrl` will no longer work, so:
4. **Create** the new index, then rebuild each post with the new `--index-url` and republish each, so their header and footer links work. Report any that failed.
5. Give the new index link and remind them to share it.

Never create a second index when one exists for the `blogId`.
