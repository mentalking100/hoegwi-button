'use strict';

// Exercise the shipped monthly record writer, not a reimplementation of its
// comparison. The surrounding monthly simulation is covered by engine QA.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const gameHtml = path.join(__dirname, 'venture-month.js');
const writerSource = fs.readFileSync(gameHtml, 'utf8');

function harness({ afterPrior } = {}) {
  const calls = [];
  const previousResult = { settled: true };
  const context = {
    life38GameplayAfterMonth(state, date, command) {
      calls.push({ kind: 'prior', date, command });
      afterPrior?.(state);
      return previousResult;
    },
    life385RestoreCivilianLife() { calls.push({ kind: 'restore' }); },
    life38EnsureGameplay: state => state.v38.gameplay,
    life38Root: state => state.v38,
    life38Record(state, kind, id, text) { calls.push({ kind: 'milestone', event: kind, id, text }); }
  };
  vm.createContext(context);
  vm.runInContext(writerSource, context, { filename: gameHtml + ':monthly-venture-record', timeout: 1000 });
  return { calls, previousResult, write: (state, date = '2007-07-01') => context.life38GameplayAfterMonth(state, date, { commandId: 'venture-peak-qa' }) };
}

function stateFor(profit, previousRecord, id = 'venture-A') {
  const records = previousRecord === undefined ? {} : { economy: { ventures: { [id]: previousRecord } } };
  return {
    v38: {
      records,
      gameplay: {
        careers: {
          venture: {
            id, kind: 'startup', status: 'active', started: '2007-06-01',
            months: 1, profit: String(profit), breakthroughYear: null, saleProceeds: '0'
          }
        }
      }
    }
  };
}

for (const [label, profit] of [['loss', '-350000'], ['break-even', '0'], ['profit', '350000']]) {
  test(`first ${label} month creates a record using the actual profit`, () => {
    const state = stateFor(profit);
    const h = harness();
    assert.doesNotThrow(() => h.write(state));
    const record = state.v38.records.economy.ventures['venture-A'];
    assert.equal(record.peakMonthlyProfit, profit);
    assert.equal(record.months, 1);
    assert.equal(record.opened, '2007-06-01');
    assert.equal(record.status, 'active');
  });
}

const comparisons = [
  ['larger loss preserves earlier lesser loss', '-350000', '-900000', '-350000'],
  ['smaller loss becomes new peak', '-900000', '-350000', '-350000'],
  ['loss after break-even retains a zero peak', '0', '-350000', '0'],
  ['break-even improves a negative peak', '-350000', '0', '0'],
  ['positive history survives a later loss', '350000', '-900000', '350000'],
  ['loss-to-profit transition raises the peak', '-350000', '900000', '900000'],
  ['equal profit is stable', '900000', '900000', '900000'],
  ['large integer increase keeps every digit', '9007199254740992', '9007199254740993', '9007199254740993'],
  ['large integer decrease preserves the prior exact amount', '9007199254740993', '9007199254740992', '9007199254740993']
];
for (const [label, previous, current, expected] of comparisons) {
  test(label, () => {
    const state = stateFor(current, { peakMonthlyProfit: previous });
    harness().write(state);
    assert.equal(state.v38.records.economy.ventures['venture-A'].peakMonthlyProfit, expected);
  });
}

for (const [label, previous] of [['absent peak field', {}], ['null peak field', { peakMonthlyProfit: null }]]) {
  test(`legacy record with ${label} starts from the current loss`, () => {
    const state = stateFor('-350000', previous);
    harness().write(state);
    assert.equal(state.v38.records.economy.ventures['venture-A'].peakMonthlyProfit, '-350000');
  });
}

test('a second business has its own loss peak and preserves the first business record', () => {
  const state = stateFor('-350000');
  const prior = { id: 'venture-retired', peakMonthlyProfit: '900000', status: 'closed' };
  state.v38.records.economy = { ventures: { 'venture-retired': prior } };
  harness().write(state);
  assert.deepEqual(state.v38.records.economy.ventures['venture-retired'], prior);
  assert.equal(state.v38.records.economy.ventures['venture-A'].peakMonthlyProfit, '-350000');
});

test('no venture does not invent a business record', () => {
  const state = stateFor('0');
  state.v38.gameplay.careers.venture = null;
  const h = harness();
  assert.equal(h.write(state), h.previousResult);
  assert.equal(state.v38.records.economy.ventures, undefined);
  assert.equal(h.calls.filter(call => call.kind === 'milestone').length, 0);
});

test('record writer runs after monthly profit is calculated and returns the prior hook result', () => {
  const state = stateFor('0');
  const h = harness({ afterPrior(s) { s.v38.gameplay.careers.venture.profit = '-123456'; } });
  assert.equal(h.write(state), h.previousResult);
  assert.equal(state.v38.records.economy.ventures['venture-A'].peakMonthlyProfit, '-123456');
  assert.deepEqual(h.calls.map(call => call.kind), ['prior', 'restore']);
});

test('the 100 million monthly milestone still uses current profit, not historical peak', () => {
  const state = stateFor('99999999', { peakMonthlyProfit: '100000001' });
  const h = harness();
  h.write(state);
  assert.equal(h.calls.filter(call => call.kind === 'milestone').length, 0);
  state.v38.gameplay.careers.venture.profit = '100000000';
  h.write(state);
  assert.equal(h.calls.filter(call => call.kind === 'milestone').length, 1);
  assert.equal(h.calls.find(call => call.kind === 'milestone').event, 'venture-profit');
});
