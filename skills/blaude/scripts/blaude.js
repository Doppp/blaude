#!/usr/bin/env node
'use strict';
// Blaude command line. Node 18+, no dependencies. Run from anywhere:
//
//   node blaude.js new-config --name "My Blog" --author "Ann" [--tagline "..."] [--email a@b.c] [--theme ledger|featured]
//   node blaude.js index  <config.json> [--out index.html]
//   node blaude.js post   <post.md> --config <config.json|index.html> [--index-url URL] [--theme NAME]
//                         [--out post.html] [--url POST_URL --update <config.json>]
//   node blaude.js config <index.html> [--out config.json]     read the config block from an index page
//   node blaude.js meta   <post.html>                          read a post's blaude-post block
//   node blaude.js source <post.html> [--out post.md]          the post's Markdown source, images restored (for edits)
//   node blaude.js check  <page.html> [...]                    artifact rules: doctype, size, hosts, data blocks
//   node blaude.js tokens <tokens.css|tokens.json>             validate a theme's tokens (contrast, limits)
//   node blaude.js export <dir> --out blog.zip                 export pages saved in <dir> (see references/export.md)
//
// Exit code 1 on any error, with the reason on stderr.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const lib = path.join(__dirname, 'lib');
const { buildPost, unpackSource } = require(path.join(lib, 'post'));
const { buildIndex, extractConfig, extractPostMeta } = require(path.join(lib, 'index'));
const { checkPage } = require(path.join(lib, 'check'));
const { validateConfig } = require(path.join(lib, 'config'));
const { parseTokens, validateTokens } = require(path.join(lib, 'tokens'));

function args(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      out[k] = v;
    } else out._.push(a);
  }
  return out;
}
const read = (p) => fs.readFileSync(p, 'utf8');
const fail = (msg) => {
  console.error(`blaude: ${msg}`);
  process.exit(1);
};
const loadConfig = (p) => {
  if (!p) fail('--config is required');
  const src = read(p);
  const cfg = /<html|<!DOCTYPE/i.test(src) ? extractConfig(src) : JSON.parse(src);
  if (!cfg) fail(`${p} has no blaude-config block`);
  return cfg;
};
const out = (file, text) => {
  if (file && file !== true) {
    fs.writeFileSync(file, text);
    console.error(`wrote ${file} (${(Buffer.byteLength(text) / 1024).toFixed(1)} KB)`);
  } else process.stdout.write(text.endsWith('\n') ? text : text + '\n');
};

const commands = {
  'new-config'(a) {
    if (!a.name || !a.author) fail('new-config needs --name and --author');
    const theme = a.theme && a.theme !== true ? a.theme : 'ledger';
    const cfg = {
      blaude: '1.0',
      blogId: crypto.randomUUID(),
      blog: { name: a.name, ...(a.tagline ? { tagline: a.tagline } : {}), author: a.author, bio: '', ...(a.email ? { email: a.email } : {}), links: [] },
      theme: { name: theme },
      sections: [{ type: 'posts', id: 'posts', title: 'Posts' }, { type: 'about', id: 'about', title: 'About' }],
      posts: [],
    };
    const errs = validateConfig(cfg);
    if (errs.length) fail(errs.join('; '));
    out(a.out, JSON.stringify(cfg, null, 2));
  },
  index(a) {
    const cfg = loadConfig(a._[0] || a.config);
    out(a.out, buildIndex(cfg).html);
  },
  post(a) {
    if (!a._[0]) fail('post needs a Markdown file');
    const cfg = loadConfig(a.config);
    const indexUrl = a['index-url'] && a['index-url'] !== true ? a['index-url'] : cfg.indexUrl;
    if (!indexUrl) fail('--index-url is required (the index artifact link)');
    const theme = a.theme && a.theme !== true ? { name: a.theme } : undefined;
    const prior = a.url ? (cfg.posts || []).find((p) => p.url === a.url) : null;
    const { html, entry } = buildPost({ source: read(a._[0]), blog: cfg, indexUrl, theme, url: a.url || '', status: prior ? prior.status : 'draft' });
    const r = checkPage(html);
    if (r.errors.length) fail(`the built page breaks artifact rules:\n  - ${r.errors.join('\n  - ')}`);
    for (const w of r.warnings) console.error(`warning: ${w}`);
    out(a.out, html);
    if (a.update) {
      if (!a.url) fail('--update needs --url (the post artifact link)');
      const target = loadConfig(a.update);
      const i = target.posts.findIndex((p) => p.url === a.url);
      if (i >= 0) target.posts[i] = { ...target.posts[i], ...entry, status: target.posts[i].status };
      else target.posts.push(entry);
      target.posts.sort((x, y) => y.date.localeCompare(x.date));
      const errs = validateConfig(target);
      if (errs.length) fail(errs.join('; '));
      fs.writeFileSync(a.update, JSON.stringify(target, null, 2));
      console.error(`${i >= 0 ? 'updated' : 'added'} ${entry.title} in ${a.update}`);
    } else {
      console.error(`posts[] entry: ${JSON.stringify(entry)}`);
    }
  },
  config(a) {
    const cfg = extractConfig(read(a._[0]));
    if (!cfg) fail('no blaude-config block found');
    out(a.out, JSON.stringify(cfg, null, 2));
  },
  meta(a) {
    const m = extractPostMeta(read(a._[0]));
    if (!m) fail('no blaude-post block found');
    out(a.out, JSON.stringify(m, null, 2));
  },
  source(a) {
    const md = unpackSource(read(a._[0]));
    if (md === null) fail('no blaude-source block found; rebuild the post from its text');
    out(a.out, md);
  },
  check(a) {
    let bad = 0;
    for (const f of a._) {
      const r = checkPage(read(f), { name: f });
      console.log(`${r.errors.length ? 'FAIL' : 'ok  '} ${f} (${(r.bytes / 1024).toFixed(1)} KB)`);
      for (const e of r.errors) console.log(`  - ${e}`);
      for (const w of r.warnings) console.log(`  warn: ${w}`);
      if (r.errors.length) bad++;
    }
    if (bad) process.exit(1);
  },
  tokens(a) {
    const src = read(a._[0]);
    const tokens = a._[0].endsWith('.json') ? JSON.parse(src) : parseTokens(src);
    const r = validateTokens(tokens);
    for (const x of r.report) console.log(`${x.ratio >= x.min ? 'ok  ' : 'FAIL'} ${x.mode.padEnd(5)} ${x.fg} on ${x.bg}: ${x.ratio}:1 (needs ${x.min})`);
    for (const e of r.errors) console.log(`  - ${e}`);
    for (const w of r.warnings) console.log(`  warn: ${w}`);
    if (r.errors.length) process.exit(1);
  },
  export(a) {
    const { exportBlog } = require(path.join(lib, 'export'));
    if (!a._[0] || !a.out) fail('export needs <dir> and --out blog.zip');
    const r = exportBlog(a._[0], a.out);
    console.error(`exported ${r.posts} posts to ${a.out}`);
  },
};

const a = args(process.argv.slice(2));
const cmd = a._.shift();
if (!cmd || !commands[cmd]) {
  console.error(read(__filename).split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n'));
  process.exit(cmd ? 1 : 0);
}
try {
  commands[cmd](a);
} catch (e) {
  fail(e.message);
}
