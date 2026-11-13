/* Data layer: expenses, "no spend" days and settings saved in localStorage, plus the queries the screens need. */
(function (BT) {
  'use strict';
  const { today, addDays } = BT.utils, KEY = 'bt.v1', subs = [];
  let S = { expenses: [], noSpend: [], settings: null, onboarded: false, deleted: [], settingsAt: 0, resetAt: 0 };
  try { S = Object.assign(S, JSON.parse(localStorage.getItem(KEY))); } catch (e) { /* first run */ }
  if (S.settings) BT.config.apply(S.settings);

  function commit() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ }
    subs.forEach(fn => fn());
  }

  const Store = BT.store = {
    subscribe: fn => subs.push(fn),
    add(cat, amount, date = today()) {
      S.expenses.push({ id: Date.now() + '-' + Math.random().toString(36).slice(2, 6), date, cat, amount });
      S.noSpend = S.noSpend.filter(d => d !== date);
      commit();
    },
    update(id, ch) {                 // change an expense's category, amount or date (stamped so sync keeps the change)
      const e = S.expenses.find(x => x.id === id);
      if (!e) return;
      Object.assign(e, { cat: ch.cat, amount: ch.amount, date: ch.date, u: Date.now() });
      S.noSpend = S.noSpend.filter(d => d !== e.date);
      commit();
    },
    countCat: id => S.expenses.filter(e => e.cat === id).length,
    reassign(from, to) {             // move every expense from one category to another (stamped so sync keeps the change)
      const now = Date.now();
      S.expenses.forEach(e => { if (e.cat === from) { e.cat = to; e.u = now; } });
      commit();
    },
    remove(id) { S.expenses = S.expenses.filter(e => e.id !== id); S.deleted = S.deleted.concat(id).slice(-2000); commit(); },
    markNoSpend(date = today()) {
      if (!Store.on(date).length && !S.noSpend.includes(date)) { S.noSpend.push(date); commit(); }
    },
    replace(data) {                  // swap the logged data; settings only change if the data carries them
      S.onboarded = true; S.resetAt = Date.now(); S.deleted = []; S.expenses = data.expenses || []; S.noSpend = data.noSpend || [];
      if (data.settings) { S.settings = data.settings; S.settingsAt = Date.now(); BT.config.apply(S.settings); }
      commit();
    },
    saveSettings(s) { S.settings = s; S.settingsAt = Date.now(); BT.config.apply(s); commit(); },
    needsSetup: () => !S.onboarded && !S.settings && !S.expenses.length && !S.noSpend.length,
    finishSetup(s) { S.onboarded = true; S.settings = s; BT.config.apply(s); commit(); },
    mergeRemote(r) {                 // combine data pulled from the cloud with this device's data
      const lr = S.resetAt || 0, rr = r.resetAt || 0;
      if (rr > lr) { S.expenses = r.expenses || []; S.noSpend = r.noSpend || []; S.deleted = r.deleted || []; S.resetAt = rr; }
      else if (rr === lr) {          // same history: union, minus anything deleted on either side
        const gone = new Set((S.deleted || []).concat(r.deleted || [])), byId = new Map();
        S.expenses.concat(r.expenses || []).forEach(e => { const old = byId.get(e.id); if (!gone.has(e.id) && (!old || (e.u || 0) >= (old.u || 0))) byId.set(e.id, e); });
        S.expenses = Array.from(byId.values()); S.deleted = Array.from(gone).slice(-2000);
        const days = new Set(S.expenses.map(e => e.date));
        S.noSpend = Array.from(new Set(S.noSpend.concat(r.noSpend || []))).filter(d => !days.has(d));
      }                              // else this device reset more recently: keep local
      if ((r.settingsAt || 0) > (S.settingsAt || 0) && r.settings) { S.settings = r.settings; S.settingsAt = r.settingsAt; BT.config.apply(r.settings); }
      S.onboarded = true; commit();
    },
    snapshot: () => ({ app: 'budget-tracker', version: 1, exportedAt: new Date().toISOString(), settings: S.settings, expenses: S.expenses, noSpend: S.noSpend, deleted: S.deleted, settingsAt: S.settingsAt, resetAt: S.resetAt }),
    isEmpty: () => !S.expenses.length && !S.noSpend.length,
    on: d => S.expenses.filter(e => e.date === d),
    between: (a, b) => S.expenses.filter(e => e.date >= a && e.date <= b),
    total: (a, b) => Store.between(a, b).reduce((sum, e) => sum + e.amount, 0),
    isLogged: d => S.noSpend.includes(d) || S.expenses.some(e => e.date === d),
    loggedCount(a, b) {
      let n = 0;
      for (let d = a; d <= b; d = addDays(d, 1)) if (Store.isLogged(d)) n++;
      return n;
    },
    streak() {                       // consecutive logged days; today may still be open
      let d = today(), n = 0;
      if (!Store.isLogged(d)) d = addDays(d, -1);
      while (Store.isLogged(d) && n < 3650) { n++; d = addDays(d, -1); }
      return n;
    }
  };
})(window.BT);
