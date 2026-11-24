# Blaude

**Blogging with Claude.**

Blaude is an open-source Claude skill that turns your writing into a blog made of Claude artifacts. You write in the Claude app the way you already do. Claude builds each post as a page with its own link, adds the figures and animations you ask for, and keeps an index page up to date. There is no server, no hosting, no build step and no terminal.

**Live demo**:

- [The demo blog](https://claude.ai/artifact/8Ynx2ggSTWKAmGroYKt8mj): the index page, in the default Ledger theme
- [What happens when you open a link](https://claude.ai/artifact/KbK4HARDNTL3p1dzS6KS5a): an animated sequence diagram, a self-typing terminal and tabbed code
- [How a post gets published](https://claude.ai/artifact/AUuouYvrKE1t5ecSd8eRYm): a step-through figure, a callout and a pull quote

## Why

Developers can already ask Claude Code to build them a site with a blog. Most people who write in Claude every day will never open a terminal, set up a repo or buy a domain. Claude artifacts are already hosted pages with shareable links, so a blog only needs a consistent way to make them, link them and keep them tidy. That's what Blaude is.

What you get:

- **Posts that can do more than text.** Step-by-step figures, animated diagrams, charts, galleries, terminals that type themselves out and tabbed code, all inside the post.
- **Your words, unchanged.** Blaude never rewrites your text. It adds structure and figures around it, and asks before changing anything else.
- **Nothing to run.** Your blog is just artifacts in your own Claude account, on your own subscription.
- **Works from your phone.** Every step is a sentence in chat, and pages are designed for a 360 px screen first.
- **Easy to leave.** Export everything as HTML and Markdown and move to any static host or Jekyll.

## How it works

A blog is two kinds of artifacts:

```text
            writes                     installs skill
  Author ───────────▶ Claude app + Blaude ◀─────────── this repo
                              │
                         publishes
                    ┌─────────┴─────────┐
                    ▼                   ▼
  Reader ──▶ Index artifact  ◀─links─▶  Post artifacts
            (address, config,         (one per post,
             theme)                    self-contained)
```

- The **index** is your blog's permanent address. It holds your settings as a small JSON block and lists your posts.
- Each **post** is a self-contained HTML page that links back to the index.
- The **skill** is the only moving part. It runs in your Claude app and writes both.

## Install

### In the Claude app (web, desktop or mobile)

1. In **Settings → Capabilities**, make sure **Code execution and file creation** is turned on.
2. Download `blaude-skill.zip` from the [latest release](https://github.com/Doppp/blaude/releases/latest).
3. Go to **Customize → Skills**, click **+**, choose **Create skill → Upload a skill**, and select the zip.

That's it. On Team and Enterprise plans, an owner may need to enable skills first.

### In Claude Code

```text
/plugin marketplace add Doppp/blaude
/plugin install blaude@blaude
```

## Use

Start a chat in Claude and say:

> Set up my Blaude blog.

Claude asks for a name, a one-line intro and a theme, then publishes your index. Open it on claude.ai and **share it publicly**. That link is your blog's address.

Then, whenever you want to publish:

> Turn this into a post. Add a step-by-step diagram of how the cache works after the second paragraph.

Claude publishes the post and adds it to your index as a draft. **Share the post publicly** from its page, and it appears on your index the next time Claude updates it.

Everything else is a sentence too:

| Say | What happens |
| --- | --- |
| "Fix the typo in my last post" | Edits that post in place; the link stays the same |
| "Add a Talks section" | Adds a dated list section to your index |
| "Update my bio" | Rewrites the About section |
| "Switch to the Featured theme" | Changes your index layout |
| "Make my blog look like this" + a screenshot | Generates a personal theme |
| "Delete the post about X" | Removes the post and its link from the index |
| "I lost my blog link" | Finds your index, or rebuilds it from your posts |
| "Export my blog" | Gives you a zip of HTML and Markdown |

The only steps outside the chat are installing the skill and pressing **Share** on each page. Claude can't make anything public for you, so drafts stay private by default.

## Themes

| Theme | Index layout | Best for |
| --- | --- | --- |
| `ledger` (default) | A contents page: your name, an intro, posts grouped by year | Most blogs, and long archives |
| `featured` | Your latest post shown large with a cover, older posts below | Writers who post less often |

Both share the same post design: one calm reading column, Literata for body text, Instrument Sans for headings, JetBrains Mono for dates and code, light and dark modes.

## Components

Ask for these by describing what you want; you never need their names.

| Component | What it does |
| --- | --- |
| `figure` | Image or SVG with a caption |
| `gallery` | Several images, swipeable |
| `pullquote` | A line from your post, emphasised |
| `callout` | A note, tip or warning |
| `stepper` | A figure that changes as the reader taps through steps |
| `chart` | Line, bar or scatter chart from your data |
| `diagram` | Boxes and arrows, flows, timelines |
| `code` | Highlighted code with a Copy button |
| `sequence` | Animated sequence diagram: messages flying between parties |
| `terminal` | Commands that type themselves out with their output |
| `codetabs` | Several files in tabs |

## Limitations

Blaude works within what Claude artifacts allow today, so some blog staples are missing:

- **No RSS.** Artifacts can't serve a plain feed file. Your index is the way readers find new posts.
- **No custom domains.** Your blog lives at a claude.ai artifact link.
- **No comments, subscribers, email or view counts.**
- **No embedded video or remote images.** Images you attach are resized and stored inside the post; videos become a thumbnail that links out.
- **Links are long.** Share your index link; readers find posts from there.

Open questions we're still testing: how link previews look when artifact links are shared on social media, and how public artifacts behave for readers without a Claude account.

## Why not a hosted app?

Anthropic doesn't allow third-party apps to sign users in with a Claude subscription or route requests through one. So Blaude isn't an app: it's a set of instructions and building blocks that run inside your own Claude, on your own plan. We never see your writing or your account.

## Contributing

Themes are the easiest place to start. Copy `themes/_template/`, fill in the tokens, then run:

```sh
node tools/build.js
node tools/check-theme.js <your-theme>
```

and open a pull request. CI renders your theme at phone, tablet and desktop widths in light and dark, and checks contrast, fonts and layout. See [CONTRIBUTING.md](CONTRIBUTING.md).

Bug reports and component ideas are welcome as issues.

## License

MIT. Blaude is a community project and is not affiliated with or endorsed by Anthropic. Claude is a trademark of Anthropic.
