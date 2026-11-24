---
title: Every component in one post
date: 2026-11-20
description: A test page that uses all eleven Blaude components.
tags: [test]
---
This page exercises every component so the theme check can render them at phone and desktop widths.

## Figure

::: figure
{
  "src": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjY3NSIgdmlld0JveD0iMCAwIDEyMDAgNjc1Ij48cmVjdCB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI2NzUiIGZpbGw9IiMyOTUwYjgiLz48Y2lyY2xlIGN4PSI2MDAiIGN5PSIzMzcuNSIgcj0iMTY4Ljc1IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIuNSIvPjx0ZXh0IHg9IjI0IiB5PSI2NTEiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjI4IiBmaWxsPSIjZmZmZmZmIj5GaWd1cmU8L3RleHQ+PC9zdmc+",
  "alt": "A blue rectangle with a pale circle in the middle",
  "caption": "A figure sized to its image, with a caption.",
  "width": 1200,
  "height": 675
}
:::

## Gallery

::: gallery
{
  "label": "Three test images",
  "images": [
    {
      "src": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjgwMCIgdmlld0JveD0iMCAwIDEyMDAgODAwIj48cmVjdCB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI4MDAiIGZpbGw9IiMyOTUwYjgiLz48Y2lyY2xlIGN4PSI2MDAiIGN5PSI0MDAiIHI9IjIwMCIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iLjUiLz48dGV4dCB4PSIyNCIgeT0iNzc2IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyOCIgZmlsbD0iI2ZmZmZmZiI+T25lPC90ZXh0Pjwvc3ZnPg==",
      "alt": "Blue test image",
      "caption": "The first image.",
      "width": 1200,
      "height": 800
    },
    {
      "src": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjgwMCIgdmlld0JveD0iMCAwIDEyMDAgODAwIj48cmVjdCB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI4MDAiIGZpbGw9IiMxZDdhNGEiLz48Y2lyY2xlIGN4PSI2MDAiIGN5PSI0MDAiIHI9IjIwMCIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iLjUiLz48dGV4dCB4PSIyNCIgeT0iNzc2IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyOCIgZmlsbD0iI2ZmZmZmZiI+VHdvPC90ZXh0Pjwvc3ZnPg==",
      "alt": "Green test image",
      "width": 1200,
      "height": 800
    },
    {
      "src": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iMTAwMCIgdmlld0JveD0iMCAwIDgwMCAxMDAwIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjEwMDAiIGZpbGw9IiNhMzVhMDAiLz48Y2lyY2xlIGN4PSI0MDAiIGN5PSI1MDAiIHI9IjI1MCIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iLjUiLz48dGV4dCB4PSIyNCIgeT0iOTc2IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyOCIgZmlsbD0iI2ZmZmZmZiI+VGhyZWU8L3RleHQ+PC9zdmc+",
      "alt": "Amber test image in portrait",
      "caption": "A portrait image.",
      "width": 800,
      "height": 1000
    }
  ]
}
:::

## Pull quote and callouts

::: pullquote
A figure should earn its place by showing what the words cannot.
-- The author
:::

::: callout note
**A note.** Notes use the accent colour.
:::

::: callout tip
**A tip.** Tips use the good colour.
:::

::: callout warning
**A warning.** Warnings use the warn colour, and can run to *several* sentences with a [link](https://example.com).
:::

## Charts

::: chart
{
  "type": "line",
  "title": "Visitors and sign-ups",
  "alt": "Line chart: visitors rise from 120 in January to 410 in June; sign-ups from 30 to 96",
  "columns": [
    "Month",
    "Visitors",
    "Sign-ups"
  ],
  "rows": [
    [
      "Jan",
      120,
      30
    ],
    [
      "Feb",
      180,
      41
    ],
    [
      "Mar",
      240,
      55
    ],
    [
      "Apr",
      230,
      60
    ],
    [
      "May",
      330,
      82
    ],
    [
      "Jun",
      410,
      96
    ]
  ],
  "caption": "Monthly totals."
}
:::

::: chart
{
  "type": "bar",
  "alt": "Bar chart of page weight by type: HTML 18, CSS 42, JS 310, images 880 kilobytes",
  "unit": " KB",
  "columns": [
    "Type",
    "Size"
  ],
  "rows": [
    [
      "HTML",
      18
    ],
    [
      "CSS",
      42
    ],
    [
      "JS",
      310
    ],
    [
      "Images",
      880
    ]
  ],
  "showTable": true
}
:::

::: chart
{
  "type": "scatter",
  "alt": "Scatter plot of round trips against load time; more round trips take longer",
  "xLabel": "Round trips",
  "columns": [
    "Round trips",
    "Load time (ms)"
  ],
  "rows": [
    [
      1,
      90
    ],
    [
      2,
      170
    ],
    [
      3,
      260
    ],
    [
      4,
      330
    ],
    [
      5,
      420
    ],
    [
      6,
      505
    ]
  ]
}
:::

## Diagram

::: diagram
{
  "alt": "Author writes in the Claude app, which publishes the index and the posts",
  "caption": "How the pieces connect.",
  "svg": "<svg viewBox=\"0 0 640 180\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><rect class=\"bl-d-box\" x=\"10\" y=\"60\" width=\"150\" height=\"60\" rx=\"10\"/><text class=\"bl-d-text\" x=\"85\" y=\"96\" text-anchor=\"middle\" font-size=\"18\">Author</text><path class=\"bl-d-line\" d=\"M160 90H240\"/><rect class=\"bl-d-strong\" x=\"240\" y=\"60\" width=\"170\" height=\"60\" rx=\"10\"/><text class=\"bl-d-on-strong\" x=\"325\" y=\"96\" text-anchor=\"middle\" font-size=\"18\">Claude app</text><path class=\"bl-d-accent\" d=\"M410 80L480 40M410 100L480 140\"/><rect class=\"bl-d-box\" x=\"480\" y=\"10\" width=\"150\" height=\"60\" rx=\"10\"/><text class=\"bl-d-text\" x=\"555\" y=\"46\" text-anchor=\"middle\" font-size=\"18\">Index</text><rect class=\"bl-d-box\" x=\"480\" y=\"110\" width=\"150\" height=\"60\" rx=\"10\"/><text class=\"bl-d-text\" x=\"555\" y=\"146\" text-anchor=\"middle\" font-size=\"18\">Posts</text></svg>",
  "svgNarrow": "<svg viewBox=\"0 0 320 300\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><rect class=\"bl-d-box\" x=\"85\" y=\"0\" width=\"150\" height=\"54\" rx=\"10\"/><text class=\"bl-d-text\" x=\"160\" y=\"33\" text-anchor=\"middle\" font-size=\"16\">Author</text><path class=\"bl-d-line\" d=\"M160 54V96\"/><rect class=\"bl-d-strong\" x=\"85\" y=\"96\" width=\"150\" height=\"54\" rx=\"10\"/><text class=\"bl-d-on-strong\" x=\"160\" y=\"129\" text-anchor=\"middle\" font-size=\"16\">Claude app</text><path class=\"bl-d-accent\" d=\"M140 150L80 236M180 150L240 236\"/><rect class=\"bl-d-box\" x=\"5\" y=\"236\" width=\"140\" height=\"54\" rx=\"10\"/><text class=\"bl-d-text\" x=\"75\" y=\"269\" text-anchor=\"middle\" font-size=\"16\">Index</text><rect class=\"bl-d-box\" x=\"175\" y=\"236\" width=\"140\" height=\"54\" rx=\"10\"/><text class=\"bl-d-text\" x=\"245\" y=\"269\" text-anchor=\"middle\" font-size=\"16\">Posts</text></svg>"
}
:::

## Code

```js title=copy.js
// Copy from a click handler
button.addEventListener('click', async () => {
  await navigator.clipboard.writeText(code.textContent);
});
```

```
A fence with no language is shown without highlighting, and a very long line scrolls sideways inside its own box instead of widening the page.
```

## Sequence without modes

::: sequence
{
  "lanes": [
    "Reader",
    "Index",
    "Post"
  ],
  "messages": [
    {
      "from": "Reader",
      "to": "Index",
      "label": "open",
      "title": "Open the blog",
      "text": "The reader opens the index link."
    },
    {
      "from": "Index",
      "to": "Post",
      "label": "tap a title",
      "title": "Follow a post",
      "text": "Each title is a plain link to a post artifact."
    },
    {
      "from": "Post",
      "to": "Index",
      "label": "All posts",
      "title": "Back to the index",
      "text": "The footer links back."
    }
  ]
}
:::

## Terminal and tabs

::: terminal
{
  "lines": [
    [
      "cmd",
      "node tools/check-theme.js ledger"
    ],
    [
      "ok",
      "check-theme: all passed"
    ]
  ]
}
:::

::: codetabs
{
  "files": [
    {
      "name": "tokens.css",
      "lang": "css",
      "code": ":root{\n  --bl-accent:light-dark(#2950b8,#93adff); /* links */\n}"
    },
    {
      "name": "theme.json",
      "lang": "json",
      "code": "{\n  \"name\": \"ledger\",\n  \"indexLayout\": \"ledger\"\n}"
    },
    {
      "name": "build.py",
      "lang": "python",
      "code": "def build(name):\n    # one post\n    return f\"{name}.html\""
    }
  ]
}
:::

## Stepper with long labels

::: stepper
{
  "steps": [
    {
      "label": "Write the draft",
      "title": "Write",
      "text": "Long labels collapse to the current one on narrow screens."
    },
    {
      "label": "Ask for figures",
      "title": "Figures",
      "text": "Ask in a sentence."
    },
    {
      "label": "Publish privately",
      "title": "Publish",
      "text": "It starts private."
    },
    {
      "label": "Share it",
      "title": "Share",
      "text": "You press Share."
    }
  ]
}
:::
