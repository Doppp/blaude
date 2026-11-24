'use strict';
// Minimal Mustache for component markup.
//   {{name}}          escaped value (dots for nested: {{a.b}})
//   {{{name}}}        raw HTML (only for markup Blaude made, never for the author's text)
//   {{#name}}..{{/name}}  repeat for each item of a list, or show if truthy
//   {{^name}}..{{/name}}  show if missing, false or empty
//   {{.}}             the current item; {{@index}}, {{@number}}, {{@first}}, {{@last}} inside lists

const { esc } = require('./markdown');

function lookup(stack, name) {
  if (name === '.') return stack[stack.length - 1];
  const parts = name.split('.');
  for (let i = stack.length - 1; i >= 0; i--) {
    const ctx = stack[i];
    if (ctx !== null && typeof ctx === 'object' && parts[0] in ctx) {
      let v = ctx;
      for (const p of parts) v = v == null ? undefined : v[p];
      return v;
    }
  }
  return undefined;
}

function findClose(tpl, name, from) {
  const re = new RegExp(`{{([#^/])\\s*${name.replace(/[.@]/g, '\\$&')}\\s*}}`, 'g');
  re.lastIndex = from;
  let depth = 1;
  let m;
  while ((m = re.exec(tpl))) {
    if (m[1] === '/') depth--;
    else depth++;
    if (depth === 0) return { start: m.index, end: re.lastIndex };
  }
  throw new Error(`unclosed {{#${name}}}`);
}

function renderTpl(tpl, stack) {
  let out = '';
  let i = 0;
  const tag = /{{(\{)?\s*([#^/]?)\s*([\w.@-]+)\s*\}?}}/g;
  while (true) {
    tag.lastIndex = i;
    const m = tag.exec(tpl);
    if (!m) { out += tpl.slice(i); break; }
    out += tpl.slice(i, m.index);
    const [all, raw, type, name] = m;
    const after = m.index + all.length;
    if (type === '#' || type === '^') {
      const close = findClose(tpl, name, after);
      const inner = tpl.slice(after, close.start);
      const v = lookup(stack, name);
      const empty = v === undefined || v === null || v === false || v === '' || (Array.isArray(v) && !v.length);
      if (type === '^') {
        if (empty) out += renderTpl(inner, stack);
      } else if (Array.isArray(v)) {
        v.forEach((item, idx) => {
          const meta = { '@index': idx, '@number': idx + 1, '@first': idx === 0, '@last': idx === v.length - 1 };
          out += renderTpl(inner, [...stack, meta, item]);
        });
      } else if (!empty) {
        out += renderTpl(inner, typeof v === 'object' ? [...stack, v] : stack);
      }
      i = close.end;
      continue;
    }
    if (type === '/') throw new Error(`unexpected {{/${name}}}`);
    const v = lookup(stack, name);
    out += raw ? String(v ?? '') : esc(v ?? '');
    i = after;
  }
  return out;
}

function mustache(tpl, data) {
  return renderTpl(tpl, [data]);
}

module.exports = { mustache };
