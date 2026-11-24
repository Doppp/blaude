'use strict';
// Component registry: reads components/<name>.html, validates inputs, fills the markup.

const fs = require('fs');
const path = require('path');
const { mustache } = require('./mustache');
const { render, inline } = require('./markdown');

const DIR = path.join(__dirname, '..', '..', 'components');
// Catalogue order: also the order CSS and JS are written into a post.
const NAMES = ['figure', 'gallery', 'pullquote', 'callout', 'stepper', 'chart', 'diagram', 'code', 'sequence', 'terminal', 'codetabs'];

const cache = new Map();
function load(name) {
  if (!NAMES.includes(name)) throw new Error(`unknown component "${name}". Known: ${NAMES.join(', ')}`);
  if (cache.has(name)) return cache.get(name);
  const src = fs.readFileSync(path.join(DIR, `${name}.html`), 'utf8');
  const css = (src.match(/<style data-bl-component="[^"]+">([\s\S]*?)<\/style>/) || [])[1] || '';
  const markup = (src.match(/<template data-bl-markup>\n?([\s\S]*?)\n?<\/template>/) || [])[1];
  const js = (src.match(/<script data-bl-component="[^"]+">([\s\S]*?)<\/script>/) || [])[1] || '';
  if (!markup) throw new Error(`components/${name}.html has no <template data-bl-markup>`);
  const c = { name, css: css.trim(), markup, js: js.trim() };
  cache.set(name, c);
  return c;
}

/** Remove anything executable from author-supplied or generated SVG. */
function sanitizeSvg(svg) {
  let s = String(svg).trim();
  if (!/^<svg[\s>]/i.test(s)) throw new Error('svg must start with <svg');
  s = s.replace(/<script[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject\s*>/gi, '')
    .replace(/<(iframe|object|embed)[\s\S]*?>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(href|xlink:href)\s*=\s*("\s*javascript:[^"]*"|'\s*javascript:[^']*')/gi, '');
  for (const m of s.matchAll(/\s(?:href|xlink:href)\s*=\s*["']([^"']*)["']/gi)) {
    if (!/^(#|data:image\/)/.test(m[1])) throw new Error(`svg links must be #ids or data:image URIs, not ${m[1].slice(0, 60)}`);
  }
  return s;
}

const need = (cond, msg) => {
  if (!cond) throw new Error(msg);
};
const isData = (s) => typeof s === 'string' && /^data:image\/(png|jpe?g|webp|gif|avif|svg\+xml);base64,/i.test(s);

function parseJson(name, body) {
  try {
    return JSON.parse(body);
  } catch (e) {
    throw new Error(`::: ${name} expects JSON: ${e.message}`);
  }
}

// Each prepare() turns a block (args + body) into the data its markup needs.
const PREPARE = {
  figure(args, body) {
    const d = parseJson('figure', body);
    need(d.src || d.svg, 'figure needs src (a data:image URI) or svg');
    need(typeof d.alt === 'string' && d.alt.trim(), 'figure needs alt text');
    if (d.src) need(isData(d.src), 'figure src must be a data:image URI; remote images do not load in artifacts');
    if (d.svg) d.svg = sanitizeSvg(d.svg);
    return d;
  },
  gallery(args, body) {
    const d = parseJson('gallery', body);
    need(Array.isArray(d.images) && d.images.length, 'gallery needs images');
    d.images.forEach((im, i) => {
      need(isData(im.src), `gallery image ${i + 1} must be a data:image URI`);
      need(typeof im.alt === 'string' && im.alt.trim(), `gallery image ${i + 1} needs alt text`);
    });
    d.count = d.images.length;
    const first = d.images[0];
    // Every slide takes the first image's shape, so no slide leaves an empty band.
    d.ratio = first.width > 0 && first.height > 0 ? `${Number(first.width)}/${Number(first.height)}` : '3/2';
    d.label = d.label || 'Gallery';
    return d;
  },
  pullquote(args, body) {
    const lines = body.trim().split('\n');
    let cite = '';
    if (lines.length > 1 && /^(--|—)\s*/.test(lines[lines.length - 1])) cite = lines.pop().replace(/^(--|—)\s*/, '');
    const text = lines.join(' ').trim();
    need(text, 'pullquote needs text');
    return { text, cite };
  },
  callout(args, body) {
    const variant = (args || 'note').trim().split(/\s+/)[0];
    need(['note', 'tip', 'warning'].includes(variant), 'callout variant must be note, tip or warning');
    need(body.trim(), 'callout needs text');
    return { variant, html: render(body.trim(), {}, { headingShift: 0 }) };
  },
  stepper(args, body) {
    const d = parseJson('stepper', body);
    need(Array.isArray(d.steps) && d.steps.length >= 2, 'stepper needs at least two steps');
    d.steps.forEach((s, i) => need(s.label && s.title && typeof s.text === 'string', `step ${i + 1} needs label, title and text`));
    d.label = d.label || 'Steps';
    return d;
  },
  chart(args, body) {
    const d = parseJson('chart', body);
    need(['line', 'bar', 'scatter'].includes(d.type), 'chart type must be line, bar or scatter');
    need(Array.isArray(d.columns) && d.columns.length >= 2, 'chart needs columns: the x column plus at least one series');
    need(Array.isArray(d.rows) && d.rows.length, 'chart needs rows');
    d.rows.forEach((r, i) => need(Array.isArray(r) && r.length === d.columns.length, `chart row ${i + 1} must have ${d.columns.length} values`));
    need(typeof d.alt === 'string' && d.alt.trim(), 'chart needs alt text that states what it shows');
    d.rows = d.rows.map((r) => r.map(String));
    return d;
  },
  diagram(args, body) {
    const d = parseJson('diagram', body);
    need(d.svg, 'diagram needs svg');
    need(typeof d.alt === 'string' && d.alt.trim(), 'diagram needs alt text');
    d.svg = sanitizeSvg(d.svg);
    if (d.svgNarrow) d.svgNarrow = sanitizeSvg(d.svgNarrow);
    return d;
  },
  code(args, body, ctx) {
    return { lang: (args || '').split(/\s+/)[0], title: ctx.title || '', code: body };
  },
  sequence(args, body) {
    const d = parseJson('sequence', body);
    need(Array.isArray(d.lanes) && d.lanes.length >= 2, 'sequence needs at least two lanes');
    d.lanes = d.lanes.map((l) => (typeof l === 'string' ? { name: l } : l));
    const names = d.lanes.map((l) => l.name);
    if (!d.modes && d.messages) d.modes = [{ name: 'Messages', messages: d.messages }];
    need(Array.isArray(d.modes) && d.modes.length, 'sequence needs modes (or messages)');
    d.modes.forEach((m, i) => {
      need(m.name, `sequence mode ${i + 1} needs a name`);
      need(Array.isArray(m.messages) && m.messages.length, `sequence mode "${m.name}" needs messages`);
      m.messages.forEach((x, j) => {
        need(names.includes(x.from) && names.includes(x.to), `message ${j + 1} in "${m.name}": from and to must be lane names (${names.join(', ')})`);
        need(x.label && x.title && typeof x.text === 'string', `message ${j + 1} in "${m.name}" needs label, title and text`);
      });
    });
    d.hasModes = d.modes.length > 1;
    d.hasHead = d.hasModes || !!d.counter;
    d.modesLabel = d.modesLabel || 'Mode';
    d.alt = d.alt || `Sequence of messages between ${names.join(', ')}`;
    return d;
  },
  terminal(args, body) {
    const d = parseJson('terminal', body);
    need(Array.isArray(d.lines) && d.lines.length, 'terminal needs lines');
    d.lines = d.lines.map((l) => (Array.isArray(l) ? { kind: l[0], text: l[1] } : l));
    d.lines.forEach((l, i) => need(['cmd', 'out', 'ok'].includes(l.kind) && typeof l.text === 'string', `terminal line ${i + 1}: kind must be cmd, out or ok`));
    d.title = d.title ?? '~';
    d.label = d.label || 'Terminal';
    return d;
  },
  codetabs(args, body) {
    const d = parseJson('codetabs', body);
    need(Array.isArray(d.files) && d.files.length >= 2, 'codetabs needs at least two files');
    d.files.forEach((f, i) => need(f.name && typeof f.code === 'string', `codetabs file ${i + 1} needs name and code`));
    d.label = d.label || 'Files';
    return d;
  },
};

/** A renderer that records which components a post uses. */
function createRenderer() {
  const used = new Set();
  let n = 0;
  const one = (name, args, body, ctx = {}) => {
    const c = load(name);
    const data = PREPARE[name](args, body, ctx);
    data.id = data.id || `bl-${name}-${++n}`;
    used.add(name);
    return mustache(c.markup, data).trim();
  };
  return {
    used,
    component: (name, args, body) => one(name, args, body),
    code: (lang, code, info) => {
      const title = (info.match(/title="([^"]*)"|title=(\S+)/) || [])[1] || (info.match(/title=(\S+)/) || [])[1] || '';
      return one('code', lang, code, { title });
    },
    assets() {
      const list = NAMES.filter((x) => used.has(x));
      return {
        names: list,
        css: list.map((x) => `/* ${x} */\n${load(x).css}`).join('\n'),
        js: list.filter((x) => load(x).js).map((x) => `<script data-bl-component="${x}">\n${load(x).js}\n</script>`).join('\n'),
      };
    },
  };
}

module.exports = { NAMES, load, createRenderer, sanitizeSvg, inline };
