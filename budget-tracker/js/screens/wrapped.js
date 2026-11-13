/* Wrapped: a full-screen "week in review" (Monday to today) with a share button. */
(function (BT) {
  'use strict';
  const U = BT.utils, S = BT.store, C = BT.config, { $, fmt, today } = U;

  function data() {
    const t = today(), s = U.weekStart(t), exp = S.between(s, t), by = {}, byDay = {};
    exp.forEach(e => { by[e.cat] = (by[e.cat] || 0) + e.amount; byDay[e.date] = (byDay[e.date] || 0) + e.amount; });
    const sorted = o => Object.entries(o).sort((a, b) => b[1] - a[1]);
    const total = exp.reduce((sum, e) => sum + e.amount, 0), n = U.diff(s, t) + 1;
    return { s, t, n, exp, total, top: sorted(by)[0], big: exp.slice().sort((a, b) => b.amount - a.amount)[0],
      low: sorted(byDay).filter(x => x[1] > 0).pop(), logged: S.loggedCount(s, t), streak: S.streak() };
  }

  function card(d) {
    const wd = s => U.dayName(s, { weekday: 'short' }), share = Math.round(d.top[1] / d.total * 100);
    return '<div><div class="cap">Your week in review</div><div class="serif big">' + fmt(d.total) + '</div><div class="sub" style="font-size:14px">spent across ' + d.n + ' days</div></div>' +
      '<div class="navy"><div class="cap">Top category</div><div class="serif name">' + U.esc(C.name(d.top[0])) + '</div>' +
      '<div class="sub" style="font-size:14px">' + fmt(d.top[1]) + ' \u00b7 ' + share + '% of your week</div><div class="bar"><i style="width:' + share + '%"></i></div></div>' +
      '<div><div class="li"><span>Biggest splurge</span><span>' + U.esc(C.name(d.big.cat)) + ' ' + fmt(d.big.amount) + ' \u00b7 ' + wd(d.big.date) + '</span></div>' +
      '<div class="li"><span>Cheapest day</span><span>' + fmt(d.low[1]) + ' \u00b7 ' + wd(d.low[0]) + '</span></div>' +
      '<div class="li" style="border-bottom:1px solid var(--line)"><span>Days logged</span><span>' + d.logged + ' of ' + d.n + '</span></div></div>' +
      '<div class="story-end"><div class="row2"><div><div class="cap">Current streak</div><div class="serif" style="font-size:26px;margin-top:4px">' + d.streak + ' days</div></div>' + BT.cat.svg(48) + '</div>' +
      '<button class="btn" id="shareBtn">Share this week</button></div>';
  }

  function open() {
    const d = data(), layer = $('#story');
    layer.innerHTML = '<div class="story-in"><div class="story-top"><span class="cap">Week of ' + U.dayName(d.s, { day: 'numeric', month: 'short' }) + ' \u2013 ' + U.dayName(d.t, { day: 'numeric', month: 'short' }) +
      '</span><button class="icon" id="storyClose" aria-label="Close"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 4l12 12M16 4L4 16"/></svg></button></div>' +
      (d.exp.length ? card(d) : '<p class="sub" style="font-size:14px">Log a few expenses this week and your review will appear here.</p>') + '</div>';
    BT.a11y.open(layer, $('#storyClose'));
  }
  const close = () => BT.a11y.close($('#story'));

  function share() {
    const d = data(), text = 'My week: ' + fmt(d.total) + ' across ' + d.n + ' days. Top category: ' + C.name(d.top[0]) + '. Streak: ' + d.streak + ' days.';
    if (navigator.share) navigator.share({ text }).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => { $('#shareBtn').textContent = 'Copied to clipboard'; });
  }

  function init() {
    $('#story').addEventListener('click', e => {
      if (e.target.closest('#storyClose')) close();
      if (e.target.closest('#shareBtn')) share();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  BT.wrapped = { init, open, close };
})(window.BT);
