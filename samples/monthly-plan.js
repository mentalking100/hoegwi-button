// Hoegwi Button 0.50.3. Today component excerpt from upgrade/core.js.
// The surrounding game runtime supplies the helpers referenced below.

  function Today(props) {
    useLanguage();
    const state = props.state, budget = api.estimate(state);
    if (!state.journey || state.pendingTurn || state.expansion?.pendingOuting || state.calendar.phase === 'complete') {
      return h(api.originalToday, props);
    }
    const memory = api.memory(state);
    return h('div', { className: 'u50-today' },
      h(api.slots.BY, props), h(api.slots.Wp, props),
      h(Scene, { state }),
      h('div', { className: 'u50-section-head' }, h('h1', null, t('monthPlan')),
        h('button', { className: 'u50-text', onClick: () => live.onModal('quarter-news') }, language() === 'ko' ? '시대 소식 ›' : 'News ›')),
      h('div', { className: 'u50-action-grid' },
        h('a', { href: '#work', className: 'u50-action u50-career-action' }, h(Icon, { name: 'book' }), h('strong', null, t('careerStudy')), h('small', null, api.job(state))),
        h('div', { className: 'u50-lifestyle' }, h(api.slots.tq, props)),
        h('a', { href: '#assets/stocks', className: 'u50-action u50-invest-action' }, h(Icon, { name: 'chart' }), h('strong', null, t('invest')), h('small', null, t('browse')))),
      h('section', { className: 'u50-forecast' + (budget.shortage > 0n ? ' is-short' : ''), 'aria-label': t('forecast') },
        h('div', { className: 'u50-forecast-main' }, h('span', null, t('forecast')), h('strong', { key: String(budget.balance) }, money(budget.balance))),
        h('div', { className: 'u50-flow' }, h('span', null, t('income') + ' ', h('b', null, '+' + money(budget.income))),
          h('span', null, t('spending') + ' ', h('b', null, '−' + money(budget.cost)))),
        budget.shortage > 0n ? h('p', { className: 'u50-warning', role: 'status' }, money(budget.shortage) + (language() === 'ko' ? ' 부족해요. 진행 전에 자금을 확인해 주세요.' : ' short. Review your budget.'))
          : h('small', null, t('estimateNote'))),
      h('button', { className: 'u50-primary u50-advance', disabled: props.busy, onClick: () => live.onAdvance?.() }, h('span', null, t('advance')), h(Icon, { name: 'arrow' })),
      h(api.slots.G0, props),
      state.finance.arrears > 0n ? h('a', { className: 'finance-warning', href: '#assets/credit' }, money(state.finance.arrears) + ' · ' + (language() === 'ko' ? '연체 확인' : 'Review overdue payments')) : null,
      memory && state.marketMode === 'era' ? h('details', { className: 'u50-memory' },
        h('summary', null, h('span', null, t('memory')), h('strong', null, memory.title)),
        h('p', null, memory.memory), h('small', null, memory.fact), h('p', { className: 'small-note' }, memory.effect)) : null,
      h('details', { className: 'u50-details' }, h('summary', null, t('details')),
        h(api.slots.KY, props), h(api.slots.Nv, { state }), h(api.slots.FY, props),
        state.world?.routineNote?.startsWith('예산 부족') ? h('p', { className: 'inline-hint' }, state.world.routineNote) : null,
        h('button', { disabled: props.busy || budget.shortage > 0n, onClick: () => props.send({ type: 'ADVANCE', months: 3 }) }, language() === 'ko' ? '현재 계획으로 최대 3개월 보내기' : 'Continue up to 3 months')));
  }
