# Components: which to use

Add components only where the author asks, or after they say yes to a suggestion. Each has a `components/<name>.md` with inputs and an example; read it before writing the block.

| The author wants | Component | Notes |
| --- | --- | --- |
| An image with a caption | `figure` | Alt text required. Or a single static SVG drawing |
| Several photos, a slideshow | `gallery` | Swipe, buttons, arrow keys. Put the most typical image first |
| A line of theirs emphasised | `pullquote` | Their exact words only |
| A note, tip or warning box | `callout` | `note`, `tip` or `warning` |
| Steps a reader taps through | `stepper` | 3-7 steps, short labels |
| Numbers as a chart | `chart` | Line over time, bar to compare, scatter to relate. Their data only |
| Boxes and arrows, a flow, a timeline | `diagram` | Inline SVG, real text, a narrow version for phones |
| Code to read or copy | `code` | A normal fenced block with a language |
| Messages between parties (a protocol, an API call) | `sequence` | Lanes, animated messages, optional modes and counter |
| Commands and their output | `terminal` | Types itself out when scrolled into view |
| Several related files | `codetabs` | One Copy button for the visible tab |

## Choosing

- Prefer the plainest component that does the job. A callout is better than a diagram for one idea.
- Interactive components (stepper, sequence, chart, gallery) help when the reader learns by stepping or exploring. Don't add motion for decoration.
- One or two components per screen of text at most. A post is still the author's writing first.
- Video can't be embedded. Offer a figure (a thumbnail the author attaches) followed by a plain link to the video.
- Tables in Markdown become scrollable tables automatically; no component needed.

## Writing a block

```text
::: name [args]
{ JSON inputs }
:::
```

- `callout` takes the variant as the argument and Markdown text as the body. `pullquote` takes text, with an optional `-- attribution` last line.
- `code` is a fenced block: three backticks, the language, optional `title=<file>`.
- JSON strings: escape `"` and write line breaks as `\n`.
- Text inside components is escaped; never put HTML in it. `figure` and `diagram` take SVG markup in `svg`; it is sanitised (no scripts, no outside links).

## Placing

Put the block between the paragraphs where the author asked. If they said "after the second paragraph", count their paragraphs, not headings. If the placement is unclear, place it where it fits and say where in your reply.
