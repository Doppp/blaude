'use strict';
// Build the index artifact: the layout's template plus the blog's config block.

const fs = require('fs');
const path = require('path');
const { mustache } = require('./mustache');
const { resolveTheme, fontsHref, SKILL } = require('./assemble');
const { validateConfig } = require('./config');
const { jsonForScript } = require('./post');

/**
 * Build the index page from a config (the blaude-config object).
 * Returns { html, layout }. Throws if the config is invalid.
 */
function buildIndex(config, { check = true } = {}) {
  if (check) {
    const errs = validateConfig(config);
    if (errs.length) throw new Error(`config: ${errs.join('; ')}`);
  }
  const th = resolveTheme(config.theme);
  const tplPath = path.join(SKILL, 'templates', `index-${th.layout}.html`);
  if (!fs.existsSync(tplPath)) throw new Error(`no index template for layout "${th.layout}"`);
  const b = config.blog;
  const html = mustache(fs.readFileSync(tplPath, 'utf8'), {
    lang: config.lang || 'en',
    blogName: b.name,
    tagline: b.tagline || '',
    description: b.tagline || b.name,
    fontsHref: fontsHref(th.fonts),
    tokensCss: th.css.trim(),
    baseCss: fs.readFileSync(path.join(SKILL, 'templates/base.css'), 'utf8').trim(),
    overridesCss: th.overrides.trim(),
    configJson: jsonForScript(config),
  });
  return { html, layout: th.layout };
}

/** Read the config block out of an index page's HTML. */
function extractConfig(html) {
  const m = html.match(/<script type="application\/json" id="blaude-config">([\s\S]*?)<\/script>/);
  if (!m) return null;
  return JSON.parse(m[1]);
}

/** Read a post page's metadata block. */
function extractPostMeta(html) {
  const m = html.match(/<script type="application\/json" id="blaude-post">([\s\S]*?)<\/script>/);
  if (!m) return null;
  return JSON.parse(m[1]);
}

module.exports = { buildIndex, extractConfig, extractPostMeta };
