/*
 * Tornillería Oriente · entorno local de la DEMO (DEMO — DATOS DE PRUEBA)
 *
 * El sistema fue hecho para correr dentro de Claude, que le da window.claude.use(...)
 * con una base de datos compartida. Este archivo ofrece esa misma interfaz en el
 * navegador para que el sistema funcione sin cambios fuera de Claude:
 *   db        base de datos local (localStorage) con doc(), collection(), where(), orderBy(),
 *             limit(), get(), set(), update() (fusión profunda), delete(), onSnapshot() y acquire()
 *   user      usuario de prueba (Administrador o Vendedor)
 *   downloads descargas normales del navegador
 *   mcp, sample no disponibles en la demo (devuelven null)
 *
 * Datos iniciales: data/demo-db.json. En la primera carga se corren todas las fechas
 * para que la fecha de referencia de la demo sea el día de hoy.
 * Restaurar: botón «Restaurar demo», o abrir index.html?restaurar=1
 */
(function () {
  'use strict';
  var STORE = 'tor_demo_db_v1', ROLE = 'tor_demo_rol', DAY = 864e5;
  var DATA_URL = 'data/demo-db.json';
  var qs = new URLSearchParams(location.search);
  if (qs.has('restaurar')) { try { localStorage.removeItem(STORE); } catch (e) {} qs.delete('restaurar'); history.replaceState(null, '', location.pathname + (qs.toString() ? '?' + qs : '') + location.hash); }
  if (qs.get('rol') === 'vendedor' || qs.get('rol') === 'admin') { try { localStorage.setItem(ROLE, qs.get('rol')); } catch (e) {} }
  var rol = 'admin'; try { rol = localStorage.getItem(ROLE) || 'admin'; } catch (e) {}

  /* ------------------------------------------------------------ utilidades */
  function clone(x) { return x == null ? x : JSON.parse(JSON.stringify(x)); }
  function isObj(x) { return x && typeof x === 'object' && !Array.isArray(x); }
  function merge(dst, src) {          // update(): fusiona mapas anidados; listas y valores se reemplazan
    Object.keys(src).forEach(function (k) {
      var v = src[k];
      if (v === undefined) return;
      if (isObj(v) && isObj(dst[k])) merge(dst[k], v); else dst[k] = clone(v);
    });
    return dst;
  }
  function addDays(key, n) { var d = new Date(key + 'T12:00:00'); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

  /* ------------------------------------------------------------ correr las fechas al día de hoy */
  function shiftDates(db, ref) {
    var a = new Date(ref + 'T12:00:00'), b = new Date(); b.setHours(12, 0, 0, 0);
    var n = Math.round((b - a) / DAY);
    if (!n) return db;
    var ms = n * DAY, C = db;
    var TS = ['t', 'at', 'registrada', 'anuladaAt', 'anuladoAt', 'saldoAt', 'creado', 'tasaAt', 'vence', 'vendidoAt', 'conciliadaAt'];
    function fix(o) {
      if (Array.isArray(o)) { o.forEach(fix); return; }
      if (!isObj(o)) return;
      Object.keys(o).forEach(function (k) {
        var v = o[k];
        if (typeof v === 'number' && TS.indexOf(k) > -1 && v > 1e12) o[k] = v + ms;
        else if (typeof v === 'string' && (k === 'dia' || k === 'fechaComp') && /^\d{4}-\d{2}-\d{2}$/.test(v)) o[k] = addDays(v, n);
        else if (isObj(v) || Array.isArray(v)) fix(v);
      });
    }
    ['config', 'catalogo', 'tasas', 'clientes', 'cuentas', 'proveedores', 'ventas', 'compras', 'gastos', 'abonos', 'movcta', 'presupuestos', 'traspasos', 'deudas', 'cambios'].forEach(function (c) { if (C[c]) fix(C[c]); });
    if (C.listas) Object.keys(C.listas).forEach(function (k) { if (C.listas[k].fecha) C.listas[k].fecha += ms; });
    if (C.cajas) { var nc = {}; Object.keys(C.cajas).forEach(function (k) { var c = C.cajas[k]; fix(c); nc[addDays(k, n)] = c; }); C.cajas = nc; }
    if (C.historial) {                // líneas [día, código, …] dentro de documentos por mes: se reubican
      var nh = {};
      Object.keys(C.historial).forEach(function (mk) {
        var doc = C.historial[mk];
        if (!/^\d{4}-\d{2}$/.test(mk)) { if (doc.lineas) doc.lineas.forEach(function (l) { if (l[0] > 1e12) l[0] += ms; }); nh[mk] = doc; return; }
        (doc.lineas || []).forEach(function (l) {
          var k2 = addDays(mk + '-' + String(l[0]).padStart(2, '0'), n), m2 = k2.slice(0, 7);
          var d2 = nh[m2] || (nh[m2] = { mes: m2, lineas: [], nombres: [], descs: {} });
          var nom = l[10] >= 0 ? (doc.nombres || [])[l[10]] : null, ni = -1;
          if (nom) { ni = d2.nombres.indexOf(nom); if (ni < 0) { d2.nombres.push(nom); ni = d2.nombres.length - 1; } }
          var l2 = l.slice(); l2[0] = +k2.slice(8, 10); l2[10] = ni; d2.lineas.push(l2);
        });
      });
      C.historial = nh;
    }
    return db;
  }

  /* ------------------------------------------------------------ almacenamiento */
  var DB = null, ready = null, listeners = [], saveTimer = null, warned = false;
  function persist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { localStorage.setItem(STORE, JSON.stringify({ meta: DB.meta, colecciones: DB.c })); }
      catch (e) { if (!warned) { warned = true; console.warn('Demo: no se pudo guardar en este navegador; los cambios duran hasta recargar.', e); } }
    }, 250);
  }
  function load() {
    if (ready) return ready;
    var saved = null; try { saved = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) {}
    if (saved && saved.colecciones) { DB = { meta: saved.meta || {}, c: saved.colecciones }; ready = Promise.resolve(DB); return ready; }
    ready = fetch(DATA_URL, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('No se encontró ' + DATA_URL); return r.json(); })
      .then(function (j) { DB = { meta: j.meta || {}, c: shiftDates(j.colecciones, (j.meta || {}).fechaReferencia || '2026-10-21') }; DB.meta.cargada = Date.now(); persist(); return DB; })
      .catch(function (e) { showError(e); throw e; });
    return ready;
  }
  function restore() { try { localStorage.removeItem(STORE); } catch (e) {} location.reload(); }

  /* ------------------------------------------------------------ instantáneas y consultas */
  function snapDoc(col, id) { var d = (DB.c[col] || {})[id]; return { id: id, exists: d !== undefined, data: function () { return clone(d); } }; }
  function runQuery(q) {
    var map = DB.c[q.col] || {};
    var ids = Object.keys(map).filter(function (id) {
      return q.where.every(function (w) { var v = (map[id] || {})[w[0]]; switch (w[1]) { case '>=': return v >= w[2]; case '>': return v > w[2]; case '<=': return v <= w[2]; case '<': return v < w[2]; case '==': return v === w[2]; case '!=': return v !== w[2]; default: return true; } });
    });
    if (q.order) { var f = q.order[0], m = q.order[1] === 'desc' ? -1 : 1; ids.sort(function (a, b) { var x = (map[a] || {})[f], y = (map[b] || {})[f]; return x === y ? 0 : (x > y ? m : -m); }); }
    if (q.lim) ids = ids.slice(0, q.lim);
    return ids;
  }
  function colSnap(q, prev) {
    var ids = runQuery(q), docs = ids.map(function (id) { return snapDoc(q.col, id); });
    var now = {}; ids.forEach(function (id) { now[id] = JSON.stringify(DB.c[q.col][id]); });
    var changes = [];
    ids.forEach(function (id) { if (!prev || !(id in prev)) changes.push({ type: 'added', doc: snapDoc(q.col, id) }); else if (prev[id] !== now[id]) changes.push({ type: 'modified', doc: snapDoc(q.col, id) }); });
    if (prev) Object.keys(prev).forEach(function (id) { if (!(id in now)) changes.push({ type: 'removed', doc: { id: id, exists: false, data: function () { return undefined; } } }); });
    return { snap: { docs: docs, size: docs.length, empty: !docs.length, docChanges: function () { return changes; } }, state: now };
  }
  function notify(col) {
    setTimeout(function () {
      listeners.forEach(function (L) {
        if (L.col !== col) return;
        try {
          if (L.kind === 'doc') { var s = JSON.stringify(DB.c[col] && DB.c[col][L.id]); if (s === L.last) return; L.last = s; L.cb(snapDoc(col, L.id)); }
          else { var r = colSnap(L.q, L.state); if (!r.snap.docChanges().length) return; L.state = r.state; L.cb(r.snap); }
        } catch (e) { console.error(e); }
      });
    }, 0);
  }
  function docRef(path) {
    var p = String(path).split('/'), col = p[0], id = p.slice(1).join('/');
    return {
      id: id, path: path,
      get: function () { return load().then(function () { return snapDoc(col, id); }); },
      set: function (v) { return load().then(function () { (DB.c[col] || (DB.c[col] = {}))[id] = clone(v) || {}; persist(); notify(col); }); },
      update: function (v) { return load().then(function () { var m = DB.c[col] || (DB.c[col] = {}); if (m[id] === undefined) { var e = new Error('No existe ' + path); e.code = 'not-found'; throw e; } merge(m[id], v || {}); persist(); notify(col); }); },
      delete: function () { return load().then(function () { if (DB.c[col]) delete DB.c[col][id]; persist(); notify(col); }); },
      acquire: function () { return Promise.resolve({ acquired: true, release: function () { return Promise.resolve(); } }); },
      onSnapshot: function (cb, err) {
        var L = { kind: 'doc', col: col, id: id, cb: cb, last: null };
        load().then(function () { L.last = JSON.stringify(DB.c[col] && DB.c[col][id]); listeners.push(L); cb(snapDoc(col, id)); }).catch(function (e) { if (err) err(e); });
        return function () { listeners = listeners.filter(function (x) { return x !== L; }); };
      }
    };
  }
  function query(col, q) {
    q = q || { col: col, where: [], order: null, lim: 0 };
    return {
      where: function (f, op, v) { return query(col, { col: col, where: q.where.concat([[f, op, v]]), order: q.order, lim: q.lim }); },
      orderBy: function (f, dir) { return query(col, { col: col, where: q.where, order: [f, dir || 'asc'], lim: q.lim }); },
      limit: function (n) { return query(col, { col: col, where: q.where, order: q.order, lim: n }); },
      doc: function (id) { return docRef(col + '/' + id); },
      get: function () { return load().then(function () { return colSnap(q, null).snap; }); },
      onSnapshot: function (cb, err) {
        var L = { kind: 'col', col: col, q: q, cb: cb, state: null };
        load().then(function () { var r = colSnap(q, null); L.state = r.state; listeners.push(L); cb(r.snap); }).catch(function (e) { if (err) err(e); });
        return function () { listeners = listeners.filter(function (x) { return x !== L; }); };
      }
    };
  }
  var db = { doc: docRef, collection: function (n) { return query(n); } };

  /* ------------------------------------------------------------ usuario y descargas */
  var USERS = { admin: { id: 'demo_admin', name: 'Administrador Demo' }, vendedor: { id: 'demo_vendedor', name: 'Vendedor Demo' } };
  var user = {
    me: function () { return Promise.resolve(USERS[rol] || USERS.admin); },
    canEdit: function () { return Promise.resolve(rol !== 'vendedor'); },
    profiles: function (ids) { var o = {}; (ids || []).forEach(function (i) { o[i] = { name: i === 'demo_vendedor' ? USERS.vendedor.name : i === 'auto' ? 'Automático' : USERS.admin.name }; }); return Promise.resolve(o); }
  };
  var downloads = {
    save: function (o) {
      var d = o.data, blob = d instanceof Blob ? d : new Blob([d instanceof ArrayBuffer || ArrayBuffer.isView(d) ? d : String(d)]);
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = o.filename || 'archivo'; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000); return Promise.resolve();
    }
  };
  window.claude = {
    use: function (name) {
      if (name === 'db') return load().then(function () { return db; });
      if (name === 'user') return Promise.resolve(user);
      if (name === 'downloads') return Promise.resolve(downloads);
      return Promise.resolve(null);   // mcp (Google Sheets) y sample (Claude) no están en la demo
    },
    demo: { restaurar: restore, rol: function () { return rol; } }
  };

  /* ------------------------------------------------------------ marca DEMO */
  var css = '#demoBar{position:fixed;inset:0 0 auto 0;height:28px;z-index:2147483000;display:flex;align-items:center;gap:10px;padding:0 10px 0 12px;' +
    'background:repeating-linear-gradient(135deg,#F2B84B 0 14px,#EBA92F 14px 28px);color:#1B1B1B;font:700 12.5px/1 Barlow,system-ui,sans-serif;letter-spacing:.04em}' +
    '#demoBar b{background:#1B1B1B;color:#F2B84B;padding:4px 8px;border-radius:5px;white-space:nowrap}#demoBar span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600;letter-spacing:0}' +
    '#demoBar button{margin-left:auto;height:22px;border:0;border-radius:6px;background:#1B1B1B;color:#fff;font:600 12px Barlow,system-ui,sans-serif;padding:0 9px;cursor:pointer}#demoBar button+button{margin-left:0}' +
    'body{padding-top:28px!important}.top{top:28px!important}.side{top:28px!important}body::before{top:28px}' +
    '.rpx-nav{top:calc(112px + env(safe-area-inset-top,0px))!important}.rpx-top{top:calc(88px + env(safe-area-inset-top,0px))!important}' +
    '#demoBar i{font-style:normal}@media (max-width:640px){#demoBar span,#demoBar .lg{display:none}#demoBar{gap:6px;padding:0 6px}#demoBar b{padding:4px 6px;font-size:11px;letter-spacing:0}#demoBar button{padding:0 7px;font-size:11px}}@media (max-width:345px){#demoBar .x{display:none}}';
  function bar() {
    if (document.getElementById('demoBar')) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var b = document.createElement('div'); b.id = 'demoBar'; b.setAttribute('role', 'note');
    b.innerHTML = '<b>DEMO<i class="x"> — DATOS DE PRUEBA</i></b><span>Datos ficticios. Los cambios se guardan solo en este navegador.</span>' +
      '<button type="button" id="demoRol"><i class="lg">Ver como: </i>' + (rol === 'vendedor' ? 'Vendedor' : 'Admin<i class="lg">istrador</i>') + '</button><button type="button" id="demoReset">Restaurar<i class="lg"> demo</i></button>';
    document.body.appendChild(b);
    document.getElementById('demoReset').onclick = function () { if (confirm('¿Restaurar la demo? Se borran todos los cambios hechos en este navegador y se cargan de nuevo los datos de prueba.')) restore(); };
    document.getElementById('demoRol').onclick = function () { try { localStorage.setItem(ROLE, rol === 'vendedor' ? 'admin' : 'vendedor'); } catch (e) {} location.reload(); };
    if (!/^DEMO/.test(document.title)) document.title = 'DEMO · ' + document.title;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bar); else bar();
  function showError(e) {
    var go = function () { var d = document.createElement('div'); d.style.cssText = 'position:fixed;inset:40px 16px auto;z-index:2147483001;background:#fff;color:#222;border:2px solid #C8463C;border-radius:12px;padding:16px;font:15px system-ui';
      d.innerHTML = '<b>No se pudieron cargar los datos de la demo.</b><br>Abre el proyecto con un servidor local (por ejemplo <code>npm start</code>) en lugar de hacer doble clic en el archivo. Detalle: ' + String(e && e.message || e);
      document.body.appendChild(d); };
    if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
  }
})();
