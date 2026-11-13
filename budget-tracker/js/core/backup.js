/* Backup and restore: JSON backup (everything), CSV export (expenses) and a validated import. */
(function (BT) {
  'use strict';
  const S = BT.store, DATE = /^\d{4}-\d{2}-\d{2}$/;

  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  BT.backup = {
    exportJson() {
      const d = S.snapshot();
      download('budget-tracker-' + BT.utils.today() + '.json', JSON.stringify(d, null, 2), 'application/json');
      return d.expenses.length;
    },
    exportCsv() {
      const list = S.snapshot().expenses.slice().sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
      const rows = ['date,category,amount'].concat(list.map(e => [e.date, '"' + BT.config.name(e.cat).replace(/"/g, '""') + '"', e.amount].join(',')));
      download('budget-tracker-' + BT.utils.today() + '.csv', rows.join('\n'), 'text/csv');
      return list.length;
    },
    readFile: file => new Promise((resolve, reject) => {
      const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = () => reject(r.error); r.readAsText(file);
    }),
    parse(text) {                    // returns { data } or { error }
      let d; try { d = JSON.parse(text); } catch (e) { return { error: 'That file is not a valid backup.' }; }
      if (!d || d.app !== 'budget-tracker' || !Array.isArray(d.expenses)) return { error: 'That file is not a Budget Tracker backup.' };
      const expenses = d.expenses.filter(e => e && DATE.test(e.date) && typeof e.cat === 'string' && Number.isFinite(e.amount) && e.amount > 0)
        .map(e => ({ id: String(e.id || Math.random().toString(36).slice(2)), date: e.date, cat: e.cat, amount: Math.round(e.amount) }));
      const noSpend = (Array.isArray(d.noSpend) ? d.noSpend : []).filter(x => typeof x === 'string' && DATE.test(x));
      let settings = null;
      if (d.settings && Array.isArray(d.settings.categories)) {
        const categories = d.settings.categories.filter(c => c && typeof c.id === 'string' && typeof c.name === 'string')
          .map(c => ({ id: c.id, name: c.name.slice(0, 24), budget: Math.max(0, Math.round(+c.budget || 0)), fixed: !!c.fixed, hidden: !!c.hidden }));
        if (categories.length) settings = { currency: String(d.settings.currency || '').slice(0, 3), dailyGoal: Math.round(+d.settings.dailyGoal) || 0, categories };
      }
      return { data: { expenses, noSpend, settings } };
    }
  };
})(window.BT);
