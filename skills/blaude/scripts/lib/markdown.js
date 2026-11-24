'use strict';
// A small Markdown renderer for post bodies and bios.
// The author's words pass through unchanged: no smart quotes, no rewrapping.
// All text is escaped; only the Markdown structure becomes HTML.
//
// Blocks: headings, paragraphs, lists, blockquotes, fenced code, rules, pipe tables,
// and component blocks:
//   ::: name [args]
//   ...body...
//   :::

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function safeHref(url) {
  const u = String(url || '').trim();
  if (/^(https?:|mailto:|#|\/|\.\/|\.\.\/)/i.test(u)) return u;
  if (/^data:image\//i.test(u)) return u;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) return u; // relative path
  return null;
}

/** Inline Markdown to HTML. */
function inline(src) {
  const slots = [];
  const keep = (html) => `\u0000${slots.push(html) - 1}\u0000`;
  let s = String(src);
  // code spans
  s = s.replace(/(`+)([\s\S]*?[^`])\1(?!`)/g, (_, _t, code) => keep(`<code>${esc(code.replace(/^ (.*) $/, '$1'))}</code>`));
  // autolinks
  s = s.replace(/<(https?:\/\/[^\s>]+)>/g, (_, u) => keep(`<a href="${esc(u)}">${esc(u)}</a>`));
  // backslash escapes
  s = s.replace(/\\([\\`*_{}[\]()#+\-.!>~|])/g, (_, c) => keep(esc(c)));
  // images
  s = s.replace(/!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"([^"]*)")?\s*\)/g, (all, alt, url) => {
    const h = safeHref(url);
    return h ? keep(`<img src="${esc(h)}" alt="${esc(alt)}" loading="lazy" decoding="async">`) : esc(all);
  });
  // links (text may hold emphasis, rendered below)
  const links = [];
  s = s.replace(/\[([^\]]+)\]\(\s*([^)\s]+)(?:\s+"([^"]*)")?\s*\)/g, (all, text, url, title) => {
    const h = safeHref(url);
    if (!h) return text;
    links.push({ h, title });
    return `\u0001${links.length - 1}\u0002${text}\u0003`;
  });
  s = esc(s);
  s = s.replace(/\*\*([^*\n](?:[\s\S]*?[^*\n])?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/__([^_\n](?:[\s\S]*?[^_\n])?)__/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*\w])\*([^*\s](?:[^*]*?[^*\s])?)\*(?!\*)/g, '$1<em>$2</em>');
  s = s.replace(/(^|[^_\w])_([^_\s](?:[^_]*?[^_\s])?)_(?![_\w])/g, '$1<em>$2</em>');
  s = s.replace(/~~([^~\n]+)~~/g, '<del>$1</del>');
  s = s.replace(/ {2,}\n|\\\n/g, '<br>\n');
  s = s.replace(/\u0001(\d+)\u0002([\s\S]*?)\u0003/g, (_, i, text) => {
    const l = links[Number(i)];
    return `<a href="${esc(l.h)}"${l.title ? ` title="${esc(l.title)}"` : ''}>${text}</a>`;
  });
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => slots[Number(i)]);
}

function slug(text) {
  return String(text).toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
}

const RE = {
  fence: /^(\s{0,3})(`{3,}|~{3,})\s*([^`]*)$/,
  component: /^:::\s*([a-z][a-z0-9-]*)\s*(.*)$/,
  heading: /^(#{1,6})\s+(.*?)\s*#*\s*$/,
  hr: /^\s{0,3}([-*_])(\s*\1){2,}\s*$/,
  ul: /^(\s*)[-*+]\s+(.*)$/,
  ol: /^(\s*)(\d{1,9})[.)]\s+(.*)$/,
  quote: /^\s{0,3}>\s?(.*)$/,
  table: /^\s*\|?(\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/,
};

function splitRow(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1);
  return s.split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
}

/**
 * Render Markdown to HTML.
 * hooks.component(name, args, body) -> html  (for ::: blocks)
 * hooks.code(lang, code, info) -> html       (for fenced code)
 * opts.headingShift: add this to heading levels (1 makes # an h2)
 */
function render(md, hooks = {}, opts = {}) {
  const lines = String(md).replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  const shift = opts.headingShift ?? 1;
  const ids = new Set();
  let i = 0;
  const para = [];
  const flush = () => {
    if (para.length) out.push(`<p>${inline(para.join('\n'))}</p>`);
    para.length = 0;
  };
  while (i < lines.length) {
    const line = lines[i];
    let m;
    if (!line.trim()) { flush(); i++; continue; }

    if ((m = line.match(RE.component))) {
      flush();
      const name = m[1];
      const args = m[2].trim();
      const body = [];
      i++;
      let depth = 0;
      while (i < lines.length) {
        const l = lines[i];
        if (/^:::\s*$/.test(l)) {
          if (depth === 0) break;
          depth--;
        } else if (RE.component.test(l)) depth++;
        body.push(l);
        i++;
      }
      i++;
      if (!hooks.component) throw new Error(`component block "${name}" needs a component hook`);
      out.push(hooks.component(name, args, body.join('\n')));
      continue;
    }

    if ((m = line.match(RE.fence))) {
      flush();
      const indent = m[1].length;
      const marker = m[2];
      const info = m[3].trim();
      const body = [];
      i++;
      while (i < lines.length && !new RegExp(`^\\s{0,3}${marker[0]}{${marker.length},}\\s*$`).test(lines[i])) {
        body.push(lines[i].slice(Math.min(indent, lines[i].search(/\S|$/))));
        i++;
      }
      i++;
      const lang = info.split(/\s+/)[0] || '';
      out.push(hooks.code ? hooks.code(lang, body.join('\n'), info) : `<pre><code>${esc(body.join('\n'))}</code></pre>`);
      continue;
    }

    if ((m = line.match(RE.heading))) {
      flush();
      const level = Math.min(6, m[1].length + shift - (shift && m[1].length > 1 ? 1 : 0));
      const html = inline(m[2]);
      let id = slug(html);
      while (ids.has(id)) id += '-1';
      ids.add(id);
      out.push(`<h${level} id="${id}">${html}</h${level}>`);
      i++;
      continue;
    }

    if (RE.hr.test(line) && !para.length) { flush(); out.push('<hr>'); i++; continue; }

    if (line.includes('|') && i + 1 < lines.length && RE.table.test(lines[i + 1])) {
      flush();
      const head = splitRow(line);
      const align = splitRow(lines[i + 1]).map((c) => (/^:-+:$/.test(c) ? 'center' : /-:$/.test(c) ? 'right' : ''));
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) rows.push(splitRow(lines[i++]));
      const cell = (tag, c, j) => `<${tag}${align[j] ? ` style="text-align:${align[j]}"` : ''}>${inline(c)}</${tag}>`;
      out.push(`<div class="bl-table"><table><thead><tr>${head.map((c, j) => cell('th', c, j)).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${head.map((_, j) => cell('td', r[j] ?? '', j)).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }

    if (RE.quote.test(line)) {
      flush();
      const body = [];
      while (i < lines.length && (m = lines[i].match(RE.quote))) { body.push(m[1]); i++; }
      out.push(`<blockquote>${render(body.join('\n'), hooks, { ...opts, headingShift: shift })}</blockquote>`);
      continue;
    }

    const ul = line.match(RE.ul);
    const ol = line.match(RE.ol);
    if ((ul || ol) && !(para.length && ol && ol[2] !== '1')) {
      flush();
      const ordered = !!ol;
      const start = ordered ? Number(ol[2]) : 1;
      const items = [];
      while (i < lines.length) {
        const l = lines[i];
        const mm = ordered ? l.match(RE.ol) : l.match(RE.ul);
        if (mm && mm[1].length < 2) {
          items.push([ordered ? mm[3] : mm[2]]);
          i++;
        } else if (l.trim() && /^\s{2,}/.test(l) && items.length) {
          items[items.length - 1].push(l.replace(/^\s{2,4}/, ''));
          i++;
        } else if (!l.trim() && i + 1 < lines.length && (/^\s{2,}\S/.test(lines[i + 1]) || (ordered ? RE.ol : RE.ul).test(lines[i + 1])) && items.length) {
          items[items.length - 1].push('');
          i++;
        } else break;
      }
      const lis = items.map((it) => {
        const text = it.join('\n');
        const nested = /\n\s*([-*+]|\d+[.)])\s/.test(text) || /\n\n/.test(text);
        return `<li>${nested ? render(text, hooks, { ...opts, headingShift: shift }).replace(/^<p>([\s\S]*?)<\/p>/, '$1') : inline(text)}</li>`;
      });
      out.push(ordered ? `<ol${start !== 1 ? ` start="${start}"` : ''}>${lis.join('')}</ol>` : `<ul>${lis.join('')}</ul>`);
      continue;
    }

    para.push(line);
    i++;
  }
  flush();
  return out.join('\n');
}

/** Split `---` front matter from a Markdown file. Values: JSON when they parse, [a, b] lists, or text. */
function frontMatter(src) {
  const m = String(src).match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: String(src) };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const k = line.match(/^([A-Za-z][\w-]*)\s*:\s*(.*)$/);
    if (!k) continue;
    let v = k[2].trim();
    try {
      v = JSON.parse(v);
    } catch (_) {
      if (/^\[.*\]$/.test(v)) v = v.slice(1, -1).split(',').map((x) => x.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      else v = v.replace(/^["'](.*)["']$/, '$1');
    }
    data[k[1]] = v;
  }
  return { data, body: m[2] };
}

/** Plain text of rendered HTML, for word counts. */
function textOf(html) {
  return html.replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ');
}

module.exports = { render, inline, esc, safeHref, frontMatter, textOf, slug };
