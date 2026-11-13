/* Settings sheet (gear icon on Stats): currency, daily goal, categories and budgets, backup and restore. */
(function (BT) {
  'use strict';
  const U = BT.utils, S = BT.store, C = BT.config, { $, fmt, esc } = U;
  let cfg;                           // working copy of the settings being edited
  let removing = null;               // index of the category whose remove panel is open

  const load = () => { cfg = { currency: C.currency, dailyGoal: C.dailyGoal, categories: C.categories.map(c => Object.assign({}, c)) }; };
  const save = () => S.saveSettings(cfg);
  const total = () => cfg.categories.filter(c => !c.hidden).reduce((sum, c) => sum + (+c.budget || 0), 0);
  const say = text => { $('#setMsg').textContent = text; };

  function syncSection() {           // only shown when Supabase keys are set in config.js
    if (!BT.sync.enabled()) return '';
    const head = '<section class="set"><div class="cap">Sync across devices</div>';
    if (BT.sync.signedIn()) return head + '<p class="sub">Signed in as <b>' + esc(BT.sync.email()) + '</b>. Changes sync automatically when you are online.</p>' +
      '<p class="sub" id="syMsg" role="status" aria-live="polite">' + esc(BT.sync.statusText()) + '</p>' +
      '<div class="actions"><button class="pill" id="syNow">Sync now</button><button class="pill" id="syOut">Sign out</button></div></section>';
    return head + '<p class="sub">Sign in to keep your data the same on every device. It is saved in your own private account.</p>' +
      '<label class="field"><span>Email</span><input id="syEmail" type="email" autocomplete="email"></label>' +
      '<label class="field"><span>Password</span><input id="syPass" type="password" autocomplete="current-password" minlength="6"></label>' +
      '<div class="actions"><button class="pill" id="syIn">Sign in</button><button class="pill" id="syUp">Create account</button></div>' +
      '<p class="sub" id="syMsg" role="status" aria-live="polite"></p></section>';
  }

  async function account(create) {
    const email = $('#syEmail').value.trim(), pw = $('#syPass').value, msg = text => { $('#syMsg').textContent = text; };
    if (!email || pw.length < 6) return msg('Enter your email and a password of at least 6 characters.');
    msg(create ? 'Creating account...' : 'Signing in...');
    try {
      const r = create ? await BT.sync.signUp(email, pw) : await BT.sync.signIn(email, pw);
      if (r && r.needsConfirm) msg('Check your email to confirm your account, then sign in.'); else render();
    } catch (e) { msg(e.message); }
  }

  function removeBox(c) {            // inline panel: choose where existing expenses go, then remove
    const n = S.countCat(c.id), others = cfg.categories.filter(x => x.id !== c.id);
    return '<div class="rmbox"><p class="sub">' + (n ? n + ' expense' + (n > 1 ? 's use' : ' uses') + ' "' + esc(c.name) + '". Move ' + (n > 1 ? 'them' : 'it') + ' to:' : 'No expenses use "' + esc(c.name) + '".') + '</p>' +
      (n ? '<select id="rmTo" aria-label="Move expenses to">' + others.map(x => '<option value="' + x.id + '">' + esc(x.name) + '</option>').join('') + '</select>' : '') +
      '<div class="actions"><button class="pill" id="rmGo">' + (n ? 'Move and remove' : 'Remove') + '</button><button class="pill" id="rmCancel">Cancel</button></div>' +
      '<p class="sub">Tip: untick Show on Log to hide a category but keep its history.</p></div>';
  }

  function render() {
    const opts = C.currencies.map(([sym, label]) => '<option value="' + sym + '"' + (sym === cfg.currency ? ' selected' : '') + '>' + sym + '  ' + label + '</option>').join('');
    const rows = cfg.categories.map((c, i) =>
      '<div class="crow" data-i="' + i + '"><input type="text" class="nm" value="' + esc(c.name) + '" maxlength="24" aria-label="Category name">' +
      '<input type="number" class="bd" inputmode="numeric" min="0" value="' + (+c.budget || 0) + '" aria-label="Monthly budget for ' + esc(c.name) + '">' +
      '<div class="opts"><label><input type="checkbox" class="fx"' + (c.fixed ? ' checked' : '') + '> Fixed cost</label>' +
      '<label><input type="checkbox" class="sh"' + (c.hidden ? '' : ' checked') + '> Show on Log</label>' +
      '<button class="rm" data-rm="' + i + '" aria-label="Remove ' + esc(c.name) + '">Remove</button></div>' + (removing === i ? removeBox(c) : '') + '</div>').join('');
    const syncHtml = syncSection();
    const tip = BT.pwa.standalone() ? '' : BT.pwa.canInstall() ? '<button class="pill" id="installBtn">Install app</button>'
      : BT.pwa.ios() ? '<p class="sub">To install on iPhone: tap the Share button, then Add to Home Screen.</p>' : '';
    const install = tip ? '<section class="set"><div class="cap">Install</div><div class="actions">' + tip + '</div></section>' : '';
    $('#settings .sheet').innerHTML =
      '<div class="grab"></div><div class="sheet-head"><h2>Settings</h2><button class="icon" id="setDone">Done</button></div>' +
      '<section class="set"><div class="cap">General</div>' +
      '<label class="field"><span>Currency</span><select id="setCur">' + opts + '</select></label>' +
      '<label class="field"><span>Daily goal</span><input id="setGoal" type="number" inputmode="numeric" min="1" value="' + cfg.dailyGoal + '"></label></section>' +
      '<section class="set"><div class="cap">Categories and monthly budgets</div>' + rows +
      '<p class="sub">Monthly budget total: <b id="setTotal">' + fmt(total()) + '</b>. Fixed costs (like rent) show their amount instead of a variance.</p>' +
      '<div class="actions"><button class="pill" id="addCat">Add category</button><button class="pill" id="resetCats">Restore defaults</button></div></section>' +
      syncHtml + install + '<section class="set"><div class="cap">Your data</div><div class="actions">' +
      '<button class="pill" id="expJson">Export backup</button><button class="pill" id="expCsv">Export CSV</button><button class="pill" id="impBtn">Import backup</button></div>' +
      '<input type="file" id="setFile" accept=".json,application/json" hidden>' +
      '<p class="sub">Your data is stored on this device only. Export a backup now and then, especially before clearing your browser or changing phones.</p>' +
      '<button class="link" id="wipe">Delete all expenses</button><p class="sub" id="setMsg" role="status" aria-live="polite"></p></section>';
  }

  async function importFile(file) {
    if (!file) return;
    if (file.size > 5e6) return say('That file is too large.');
    try {
      const res = BT.backup.parse(await BT.backup.readFile(file));
      if (res.error) return say(res.error);
      if (!confirm('Replace everything on this device with this backup (' + res.data.expenses.length + ' expenses)?')) return;
      S.replace(res.data); load(); render(); say('Backup restored: ' + res.data.expenses.length + ' expenses.');
    } catch (e) { say('Could not read that file.'); }
    finally { $('#setFile').value = ''; }
  }

  function onChange(e) {
    const t = e.target, row = t.closest('.crow'), c = row && cfg.categories[+row.dataset.i];
    if (t.id === 'setFile') return importFile(t.files[0]);
    if (t.id === 'setCur') cfg.currency = t.value;
    else if (t.id === 'setGoal') { const v = parseInt(t.value, 10); if (v > 0) cfg.dailyGoal = v; else t.value = cfg.dailyGoal; }
    else if (c && t.classList.contains('nm')) { const v = t.value.trim(); if (v) c.name = v; else t.value = c.name; }
    else if (c && t.classList.contains('bd')) c.budget = Math.max(0, parseInt(t.value, 10) || 0);
    else if (c && t.classList.contains('fx')) c.fixed = t.checked;
    else if (c && t.classList.contains('sh')) {
      if (!t.checked && cfg.categories.filter(x => !x.hidden).length < 2) { t.checked = true; return say('Keep at least one category visible.'); }
      c.hidden = !t.checked;
    } else return;
    save(); $('#setTotal').textContent = fmt(total());
  }

  function onClick(e) {
    const t = e.target;
    if (t.classList.contains('scrim') || t.closest('#setDone')) return close();
    const rm = t.closest('.rm');
    if (rm) {
      const i = +rm.dataset.rm, c = cfg.categories[i];
      if (cfg.categories.length < 2 || (!c.hidden && cfg.categories.filter(x => !x.hidden).length < 2)) return say('Keep at least one category visible.');
      removing = removing === i ? null : i; render(); const go = $('#rmGo'); if (go) go.focus(); return;
    }
    if (t.closest('#rmCancel')) { removing = null; render(); return; }
    if (t.closest('#rmGo')) {
      const c = cfg.categories[removing], n = S.countCat(c.id), to = n ? $('#rmTo').value : '';
      if (n) S.reassign(c.id, to);
      cfg.categories.splice(removing, 1); removing = null; save(); render();
      return say(n ? 'Removed. ' + n + ' expense' + (n > 1 ? 's were' : ' was') + ' moved to ' + C.name(to) + '.' : 'Category removed.');
    }
    if (t.closest('#addCat')) {
      cfg.categories.push({ id: 'c' + Date.now().toString(36), name: 'New category', budget: 0 }); save(); render();
      const names = U.$$('#settings .nm'), last = names[names.length - 1]; last.focus(); last.select(); return;
    }
    if (t.closest('#resetCats')) {
      if (!confirm('Restore the default categories and budgets? Categories you added are kept.')) return;
      C.defaults.categories.forEach(d => { const i = cfg.categories.findIndex(c => c.id === d.id); if (i >= 0) cfg.categories[i] = Object.assign({}, d); else cfg.categories.push(Object.assign({}, d)); });
      save(); render(); return say('Default categories restored.');
    }
    if (t.closest('#expJson')) return say(BT.backup.exportJson() + ' expenses saved to a backup file.');
    if (t.closest('#expCsv')) return say(BT.backup.exportCsv() + ' expenses saved to a CSV file.');
    if (t.closest('#syIn') || t.closest('#syUp')) return account(!!t.closest('#syUp'));
    if (t.closest('#syNow')) return BT.sync.now();
    if (t.closest('#syOut')) { BT.sync.signOut(); render(); return; }
    if (t.closest('#impBtn')) return $('#setFile').click();
    if (t.closest('#installBtn')) return BT.pwa.install().then(render);
    if (t.closest('#wipe') && confirm('Delete all expenses and no-spend days? If sync is on, they are deleted on your other devices too. Export a backup first if you want to keep them.')) { S.replace({}); say('All expenses deleted.'); }
  }

  function open() { removing = null; load(); render(); BT.a11y.open($('#settings'), $('#setDone')); }
  function close() { BT.a11y.close($('#settings')); }

  function init() {
    const layer = $('#settings');
    layer.addEventListener('click', onClick);
    layer.addEventListener('change', onChange);
    $('#settingsBtn').addEventListener('click', open);
    window.addEventListener('bt:sync', () => { const m = $('#syMsg'); if (m && BT.sync.signedIn()) m.textContent = BT.sync.statusText(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !layer.hidden) close(); });
  }

  BT.settings = { init, open, close };
})(window.BT);
