'use strict';
// Theme tokens: parse tokens.css, split light-dark() values, check contrast and limits.

const fs = require('fs');
const path = require('path');

const SPEC = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'themes', 'tokens.json'), 'utf8'));

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Declarations from every `:root { }` block (not [data-theme] variants, which only set color-scheme). */
function parseTokens(css) {
  const out = {};
  const src = stripComments(css);
  for (const m of src.matchAll(/(^|})\s*:root\s*{([^}]*)}/g)) {
    for (const d of m[2].split(';')) {
      const i = d.indexOf(':');
      if (i < 0) continue;
      const k = d.slice(0, i).trim();
      const v = d.slice(i + 1).trim();
      if (k.startsWith('--')) out[k] = v;
    }
  }
  return out;
}

/** Split a top-level light-dark(a, b). Returns { light, dark }. */
function splitLightDark(v) {
  const m = v.match(/^light-dark\(([\s\S]*)\)$/);
  if (!m) return { light: v, dark: v };
  let depth = 0;
  for (let i = 0; i < m[1].length; i++) {
    const c = m[1][i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === ',' && depth === 0) return { light: m[1].slice(0, i).trim(), dark: m[1].slice(i + 1).trim() };
  }
  return { light: v, dark: v };
}

function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

/** Parse a CSS colour to [r, g, b, a] (0-255, alpha 0-1). Hex, rgb() and hsl() only. */
function parseColor(v) {
  v = String(v).trim().toLowerCase();
  if (v === 'white') return [255, 255, 255, 1];
  if (v === 'black') return [0, 0, 0, 1];
  let m = v.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    const n = (i) => parseInt(h.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
  }
  m = v.match(/^rgba?\(([^)]*)\)$/);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean);
    const ch = (s) => (s.endsWith('%') ? (parseFloat(s) * 255) / 100 : parseFloat(s));
    const a = p[3] === undefined ? 1 : p[3].endsWith('%') ? parseFloat(p[3]) / 100 : parseFloat(p[3]);
    return [ch(p[0]), ch(p[1]), ch(p[2]), a];
  }
  m = v.match(/^hsla?\(([^)]*)\)$/);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean);
    const [r, g, b] = hslToRgb(parseFloat(p[0]), parseFloat(p[1]), parseFloat(p[2]));
    return [r, g, b, p[3] === undefined ? 1 : parseFloat(p[3])];
  }
  return null;
}

function luminance([r, g, b]) {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function blend(fg, bg) {
  const a = fg[3] ?? 1;
  return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a)).concat(1);
}

function contrast(fg, bg) {
  const f = blend(fg, bg);
  const [a, b] = [luminance(f), luminance(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

const px = (v) => {
  const m = String(v).trim().match(/^(\d+(?:\.\d+)?)px$/);
  return m ? parseFloat(m[1]) : null;
};

/**
 * Validate a token map. Returns { errors, warnings, report } where report lists contrast ratios.
 * `tokens` is { '--bl-bg': 'light-dark(#fff,#000)', ... }.
 */
function validateTokens(tokens) {
  const errors = [];
  const warnings = [];
  const report = [];
  const req = SPEC.required;
  const all = [...req.colors, ...req.fonts, ...req.sizes, ...req.spacing];
  for (const k of all) if (!(k in tokens)) errors.push(`missing required token ${k}`);
  for (const k of SPEC.optional.colors) if (!(k in tokens)) warnings.push(`optional token ${k} not set; the ledger value is used`);

  const colours = { light: {}, dark: {} };
  for (const k of [...req.colors, ...SPEC.optional.colors]) {
    if (!(k in tokens)) continue;
    const { light, dark } = splitLightDark(tokens[k]);
    for (const [mode, val] of [['light', light], ['dark', dark]]) {
      const c = parseColor(val);
      if (!c) errors.push(`${k} (${mode}) must be a hex, rgb() or hsl() colour, got "${val}"`);
      else colours[mode][k] = c;
    }
    if (!/^light-dark\(/.test(tokens[k])) warnings.push(`${k} has one value for light and dark; use light-dark(light, dark)`);
  }

  for (const rule of SPEC.contrast) {
    for (const mode of ['light', 'dark']) {
      const fg = colours[mode][rule.fg];
      const bg = colours[mode][rule.bg];
      if (!fg || !bg) {
        if (!rule.optional && (rule.fg in tokens) && (rule.bg in tokens)) errors.push(`cannot check ${rule.fg} on ${rule.bg} (${mode})`);
        continue;
      }
      const r = contrast(fg, bg);
      report.push({ mode, fg: rule.fg, bg: rule.bg, ratio: Math.round(r * 100) / 100, min: rule.min });
      if (r < rule.min) errors.push(`${rule.fg} on ${rule.bg} is ${r.toFixed(2)}:1 in ${mode} mode; needs ${rule.min}:1`);
    }
  }

  for (const [k, [lo, hi]] of Object.entries(SPEC.limits)) {
    if (!(k in tokens)) continue;
    const v = px(tokens[k]);
    if (v === null) errors.push(`${k} must be in px, got "${tokens[k]}"`);
    else if (v < lo || v > hi) errors.push(`${k} is ${v}px; allowed ${lo}-${hi}px`);
  }
  for (const [k, v] of Object.entries(SPEC.spacingScale)) {
    if (k in tokens && tokens[k].trim() !== v) errors.push(`${k} must be ${v} (the shared spacing scale), got ${tokens[k]}`);
  }
  if ('--bl-radius' in tokens && px(tokens['--bl-radius']) === null) errors.push('--bl-radius must be in px');
  for (const k of req.fonts) {
    if (k in tokens && !/(serif|sans-serif|monospace|system-ui|ui-monospace|ui-serif|ui-sans-serif)\s*$/.test(tokens[k])) {
      warnings.push(`${k} should end with a generic fallback (serif, sans-serif, monospace)`);
    }
  }
  return { errors, warnings, report };
}

/** Render a token map back to tokens.css text. */
function tokensToCss(tokens) {
  const lines = Object.entries(tokens).map(([k, v]) => `  ${k}:${v};`);
  return `:root{\n  color-scheme:light dark;\n${lines.join('\n')}\n}\n:root[data-theme=light]{color-scheme:light}\n:root[data-theme=dark]{color-scheme:dark}\n`;
}

module.exports = { SPEC, parseTokens, splitLightDark, parseColor, contrast, validateTokens, tokensToCss, stripComments };
