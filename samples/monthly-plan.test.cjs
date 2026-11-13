const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');

const source = readFileSync(join(__dirname, 'monthly-plan.js'), 'utf8');

function render({ shortage = 0n, pendingTurn = null } = {}) {
  const events = [];
  const props = {
    busy: false,
    state: { journey: {}, calendar: { phase: 'active' }, finance: { arrears: 0n }, pendingTurn },
    send: command => events.push({ ...command }),
  };
  const api = {
    estimate: () => ({ income: 100n, cost: 75n, balance: 25n, shortage }),
    memory: () => null,
    originalToday: 'original-today',
    job: () => 'Tester',
    slots: {},
  };
  const h = (tag, attrs, ...children) => ({ tag, attrs, children });
  const today = runInNewContext(source + '\nToday', {
    api, h, live: {}, Scene: 'scene', Icon: 'icon', useLanguage() {},
    language: () => 'en', t: key => key, money: String,
  });
  return { page: today(props), events };
}

function find(tree, predicate) {
  if (!tree || typeof tree !== 'object') return undefined;
  if (predicate(tree)) return tree;
  for (const child of tree.children) {
    const match = find(child, predicate);
    if (match) return match;
  }
}

const threeMonthButton = tree => find(tree, element =>
  element.tag === 'button' && element.children.includes('Continue up to 3 months'));

test('the plan sends a three-month advance command when its budget allows it', () => {
  const { page, events } = render();
  const button = threeMonthButton(page);
  assert.equal(button.attrs.disabled, false);
  button.attrs.onClick();
  assert.deepEqual(events, [{ type: 'ADVANCE', months: 3 }]);
});

test('a budget shortage disables three-month advance and shows a warning', () => {
  const { page } = render({ shortage: 10n });
  assert.equal(threeMonthButton(page).attrs.disabled, true);
  assert.ok(find(page, element => element.attrs?.role === 'status'));
});

test('an unresolved event returns control to the existing game view', () => {
  const { page } = render({ pendingTurn: {} });
  assert.equal(page.tag, 'original-today');
});
