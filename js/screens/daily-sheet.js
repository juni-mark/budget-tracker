/* Daily spending sheet: month calendar with the amount spent on each day, a month switcher
   (buttons or swipe) and a detail card for the selected day. */
(function (BT) {
  'use strict';
  const U = BT.utils, S = BT.store, C = BT.config, { $, fmt, today, esc } = U;
  let month, sel, editing = null, touchX = null;
  const level = v => v <= 0 ? 'zero' : v <= C.heat[0] ? 'h1' : v <= C.heat[1] ? 'h2' : v <= C.heat[2] ? 'h3' : 'h4';
  const arrow = d => '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';

  function cells() {
    const days = U.daysIn(month), lead = (U.parse(month + '-01').getDay() + 6) % 7, t = today();
    let html = '<span></span>'.repeat(lead);
    for (let i = 1; i <= days; i++) {
      const d = month + '-' + String(i).padStart(2, '0'), cls = ['day'];
      let body = '<u>' + i + '</u>';
      let label = U.dayName(d, { weekday: 'long', day: 'numeric', month: 'long' });
      if (d > t) { cls.push('future'); label += ', upcoming'; }
      else if (!S.isLogged(d)) { cls.push('miss'); body += '<b>\u2014</b>'; label += ', not logged'; }
      else { const v = S.total(d, d); cls.push(level(v)); body += '<b>' + U.short(v) + '</b>'; label += v ? ', spent ' + fmt(v) : ', no spend'; }
      if (d === t) cls.push('now');
      if (d === sel) cls.push('sel');
      html += '<button class="' + cls.join(' ') + '" data-d="' + d + '" aria-label="' + label + '" aria-pressed="' + (d === sel) + '"' + (d > t ? ' disabled' : '') + '>' + body + '</button>';
    }
    return html;
  }

  function editForm(e) {             // inline form that replaces an entry while it is being edited
    const known = C.categories.some(c => c.id === e.cat);
    const opts = C.categories.map(c => '<option value="' + c.id + '"' + (c.id === e.cat ? ' selected' : '') + '>' + esc(c.name) + '</option>').join('') +
      (known ? '' : '<option value="' + esc(e.cat) + '" selected>Other</option>');
    return '<div class="edit" role="group" aria-label="Edit expense"><label>Amount<input id="edAmt" type="number" inputmode="numeric" min="1" value="' + e.amount + '"></label>' +
      '<label>Category<select id="edCat">' + opts + '</select></label>' +
      '<label>Date<input id="edDate" type="date" max="' + today() + '" value="' + e.date + '"></label>' +
      '<div class="actions"><button class="pill" id="edSave">Save</button><button class="pill" id="edCancel">Cancel</button></div>' +
      '<p class="sub" id="edMsg" role="alert"></p></div>';
  }

  function saveEdit() {
    const amount = parseInt($('#edAmt').value, 10), date = $('#edDate').value, msg = text => { $('#edMsg').textContent = text; };
    if (!(amount > 0 && amount <= 999999)) return msg('Enter an amount above zero.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today() || date < '2000-01-01') return msg('Choose a valid date that is not in the future.');
    S.update(editing, { cat: $('#edCat').value, amount, date });
    editing = null; sel = date; month = U.monthKey(date); render();
    const b = U.$('[data-d="' + date + '"]', $('#sheet')); if (b) b.focus();
  }

  function detail() {
    if (!sel) return '';
    const list = S.on(sel).sort((a, b) => b.amount - a.amount), total = list.reduce((sum, e) => sum + e.amount, 0);
    const rows = list.length ? list.map(e => e.id === editing ? editForm(e) : '<div class="en"><span>' + esc(C.name(e.cat)) + '</span><span>' + fmt(e.amount) +
      ' <button class="ed" data-ed="' + e.id + '" aria-label="Edit ' + esc(C.name(e.cat)) + ' ' + fmt(e.amount) + '">Edit</button>' +
      '<button class="x" data-rm="' + e.id + '" aria-label="Remove ' + esc(C.name(e.cat)) + ' ' + fmt(e.amount) + '">\u00d7</button></span></div>').join('')
      : '<div class="en"><span>' + (S.isLogged(sel) ? 'No spend' : 'Not logged') + '</span><span></span></div>';
    return '<div class="card"><div class="en top"><span class="serif">' + U.dayName(sel, { weekday: 'short', day: 'numeric', month: 'short' }) +
      '</span><span class="serif">' + fmt(total) + '</span></div>' + rows + '</div>';
  }

  function render() {
    const t = today(), cur = month === U.monthKey(t), days = U.daysIn(month);
    const end = cur ? t : month + '-' + days, elapsed = cur ? +t.slice(8) : days, total = S.total(month + '-01', end);
    $('#sheet .sheet').innerHTML =
      '<div class="grab"></div><div class="sheet-head"><h2>Daily spending</h2><button class="icon" id="sheetDone">Done</button></div>' +
      '<div class="month"><button class="icon" id="prevM" aria-label="Previous month">' + arrow('M12.5 4L6.5 10l6 6') + '</button>' +
      '<div><div class="cap" style="color:var(--ink);font-size:13px">' + U.monthLabel(month) + '</div><div class="sub">Swipe or tap the arrows</div></div>' +
      '<button class="icon" id="nextM" aria-label="Next month"' + (cur ? ' disabled' : '') + '>' + arrow('M7.5 4l6 6-6 6') + '</button></div>' +
      '<div class="kpis" style="margin-top:4px"><div><div class="cap">Total</div><div class="serif">' + fmt(total) + '</div></div>' +
      '<div><div class="cap">Per day</div><div class="serif">' + fmt(total / elapsed) + '</div></div>' +
      '<div><div class="cap">Logged</div><div class="serif">' + S.loggedCount(month + '-01', end) + ' of ' + elapsed + '</div></div></div>' +
      '<div class="cal lbl">' + Array.from('MTWTFSS').map(l => '<span>' + l + '</span>').join('') + '</div>' +
      '<div class="cal" id="cal">' + cells() + '</div>' +
      '<div class="legend"><span>Less<i style="background:var(--tint)"></i><i style="background:var(--soft)"></i><i style="background:var(--slate)"></i><i style="background:var(--ink)"></i>More</span>' +
      '<span><i style="background:var(--line)"></i>\u2014 Not logged</span><span>Amounts in ' + C.currency + '</span></div>' + detail();
  }

  function shift(n) {
    const next = U.shiftMonth(month, n);
    if (next > U.monthKey(today())) return;
    month = next; sel = null; editing = null; render();
    const b = $(n < 0 ? '#prevM' : '#nextM'); if (b && !b.disabled) b.focus();
  }
  function open() { month = U.monthKey(today()); sel = today(); editing = null; render(); BT.a11y.open($('#sheet'), $('#sheetDone')); }
  function close() { BT.a11y.close($('#sheet')); }

  function init() {
    const layer = $('#sheet');
    layer.addEventListener('click', e => {
      const t = e.target;
      if (t.classList.contains('scrim') || t.closest('#sheetDone')) return close();
      if (t.closest('#prevM')) return shift(-1);
      if (t.closest('#nextM')) return shift(1);
      const ed = t.closest('[data-ed]');
      if (ed) { editing = ed.dataset.ed; render(); const a = $('#edAmt'); if (a) { a.focus(); a.select(); } return; }
      if (t.closest('#edCancel')) { editing = null; render(); return; }
      if (t.closest('#edSave')) return saveEdit();
      const rm = t.closest('[data-rm]'); if (rm) return S.remove(rm.dataset.rm);
      const day = t.closest('[data-d]'); if (day) { sel = day.dataset.d; editing = null; render(); const b = U.$('[data-d="' + sel + '"]', layer); if (b) b.focus(); }
    });
    layer.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
    layer.addEventListener('touchend', e => {
      if (touchX === null || !e.target.closest('#cal')) { touchX = null; return; }
      const dx = e.changedTouches[0].clientX - touchX; touchX = null;
      if (Math.abs(dx) > 50) shift(dx > 0 ? -1 : 1);
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !layer.hidden) close(); });
    S.subscribe(() => { if (!layer.hidden) render(); });
  }

  BT.daily = { init, open, close };
})(window.BT);
