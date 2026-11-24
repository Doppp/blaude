# stepper

A step-by-step explainer: a row of numbered dots that fills in as the reader taps Next, with each step's text below. Buttons, arrow keys and swipe. Without JavaScript it is a plain numbered list.

**Use when** the author describes a process, a sequence of stages, or "first... then... finally". Good for 3 to 7 steps.

**Inputs (JSON)**

| Field | Required | Notes |
| --- | --- | --- |
| `steps` | yes, 2+ | List of `{ "label", "title", "text", "note" }` |
| `steps[].label` | yes | One or two words under the dot. Keep labels under about 8 characters, or only the current label is shown on phones |
| `steps[].title` | yes | Bold heading for the step |
| `steps[].text` | yes | One or two sentences, from the author's text where possible |
| `steps[].note` | no | A tiny marker above the dot, such as "you" |
| `label` | no | Screen-reader name, such as "Publishing steps" |
| `caption` | no | Caption under the figure |

**Example**

```text
::: stepper
{ "label": "Publishing steps", "steps": [
  { "label": "Draft", "title": "Write your draft", "text": "Paste it into Claude or write it there." },
  { "label": "Share", "note": "you", "title": "You press Share", "text": "Only you can make a page public." }
] }
:::
```

The box is as tall as the longest step, so the page never jumps while tapping through.
