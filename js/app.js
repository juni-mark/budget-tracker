/* Entry point: starts each module once the page is ready. */
(function (BT) {
  'use strict';
  function start() {
    BT.cat.init();
    BT.log.init();
    BT.stats.init();
    BT.daily.init();
    BT.wrapped.init();
    BT.settings.init();
    BT.sync.init();
    BT.tabs.init();
    BT.onboarding.init();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})(window.BT);
