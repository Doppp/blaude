#!/usr/bin/env node
'use strict';
// Theme validator.
//
//   node tools/check-theme.js [theme ...] [--no-render] [--offline] [--gallery]
//
// With no names, checks every theme in skills/blaude/themes (except _template).
// For each theme:
//   - theme.json has the required fields; fonts come from Google Fonts only
//   - tokens.css sets every required token for light and dark; contrast and size limits
//   - overrides.css (if any) is scoped to .bl- and avoids fixed widths, position: fixed, 100vw
//   - a 360px screen fits at least 30 characters per line in the body font
//   - preview.html and the theme's built pages pass check-artifact, and render at
//     360, 390, 768 and 1280px in light and dark with no horizontal scroll, no text under 13px,
//     no tap target under 44px, no overflow, and header/body/footer left edges within 1px
// Also lints base.css, the templates and every component against the design rules.
// Screenshots go to build/screenshots/<theme>/; --gallery copies them to docs/gallery/.

const fs = require('fs');
const path = require('path');
const { parseTokens, validateTokens } = require('../skills/blaude/scripts/lib/tokens');
const { lintCss } = require('../skills/blaude/scripts/lib/csslint');
const { checkPage } = require('../skills/blaude/scripts/lib/check');

const ROOT = path.join(__dirname, '..');
const SKILL = path.join(ROOT, 'skills/blaude');
const THEMES = path.join(SKILL, 'themes');
const BUILD = path.join(ROOT, 'build');

const read = (p) => fs.readFileSync(p, 'utf8');
const styleBlocks = (html) => [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]);

function lintShared() {
  const problems = [];
  problems.push(...lintCss(read(path.join(SKILL, 'templates/base.css')), { where: 'templates/base.css' }));
  for (const f of fs.readdirSync(path.join(SKILL, 'templates'))) {
    if (!f.endsWith('.html')) continue;
    for (const css of styleBlocks(read(path.join(SKILL, 'templates', f)))) problems.push(...lintCss(css.replace(/{{{?[^}]+}}}?/g, ''), { where: `templates/${f}` }));
  }
  const comps = path.join(SKILL, 'components');
  if (fs.existsSync(comps)) {
    for (const f of fs.readdirSync(comps)) {
      if (!f.endsWith('.html')) continue;
      for (const css of styleBlocks(read(path.join(comps, f)))) problems.push(...lintCss(css, { where: `components/${f}` }));
    }
  }
  return problems;
}

function checkMeta(name, dir) {
  const errors = [];
  const p = path.join(dir, 'theme.json');
  if (!fs.existsSync(p)) return { errors: ['missing theme.json'], meta: null };
  let meta;
  try {
    meta = JSON.parse(read(p));
  } catch (e) {
    return { errors: [`theme.json is not valid JSON: ${e.message}`], meta: null };
  }
  for (const k of ['name', 'displayName', 'author', 'description', 'fonts', 'blaude', 'indexLayout']) if (meta[k] === undefined) errors.push(`theme.json is missing "${k}"`);
  if (meta.name !== name) errors.push(`theme.json name "${meta.name}" must match the folder "${name}"`);
  if (!['ledger', 'featured'].includes(meta.indexLayout)) errors.push('theme.json indexLayout must be "ledger" or "featured"');
  if (!Array.isArray(meta.fonts) || !meta.fonts.every((f) => typeof f === 'string' && /^[A-Za-z0-9 ]+(:[A-Za-z0-9,.;@]+)?$/.test(f))) errors.push('theme.json fonts must be Google Fonts family specs, e.g. "Literata:wght@400;600"');
  return { errors, meta };
}

async function charsPerLine(browser, tokensCss, meta) {
  const { fontsHref } = require('../skills/blaude/scripts/lib/assemble');
  const ctx = await browser.newContext({ viewport: { width: 360, height: 640 } });
  const page = await ctx.newPage();
  const sample = 'The quick brown fox jumps over the lazy dog while five wizards box quickly at the jump.';
  await page.setContent(`<!DOCTYPE html><html><head><link rel="stylesheet" href="${fontsHref(meta.fonts)}"><style>${tokensCss} body{margin:0;font:var(--bl-size-body)/1.6 var(--bl-font-body)} span{white-space:nowrap}</style></head><body><span id="s">${sample}</span></body></html>`, { waitUntil: 'load', timeout: 20000 }).catch(() => {});
  await page.evaluate(() => Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 4000))]));
  const w = await page.evaluate(() => document.getElementById('s').getBoundingClientRect().width);
  await ctx.close();
  const column = 360 - 2 * 20;
  return column / (w / sample.length);
}

function themePages(name, dir) {
  const pages = [];
  const preview = path.join(dir, 'preview.html');
  if (fs.existsSync(preview)) pages.push(preview);
  const built = path.join(BUILD, 'themes', name);
  if (fs.existsSync(built)) for (const f of fs.readdirSync(built).sort()) if (f.endsWith('.html')) pages.push(path.join(built, f));
  return pages;
}

async function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith('--')));
  const render = !flags.has('--no-render');
  let names = args.filter((a) => !a.startsWith('--'));
  if (!names.length) names = fs.readdirSync(THEMES, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith('_')).map((d) => d.name).sort();

  let failed = 0;
  const shared = lintShared();
  console.log(shared.length ? 'FAIL design rules (base.css, templates, components)' : 'ok   design rules (base.css, templates, components)');
  for (const p of shared) console.log(`  - ${p}`);
  if (shared.length) failed++;

  let audit = null;
  let browser = null;
  if (render) {
    audit = require('./lib/audit');
    browser = await audit.loadPlaywright().launch();
  }
  try {
    for (const name of names) {
      const dir = path.join(THEMES, name);
      const errors = [];
      const warnings = [];
      const notes = [];
      if (!fs.existsSync(dir)) {
        console.log(`FAIL ${name}: no such theme in skills/blaude/themes`);
        failed++;
        continue;
      }
      const { errors: metaErr, meta } = checkMeta(name, dir);
      errors.push(...metaErr);

      const tokPath = path.join(dir, 'tokens.css');
      let tokensCss = '';
      if (!fs.existsSync(tokPath)) errors.push('missing tokens.css');
      else {
        tokensCss = read(tokPath);
        const v = validateTokens(parseTokens(tokensCss));
        errors.push(...v.errors.map((e) => `tokens.css: ${e}`));
        warnings.push(...v.warnings.map((e) => `tokens.css: ${e}`));
        const worst = {};
        for (const r of v.report) if (!worst[r.fg + r.bg] || worst[r.fg + r.bg].ratio > r.ratio) worst[r.fg + r.bg] = r;
        notes.push('contrast: ' + Object.values(worst).map((r) => `${r.fg.slice(5)}/${r.bg.slice(5)} ${r.ratio}`).join(', '));
        if (!/\[data-theme=["']?dark["']?\]/.test(tokensCss) || !/\[data-theme=["']?light["']?\]/.test(tokensCss)) errors.push('tokens.css needs :root[data-theme=light] and :root[data-theme=dark] overrides');
        errors.push(...lintCss(tokensCss, { kind: 'overrides', where: 'tokens.css' }).filter((e) => !/must start with \.bl-/.test(e)));
      }
      const ovPath = path.join(dir, 'overrides.css');
      if (fs.existsSync(ovPath)) errors.push(...lintCss(read(ovPath), { kind: 'overrides', where: 'overrides.css' }));

      const preview = path.join(dir, 'preview.html');
      if (!fs.existsSync(preview)) warnings.push('no preview.html yet (run node tools/build.js)');

      const pages = themePages(name, dir);
      for (const p of pages) {
        const r = checkPage(read(p), { name: path.relative(ROOT, p) });
        errors.push(...r.errors.map((e) => `${path.relative(ROOT, p)}: ${e}`));
      }

      if (render && meta && tokensCss) {
        const cpl = await charsPerLine(browser, tokensCss, meta);
        notes.push(`~${Math.floor(cpl)} characters per line at 360px`);
        if (cpl < 30) errors.push(`body font fits only ${cpl.toFixed(0)} characters per line at 360px; needs 30`);
        const shots = path.join(BUILD, 'screenshots', name);
        fs.mkdirSync(shots, { recursive: true });
        for (const p of pages) {
          const prefix = path.basename(p, '.html');
          const a = await audit.auditFile(p, { browser, screenshots: { dir: shots, prefix }, offline: flags.has('--offline') });
          const rel = path.relative(ROOT, p);
          for (const s of audit.summarise(a.issues)) errors.push(`${rel}: ${s}`);
          for (const u of a.blocked) errors.push(`${rel}: requested a blocked host: ${u}`);
          for (const e of [...new Set(a.errors)]) errors.push(`${rel}: script error: ${e}`);
        }
        notes.push(`rendered ${pages.length} pages at 360/390/768/1280px, light and dark; screenshots in ${path.relative(ROOT, shots)}/`);
        if (flags.has('--gallery')) {
          const g = path.join(ROOT, 'docs/gallery');
          fs.mkdirSync(g, { recursive: true });
          for (const [from, to] of [['preview-390-light.png', `${name}-phone.png`], ['preview-1280-light.png', `${name}-desktop.png`], ['index-390-light.png', `${name}-index-phone.png`], ['index-1280-light.png', `${name}-index-desktop.png`]]) {
            if (fs.existsSync(path.join(shots, from))) fs.copyFileSync(path.join(shots, from), path.join(g, to));
          }
        }
      }

      if (errors.length) failed++;
      console.log(`${errors.length ? 'FAIL' : 'ok  '} theme ${name}`);
      for (const e of errors) console.log(`  - ${e}`);
      for (const w of warnings) console.log(`  warn: ${w}`);
      for (const n of notes) console.log(`  ${n}`);
    }
  } finally {
    if (browser) await browser.close();
  }
  console.log(failed ? `\ncheck-theme: ${failed} failed` : `\ncheck-theme: all passed`);
  process.exitCode = failed ? 1 : 0;
}

main().catch((e) => {
  console.error(e.stack || e.message);
  process.exitCode = 1;
});
