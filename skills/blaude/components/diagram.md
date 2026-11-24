# diagram

Boxes and arrows, flows, timelines, drawn as inline SVG with real text labels.

**Use when** the author asks for a diagram, a flow, an architecture sketch or a timeline that doesn't need to move. If the reader should step through it, use `stepper`; if messages pass between parties, use `sequence`.

**Inputs (JSON)**

| Field | Required | Notes |
| --- | --- | --- |
| `svg` | yes | The drawing: `<svg viewBox="0 0 W H">...</svg>`, no width or height attributes |
| `svgNarrow` | no | A taller layout for phones, shown under 560 px. Recommended when `svg` is wider than about 400 units |
| `alt` | yes | One or two sentences describing what the diagram shows |
| `caption` | no | Caption under the diagram |

**Drawing rules**

- Use these classes instead of colours, so the diagram follows the theme in light and dark: `bl-d-box` (surface box with a rule border), `bl-d-strong` (accent box), `bl-d-line` (muted connector), `bl-d-accent` (accent connector), `bl-d-head` (arrowhead fill), `bl-d-text`, `bl-d-muted`, `bl-d-on-strong` (text on an accent box), `bl-d-mono`.
- Text stays readable on a phone: the narrow SVG is shown about 320 px wide, so its `font-size` must be at least `13 × viewBoxWidth / 320`. The wide one is shown at least about 500 px wide: `13 × viewBoxWidth / 500`. With a 320-wide narrow viewBox and a 640-wide wide one, use 16 and 18.
- Labels are `<text>`, never paths. No scripts, no `<foreignObject>`, no outside links.
- Size the viewBox to the drawing: no empty bands above or below.

**Example**

```text
::: diagram
{ "alt": "The author writes in Claude, which publishes the index and the posts",
  "svg": "<svg viewBox=\"0 0 640 120\"><rect class=\"bl-d-box\" x=\"10\" y=\"30\" width=\"150\" height=\"60\" rx=\"10\"/><text class=\"bl-d-text\" x=\"85\" y=\"66\" text-anchor=\"middle\" font-size=\"18\">Author</text></svg>" }
:::
```
