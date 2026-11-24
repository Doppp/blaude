# codetabs

Several files in tabs with light highlighting. One Copy button in the tab bar copies the visible file. Arrow keys move between tabs. Without JavaScript every file is shown with its name.

**Use when** two to five related files or snippets belong together: a request and its response, HTML and CSS, before and after.

**Inputs (JSON)**

| Field | Required | Notes |
| --- | --- | --- |
| `files` | yes, 2+ | `[{ "name": "request", "lang": "http", "code": "GET / HTTP/1.1\n..." }]` |
| `files[].lang` | no | Same languages as `code` |
| `label` | no | Screen-reader name for the tab list |

**Example**

```text
::: codetabs
{ "files": [
  { "name": "index.html", "lang": "html", "code": "<p class=\"note\">Hi</p>" },
  { "name": "style.css", "lang": "css", "code": ".note { color: teal; }" }
] }
:::
```

Code goes in JSON strings: escape quotes and write line breaks as `\n`. Copy the author's code exactly.
