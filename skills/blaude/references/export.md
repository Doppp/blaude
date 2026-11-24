# Export

"Export my blog", "download my blog", "I want to move to another host".

The author gets one zip they can put on any static host, or in a Jekyll site:

```text
index.html                  the index; post links are relative
config.json                 the blog's settings (each post keeps its artifact link as artifactUrl)
<post-slug>/index.html      each post, linking back with ../index.html
<post-slug>/post.md         front matter (title, date, description, tags) + the author's Markdown
<post-slug>/images/…        the post's images as files, referenced from post.md
```

## Steps

1. Find the blog (SKILL.md, "Find the blog first") and read the index.
2. **Read** every post in `posts[]`, drafts included, and save each page's HTML into one folder, with the index as well. File names don't matter. If a post can't be read, note it and carry on.
3. Run `node $BLAUDE/scripts/blaude.js export <folder> --out <blog-name>-blog.zip`. It finds the index and the posts by their data blocks, rewrites links between them to relative paths, writes `post.md` from each post's own Markdown source, and moves images out of the Markdown into files.
4. Give the author the zip as a download. Say what's in it in two lines, and list any posts that couldn't be read (their index links still point to claude.ai).

Without code execution, give the author each page's HTML as a file and the config as `config.json`, and say links between them still point to claude.ai.

## Notes for the author, if they ask

- The `index.html` and post pages work as they are on any static host (Netlify, GitHub Pages, Cloudflare Pages) or opened from a folder.
- In Jekyll, the HTML files are copied as they are. `post.md` holds the text with front matter for anyone who wants to rebuild posts in Jekyll's own layouts. Blocks starting with `:::` are Blaude components; their finished versions are in each post's `index.html`.
- Exporting changes nothing in Claude: the blog keeps working at its artifact links.
