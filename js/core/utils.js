/* Small shared helpers: DOM lookups, dates (local time, YYYY-MM-DD strings) and formatting. */
(function (BT) {
  'use strict';
  const pad = n => String(n).padStart(2, '0');
  const U = BT.utils = {
    $: (s, r = document) => r.querySelector(s),
    $$: (s, r = document) => Array.from(r.querySelectorAll(s)),
    ymd: d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()),
    parse: s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); },
    today: () => U.ymd(new Date()),
    addDays: (s, n) => { const d = U.parse(s); d.setDate(d.getDate() + n); return U.ymd(d); },
    diff: (a, b) => Math.round((U.parse(b) - U.parse(a)) / 864e5),
    weekStart: s => U.addDays(s, -((U.parse(s).getDay() + 6) % 7)),   // Monday
    monthKey: s => s.slice(0, 7),
    shiftMonth: (key, n) => { const [y, m] = key.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return d.getFullYear() + '-' + pad(d.getMonth() + 1); },
    daysIn: key => { const [y, m] = key.split('-').map(Number); return new Date(y, m, 0).getDate(); },
    monthLabel: key => U.parse(key + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
    dayName: (s, opts) => U.parse(s).toLocaleDateString('en-GB', opts),
    fmt: n => ((BT.config && BT.config.currency) || '฿') + Math.round(n).toLocaleString('en-US'),
    short: n => n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(Math.round(n)),
    esc: s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  };
})(window.BT = window.BT || {});
