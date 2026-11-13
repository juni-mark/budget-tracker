/* Tiny SVG chart helpers (no libraries). */
(function (BT) {
  'use strict';
  BT.charts = {
    // cum: cumulative spend per elapsed day; total: budget for the whole span; span: number of days in the span
    trend(cum, total, span, label) {
      const W = 342, H = 72, P = 4, max = Math.max(total, cum[cum.length - 1] || 0, 1);
      const X = i => span > 1 ? (i / (span - 1)) * W : 0, Y = v => H - P - (v / max) * (H - 2 * P);
      const pts = cum.map((v, i) => X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ');
      const last = cum.length - 1;
      return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;margin-top:6px" role="img" aria-label="' + BT.utils.esc(label || 'Line chart of cumulative spending against the budget pace') + '">' +
        '<line x1="0" y1="' + Y(0) + '" x2="' + W + '" y2="' + Y(total) + '" stroke="#778DA9" stroke-width="2" stroke-dasharray="5 5"/>' +
        (last >= 0 ? '<polyline points="' + pts + '" fill="none" stroke="#0D1B2A" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' +
          '<circle cx="' + X(last) + '" cy="' + Y(cum[last]) + '" r="4" fill="#0D1B2A"/>' : '') + '</svg>';
    }
  };
})(window.BT);
