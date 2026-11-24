# sequence

An animated sequence diagram: one vertical lifeline per party, with messages that fly between them, grouped into shaded stages. Play, previous/next and arrow keys. Optional mode switch (such as "First visit" and "Return visit") and a live counter. Redraws when the screen size changes. Without JavaScript it is a list of messages.

**Use when** the post explains a protocol, an API call, a handshake, or any back-and-forth between two to four parties.

**Inputs (JSON)**

| Field | Required | Notes |
| --- | --- | --- |
| `lanes` | yes, 2-4 | `[{ "name": "DNS resolver", "short": "Resolver" }]` or plain names. `short` is used on phones |
| `modes` | yes (or `messages`) | `[{ "name", "intro", "messages" }]`. Two or more modes show a switch |
| `modes[].intro` | no | `{ "title": "Ready", "text": "Nothing is cached yet. Press Play." }`, shown before Play |
| `messages[]` | yes | `{ "from", "to", "label", "group", "title", "text" }`. `from`/`to` are lane names; `label` sits on the arrow (keep it under about 20 characters); `group` shades consecutive messages into a stage; `title` and `text` explain the step |
| `messages` | instead of modes | One mode with no switch |
| `counter` | no | Label for a live count of replies reaching the first lane, such as "Round trips" |
| `modesLabel` | no | Screen-reader name for the switch, such as "Visit" |
| `alt` | no | Screen-reader description of the diagram |

**Example**

```text
::: sequence
{ "counter": "Round trips", "lanes": ["Browser", "Server"],
  "messages": [
    { "from": "Browser", "to": "Server", "label": "GET /", "group": "HTTP", "title": "Ask for the page", "text": "The browser asks for the page." },
    { "from": "Server", "to": "Browser", "label": "200 OK", "group": "HTTP", "title": "The page arrives", "text": "One round trip." }
  ] }
:::
```

Under reduced motion, Play steps through the messages without the flying packet.
