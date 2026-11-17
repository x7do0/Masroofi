// Dedicated localhost origin and fresh browser profiles; no user data is accessed.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createServer } from 'vite';
import { chromium, webkit } from 'playwright';

const output = process.env.MASROOFI_UI_OUTPUT ?? join(tmpdir(), 'masroofi-treasury-qa');
await mkdir(output, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 4175, strictPort: true } });
await server.listen();
const base = 'http://127.0.0.1:4175/Masroofi/';
const engines = { chromium, webkit };
const errors = [];
const nav = (page, name) => page.getByRole('navigation', { name: 'التنقل الرئيسي' }).getByRole('button', { name, exact: true }).click();
async function ready(page) { await page.locator('.balance-card').waitFor(); }
async function theme(page, expected) {
  await page.waitForFunction((value) => document.documentElement.dataset.theme === value, expected);
}
async function readableNavigation(page) {
  const labels = await page.locator('.bottom-nav button span').allTextContents();
  assert.deepEqual(labels, ['الرئيسية', 'المصروفات', 'الدخل', 'الديون', 'السجل', 'الخزينة']);
  const problems = await page.locator('.bottom-nav').evaluate((nav) => {
    const rect = nav.getBoundingClientRect();
    const problems = [];
    if (rect.left < 0 || rect.right > innerWidth + 1 || rect.bottom > innerHeight + 1) problems.push('Navigation escapes viewport');
    for (const button of nav.querySelectorAll('button')) {
      const box = button.getBoundingClientRect();
      if (box.width < 24 || box.height < 44 || button.scrollWidth > button.clientWidth + 1) problems.push(button.textContent);
      const label = button.querySelector('span');
      if (label.getBoundingClientRect().height > parseFloat(getComputedStyle(label).lineHeight) * 1.2) problems.push(`Wrapped label: ${label.textContent}`);
    }
    if (document.documentElement.scrollWidth > innerWidth + 1) problems.push('Horizontal overflow');
    return problems;
  });
  assert.deepEqual(problems, []);
}
async function contextFor(browser, options = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light', reducedMotion: 'reduce', serviceWorkers: 'block', ...options });
  await context.route('https://gc.zgo.at/count.js', (route) => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  context.on('page', (page) => page.on('pageerror', (error) => errors.push(error.message)));
  return context;
}
async function submit(page, action, amount, title) {
  await page.locator('.treasury-actions').getByRole('button', { name: new RegExp(`^${action}`) }).click();
  const dialog = page.getByRole('dialog');
  if (title) await dialog.getByRole('textbox', { name: 'الاسم', exact: true }).fill(title);
  await dialog.getByRole('textbox', { name: 'المبلغ', exact: true }).fill(String(amount));
  await dialog.getByRole('button', { name: action, exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
}

try {
  for (const [name, engine] of Object.entries(engines)) {
    const browser = await engine.launch();
    try {
      const context = await contextFor(browser);
      const page = await context.newPage();
      await page.goto(`${base}scripts/treasury-check.html`);
      await page.getByRole('button', { name: 'Run persistence checks', exact: true }).click();
      await page.waitForFunction(() => /^(PASS|FAIL)/.test(document.querySelector('#result').textContent));
      const result = await page.locator('#result').innerText();
      assert.ok(result.startsWith('PASS'), result);
      await page.reload();
      await page.getByRole('button', { name: 'Verify after reload', exact: true }).click();
      await page.waitForFunction(() => /^(PASS|FAIL)/.test(document.querySelector('#result').textContent));
      assert.match(await page.locator('#result').innerText(), /^PASS/);
      await page.goto(base); await ready(page);
      await readableNavigation(page);
      await nav(page, 'الخزينة');
      await submit(page, 'تحويل للخزينة', 50_000);
      await submit(page, 'إرجاع للرصيد', 25_000);
      await submit(page, 'صرف من الخزينة', 10_000, 'شراء تجريبي من الخزينة');
      assert.match(await page.locator('.treasury-balance').innerText(), /365,000/);
      assert.match(await page.locator('.treasury-balance').innerText(), /375,000/);
      await nav(page, 'السجل');
      await page.getByRole('group', { name: 'فلترة السجل' }).getByRole('button', { name: 'الخزينة', exact: true }).click();
      assert.equal(await page.locator('.history-list .transaction-row').count(), 5);
      await page.getByRole('group', { name: 'فلترة السجل' }).getByRole('button', { name: 'المصروفات', exact: true }).click();
      assert.equal(await page.locator('.history-list .transaction-row').count(), 2);
      await nav(page, 'المصروفات');
      assert.match(await page.locator('.ledger-hero').innerText(), /110,000/);
      const row = page.locator('.transaction-row').filter({ hasText: 'شراء تجريبي من الخزينة' });
      await row.getByRole('button', { name: 'خيارات العملية' }).click();
      await page.getByRole('menuitem', { name: 'تعديل' }).click();
      await page.locator('#treasury_expense-amount').fill('15000');
      await page.getByRole('button', { name: 'حفظ التعديل', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('.ledger-hero').textContent.includes('115,000'));
      await nav(page, 'الخزينة');
      assert.match(await page.locator('.treasury-balance').innerText(), /360,000/);
      await page.locator('.treasury-actions button').first().click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('textbox', { name: 'المبلغ', exact: true }).fill('999999999');
      await dialog.getByRole('button', { name: 'تحويل للخزينة', exact: true }).click();
      await dialog.getByRole('alert').waitFor();
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'hidden' });
      assert.equal(await page.evaluate(() => document.activeElement?.closest('.treasury-actions') !== null), true);
      await page.locator('.toast').last().waitFor({ state: 'hidden' });
      for (const width of [320, 390, 768, 1366, 1920]) {
        await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
        await readableNavigation(page);
        await page.mouse.move(0, 0);
        await page.screenshot({ path: join(output, `${name}-treasury-${width}.png`), fullPage: true, animations: 'disabled' });
      }
      await page.reload(); await ready(page); await nav(page, 'الخزينة');
      assert.match(await page.locator('.treasury-balance').innerText(), /360,000/);
      await page.close();
      const reopened = await context.newPage(); await reopened.goto(base); await ready(reopened); await nav(reopened, 'الخزينة');
      assert.match(await reopened.locator('.treasury-balance').innerText(), /360,000/);
      await context.close();
      console.log(`PASS ${name}: migration, transaction safety, backup, forms, expense editing, history filters, navigation and persistence`);

      for (const scheme of ['light', 'dark']) {
        for (const saved of [null, 'system', 'light', 'dark']) {
          const themeContext = await contextFor(browser, { colorScheme: scheme });
          if (saved) await themeContext.addInitScript((value) => {
            if (location.origin === 'http://127.0.0.1:4175' && !localStorage.getItem('masroofi-theme')) localStorage.setItem('masroofi-theme', value);
          }, saved);
          const themePage = await themeContext.newPage(); await themePage.goto(base); await ready(themePage);
          const initial = saved === 'light' || saved === 'dark' ? saved : scheme;
          const opposite = initial === 'light' ? 'dark' : 'light';
          await theme(themePage, initial);
          await themePage.getByRole('button', { name: /المظهر الحالي:/ }).click();
          await theme(themePage, opposite);
          await themePage.emulateMedia({ colorScheme: opposite === 'light' ? 'dark' : 'light' });
          await theme(themePage, opposite);
          await themePage.reload(); await ready(themePage); await theme(themePage, opposite);
          await themePage.getByRole('button', { name: /المظهر الحالي:/ }).click(); await theme(themePage, initial);
          await themeContext.close();
        }
      }
      console.log(`PASS ${name}: fresh and legacy system themes, explicit choices, two-way toggle and reload persistence`);
    } finally { await browser.close(); }
  }
  assert.deepEqual(errors, []);
} finally { await server.close(); }
