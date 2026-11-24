#!/usr/bin/env node
'use strict';
// Build the demo blog and theme previews from the templates, for tests and the repo examples.
//
//   node tools/build.js
//
// Writes:
//   examples/demo-blog/index.html             the demo index (committed)
//   examples/demo-blog/posts/<slug>.html      the demo posts (committed)
//   skills/blaude/themes/<theme>/preview.html the demo post in each theme (committed)
//   build/themes/<theme>/*.html               test pages per theme: the demo index in the
//                                             theme's layout, indexes with 0, 1 and 500 posts,
//                                             the demo posts and fixture posts (not committed)

const fs = require('fs');
const path = require('path');
const { buildPost } = require('../skills/blaude/scripts/lib/post');
const { buildIndex } = require('../skills/blaude/scripts/lib/index');
const { frontMatter } = require('../skills/blaude/scripts/lib/markdown');

const ROOT = path.join(__dirname, '..');
const DEMO = path.join(ROOT, 'examples/demo-blog');
const THEMES = path.join(ROOT, 'skills/blaude/themes');
const BUILD = path.join(ROOT, 'build');
const INDEX_URL = 'https://claude.ai/artifact/8Ynx2ggSTWKAmGroYKt8mj';

const read = (p) => fs.readFileSync(p, 'utf8');
const quiet = process.argv.includes('--quiet');
const write = (p, s) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, s);
  if (!quiet) console.log(`  wrote ${path.relative(ROOT, p)} (${(Buffer.byteLength(s) / 1024).toFixed(1)} KB)`);
};
const themes = () => fs.readdirSync(THEMES, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith('_')).map((d) => d.name).sort();
const clone = (o) => JSON.parse(JSON.stringify(o));

function demoSources() {
  const dir = path.join(DEMO, 'src/posts');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort().map((f) => {
    const source = read(path.join(dir, f));
    return { slug: path.basename(f, '.md'), source, fm: frontMatter(source).data };
  });
}

// Deterministic fake posts for the 500-post index.
function manyPosts(n) {
  const words = ['cache', 'links', 'phones', 'fonts', 'charts', 'drafts', 'images', 'colour', 'maps', 'tables', 'notes', 'servers'];
  const tags = ['guide', 'web', 'writing', 'design', 'data', 'networking'];
  const out = [];
  let d = Date.UTC(2026, 10, 24);
  for (let i = 0; i < n; i++) {
    d -= 86400000 * (1 + (i % 3));
    const date = new Date(d).toISOString().slice(0, 10);
    const w = words[i % words.length];
    out.push({
      slug: `post${i}`,
      url: `https://claude.ai/artifact/post-${i}`,
      title: i % 7 === 0 ? `A longer title about ${w} that wraps onto a second line on a small phone screen` : `Notes on ${w}, part ${i + 1}`,
      date,
      description: `Post ${i + 1} about ${w}.`,
      tags: [tags[i % tags.length], tags[(i + 2) % tags.length]],
      status: i % 50 === 3 ? 'draft' : 'public',
      readingMinutes: 2 + (i % 9),
    });
  }
  return out;
}

function fixtureIndexes(config) {
  const zero = clone(config);
  zero.posts = [];
  zero.blog.bio = '';
  zero.blog.links = [];
  delete zero.blog.email;
  delete zero.blog.tagline;
  const one = clone(config);
  one.posts = one.posts.slice(0, 1);
  const many = clone(config);
  many.posts = manyPosts(500);
  many.blog.bio = 'I write about the web.\n\nThis paragraph has **bold**, *italic*, `code` and [a link](https://example.com). A [bad link](javascript:alert(1)) stays text.';
  many.sections = [
    { type: 'featured', id: 'start-here', title: 'Start here', items: [{ title: 'How a post gets published', url: 'https://claude.ai/artifact/AUuouYvrKE1t5ecSd8eRYm', note: 'The five steps.' }, { title: 'An outside link', url: 'https://example.com' }] },
    { type: 'posts', id: 'posts', title: 'Writing' },
    { type: 'list', id: 'talks', title: 'Talks', items: [{ date: '2026-10-02', title: 'Writing for phones', url: 'https://example.com/talk', note: 'Brighton' }, { date: '2025-05-12', title: 'A talk with no link' }] },
    { type: 'projects', id: 'projects', title: 'Projects', items: [{ name: 'Blaude', url: 'https://github.com/Doppp/blaude', description: 'Blogging with Claude.' }, { name: 'Untitled' }] },
    { type: 'about', id: 'about', title: 'About' },
  ];
  return { 'index-0': zero, 'index-1': one, 'index-500': many };
}

function main() {
  const config = JSON.parse(read(path.join(DEMO, 'src/config.json')));
  const sources = demoSources();
  const preview = sources.find((s) => s.fm.preview) || null;
  const fixtures = fs.readdirSync(path.join(__dirname, 'fixtures')).filter((f) => f.endsWith('.md')).map((f) => ({ slug: path.basename(f, '.md'), source: read(path.join(__dirname, 'fixtures', f)) }));

  if (!quiet) console.log('demo blog');
  const entries = [];
  for (const s of sources) {
    const { html, entry } = buildPost({ source: s.source, blog: config, indexUrl: INDEX_URL, url: s.fm.url, status: 'public' });
    write(path.join(DEMO, 'posts', `${s.slug}.html`), html);
    entries.push(entry);
  }
  config.posts = entries.sort((a, b) => b.date.localeCompare(a.date));
  write(path.join(DEMO, 'index.html'), buildIndex(config).html);

  for (const name of themes()) {
    if (!quiet) console.log(`theme ${name}`);
    const theme = { name };
    const pv = preview || fixtures.find((f) => f.slug === 'plain');
    write(path.join(THEMES, name, 'preview.html'), buildPost({ source: pv.source, blog: config, indexUrl: INDEX_URL, theme }).html);
    const out = path.join(BUILD, 'themes', name);
    fs.rmSync(out, { recursive: true, force: true });
    const themed = clone(config);
    themed.theme = theme;
    write(path.join(out, 'index.html'), buildIndex(themed).html);
    for (const [file, cfg] of Object.entries(fixtureIndexes(themed))) write(path.join(out, `${file}.html`), buildIndex(cfg).html);
    for (const s of sources) write(path.join(out, `post-${s.slug}.html`), buildPost({ source: s.source, blog: config, indexUrl: INDEX_URL, theme }).html);
    for (const f of fixtures) write(path.join(out, `post-${f.slug}.html`), buildPost({ source: f.source, blog: config, indexUrl: INDEX_URL, theme }).html);
  }
}

main();
