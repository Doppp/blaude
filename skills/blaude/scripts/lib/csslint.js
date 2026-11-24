'use strict';
// Design-rule lint for Blaude CSS: one spacing scale, no pills, no text-wrap: balance,
// and the extra limits on a theme's overrides.css.

const { stripComments } = require('./tokens');

/** Flatten CSS into [{ selector, decls: [[prop, value]], at }] (handles one level of @media/@supports). */
function parseRules(css) {
  const src = stripComments(css);
  const rules = [];
  let i = 0;
  const walk = (end, at) => {
    while (i < end) {
      const open = src.indexOf('{', i);
      if (open < 0 || open >= end) break;
      const head = src.slice(i, open).trim();
      // find matching close
      let depth = 1;
      let j = open + 1;
      while (j < src.length && depth) {
        if (src[j] === '{') depth++;
        else if (src[j] === '}') depth--;
        j++;
      }
      const body = src.slice(open + 1, j - 1);
      if (head.startsWith('@media') || head.startsWith('@supports') || head.startsWith('@container')) {
        const save = i;
        i = open + 1;
        walk(j - 1, head);
        i = j;
        void save;
        continue;
      }
      if (head.startsWith('@keyframes') || head.startsWith('@font-face')) {
        rules.push({ selector: head, decls: [], at, skip: true });
        i = j;
        continue;
      }
      const decls = body.split(';').map((d) => {
        const k = d.indexOf(':');
        return k < 0 ? null : [d.slice(0, k).trim().toLowerCase(), d.slice(k + 1).trim()];
      }).filter(Boolean);
      rules.push({ selector: head, decls, at });
      i = j;
    }
  };
  walk(src.length, null);
  return rules;
}

const SPACING = /^(margin|padding)(-(top|right|bottom|left|block|inline)(-(start|end))?)?$|^(gap|row-gap|column-gap|scroll-margin.*)$/;

function spacingOk(v) {
  let s = v.replace(/!important/, '').trim();
  if (/^(0|auto|inherit|initial|unset|revert)$/.test(s)) return true;
  s = s
    .replace(/var\(--bl-s[1-4]\)/g, '')
    .replace(/var\(--bl-pad\)/g, '')
    .replace(/env\(safe-area-inset-[a-z]+(,\s*0(px)?)?\)/g, '')
    .replace(/\b(max|min|calc)\(/g, '(')
    .replace(/\b0(px)?\b/g, '')
    .replace(/\bauto\b/g, '')
    .replace(/[(),\s]/g, '');
  return s === '';
}

function radiusOk(v) {
  const s = v.replace(/!important/, '').trim();
  return /^(0|50%|var\(--bl-radius\)|calc\(var\(--bl-radius\)\s*\/\s*2\)|0 var\(--bl-radius\) var\(--bl-radius\) 0)$/.test(s);
}

/**
 * Lint CSS. `kind` is 'base' (templates and components) or 'overrides' (a theme's overrides.css).
 * Returns a list of problems.
 */
function lintCss(css, { kind = 'base', where = 'css' } = {}) {
  const out = [];
  const src = stripComments(css);
  if (/text-wrap\s*:\s*balance/i.test(src)) out.push(`${where}: text-wrap: balance is not allowed`);
  if (/@import/i.test(src)) {
    for (const m of src.matchAll(/@import\s+(?:url\()?\s*["']?([^"')\s;]+)/gi)) {
      if (!/^https:\/\/fonts\.googleapis\.com\//.test(m[1])) out.push(`${where}: @import of ${m[1]} (only Google Fonts)`);
    }
  }
  for (const r of parseRules(src)) {
    if (r.skip) continue;
    if (kind === 'overrides') {
      for (const sel of r.selector.split(',')) {
        if (!/^\s*\.bl-/.test(sel)) out.push(`${where}: selector "${sel.trim()}" must start with .bl-`);
      }
    }
    for (const [p, v] of r.decls) {
      if (p.startsWith('--')) continue;
      if (SPACING.test(p) && !spacingOk(v)) out.push(`${where}: ${r.selector} { ${p}: ${v} } uses a value outside the spacing scale (--bl-s1..--bl-s4)`);
      if (/^border(-[a-z-]+)?-radius$/.test(p) && !radiusOk(v)) out.push(`${where}: ${r.selector} { ${p}: ${v} } use var(--bl-radius), 50% or 0 (no pills)`);
      if (p === 'text-wrap' && /pretty/.test(v) && !/(^|[\s>+~,])p(\b|$)|\bp[:.[]/.test(r.selector)) out.push(`${where}: ${r.selector} text-wrap: pretty is for body paragraphs only`);
      if (kind === 'overrides') {
        if (p === 'position' && /fixed/.test(v)) out.push(`${where}: position: fixed is not allowed in overrides`);
        if (/100vw/.test(v)) out.push(`${where}: 100vw is not allowed in overrides`);
        if (/^(min-|max-)?width$/.test(p) && /\d(px|rem|em)\b/.test(v)) out.push(`${where}: fixed ${p} is not allowed in overrides`);
      }
    }
  }
  return out;
}

module.exports = { lintCss, parseRules };
