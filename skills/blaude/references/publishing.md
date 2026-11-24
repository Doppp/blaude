# Publishing a post

Triggered by "turn this into a post", "publish this", "post this", or similar.

## 1. Find the blog

Follow "Find the blog first" in SKILL.md. Read the index and keep its config. No blog: run Setup first (references/setup.md), then continue.

## 2. Take the text as given

- The post body is the author's text, word for word: their paragraphs, their punctuation, their spelling. Fix only Markdown structure (a heading written as a bold line, a list written with dashes) and only when it's clearly structure.
- Title: use theirs. If there isn't one, suggest one or two in chat and ask. Don't publish with a title they haven't seen.
- Date: today, unless they give one. Tags: theirs, or suggest a few from the blog's existing tags and ask. Lowercase, short.
- Description: one line for the index and link previews. Use their first sentence if it works; otherwise propose one.
- Reading time is computed for you.
- Images: alt text is required. Ask for it if missing. See references/images.md.

## 3. Components

Add what the author asked for, where they asked ("after the second paragraph"). Read `references/components.md` to pick the component, then its `components/<name>.md` for the inputs. You may suggest one or two more in a single line ("Want the three steps as a tap-through figure?"); add them only on a yes. Content inside components comes from the author's text or their data. Never invent numbers.

## 4. Build, check, publish

1. Write the source as `post.md` (front matter + body + `:::` blocks).
2. Build with the blog's current theme: `blaude.js post post.md --config config.json --index-url <index URL> --out post.html`. A custom theme comes from the config automatically.
3. The script fails if the page breaks artifact rules; fix the cause. If the page is over 12 MB, shrink images (references/images.md).
4. **Create** the post artifact, titled `<post title> · <blog name>`. Note its URL.
5. Record it: rerun with `--url <post URL> --update config.json` (or add the entry by hand: `url`, `slug` (the id at the end of the URL), `title`, `date`, `description`, `tags`, `status: "draft"`, `readingMinutes`, `blaudeVersion`, `theme`).
6. Rebuild the index from the config and **republish** the same index artifact.

## 5. Tell the author

"Published privately: <post link>. To make it public, open it on claude.ai and choose Share. Your blog will list it once it's public: tell me 'I've shared it', or I'll pick it up next time I update the blog."

If the post has components, one line on what to try ("Tap through the figure to check the steps read right").

## Sync public status

The index lists only `status: "public"` posts. Whenever you update the index, and when the author says "I've shared it":

1. For each draft in `posts[]`, **read** the post artifact. If the read tells you it is shared publicly, set `status: "public"`. If it tells you it's private, keep or set `draft`.
2. If the tool doesn't report sharing, trust the author: "I've shared it" sets that post to public. Don't guess.
3. Rebuild and republish the index. Say which posts are now listed, and which drafts are still waiting.

Never tell the author a post is public because you changed `status`; status only controls the index listing.
