'use strict';
// Assemble theme assets: Google Fonts link, token CSS for a theme or a custom token set.

const fs = require('fs');
const path = require('path');
const { parseTokens, tokensToCss } = require('./tokens');

const SKILL = path.join(__dirname, '..', '..');
const THEMES = path.join(SKILL, 'themes');

function fontsHref(fonts) {
  const fam = fonts.map((f) => 'family=' + f.replace(/ /g, '+')).join('&');
  return `https://fonts.googleapis.com/css2?${fam}&display=swap`;
}

function readTheme(name) {
  const dir = path.join(THEMES, name);
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'theme.json'), 'utf8'));
  const tokens = parseTokens(fs.readFileSync(path.join(dir, 'tokens.css'), 'utf8'));
  const ov = path.join(dir, 'overrides.css');
  const overrides = fs.existsSync(ov) ? fs.readFileSync(ov, 'utf8') : '';
  return { name, dir, meta, tokens, overrides };
}

/**
 * Resolve the theme for a blog config's `theme` block.
 * Returns { name, layout, fonts, tokens, css, overrides }.
 *  - named theme: that theme's tokens, with config overrides on top
 *  - custom: ledger tokens as a base, the config's full token set on top
 */
function resolveTheme(themeCfg = { name: 'ledger' }) {
  const name = themeCfg.name || 'ledger';
  const base = readTheme(name === 'custom' ? 'ledger' : name);
  const tokens = { ...base.tokens, ...(themeCfg.tokens || {}) };
  const layout = name === 'custom' ? themeCfg.layout || 'ledger' : base.meta.indexLayout;
  const fonts = name === 'custom' && Array.isArray(themeCfg.fonts) ? themeCfg.fonts : base.meta.fonts;
  return { name, layout, fonts, tokens, css: tokensToCss(tokens), overrides: name === 'custom' ? '' : base.overrides };
}

module.exports = { fontsHref, readTheme, resolveTheme, SKILL, THEMES };
