import { chromium } from 'playwright';

const baseUrl = process.env.MASROOFI_URL ?? 'https://x7do0.github.io/Masroofi/';
const testTitle = `اختبار إنتاج ${Date.now()}`;
const expenseTitle = `مصروف اختبار ${Date.now()}`;
const amount = 123456;
const expenseAmount = 25000;
const arabicDigitPattern = /[٠-٩۰-۹]/;
const englishMonthPattern = /January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/;
const amPmPattern = /\b(?:AM|PM)\b/;

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

async function verifyPwa(page) {
  const pwa = await page.evaluate(async () => {
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (!(manifestLink instanceof HTMLLinkElement)) return { error: 'Manifest link missing' };
    const response = await fetch(manifestLink.href, { cache: 'no-store' });
    if (!response.ok) return { error: `Manifest request failed: ${response.status}` };
    const manifest = await response.json();
    const registration = await Promise.race([
      navigator.serviceWorker?.ready,
      new Promise((resolve) => window.setTimeout(() => resolve(null), 10_000)),
    ]);
    return {
      manifest,
      serviceWorkerActive: Boolean(registration?.active),
    };
  });

  assert(!pwa.error, pwa.error ?? 'Unknown PWA error');
  assert(pwa.manifest?.name === 'مصروفي', 'Manifest app name is incorrect');
  assert(pwa.manifest?.display === 'standalone', 'Manifest display mode is not standalone');
  assert(pwa.manifest?.icons?.some((icon) => icon.sizes === '192x192' && icon.type === 'image/png'), '192x192 PNG icon missing from manifest');
  assert(pwa.manifest?.icons?.some((icon) => icon.sizes === '512x512' && icon.type === 'image/png'), '512x512 PNG icon missing from manifest');
  assert(pwa.serviceWorkerActive, 'Service Worker did not become active');
}

async function verifyTransactionMenuLayer(page) {
  const firstRow = page.locator('.transaction-row').first();
  await firstRow.getByRole('button', { name: 'خيارات العملية' }).click();
  const popover = firstRow.locator('.row-menu-popover');
  await popover.waitFor();

  const layerCheck = await popover.evaluate((menu) => {
    const row = menu.closest('.transaction-row');
    const rect = menu.getBoundingClientRect();
    const topElement = document.elementFromPoint(rect.left + rect.width / 2, rect.bottom - 8);
    return {
      rowZIndex: row ? Number.parseInt(getComputedStyle(row).zIndex || '0', 10) : 0,
      menuOwnsTopElement: Boolean(topElement && menu.contains(topElement)),
    };
  });

  assert(layerCheck.rowZIndex >= 30, 'Open transaction row was not raised above sibling stacking contexts');
  assert(layerCheck.menuOwnsTopElement, 'Transaction menu is visually covered by another row');
}

async function verifyBackupExperience(page) {
  await page.getByRole('button', { name: 'النسخ الاحتياطي والاسترجاع' }).click();
  const dialog = page.getByRole('dialog', { name: 'النسخ الاحتياطي والاسترجاع' });
  await dialog.waitFor();
  const dialogText = await dialog.innerText();
  assert(!/JSON/i.test(dialogText), 'Backup UI exposes JSON terminology to the user');
  assert(dialogText.includes('حفظ نسخة احتياطية'), 'Friendly backup action label is missing');
  assert(dialogText.includes('استرجاع نسخة احتياطية'), 'Friendly restore action label is missing');

  const fileInput = dialog.locator('input[type="file"]');
  const accept = await fileInput.getAttribute('accept');
  assert(accept?.includes('.masroofi') && accept.includes('.json'), 'Backup picker must accept new and legacy backup files');

  const downloadPromise = page.waitForEvent('download');
  await dialog.getByRole('button', { name: /حفظ نسخة احتياطية/ }).click();
  const download = await downloadPromise;
  assert(download.suggestedFilename().endsWith('.masroofi'), 'Backup download does not use the friendly .masroofi file extension');
  await dialog.getByRole('button', { name: 'إغلاق' }).click();
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
  await verifyPwa(page);

  const themeButton = page.getByRole('button', { name: /المظهر الحالي:/ });
  await themeButton.waitFor();
  await themeButton.click();
  const savedTheme = await page.evaluate(() => localStorage.getItem('masroofi-theme'));
  assert(savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system', 'Theme preference was not persisted');

  await deleteDatabase(page);
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'مصروفي', exact: true }).waitFor();

  await page.getByRole('button', { name: 'الدخل', exact: true }).click();
  await page.locator('#income-title').fill(testTitle);
  await page.locator('#income-amount').fill(String(amount));
  assert(await page.locator('#income-amount').inputValue() === '123,456', 'Amount input did not add thousands separators while typing');

  const dateTriggerText = await page.locator('.date-trigger').innerText();
  assert(!arabicDigitPattern.test(dateTriggerText), 'Date trigger still contains Arabic-Indic digits');
  assert(englishMonthPattern.test(dateTriggerText), 'Date trigger does not use an English month name');
  assert(amPmPattern.test(dateTriggerText), 'Date trigger does not use AM/PM');

  await page.locator('#income-note').fill('Smoke test على GitHub Pages الحقيقي');
  await page.getByRole('button', { name: 'إضافة رصيد', exact: true }).click();
  await page.getByText('💰 تمت إضافة الرصيد', { exact: true }).waitFor({ timeout: 10_000 });
  await page.getByText(testTitle, { exact: true }).waitFor({ timeout: 10_000 });

  await page.getByRole('button', { name: 'المصروفات', exact: true }).click();
  await page.locator('#expense-title').fill(expenseTitle);
  await page.locator('#expense-amount').fill(String(expenseAmount));
  assert(await page.locator('#expense-amount').inputValue() === '25,000', 'Expense amount input did not add thousands separators');
  await page.getByRole('button', { name: 'إضافة مصروف', exact: true }).click();
  await page.getByText(expenseTitle, { exact: true }).waitFor({ timeout: 10_000 });

  await page.getByRole('button', { name: 'السجل', exact: true }).click();
  await page.getByText(testTitle, { exact: true }).waitFor({ timeout: 10_000 });
  const historyText = await page.locator('.history-page').innerText();
  assert(!arabicDigitPattern.test(historyText), 'History still contains Arabic-Indic digits');
  assert(englishMonthPattern.test(historyText), 'History does not use English month names');
  assert(amPmPattern.test(historyText), 'History does not use AM/PM');
  await verifyTransactionMenuLayer(page);
  await verifyBackupExperience(page);

  const beforeReload = await readTransactions(page);
  const savedBeforeReload = beforeReload.find((item) => item.title === testTitle && item.amount === amount && item.type === 'income');
  assert(savedBeforeReload, 'Transaction was not written to real IndexedDB before reload');

  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'مصروفي', exact: true }).waitFor();
  await page.getByRole('button', { name: 'الدخل', exact: true }).click();
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
  await page.getByRole('button', { name: 'الدخل', exact: true }).click();
  await page.getByText(testTitle, { exact: true }).waitFor({ timeout: 10_000 });

  const afterReopen = await readTransactions(page);
  assert(afterReopen.some((item) => item.title === testTitle && item.amount === amount), 'Transaction did not persist after closing and reopening the page');

  await page.screenshot({ path: 'production-smoke.png', fullPage: true });

  assert(runtimeErrors.length === 0, `Runtime errors detected:\n${runtimeErrors.join('\n')}`);
  console.log(`PASS: production URL loaded: ${baseUrl}`);
  console.log('PASS: PWA manifest, PNG icons, Service Worker and persisted theme verified');
  console.log('PASS: amount inputs format thousands separators while typing');
  console.log('PASS: dates are ordered with Latin digits, English months and AM/PM');
  console.log('PASS: backup UI uses friendly language and .masroofi files while keeping legacy restore support');
  console.log('PASS: transaction action menu stays above sibling rows');
  console.log(`PASS: real IndexedDB persisted transaction across reload and page reopen: ${testTitle}`);
} finally {
  try {
    if (!page.isClosed()) await deleteDatabase(page);
  } catch (error) {
    console.warn('Cleanup warning:', error instanceof Error ? error.message : String(error));
  }
  await browser.close();
}
