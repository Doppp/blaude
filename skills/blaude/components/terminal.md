# terminal

A terminal window where commands type themselves out, followed by their output. Starts when scrolled into view; Replay button; shows everything at once under reduced motion. Without JavaScript it is the full transcript.

**Use when** the post shows commands and what they print. For code to copy, use `code`.

**Inputs (JSON)**

| Field | Required | Notes |
| --- | --- | --- |
| `lines` | yes | `[["cmd", "dig +short notes.example"], ["ok", "203.0.113.10"]]` or `{ "kind", "text" }` objects |
| kind `cmd` | | A command; typed out after a `$` prompt |
| kind `out` | | Output, dimmed |
| kind `ok` | | Output that matters, in green |
| `title` | no | Text in the title bar, such as `~` or a folder name |
| `label` | no | Screen-reader name |

The terminal is dark in both light and dark mode and uses the optional `--bl-term-*` tokens. Its box is sized to the full transcript before typing starts, so nothing below it moves.
