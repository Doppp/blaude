# posts

The author's public posts, newest first. Required: every index has exactly one.

```json
{ "type": "posts", "id": "posts", "title": "Writing" }
```

- Items come from the config's `posts[]`. Only `status: "public"` posts appear; drafts are listed in chat, never on the page.
- **Ledger:** grouped under year labels; each row is the date (`Nov 24`) and the title. No descriptions, no cards, no borders.
- **Featured:** the newest post large, with a generated cover, "Latest · date", title, description and a "Read the post" button; the rest under "More writing" as title plus date and reading time.
- **Tag filter:** appears only when public posts use two or more tags. A plain text row (`all  guide  web`); the active tag is underlined in the accent colour. It sets the URL hash to `#tag-<name>`. Never pills or chips.
- Works with 0 posts ("No posts yet."), 1 post and 500 posts.
