/* Log screen: category tiles, amount entry, quick chips, daily goal, streak and week dots. */
(function (BT) {
  'use strict';
  const U = BT.utils, S = BT.store, C = BT.config, { $, fmt, today, esc } = U;
  let cat = '';
  const amount = () => parseInt($('#amount').value, 10) || 0;

  function sync() {
    const input = $('#amount');
    input.style.width = Math.max(input.value.length, 1) + 0.6 + 'ch';
    $('#logBtn').disabled = !(cat && amount() > 0);
  }

  function renderTiles() {            // rebuilt on every render so Settings changes show up straight away
    const list = C.categories.filter(c => !c.hidden);
    if (!list.some(c => c.id === cat)) cat = '';
    $('#catName').textContent = cat ? C.name(cat) : 'Choose a category';
    $('#tiles').innerHTML = list.map(c => '<button class="tile" data-id="' + c.id + '" aria-pressed="' + (c.id === cat) + '">' + esc(c.name) + '</button>').join('');
    sync();
  }

  function render() {
    renderTiles();
    $('.cur').textContent = C.currency;
    const t = today(), d = target(), start = U.weekStart(t), spent = S.total(d, d);
    $('#dateCap').textContent = U.dayName(t, { weekday: 'long', day: 'numeric', month: 'long' });
    $('#streakNum').textContent = S.streak();
    $('#week').innerHTML = Array.from('MTWTFSS').map((l, i) => {
      const d = U.addDays(start, i);
      return '<span><span aria-hidden="true">' + l + '</span><i class="dot' + (S.isLogged(d) ? ' on' : '') + (d === t ? ' today' : '') + '" aria-hidden="true"></i><span class="sr">' +
        U.dayName(d, { weekday: 'long' }) + (S.isLogged(d) ? ': logged' : d > t ? '' : ': not logged') + '</span></span>';
    }).join('');
    $('#goalFill').style.width = Math.min(spent / C.dailyGoal, 1) * 100 + '%';
    $('#goalText').textContent = fmt(spent) + ' of ' + fmt(C.dailyGoal) + (d === t ? ' today' : ' on ' + U.dayName(d, { weekday: 'short', day: 'numeric', month: 'short' })) + (spent > C.dailyGoal ? ' (over)' : '');
    BT.cat.setLogged(S.isLogged(t));
    renderDate(d, t);
  }

  let logDate = '';                  // '' means today; otherwise the date being logged for
  const target = () => logDate || today();

  function renderDate(d, t) {
    const y = U.addDays(t, -1);
    U.$$('#dates .chip').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.day === '0' && d === t) || (b.dataset.day === '1' && d === y))));
    const input = $('#logDate'); input.max = t; input.value = d;
    $('#dateNote').textContent = d === t ? '' : 'Logging for ' + U.dayName(d, { weekday: 'long', day: 'numeric', month: 'long' });
    $('#noSpendBtn').textContent = d === t ? 'Nothing spent today' : 'Nothing spent that day';
  }

  function pickDate(value) {         // ignores empty, future or silly dates
    const t = today();
    logDate = /^\d{4}-\d{2}-\d{2}$/.test(value) && value <= t && value >= '2000-01-01' && value !== t ? value : '';
    render();
  }

  function flash(text) {
    const btn = $('#logBtn'), old = 'Log expense';
    btn.textContent = text; setTimeout(() => { btn.textContent = old; }, 1200);
  }

  function init() {
    $('#tiles').addEventListener('click', e => {
      const b = e.target.closest('.tile'); if (!b) return;
      cat = b.dataset.id; $('#catName').textContent = C.name(cat);
      U.$$('.tile').forEach(t => t.setAttribute('aria-pressed', t === b));
      sync();
    });
    $('#amount').addEventListener('input', e => {
      e.target.value = e.target.value.replace(/\D/g, '').replace(/^0+/, ''); sync();
    });
    $('#chips').addEventListener('click', e => {
      const b = e.target.closest('.chip'); if (!b) return;
      const add = +b.dataset.add; $('#amount').value = add ? String(amount() + add) : ''; sync();
    });
    $('#logBtn').addEventListener('click', () => {
      if (!(cat && amount() > 0)) return;
      const a = amount();
      const d = target();
      S.add(cat, a, d);
      $('#live').textContent = 'Logged ' + C.name(cat) + ' ' + fmt(a) + (d === today() ? '' : ' for ' + U.dayName(d, { weekday: 'long', day: 'numeric', month: 'long' }));
      $('#amount').value = ''; sync(); flash('Logged'); BT.cat.react();
    });
    $('#noSpendBtn').addEventListener('click', () => {
      if (S.on(target()).length) { flash('Already logged'); return; }
      S.markNoSpend(target()); $('#live').textContent = target() === today() ? 'Marked today as no spend' : 'Marked ' + target() + ' as no spend'; BT.cat.react();
    });
    $('#dates').addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) pickDate(b.dataset.day === '1' ? U.addDays(today(), -1) : ''); });
    $('#logDate').addEventListener('change', e => pickDate(e.target.value));
    S.subscribe(render); render(); sync();
  }

  BT.log = { init, render, resetDate() { if (logDate) { logDate = ''; render(); } } };
})(window.BT);
