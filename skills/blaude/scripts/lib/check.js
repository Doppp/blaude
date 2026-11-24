'use strict';
// Static checks for a page that will be published as a Claude artifact.
// No dependencies, so it runs in the Claude app's code sandbox as well as in CI.

const { validateConfig, validatePostMeta } = require('./config');

const MAX_BYTES = 16 * 1024 * 1024; // 16 MiB hard limit
const WARN_BYTES = 12 * 1000 * 1000; // 12 MB: headroom the skill keeps for images

// Hosts an artifact page may load from.
const HOSTS = {
  script: ['https://cdnjs.cloudflare.com/', 'https://cdn.jsdelivr.net/npm/', 'https://unpkg.com/', 'https://cdn.plot.ly/', 'https://code.jquery.com/', 'https://cdn.tailwindcss.com'],
  style: ['https://fonts.googleapis.com/'],
  font: ['https://fonts.gstatic.com/'],
  preconnect: ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
};

const allowed = (url, list) => list.some((h) => url === h || url.startsWith(h.endsWith('/') ? h : h + '/') || url === h.replace(/\/$/, ''));
const isLocal = (url) => /^(data:|blob:|#)/i.test(url.trim());

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return m ? (m[2] ?? m[3] ?? m[4] ?? '') : null;
}

function cssUrls(css) {
  const out = [];
  for (const m of css.matchAll(/@import\s+(?:url\()?\s*["']?([^"')\s;]+)/gi)) out.push({ kind: 'import', url: m[1] });
  for (const m of css.replace(/@import[^;]*;?/gi, '').matchAll(/url\(\s*["']?([^"')]+?)["']?\s*\)/gi)) out.push({ kind: 'url', url: m[1] });
  return out;
}

function checkCss(css, where, errors) {
  for (const { kind, url } of cssUrls(css)) {
    if (isLocal(url)) continue;
    if (kind === 'import') {
      if (!allowed(url, HOSTS.style)) errors.push(`${where}: @import from a host artifacts block: ${url}`);
    } else if (!allowed(url, HOSTS.font)) {
      errors.push(`${where}: url() loads from a host artifacts block: ${url.slice(0, 120)}`);
    }
  }
}

/**
 * Check one HTML page. Returns { errors: [], warnings: [], bytes }.
 */
function checkPage(html, { name = 'page' } = {}) {
  const errors = [];
  const warnings = [];
  const bytes = Buffer.byteLength(html, 'utf8');

  if (!html.startsWith('<!DOCTYPE html>')) errors.push('must start with <!DOCTYPE html>');
  if (bytes >= MAX_BYTES) errors.push(`is ${(bytes / 1048576).toFixed(2)} MiB; the limit is 16 MiB`);
  else if (bytes > WARN_BYTES) warnings.push(`is ${(bytes / 1e6).toFixed(1)} MB; keep posts under 12 MB`);

  // JSON data blocks are text, not markup: check them, then leave them out of the tag scan.
  const json = {};
  let scan = html.replace(/<script\b[^>]*type\s*=\s*["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi, (all, body) => {
    const id = attr(all.slice(0, all.indexOf('>') + 1), 'id');
    if (id) json[id] = body;
    return '';
  });
  scan = scan.replace(/<!--[\s\S]*?-->/g, '');

  // Inline styles and scripts
  for (const m of scan.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) checkCss(m[1], 'inline <style>', errors);
  for (const m of scan.matchAll(/\sstyle\s*=\s*("([^"]*)"|'([^']*)')/gi)) checkCss(m[2] ?? m[3], 'style attribute', errors);
  const inlineJs = [...scan.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).join('\n');

  // Tags that load things
  for (const m of scan.matchAll(/<(script|link|img|source|video|audio|track|iframe|frame|object|embed|image|use|input|base|meta)\b[^>]*>/gi)) {
    const tag = m[0];
    const t = m[1].toLowerCase();
    if (t === 'iframe' || t === 'frame' || t === 'object' || t === 'embed') {
      errors.push(`<${t}> is refused inside artifacts`);
      continue;
    }
    if (t === 'base') errors.push('<base> changes how links resolve; remove it');
    if (t === 'meta' && /http-equiv\s*=\s*["']?refresh/i.test(tag)) errors.push('<meta http-equiv=refresh> is not allowed');
    if (t === 'script') {
      const src = attr(tag, 'src');
      if (src !== null) {
        if (!allowed(src, HOSTS.script)) errors.push(`script from a host artifacts block: ${src}`);
        else if (!/@\d+\.\d+\.\d+/.test(src) && !/\/\d+\.\d+\.\d+\//.test(src)) warnings.push(`script is not pinned to an exact version: ${src}`);
      }
    }
    if (t === 'link') {
      const rel = (attr(tag, 'rel') || '').toLowerCase();
      const href = attr(tag, 'href') || '';
      if (/stylesheet/.test(rel) && !isLocal(href) && !allowed(href, HOSTS.style)) errors.push(`stylesheet from a host other than Google Fonts: ${href}`);
      if (/preconnect|dns-prefetch/.test(rel) && !allowed(href, HOSTS.preconnect)) warnings.push(`preconnect to a host the page cannot use: ${href}`);
      if (/preload|prefetch|modulepreload|icon/.test(rel) && !isLocal(href) && !allowed(href, [...HOSTS.font, ...HOSTS.style, ...HOSTS.script])) errors.push(`<link rel=${rel}> loads from a blocked host: ${href}`);
    }
    for (const a of ['src', 'poster', 'href', 'xlink:href', 'data']) {
      if (t === 'link' || t === 'script' || t === 'base' || t === 'meta') break;
      const v = attr(tag, a);
      if (v !== null && v !== '' && !isLocal(v)) errors.push(`<${t} ${a}> must be a data: or blob: URI, not ${v.slice(0, 80)}`);
    }
    const srcset = attr(tag, 'srcset');
    if (srcset && srcset.split(',').some((s) => !isLocal(s.trim()))) errors.push(`<${t} srcset> must use data: URIs`);
  }

  // Behaviour artifacts refuse
  const refused = [
    [/\b(?:window\.)?alert\s*\(/, 'alert()'],
    [/\b(?:window\.)?confirm\s*\(/, 'confirm()'],
    [/\b(?:window\.)?prompt\s*\(/, 'prompt()'],
    [/\bwindow\.print\s*\(/, 'print()'],
    [/\bwindow\.open\s*\(/, 'window.open()'],
  ];
  for (const [re, label] of refused) if (re.test(inlineJs)) errors.push(`${label} is refused inside artifacts; build it in the page instead`);
  if (/\b(fetch\s*\(|XMLHttpRequest|new\s+WebSocket)/.test(inlineJs)) warnings.push('network calls to other hosts are blocked inside artifacts');
  if (/text-wrap\s*:\s*balance/i.test(scan)) errors.push('text-wrap: balance is not allowed on headings');
  if (/localStorage|sessionStorage/.test(inlineJs) && !/try\s*{[^}]*(localStorage|sessionStorage)/.test(inlineJs)) warnings.push('wrap localStorage access in try/catch');

  // Blaude data blocks
  if (json['blaude-config'] !== undefined) {
    try {
      const cfg = JSON.parse(json['blaude-config']);
      for (const e of validateConfig(cfg)) errors.push(`blaude-config: ${e}`);
    } catch (e) {
      errors.push(`blaude-config is not valid JSON: ${e.message}`);
    }
  }
  if (json['blaude-post'] !== undefined) {
    try {
      const meta = JSON.parse(json['blaude-post']);
      for (const e of validatePostMeta(meta)) errors.push(`blaude-post: ${e}`);
    } catch (e) {
      errors.push(`blaude-post is not valid JSON: ${e.message}`);
    }
  }
  for (const [id, body] of Object.entries(json)) {
    if (/<\/script/i.test(body)) errors.push(`#${id} contains "</script"; escape "<" as \\u003c`);
  }

  return { name, errors, warnings, bytes };
}

module.exports = { checkPage, HOSTS, MAX_BYTES, WARN_BYTES, allowed };
