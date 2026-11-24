# about

The author's bio and links. On by default, last in the list.

```json
{ "type": "about", "id": "about", "title": "About" }
```

- Text comes from `blog.bio` (Markdown: paragraphs, bold, italic, code, links) and `blog.links`.
- Posts link to `<index URL>#about`, so keep the id `about`.
- **Ledger:** plain text bio and links, no avatar. The email is in the footer, as text with a Copy button.
- **Featured:** a sidebar on desktop, stacked below the list on phones, with the avatar (or the author's initial), bio, links, and the email with a Copy button.
- With no bio, the section shows "Tell Claude about yourself to fill this in." Before the author shares the index, ask them for a bio or offer to remove the section.
- The email is never only a `mailto:` link.
