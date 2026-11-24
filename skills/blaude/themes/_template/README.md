# Theme template

1. Copy this folder to `skills/blaude/themes/<your-theme>/`. Use lowercase letters and dashes.
2. In `theme.json`, set `name` to the folder name, then fill in `displayName`, `author`, `description` and `fonts`. Set `indexLayout` to `ledger` or `featured`.
3. In `tokens.css`, change the colours and fonts. Leave the spacing scale alone.
4. Delete `overrides.css` unless you need it.
5. Run `node tools/build.js`, which writes your `preview.html`, then `node tools/check-theme.js <your-theme>`.

See CONTRIBUTING.md for the review criteria.
