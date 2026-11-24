# figure

An image or an SVG drawing with a caption.

**Use when** the author attaches an image, or a single static drawing explains something. For boxes and arrows use `diagram`; for several images use `gallery`.

**Inputs (JSON)**

| Field | Required | Notes |
| --- | --- | --- |
| `src` | one of src/svg | `data:image/...;base64,...`. Resize first (see references/images.md) |
| `svg` | one of src/svg | Inline `<svg>` markup. Scripts, event handlers and outside links are removed |
| `alt` | yes | What the image shows, for people who can't see it. Ask the author if they didn't give it |
| `caption` | no | Plain text under the figure |
| `width`, `height` | no | Pixel size of the image, so the page doesn't jump while it loads |

**Example**

```text
::: figure
{ "src": "data:image/webp;base64,UklGR...", "alt": "The harbour at dawn, three boats tied up", "caption": "Taken from the north pier.", "width": 1600, "height": 1067 }
:::
```

The figure is as tall as its image: no fixed-height box. Small images stay at their own width.
