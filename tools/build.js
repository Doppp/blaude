#!/usr/bin/env node
'use strict';
// Build the demo blog and theme previews from the templates, for tests and the repo examples.
//
//   node tools/build.js
//
// Writes:
//   examples/demo-blog/posts/<slug>.html   the demo posts (committed)
//   skills/blaude/themes/<theme>/preview.html  the demo post in each theme (committed)
//   build/themes/<theme>/*.html            test pages per theme (not committed)

const fs = require('fs');
const path = require('path');
const { buildPost } = require('../skills/blaude/scripts/lib/post');
const { frontMatter } = require('../skills/blaude/scripts/lib/markdown');

const ROOT = path.join(__dirname, '..');
const DEMO = path.join(ROOT, 'examples/demo-blog');
const THEMES = path.join(ROOT, 'skills/blaude/themes');
const BUILD = path.join(ROOT, 'build');
const INDEX_URL = 'https://claude.ai/artifact/8Ynx2ggSTWKAmGroYKt8mj';

const read = (p) => fs.readFileSync(p, 'utf8');
const write = (p, s) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, s);
  console.log(`  wrote ${path.relative(ROOT, p)} (${(Buffer.byteLength(s) / 1024).toFixed(1)} KB)`);
};
const themes = () => fs.readdirSync(THEMES, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith('_')).map((d) => d.name).sort();

function demoSources() {
  const dir = path.join(DEMO, 'src/posts');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort().map((f) => {
    const source = read(path.join(dir, f));
    return { slug: path.basename(f, '.md'), source, fm: frontMatter(source).data };
  });
}

function main() {
  const config = JSON.parse(read(path.join(DEMO, 'src/config.json')));
  const sources = demoSources();
  const preview = sources.find((s) => s.fm.preview) || null;
  const fixtures = fs.readdirSync(path.join(__dirname, 'fixtures')).filter((f) => f.endsWith('.md')).map((f) => ({ slug: path.basename(f, '.md'), source: read(path.join(__dirname, 'fixtures', f)) }));

  console.log('demo blog');
  const entries = [];
  for (const s of sources) {
    const { html, entry } = buildPost({ source: s.source, blog: config, indexUrl: INDEX_URL, url: s.fm.url, status: 'public' });
    write(path.join(DEMO, 'posts', `${s.slug}.html`), html);
    entries.push(entry);
  }
  config.posts = entries.sort((a, b) => b.date.localeCompare(a.date));

  for (const name of themes()) {
    console.log(`theme ${name}`);
    const theme = { name };
    const pv = preview || fixtures.find((f) => f.slug === 'plain');
    write(path.join(THEMES, name, 'preview.html'), buildPost({ source: pv.source, blog: config, indexUrl: INDEX_URL, theme }).html);
    const out = path.join(BUILD, 'themes', name);
    fs.rmSync(out, { recursive: true, force: true });
    for (const s of sources) write(path.join(out, `post-${s.slug}.html`), buildPost({ source: s.source, blog: config, indexUrl: INDEX_URL, theme }).html);
    for (const f of fixtures) write(path.join(out, `post-${f.slug}.html`), buildPost({ source: f.source, blog: config, indexUrl: INDEX_URL, theme }).html);
  }
}

main();
