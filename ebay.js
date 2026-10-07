/* Touch-friendly replacement for the browser's <datalist> suggestion list (iPad Safari only offers matches for what is already typed, so a filled-in box shows
   almost nothing). Any <input list="id"> gets a tap-to-open panel with eBay's full list; typing narrows it. Values are set through normal input/change events,
   so the pages' own handlers run as before. Shared by the review screen (index.html) and the car page (car.html). */
(function () {
  let pop = null, cur = null, items = [], hi = -1, typed = false;
  const MAX = 400;
  const norm = s => String(s || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '');

  function ensurePop(host) {
    if (!pop) { pop = document.createElement('div'); pop.className = 'eb-pop'; pop.hidden = true; }
    if (pop.parentNode !== host) host.appendChild(pop);          // inside an open dialog, or it would sit behind it
    return pop;
  }
  function place() {
    if (!cur || !pop || pop.hidden) return;
    const r = cur.getBoundingClientRect(), vh = window.innerHeight, below = vh - r.bottom, above = r.top;
    const up = below < 180 && above > below, h = Math.min(Math.max(up ? above : below, 120) - 12, Math.round(vh * 0.45));
    pop.style.left = Math.max(4, Math.min(r.left, window.innerWidth - Math.min(r.width, window.innerWidth - 8) - 4)) + 'px';
    pop.style.width = Math.min(Math.max(r.width, 200), window.innerWidth - 8) + 'px';
    pop.style.maxHeight = h + 'px';
    pop.style.top = up ? '' : (r.bottom + 2) + 'px';
    pop.style.bottom = up ? (vh - r.top + 2) + 'px' : '';
  }
  function optionsOf(inp) {
    const dl = inp._ebList || document.getElementById(inp.getAttribute('data-ebl') || '');
    return dl ? [...dl.options].map(o => o.value) : [];
  }
  function draw() {
    if (!cur) return;
    const all = optionsOf(cur), q = norm(cur.value);
    let list = typed && q ? all.filter(o => norm(o).includes(q)) : all;
    const more = list.length > MAX; list = list.slice(0, MAX); items = list;
    hi = typed ? (list.length ? 0 : -1) : list.findIndex(o => o === cur.value);
    pop.innerHTML = list.length
      ? list.map((o, i) => `<div class="eb-opt${i === hi ? ' on' : ''}" data-i="${i}">${o.replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]))}</div>`).join('') + (more ? '<div class="eb-opt-note">Type to narrow the list</div>' : '')
      : '<div class="eb-opt-note">Not on eBay\'s list: what you typed will be added as a custom value.</div>';
    pop.hidden = false; place();
    const on = pop.querySelector('.eb-opt.on'); if (on) pop.scrollTop = Math.max(0, on.offsetTop - 60);
  }
  function open(inp) {
    cur = inp; typed = false; ensurePop(inp.closest('dialog[open]') || document.body); draw();
  }
  function close() { if (pop) pop.hidden = true; cur = null; }
  function pick(v) {
    const inp = cur; if (!inp) return; close();
    inp.value = v;
    inp.dispatchEvent(new Event('input', {bubbles: true})); inp.dispatchEvent(new Event('change', {bubbles: true}));
  }

  function enhance(inp) {
    const id = inp.getAttribute('list'); if (!id) return;
    const dl = document.getElementById(id); if (!dl) return;
    inp.setAttribute('data-ebl', id); inp._ebList = dl; inp.removeAttribute('list'); inp.setAttribute('data-ebc', '1');
    inp.setAttribute('autocomplete', 'off'); inp.setAttribute('autocapitalize', 'off'); inp.setAttribute('autocorrect', 'off');
    inp.addEventListener('focus', () => open(inp));
    inp.addEventListener('click', () => { if (cur !== inp || !pop || pop.hidden) open(inp); });
    inp.addEventListener('input', () => { if (cur === inp) { typed = true; draw(); } });
    inp.addEventListener('blur', () => setTimeout(() => { if (cur === inp) close(); }, 150));
    inp.addEventListener('keydown', e => {
      if (cur !== inp || !pop || pop.hidden) { if (e.key === 'ArrowDown') open(inp); return; }
      if (e.key === 'Escape') { close(); }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); if (!items.length) return;
        hi = e.key === 'ArrowDown' ? Math.min(items.length - 1, hi + 1) : Math.max(0, hi - 1);
        pop.querySelectorAll('.eb-opt').forEach((x, i) => x.classList.toggle('on', i === hi));
        const on = pop.querySelector('.eb-opt.on'); if (on) on.scrollIntoView({block: 'nearest'});
      } else if (e.key === 'Enter' && hi >= 0 && typed && items[hi]) { e.preventDefault(); pick(items[hi]); }
    });
  }
  function scan(root) { (root || document).querySelectorAll('input[list]').forEach(enhance); }

  // choose with a tap/click; pointerdown (not click) so the input keeps focus and the list does not vanish first
  document.addEventListener('pointerdown', e => {
    const o = e.target.closest && e.target.closest('.eb-opt');
    if (o && pop && pop.contains(o)) { e.preventDefault(); pick(items[+o.dataset.i]); return; }
    if (pop && !pop.hidden && !(e.target.closest && e.target.closest('.eb-pop')) && e.target !== cur) close();
  }, true);
  window.addEventListener('resize', place);
  document.addEventListener('scroll', place, true);
  new MutationObserver(() => scan()).observe(document.documentElement, {childList: true, subtree: true});
  if (document.readyState !== 'loading') scan(); else document.addEventListener('DOMContentLoaded', () => scan());
})();
