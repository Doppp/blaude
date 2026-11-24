# Index sections

The index is built from `sections` in the config, in order. Each section gets an anchor (`#id`) and a link in the header. Both layouts render the same section types; only the arrangement differs. The renderers live in `templates/index-ledger.html` and `templates/index-featured.html`.

| Type | Default | File |
| --- | --- | --- |
| `posts` | on | [posts.md](posts.md) |
| `about` | on, last | [about.md](about.md) |
| `list` | off | [list.md](list.md) |
| `projects` | off | [projects.md](projects.md) |
| `featured` | off | [featured.md](featured.md) |

A section the author wants as a page of its own (large or interactive) becomes a separate artifact, linked from a `featured` or `list` item.
