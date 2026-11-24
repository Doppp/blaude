# chart

A line, bar or scatter chart drawn from data in the post. Tap or hover to read values; arrow keys move along the points. The data also sits in a table: hidden by default, shown with `showTable`, and visible if scripts don't run.

**Use when** the author gives numbers that change over time (line), compares amounts (bar), or relates two measures (scatter). Never invent or round the author's numbers.

**Inputs (JSON)**

| Field | Required | Notes |
| --- | --- | --- |
| `type` | yes | `line`, `bar` or `scatter` |
| `columns` | yes | First is the x column (labels, or numbers for line/scatter), then one per series. Up to 6 series |
| `rows` | yes | One list per x value, same length as `columns`. Use `null` for a missing value |
| `alt` | yes | One sentence stating what the chart shows, including the main trend |
| `title` | no | Short title above the chart |
| `unit` | no | Suffix for values, such as `" ms"` or `"%"` |
| `showTable` | no | `true` to also show the data table ("show the data") |
| `caption` | no | Caption under the chart, such as the source |

**Example**

```text
::: chart
{ "type": "line", "title": "Visitors", "alt": "Visitors rose from 120 in January to 410 in June", "columns": ["Month", "Visitors"], "rows": [["Jan", 120], ["Feb", 180], ["Mar", 240]] }
:::
```

Colours come from `--bl-chart-1`..`--bl-chart-6`. The chart redraws when the screen size changes, and axis labels thin out so they never overlap.
