'use strict';
// Export a blog to a zip of static HTML and Markdown:
//
//   index.html            the index, linking to posts by relative path
//   config.json           the blog's config (post urls relative; artifact links kept as artifactUrl)
//   <slug>/index.html     each post, linking back with ../index.html
//   <slug>/post.md        front matter (title, date, description, tags) + the author's Markdown
//   <slug>/images/*       images from the post, referenced by post.md
//
// Works on any static host, or in Jekyll (which copies the HTML and can render post.md).

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { extractConfig, extractPostMeta } = require('./index');
const { unpackSource } = require('./post');
const { frontMatter, slug: slugify } = require('./markdown');

// ---- zip (deflate, no dependencies) ----
const CRC = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
const crc32 = (buf) => {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};

function zip(files) {
  const chunks = [];
  const central = [];
  let offset = 0;
  const time = 0; // 00:00:00
  const date = ((2026 - 1980) << 9) | (1 << 5) | 1; // fixed date: reproducible archives
  for (const [name, data] of files) {
    const raw = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    const comp = zlib.deflateRawSync(raw, { level: 9 });
    const nameBuf = Buffer.from(name, 'utf8');
    const crc = crc32(raw);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // UTF-8 names
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comp.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    chunks.push(local, nameBuf, comp);
    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0);
    cen.writeUInt16LE(20, 4);
    cen.writeUInt16LE(20, 6);
    cen.writeUInt16LE(0x0800, 8);
    cen.writeUInt16LE(8, 10);
    cen.writeUInt16LE(time, 12);
    cen.writeUInt16LE(date, 14);
    cen.writeUInt32LE(crc, 16);
    cen.writeUInt32LE(comp.length, 20);
    cen.writeUInt32LE(raw.length, 24);
    cen.writeUInt16LE(nameBuf.length, 28);
    cen.writeUInt32LE(offset, 42);
    central.push(cen, nameBuf);
    offset += 30 + nameBuf.length + comp.length;
  }
  const cenBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cenBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, cenBuf, end]);
}

// ---- export ----
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const EXT = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/avif': 'avif', 'image/svg+xml': 'svg' };

/** Replace every occurrence of each URL (and URL#anchor) with its local path. */
function rewrite(text, map) {
  let out = text;
  const urls = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const u of urls) out = out.replace(new RegExp(escRe(u) + '(?=[#"\'\\s)<\\]]|$)', 'g'), map[u]);
  return out;
}

/**
 * Collect pages from a folder: the index (blaude-config) and posts (blaude-post).
 * Returns the export as a list of [path, content] pairs.
 */
function collect(dir) {
  const pages = fs.readdirSync(dir).filter((f) => /\.html?$/i.test(f)).map((f) => ({ file: f, html: fs.readFileSync(path.join(dir, f), 'utf8') }));
  const indexes = pages.filter((p) => extractConfig(p.html));
  if (indexes.length !== 1) throw new Error(`expected one index page (with blaude-config) in ${dir}, found ${indexes.length}`);
  const indexHtml = indexes[0].html;
  const config = extractConfig(indexHtml);
  const posts = pages.filter((p) => p !== indexes[0]).map((p) => ({ ...p, meta: extractPostMeta(p.html) })).filter((p) => p.meta && p.meta.blogId === config.blogId);
  const indexUrl = posts[0] ? posts[0].meta.indexUrl : null;

  // Match each saved post to its config entry by title and date; give it a folder name.
  const used = new Set();
  const entries = posts.map((p) => {
    const entry = config.posts.find((e) => e.title === p.meta.title && e.date === p.meta.date) || null;
    let slug = slugify(p.meta.title).slice(0, 60) || 'post';
    while (used.has(slug)) slug += '-2';
    used.add(slug);
    return { ...p, entry, slug };
  });
  const missing = config.posts.filter((e) => !entries.some((p) => p.entry === e));

  // Artifact URL -> local path, from the index's point of view and from a post's.
  const fromIndex = {};
  const fromPost = {};
  for (const p of entries) {
    if (!p.entry) continue;
    fromIndex[p.entry.url] = `${p.slug}/index.html`;
    fromPost[p.entry.url] = `../${p.slug}/index.html`;
  }
  if (indexUrl) fromPost[indexUrl] = '../index.html';

  const files = [];
  const cfg = JSON.parse(JSON.stringify(config));
  cfg.posts = cfg.posts.map((e) => (fromIndex[e.url] ? { ...e, artifactUrl: e.url, url: fromIndex[e.url] } : e));
  // The index renders from its config block, so rewriting the block rewrites the page.
  const outIndex = indexHtml.replace(/(<script type="application\/json" id="blaude-config">)[\s\S]*?(<\/script>)/, (all, a, b) => a + JSON.stringify(cfg, null, 2).replace(/</g, '\\u003c') + b);
  files.push(['index.html', outIndex]);
  files.push(['config.json', JSON.stringify(cfg, null, 2) + '\n']);

  for (const p of entries) {
    files.push([`${p.slug}/index.html`, rewrite(p.html, fromPost)]);
    let md = unpackSource(p.html);
    if (md === null) {
      // No source block: fall back to the page's text, paragraph by paragraph.
      const body = (p.html.match(/<div class="bl-body">([\s\S]*?)<\/div>\s*<\/article>/) || [])[1] || '';
      md = body.replace(/<(script|style)[\s\S]*?<\/\1>/g, '').replace(/<\/(p|h\d|li|pre|blockquote)>/g, '\n\n').replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\n{3,}/g, '\n\n').trim();
    } else {
      md = frontMatter(md).body;
    }
    // Images out of the Markdown into files.
    md = md.replace(/data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)/gi, (all, type, b64) => {
      const name = `images/${crypto.createHash('sha1').update(all).digest('hex').slice(0, 12)}.${EXT[type.toLowerCase()] || 'bin'}`;
      if (!files.some(([f]) => f === `${p.slug}/${name}`)) files.push([`${p.slug}/${name}`, Buffer.from(b64, 'base64')]);
      return name;
    });
    md = rewrite(md, fromPost);
    const m = p.meta;
    const yaml = (s) => JSON.stringify(String(s ?? ''));
    const head = ['---', `title: ${yaml(m.title)}`, `date: ${m.date}`, ...(m.updated ? [`updated: ${m.updated}`] : []), `description: ${yaml(m.description)}`, `tags: [${(m.tags || []).map(yaml).join(', ')}]`, ...(p.entry ? [`status: ${p.entry.status}`] : []), '---', ''].join('\n');
    files.push([`${p.slug}/post.md`, head + md.trimEnd() + '\n']);
  }
  return { files, posts: entries.length, missing };
}

/** Export the pages saved in `dir` to the zip at `out`. */
function exportBlog(dir, out) {
  const { files, posts, missing } = collect(dir);
  fs.writeFileSync(out, zip(files));
  if (missing.length) console.error(`warning: no saved page for ${missing.map((e) => `"${e.title}"`).join(', ')}; their index links still point to claude.ai`);
  return { posts, files: files.map(([f]) => f) };
}

module.exports = { exportBlog, collect, zip, crc32 };
