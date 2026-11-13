/* Stats screen: remaining budget, key numbers, trend vs budget pace and category variance. */
(function (BT) {
  'use strict';
  const U = BT.utils, S = BT.store, C = BT.config, { $, fmt, today, esc } = U;
  const monthly = () => C.categories.filter(c => !c.hidden).reduce((sum, c) => sum + (+c.budget || 0), 0);
  let period = 'month', showAll = false;

  function range() {
    const t = today(), key = U.monthKey(t), end = key + '-' + U.daysIn(key);
    if (period === 'week') { const s = U.weekStart(t); return { start: s, end: t, last: U.addDays(s, 6), scale: 7 / U.daysIn(key), label: 'This week' }; }
    if (period === 'term') return { start: U.shiftMonth(key, 1 - C.termMonths) + '-01', end: t, last: end, scale: C.termMonths, label: 'This term' };
    return { start: key + '-01', end: t, last: end, scale: 1, label: U.monthLabel(key) };
  }

  function catRow(c, v, scale) {
    const budget = c.budget * scale, d = Math.round(v - budget), over = d > 0 && !c.plain;
    const text = c.plain ? fmt(v) : c.fixed ? fmt(v) + ' fixed' : d === 0 ? 'on budget' : (over ? '+' : '\u2212') + fmt(Math.abs(d)) + (over ? ' over' : ' under');
    const width = c.fixed || c.plain ? 100 : budget ? Math.min(v / budget, 1) * 100 : (v ? 100 : 0);
    return '<div class="row"><span>' + esc(c.name) + '</span><div class="bar"><i class="' + (over && !c.fixed ? 'over' : '') +
      '" style="width:' + width + '%"></i></div><span class="v ' + (over && !c.fixed ? 'over' : '') + '">' + text + '</span></div>';
  }

  function render() {
    const r = range(), exp = S.between(r.start, r.end), spent = exp.reduce((sum, e) => sum + e.amount, 0);
    const budget = monthly() * r.scale, elapsed = U.diff(r.start, r.end) + 1, span = U.diff(r.start, r.last) + 1, left = budget - spent;
    $('#statsCap').textContent = r.label;
    $('#remainLbl').textContent = left >= 0 ? 'Remaining' : 'Over budget';
    $('#remain').textContent = fmt(Math.abs(left)); $('#ofBudget').textContent = 'of ' + fmt(budget);
    $('#budFill').style.width = (budget ? Math.min(spent / budget, 1) * 100 : 0) + '%';
    $('#kSpent').textContent = fmt(spent); $('#kAvg').textContent = fmt(spent / elapsed);
    $('#kLog').textContent = S.loggedCount(r.start, r.end) + ' / ' + elapsed;

    const cum = []; let run = 0;
    for (let i = 0; i < elapsed; i++) { const d = U.addDays(r.start, i); run += S.total(d, d); cum.push(run); }
    $('#trend').innerHTML = BT.charts.trend(cum, budget, span, 'Spent ' + fmt(spent) + ' so far against a budget of ' + fmt(budget));

    const by = {}; exp.forEach(e => { by[e.cat] = (by[e.cat] || 0) + e.amount; });
    let rows = C.categories.map(c => ({ c, v: by[c.id] || 0 }));
    const known = new Set(C.categories.map(c => c.id)), stray = exp.filter(e => !known.has(e.cat)).reduce((sum, e) => sum + e.amount, 0);
    if (stray) rows.push({ c: { id: 'other', name: 'Other', budget: 0, plain: true }, v: stray });   // expenses from a category removed on another device
    rows.sort((a, b) => b.v - a.v);
    if (!showAll) rows = rows.filter(x => x.v > 0).slice(0, 5); else rows = rows.filter(x => !x.c.hidden || x.v > 0);
    $('#cats').innerHTML = (rows.length ? rows.map(x => catRow(x.c, x.v, r.scale)).join('') : '<p class="sub">No expenses in this period yet.</p>') +
      '<button class="row more" id="more"><span>' + (showAll ? 'Show top 5' : 'All ' + C.categories.length + ' categories') + '</span><span>&rsaquo;</span></button>';
    $('#sampleBtn').hidden = !S.isEmpty() || BT.sync.enabled();
  }

  function init() {
    $('#period').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      period = b.dataset.p; U.$$('#period button').forEach(x => x.classList.toggle('on', x === b)); render();
    });
    $('#cats').addEventListener('click', e => { if (e.target.closest('#more')) { showAll = !showAll; render(); } });
    $('#avgBtn').addEventListener('click', () => BT.daily.open());
    $('#sampleBtn').addEventListener('click', () => S.replace(BT.sample()));
    $('#resetBtn').addEventListener('click', () => { if (confirm('Delete all saved expenses? If sync is on, they are deleted on your other devices too.')) S.replace({}); });
    S.subscribe(render); render();
  }

  BT.stats = { init, render };
})(window.BT);
