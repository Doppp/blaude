# code

Highlighted code with a Copy button in its own toolbar row, never over the code.

**Use when** the post contains code, a config file or commands to copy. For several related files use `codetabs`; for a command and its output use `terminal`.

**Inputs:** an ordinary fenced code block. The language after the fence picks the highlighting (`js`, `ts`, `py`, `sh`, `json`, `css`, `html`, `http`, `yaml`; anything else is shown plain). Add `title=<name>` to show a file name in the toolbar.

````text
```json title=post.json
{ "title": "How a post gets published", "status": "public" }
```
````

The code is the author's: copy it exactly, including indentation. Long lines scroll sideways inside the box; the page never does. Copy uses the clipboard from the button's click, and says "Select to copy" if the browser refuses.
