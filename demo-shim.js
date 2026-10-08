/* DieCast Ledger demo: lets the real pages run with no server. Loaded FIRST on every page.
   - fetch('/api/...') is answered here from data/demo.json (three sample cars); nothing is sent anywhere
   - links and image paths the pages build ("/car?row=71", "/img?...", "/sheet_img?id=...") are mapped to this static site
   - edits made on the car pages live in this browser tab only (sessionStorage); "Reset demo" clears them */
(function () {
  'use strict';
  const nativeFetch = window.fetch.bind(window);
  const KEY = 'dcl_demo_v1';
  let DATA = null;
  const loadSt = () => { try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const saveSt = s => { try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
  const ready = nativeFetch('data/demo.json').then(r => r.json()).then(d => { DATA = d; return d; });

  // ---------------------------------------------------------------- url mapping (same rules as tools/make_demo.py)
  function dm(u) {
    if (typeof u !== 'string' || u[0] !== '/' || u.startsWith('//')) return u;
    const i = u.indexOf('?'), p = i < 0 ? u : u.slice(0, i), q = i < 0 ? '' : u.slice(i + 1);
    if (['/', '/home', '/landing', '/logout', '/pin'].includes(p)) return 'index.html';
    if (p === '/dashboard') return 'capture.html';
    if (p === '/sheet' || p === '/garage') return 'sheet.html';
    if (p === '/car') return 'car.html' + (q ? '?' + q : '');
    if (p === '/admin') return 'admin.html';
    const prm = new URLSearchParams(q);
    if (p === '/img') return 'data/photos/' + (prm.get('f') || '');
    if (p === '/sheet_img') return 'data/photos/' + (prm.get('id') || '') + '.jpg';
    return p.slice(1);
  }
  const fixHtml = h => typeof h === 'string' ? h.replace(/\b(src|href)=(["'])(\/[^"'\/][^"']*|\/)\2/g, (m, a, q, u) => `${a}=${q}${dm(u)}${q}`) : h;
  // markup written by the pages' scripts (innerHTML, insertAdjacentHTML) and URLs they assign
  for (const [proto, prop] of [[Element.prototype, 'innerHTML']]) {
    const d = Object.getOwnPropertyDescriptor(proto, prop);
    Object.defineProperty(proto, prop, {get: d.get, set(v) { d.set.call(this, fixHtml(v)); }, configurable: true});
  }
  const iah = Element.prototype.insertAdjacentHTML;
  Element.prototype.insertAdjacentHTML = function (pos, h) { return iah.call(this, pos, fixHtml(h)); };
  for (const [proto, prop] of [[HTMLImageElement.prototype, 'src'], [HTMLAnchorElement.prototype, 'href']]) {
    const d = Object.getOwnPropertyDescriptor(proto, prop);
    Object.defineProperty(proto, prop, {get: d.get, set(v) { d.set.call(this, dm(v)); }, configurable: true});
  }
  const sa = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (n, v) { return sa.call(this, n, (n === 'src' || n === 'href') ? dm(v) : v); };

  // ---------------------------------------------------------------- helpers
  const clone = o => JSON.parse(JSON.stringify(o));
  const setPath = (o, p, v) => { const k = p.split('.'); let c = o; k.slice(0, -1).forEach(x => { c = c[x] = c[x] || {}; }); c[k[k.length - 1]] = v; };
  const getPath = (o, p) => p.split('.').reduce((c, k) => (c == null ? c : c[k]), o);
  const flatten = (o, pre = '') => Object.entries(o || {}).flatMap(([k, v]) => v && typeof v === 'object' ? flatten(v, pre + k + '.') : [[pre + k, v]]);
  const J = (o, ok = true) => new Response(JSON.stringify(ok === false ? o : Object.assign({ok: true}, o)), {status: 200, headers: {'Content-Type': 'application/json'}});
  const ERR = m => J({ok: false, error: m}, false);
  const DEMO_NOTE = 'This is the demo, so nothing was sent anywhere.';

  function car(row) {
    const base = DATA.cars[String(row)]; if (!base) return null;
    const c = clone(base), e = (loadSt().edits || {})[String(row)];
    if (e) {
      Object.assign(c.values, e.values || {});
      c.saved = c.saved || {}; c.saved.spec = c.saved.spec || {};
      flatten(e.spec).forEach(([p, v]) => setPath(c.saved.spec, p, v));
      c.pending = Array.from(new Set((e.applied ? [] : (c.pending || [])).concat((e.pend || []).map(p => p.split('.').pop()))));
      c.updated = e.at || '';
    }
    return c;
  }
  const kindOf = row => (DATA.kinds || {})[String(row)];

  // ---------------------------------------------------------------- the /api routes
  async function api(path, method, body) {
    await ready;
    const u = new URL(path, location.href), name = u.pathname.replace(/^.*\/api\//, ''), q = u.searchParams;
    const st = loadSt(); st.edits = st.edits || {};
    const row = String(body && body.row !== undefined ? body.row : q.get('row') || '');
    switch (name) {
      case 'sheet': {                                                // the Garage list, with edits from this tab applied
        const s = clone(DATA.sheet);
        s.rows.forEach(r => { const e = st.edits[String(r.row)]; if (e && e.values) Object.entries(e.values).forEach(([h, v]) => { const i = s.headers.indexOf(h); if (i >= 0) r.cells[i] = v; }); });
        return J(s);
      }
      case 'car': { const c = car(row); return c ? J(c) : ERR('This demo has three sample cars only.'); }
      case 'ebay_options': return J(DATA.options);
      case 'github_status': return J({signed_in: false, repo: 'diecast-ledger-photos', note: 'demo: sign-in works in the real app'});
      case 'admin_status': return J(adminStatus());
      case 'state': {
        const rs = st.research ? (Date.now() - st.research < 3500 ? 'Searching the Hot Wheels Wiki' : Date.now() - st.research < 7000 ? 'Asking Google Lens and eBay sold listings' : 'done') : 'done';
        return J({batch: {id: 'demo-box', cars: {'1': {research_state: rs}}, photos: []}, mode: 'box'});
      }
      case 'open_batch': return J({});
      case 'auto_research': st.research = Date.now(); saveSt(st); return J({});
      case 'rotate_photo': return ERR('Photos cannot be turned in the demo: the real app does it on the dashboard PC.');
      case 'suggest_title': {
        const c = car(row); if (!c) return ERR('No such sample car');
        const v = c.values, ser = /mainline|basic/i.test(v.Series || '') || (v.Model || '').toLowerCase().includes((v.Series || '~').toLowerCase()) ? '' : v.Series;
        return J({title: [v.Brand || 'Hot Wheels', v.Year, ser, v.Model].filter(Boolean).join(' ').slice(0, 80), kind: 'car', notes: [], from: {Brand: v.Brand, Year: v.Year, Series: v.Series, Model: v.Model}});
      }
      case 'car_save': {
        const c = car(row); if (!c) return ERR('No such sample car');
        const e = st.edits[row] = st.edits[row] || {values: {}, spec: {}, pend: []};
        const sheet = body.sheet || {}, listing = body.listing || {};
        for (const h of Object.keys(sheet)) if (!(c.editable || []).includes(h)) return ERR(`'${h}' cannot be edited here.`);
        if (body.dry_run) return J({changes: Object.keys(sheet), spec_changes: flatten(listing).map(x => x[0]), dry_run: true});
        Object.assign(e.values, sheet);
        const base = DATA.cars[row].saved && DATA.cars[row].saved.spec || {};
        flatten(listing).forEach(([p, v]) => { setPath(e.spec, p, v); if (String(getPath(base, p) ?? '') !== String(v ?? '') && !e.pend.includes(p)) e.pend.push(p); });
        e.at = new Date().toISOString().slice(0, 16).replace('T', ' ');
        saveSt(st);
        return J({changes: Object.keys(sheet), spec_changes: flatten(listing).map(x => x[0])});
      }
      case 'read_ebay': {
        const c = car(row); if (!c || !/^\d{12}$/.test(c.values['Listing Number'] || '')) return ERR('Only the listed sample car has a live eBay listing to read.');
        return J({title: c.values['eBay Title'], fields: 14});
      }
      case 'end_preview': {
        const c = car(row); if (!c || !/^\d{12}$/.test(c.values['Listing Number'] || '')) return ERR('This row has no 12-digit eBay Listing Number, so there is nothing to end.');
        return J({live: {title: c.values['eBay Title'], price: '$' + String(c.values['eBay-List Price'] || '').replace('$', '')}, item: c.values['Listing Number'], row: +row, item_id: c.values['Item ID'], model: c.values.Model});
      }
      case 'end_listing': {
        const e = st.edits[row] = st.edits[row] || {values: {}, spec: {}, pend: []};
        e.values['eBay Status'] = 'Inactive (ended Oct 7, 2026 - demo only)'; saveSt(st);
        return J({status: e.values['eBay Status']});
      }
      case 'apply_preview': {
        const c = car(row); if (!c) return ERR('No such sample car');
        const base = DATA.cars[row].saved && DATA.cars[row].saved.spec || {}, spec = c.saved.spec || {};
        const ee = st.edits[row] || {};
        const keys = Array.from(new Set((ee.pend || []).concat(ee.applied ? [] : (DATA.cars[row].pending || []).filter(k => k in spec))));
        if ((c.pending || []).includes('title') && !keys.includes('title')) keys.push('title');
        if (!keys.length) return ERR('Nothing to change: this listing already matches. (Edit a field and Save first.)');
        return J({plan: keys.map(k => ({key: k, was: String(getPath(base, k) ?? ''), wanted: getPath(spec, k) ?? '', ok: true})), unsupported: [],
                  live: {title: c.values['eBay Title'], price: String(c.values['eBay-List Price'] || '').replace('$', '')}, item: c.values['Listing Number'], plan_id: 'demo'});
      }
      case 'apply_to_ebay': {
        const c = car(row); const e = st.edits[row] = st.edits[row] || {values: {}, spec: {}, pend: []}; e.pend = []; e.applied = true; saveSt(st);
        return J({now_title: (c && c.values['eBay Title'] || '') + '  [demo: nothing was really sent]'});
      }
      case 'export_listing': {                                       // the draft file, built here from the sample car (photos are never hosted in the demo)
        const c = car(row); if (!c) return ERR('No such sample car');
        const v = c.values, sp = (c.saved && c.saved.spec) || {}, q = s => '"' + String(s).replace(/"/g, '""') + '"';
        const title = String(sp.title || v['eBay Title'] || ''), price = String(sp.price || v['eBay-List Price'] || '').replace(/[^0-9.]/g, '');
        if (!title) return ERR('This car has no title yet: use Suggest a title (or fill it in) first.');
        if (title.length > 80) return ERR('The title is ' + title.length + ' characters; eBay allows 80. Shorten it first.');
        if (!price) return ERR('This car has no price yet: set the Item price first.');
        const used = String(sp.ebay_condition || (/^loose/i.test(v.Condition || '') ? 'Used' : 'New')).toLowerCase() === 'used';
        const upc = String(sp.upc || v['UPC/Barcode'] || '').replace(/\s+/g, ''), okUpc = /^\d{8,14}$/.test(upc) ? upc : '';
        const esc2 = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const desc = String(sp.desc_text || v.Notes || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean).map(p => '<p>' + esc2(p) + '</p>').join('');
        const head = ['#INFO,Version=0.0.2,Template= eBay-draft-listings-template_US,,,,,,,,', '#INFO Action and Category ID are required fields. 1) Set Action to Draft,,,,,,,,,,', '#INFO,,,,,,,,,,'];
        const S = {Brand: v.Brand || 'Hot Wheels', Scale: v.Scale || '1:64', 'Vehicle Year': v.Year, Series: v.Series, 'Year of Manufacture': v.Year, Material: 'Diecast', Color: v.Color, Model: v.Model, MPN: v['Toy Number'], 'Country of Origin': v.Country};
        const hdr = 'Action(SiteID=US|Country=US|Currency=USD|Version=1193|CC=UTF-8),Custom label (SKU),Category ID,Title,UPC,Price,Quantity,Item photo URL,Condition ID,Description,Format,' + Object.keys(S).map(k => 'C:' + k).join(',');
        const rowv = ['Draft', v['Item ID'], '180506', q(title), okUpc, Number(price).toFixed(2), '1', '', used ? 'USED' : 'NEW', q(desc), 'FixedPrice'].concat(Object.values(S).map(x => q(x || ''))).join(',');
        return J({csv: head.concat([hdr, rowv]).join('\r\n') + '\r\n', filename: 'eBay-draft-' + v['Item ID'] + '.csv', item: v['Item ID'], title, price: Number(price).toFixed(2), upc: okUpc, photo_urls: [], hosted: false,
                  notes: ['Demo: photo links are left blank (hosting photos works in the real app).', 'Item specifics are included (check them in the draft).', 'Shipping, offers and returns are not in the file: set them in the draft.']});
      }
      case 'check_ebay': return J({checked: 1, active: 1, ended: [], sold: [], unknown: [], titles_saved: 1, titles_filled: 0});
      case 'apply_inactive': return J({done: [], skipped: []});
      case 'ebay_login': case 'admin_backup': case 'admin_restart': case 'admin_recheck':
        return ERR('This button works in the real app on the dashboard PC. ' + DEMO_NOTE);
      default: return ERR('This step needs the real app (' + name + '). ' + DEMO_NOTE);
    }
  }
  function adminStatus() {
    const now = new Date();
    return {names: {db: 'Garage', app: 'DieCast Ledger'}, build: 'demo', pid: 0, uptime: 7380, started: now.toISOString().slice(0, 10) + ' 08:00', supervised: true, restarts: 0, last_restart: '',
      network: {enabled: true, url: 'http://192.168.1.20:8765 (demo)', devices: [{ip: '192.168.1.50', device: 'iPad (demo)', ago: 4}]}, usb: {connected: true, model: 'Pixel 7 (demo)', note: ''},
      chrome: {ok: true, msg: 'running (demo)'}, ebay: {ok: true, msg: 'the last eBay step worked (demo)'}, google: {ok: true, msg: 'Sheets and Drive answered (demo)'},
      work: {busy: '', builds: 0, research: 0, sheet: 0, batch: 'demo-box'}, backup: {running: false, step: '', lines: [], elapsed: 0},
      last_backup: {ok: true, when: now.toISOString().slice(0, 10) + ' 07:30', folder: 'demo backup folder', note: 'sample'}, backup_dir: 'E:\\Backups (demo)',
      disk: {'This PC': {free_gb: 240, total_gb: 500}, 'Backup drive': {free_gb: 932, total_gb: 1024}}, problems: [],
      log: ['Demo mode: this page shows sample status only.', 'Photographed 3 cars today, 2 eBay drafts built.', 'Research: wiki and sold titles checked.']};
  }

  // fetch: /api/... answered here; other absolute paths mapped to this site
  window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    if (/^\/api\//.test(url)) {
      let body = null; try { body = init && init.body ? JSON.parse(init.body) : null; } catch (e) {}
      return api(url, (init && init.method) || 'GET', body);
    }
    return nativeFetch(typeof input === 'string' ? dm(input) : input, init);
  };

  // ---------------------------------------------------------------- the demo bar
  document.addEventListener('DOMContentLoaded', () => {
    const bar = document.createElement('div');
    bar.id = 'demoBar';
    bar.style.cssText = 'background:#1f6feb;color:#fff;padding:8px 14px;font:14px/1.35 "Segoe UI",system-ui,sans-serif;display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:center;text-align:center';
    bar.innerHTML = '<b>DEMO</b> <span>Sample cars only. Nothing is sent to eBay or saved anywhere except this browser tab.</span> ' +
      '<a href="index.html" style="color:#fff">Home</a> <a href="sheet.html" style="color:#fff">Garage</a> ' +
      '<button id="demoReset" style="font:inherit;font-size:13px;padding:2px 10px;border-radius:6px;border:1px solid #fff;background:transparent;color:#fff;cursor:pointer">Reset demo</button>';
    document.body.insertBefore(bar, document.body.firstChild);
    document.getElementById('demoReset').onclick = () => { try { sessionStorage.removeItem(KEY); } catch (e) {} location.reload(); };
  });
})();
