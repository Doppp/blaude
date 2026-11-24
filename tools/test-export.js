#!/usr/bin/env node
'use strict';
// Export the demo blog and check the result: the zip layout, relative links that resolve,
// the Markdown source with front matter, and every exported page against the artifact rules.
//
//   node tools/test-export.js

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { checkPage } = require('../skills/blaude/scripts/lib/check');

const ROOT = path.join(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'blaude-export-'));
const pages = path.join(tmp, 'pages');
fs.mkdirSync(pages);
// The skill saves each artifact it reads into one folder; names don't matter.
fs.copyFileSync(path.join(ROOT, 'examples/demo-blog/index.html'), path.join(pages, 'a.html'));
for (const f of fs.readdirSync(path.join(ROOT, 'examples/demo-blog/posts'))) fs.copyFileSync(path.join(ROOT, 'examples/demo-blog/posts', f), path.join(pages, `post-${f}`));

const zipPath = path.join(tmp, 'blog.zip');
execFileSync(process.execPath, [path.join(ROOT, 'skills/blaude/scripts/blaude.js'), 'export', pages, '--out', zipPath], { stdio: 'inherit' });
const out = path.join(tmp, 'out');
execFileSync('unzip', ['-q', zipPath, '-d', out]);

const problems = [];
const must = (cond, msg) => { if (!cond) problems.push(msg); };
const list = execFileSync('find', ['.', '-type', 'f'], { cwd: out }).toString().trim().split('\n').map((f) => f.slice(2)).sort();
console.log(list.map((f) => `  ${f}`).join('\n'));
for (const f of ['index.html', 'config.json', 'how-a-post-gets-published/index.html', 'how-a-post-gets-published/post.md', 'what-happens-when-you-open-a-link/index.html', 'what-happens-when-you-open-a-link/post.md']) must(list.includes(f), `missing ${f}`);

const cfg = JSON.parse(fs.readFileSync(path.join(out, 'config.json'), 'utf8'));
for (const p of cfg.posts) {
  must(!/^https?:/.test(p.url), `config.json post url is not relative: ${p.url}`);
  must(fs.existsSync(path.join(out, p.url)), `config.json post url does not resolve: ${p.url}`);
  must(/^https:\/\/claude\.ai\/artifact\//.test(p.artifactUrl || ''), `config.json keeps no artifactUrl for ${p.title}`);
}
for (const f of list.filter((x) => x.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(out, f), 'utf8');
  const r = checkPage(html, { name: f });
  for (const e of r.errors) problems.push(`${f}: ${e}`);
  must(!/claude\.ai\/artifact\/8Ynx2ggSTWKAmGroYKt8mj/.test(html), `${f} still links to the index artifact`);
  for (const m of html.replace(/<script\b[\s\S]*?<\/script>/gi, '').matchAll(/href="([^"#]+)(#[^"]*)?"/g)) {
    const href = m[1];
    if (/^(https?:|mailto:)/.test(href)) continue;
    must(fs.existsSync(path.join(out, path.dirname(f), href)), `${f}: link ${href} does not resolve`);
  }
}
const md = fs.readFileSync(path.join(out, 'how-a-post-gets-published/post.md'), 'utf8');
must(/^---\ntitle: "How a post gets published"\ndate: 2026-11-24\n/.test(md), 'post.md front matter');
must(md.includes('You write in Claude the way you already do.'), 'post.md keeps the author text');
must(md.includes('::: stepper'), 'post.md keeps component blocks');

// The exported index renders its relative links.
(async () => {
  const { chromium } = require('playwright');
  const b = await chromium.launch();
  const page = await b.newPage();
  await page.goto('file://' + path.join(out, 'index.html'));
  const hrefs = await page.$$eval('.bl-row', (as) => as.map((a) => a.getAttribute('href')));
  must(hrefs.length === 2 && hrefs.every((h) => /\/index\.html$/.test(h)), `exported index rows: ${JSON.stringify(hrefs)}`);
  await b.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  if (problems.length) {
    console.log(`FAIL export\n${problems.map((p) => `  - ${p}`).join('\n')}`);
    process.exitCode = 1;
  } else console.log('ok   export: zip layout, relative links, post.md, artifact rules');
})();
