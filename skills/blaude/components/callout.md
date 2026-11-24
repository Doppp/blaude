# callout

A boxed note beside the main text, in three variants.

| Variant | Colour | Use for |
| --- | --- | --- |
| `note` (default) | accent | Background, an aside, a definition |
| `tip` | good (green) | Advice, "why this matters", a shortcut |
| `warning` | warn (amber) | A risk, a common mistake, something that can go wrong |

**Inputs (Markdown):** the variant after the name; the body is Markdown. Start with a short bold lead-in; it takes the variant colour.

```text
::: callout warning
**Watch the last gap.** If time to first byte is large while the others are small, the network is fine. The server is slow to answer.
:::
```

The text is the author's. If the author didn't write a lead-in, don't invent one: a callout without bold text is fine.
