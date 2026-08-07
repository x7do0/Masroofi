import { chromium } from 'playwright';

const baseUrl = process.env.MASROOFI_URL ?? 'https://x7do0.github.io/Masroofi/';
const testTitle = `اختبار إنتاج ${Date.now()}`;
const amount = 123456;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function deleteDatabase(page) {
  await page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase('masroofi-db');
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error ?? new Error('Failed to delete IndexedDB database'));
    request.onblocked = () => reject(new Error('IndexedDB delete was blocked'));
  }));
}

async function readTransactions(page) {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('masroofi-db');
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('transactions')) {
        db.close();
        resolve([]);
        return;
      }
      const tx = db.transaction('transactions', 'readonly');
      const getAll = tx.objectStore('transactions').getAll();
      getAll.onerror = () => reject(getAll.error ?? new Error('Failed to read transactions'));
      getAll.onsuccess = () => {
        const result = getAll.result;
        db.close();
        resolve(result);
      };
    };
  }));
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  locale: 'ar-IQ',
  timezoneId: 'Asia/Baghdad',
  viewport: { width: 390, height: 844 },
});

let page = await context.newPage();
const runtimeErrors = [];
page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`);
});

try {
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60_000 });
  await page.getByRole('heading', { name: 'مصروفي', exact: true }).waitFor({ timeout: 20_000 });

  await deleteDatabase(page);
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'مصروفي', exact: true }).waitFor();

  await page.getByRole('button', { name: 'الدخل', exact: true }).click();
  await page.locator('#income-title').fill(testTitle);
  await page.locator('#income-amount').fill(String(amount));
  await page.locator('#income-note').fill('Smoke test على GitHub Pages الحقيقي');
  await page.getByRole('button', { name: 'إضافة دخل', exact: true }).click();
  await page.getByText('تمت إضافة الرصيد.', { exact: true }).waitFor({ timeout: 10_000 });
  await page.getByText(testTitle, { exact: true }).waitFor({ timeout: 10_000 });

  const beforeReload = await readTransactions(page);
  const savedBeforeReload = beforeReload.find((item) => item.title === testTitle && item.amount === amount && item.type === 'income');
  assert(savedBeforeReload, 'Transaction was not written to real IndexedDB before reload');

  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'مصروفي', exact: true }).waitFor();
  await page.getByText(testTitle, { exact: true }).waitFor({ timeout: 10_000 });
  await page.getByText('123,456 د.ع', { exact: false }).first().waitFor({ timeout: 10_000 });

  const afterReload = await readTransactions(page);
  const persistedAfterReload = afterReload.find((item) => item.title === testTitle && item.amount === amount && item.type === 'income');
  assert(persistedAfterReload, 'Transaction did not persist in IndexedDB after reload');

  await page.close();
  page = await context.newPage();
  page.on('pageerror', (error) => runtimeErrors.push(`pageerror-after-reopen: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(`console-after-reopen: ${message.text()}`);
  });
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60_000 });
  await page.getByText(testTitle, { exact: true }).waitFor({ timeout: 10_000 });

  const afterReopen = await readTransactions(page);
  assert(afterReopen.some((item) => item.title === testTitle && item.amount === amount), 'Transaction did not persist after closing and reopening the page');

  await page.screenshot({ path: 'production-smoke.png', fullPage: true });

  assert(runtimeErrors.length === 0, `Runtime errors detected:\n${runtimeErrors.join('\n')}`);
  console.log(`PASS: production URL loaded: ${baseUrl}`);
  console.log(`PASS: real IndexedDB persisted transaction across reload and page reopen: ${testTitle}`);
} finally {
  try {
    if (!page.isClosed()) await deleteDatabase(page);
  } catch (error) {
    console.warn('Cleanup warning:', error instanceof Error ? error.message : String(error));
  }
  await browser.close();
}
