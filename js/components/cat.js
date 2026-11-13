/* The wandering cat: picks its own behaviour (walk / sit / nap), naps until today is logged,
   hops when you log, and floats a heart when tapped. */
(function (BT) {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SVG = '<svg viewBox="0 0 40 32" fill="currentColor" aria-hidden="true">' +
    '<path class="tail" d="M7 19C0 16 1 7 7 8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
    '<rect class="leg a" x="10" y="23" width="3" height="8" rx="1.5"/><rect class="leg b" x="15" y="23" width="3" height="8" rx="1.5"/>' +
    '<rect class="leg b" x="23" y="23" width="3" height="8" rx="1.5"/><rect class="leg a" x="28" y="23" width="3" height="8" rx="1.5"/>' +
    '<ellipse cx="18" cy="19" rx="11" ry="7"/><circle cx="31" cy="14" r="6.5"/>' +
    '<polygon points="26,10 27,3 31,8"/><polygon points="32,8 36,3 37,10"/><circle class="eye" cx="33.5" cy="13.5" r="1.2"/></svg>';
  let el, hopper, stage, x = 40, timer, logged = false, running = false;

  const setState = s => { el.dataset.state = s; };
  const later = (fn, ms) => { clearTimeout(timer); timer = setTimeout(fn, ms); };
  const hop = () => { hopper.classList.remove('hop'); void hopper.offsetWidth; hopper.classList.add('hop'); };

  function walk() {
    const max = Math.max(stage.clientWidth - 40, 60), target = Math.random() * max, dist = Math.abs(target - x);
    if (dist < 30) return sit();
    el.style.setProperty('--dir', target > x ? 1 : -1);
    el.style.transitionDuration = dist / 35 + 's';
    el.style.transform = 'translateX(' + target + 'px)';
    x = target; setState('walk'); later(next, (dist / 35) * 1000 + 200);
  }
  function sit() { setState('sit'); later(next, 2000 + Math.random() * 3000); }
  function nap() { setState('nap'); later(next, 5000 + Math.random() * 3000); }
  function next() {
    if (!running) return;
    if (reduce) return setState(logged ? 'sit' : 'nap');
    const r = Math.random();
    if (!logged && r < 0.45) nap(); else if (r < 0.8) walk(); else sit();
  }

  BT.cat = {
    svg: size => SVG.replace('<svg ', '<svg width="' + size + '" height="' + Math.round(size * 0.8) + '" '),
    init() {
      el = BT.utils.$('#cat'); hopper = BT.utils.$('.hopper', el); stage = el.parentElement;
      hopper.innerHTML = SVG;
      el.addEventListener('click', () => {
        const h = document.createElement('span');
        h.className = 'heart'; h.textContent = '\u2764\uFE0F'; el.appendChild(h);
        setTimeout(() => h.remove(), 1000); hop();
        if (el.dataset.state === 'nap') { setState('sit'); later(next, 1500); }
      });
    },
    start() { running = true; later(next, 300); },
    stop() { running = false; clearTimeout(timer); },
    setLogged(v) { logged = v; },
    react() { if (!running) return; setState('sit'); hop(); later(next, 1200); }
  };
})(window.BT);
