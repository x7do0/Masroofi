// Disposable browser context only; does not access any existing user profile.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { chromium } from 'playwright';

const url = 'http://127.0.0.1:4317/Masroofi/';
const output = process.env.MASROOFI_UI_OUTPUT ?? join(tmpdir(), 'masroofi-ui-qa');
await mkdir(output, { recursive: true });
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4317', '--strictPort'], { stdio: 'ignore' });
const report = { cases: [], errors: [] };
let browser;
async function ready(page) {
  await page.locator('.balance-card').waitFor();
  await page.locator('.bottom-nav').getByRole('button', { name: 'السجل', exact: true }).click();
  await page.locator('.transaction-row').first().waitFor();
}
async function edit(page, title, next) {
  const row = page.locator('.transaction-row').filter({ has: page.getByText(title, { exact: true }) });
  await row.getByRole('button', { name: 'خيارات العملية' }).click();
  await page.getByRole('menuitem', { name: 'تعديل', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'تعديل العملية' });
  await dialog.getByLabel('الاسم', { exact: true }).fill(next);
  await dialog.getByRole('button', { name: 'حفظ التعديل', exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
}
try {
  let started = false;
  for (let i = 0; i < 100; ++i) {
    try { if ((await fetch(url)).ok) { started = true; break; } } catch { /* Await preview startup. */ }
    await new Promise((done) => setTimeout(done, 100));
  }
  assert.ok(started, 'preview server started');
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 430, height: 800 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
  const first = await context.newPage();
  first.on('pageerror', (error) => report.errors.push(error.message));
  await first.goto(url);
  await first.locator('.balance-card').waitFor();
  await first.evaluate(() => new Promise((done, fail) => {
    const request = indexedDB.open('masroofi-db', 2);
    request.onerror = () => fail(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('transactions', 'readwrite');
      const date = new Date().toISOString();
      for (const id of ['a', 'b']) tx.objectStore('transactions').put({ id, type: 'income', title: `اختبار ${id}`, amount: 1000,
        occurredAt: date, createdAt: date, updatedAt: date, note: null, emoji: null });
      tx.oncomplete = () => { db.close(); done(); };
      tx.onabort = () => { db.close(); fail(tx.error); };
    };
  }));
  await first.reload();
  await ready(first);
  const second = await context.newPage();
  second.on('pageerror', (error) => report.errors.push(error.message));
  await second.goto(url);
  await ready(second);
  await edit(first, 'اختبار a', 'تحديث من النافذة الأولى');
  await second.getByText('تحديث من النافذة الأولى', { exact: true }).waitFor();
  report.cases.push('a background tab receives the current notification');
  await Promise.all([
    edit(first, 'تحديث من النافذة الأولى', 'متزامن أ'),
    edit(second, 'اختبار b', 'متزامن ب'),
  ]);
  for (const page of [first, second]) {
    await page.getByText('متزامن أ', { exact: true }).waitFor();
    await page.getByText('متزامن ب', { exact: true }).waitFor();
    assert.equal(await page.locator('.transaction-row').count(), 2);
    assert.equal(await page.locator('.global-error').count(), 0);
  }
  report.cases.push('concurrent edits to different records converge without loss');
  await second.evaluate(() => new Promise((done, fail) => {
    const request = indexedDB.open('masroofi-db', 2);
    request.onerror = () => fail(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('transactions', 'readwrite');
      const store = tx.objectStore('transactions');
      const item = store.get('a');
      item.onsuccess = () => store.put({ ...item.result, title: 'إشعار نسخة سابقة', updatedAt: new Date().toISOString() });
      tx.oncomplete = () => {
        db.close();
        const channel = new BroadcastChannel('masroofi-transactions');
        channel.postMessage('changed');
        channel.close();
        done();
      };
      tx.onabort = () => { db.close(); fail(tx.error); };
    };
  }));
  await first.getByText('إشعار نسخة سابقة', { exact: true }).waitFor();
  report.cases.push('legacy string notifications remain compatible');
  await first.reload();
  await ready(first);
  await first.getByText('إشعار نسخة سابقة', { exact: true }).waitFor();
  await first.getByText('متزامن ب', { exact: true }).waitFor();
  assert.deepEqual(report.errors, []);
  report.passed = true;
} catch (error) {
  report.failure = error.stack;
  console.log(`::error::${String(error.message).replaceAll('\n', '%0A')}`);
  process.exitCode = 1;
} finally {
  await writeFile(join(output, 'cross-tab-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser?.close();
  server.kill();
}
