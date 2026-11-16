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
    cur: () => (BT.config && BT.config.currency) || '฿',
    // money: whole numbers stay whole, anything with cents shows two decimals (34.5 -> 34.50)
    fmt: n => { const v = Math.round(n * 100) / 100; return U.cur() + v.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 }); },
    fmt0: n => U.cur() + Math.round(n).toLocaleString('en-US'),       // averages: whole numbers are easier to read
    short: n => n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(Math.round(n * 100) / 100),
    money: v => Math.round((parseFloat(v) || 0) * 100) / 100,         // text -> amount with at most 2 decimals
    cleanAmount: v => {                                                // keeps digits, one dot, max 2 decimals
      v = String(v).replace(',', '.').replace(/[^\d.]/g, '');
      const i = v.indexOf('.');
      if (i >= 0) v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\./g, '').slice(0, 2);
      v = v.replace(/^0+(?=\d)/, '');
      return v.charAt(0) === '.' ? '0' + v : v;
    },
    esc: s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  };
})(window.BT = window.BT || {});
