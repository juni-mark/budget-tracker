/* First-time setup: welcome, currency and daily goal, then which categories to show.
   Only appears for brand-new users (no data, no saved settings). */
(function (BT) {
  'use strict';
  const U = BT.utils, S = BT.store, C = BT.config, { $, esc } = U;
  const st = { step: 0, currency: C.currency, goal: C.dailyGoal, on: new Set(C.defaults.categories.map(c => c.id)) };
  const layer = () => $('#onboard');

  function body() {
    if (st.step === 0) return '<h1 id="obTitle">Welcome</h1><p class="lead">Log what you spend in a few taps, see where your money goes, and keep a daily streak.</p>' +
      '<div class="note"><b>Private by design.</b> Everything is saved on this device only. There is no account and nothing is uploaded.</div>';
    if (st.step === 1) return '<h1 id="obTitle">Your basics</h1>' +
      '<label class="field"><span>Currency</span><select id="obCur">' + C.currencies.map(([s, n]) => '<option value="' + s + '"' + (s === st.currency ? ' selected' : '') + '>' + s + '  ' + n + '</option>').join('') + '</select></label>' +
      '<label class="field"><span>Daily spending goal</span><input id="obGoal" type="number" inputmode="numeric" min="1" value="' + st.goal + '"></label>' +
      '<p class="sub">You can change both any time in Settings (the gear icon on Stats).</p>';
    return '<h1 id="obTitle">Your categories</h1><p class="sub">Choose the ones you use. You can rename them, add your own and set budgets later in Settings.</p>' +
      '<div class="checks">' + C.defaults.categories.map(c => '<label class="check"><input type="checkbox" data-id="' + c.id + '"' + (st.on.has(c.id) ? ' checked' : '') + '> ' + esc(c.name) + '</label>').join('') + '</div>';
  }

  function render() {
    const last = st.step === 2;
    layer().innerHTML = '<div class="story-in"><div class="dots" aria-hidden="true">' + [0, 1, 2].map(i => '<i class="' + (i === st.step ? 'on' : '') + '"></i>').join('') + '</div>' +
      '<div class="ob-body">' + body() + '</div><div class="story-end">' +
      '<button class="btn" id="obNext"' + (last && !st.on.size ? ' disabled' : '') + '>' + (last ? 'Start tracking' : st.step ? 'Next' : 'Get started') + '</button>' +
      (last && !BT.sync.enabled() ? '<button class="link" id="obSample">Explore with sample data</button>' : '') + (!st.step && BT.sync.enabled() ? '<button class="link" id="obSignin">I already have an account</button>' : '') + (st.step ? '<button class="link" id="obBack">Back</button>' : '') + '</div></div>';
    const h = $('#obTitle'); h.tabIndex = -1; h.focus();      // announces each step to screen readers
  }

  function finish(sample) {
    S.finishSetup({ currency: st.currency, dailyGoal: st.goal, categories: C.defaults.categories.map(c => Object.assign({}, c, { hidden: !st.on.has(c.id) })) });
    if (sample) S.replace(BT.sample());
    BT.a11y.close(layer()); BT.tabs.show('log');
  }

  function init() {
    const el = layer();
    el.addEventListener('click', e => {
      if (e.target.closest('#obNext')) { if (st.step < 2) { st.step++; render(); } else finish(false); }
      else if (e.target.closest('#obBack')) { st.step--; render(); }
      else if (e.target.closest('#obSample')) finish(true);
      else if (e.target.closest('#obSignin')) { finish(false); BT.settings.open(); }
    });
    el.addEventListener('change', e => {
      const t = e.target;
      if (t.id === 'obCur') st.currency = t.value;
      else if (t.id === 'obGoal') { const v = parseInt(t.value, 10); if (v > 0) st.goal = v; else t.value = st.goal; }
      else if (t.dataset.id) { if (t.checked) st.on.add(t.dataset.id); else st.on.delete(t.dataset.id); $('#obNext').disabled = !st.on.size; }
    });
    if (S.needsSetup()) { render(); BT.a11y.open(el, $('#obTitle')); }
  }

  BT.onboarding = { init };
})(window.BT);
