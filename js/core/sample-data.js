/* Demo data generator, so the Stats, calendar and Wrapped screens can be explored straight away. */
(function (BT) {
  'use strict';
  BT.sample = function () {
    const { today, addDays } = BT.utils, all = BT.config.categories.filter(c => !c.hidden), cats = all.filter(c => !c.fixed), fixed = all.find(c => c.fixed);
    const out = { expenses: [], noSpend: [] };
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const add = (date, cat, amount) => out.expenses.push({ id: 's' + out.expenses.length, date, cat, amount });
    for (let i = 70; i >= 0; i--) {
      const d = addDays(today(), -i);
      if (d.slice(8) === '01' && fixed) add(d, fixed.id, fixed.budget);
      if (i > 0 && rnd() < 0.15) continue;                       // a missed day
      if (rnd() < 0.1) { out.noSpend.push(d); continue; }        // a no-spend day
      for (let k = 0, n = 1 + Math.floor(rnd() * 3); k < n; k++) {
        add(d, cats[Math.floor(rnd() * cats.length)].id, Math.round((30 + rnd() * 220) / 5) * 5);
      }
    }
    return out;
  };
})(window.BT);
