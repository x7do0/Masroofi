import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import test from 'node:test';

const require = createRequire(import.meta.url);
const build = process.env.MASROOFI_TEST_BUILD;
assert.ok(build, 'Run through npm test');
const { createRefreshQueue } = require(join(build, 'src/utils/refreshQueue.js'));
const { placeFloatingMenu } = require(join(build, 'src/utils/floatingMenu.js'));
const { createTransactionTitleLookup } = require(join(build, 'src/utils/transactionTitles.js'));
const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done; }); return { promise, resolve }; };

test('same-turn write event and awaited refresh share one read', async () => {
  let reads = 0;
  const refresh = createRefreshQueue(async () => { ++reads; });
  const first = refresh();
  await Promise.resolve();
  const second = refresh();
  assert.equal(first, second);
  await Promise.all([first, second]);
  assert.equal(reads, 1);
  await refresh();
  assert.equal(reads, 2);
});

test('invalidation during an in-flight read is not dropped or published stale', async () => {
  const started = deferred();
  const release = deferred();
  const published = [];
  let reads = 0;
  const refresh = createRefreshQueue(async (isCurrent) => {
    const value = ++reads;
    if (value === 1) { started.resolve(); await release.promise; }
    if (isCurrent()) published.push(value);
  });
  const first = refresh();
  await started.promise;
  const second = refresh();
  const third = refresh();
  release.resolve();
  await Promise.all([first, second, third]);
  assert.equal(reads, 2);
  assert.deepEqual(published, [2]);
});

test('a notification arriving in the trailing read causes another read', async () => {
  const gates = [deferred(), deferred()];
  const starts = [deferred(), deferred()];
  const published = [];
  let reads = 0;
  const refresh = createRefreshQueue(async (isCurrent) => {
    const index = reads++;
    if (index < 2) { starts[index].resolve(); await gates[index].promise; }
    if (isCurrent()) published.push(index);
  });
  const pending = refresh();
  await starts[0].promise;
  refresh();
  gates[0].resolve();
  await starts[1].promise;
  refresh();
  gates[1].resolve();
  await pending;
  assert.equal(reads, 3);
  assert.deepEqual(published, [2]);
});

test('a failed drain does not permanently block refresh', async () => {
  let reads = 0;
  const refresh = createRefreshQueue(async () => { if (++reads === 1) throw new Error('test read failure'); });
  await assert.rejects(refresh(), /test read failure/);
  await refresh();
  assert.equal(reads, 2);
});

const viewport = { left: 0, top: 0, right: 430, bottom: 800 };
const nav = { left: 9, top: 727, right: 421, bottom: 791 };
const fab = { left: 18, top: 663, right: 70, bottom: 715 };
const size = { width: 144, height: 102 };
test('last-row menu flips above the trigger and clears FAB and navigation', () => {
  const anchor = { left: 24, top: 600, right: 68, bottom: 644 };
  const result = placeFloatingMenu(anchor, size, viewport, [nav, fab]);
  assert.equal(result.top, 492);
  assert.ok(result.top + size.height < anchor.top);
  assert.ok(result.top + size.height < fab.top);
});
test('middle-row menu opens below when there is room', () => {
  const anchor = { left: 24, top: 200, right: 68, bottom: 244 };
  assert.equal(placeFloatingMenu(anchor, size, viewport, [nav, fab]).top, 250);
});
test('menu clamps inside narrow, offset visual viewports', () => {
  const view = { left: 40, top: 100, right: 270, bottom: 420 };
  const result = placeFloatingMenu({ left: 245, top: 110, right: 280, bottom: 154 }, size, view);
  assert.ok(result.left >= 48);
  assert.ok(result.left + size.width <= 262);
  assert.ok(result.top >= 108);
  assert.ok(result.top + size.height <= 412);
});
test('a tall menu is scrollable inside the available area', () => {
  const result = placeFloatingMenu({ left: 12, top: 130, right: 56, bottom: 174 },
    { width: 144, height: 600 }, { left: 0, top: 0, right: 360, bottom: 320 },
    [{ left: 9, top: 240, right: 351, bottom: 310 }]);
  assert.equal(result.maxHeight, 224);
  assert.equal(result.top, 8);
});

test('indexed repayment titles match parents, preserve fallback, and refresh on rename', () => {
  const debt = { id: 'd', type: 'debt_given', title: 'شخص تجريبي' };
  const repayment = { id: 'r', type: 'debt_repayment', debtId: 'd', title: 'قديم' };
  const income = { id: 'i', type: 'income', title: 'دخل تجريبي' };
  const before = createTransactionTitleLookup([repayment, debt, income]);
  assert.equal(before(repayment), debt.title);
  assert.equal(before(income), income.title);
  assert.equal(before({ ...repayment, debtId: 'missing' }), 'قديم');
  const after = createTransactionTitleLookup([repayment, { ...debt, title: 'اسم معدل' }, income]);
  assert.equal(after(repayment), 'اسم معدل');
  assert.equal(before(repayment), debt.title);
});
