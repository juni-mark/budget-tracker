/* Progressive web app support: registers the offline service worker and handles the install prompt. */
(function (BT) {
  'use strict';
  let deferred = null;
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; });
  window.addEventListener('appinstalled', () => { deferred = null; });
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {   // needs https (or localhost)
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  BT.pwa = {
    standalone,
    ios: () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !standalone(),
    canInstall: () => !!deferred,
    install() {
      if (!deferred) return Promise.resolve();
      deferred.prompt();
      return deferred.userChoice.then(() => { deferred = null; });
    }
  };
})(window.BT);
