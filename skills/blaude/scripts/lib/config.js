'use strict';
// Validation for the index config (blaude-config) and post metadata (blaude-post).
// Mirrors templates/config.schema.json. Returns a list of readable problems.

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SECTION_TYPES = ['posts', 'about', 'list', 'projects', 'featured'];
const THEMES = ['ledger', 'featured', 'custom'];
const ID = /^[a-z0-9][a-z0-9-]*$/;
const TOKEN_NAME = /^--bl-[a-z0-9-]+$/;
const TOKEN_VALUE = /^[^;{}<>\\]*$/;

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string';
const safeUrl = (u) => isStr(u) && (u === '' || /^(https?:|mailto:|#|\.{0,2}\/)/i.test(u.trim()));

function validateTokens(tokens, where, errs) {
  if (tokens === undefined) return;
  if (!isObj(tokens)) return errs.push(`${where} must be an object`);
  for (const [k, v] of Object.entries(tokens)) {
    if (!TOKEN_NAME.test(k)) errs.push(`${where}: "${k}" is not a --bl- token`);
    if (!isStr(v) || !TOKEN_VALUE.test(v)) errs.push(`${where}: value of ${k} must be a plain CSS value`);
  }
}

function validateConfig(cfg) {
  const errs = [];
  if (!isObj(cfg)) return ['config must be an object'];
  if (!isStr(cfg.blaude) || !/^1\./.test(cfg.blaude)) errs.push('"blaude" must be a 1.x version string');
  if (!isStr(cfg.blogId) || !cfg.blogId) errs.push('"blogId" is required');

  const b = cfg.blog;
  if (!isObj(b)) errs.push('"blog" is required');
  else {
    if (!isStr(b.name) || !b.name.trim()) errs.push('blog.name is required');
    if (!isStr(b.author)) errs.push('blog.author is required');
    for (const k of ['tagline', 'bio', 'email']) if (b[k] !== undefined && !isStr(b[k])) errs.push(`blog.${k} must be a string`);
    if (b.avatar !== undefined && !(isStr(b.avatar) && /^data:image\//.test(b.avatar))) errs.push('blog.avatar must be a data:image URI');
    if (b.links !== undefined) {
      if (!Array.isArray(b.links)) errs.push('blog.links must be a list');
      else b.links.forEach((l, i) => {
        if (!isObj(l) || !isStr(l.label) || !isStr(l.url)) errs.push(`blog.links[${i}] needs label and url`);
        else if (!safeUrl(l.url)) errs.push(`blog.links[${i}].url must be http(s), mailto or #anchor`);
      });
    }
  }

  const t = cfg.theme;
  if (!isObj(t) || !THEMES.includes(t.name)) errs.push(`theme.name must be one of ${THEMES.join(', ')}`);
  else {
    validateTokens(t.tokens, 'theme.tokens', errs);
    if (t.name === 'custom' && t.layout !== undefined && !['ledger', 'featured'].includes(t.layout)) errs.push('theme.layout must be ledger or featured');
  }

  if (!Array.isArray(cfg.sections)) errs.push('"sections" must be a list');
  else {
    const ids = new Set();
    cfg.sections.forEach((s, i) => {
      const at = `sections[${i}]`;
      if (!isObj(s) || !SECTION_TYPES.includes(s.type)) return errs.push(`${at}.type must be one of ${SECTION_TYPES.join(', ')}`);
      const id = s.id ?? (['posts', 'about', 'featured'].includes(s.type) ? s.type : undefined);
      if (!isStr(id) || !ID.test(id)) errs.push(`${at} needs an id of lowercase letters, digits and dashes`);
      else if (ids.has(id)) errs.push(`${at}.id "${id}" is used twice`);
      else ids.add(id);
      if (!isStr(s.title) || !s.title.trim()) errs.push(`${at}.title is required`);
      if (['list', 'projects', 'featured'].includes(s.type)) {
        if (!Array.isArray(s.items)) errs.push(`${at}.items must be a list`);
        else s.items.forEach((it, j) => {
          const w = `${at}.items[${j}]`;
          if (!isObj(it)) return errs.push(`${w} must be an object`);
          const label = s.type === 'projects' ? 'name' : 'title';
          if (!isStr(it[label])) errs.push(`${w}.${label} is required`);
          if (it.url !== undefined && !safeUrl(it.url)) errs.push(`${w}.url must be http(s)`);
          if (s.type === 'list' && it.date !== undefined && it.date !== '' && !DATE.test(it.date)) errs.push(`${w}.date must be YYYY-MM-DD`);
        });
      }
    });
    if (!cfg.sections.some((s) => s && s.type === 'posts')) errs.push('sections must include a posts section');
  }

  if (!Array.isArray(cfg.posts)) errs.push('"posts" must be a list');
  else {
    const urls = new Set();
    cfg.posts.forEach((p, i) => {
      const at = `posts[${i}]`;
      if (!isObj(p)) return errs.push(`${at} must be an object`);
      if (!isStr(p.title) || !p.title.trim()) errs.push(`${at}.title is required`);
      if (!isStr(p.date) || !DATE.test(p.date)) errs.push(`${at}.date must be YYYY-MM-DD`);
      if (p.updated !== undefined && !(isStr(p.updated) && DATE.test(p.updated))) errs.push(`${at}.updated must be YYYY-MM-DD`);
      if (!['draft', 'public'].includes(p.status)) errs.push(`${at}.status must be draft or public`);
      if (!isStr(p.url) || !/^https:\/\//.test(p.url)) errs.push(`${at}.url must be the post's https artifact link`);
      else if (urls.has(p.url)) errs.push(`${at}.url is listed twice`);
      else urls.add(p.url);
      if (p.tags !== undefined && !(Array.isArray(p.tags) && p.tags.every(isStr))) errs.push(`${at}.tags must be a list of strings`);
      if (p.readingMinutes !== undefined && !(Number.isInteger(p.readingMinutes) && p.readingMinutes > 0)) errs.push(`${at}.readingMinutes must be a whole number`);
    });
  }
  return errs;
}

function validatePostMeta(m) {
  const errs = [];
  if (!isObj(m)) return ['post metadata must be an object'];
  if (!isStr(m.blaude) || !/^1\./.test(m.blaude)) errs.push('"blaude" must be a 1.x version string');
  if (!isStr(m.blogId) || !m.blogId) errs.push('"blogId" is required');
  if (!isStr(m.indexUrl) || !/^https:\/\//.test(m.indexUrl)) errs.push('"indexUrl" must be the index artifact link');
  if (!isStr(m.title) || !m.title.trim()) errs.push('"title" is required');
  if (!isStr(m.date) || !DATE.test(m.date)) errs.push('"date" must be YYYY-MM-DD');
  if (m.tags !== undefined && !(Array.isArray(m.tags) && m.tags.every(isStr))) errs.push('"tags" must be a list of strings');
  if (m.components !== undefined && !Array.isArray(m.components)) errs.push('"components" must be a list');
  if (m.related !== undefined) {
    if (!Array.isArray(m.related)) errs.push('"related" must be a list');
    else {
      if (m.related.length > 5) errs.push('"related" holds at most five links');
      m.related.forEach((r, i) => {
        if (!isObj(r) || !isStr(r.title) || !isStr(r.url)) errs.push(`related[${i}] needs title and url`);
        else if (!safeUrl(r.url)) errs.push(`related[${i}].url must be http(s)`);
      });
    }
  }
  return errs;
}

module.exports = { validateConfig, validatePostMeta, safeUrl, SECTION_TYPES };
