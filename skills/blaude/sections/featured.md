# featured

A short list of highlighted posts or outside links: "Start here", "Best of", or a link to a large interactive page kept as its own artifact.

```json
{ "type": "featured", "id": "start-here", "title": "Start here", "items": [
  { "title": "How a post gets published", "url": "https://claude.ai/artifact/...", "note": "The five steps, with a figure." }
] }
```

- Items: `title` (required), `url`, `note`. Items keep the order given. Keep it to about five.
- The id defaults to `featured`; set one if there is more than one featured section.
- Not the same as the **Featured** theme, which changes the whole index layout.
