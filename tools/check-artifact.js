#!/usr/bin/env node
'use strict';
// Check HTML pages against the artifact publishing rules.
//
//   node tools/check-artifact.js [page.html ...] [--static] [--offline]
//
// With no pages, checks every built page in examples/ and themes/*/preview.html.
// Static checks: starts with <!DOCTYPE html>, under 16 MiB, loads scripts, styles and fonts
// only from allowed hosts, valid blaude-config / blaude-post blocks.
// Render checks (Playwright, skipped with --static): no request to a blocked host, no script
// errors, and no horizontal scroll at 360px.

const fs = require('fs');
const path = require('path');
const { checkPage } = require('../skills/blaude/scripts/lib/check');

const ROOT = path.join(__dirname, '..');

function defaultPages() {
  const out = [];
  const walk = (d) => {
    if (!fs.existsSync(d)) return;
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, f.name);
      if (f.isDirectory()) walk(p);
      else if (f.name.endsWith('.html')) out.push(p);
    }
  };
  walk(path.join(ROOT, 'examples'));
  const themes = path.join(ROOT, 'skills/blaude/themes');
  for (const t of fs.readdirSync(themes)) {
    const p = path.join(themes, t, 'preview.html');
    if (fs.existsSync(p)) out.push(p);
  }
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith('--')));
  let pages = args.filter((a) => !a.startsWith('--'));
  if (!pages.length) pages = defaultPages();
  if (!pages.length) {
    console.log('check-artifact: no pages to check');
    return;
  }
  let failed = 0;
  let browser = null;
  let audit = null;
  if (!flags.has('--static')) {
    audit = require('./lib/audit');
    browser = await audit.loadPlaywright().launch();
  }
  try {
    for (const file of pages) {
      const rel = path.relative(ROOT, path.resolve(file));
      const html = fs.readFileSync(file, 'utf8');
      const r = checkPage(html, { name: rel });
      const errors = [...r.errors];
      if (audit) {
        const a = await audit.auditFile(file, { widths: [360], schemes: ['light'], browser, offline: flags.has('--offline') });
        for (const u of a.blocked) errors.push(`requested a blocked host: ${u}`);
        for (const e of a.errors) errors.push(`script error: ${e}`);
        for (const i of a.issues.filter((x) => x.rule === 'horizontal-scroll' || x.rule === 'overflow')) errors.push(`360px: [${i.rule}] ${i.detail}`);
      }
      const kb = (r.bytes / 1024).toFixed(1);
      if (errors.length) {
        failed++;
        console.log(`FAIL ${rel} (${kb} KB)`);
        for (const e of errors) console.log(`  - ${e}`);
      } else {
        console.log(`ok   ${rel} (${kb} KB)`);
      }
      for (const w of r.warnings) console.log(`  warn: ${w}`);
    }
  } finally {
    if (browser) await browser.close();
  }
  console.log(failed ? `\ncheck-artifact: ${failed} of ${pages.length} pages failed` : `\ncheck-artifact: ${pages.length} pages passed`);
  process.exitCode = failed ? 1 : 0;
}

main().catch((e) => {
  console.error(e.stack || e.message);
  process.exitCode = 1;
});
