# gallery

Several images in a row the reader swipes through, with Previous/Next buttons and arrow keys.

**Use when** the author attaches three or more related images, or asks for a slideshow or carousel. Two images that belong together can also be two figures.

**Inputs (JSON)**

| Field | Required | Notes |
| --- | --- | --- |
| `images` | yes | List of `{ "src", "alt", "caption", "width", "height" }`. `src` and `alt` are required for each |
| `label` | no | Short name read to screen readers, such as "Photos from the walk" |
| `caption` | no | One caption for the whole gallery |

**Example**

```text
::: gallery
{ "label": "Photos from the walk", "images": [
  { "src": "data:image/webp;base64,...", "alt": "Path through ferns", "width": 1600, "height": 1067 },
  { "src": "data:image/webp;base64,...", "alt": "View over the valley", "caption": "The top.", "width": 1600, "height": 1067 }
] }
:::
```

Every slide uses the first image's shape; other shapes are letterboxed on the surface colour, so no slide leaves an empty band. Put the most typical image first. Watch the page size: each image adds to the 12 MB budget.
