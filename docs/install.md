# Installing Blaude

Blaude is a skill. It runs inside your own Claude, on your own plan. There's nothing else to install or sign up for.

## In the Claude app (web, desktop or mobile)

No terminal needed.

1. In **Settings → Capabilities**, turn on **Code execution and file creation**. Blaude uses it to build pages and check them.
2. Download `blaude-skill.zip` from the [latest release](https://github.com/Doppp/blaude/releases/latest). Don't unzip it.
3. Go to **Customize → Skills**, click **+**, choose **Create skill → Upload a skill**, and select the zip.

On Team and Enterprise plans, an owner may need to enable skills for the organisation first.

The zip holds one folder, `blaude/`, with `SKILL.md` at its top. That's what the upload expects; if you build your own zip, zip the `skills/blaude` folder from `skills/`, not its contents.

## In Claude Code

```text
/plugin marketplace add Doppp/blaude
/plugin install blaude@blaude
```

## Check it works

Start a new chat and say:

> Set up my Blaude blog.

Claude should ask for your blog's name, your name, a one-line intro and a look (Ledger or Featured), then publish your index. Open it on claude.ai and choose **Share** to make it public. That link is your blog's address.

## Updating

Download the new `blaude-skill.zip` and upload it the same way; it replaces the old version. Your blog isn't affected: it lives in your artifacts, not in the skill. Posts keep the look they were published with until you say "retheme all my posts".

## Removing

Delete the skill under **Customize → Skills**. Your blog keeps working: every page is a self-contained artifact. To take it elsewhere first, say "Export my blog".
