/* Bottom tab bar: switches between Log and Stats, and opens Wrapped as a full-screen story. */
(function (BT) {
  'use strict';
  const { $, $$ } = BT.utils;

  function show(name) {
    if (name === 'wrapped') return BT.wrapped.open();
    $$('.screen').forEach(s => s.classList.toggle('on', s.id === 'screen-' + name));
    $$('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
    $('#dock').hidden = name !== 'log';
    if (name === 'log') BT.cat.start(); else BT.cat.stop();
    if (name === 'stats') BT.stats.render();
    $('main').scrollTop = 0;
  }

  BT.tabs = {
    init() {
      $('#tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) show(b.dataset.tab); });
      show('log');
    },
    show
  };
})(window.BT);
