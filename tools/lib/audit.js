'use strict';
// Browser checks shared by check-artifact.js and check-theme.js (Playwright).

const path = require('path');
const { pathToFileURL } = require('url');
const { HOSTS, allowed } = require('../../skills/blaude/scripts/lib/check');

let chromium;
function loadPlaywright() {
  if (chromium) return chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    throw new Error('Playwright is not installed. Run: npm ci && npx playwright install chromium');
  }
  return chromium;
}

const WIDTHS = [360, 390, 768, 1280];
const SCHEMES = ['light', 'dark'];

// Runs inside the page. Returns a list of problems.
/* istanbul ignore next */
function inPageAudit() {
  const issues = [];
  const de = document.documentElement;
  const vw = de.clientWidth;
  const describe = (el) => {
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter(Boolean).slice(0, 2) : [];
    if (cls.length) s += '.' + cls.join('.');
    const txt = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return txt ? `${s} "${txt}"` : s;
  };
  const shown = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility !== 'visible' || cs.opacity === '0') return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  };
  const clipper = (el) => {
    for (let p = el.parentElement; p && p !== document.body && p !== de; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX;
      if (o !== 'visible') return p;
    }
    return null;
  };
  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT', 'TITLE', 'HEAD', 'META', 'LINK', 'BR']);

  // 1. Horizontal scroll
  if (de.scrollWidth > vw + 1) issues.push({ rule: 'horizontal-scroll', detail: `page is ${de.scrollWidth}px wide in a ${vw}px viewport` });

  // 2. Overflow
  for (const el of document.body.querySelectorAll('*')) {
    if (SKIP.has(el.tagName)) continue;
    if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
    if (!shown(el)) continue;
    const r = el.getBoundingClientRect();
    if (clipper(el)) continue;
    if (r.right > vw + 1 || r.left < -1) {
      issues.push({ rule: 'overflow', detail: `${describe(el)} spans ${Math.round(r.left)}-${Math.round(r.right)}px in a ${vw}px viewport` });
      continue;
    }
    const cs = getComputedStyle(el);
    if (cs.display !== 'inline' && cs.overflowX === 'visible' && el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1 && el.tagName.toLowerCase() !== 'svg') {
      issues.push({ rule: 'overflow', detail: `${describe(el)} content is ${el.scrollWidth}px in a ${el.clientWidth}px box` });
    }
  }

  // 2b. SVG text drawn outside the viewport (SVGs may draw past their own box)
  for (const t of document.querySelectorAll('svg text')) {
    if (!shown(t) || clipper(t.closest('svg'))) continue;
    const r = t.getBoundingClientRect();
    if (r.right > vw + 1 || r.left < -1) issues.push({ rule: 'overflow', detail: `svg text ${describe(t)} spans ${Math.round(r.left)}-${Math.round(r.right)}px in a ${vw}px viewport` });
  }

  // 3. Text smaller than 13px
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.nodeValue.trim()) continue;
    const el = n.parentElement;
    if (!el || seen.has(el) || SKIP.has(el.tagName) || el.closest('template')) continue;
    seen.add(el);
    const cs = getComputedStyle(el);
    if (cs.visibility !== 'visible' || cs.display === 'none') continue;
    let size = parseFloat(cs.fontSize);
    if (el instanceof SVGElement) {
      const t = el.closest('text') || el;
      const m = t.getScreenCTM && t.getScreenCTM();
      if (m) size *= Math.hypot(m.a, m.b);
      const bb = t.getBoundingClientRect();
      if (bb.width < 1) continue;
    } else {
      const r = el.getBoundingClientRect();
      if (r.width <= 1 || r.height <= 1) continue;
    }
    if (size < 12.95) issues.push({ rule: 'small-text', detail: `${describe(el)} is ${size.toFixed(1)}px` });
  }

  // 4. Tap targets under 44 x 44 (inline text links excepted)
  for (const el of document.querySelectorAll('a[href], button, [role=button], [role=tab], input:not([type=hidden]), select, textarea, summary')) {
    if (!shown(el)) continue;
    const cs = getComputedStyle(el);
    if (el.tagName === 'A' && cs.display === 'inline') continue;
    const r = el.getBoundingClientRect();
    if (r.width < 43.5 || r.height < 43.5) issues.push({ rule: 'tap-target', detail: `${describe(el)} is ${Math.round(r.width)}x${Math.round(r.height)}px` });
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && parseFloat(cs.fontSize) < 16) issues.push({ rule: 'input-zoom', detail: `${describe(el)} font is under 16px; iOS will zoom` });
  }

  // 5. Header, body and footer share one left edge
  const regions = [...document.querySelectorAll('[data-bl-region]')].filter(shown);
  if (regions.length) {
    const lefts = regions.map((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { name: el.dataset.blRegion, left: r.left + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth) };
    });
    const min = Math.min(...lefts.map((l) => l.left));
    const max = Math.max(...lefts.map((l) => l.left));
    if (max - min > 1) issues.push({ rule: 'edges', detail: `left edges differ by ${(max - min).toFixed(1)}px: ${lefts.map((l) => `${l.name} ${l.left.toFixed(1)}`).join(', ')}` });
    const names = new Set(lefts.map((l) => l.name));
    for (const need of ['header', 'body', 'footer']) if (!names.has(need)) issues.push({ rule: 'edges', detail: `no visible data-bl-region="${need}"` });
  }
  return issues;
}

/**
 * Open `file` and audit it at each width and colour scheme.
 * Returns { issues: [{width, scheme, rule, detail}], requests: { blocked: [] }, errors: [] }.
 */
async function auditFile(file, { widths = WIDTHS, schemes = SCHEMES, screenshots = null, browser = null, offline = false } = {}) {
  const pw = loadPlaywright();
  const own = !browser;
  browser = browser || (await pw.launch());
  const url = pathToFileURL(path.resolve(file)).href;
  const out = { issues: [], blocked: [], errors: [] };
  try {
    for (const scheme of schemes) {
      for (const width of widths) {
        const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: scheme, deviceScaleFactor: 1, reducedMotion: 'reduce' });
        const page = await ctx.newPage();
        page.on('pageerror', (e) => out.errors.push(`${width}px ${scheme}: ${e.message}`));
        await page.route('**/*', (route) => {
          const u = route.request().url();
          if (u === url || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
          const ok = allowed(u, [...HOSTS.script, ...HOSTS.style, ...HOSTS.font]);
          if (!ok) {
            out.blocked.push(u);
            return route.abort();
          }
          if (offline) return route.abort();
          return route.continue();
        });
        await page.goto(url, { waitUntil: 'load', timeout: 30000 });
        await page.evaluate(() => Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 4000))]));
        await page.waitForTimeout(150);
        const issues = await page.evaluate(inPageAudit);
        for (const i of issues) out.issues.push({ width, scheme, ...i });
        if (screenshots && (width === 390 || width === 1280)) {
          const name = `${screenshots.prefix}-${width}-${scheme}.png`;
          // Very tall pages (the 500-post index) exceed what headless Chromium can capture: cap the height.
          const h = await page.evaluate(() => document.documentElement.scrollHeight);
          try {
            await page.screenshot({ path: path.join(screenshots.dir, name), fullPage: true, clip: { x: 0, y: 0, width, height: Math.min(h, 8000) } });
          } catch (e) {
            console.warn(`  warn: no screenshot of ${name}: ${e.message.split('\n')[0]}`);
          }
        }
        await ctx.close();
      }
    }
  } finally {
    if (own) await browser.close();
  }
  out.blocked = [...new Set(out.blocked)];
  return out;
}

/** Collapse issues that repeat across widths and schemes. */
function summarise(issues) {
  const map = new Map();
  for (const i of issues) {
    const k = `${i.rule}|${i.detail}`;
    if (!map.has(k)) map.set(k, { ...i, where: [] });
    map.get(k).where.push(`${i.width}${i.scheme === 'dark' ? 'd' : ''}`);
  }
  return [...map.values()].map((i) => `[${i.rule}] ${i.detail} (at ${i.where.join(', ')})`);
}

module.exports = { auditFile, summarise, loadPlaywright, WIDTHS, SCHEMES };
