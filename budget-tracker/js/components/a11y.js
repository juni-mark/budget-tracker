/* Dialog accessibility: while a sheet or full-screen layer is open, the page behind it is made inert
   (no tabbing into it, hidden from screen readers) and focus returns to the button that opened it. */
(function (BT) {
  'use strict';
  const from = new Map();
  const page = () => BT.utils.$('.app');

  BT.a11y = {
    open(layer, focusEl) {
      from.set(layer, document.activeElement);
      layer.hidden = false; page().inert = true;
      if (focusEl) focusEl.focus();
    },
    close(layer) {
      if (layer.hidden) return;
      layer.hidden = true; page().inert = false;
      const back = from.get(layer); from.delete(layer);
      if (back && document.contains(back)) back.focus();
    }
  };
})(window.BT);
