// Uses isolated browser profiles and synthetic data only. Never run against a user's profile.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join, extname } from 'node:path';
import { tmpdir } from 'node:os';
import { chromium, webkit } from 'playwright';

const dist = resolve(process.env.MASROOFI_DIST ?? 'dist');
const baseline = process.env.MASROOFI_BASELINE === '1';
const output = process.env.MASROOFI_UI_OUTPUT ?? join(tmpdir(), 'masroofi-ui-qa');
await mkdir(output, { recursive: true });
const label = baseline ? 'before' : 'after';
const report = { label, browserPlugin: 'Browser plugin not available; Playwright used', cases: [], performance: [], errors: [] };
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/Masroofi(?=\/|$)/, '') || '/';
  const file = resolve(dist, `.${pathname.endsWith('/') ? `${pathname}index.html` : pathname}`);
  if (!file.startsWith(`${dist}/`)) { res.writeHead(403).end(); return; }
  try { res.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream'); res.end(await readFile(file)); }
  catch { res.writeHead(404).end(); }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const url = `http://127.0.0.1:${server.address().port}/Masroofi/`;

function data(count) {
  return Array.from({ length: count }, (_, i) => {
    const type = ['income', 'expense', 'debt_given', 'debt_repayment', 'income'][i % 5];
    const date = new Date(Date.UTC(2026, 8, 1, 12) - i * 60000).toISOString();
    return { id: `qa-${i}`, type, title: `عملية اختبار ${i}`, amount: type === 'debt_given' ? 5000 : 1000,
      occurredAt: date, createdAt: date, updatedAt: date,
      note: i % 7 === 0 ? 'ملاحظة اختبار طويلة للتحقق من التفاف النص وإمكانية الوصول إلى الخيارات دون حجبها.' : null,
      emoji: null, ...(type === 'debt_repayment' ? { debtId: `qa-${i - 1}` } : {}) };
  });
}
async function ready(page) {
  await page.locator('.loading-state').waitFor({ state: 'hidden', timeout: 120000 });
  await page.locator('.home-page, .history-page, .ledger-page, .debts-page, .balance-card').first().waitFor({ timeout: 120000 });
  assert.match(await page.title(), /مصروفي/);
  assert.equal(await page.locator('vite-error-overlay').count(), 0);
  assert.equal(await page.locator('.global-error').count(), 0);
}
async function prepare(context, count) {
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', (error) => report.errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') report.errors.push(message.text()); });
  await page.addInitScript(() => {
    window.__qaReads = 0;
    const original = IDBObjectStore.prototype.getAll;
    IDBObjectStore.prototype.getAll = function (...args) {
      if (this.name === 'transactions' && this.transaction.mode === 'readonly') ++window.__qaReads;
      return original.apply(this, args);
    };
  });
  await page.goto(url);
  await ready(page);
  await page.evaluate((items) => new Promise((done, fail) => {
    const request = indexedDB.open('masroofi-db', 2);
    request.onerror = () => fail(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('transactions', 'readwrite');
      const store = tx.objectStore('transactions');
      store.clear(); // Only this disposable context's synthetic ledger.
      for (const item of items) store.put(item);
      tx.oncomplete = () => { db.close(); done(); };
      tx.onabort = () => { db.close(); fail(tx.error); };
    };
  }), data(count));
  const start = performance.now();
  await page.reload();
  await ready(page);
  return { page, loadMs: performance.now() - start };
}
async function history(page, count) {
  const start = performance.now();
  await page.locator('.bottom-nav').getByRole('button', { name: 'السجل', exact: true }).click();
  await page.waitForFunction((n) => document.querySelectorAll('.history-page .transaction-row').length === n, count, { timeout: 120000 });
  return performance.now() - start;
}
async function bottom(page) {
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
}
async function hit(locator) {
  return locator.evaluate((button) => {
    const r = button.getBoundingClientRect();
    return [ [r.left + r.width / 2, r.top + r.height / 2], [r.left + 3, r.top + 3], [r.right - 3, r.bottom - 3] ]
      .every(([x, y]) => x >= 0 && y >= 0 && x < innerWidth && y < innerHeight && button.contains(document.elementFromPoint(x, y)));
  });
}
async function menuClear(page) {
  return page.locator('.row-menu-popover').evaluate((menu) => {
    const r = menu.getBoundingClientRect();
    const blockers = [...document.querySelectorAll('.bottom-nav, .quick-add')].filter((el) => el.getClientRects().length);
    return r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1 &&
      blockers.every((el) => { const b = el.getBoundingClientRect(); return !(r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top); });
  });
}
async function lastOptions(page) {
  await bottom(page);
  const buttons = page.locator('.transaction-row').getByRole('button', { name: 'خيارات العملية' });
  const count = await buttons.count();
  for (let index = Math.max(0, count - 3); index < count; ++index) {
    const button = buttons.nth(index);
    await button.scrollIntoViewIfNeeded();
    assert.ok(await hit(button), `options ${index} must be genuinely hit-testable`);
    await button.click();
    assert.ok(await menuClear(page), 'menu must clear FAB/navigation and viewport edges');
    await page.keyboard.press('Escape');
    assert.ok(await button.evaluate((el) => el === document.activeElement));
  }
}

const browsers = [];
try {
  const browser = await chromium.launch();
  browsers.push(browser);
  const views = baseline ? [[430, 800]] : [[360, 800], [390, 844], [430, 800], [768, 900], [1280, 900], [800, 390]];
  for (const [width, height] of views) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const { page } = await prepare(context, 100);
    await history(page, 100);
    await bottom(page);
    if (baseline) {
      const reachable = await hit(page.getByRole('button', { name: 'خيارات العملية' }).last());
      await page.screenshot({ path: join(output, 'before-430.png') });
      report.cases.push({ viewport: [width, height], lastOptionsReachable: reachable });
      assert.equal(reachable, false, 'baseline must reproduce the reported obstruction');
    } else {
      await lastOptions(page);
      await bottom(page);
      const last = page.getByRole('button', { name: 'خيارات العملية' }).last();
      await last.click();
      await page.screenshot({ path: join(output, `after-${width}.png`) });
      const balance = await page.locator('.history-balance strong').innerText();
      await page.getByRole('menuitem', { name: 'تعديل', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: 'تعديل العملية' });
      await dialog.getByLabel('الاسم', { exact: true }).fill(`تعديل تجريبي ${width}`);
      await page.evaluate(() => { window.__qaReads = 0; });
      await dialog.getByRole('button', { name: 'حفظ التعديل', exact: true }).click();
      await dialog.waitFor({ state: 'hidden' });
      await page.getByText(`تعديل تجريبي ${width}`, { exact: true }).waitFor();
      const reads = await page.evaluate(() => window.__qaReads);
      assert.equal(reads, 1, 'one committed edit should trigger one readonly ledger read');
      assert.equal(await page.locator('.history-balance strong').innerText(), balance);
      await page.reload();
      await ready(page);
      await history(page, 100);
      await page.getByText(`تعديل تجريبي ${width}`, { exact: true }).waitFor();
      await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; document.documentElement.style.setProperty('--app-safe-bottom', '34px'); });
      await lastOptions(page);
      await page.evaluate(() => { document.documentElement.style.fontSize = '24px'; });
      await lastOptions(page);
      for (const name of ['الدخل', 'المصروفات']) {
        await page.locator('.bottom-nav').getByRole('button', { name, exact: true }).click();
        await lastOptions(page);
      }
      await page.locator('.bottom-nav').getByRole('button', { name: 'الديون', exact: true }).click();
      assert.equal(await page.locator('.quick-add').count(), 0);
      assert.equal(await page.locator('.app-shell').evaluate((el) => getComputedStyle(el).getPropertyValue('--quick-add-clearance').trim()), '0px');
      report.cases.push({ viewport: [width, height], editsPersist: true, readsPerEdit: reads, lightDarkSafeAreaTextZoom: 'pass' });
    }
    await context.close();
  }
  if (!baseline) {
    for (const count of [0, 1]) {
      const context = await browser.newContext({ viewport: { width: 430, height: 800 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
      const { page } = await prepare(context, count);
      await history(page, count);
      if (count) {
        await lastOptions(page);
        await page.locator('.filter-bar').getByRole('button', { name: 'الدخل', exact: true }).click();
        await lastOptions(page);
      }
      report.cases.push({ count, emptyOrSingle: 'pass' });
      await context.close();
    }
    const safari = await webkit.launch();
    browsers.push(safari);
    const context = await safari.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const { page } = await prepare(context, 100);
    await history(page, 100);
    await lastOptions(page);
    await page.screenshot({ path: join(output, 'after-webkit-390.png') });
    report.cases.push({ engine: 'WebKit (emulated, not a physical iPhone)', menu: 'pass' });
    await context.close();
  }
  for (const count of [100, 1000, 10000]) {
    const context = await browser.newContext({ viewport: { width: 430, height: 800 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const { page, loadMs } = await prepare(context, count);
    const historyMs = await history(page, count);
    const start = performance.now();
    await page.locator('.filter-bar').getByRole('button', { name: 'تسديد دين', exact: true }).click();
    await page.waitForFunction((n) => document.querySelectorAll('.history-page .transaction-row').length === n / 5, count, { timeout: 120000 });
    report.performance.push({ count, loadMs: Math.round(loadMs), historyMs: Math.round(historyMs), filterMs: Math.round(performance.now() - start) });
    await context.close();
  }
  assert.deepEqual(report.errors, [], 'no browser runtime/console errors');
  report.passed = true;
} catch (error) {
  report.failure = error.stack;
  process.exitCode = 1;
} finally {
  await writeFile(join(output, `${label}-report.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  for (const browser of browsers) await browser.close();
  await new Promise((done) => server.close(done));
}
