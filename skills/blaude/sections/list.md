# list

A dated list of links: talks, press, reading, appearances.

```json
{ "type": "list", "id": "talks", "title": "Talks", "items": [
  { "date": "2026-10-02", "title": "Writing for phones", "url": "https://example.com/talk", "note": "Brighton" }
] }
```

- `id` is required (lowercase letters, digits, dashes) and must be unique.
- Items: `date` (YYYY-MM-DD, optional), `title` (required), `url` (http or https, optional), `note` (optional, shown muted under the title).
- Sorted newest first and grouped by year, like posts. An item without a URL is plain text.
- "Add a Talks section" creates one of these; ask for the first few items.
