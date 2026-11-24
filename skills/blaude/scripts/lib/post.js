'use strict';
// Build a post artifact from Markdown (with ::: component blocks) and the blog's config.

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { render, frontMatter, textOf } = require('./markdown');
const { mustache } = require('./mustache');
const { createRenderer } = require('./components');
const { resolveTheme, fontsHref, SKILL } = require('./assemble');
const { validatePostMeta, safeUrl } = require('./config');

const VERSION = require('./version');
const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const longDate = (d) => `${Number(d.slice(8, 10))} ${M[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;

/** JSON that is safe inside <script type="application/json">. */
const jsonForScript = (v) => JSON.stringify(v, null, 2).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

// The post keeps its own Markdown source, so edits and exports are exact.
// Images are stored once, in the page; the source refers to them by hash.
const DATA_URI = /data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+/gi;
const hash = (u) => crypto.createHash('sha1').update(u).digest('hex').slice(0, 12);
const packSource = (md) => md.replace(DATA_URI, (u) => `blaude-img:${hash(u)}`);
function unpackSource(html) {
  const m = html.match(/<script type="application\/json" id="blaude-source">([\s\S]*?)<\/script>/);
  if (!m) return null;
  const { markdown } = JSON.parse(m[1]);
  const map = {};
  for (const u of html.match(DATA_URI) || []) map[hash(u)] = u;
  return markdown.replace(/blaude-img:([0-9a-f]{12})/g, (all, h) => map[h] || all);
}

function readingMinutes(html) {
  const words = textOf(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

/**
 * Build a post.
 *   source:  Markdown with front matter (title, date, description, tags, readingMinutes, related, ogImage)
 *   blog:    the index config (blaude-config), used for blogId, name and theme
 *   indexUrl: the index artifact's URL
 *   theme:   optional theme override ({ name, tokens }); defaults to blog.theme
 * Returns { html, meta, entry } where entry is the posts[] record for the index.
 */
function buildPost({ source, blog, indexUrl, theme, url = '', status = 'draft' }) {
  const { data: fm, body } = frontMatter(source);
  if (!fm.title) throw new Error('post front matter needs a title');
  if (!fm.date || !/^\d{4}-\d{2}-\d{2}$/.test(String(fm.date))) throw new Error('post front matter needs date: YYYY-MM-DD');
  const tags = Array.isArray(fm.tags) ? fm.tags.map(String) : fm.tags ? String(fm.tags).split(',').map((t) => t.trim()).filter(Boolean) : [];
  const related = Array.isArray(fm.related) ? fm.related.slice(0, 5) : [];
  for (const r of related) if (!safeUrl(r.url)) throw new Error(`related link ${r.title}: url must be http(s)`);

  const comps = createRenderer();
  const bodyHtml = render(body, comps, { headingShift: 1 });
  const assets = comps.assets();
  const th = resolveTheme(theme || blog.theme);
  const minutes = Number.isInteger(fm.readingMinutes) ? fm.readingMinutes : readingMinutes(bodyHtml);
  const blogName = blog.blog.name;

  const meta = {
    blaude: '1.0',
    blogId: blog.blogId,
    indexUrl,
    title: fm.title,
    date: fm.date,
    ...(fm.updated ? { updated: fm.updated } : {}),
    description: fm.description || '',
    tags,
    theme: th.name,
    blaudeVersion: VERSION,
    components: assets.names,
    related,
  };
  const problems = validatePostMeta(meta);
  if (problems.length) throw new Error(`post metadata: ${problems.join('; ')}`);

  const tpl = fs.readFileSync(path.join(SKILL, 'templates/post.html'), 'utf8');
  const baseCss = fs.readFileSync(path.join(SKILL, 'templates/base.css'), 'utf8');
  const html = mustache(tpl, {
    lang: fm.lang || blog.lang || 'en',
    pageTitle: `${fm.title} · ${blogName}`,
    title: fm.title,
    description: meta.description,
    blogName,
    ogImage: typeof fm.ogImage === 'string' && /^data:image\//.test(fm.ogImage) ? fm.ogImage : '',
    date: fm.date,
    dateText: longDate(fm.date),
    readingMinutes: minutes,
    tagsText: tags.join(', '),
    fontsHref: fontsHref(th.fonts),
    tokensCss: th.css.trim(),
    baseCss: baseCss.trim(),
    componentCss: assets.css,
    overridesCss: th.overrides.trim(),
    indexUrl,
    bodyHtml,
    hasRelated: related.length > 0,
    related,
    metaJson: jsonForScript(meta),
    sourceJson: jsonForScript({ markdown: packSource(source) }),
    componentJs: assets.js,
  });
  const entry = {
    ...(url ? { slug: (url.match(/artifact\/([^/?#]+)/) || [])[1] || '', url } : {}),
    title: fm.title,
    date: fm.date,
    ...(fm.updated ? { updated: fm.updated } : {}),
    description: meta.description,
    tags,
    status,
    readingMinutes: minutes,
    blaudeVersion: VERSION,
    theme: th.name,
  };
  return { html, meta, entry };
}

module.exports = { buildPost, unpackSource, jsonForScript, longDate, readingMinutes, VERSION };
