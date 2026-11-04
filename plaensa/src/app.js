/* PLAENSA · Quadre de comandament RSBMN — lògica de l'aplicació
   Regles de dades: no es calculen mitjanes de regió ni de sector (no són dades consolidades);
   només es mostra el valor de la RSBMN quan el fitxer porta el valor oficial. */
(function () {
  'use strict';

  var STUDIES = PLP.STUDIES;
  var SECTOR_ORDER = ['Vallès Oriental', 'Vallès Occidental Est', 'Vallès Occidental Oest', 'Barcelonès Nord i Baix Maresme', 'Maresme Central'];
  var SHORT = {
    UP272: 'Can Ruti (HUGTiP)', UP729: 'Mútua Terrassa', UP734: 'Esperit Sant', UP741: 'Parc Taulí Sabadell',
    UP743: 'H. Sant Celoni', UP744: 'H. Terrassa (CST)', UP750: 'H. Granollers', UP753: 'H. Municipal Badalona (BSA)',
    UP908: 'H. Mollet', UP1425: 'H. Mataró', UP3536: 'ICO Badalona'
  };
  // Sector per defecte quan el fitxer no el porta (es pot canviar a Configuració › Centres i sectors)
  var DEFAULT_SECTOR = { UP3536: 'Barcelonès Nord i Baix Maresme' };
  // Logo de cada institució (xarxa d'aliances RSBMN) i entitat proveïdora de les EAP
  var LOGO_KEY = { UP272: 'HGTiP', UP729: 'HUMT', UP734: 'HES', UP741: 'TAULI', UP743: 'HSCEL', UP744: 'CST', UP750: 'HGG', UP753: 'BSA', UP908: 'HMOL', UP1425: 'HMAT', UP3536: 'ICO' };
  var ENT_LOGO = { CSDM: 'HMAT', BSA: 'BSA', CST: 'CST', MT: 'HUMT', CSPT: 'TAULI' };
  var DEFAULT_CPR = { URG: ['P7', 'P23', 'P26', 'P102'], AP: ['P2', 'P9', 'P15', 'P102'], TRD: ['P4', 'P5', 'P7', 'P9'] };
  var DEFAULT_NONCOMP = { AEA: ['P10', 'P17'] };
  // Dimensions del qüestionari (validació del qüestionari AEA 2026)
  var DIMS = {
    AEA: [['Accessibilitat', ['P1', 'P2', 'P3']], ['Informació', ['P11', 'P12', 'P18']], ['Tracte', ['P7', 'P8', 'P9', 'P10', 'P13', 'P14', 'P15']],
      ['Confort', ['P4', 'P5', 'P6']], ['Coordinació', ['P16', 'P17', 'P19']], ['Satisfacció i fidelitat', ['P101', 'P102']]]
  };
  // Objectius ja fixats a la presentació PLAENSA RSBMN AEA 2026
  var DEFAULT_OBJ = [
    { study: 'AEA', cicle: 2024, tipus: 'trans', scope: 'regio', target: '', q: 'P2', origen: 'Presentació AEA 2026' },
    { study: 'AEA', cicle: 2024, tipus: 'trans', scope: 'regio', target: '', q: 'P16', origen: 'Presentació AEA 2026' },
    { study: 'AEA', cicle: 2024, tipus: 'trans', scope: 'regio', target: '', q: 'P18', origen: 'Presentació AEA 2026' },
    { study: 'AEA', cicle: 2026, tipus: 'trans', scope: 'regio', target: '', q: 'P5', origen: 'Presentació AEA 2026 (accions 2027)' }
  ];
  var N_EST = 80; // mida mínima per unitat mostral del disseny CatSalut, quan no hi ha n real
  var PALETTE = ['#4f7cac', '#c0697a', '#5f9e74', '#d9925a', '#8a73b0', '#4f9c9e', '#a08778', '#7383c4', '#a7a85a', '#c97b62'];
  var ACTION_TYPES = ['Accés i organització', 'Coordinació AP–AE', 'Continuïtat i comprensió', 'Confort i espais', 'Tracte i comunicació', 'Altres'];

  /* Icones dels serveis (traç propi, 24x24) */
  var ICONS = {
    ALL: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><path d="M14 18l2.5 2.5L21 15"/>',
    AEA: '<path d="M5 3v5a5 5 0 0 0 10 0V3"/><path d="M10 13v1.5a5.5 5.5 0 0 0 11 0V12"/><circle cx="21" cy="9.5" r="2.2"/>',
    URG: '<rect x="1.5" y="7" width="13" height="10" rx="1.2"/><path d="M14.5 10h4l3.5 4v3h-7.5z"/><circle cx="6.5" cy="18.5" r="1.9"/><circle cx="17.5" cy="18.5" r="1.9"/><path d="M8 9.5v5M5.5 12h5"/><path d="M6 4.5h3"/>',
    AH: '<path d="M2 5v15M2 15.5h20V20M22 15.5V13a3 3 0 0 0-3-3h-8v5.5"/><circle cx="6.5" cy="11.5" r="2.2"/>',
    TRD: '<path d="M12 3v8.5M12 8.5l-3 3M12 8.5l3 3"/><path d="M8.5 7.5C5.5 7.5 3 13 3 17.5c0 2 1.2 3 3 3s3-1 3-3V11"/><path d="M15.5 7.5c3 0 5.5 5.5 5.5 10 0 2-1.2 3-3 3s-3-1-3-3V11"/>',
    AP: '<path d="M3 11l9-7.5 9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M12 12.5v6M9 15.5h6"/>',
    EMB: '<path d="M13.5 3.5a7.5 7.5 0 0 1 7.5 7.5h-7.5z"/><path d="M2 5.5h2.5L7 11h14a5 5 0 0 1-5 5H10a4 4 0 0 1-4-4"/><circle cx="8.5" cy="19.5" r="1.7"/><circle cx="17.5" cy="19.5" r="1.7"/>',
    AI: '<path d="M20.4 12.6L12 21l-8.4-8.4A5 5 0 0 1 12 5.7a5 5 0 0 1 8.4 6.9z"/><path d="M4.5 12.5h4l1.5-3 2.5 6 1.5-3h5"/>'
  };
  function icon(id, size) { return '<span class="svc s' + (size || 20) + '" aria-hidden="true"><svg viewBox="0 0 24 24">' + (ICONS[id] || ICONS.ALL) + '</svg></span>'; }

  var SUBS = [
    ['resum', 'Resum i conclusions', 'Titulars i canvis d\'àrea', '<path d="M4 15a8 8 0 1 1 16 0"/><path d="M12 15l4-5"/><circle cx="12" cy="15" r="1.4"/><path d="M4 19h16"/>'],
    ['sf', 'Satisfacció i Fidelitat', 'Per centre, ordenable', '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0"/><path d="M9 9.5h.01M15 9.5h.01"/>'],
    ['semafor', 'Semàfor per centre', 'Pregunta × centre', '<rect x="7.5" y="2.5" width="9" height="19" rx="3"/><circle cx="12" cy="7" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="17" r="1.6"/>'],
    ['comp', 'Comparativa i evolució', 'Centres i anys', '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'],
    ['centre', 'Anàlisi de centre', 'Anys, prioritats i plans', '<path d="M3 21h18"/><path d="M5 21V8l7-5 7 5v13"/><path d="M9.5 21v-5h5v5"/><path d="M12 7.5v4M10 9.5h4"/>'],
    ['cpr', 'CPR i Accions', 'Objectius CPR i registre', '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12l7-7M16 5h3v3"/>'],
    ['obj', 'Objectius i configuració', 'Transversals i específics', '<path d="M4 6h16M4 12h10M4 18h7"/><circle cx="18" cy="15" r="3"/><path d="M18 11v1M18 18v1M21 15h1M14 15h1"/>']
  ];

  /* ---------- Estat ---------- */
  function freshState() {
    var studies = {};
    STUDIES.forEach(function (s) { studies[s.id] = { cpr: (DEFAULT_CPR[s.id] || []).slice(), noncomp: (DEFAULT_NONCOMP[s.id] || []).slice(), fitxa: {} }; });
    return {
      version: 2, records: {}, centres: {}, questions: {},
      config: { studies: studies, thr: { red: 0.75, green: 0.90, red101: 7.5, green101: 9, diff: 0.05, diff101: 0.5 }, frames: { c: true, s: true, r: true } },
      objectives: DEFAULT_OBJ.map(function (o, i) { return Object.assign({ id: 'def' + i }, o); }),
      actions: [], loads: []
    };
  }
  // Adapta còpies antigues: transversals globals → objectius de regió, sector per defecte d'ICO, preguntes no comparables
  function migrate(st) {
    st.objectives = st.objectives || freshState().objectives;
    Object.keys(st.config.studies || {}).forEach(function (id) {
      var c = st.config.studies[id];
      if (c.noncomp == null) c.noncomp = (DEFAULT_NONCOMP[id] || []).slice();
      if (!c.fitxa) c.fitxa = {};
      if (c.trans && c.trans.length) {
        var ys = Object.keys(st.records).filter(function (k) { return k.indexOf(id + '|') === 0; }).map(function (k) { return +k.split('|')[1]; });
        var cy = ys.length ? Math.min.apply(null, ys) : new Date().getFullYear();
        c.trans.forEach(function (q) {
          if (!st.objectives.some(function (o) { return o.study === id && o.q === q && o.tipus === 'trans' && o.scope === 'regio' && +o.cicle === +cy; }))
            st.objectives.push({ id: uid(), study: id, cicle: cy, tipus: 'trans', scope: 'regio', target: '', q: q, origen: 'Configuració anterior' });
        });
      }
      delete c.trans;
    });
    Object.keys(DEFAULT_SECTOR).forEach(function (k) { var c = st.centres[k]; if (c && !c.sector && !c.userEdited) c.sector = DEFAULT_SECTOR[k]; });
    st.actions.forEach(function (a) {
      if (a.cicle) return;
      // Accions antigues: cicle = darrer PLAENSA de l'estudi anterior o igual a l'any de creació
      var ys = Object.keys(st.records).filter(function (k) { return k.indexOf(a.study + '|') === 0; }).map(function (k) { return +k.split('|')[1]; });
      var cy = a.creat ? +String(a.creat).slice(0, 4) : new Date().getFullYear();
      var ok = ys.filter(function (y) { return y <= cy; });
      a.cicle = ok.length ? Math.max.apply(null, ok) : (ys.length ? Math.max.apply(null, ys) : null);
    });
    st.version = 2;
    return st;
  }
  var S = freshState();
  var UI = { study: null, sub: 'resum', year: null, prev: null, sector: '', selC: null, selQ: null, mxYears: null, mxDiff: true, cicle: null,
    comp: { cat: true, off: true, evoQ: 'P101' }, sfSort: { col: 'sector', dir: 1 }, centre: '', objCicle: null, openDD: '' };

  /* ---------- Persistència (IndexedDB) ---------- */
  var DB = {
    open: function () {
      return new Promise(function (res, rej) {
        try {
          var r = indexedDB.open('plaensa-qdm', 1);
          r.onupgradeneeded = function () { r.result.createObjectStore('kv'); };
          r.onsuccess = function () { res(r.result); };
          r.onerror = function () { rej(r.error); };
        } catch (e) { rej(e); }
      });
    },
    get: function (k) {
      return DB.open().then(function (db) {
        return new Promise(function (res, rej) {
          var q = db.transaction('kv').objectStore('kv').get(k);
          q.onsuccess = function () { res(q.result); }; q.onerror = function () { rej(q.error); };
        });
      });
    },
    set: function (k, v) {
      return DB.open().then(function (db) {
        return new Promise(function (res, rej) {
          var tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k);
          tx.oncomplete = function () { res(); }; tx.onerror = function () { rej(tx.error); };
        });
      });
    }
  };
  var saveTimer = null, storageOk = true;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      DB.set('state', S).catch(function () {
        if (storageOk) { storageOk = false; toast('El navegador no permet desar dades: exporta una còpia JSON per no perdre els canvis.'); }
      });
    }, 300);
  }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sense emmagatzematge */ } }

  /* ---------- Utilitats ---------- */
  function $(sel, el) { return (el || document).querySelector(sel); }
  function $all(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function qn(q) { return +String(q).replace(/\D/g, ''); }
  function qSort(a, b) { var x = qn(a), y = qn(b); var bx = x >= 100 ? 1 : 0, by = y >= 100 ? 1 : 0; return bx - by || x - y; }
  function is101(q) { return q === 'P101'; }
  function fmt(q, v) {
    if (v == null || isNaN(v)) return '–';
    if (is101(q)) return v.toFixed(2).replace('.', ',');
    return (v * 100).toFixed(1).replace('.', ',') + '%';
  }
  function fmtD(q, d) {
    if (d == null || isNaN(d)) return '–';
    var s = d > 0 ? '+' : (d < 0 ? '−' : '±');
    if (is101(q)) return s + Math.abs(d).toFixed(2).replace('.', ',');
    return s + Math.abs(d * 100).toFixed(1).replace('.', ',') + ' pp';
  }
  function pct(n, t) { return t ? Math.round(n / t * 100) + '%' : '–'; }
  function round3(x) { return Math.round(x * 1000) / 1000; }
  function norm(q, v) { return v == null ? null : (is101(q) ? v / 10 : v); }
  function sem(q, v) {
    if (v == null) return 'n';
    var t = S.config.thr;
    if (is101(q)) return v < t.red101 ? 'r' : (v < t.green101 ? 'a' : 'g');
    var p = round3(v);
    return p < t.red ? 'r' : (p < t.green ? 'a' : 'g');
  }
  var SEM_TXT = { r: 'Àrea de millora', a: 'Àrea estàndard', g: 'Àrea d\'excel·lència', n: 'Sense dada' };
  var SEM_SHORT = { g: 'Excel·lència', a: 'Estàndard', r: 'Millora' };
  function dcls(q, d) {
    if (d == null) return '';
    var t = S.config.thr, lim = is101(q) ? t.diff101 : t.diff, x = round3(d);
    return x > lim ? 'up' : (x < -lim ? 'down' : '');
  }
  function dspan(q, d) {
    var c = dcls(q, d);
    return '<span class="' + (c === 'up' ? 'd-up' : c === 'down' ? 'd-down' : 'd-eq') + '">' + fmtD(q, d) + '</span>';
  }
  function mean(a) { a = a.filter(function (x) { return x != null; }); return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : null; }
  function toast(msg) {
    var t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 4200);
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function saveBlob(blob, name) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  function studyName(id) { var s = STUDIES.filter(function (x) { return x.id === id; })[0]; return s ? s.name : id; }

  /* ---------- Accés a dades ---------- */
  function rk(s, y, k, q) { return s + '|' + y + '|' + k + '|' + q; }
  function rec(s, y, k, q) { return S.records[rk(s, y, k, q)] || null; }
  function val(s, y, k, q) { var r = y ? rec(s, y, k, q) : null; return r ? r.v : null; }
  function off(s, y, q) { return val(s, y, 'RSBMN', q); } // valor oficial de la regió (només si el fitxer el porta)
  function hasOff(s, y) { var m = meta(s); return m.qs.some(function (q) { return off(s, y, q) != null; }); }
  var cache = {};
  function invalidate() { cache = {}; }
  function meta(s) {
    if (cache['m' + s]) return cache['m' + s];
    var ys = {}, ks = {}, qs = {};
    var pre = s + '|';
    Object.keys(S.records).forEach(function (key) {
      if (key.indexOf(pre) !== 0) return;
      var p = key.split('|'); ys[p[1]] = 1; ks[p[2]] = 1; qs[p[3]] = 1;
    });
    var m = {
      years: Object.keys(ys).map(Number).sort(function (a, b) { return b - a; }),
      keys: Object.keys(ks), qs: Object.keys(qs).sort(qSort)
    };
    m.centres = m.keys.filter(function (k) { return S.centres[k] && S.centres[k].type === 'centre'; }).sort(centreSort);
    m.active = m.centres.filter(function (k) { return !S.centres[k].excluded && S.centres[k].sector; });
    m.sectors = SECTOR_ORDER.filter(function (sc) { return m.active.some(function (k) { return S.centres[k].sector === sc; }); })
      .concat(uniq(m.active.map(function (k) { return S.centres[k].sector; })).filter(function (sc) { return SECTOR_ORDER.indexOf(sc) < 0; }).sort());
    cache['m' + s] = m;
    return m;
  }
  function uniq(a) { var o = {}; return a.filter(function (x) { if (o[x]) return false; o[x] = 1; return true; }); }
  function centreSort(a, b) {
    var ca = S.centres[a], cb = S.centres[b];
    var sa = SECTOR_ORDER.indexOf(ca.sector), sb = SECTOR_ORDER.indexOf(cb.sector);
    sa = sa < 0 ? 99 : sa; sb = sb < 0 ? 99 : sb;
    return sa - sb || cname(a).localeCompare(cname(b), 'ca');
  }
  function cname(k) { var c = S.centres[k]; if (!c) return k; return c.short || c.name || k; }
  function cfull(k) { var c = S.centres[k]; if (!c) return k; return (c.code ? c.code + ' · ' : '') + (c.name || k); }
  function qtext(s, q) { return (S.questions[s] && S.questions[s][q]) || ''; }
  // Sempre el text de la pregunta; el codi només com a referència discreta
  function qname(s, q) { if (q === 'P101') return 'Satisfacció global (0–10)'; if (q === 'P102') return 'Fidelitat (continuaria venint)'; return qtext(s, q) || q; }
  function qshort(s, q, n) { var t = qname(s, q).replace(/\?$/, ''); n = n || 46; return t.length > n ? t.slice(0, n - 1) + '…' : t; }
  function qlabel(s, q) { return qname(s, q) + ' (' + q + ')'; }
  function qhtml(s, q) { return esc(qname(s, q)) + ' <span class="qcode">' + q + '</span>'; }
  function cfg(s) { var c = S.config.studies[s] || (S.config.studies[s] = { cpr: [], noncomp: [], fitxa: {} }); if (!c.noncomp) c.noncomp = []; if (!c.fitxa) c.fitxa = {}; return c; }
  function isCpr(s, q) { return cfg(s).cpr.indexOf(q) >= 0; }
  function comparable(s, q) { return cfg(s).noncomp.indexOf(q) < 0; }
  function dif(s, k, q, y1, y0) { if (!comparable(s, q)) return null; var a = val(s, y1, k, q), b = val(s, y0, k, q); return a != null && b != null ? a - b : null; }

  /* Objectius per cicle (PLAENSA que els origina) i àmbit (regió, sector o centre) */
  function objApplies(o, k) {
    if (o.scope === 'regio' || !k) return true;
    if (o.scope === 'sector') return S.centres[k] && S.centres[k].sector === o.target;
    return o.target === k;
  }
  function objectives(s, cicle, tipus, k) {
    return S.objectives.filter(function (o) { return o.study === s && o.q !== '__cycle' && (cicle == null || +o.cicle === +cicle) && (!tipus || o.tipus === tipus) && objApplies(o, k); });
  }
  function curCicle(s) { var m = meta(s); return UI.cicle && cicleList(s).indexOf(UI.cicle) >= 0 ? UI.cicle : (UI.prev || UI.year || m.years[0]); }
  function cicleList(s) {
    var ys = meta(s).years.slice();
    S.objectives.forEach(function (o) { if (o.study === s && ys.indexOf(+o.cicle) < 0) ys.push(+o.cicle); });
    return ys.sort(function (a, b) { return b - a; });
  }
  function isTrans(s, q, k) { return objectives(s, curCicle(s), 'trans', k).some(function (o) { return o.q === q; }); }
  function isEsp(s, q, k) { return objectives(s, curCicle(s), 'esp', k).some(function (o) { return o.q === q; }); }
  function qtags(s, q, k) {
    return (isCpr(s, q) ? ' <span class="tag cpr">CPR</span>' : '') + (isTrans(s, q, k) ? ' <span class="tag tr">Transversal</span>' : '') +
      (isEsp(s, q, k) ? ' <span class="tag es">Específic</span>' : '') + (!comparable(s, q) ? ' <span class="tag off" title="Pregunta nova o modificada: no es compara amb anys anteriors">No comparable</span>' : '');
  }

  function scopeKeys(s) {
    var m = meta(s);
    return UI.sector ? m.active.filter(function (k) { return S.centres[k].sector === UI.sector; }) : m.active;
  }
  function scopeName() { return UI.sector || 'RSBMN'; }
  function selKeys(s) { var sk = scopeKeys(s); return UI.selC ? sk.filter(function (k) { return UI.selC.indexOf(k) >= 0; }) : sk; }
  function selQs(s) { var m = meta(s); return UI.selQ ? m.qs.filter(function (q) { return UI.selQ.indexOf(q) >= 0; }) : m.qs; }

  /* Significació d'una diferència entre dos anys: IC, n real o n estimada (mínim del disseny) */
  function sigTest(s, k, q, y1, y0) {
    var d = dif(s, k, q, y1, y0);
    if (d == null) return { d: null, st: 'nd' };
    var a = rec(s, y1, k, q), b = rec(s, y0, k, q);
    if (a.lo != null && b.lo != null) return { d: d, st: (a.lo > b.hi || a.hi < b.lo) ? 'sig' : 'nc', est: false };
    if (is101(q)) return { d: d, st: dcls(q, d) ? 'rel' : 'nc', est: true };
    var na = a.n || N_EST, nb = b.n || N_EST, p = (a.v * na + b.v * nb) / (na + nb);
    var se = Math.sqrt(p * (1 - p) * (1 / na + 1 / nb));
    return { d: d, st: se && Math.abs(d / se) > 1.96 ? 'sig' : 'nc', est: !(a.n && b.n) };
  }
  function sig(s, k, q) { var r = sigTest(s, k, q, UI.year, UI.prev); return r.st === 'nd' || r.est ? null : r.st; }
  function hasSigData(s) {
    var pre = s + '|' + UI.year + '|';
    return Object.keys(S.records).some(function (k) { var r = S.records[k]; return k.indexOf(pre) === 0 && (r.n || r.lo != null); });
  }

  /* Extrems (millor/pitjor) dins d'un conjunt de cel·les centre·pregunta; P101 normalitzada 0-1. */
  function extremes(s, y, keys, qs) {
    var best = null, worst = null, cells = [];
    keys.forEach(function (k) {
      qs.forEach(function (q) {
        var v = norm(q, val(s, y, k, q));
        if (v == null) return;
        v = round3(v);
        cells.push({ k: k, q: q, v: v });
        if (best == null || v > best) best = v;
        if (worst == null || v < worst) worst = v;
      });
    });
    return { best: cells.filter(function (c) { return c.v === best; }), worst: cells.filter(function (c) { return c.v === worst; }) };
  }
  // Valors dels centres (sense agregar) i canvis entre anys
  function cvals(s, y, keys, q) { return keys.map(function (k) { return { k: k, v: val(s, y, k, q) }; }).filter(function (x) { return x.v != null; }); }
  function cchanges(s, keys, q) { return keys.map(function (k) { return { k: k, d: dif(s, k, q, UI.year, UI.prev) }; }).filter(function (x) { return x.d != null; }); }
  // Matriu de canvis d'àrea (any anterior → any actual) sobre resultats centre·pregunta
  function transitions(s, keys, qs, y1, y0) {
    var mx = { g: { g: 0, a: 0, r: 0 }, a: { g: 0, a: 0, r: 0 }, r: { g: 0, a: 0, r: 0 } }, byK = {}, rank = { r: 0, a: 1, g: 2 };
    keys.forEach(function (k) {
      var o = byK[k] = { up: 0, eq: 0, down: 0 };
      qs.forEach(function (q) {
        if (!comparable(s, q)) return;
        var a = val(s, y1, k, q), b = val(s, y0, k, q); if (a == null || b == null) return;
        var f = sem(q, b), t = sem(q, a); mx[f][t]++;
        if (rank[t] > rank[f]) o.up++; else if (rank[t] < rank[f]) o.down++; else o.eq++;
      });
    });
    return { mx: mx, byK: byK };
  }

  /* ---------- Logos i colors de les institucions ---------- */
  function logoKey(k) { var c = S.centres[k]; return LOGO_KEY[k] || (c && c.entitat ? ENT_LOGO[String(c.entitat).toUpperCase().replace(/\s+/g, '')] : null) || null; }
  function initials(k) { return cname(k).replace(/\(.*\)/, '').split(/[\s.-]+/).filter(function (w) { return w.length > 1 && /[A-ZÀ-Ú]/.test(w[0]); }).slice(0, 2).map(function (w) { return w[0]; }).join('') || 'C'; }
  function brand(k) {
    var lk = logoKey(k), b = window.PL_BRAND || {};
    if (lk && b[lk]) return b[lk];
    var h = 0; String(k).split('').forEach(function (ch) { h = (h * 31 + ch.charCodeAt(0)) >>> 0; });
    return PALETTE[h % PALETTE.length];
  }
  function logo(k, size) {
    var lk = logoKey(k), L = window.PL_LOGOS || {};
    size = size || 'sm';
    if (lk && L[lk]) return '<span class="lg ' + size + '"><img src="' + L[lk] + '" alt=""></span>';
    return '<span class="lg ' + size + ' ini" style="--c:' + brand(k) + '" aria-hidden="true">' + esc(initials(k)) + '</span>';
  }
  function cnameHtml(k, size) { return '<span class="cn">' + logo(k, size) + '<span>' + esc(cname(k)) + '</span></span>'; }
  // Colors de gràfic a partir del color del logo; si dos s'assemblen, se'n varia la lluminositat
  function hex2rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join(''); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function rgb2hex(r) { return '#' + r.map(function (x) { return ('0' + Math.max(0, Math.min(255, Math.round(x))).toString(16)).slice(-2); }).join(''); }
  function shade(h, f) { var r = hex2rgb(h); return rgb2hex(r.map(function (x) { return f > 0 ? x + (255 - x) * f : x * (1 + f); })); }
  function cdist(a, b) { var x = hex2rgb(a), y = hex2rgb(b); return Math.sqrt(Math.pow(x[0] - y[0], 2) + Math.pow(x[1] - y[1], 2) + Math.pow(x[2] - y[2], 2)); }
  function colorsFor(keys) {
    var used = [], out = {}, steps = [0, -0.35, 0.4, -0.55, 0.6];
    keys.forEach(function (k) {
      var base = brand(k), c = base;
      for (var i = 0; i < steps.length; i++) { c = steps[i] ? shade(base, steps[i]) : base; if (!used.some(function (u) { return cdist(u, c) < 70; })) break; }
      used.push(c); out[k] = c;
    });
    return out;
  }

  /* ---------- Fusió de dades carregades ---------- */
  function mergeParsed(study, parsed, sheetsSel) {
    var added = 0, updated = 0, seen = {}, conflicts = 0;
    var legend = parsed.legend || {};
    parsed.sheets.forEach(function (sh) {
      if (!sh.ok || !sheetsSel[sh.name]) return;
      Object.keys(sh.centres).forEach(function (k) {
        var e = sh.centres[k], cur = S.centres[k];
        if (!cur) {
          cur = S.centres[k] = { key: k, type: e.type, name: e.name, code: e.code || '', short: SHORT[k] || '', sector: '', entitat: e.entitat || '', excluded: /guttmann/i.test(e.name) };
        } else if (e.type === 'centre' && e.name && (!cur.name || e.name.length > cur.name.length) && !cur.userEdited) cur.name = e.name;
        if (!cur.sector && e.type === 'centre') cur.sector = legend[k] || e.sectorHint || DEFAULT_SECTOR[k] || '';
        if (!cur.entitat && e.entitat) cur.entitat = e.entitat;
      });
      S.questions[study] = S.questions[study] || {};
      Object.keys(sh.questions).forEach(function (q) {
        var t = sh.questions[q];
        if (t && (!S.questions[study][q] || t.length > S.questions[study][q].length)) S.questions[study][q] = t;
      });
      sh.records.forEach(function (r) {
        var st = r.s && r.s !== parsed.study ? r.s : study;
        var key = rk(st, r.y, r.k, r.q);
        if (seen[key] != null) { if (Math.abs(seen[key] - r.v) > 0.0005) conflicts++; return; }
        seen[key] = r.v;
        var o = { v: r.v };
        if (r.n) o.n = r.n;
        if (r.lo != null) { o.lo = r.lo; o.hi = r.hi; }
        if (r.sc) o.sc = r.sc;
        if (r.best) o.best = r.best;
        if (S.records[key]) updated++; else added++;
        S.records[key] = o;
      });
    });
    Object.keys(legend).forEach(function (k) { if (S.centres[k] && !S.centres[k].userEdited) S.centres[k].sector = legend[k]; });
    S.loads.push({ file: parsed.fileName, study: study, date: new Date().toISOString(), added: added, updated: updated });
    invalidate();
    return { added: added, updated: updated, conflicts: conflicts };
  }

  /* ---------- Gràfics ---------- */
  var charts = {};
  function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
  function chart(id, config) {
    if (charts[id]) { charts[id].destroy(); delete charts[id]; }
    var el = document.getElementById(id);
    if (!el || typeof Chart === 'undefined') return;
    Chart.defaults.color = css('--muted');
    Chart.defaults.borderColor = css('--line');
    Chart.defaults.font.family = 'Arial, Helvetica, sans-serif';
    Chart.defaults.font.size = 12;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.boxHeight = 8;
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 4;
    config.options = config.options || {};
    config.options.responsive = true;
    config.options.maintainAspectRatio = false;
    config.options.animation = false;
    charts[id] = new Chart(el, config);
  }
  function destroyCharts() { Object.keys(charts).forEach(function (k) { charts[k].destroy(); }); charts = {}; }
  function semColor(c) { return css(c === 'r' ? '--sem-r' : c === 'a' ? '--sem-a' : c === 'g' ? '--sem-g' : '--line'); }
  function pctAxis(min) { return { min: min, max: 100, ticks: { callback: function (v) { return v + '%'; } }, grid: { color: css('--line') } }; }
  function as100(q, v) { return v == null ? null : Math.round((is101(q) ? v * 10 : v * 100) * 10) / 10; }
  function wrapLabel(t, n) { var w = t.split(' '), out = [], cur = ''; w.forEach(function (x) { if ((cur + ' ' + x).trim().length > n) { if (cur) out.push(cur); cur = x; } else cur = (cur + ' ' + x).trim(); }); if (cur) out.push(cur); return out; }

  /* ---------- Render principal ---------- */
  var app;
  function render() {
    destroyCharts();
    renderStudyTabs();
    var p = $('#panel');
    if (UI.study === 'ALL') { renderOverview(); return; }
    var s = UI.study, m = meta(s);
    if (!m.years.length) { p.innerHTML = emptyStudy(s); bindEmpty(); return; }
    if (m.years.indexOf(UI.year) < 0) UI.year = m.years[0];
    if (UI.prev != null && (m.years.indexOf(UI.prev) < 0 || UI.prev >= UI.year)) UI.prev = null;
    if (UI.prev == null && !UI.prevNone) UI.prev = m.years.filter(function (y) { return y < UI.year; })[0] || null;
    if (UI.sector && m.sectors.indexOf(UI.sector) < 0) UI.sector = '';
    if (!UI.mxYears) UI.mxYears = UI.prev ? [UI.prev] : [];
    UI.mxYears = UI.mxYears.filter(function (y) { return y < UI.year && m.years.indexOf(y) >= 0; });
    if (!SUBS.some(function (x) { return x[0] === UI.sub; })) UI.sub = 'resum';

    var html = '<div class="study-head"><div class="title-row">' + icon(s, 56) + '<div><h2>' + esc(studyName(s)) + '</h2><div class="sub">PLAENSA ' + UI.year + (UI.prev ? ' vs ' + UI.prev : '') + ' · ' + m.active.length + ' centres · ' + m.qs.length + ' preguntes · Regió Sanitària Metropolitana Nord</div></div></div>' +
      '<div class="filters">' +
      '<div class="field"><label for="f-year">Any</label><select id="f-year">' + m.years.map(function (y) { return '<option' + (y === UI.year ? ' selected' : '') + '>' + y + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="f-prev">Comparar amb</label><select id="f-prev"><option value="">— cap —</option>' + m.years.filter(function (y) { return y < UI.year; }).map(function (y) { return '<option' + (y === UI.prev ? ' selected' : '') + '>' + y + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="f-sector">Àmbit</label><select id="f-sector"><option value="">Tota la regió (RSBMN)</option>' + m.sectors.map(function (x) { return '<option' + (x === UI.sector ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select></div>' +
      '<button class="btn" id="b-rep" type="button">Informe comitè (HTML)</button>' +
      '<button class="btn primary" id="b-pptx" type="button">Descarregar presentació</button>' +
      '</div></div>' +
      '<nav class="subtabs" role="tablist" aria-label="Apartats de l\'estudi">' + SUBS.map(function (x) {
        return '<button type="button" role="tab" aria-selected="' + (UI.sub === x[0]) + '" class="subtab' + (UI.sub === x[0] ? ' active' : '') + '" data-sub="' + x[0] + '"><span class="st-ic" aria-hidden="true"><svg viewBox="0 0 24 24">' + x[3] + '</svg></span><span class="st-tx"><span class="st-nm">' + x[1] + '</span><span class="st-ds">' + x[2] + '</span></span></button>';
      }).join('') + '</nav>' +
      '<div id="sub"></div>';
    p.innerHTML = html;
    $('#f-year').onchange = function () { UI.year = +this.value; UI.prev = null; UI.prevNone = false; UI.mxYears = null; render(); };
    $('#f-prev').onchange = function () { UI.prev = this.value ? +this.value : null; UI.prevNone = !this.value; UI.mxYears = null; render(); };
    $('#f-sector').onchange = function () { UI.sector = this.value; render(); };
    $('#b-pptx').onclick = function () { buildPptx(s); };
    $('#b-rep').onclick = function () { exportReport(s); };
    $all('.subtab').forEach(function (b) { b.onclick = function () { UI.sub = b.dataset.sub; lsSet('plaensa-sub', UI.sub); render(); }; });
    ({ resum: renderResum, sf: renderSF, semafor: renderSemafor, comp: renderComp, centre: renderCentre, cpr: renderCpr, obj: renderObj })[UI.sub]($('#sub'), s);
  }

  function renderStudyTabs() {
    $('#studies').innerHTML = '<button type="button" class="study-tab overview' + (UI.study === 'ALL' ? ' active' : '') + '" data-st="ALL">' + icon('ALL') + '<span class="tx"><span class="code">RSBMN · tots els estudis</span><span class="nm">Visió global</span></span></button>' + STUDIES.map(function (st) {
      var m = meta(st.id), has = m.years.length > 0;
      return '<button type="button" class="study-tab' + (UI.study === st.id ? ' active' : '') + (has ? '' : ' empty') + '" data-st="' + st.id + '">' + icon(st.id) +
        '<span class="tx"><span class="code">' + st.id + (has ? ' · ' + m.years.join('/') : ' · sense dades') + '</span><span class="nm">' + esc(st.name) + '</span></span></button>';
    }).join('');
    $all('.study-tab').forEach(function (b) { b.onclick = function () { openStudy(b.dataset.st); }; });
  }
  function openStudy(id) {
    UI.study = id; UI.year = null; UI.prev = null; UI.sector = ''; UI.selC = null; UI.selQ = null; UI.mxYears = null; UI.cicle = null; UI.centre = ''; UI.objCicle = null;
    lsSet('plaensa-study', UI.study); render(); window.scrollTo(0, 0);
  }

  function emptyStudy(s) {
    return '<div class="empty-state"><strong>' + esc(studyName(s)) + ': encara no hi ha dades</strong>' +
      '<span>Carrega l\'Excel de resultats PLAENSA d\'aquest estudi (format oficial amb la fila «Pregunta resumida») o la plantilla normalitzada.</span>' +
      '<div class="toolbar" style="justify-content:center"><button class="btn primary" type="button" id="e-load">Carregar Excel</button><button class="btn" type="button" id="e-tpl">Descarregar plantilla</button></div></div>';
  }
  function bindEmpty() { $('#e-load').onclick = openLoad; $('#e-tpl').onclick = downloadTemplate; }

  function sigNote(s) {
    return hasSigData(s) ? '<div class="note">Hi ha n o intervals de confiança: les diferències marcades amb * són estadísticament significatives (p&lt;0,05).</div>'
      : '<div class="note warn">Els fitxers no inclouen la mida mostral ni els intervals de confiança. ±' + (S.config.thr.diff * 100) + ' pp (satisfacció ±' + String(S.config.thr.diff101).replace('.', ',') + ') és un llindar de rellevància. Amb la mida mínima per centre (n≈' + N_EST + '), una diferència entre dos anys necessita uns ±12 pp per ser concloent.</div>';
  }

  /* ---------- Barra de filtres (centres, preguntes, anys, cicle d'objectius) ---------- */
  function filterBar(s, o) {
    o = o || {};
    var m = meta(s), sk = scopeKeys(s), sel = selKeys(s), qs = selQs(s), html = '<div class="fbar">';
    if (o.centres !== false) {
      var secs = m.sectors.filter(function (sc) { return sk.some(function (k) { return S.centres[k].sector === sc; }); });
      html += '<details class="dd" data-dd="c"' + (UI.openDD === 'c' ? ' open' : '') + '><summary><span class="dd-l">Centres</span><span class="dd-v">' + (UI.selC ? sel.length + ' de ' + sk.length : 'Tots (' + sk.length + ')') + '</span></summary><div class="dd-p">' +
        '<div class="toolbar"><button type="button" class="btn sm" data-fc="all">Tots</button><button type="button" class="btn sm" data-fc="none">Cap</button></div>' +
        secs.map(function (sc) {
          return '<div class="dd-g"><span>' + esc(sc) + '</span><button type="button" class="btn sm ghost" data-fcs="' + esc(sc) + '">Només aquest sector</button></div>' +
            sk.filter(function (k) { return S.centres[k].sector === sc; }).map(function (k) { return '<label class="dd-i"><input type="checkbox" data-fck="' + k + '"' + (sel.indexOf(k) >= 0 ? ' checked' : '') + '>' + cnameHtml(k) + '</label>'; }).join('');
        }).join('') + '</div></details>';
    }
    if (o.questions !== false) {
      html += '<details class="dd" data-dd="q"' + (UI.openDD === 'q' ? ' open' : '') + '><summary><span class="dd-l">Preguntes</span><span class="dd-v">' + (UI.selQ ? qs.length + ' de ' + m.qs.length : 'Totes (' + m.qs.length + ')') + '</span></summary><div class="dd-p wide">' +
        '<div class="toolbar"><button type="button" class="btn sm" data-fq="all">Totes</button><button type="button" class="btn sm" data-fq="none">Cap</button><button type="button" class="btn sm" data-fq="trans">Transversals</button><button type="button" class="btn sm" data-fq="esp">Específiques</button><button type="button" class="btn sm" data-fq="cpr">CPR</button></div>' +
        m.qs.map(function (q) { return '<label class="dd-i"><input type="checkbox" data-fqk="' + q + '"' + (qs.indexOf(q) >= 0 ? ' checked' : '') + '><span>' + qhtml(s, q) + qtags(s, q) + '</span></label>'; }).join('') + '</div></details>';
    }
    if (o.years) {
      var prevs = m.years.filter(function (y) { return y < UI.year; });
      if (prevs.length) html += '<div class="fb-years"><span class="dd-l">Comparar amb</span>' + prevs.map(function (y) { return '<label class="chk"><input type="checkbox" data-fy="' + y + '"' + (UI.mxYears.indexOf(y) >= 0 ? ' checked' : '') + '> ' + y + '</label>'; }).join('') + '</div>';
    }
    if (o.cicle !== false) {
      html += '<div class="field fb-cic"><label for="fb-cicle">Objectius del cicle</label><select id="fb-cicle">' + cicleList(s).map(function (c) { return '<option value="' + c + '"' + (c === curCicle(s) ? ' selected' : '') + '>PLAENSA ' + c + (c === UI.prev ? ' (s\'avaluen ara)' : c === UI.year ? ' (propers)' : '') + '</option>'; }).join('') + '</select></div>';
    }
    return html + '</div>';
  }
  function bindFilterBar(s) {
    var sk = scopeKeys(s), m = meta(s);
    $all('.fbar details.dd').forEach(function (d) { d.addEventListener('toggle', function () { if (d.open) { UI.openDD = d.dataset.dd; $all('.fbar details.dd').forEach(function (x) { if (x !== d) x.open = false; }); } else if (UI.openDD === d.dataset.dd) UI.openDD = ''; }); });
    function setC(arr) { UI.selC = arr && arr.length === sk.length ? null : arr; render(); }
    function setQ(arr) { UI.selQ = arr && arr.length === m.qs.length ? null : arr; render(); }
    $all('[data-fc]').forEach(function (b) { b.onclick = function () { setC(b.dataset.fc === 'all' ? null : []); }; });
    $all('[data-fcs]').forEach(function (b) { b.onclick = function () { setC(sk.filter(function (k) { return S.centres[k].sector === b.dataset.fcs; })); }; });
    $all('[data-fck]').forEach(function (i) { i.onchange = function () { setC($all('[data-fck]').filter(function (x) { return x.checked; }).map(function (x) { return x.dataset.fck; })); }; });
    $all('[data-fq]').forEach(function (b) {
      b.onclick = function () {
        var t = b.dataset.fq;
        setQ(t === 'all' ? null : t === 'none' ? [] : m.qs.filter(function (q) { return t === 'trans' ? isTrans(s, q) : t === 'esp' ? isEsp(s, q) : isCpr(s, q); }));
      };
    });
    $all('[data-fqk]').forEach(function (i) { i.onchange = function () { setQ($all('[data-fqk]').filter(function (x) { return x.checked; }).map(function (x) { return x.dataset.fqk; })); }; });
    $all('[data-fy]').forEach(function (i) { i.onchange = function () { UI.mxYears = $all('[data-fy]').filter(function (x) { return x.checked; }).map(function (x) { return +x.dataset.fy; }).sort(function (a, b) { return b - a; }); render(); }; });
    var c = $('#fb-cicle'); if (c) c.onchange = function () { UI.cicle = +this.value; render(); };
  }

  /* ---------- Titulars (vinculats als filtres actius) ---------- */
  function txtD(q, d) { return d == null ? '' : fmtD(q, d); }
  function shortQ(s, q) { return qshort(s, q, 60); }
  function stripOf(s, keys, q, y) {
    return keys.map(function (k) { var v = val(s, y || UI.year, k, q); return { name: cname(k), tone: sem(q, v), label: fmt(q, v), v: norm(q, v) }; })
      .filter(function (x) { return x.v != null; }).sort(function (a, b) { return a.v - b.v; });
  }
  function hlViz(z) {
    if (!z) return '';
    if (z.t === 'bullet') {
      var pos = function (x) { return Math.max(0, Math.min(100, (x - 40) / 60 * 100)); };
      return '<div class="hv-bullet" role="img" aria-label="' + esc(z.label) + '"><span class="band r" style="left:0;width:' + pos(75) + '%"></span><span class="band a" style="left:' + pos(75) + '%;width:' + (pos(90) - pos(75)) + '%"></span><span class="band g" style="left:' + pos(90) + '%;width:' + (100 - pos(90)) + '%"></span>' +
        '<span class="bar t-' + z.tone + '" style="width:' + pos(z.v) + '%"></span>' + (z.cat != null ? '<span class="tick" style="left:' + pos(z.cat) + '%"></span>' : '') + '</div>' +
        '<div class="hv-legend"><span>' + z.lo + '</span>' + (z.cat != null ? '<span><i class="tk"></i>Catalunya</span>' : '') + '<span>' + z.hi + '</span></div>';
    }
    if (z.t === 'dist') {
      var tot = z.parts.reduce(function (a, p) { return a + p.n; }, 0) || 1;
      return '<div class="hv-dist" role="img">' + z.parts.map(function (p) { return p.n ? '<span class="t-' + p.tone + '" style="width:' + (p.n / tot * 100) + '%" title="' + esc(p.label + ': ' + p.n) + '"></span>' : ''; }).join('') + '</div>' +
        '<div class="hv-legend">' + z.parts.map(function (p) { return '<span><i class="sq t-' + p.tone + '"></i>' + esc(p.label) + ' <b>' + p.n + '</b> · ' + pct(p.n, tot) + '</span>'; }).join('') + '</div>';
    }
    if (z.t === 'strip') {
      return '<div class="hv-strip' + (z.items.length > 30 ? ' dense' : '') + '" role="img" aria-label="' + esc(z.label || '') + '">' + z.items.map(function (x) { return '<span class="t-' + x.tone + '" title="' + esc(x.name + ' · ' + x.label) + '"></span>'; }).join('') + '</div>' +
        '<div class="hv-legend"><span>' + esc(z.left || 'pitjor') + '</span><span>' + esc(z.right || 'millor') + '</span></div>';
    }
    if (z.t === 'rank') {
      return '<ul class="hv-rank">' + z.items.map(function (x) { return '<li><span class="nm">' + (x.html || esc(x.name)) + '</span><span class="tr"><span class="t-' + x.tone + '" style="width:' + Math.max(2, Math.min(100, (x.v - (z.min || 0)) / (100 - (z.min || 0)) * 100)) + '%"></span></span><span class="vl">' + esc(x.label) + '</span></li>'; }).join('') + '</ul>';
    }
    if (z.t === 'swing') {
      var mx = Math.max(Math.abs(z.up ? z.up.d : 0), Math.abs(z.down ? z.down.d : 0)) || 1;
      var row = function (r, dir) {
        if (!r) return '<div class="sw-row none"><span class="sw-ar ' + dir + '">' + (dir === 'up' ? '▲' : '▼') + '</span><span class="sw-none">' + (dir === 'up' ? 'Cap centre millora' : 'Cap centre empitjora') + '</span></div>';
        return '<div class="sw-row"><span class="sw-ar ' + dir + '">' + (dir === 'up' ? '▲' : '▼') + '</span><span class="sw-v ' + dir + '">' + esc(r.label) + '</span><span class="sw-c">' + r.html + '<span class="sw-bar"><i class="' + dir + '" style="width:' + Math.max(4, Math.abs(r.d) / mx * 100) + '%"></i></span><small>' + esc(r.note || '') + '</small></span></div>';
      };
      return '<div class="hv-swing">' + row(z.up, 'up') + row(z.down, 'down') + '</div>';
    }
    if (z.t === 'html') return z.html;
    return '';
  }
  function hl(items, chips) {
    items = items.filter(Boolean);
    if (!items.length) return '';
    return '<section class="hl" aria-label="Titulars"><header class="hl-head"><span class="hl-eyebrow">Titulars</span><span class="hl-chips">' + chips.map(function (c) { return '<span class="chip-f">' + esc(c) + '</span>'; }).join('') + '</span></header><div class="hl-grid">' +
      items.map(function (h) {
        if (h.hint) return '<article class="hl-card t-n hl-hint"><p class="hl-text">' + esc(h.hint) + '</p></article>';
        return '<article class="hl-card t-' + h.tone + '"><div class="hl-kicker"><span class="dot ' + h.tone + '"></span>' + esc(h.kicker) + '</div>' + (h.big ? '<div class="hl-big">' + esc(h.big) + '</div>' : '') + (h.text || h.textHtml ? '<p class="hl-text">' + (h.textHtml || esc(h.text)) + '</p>' : '') + hlViz(h.viz) + (h.sub ? '<div class="hl-sub">' + esc(h.sub) + '</div>' : '') + '</article>';
      }).join('') + '</div></section>';
  }
  function chips(s, o) {
    o = o || {};
    var c = [scopeName(), 'PLAENSA ' + UI.year + (UI.prev ? ' vs ' + UI.prev : '')];
    if (o.c && UI.selC) c.push(selKeys(s).length + ' de ' + scopeKeys(s).length + ' centres');
    if (o.q && UI.selQ) c.push(selQs(s).length + ' de ' + meta(s).qs.length + ' preguntes');
    if (o.cicle) c.push('Objectius ' + curCicle(s));
    return c;
  }
  function sigLabel(t) { return t.st === 'sig' ? 'concloent' + (t.est ? ' (n estimada)' : '') : t.st === 'rel' ? 'canvi rellevant' : 'no concloent' + (t.est ? ' (n estimada)' : ''); }

  function hCat(s, K, q) {
    var cat = val(s, UI.year, 'CAT', q), vs = cvals(s, UI.year, K, q);
    if (!vs.length) return null;
    var st = stripOf(s, K, q), mn = st[0], mxv = st[st.length - 1], o = off(s, UI.year, q);
    if (cat == null) {
      var nr = st.filter(function (x) { return x.tone === 'r'; }).length;
      return { tone: nr ? 'r' : 'g', kicker: qname(s, q), big: nr + ' de ' + st.length, text: 'centres en àrea de millora', viz: { t: 'strip', items: st }, sub: 'Rang ' + mn.label + ' – ' + mxv.label + (o != null ? ' · RSBMN oficial ' + fmt(q, o) : '') };
    }
    var below = vs.filter(function (x) { return round3(x.v) < round3(cat); }).length;
    return { tone: below > vs.length / 2 ? 'r' : below ? 'a' : 'g', kicker: qname(s, q) + ' · Catalunya ' + fmt(q, cat), big: below + ' de ' + vs.length, text: 'centres per sota de Catalunya',
      viz: { t: 'strip', items: st }, sub: 'Rang de centres ' + mn.label + ' – ' + mxv.label + (o != null ? ' · RSBMN oficial ' + fmt(q, o) : '') };
  }
  function hLead(s, K, q) {
    var vs = cvals(s, UI.year, K, q).sort(function (a, b) { return b.v - a.v; });
    if (vs.length < 2) return null;
    var b = vs[0], w = vs[vs.length - 1], cat = val(s, UI.year, 'CAT', q);
    var items = vs.slice(0, 4).concat(vs.length > 5 ? [] : vs.slice(4));
    if (vs.length > 5) items.push(w);
    return { tone: sem(q, b.v), kicker: 'Lidera · ' + qname(s, q), big: fmt(q, b.v), textHtml: cnameHtml(b.k, 'md'),
      viz: { t: 'rank', min: is101(q) ? 60 : 50, items: items.map(function (x) { return { html: cnameHtml(x.k), v: as100(q, x.v), tone: sem(q, x.v), label: fmt(q, x.v) }; }) },
      sub: 'Últim: ' + cname(w.k) + ' (' + fmt(q, w.v) + ') · bretxa ' + fmtD(q, b.v - w.v).replace('+', '') + (cat != null ? ' · Catalunya ' + fmt(q, cat) : '') };
  }
  function hSwing(s, K, q) {
    if (!UI.prev) return null;
    if (!comparable(s, q)) return null;
    var ch = cchanges(s, K, q);
    if (!ch.length) return null;
    var up = ch.filter(function (x) { return x.d > 0; }).sort(function (a, b) { return b.d - a.d; })[0];
    var dn = ch.filter(function (x) { return x.d < 0; }).sort(function (a, b) { return a.d - b.d; })[0];
    var nu = ch.filter(function (x) { return dcls(q, x.d) === 'up'; }).length, nd = ch.filter(function (x) { return dcls(q, x.d) === 'down'; }).length;
    var mk = function (x) { if (!x) return null; var t = sigTest(s, x.k, q, UI.year, UI.prev); return { d: as100(q, x.d) || x.d * 100, label: fmtD(q, x.d), html: cnameHtml(x.k), note: fmt(q, val(s, UI.prev, x.k, q)) + ' → ' + fmt(q, val(s, UI.year, x.k, q)) + ' · ' + sigLabel(t) }; };
    return { tone: dn && (!up || Math.abs(dn.d) > up.d) ? 'r' : 'g', kicker: 'Canvis ' + UI.prev + ' → ' + UI.year + ' · ' + qname(s, q), viz: { t: 'swing', up: mk(up), down: mk(dn) },
      sub: 'Canvis rellevants (' + (is101(q) ? '±' + String(S.config.thr.diff101).replace('.', ',') : '±' + S.config.thr.diff * 100 + ' pp') + '): ' + nu + ' milloren, ' + nd + ' empitjoren' };
  }
  function hWeak(s, K, Q) {
    var best = null;
    Q.forEach(function (q) {
      var vs = cvals(s, UI.year, K, q); if (!vs.length) return;
      var nr = vs.filter(function (x) { return sem(q, x.v) === 'r'; }).length, mn = Math.min.apply(null, vs.map(function (x) { return norm(q, x.v); }));
      if (!best || nr > best.nr || (nr === best.nr && mn < best.mn)) best = { q: q, nr: nr, n: vs.length, mn: mn };
    });
    if (!best) return null;
    return { tone: best.nr ? 'r' : 'a', kicker: 'Pregunta més feble', big: best.nr + ' de ' + best.n, text: 'centres en vermell a «' + shortQ(s, best.q) + '»', viz: { t: 'strip', items: stripOf(s, K, best.q) }, sub: 'Catalunya ' + fmt(best.q, val(s, UI.year, 'CAT', best.q)) };
  }
  function hEvol(s, K, Q) {
    if (!UI.prev) return null;
    var tr = transitions(s, K, Q, UI.year, UI.prev), up = 0, dn = 0, eq = 0;
    Object.keys(tr.byK).forEach(function (k) { up += tr.byK[k].up; dn += tr.byK[k].down; eq += tr.byK[k].eq; });
    if (!(up + dn + eq)) return null;
    return { tone: up > dn ? 'g' : dn > up ? 'r' : 'a', kicker: 'Canvis d\'àrea ' + UI.prev + ' → ' + UI.year, big: up + ' ▲  ' + dn + ' ▼', text: up >= dn ? 'Més resultats pugen d\'àrea que no pas en baixen' : 'Més resultats baixen d\'àrea que no pas en pugen',
      viz: { t: 'dist', parts: [{ n: dn, tone: 'r', label: 'Baixen' }, { n: eq, tone: 'n', label: 'Es mantenen' }, { n: up, tone: 'g', label: 'Pugen' }] }, sub: 'Resultats centre·pregunta comparables' };
  }

  var HL = {
    resum: function (s) {
      var K = scopeKeys(s), Q = meta(s).qs;
      if (K.length < 2) return [{ hint: 'Cal almenys 2 centres a l\'àmbit per generar titulars comparatius.' }];
      return [hCat(s, K, 'P101'), hLead(s, K, 'P101'), hSwing(s, K, 'P101'), hWeak(s, K, Q), hCat(s, K, 'P102'), hLead(s, K, 'P102'), hSwing(s, K, 'P102'), hEvol(s, K, Q)];
    },
    sf: function (s) {
      var K = scopeKeys(s);
      if (K.length < 2) return [{ hint: 'Cal almenys 2 centres a l\'àmbit per comparar.' }];
      return [hCat(s, K, 'P101'), hLead(s, K, 'P101'), hSwing(s, K, 'P101'), hCat(s, K, 'P102'), hLead(s, K, 'P102'), hSwing(s, K, 'P102')];
    },
    semafor: function (s) {
      var m = meta(s), K = selKeys(s), Q = selQs(s), out = [], dist = { r: 0, a: 0, g: 0 }, byQ = {}, byK = {};
      K.forEach(function (k) { Q.forEach(function (q) { var v = val(s, UI.year, k, q); if (v == null) return; var t = sem(q, v); dist[t]++; if (t === 'r') { byQ[q] = (byQ[q] || 0) + 1; byK[k] = (byK[k] || 0) + 1; } }); });
      var tot = dist.r + dist.a + dist.g;
      if (!tot) return [{ hint: 'Selecciona almenys un centre i una pregunta.' }];
      out.push({ tone: dist.r / tot > 0.25 ? 'r' : dist.r ? 'a' : 'g', kicker: 'Mapa del semàfor', big: pct(dist.r, tot), text: dist.r + ' de ' + tot + ' resultats centre·pregunta en àrea de millora',
        viz: { t: 'dist', parts: [{ n: dist.r, tone: 'r', label: 'Vermell' }, { n: dist.a, tone: 'a', label: 'Taronja' }, { n: dist.g, tone: 'g', label: 'Verd' }] } });
      if (K.length === 1) {
        var k = K[0], vs = Q.map(function (q) { return { q: q, v: val(s, UI.year, k, q) }; }).filter(function (x) { return x.v != null; }).sort(function (a, b) { return norm(a.q, a.v) - norm(b.q, b.v); });
        if (vs.length) {
          out.push({ tone: sem(vs[0].q, vs[0].v), kicker: 'Punt més feble · ' + cname(k), big: fmt(vs[0].q, vs[0].v), text: qname(s, vs[0].q), sub: 'Catalunya ' + fmt(vs[0].q, val(s, UI.year, 'CAT', vs[0].q)) });
          var b = vs[vs.length - 1];
          if (vs.length > 1) out.push({ tone: sem(b.q, b.v), kicker: 'Punt fort · ' + cname(k), big: fmt(b.q, b.v), text: qname(s, b.q), sub: 'Catalunya ' + fmt(b.q, val(s, UI.year, 'CAT', b.q)) });
        }
        out.push(hEvol(s, K, Q));
        return out;
      }
      var qw = Object.keys(byQ).sort(function (a, b) { return byQ[b] - byQ[a] || qSort(a, b); })[0];
      if (qw) out.push({ tone: 'r', kicker: 'Pregunta crítica', big: byQ[qw] + ' de ' + K.length, text: 'centres en vermell a «' + shortQ(s, qw) + '»', sub: 'Catalunya ' + fmt(qw, val(s, UI.year, 'CAT', qw)), viz: { t: 'strip', items: stripOf(s, K, qw) } });
      var secs = m.sectors.filter(function (sc) { return K.some(function (k) { return S.centres[k].sector === sc; }); });
      if (!UI.sector && secs.length > 1) {
        var sr = secs.map(function (sc) {
          var ks = K.filter(function (k) { return S.centres[k].sector === sc; }), r = 0, n = 0;
          ks.forEach(function (k) { Q.forEach(function (q) { var v = val(s, UI.year, k, q); if (v == null) return; n++; if (sem(q, v) === 'r') r++; }); });
          return { name: sc, v: n ? r / n * 100 : 0, tone: 'r', label: pct(r, n) };
        }).sort(function (a, b) { return b.v - a.v; });
        out.push({ tone: 'r', kicker: 'Sector amb més vermells', big: sr[0].label, text: sr[0].name, sub: 'Proporció de resultats en vermell dels seus centres', viz: { t: 'rank', min: 0, items: sr.map(function (x) { return { name: x.name, v: Math.min(100, x.v * 2), tone: 'r', label: x.label }; }) } });
      }
      var kw = Object.keys(byK).sort(function (a, b) { return byK[b] - byK[a]; })[0];
      if (kw) out.push({ tone: 'r', kicker: 'Centre amb més vermells', big: byK[kw] + ' de ' + Q.length, textHtml: cnameHtml(kw, 'md') + ' preguntes en àrea de millora',
        viz: { t: 'strip', items: Q.map(function (q) { var v = val(s, UI.year, kw, q); return { name: qname(s, q), tone: sem(q, v), label: fmt(q, v), v: norm(q, v) }; }).filter(function (x) { return x.v != null; }).sort(function (a, b) { return a.v - b.v; }), left: 'preguntes pitjors', right: 'millors' } });
      return out;
    },
    comp: function (s) {
      var K = selKeys(s), Q = selQs(s), out = [];
      if (K.length < 2 && Q.length < 2) return [{ hint: 'Amb un sol centre i una sola pregunta no hi ha res a comparar: selecciona més centres o preguntes.' }];
      if (K.length >= 2) {
        var means = K.map(function (k) { return { k: k, v: mean(Q.map(function (q) { return as100(q, val(s, UI.year, k, q)); })) }; }).filter(function (x) { return x.v != null; }).sort(function (a, b) { return b.v - a.v; });
        var tn = function (v) { return v < S.config.thr.red * 100 ? 'r' : v < S.config.thr.green * 100 ? 'a' : 'g'; };
        if (means.length > 1) out.push({ tone: tn(means[0].v), kicker: Q.length === 1 ? 'Lidera · ' + qshort(s, Q[0], 40) : 'Lidera la selecció (' + Q.length + ' preguntes)', big: means[0].v.toFixed(1).replace('.', ',') + '%', textHtml: cnameHtml(means[0].k, 'md'),
          viz: { t: 'rank', min: 40, items: means.slice(0, 6).map(function (x) { return { html: cnameHtml(x.k), v: x.v, tone: tn(x.v), label: x.v.toFixed(1).replace('.', ',') + '%' }; }) }, sub: Q.length > 1 ? 'Resultat mitjà del centre a les preguntes triades' : '' });
        var gaps = Q.map(function (q) {
          var vs = cvals(s, UI.year, K, q).sort(function (a, b) { return b.v - a.v; });
          return vs.length > 1 ? { q: q, hi: vs[0], lo: vs[vs.length - 1], g: norm(q, vs[0].v) - norm(q, vs[vs.length - 1].v) } : null;
        }).filter(Boolean).sort(function (a, b) { return b.g - a.g; });
        if (gaps.length) {
          var g = gaps[0];
          out.push({ tone: g.g > 0.15 ? 'r' : g.g > 0.05 ? 'a' : 'g', kicker: 'Bretxa més gran entre centres', big: fmtD(g.q, g.hi.v - g.lo.v).replace('+', ''), text: qname(s, g.q),
            viz: { t: 'rank', min: 40, items: [g.hi, g.lo].map(function (x) { return { html: cnameHtml(x.k), v: as100(g.q, x.v), tone: sem(g.q, x.v), label: fmt(g.q, x.v) }; }) } });
        }
      }
      var below = 0, above = 0;
      K.forEach(function (k) { Q.forEach(function (q) { var v = val(s, UI.year, k, q), c = val(s, UI.year, 'CAT', q); if (v == null || c == null) return; if (round3(v) < round3(c)) below++; else above++; }); });
      if (below + above >= 2) out.push({ tone: below > above ? 'r' : below ? 'a' : 'g', kicker: 'Respecte a Catalunya', big: below + ' de ' + (below + above), text: 'resultats de la selecció per sota de Catalunya',
        viz: { t: 'dist', parts: [{ n: below, tone: 'r', label: 'Per sota' }, { n: above, tone: 'g', label: 'Igual o per sobre' }] } });
      return out;
    },
    cpr: function (s) {
      var m = meta(s), K = selKeys(s), out = [], cpr = cfg(s).cpr.filter(function (q) { return m.qs.indexOf(q) >= 0; });
      if (cpr.length && UI.prev) {
        var items = [], full = 0, koQ = {};
        K.forEach(function (k) {
          var ok = 0, tot = 0;
          cpr.forEach(function (q) { var r = cprStatus(s, k, q); if (r.st === 'nd') return; tot++; if (r.st === 'ok') ok++; else koQ[q] = (koQ[q] || 0) + 1; });
          if (!tot) return;
          var p = ok / tot * 100; if (p === 100) full++;
          items.push({ name: cname(k), tone: p === 100 ? 'g' : p >= 50 ? 'a' : 'r', label: Math.round(p) + '%', v: p });
        });
        items.sort(function (a, b) { return a.v - b.v; });
        if (items.length) out.push({ tone: full === items.length ? 'g' : full >= items.length / 2 ? 'a' : 'r', kicker: 'Objectiu CPR ' + UI.year, big: full + ' de ' + items.length, text: 'centres assoleixen totes les preguntes CPR', sub: 'Assoliment mitjà dels centres ' + Math.round(mean(items.map(function (x) { return x.v; })) || 0) + '%', viz: { t: 'strip', items: items, left: 'menys assoliment', right: 'més assoliment' } });
        var qk = Object.keys(koQ).sort(function (a, b) { return koQ[b] - koQ[a]; })[0];
        if (qk) out.push({ tone: 'r', kicker: 'CPR més incomplerta', big: koQ[qk] + ' centres', text: 'empitjoren a «' + shortQ(s, qk) + '»', sub: 'Catalunya ' + fmt(qk, val(s, UI.year, 'CAT', qk)), viz: { t: 'strip', items: stripOf(s, K, qk) } });
      } else out.push({ tone: 'n', kicker: 'Objectiu CPR', big: '—', text: cpr.length ? 'Cal un any de comparació per avaluar la CPR' : 'Aquest estudi no té preguntes CPR definides', sub: cpr.length ? '' : 'Es poden marcar a «Objectius i configuració»' });
      var acts = S.actions.filter(function (a) { return a.study === s && K.indexOf(a.centre) >= 0; });
      var ev = { efectiva: 0, 'no efectiva': 0, 'no concloent': 0, pendent: 0 };
      acts.forEach(function (a) { ev[evalAction(s, a).st]++; });
      out.push({ tone: ev['no efectiva'] ? 'r' : acts.length ? 'g' : 'a', kicker: 'Plans d\'acció', big: String(acts.length), text: acts.length ? 'accions registrades' : 'Encara no hi ha accions registrades',
        viz: acts.length ? { t: 'dist', parts: [{ n: ev['no efectiva'], tone: 'r', label: 'No efectives' }, { n: ev['no concloent'] + ev.pendent, tone: 'a', label: 'Pendents o no concloents' }, { n: ev.efectiva, tone: 'g', label: 'Efectives' }] } : null,
        sub: K.filter(function (k) { return m.qs.some(function (q) { return sem(q, val(s, UI.year, k, q)) === 'r'; }) && !acts.some(function (a) { return a.centre === k; }); }).length + ' centres amb indicadors en vermell sense cap acció' });
      return out;
    }
  };

  /* ---------- 1. Resum i conclusions ---------- */
  function transTable(s, K, Q) {
    var tr = transitions(s, K, Q, UI.year, UI.prev), z = ['g', 'a', 'r'], lbl = { g: 'Excel·lència ≥ 90%', a: 'Estàndard 75–89,9%', r: 'Millora < 75%' };
    var tot = 0; z.forEach(function (f) { z.forEach(function (t) { tot += tr.mx[f][t]; }); });
    if (!tot) return '';
    var colT = {}, rowT = {}; z.forEach(function (f) { rowT[f] = 0; z.forEach(function (t) { rowT[f] += tr.mx[f][t]; colT[t] = (colT[t] || 0) + tr.mx[f][t]; }); });
    var rank = { r: 0, a: 1, g: 2 };
    var html = '<div class="tm-wrap"><table class="tm"><thead><tr><th class="tm-c">' + UI.prev + ' ↓ · ' + UI.year + ' →</th>' + z.map(function (t) { return '<th><span class="dot ' + t + '"></span> ' + lbl[t] + '</th>'; }).join('') + '<th>Total ' + UI.prev + '</th></tr></thead><tbody>' +
      z.map(function (f) {
        return '<tr><th><span class="dot ' + f + '"></span> ' + lbl[f] + '</th>' + z.map(function (t) {
          var n = tr.mx[f][t], cls = rank[t] > rank[f] ? 'up' : rank[t] < rank[f] ? 'down' : 'eq';
          return '<td class="tm-' + cls + '"><b>' + n + '</b><small>' + pct(n, tot) + '</small></td>';
        }).join('') + '<td class="tm-t">' + rowT[f] + '</td></tr>';
      }).join('') + '<tr class="tm-tot"><th>Total ' + UI.year + '</th>' + z.map(function (t) { return '<td>' + colT[t] + '</td>'; }).join('') + '<td>' + tot + '</td></tr></tbody></table>' +
      '<div class="legend"><span><span class="sw" style="background:var(--tint-up)"></span>Pugen d\'àrea</span><span><span class="sw" style="background:var(--surface-2)"></span>Es mantenen</span><span><span class="sw" style="background:var(--tint-down)"></span>Baixen d\'àrea</span><span>Resultats centre·pregunta comparables de ' + K.length + ' centres</span></div></div>';
    var rows = K.map(function (k) { var o = tr.byK[k], n1 = { g: 0, r: 0 }; Q.forEach(function (q) { var t = sem(q, val(s, UI.year, k, q)); if (n1[t] != null) n1[t]++; }); return { k: k, up: o.up, eq: o.eq, down: o.down, g: n1.g, r: n1.r, net: o.up - o.down }; })
      .sort(function (a, b) { return b.net - a.net || b.g - a.g; });
    html += '<div class="tscroll" style="margin-top:12px"><table class="t"><thead><tr><th>Centre</th><th class="v">Excel·lència ' + UI.year + '</th><th class="v">Millora ' + UI.year + '</th><th class="v">Pugen d\'àrea</th><th class="v">Es mantenen</th><th class="v">Baixen d\'àrea</th><th class="v">Saldo</th></tr></thead><tbody>' +
      rows.map(function (r) { return '<tr><td>' + cnameHtml(r.k) + '</td><td class="v">' + r.g + '</td><td class="v">' + r.r + '</td><td class="v d-up">' + r.up + '</td><td class="v">' + r.eq + '</td><td class="v d-down">' + r.down + '</td><td class="v"><b class="' + (r.net > 0 ? 'd-up' : r.net < 0 ? 'd-down' : 'd-eq') + '">' + (r.net > 0 ? '+' : '') + r.net + '</b></td></tr>'; }).join('') + '</tbody></table></div>';
    return html;
  }
  function renderResum(el, s) {
    var m = meta(s), K = scopeKeys(s), Q = m.qs;
    var html = hl(HL.resum(s), chips(s));
    html += '<div class="block"><h3 class="sec-h">Conclusions per a direcció · canvis d\'àrea ' + (UI.prev ? UI.prev + ' → ' + UI.year : UI.year) + '</h3>' +
      (UI.prev ? transTable(s, K, Q) : '<div class="note">Tria un any de comparació per veure quantes preguntes canvien d\'àrea.</div>') + '</div>';
    // Top 5 preguntes per nombre de centres en verd / vermell (sense mitjanes)
    var qc = Q.map(function (q) { var vs = cvals(s, UI.year, K, q); return { q: q, n: vs.length, g: vs.filter(function (x) { return sem(q, x.v) === 'g'; }).length, r: vs.filter(function (x) { return sem(q, x.v) === 'r'; }).length, cat: val(s, UI.year, 'CAT', q) }; }).filter(function (x) { return x.n; });
    var topG = qc.slice().sort(function (a, b) { return b.g - a.g || (b.cat || 0) - (a.cat || 0); }).slice(0, 5), topR = qc.slice().sort(function (a, b) { return b.r - a.r || (a.cat || 1) - (b.cat || 1); }).slice(0, 5);
    var rankQ = function (list, key, tone) {
      return '<ol class="rank">' + list.map(function (x, i) { return '<li><span class="pos">' + (i + 1) + '</span><span class="lbl">' + qhtml(s, x.q) + qtags(s, x.q) + '<small>Catalunya ' + fmt(x.q, x.cat) + '</small></span><span class="pill ' + tone + '"><span class="dot ' + tone + '"></span>' + x[key] + ' de ' + x.n + ' centres</span></li>'; }).join('') + '</ol>';
    };
    var cells = [];
    K.forEach(function (k) { Q.forEach(function (q) { var v = val(s, UI.year, k, q); if (v != null) cells.push({ k: k, q: q, v: v, n: norm(q, v) }); }); });
    var rankC = function (list) {
      return '<ol class="rank">' + list.map(function (x, i) { return '<li><span class="pos">' + (i + 1) + '</span><span class="lbl">' + cnameHtml(x.k) + '<small>' + esc(qname(s, x.q)) + '</small></span><span class="pill ' + sem(x.q, x.v) + '"><span class="dot ' + sem(x.q, x.v) + '"></span>' + fmt(x.q, x.v) + '</span></li>'; }).join('') + '</ol>';
    };
    html += '<div class="grid g2x" style="margin-top:16px">' +
      '<div class="block"><h3>Preguntes amb més centres en excel·lència</h3>' + rankQ(topG, 'g', 'g') + '</div>' +
      '<div class="block"><h3>Preguntes amb més centres en àrea de millora</h3>' + rankQ(topR, 'r', 'r') + '</div>' +
      '<div class="block"><h3>Top 5 millors resultats centre·pregunta</h3>' + rankC(cells.slice().sort(function (a, b) { return b.n - a.n; }).slice(0, 5)) + '</div>' +
      '<div class="block"><h3>Top 5 pitjors resultats centre·pregunta</h3>' + rankC(cells.slice().sort(function (a, b) { return a.n - b.n; }).slice(0, 5)) + '</div></div>';
    html += '<div class="block" style="margin-top:16px"><h3>Millor i pitjor resultat per sector (' + UI.year + ')</h3><div class="tscroll"><table class="t"><thead><tr><th>Sector</th><th>Classificació</th><th>Centre</th><th>Pregunta</th><th class="v">Resultat</th></tr></thead><tbody>';
    (UI.sector ? [UI.sector] : m.sectors).forEach(function (sc) {
      var ex = extremes(s, UI.year, m.active.filter(function (k) { return S.centres[k].sector === sc; }), Q);
      [['Millor', ex.best, 'g'], ['Pitjor', ex.worst, 'r']].forEach(function (t) {
        t[1].forEach(function (c) { html += '<tr><td>' + esc(sc) + '</td><td><span class="pill ' + t[2] + '">' + t[0] + '</span></td><td>' + cnameHtml(c.k) + '</td><td>' + qhtml(s, c.q) + '</td><td class="v">' + fmt(c.q, val(s, UI.year, c.k, c.q)) + '</td></tr>'; });
      });
    });
    html += '</tbody></table></div></div>';
    html += '<div class="block card" style="margin-top:16px"><h3>Distribució dels ' + K.length + ' centres per àrea a cada pregunta (' + UI.year + ')</h3><div class="chart-box tall"><canvas id="c-qs"></canvas></div><div class="note">Cada barra compta quants centres són en excel·lència, estàndard o millora (no és una mitjana). El valor de Catalunya apareix en passar el ratolí per sobre de la barra.</div></div>';
    html += '<div style="margin-top:12px">' + sigNote(s) + '</div>';
    el.innerHTML = html;
    var labels = qc.map(function (x) { return wrapLabel(qshort(s, x.q, 70), 38); });
    chart('c-qs', {
      type: 'bar',
      data: { labels: labels, datasets: [
        { label: 'Millora', data: qc.map(function (x) { return x.r; }), backgroundColor: semColor('r'), stack: 's' },
        { label: 'Estàndard', data: qc.map(function (x) { return x.n - x.r - x.g; }), backgroundColor: semColor('a'), stack: 's' },
        { label: 'Excel·lència', data: qc.map(function (x) { return x.g; }), backgroundColor: semColor('g'), stack: 's' }] },
      options: { indexAxis: 'y', scales: { x: { stacked: true, max: K.length, ticks: { stepSize: 1 } }, y: { stacked: true, ticks: { autoSkip: false, font: { size: 11 } }, grid: { display: false } } },
        plugins: { tooltip: { callbacks: { title: function (it) { var x = qc[it[0].dataIndex]; return qname(s, x.q) + ' · Catalunya ' + fmt(x.q, x.cat); }, label: function (c) { return c.dataset.label + ': ' + c.parsed.x + ' centres'; } } } } }
    });
  }

  /* ---------- 2. Satisfacció i Fidelitat (taula ordenable) ---------- */
  function renderSF(el, s) {
    var m = meta(s), K = scopeKeys(s), y = UI.year, p = UI.prev;
    var cols = [
      { id: 'centre', lbl: 'Centre' }, { id: 'sector', lbl: 'Sector' },
      { id: 's1', lbl: 'Satisfacció global ' + y + ' (0–10)', q: 'P101', yy: y }, { id: 's0', lbl: 'Satisfacció global ' + (p || ''), q: 'P101', yy: p, hide: !p }, { id: 'sd', lbl: 'Diferència satisfacció', q: 'P101', d: true, hide: !p },
      { id: 'f1', lbl: 'Fidelitat ' + y + ' (%)', q: 'P102', yy: y }, { id: 'f0', lbl: 'Fidelitat ' + (p || '') + ' (%)', q: 'P102', yy: p, hide: !p }, { id: 'fd', lbl: 'Diferència fidelitat', q: 'P102', d: true, hide: !p }
    ].filter(function (c) { return !c.hide; });
    function cellVal(k, c) {
      if (c.id === 'centre') return cname(k); if (c.id === 'sector') return (S.centres[k] || {}).sector || '';
      if (c.d) return k === 'CAT' || k === 'RSBMN' ? (comparable(s, c.q) && val(s, y, k, c.q) != null && val(s, p, k, c.q) != null ? val(s, y, k, c.q) - val(s, p, k, c.q) : null) : dif(s, k, c.q, y, p);
      return val(s, c.yy, k, c.q);
    }
    var srt = UI.sfSort, col = cols.filter(function (c) { return c.id === srt.col; })[0] || cols[1];
    var rows = K.slice().sort(function (a, b) {
      if (col.id === 'sector') return centreSort(a, b) * srt.dir;
      var x = cellVal(a, col), z = cellVal(b, col);
      if (x == null && z == null) return 0; if (x == null) return 1; if (z == null) return -1;
      return (typeof x === 'string' ? x.localeCompare(z, 'ca') : x - z) * srt.dir;
    });
    var refs = ['CAT'].concat(hasOff(s, y) ? ['RSBMN'] : []);
    function td(k, c) {
      var v = cellVal(k, c);
      if (c.id === 'centre') return '<td>' + (k === 'CAT' ? '<b>Catalunya</b>' : k === 'RSBMN' ? '<b>RSBMN (valor oficial)</b>' : cnameHtml(k)) + '</td>';
      if (c.id === 'sector') return '<td class="muted">' + esc(k === 'CAT' || k === 'RSBMN' ? 'Referència' : v) + '</td>';
      if (c.d) { var sg = k !== 'CAT' && k !== 'RSBMN' ? sigTest(s, k, c.q, y, p) : null; return '<td class="v">' + dspan(c.q, v) + (sg && sg.st === 'sig' && !sg.est ? '*' : '') + '</td>'; }
      if (c.yy === y) return '<td class="v"><span class="pill ' + sem(c.q, v) + '"><span class="dot ' + sem(c.q, v) + '"></span>' + fmt(c.q, v) + '</span></td>';
      return '<td class="v muted">' + fmt(c.q, v) + '</td>';
    }
    var html = hl(HL.sf(s), chips(s)) +
      '<div class="grid g2"><div class="card block"><h3>Satisfacció global per centre (0–10)</h3><div class="chart-box"><canvas id="c-101"></canvas></div></div>' +
      '<div class="card block"><h3>Fidelitat per centre (% que continuaria venint)</h3><div class="chart-box"><canvas id="c-102"></canvas></div></div></div>' +
      '<div class="block" style="margin-top:16px"><h3>Taula de satisfacció i fidelitat <small class="muted">· fes clic a una capçalera per ordenar</small></h3><div class="tscroll"><table class="t sortable"><thead><tr>' +
      cols.map(function (c) { return '<th class="' + (c.q ? 'v' : '') + '"><button type="button" class="th-sort" data-sort="' + c.id + '">' + esc(c.lbl) + (srt.col === c.id ? (srt.dir > 0 ? ' ▲' : ' ▼') : ' <span class="muted">↕</span>') + '</button></th>'; }).join('') + '</tr></thead><tbody>' +
      refs.map(function (k) { return '<tr class="ref">' + cols.map(function (c) { return td(k, c); }).join('') + '</tr>'; }).join('') +
      rows.map(function (k) { return '<tr>' + cols.map(function (c) { return td(k, c); }).join('') + '</tr>'; }).join('') +
      '</tbody></table></div></div><div style="margin-top:12px">' + sigNote(s) + '</div>';
    el.innerHTML = html;
    $all('[data-sort]').forEach(function (b) { b.onclick = function () { var id = b.dataset.sort; UI.sfSort = { col: id, dir: UI.sfSort.col === id ? -UI.sfSort.dir : (id === 'centre' || id === 'sector' ? 1 : -1) }; render(); }; });
    ['P101', 'P102'].forEach(function (q) {
      var cs = K.slice().sort(function (a, b) { return (val(s, y, b, q) || 0) - (val(s, y, a, q) || 0); });
      var ds = [{ label: String(y), data: cs.map(function (k) { return as100(q, val(s, y, k, q)); }), backgroundColor: cs.map(function (k) { return semColor(sem(q, val(s, y, k, q))); }), borderRadius: 3 }];
      if (p) ds.push({ label: String(p), data: cs.map(function (k) { return as100(q, val(s, p, k, q)); }), backgroundColor: css('--line'), borderRadius: 3 });
      var cat = as100(q, val(s, y, 'CAT', q));
      if (cat != null) ds.push({ type: 'line', label: 'Catalunya ' + y, data: cs.map(function () { return cat; }), borderColor: css('--muted'), borderDash: [5, 4], pointRadius: 0, borderWidth: 1.5 });
      chart(q === 'P101' ? 'c-101' : 'c-102', {
        type: 'bar', data: { labels: cs.map(function (k) { return cname(k); }), datasets: ds },
        options: { scales: { y: pctAxis(50), x: { grid: { display: false }, ticks: { autoSkip: cs.length > 20, maxRotation: 60 } } },
          plugins: { tooltip: { callbacks: { label: function (c) { return c.dataset.label + ': ' + (q === 'P101' ? (c.parsed.y / 10).toFixed(2).replace('.', ',') : c.parsed.y + '%'); } } } } }
      });
    });
  }

  /* ---------- 3. Semàfor per centre ---------- */
  function renderSemafor(el, s) {
    var m = meta(s), y = UI.year, K = selKeys(s), Q = selQs(s), yrs = UI.mxYears;
    var fr = {};
    function mark(list, kind, lvl) { list.forEach(function (c) { var id = c.k + '|' + c.q; (fr[id] = fr[id] || []).push('fr-' + kind + '-' + lvl); }); }
    if (S.config.frames.c) K.forEach(function (k) { var e = extremes(s, y, [k], m.qs); mark(e.best, 'b', 'c'); mark(e.worst, 'w', 'c'); });
    if (S.config.frames.s && K.length > 1) m.sectors.forEach(function (sc) { var ks = K.filter(function (k) { return S.centres[k].sector === sc; }); if (ks.length > 1) { var e = extremes(s, y, ks, m.qs); mark(e.best, 'b', 's'); mark(e.worst, 'w', 's'); } });
    if (S.config.frames.r && K.length > 1) { var e = extremes(s, y, K, m.qs); mark(e.best, 'b', 'r'); mark(e.worst, 'w', 'r'); }
    function frameCls(k, q) {
      var f = fr[k + '|' + q]; if (!f) return '';
      var order = ['fr-w-r', 'fr-b-r', 'fr-w-s', 'fr-b-s', 'fr-w-c', 'fr-b-c'];
      for (var i = 0; i < order.length; i++) if (f.indexOf(order[i]) >= 0) return ' ' + order[i];
      return '';
    }
    var cols = [{ t: 'ref', key: 'CAT', name: 'Catalunya', sec: 'Referència' }];
    if (hasOff(s, y)) cols.push({ t: 'ref', key: 'RSBMN', name: 'RSBMN oficial', sec: 'Referència' });
    m.sectors.forEach(function (sc) { K.filter(function (k) { return S.centres[k].sector === sc; }).forEach(function (k) { cols.push({ t: 'c', key: k, name: cname(k), sec: sc }); }); });
    var html = hl(HL.semafor(s), chips(s, { c: true, q: true })) + filterBar(s, { years: true }) +
      '<div class="toolbar"><span class="kpi-meta">Marcs de millor i pitjor:</span>' + [['c', 'per centre'], ['s', 'per sector'], ['r', 'de la selecció']].map(function (x) { return '<label class="chk"><input type="checkbox" data-fr="' + x[0] + '"' + (S.config.frames[x[0]] ? ' checked' : '') + '> ' + x[1] + '</label>'; }).join('') +
      '<button type="button" class="btn sm" id="mx-xlsx">Exportar a Excel</button></div>';
    if (!K.length || !Q.length) { el.innerHTML = html + '<div class="empty-state"><strong>Sense selecció</strong><span>Tria almenys un centre i una pregunta als filtres.</span></div>'; bindSem(); return; }
    html += '<div class="tscroll" style="max-height:72vh"><table class="mx"><thead><tr class="sect"><th class="q"></th>';
    var spans = [];
    cols.forEach(function (c) { if (spans.length && spans[spans.length - 1].sec === c.sec) spans[spans.length - 1].n++; else spans.push({ sec: c.sec, n: 1 }); });
    html += spans.map(function (x) { return '<th colspan="' + x.n + '">' + esc(x.sec) + '</th>'; }).join('') + '</tr><tr><th class="q">Pregunta</th>' +
      cols.map(function (c) { return '<th title="' + esc(c.t === 'c' ? cfull(c.key) : c.name) + '">' + (c.t === 'c' ? '<span class="mx-h">' + logo(c.key) + '<span>' + esc(c.name) + '</span></span>' : esc(c.name)) + '</th>'; }).join('') + '</tr></thead><tbody>';
    Q.forEach(function (q) {
      html += '<tr><td class="q">' + qhtml(s, q) + qtags(s, q) + '</td>';
      cols.forEach(function (c) {
        var a = val(s, y, c.key, q), ds = yrs.map(function (yy) { return { y: yy, d: comparable(s, q) && a != null && val(s, yy, c.key, q) != null ? a - val(s, yy, c.key, q) : null }; });
        var cl = 'c ' + (c.t === 'ref' ? 'ref ' : '') + (ds.length ? dcls(q, ds[0].d) : '') + (c.t === 'c' ? frameCls(c.key, q) : '');
        html += '<td class="' + cl + '"><div class="in"><span class="row1"><span class="dot ' + sem(q, a) + '"></span>' + fmt(q, a) + '</span>' +
          ds.map(function (x) { return '<span class="dd-y">' + (yrs.length > 1 ? '<i>' + String(x.y).slice(2) + '</i> ' : '') + dspan(q, x.d) + '</span>'; }).join('') + '</div></td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>' +
      '<div class="legend" style="margin-top:10px"><span><span class="dot g"></span> ≥ 90% (satisfacció ≥ 9)</span><span><span class="dot a"></span> 75–89,9% (7,5–8,9)</span><span><span class="dot r"></span> &lt; 75% (&lt; 7,5)</span>' +
      '<span><span class="sw" style="background:var(--tint-up)"></span>Millora rellevant vs ' + (yrs[0] || '–') + '</span><span><span class="sw" style="background:var(--tint-down)"></span>Empitjorament rellevant</span>' +
      '<span><span class="sw" style="box-shadow:inset 0 0 0 2px var(--sem-r)"></span>Pitjor del centre</span><span><span class="sw" style="box-shadow:inset 0 0 0 3px var(--sem-r);outline:1px dashed var(--sem-r);outline-offset:-6px"></span>Pitjor del sector</span><span><span class="sw" style="box-shadow:inset 0 0 0 4px var(--sem-r)"></span>▼ Pitjor de la selecció</span><span>(en verd, el millor)</span></div>' +
      '<div style="margin-top:8px">' + sigNote(s) + '</div>';
    el.innerHTML = html;
    bindSem();
    function bindSem() {
      bindFilterBar(s);
      $all('[data-fr]', el).forEach(function (b) { b.onchange = function () { S.config.frames[b.dataset.fr] = b.checked; save(); render(); }; });
      var xb = $('#mx-xlsx'); if (xb) xb.onclick = function () {
        var aoa = [['Pregunta', 'Codi'].concat(cols.map(function (c) { return c.t === 'c' ? cfull(c.key) : c.name; }))];
        Q.forEach(function (q) {
          aoa.push([qname(s, q), q].concat(cols.map(function (c) { var v = val(s, y, c.key, q); return v == null ? null : Math.round(v * 10000) / 10000; })));
          yrs.forEach(function (yy) { aoa.push(['  Dif. ' + y + '−' + yy, q].concat(cols.map(function (c) { var a = val(s, y, c.key, q), b = val(s, yy, c.key, q); return comparable(s, q) && a != null && b != null ? Math.round((a - b) * 10000) / 10000 : null; }))); });
        });
        var wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Semafor ' + y);
        XLSX.writeFile(wb, 'PLAENSA_' + s + '_semafor_' + y + '.xlsx');
      };
    }
  }

  /* ---------- 4. Comparativa i evolució ---------- */
  function qsTitle(s, Q) {
    if (!Q.length) return 'cap pregunta seleccionada';
    if (Q.length <= 3) return Q.map(function (q) { return '«' + qname(s, q) + '»'; }).join(' · ');
    return Q.length + ' preguntes seleccionades';
  }
  function renderComp(el, s) {
    var m = meta(s), K = selKeys(s), Q = selQs(s), y = UI.year;
    if (m.qs.indexOf(UI.comp.evoQ) < 0 && UI.comp.evoQ !== '__mean') UI.comp.evoQ = m.qs[m.qs.length - 1];
    var col = colorsFor(K), ents = [];
    if (UI.comp.cat) ents.push({ name: 'Catalunya', color: css('--muted'), dash: true, get: function (yy, q) { return val(s, yy, 'CAT', q); } });
    if (UI.comp.off && hasOff(s, y)) ents.push({ name: 'RSBMN (oficial)', color: css('--accent'), dash: true, get: function (yy, q) { return off(s, yy, q); } });
    K.forEach(function (k) { ents.push({ k: k, name: cname(k), color: col[k], get: function (yy, q) { return val(s, yy, k, q); } }); });
    var html = hl(HL.comp(s), chips(s, { c: true, q: true })) + filterBar(s, {}) +
      '<div class="toolbar"><span class="kpi-meta">Referències:</span><label class="chk"><input type="checkbox" id="cmp-cat"' + (UI.comp.cat ? ' checked' : '') + '> Catalunya</label>' +
      (hasOff(s, y) ? '<label class="chk"><input type="checkbox" id="cmp-off"' + (UI.comp.off ? ' checked' : '') + '> RSBMN (valor oficial)</label>' : '<span class="kpi-meta">El fitxer no porta valor oficial de la RSBMN.</span>') + '</div>';
    if (!K.length || !Q.length) { el.innerHTML = html + '<div class="empty-state"><strong>Sense selecció</strong><span>Tria almenys un centre i una pregunta als filtres.</span></div>'; bindC(); return; }
    var years = m.years.slice().reverse(), eq = UI.comp.evoQ;
    html += '<div class="card block" style="margin-top:12px"><h3>Comparativa ' + y + ' · ' + esc(qsTitle(s, Q)) + '</h3>' +
      (Q.length > 3 ? '<details class="qlist"><summary>Veure les preguntes</summary><ul>' + Q.map(function (q) { return '<li>' + qhtml(s, q) + '</li>'; }).join('') + '</ul></details>' : '') +
      '<div class="chart-box tall"><canvas id="c-cmp"></canvas></div></div>';
    html += '<div class="card block" style="margin-top:16px"><div class="toolbar" style="justify-content:space-between"><h3 style="margin:0">Evolució ' + years.join(' → ') + ' · ' + esc(eq === '__mean' ? 'resultat mitjà de cada centre a les preguntes triades' : '«' + qname(s, eq) + '»') + '</h3><div class="field"><label for="evo-q">Pregunta</label><select id="evo-q">' +
      ['__mean'].concat(m.qs).map(function (q) { return '<option value="' + q + '"' + (eq === q ? ' selected' : '') + '>' + (q === '__mean' ? 'Resultat mitjà del centre a les preguntes triades' : esc(qshort(s, q, 80))) + '</option>'; }).join('') + '</select></div></div><div class="chart-box"><canvas id="c-evo"></canvas></div>' +
      (m.years.length < 3 ? '<div class="note">Hi ha ' + m.years.length + ' anys carregats per a aquest estudi. L\'evolució s\'allarga quan carregueu edicions noves del PLAENSA.</div>' : '') + '</div>';
    html += '<div class="block" style="margin-top:16px"><h3>Taula comparativa</h3><div class="tscroll"><table class="t"><thead><tr><th>Pregunta</th>' +
      ents.map(function (e) { return '<th class="v">' + (e.k ? '<span class="mx-h r">' + logo(e.k) + '<span>' + esc(e.name) + '</span></span>' : esc(e.name)) + '</th>'; }).join('') + '</tr></thead><tbody>';
    Q.forEach(function (q) {
      html += '<tr><td>' + qhtml(s, q) + qtags(s, q) + '</td>' + ents.map(function (e) {
        var a = e.get(y, q), b = UI.prev ? e.get(UI.prev, q) : null;
        return '<td class="v"><span class="pill ' + sem(q, a) + '"><span class="dot ' + sem(q, a) + '"></span>' + fmt(q, a) + '</span>' + (UI.prev ? '<br><small>' + dspan(q, comparable(s, q) && a != null && b != null ? a - b : null) + '</small>' : '') + '</td>';
      }).join('') + '</tr>';
    });
    html += '</tbody></table></div></div>';
    el.innerHTML = html;
    bindC();
    function bindC() {
      bindFilterBar(s);
      var c1 = $('#cmp-cat'); if (c1) c1.onchange = function () { UI.comp.cat = this.checked; render(); };
      var c2 = $('#cmp-off'); if (c2) c2.onchange = function () { UI.comp.off = this.checked; render(); };
      var ev = $('#evo-q'); if (ev) ev.onchange = function () { UI.comp.evoQ = this.value; render(); };
    }
    chart('c-cmp', {
      type: 'bar',
      data: { labels: Q.map(function (q) { return wrapLabel(qshort(s, q, 60), 24); }), datasets: ents.map(function (e) { return { label: e.name, data: Q.map(function (q) { return as100(q, e.get(y, q)); }), backgroundColor: e.color, borderRadius: 2 }; }) },
      options: { scales: { y: pctAxis(0), x: { grid: { display: false }, ticks: { font: { size: 11 } } } },
        plugins: { tooltip: { callbacks: { title: function (it) { return qname(s, Q[it[0].dataIndex]); }, label: function (c) { return c.dataset.label + ': ' + c.parsed.y + '%'; } } } } }
    });
    chart('c-evo', {
      type: 'line',
      data: { labels: years.map(String), datasets: ents.map(function (e) {
        return { label: e.name, borderColor: e.color, backgroundColor: e.color, tension: 0.2, pointRadius: 4, spanGaps: true, borderDash: e.dash ? [6, 4] : [],
          data: years.map(function (yy) { return eq === '__mean' ? mean(Q.filter(function (q) { return comparable(s, q); }).map(function (q) { return as100(q, e.get(yy, q)); })) : as100(eq, e.get(yy, eq)); }) };
      }) },
      options: { scales: { y: { ticks: { callback: function (v) { return v + '%'; } } } }, plugins: { tooltip: { callbacks: { label: function (c) { return c.dataset.label + ': ' + (c.parsed.y == null ? '–' : c.parsed.y.toFixed(1) + '%'); } } } } }
    });
  }

  /* ---------- 5. Anàlisi de centre ---------- */
  function dimScores(s, y, k) {
    var d = DIMS[s];
    if (!d) return null;
    return d.map(function (x) { return { name: x[0], v: mean(x[1].map(function (q) { return as100(q, val(s, y, k, q)); })) }; });
  }
  function renderCentre(el, s) {
    var m = meta(s), y = UI.year, p = UI.prev, list = m.active.concat(m.centres.filter(function (k) { return m.active.indexOf(k) < 0; }));
    if (!UI.centre || list.indexOf(UI.centre) < 0) UI.centre = (selKeys(s)[0] || list[0]);
    var k = UI.centre, c = S.centres[k], years = m.years.slice().reverse();
    var opts = m.sectors.map(function (sc) { return '<optgroup label="' + esc(sc) + '">' + m.active.filter(function (x) { return S.centres[x].sector === sc; }).map(function (x) { return '<option value="' + x + '"' + (x === k ? ' selected' : '') + '>' + esc(cname(x)) + '</option>'; }).join('') + '</optgroup>'; }).join('');
    var others = m.centres.filter(function (x) { return m.active.indexOf(x) < 0; });
    if (others.length) opts += '<optgroup label="Fora de sector o exclosos">' + others.map(function (x) { return '<option value="' + x + '"' + (x === k ? ' selected' : '') + '>' + esc(cname(x)) + '</option>'; }).join('') + '</optgroup>';
    function rankOf(q) { var vs = cvals(s, y, m.active, q).sort(function (a, b) { return b.v - a.v; }); var i = vs.map(function (x) { return x.k; }).indexOf(k); return i < 0 ? '–' : (i + 1) + 'a de ' + vs.length; }
    function kpi(q, label) {
      var v = val(s, y, k, q), cat = val(s, y, 'CAT', q), t = p ? sigTest(s, k, q, y, p) : null;
      return '<div class="card kpi ' + sem(q, v) + '"><span class="kpi-label">' + label + '</span><span class="kpi-value">' + fmt(q, v) + '</span>' +
        '<span class="kpi-meta"><span class="pill ' + sem(q, v) + '"><span class="dot ' + sem(q, v) + '"></span>' + SEM_TXT[sem(q, v)] + '</span><span>Catalunya ' + fmt(q, cat) + (v != null && cat != null ? ' (' + fmtD(q, v - cat) + ')' : '') + '</span></span>' +
        '<span class="kpi-meta">' + (t && t.d != null ? '<span>' + dspan(q, t.d) + ' vs ' + p + ' · ' + sigLabel(t) + '</span>' : '') + '<span>Posició ' + rankOf(q) + '</span></span></div>';
    }
    var nRed = m.qs.filter(function (q) { return sem(q, val(s, y, k, q)) === 'r'; }).length, nQ = m.qs.filter(function (q) { return val(s, y, k, q) != null; }).length;
    var tr = p ? transitions(s, [k], m.qs, y, p).byK[k] : null;
    var html = '<div class="ce-head card"><div class="ce-id">' + logo(k, 'xl') + '<div><h3 class="ce-name">' + esc(cfull(k)) + '</h3><div class="kpi-meta">' + esc(c.sector || 'Sense sector') + (c.entitat ? ' · ' + esc(c.entitat) : '') + ' · ' + esc(studyName(s)) + '</div></div></div>' +
      '<div class="field"><label for="ce-sel">Centre</label><select id="ce-sel">' + opts + '</select></div>' +
      '<button type="button" class="btn" id="ce-rep">Informe del centre (HTML)</button></div>' +
      '<div class="grid g4" style="margin-top:14px">' + kpi('P101', 'Satisfacció global ' + y) + kpi('P102', 'Fidelitat ' + y) +
      '<div class="card kpi ' + (nRed ? 'r' : 'g') + '"><span class="kpi-label">Preguntes en àrea de millora</span><span class="kpi-value">' + nRed + ' de ' + nQ + '</span><span class="kpi-meta">' + pct(nRed, nQ) + ' de les preguntes del centre</span></div>' +
      '<div class="card kpi ' + (tr ? (tr.up >= tr.down ? 'g' : 'r') : '') + '"><span class="kpi-label">Canvis d\'àrea ' + (p ? p + ' → ' + y : '') + '</span><span class="kpi-value">' + (tr ? tr.up + ' ▲  ' + tr.down + ' ▼' : '–') + '</span><span class="kpi-meta">' + (tr ? tr.eq + ' preguntes es mantenen a la mateixa àrea' : 'Cal un any de comparació') + '</span></div></div>';
    // Comparatiu d'anys
    html += '<div class="block" style="margin-top:18px"><h3 class="sec-h">Comparatiu dels anys</h3><div class="tscroll"><table class="t"><thead><tr><th>Pregunta</th>' + years.map(function (yy) { return '<th class="v">' + yy + '</th>'; }).join('') +
      (p ? '<th class="v">Dif. ' + y + '−' + p + '</th><th>Lectura</th>' : '') + '<th class="v">Catalunya ' + y + '</th></tr></thead><tbody>' +
      m.qs.map(function (q) {
        var t = p ? sigTest(s, k, q, y, p) : null;
        return '<tr><td>' + qhtml(s, q) + qtags(s, q, k) + '</td>' + years.map(function (yy) { var v = val(s, yy, k, q); return '<td class="v">' + (yy === y ? '<span class="pill ' + sem(q, v) + '"><span class="dot ' + sem(q, v) + '"></span>' + fmt(q, v) + '</span>' : '<span class="muted">' + fmt(q, v) + '</span>') + '</td>'; }).join('') +
          (p ? '<td class="v">' + (t.d == null ? '<span class="muted">' + (comparable(s, q) ? '–' : 'no comparable') + '</span>' : dspan(q, t.d)) + '</td><td class="muted small">' + (t.d == null ? '' : sigLabel(t)) + '</td>' : '') + '<td class="v muted">' + fmt(q, val(s, y, 'CAT', q)) + '</td></tr>';
      }).join('') + '</tbody></table></div></div>';
    html += '<div class="grid g2" style="margin-top:16px"><div class="card block"><h3>' + (DIMS[s] ? 'Perfil per dimensions' : 'Perfil per preguntes') + ' · ' + esc(cname(k)) + ' vs Catalunya</h3><div class="chart-box tall"><canvas id="ce-radar"></canvas></div>' + (DIMS[s] ? '<div class="note">Índex de dimensió: mitjana de les preguntes del centre que la formen (escala 0–100; satisfacció × 10). Línies de referència al 75% i al 90%.</div>' : '') + '</div>' +
      '<div class="card block"><h3>Matriu de prioritats</h3><div class="chart-box tall"><canvas id="ce-quad"></canvas></div><div class="note">Eix horitzontal: canvi respecte a ' + (p || 'l\'any anterior') + '. Eix vertical: diferència respecte a Catalunya (pp; satisfacció × 10). A baix a l\'esquerra, prioritat alta: per sota de Catalunya i empitjorant.</div></div></div>';
    // Prioritats en llista
    var quad = { hi: [], watch: [], keep: [], ok: [] };
    m.qs.forEach(function (q) {
      var v = val(s, y, k, q), cat = val(s, y, 'CAT', q), d = p ? dif(s, k, q, y, p) : null; if (v == null || cat == null) return;
      var below = v < cat, down = d != null && d < 0;
      (below && down ? quad.hi : below ? quad.watch : down ? quad.keep : quad.ok).push(q);
    });
    var qlist = function (arr) { return arr.length ? '<ul class="plain">' + arr.map(function (q) { return '<li>' + qhtml(s, q) + ' <span class="pill ' + sem(q, val(s, y, k, q)) + '">' + fmt(q, val(s, y, k, q)) + '</span></li>'; }).join('') + '</ul>' : '<span class="muted">Cap</span>'; };
    html += '<div class="grid g2x quad" style="margin-top:12px"><div class="card q-hi"><h3>Prioritat alta · per sota de Catalunya i empitjora</h3>' + qlist(quad.hi) + '</div><div class="card q-watch"><h3>Per sota de Catalunya però millora</h3>' + qlist(quad.watch) + '</div>' +
      '<div class="card q-keep"><h3>Per sobre de Catalunya però empitjora</h3>' + qlist(quad.keep) + '</div><div class="card q-ok"><h3>Per sobre de Catalunya i millora o es manté</h3>' + qlist(quad.ok) + '</div></div>';
    // Objectius que apliquen al centre, per cicle
    var cyc = cicleList(s);
    html += '<div class="block" style="margin-top:18px"><h3 class="sec-h">Objectius que apliquen al centre (per cicle PLAENSA)</h3>';
    var anyObj = false;
    cyc.forEach(function (cy) {
      var obs = objectives(s, cy, null, k); if (!obs.length) return; anyObj = true;
      var ye = m.years.filter(function (yy) { return yy > cy; }).sort()[0];
      html += '<h4 class="cyc">Cicle PLAENSA ' + cy + (ye ? ' → avaluat al PLAENSA ' + ye : ' → pendent d\'avaluar') + '</h4><div class="tscroll"><table class="t"><thead><tr><th>Pregunta</th><th>Tipus</th><th>Àmbit</th><th class="v">' + cy + '</th><th class="v">' + (ye || 'Avaluació') + '</th><th>Veredicte</th></tr></thead><tbody>' +
        obs.map(function (o) {
          var a = val(s, cy, k, o.q), b = ye ? val(s, ye, k, o.q) : null, t = ye ? sigTest(s, k, o.q, ye, cy) : { st: 'nd' };
          var vd = t.st === 'nd' ? (ye ? 'Sense dada comparable' : 'Pendent') : t.d > 0 && t.st !== 'nc' ? 'Millora ' + sigLabel(t) : t.d < 0 && t.st !== 'nc' ? 'Empitjora ' + sigLabel(t) : 'Sense canvi concloent';
          return '<tr><td>' + qhtml(s, o.q) + '</td><td>' + (o.tipus === 'trans' ? '<span class="tag tr">Transversal</span>' : '<span class="tag es">Específic</span>') + '</td><td>' + esc(scopeLabel(o)) + '</td><td class="v">' + fmt(o.q, a) + '</td><td class="v">' + fmt(o.q, b) + (t.d != null ? '<br><small>' + dspan(o.q, t.d) + '</small>' : '') + '</td><td>' + esc(vd) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    });
    if (!anyObj) html += '<div class="note">No hi ha objectius que apliquin a aquest centre. Es defineixen a «Objectius i configuració».</div>';
    html += '</div>';
    // Plans d'acció
    var acts = S.actions.filter(function (a) { return a.study === s && a.centre === k; });
    html += '<div class="block" style="margin-top:18px"><div class="toolbar" style="justify-content:space-between"><h3 class="sec-h" style="margin:0">Plans d\'acció i evolució (' + acts.length + ')</h3><button type="button" class="btn primary" id="ce-add">+ Acció de millora</button></div>' + actionsTable(s, acts, false) + '</div>';
    el.innerHTML = html;
    $('#ce-sel').onchange = function () { UI.centre = this.value; render(); };
    $('#ce-add').onclick = function () { openActionForm(s, { centre: k }); };
    $('#ce-rep').onclick = function () { exportSub(s, 'Anàlisi de centre · ' + cname(k), 'Informe_centre_PLAENSA_' + s + '_' + k + '_' + y + '.html'); };
    bindActionsTable(s);
    var dims = dimScores(s, y, k);
    var rl = dims ? dims.map(function (d) { return d.name; }) : m.qs.map(function (q) { return wrapLabel(qshort(s, q, 30), 16); });
    var rv = dims ? dims.map(function (d) { return d.v; }) : m.qs.map(function (q) { return as100(q, val(s, y, k, q)); });
    var rc = dims ? dimScores(s, y, 'CAT').map(function (d) { return d.v; }) : m.qs.map(function (q) { return as100(q, val(s, y, 'CAT', q)); });
    var bc = brand(k);
    chart('ce-radar', { type: 'radar', data: { labels: rl, datasets: [
      { label: cname(k) + ' ' + y, data: rv, borderColor: bc, backgroundColor: bc + '33', pointBackgroundColor: bc, borderWidth: 2 },
      { label: 'Catalunya ' + y, data: rc, borderColor: css('--muted'), borderDash: [5, 4], pointRadius: 0, fill: false, borderWidth: 1.5 },
      { label: 'Estàndard 75%', data: rl.map(function () { return 75; }), borderColor: semColor('a'), pointRadius: 0, fill: false, borderWidth: 1 },
      { label: 'Excel·lència 90%', data: rl.map(function () { return 90; }), borderColor: semColor('g'), pointRadius: 0, fill: false, borderWidth: 1 }] },
      options: { scales: { r: { min: 30, max: 100, ticks: { stepSize: 10, backdropColor: 'transparent' }, pointLabels: { font: { size: 11 } } } } } });
    var pts = m.qs.map(function (q) { var v = val(s, y, k, q), cat = val(s, y, 'CAT', q), d = p ? dif(s, k, q, y, p) : null; if (v == null || cat == null || d == null) return null; return { x: as100(q, d) - 0 || (d * 100), y: Math.round((as100(q, v) - as100(q, cat)) * 10) / 10, q: q, c: semColor(sem(q, v)) }; }).filter(Boolean);
    pts.forEach(function (pt) { pt.x = Math.round((is101(pt.q) ? dif(s, k, pt.q, y, p) * 10 : dif(s, k, pt.q, y, p) * 100) * 10) / 10; });
    chart('ce-quad', { type: 'scatter', data: { datasets: [{ label: 'Preguntes', data: pts, pointBackgroundColor: pts.map(function (x) { return x.c; }), pointRadius: 7, pointHoverRadius: 9 }] },
      options: { plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (cx) { var x = pts[cx.dataIndex]; return qname(s, x.q) + ' · vs ' + p + ' ' + (x.x > 0 ? '+' : '') + x.x + ' · vs Catalunya ' + (x.y > 0 ? '+' : '') + x.y; } } } },
        scales: { x: { title: { display: true, text: 'Canvi respecte a ' + (p || '—') + ' (pp)' }, grid: { color: function (cx) { return cx.tick.value === 0 ? css('--muted') : css('--line'); } } },
          y: { title: { display: true, text: 'Diferència respecte a Catalunya (pp)' }, grid: { color: function (cx) { return cx.tick.value === 0 ? css('--muted') : css('--line'); } } } } } });
  }
  function scopeLabel(o) { return o.scope === 'regio' ? 'Regió (RSBMN)' : o.scope === 'sector' ? 'Sector · ' + o.target : 'Centre · ' + cname(o.target); }

  /* ---------- Accions de millora (cicle: PLAENSA origen → accions → PLAENSA d'avaluació) ---------- */
  function evalYear(s, a) { var m = meta(s); return a.anyAval ? +a.anyAval : m.years.filter(function (yy) { return yy > +a.cicle; }).sort()[0] || null; }
  function evalAction(s, a) {
    var ye = evalYear(s, a);
    if (!ye || !a.cicle || meta(s).years.indexOf(+ye) < 0) return { st: 'pendent', ye: ye };
    var t = sigTest(s, a.centre, a.q, +ye, +a.cicle);
    if (t.st === 'nd') return { st: 'pendent', ye: ye };
    var st = t.st === 'nc' ? 'no concloent' : t.d > 0 ? 'efectiva' : t.d < 0 ? 'no efectiva' : 'no concloent';
    return { st: st, ye: ye, t: t };
  }
  var EV_CLS = { efectiva: 'g', 'no efectiva': 'r', 'no concloent': 'a', pendent: 'n' };
  function actionsTable(s, acts, showCentre) {
    if (!acts.length) return '<div class="note">Encara no hi ha accions registrades.</div>';
    return '<div class="tscroll"><table class="t"><thead><tr>' + (showCentre ? '<th>Centre</th>' : '') + '<th>Pregunta</th><th>Cicle</th><th>Tipus</th><th>Acció</th><th>Responsable operatiu</th><th>Periodicitat · abast</th><th>Indicador de procés</th><th>Estat</th><th class="v">Resultat</th><th>Avaluació</th><th></th></tr></thead><tbody>' +
      acts.map(function (a) {
        var ev = evalAction(s, a), v0 = val(s, a.cicle, a.centre, a.q), v1 = ev.ye ? val(s, ev.ye, a.centre, a.q) : null, stc = a.estat === 'Feta' ? 'g' : a.estat === 'En curs' ? 'a' : 'r';
        return '<tr>' + (showCentre ? '<td>' + cnameHtml(a.centre) + '</td>' : '') + '<td>' + qhtml(s, a.q) + '</td><td class="small">' + (a.cicle || '–') + ' → ' + (ev.ye || '?') + '</td><td class="small">' + esc(a.tipus || '') + '</td><td>' + esc(a.accio) + '</td><td>' + esc(a.responsable || '') + '</td><td class="small">' + esc([a.periodicitat, a.abast].filter(Boolean).join(' · ')) + '</td>' +
          '<td class="small">' + esc(a.indicador || a.seguiment || '') + (a.indicadorValor ? ' <b>' + esc(a.indicadorValor) + '</b>' : '') + '</td><td><span class="pill ' + stc + '">' + esc(a.estat) + '</span></td>' +
          '<td class="v small">' + fmt(a.q, v0) + ' → ' + fmt(a.q, v1) + (ev.t && ev.t.d != null ? '<br>' + dspan(a.q, ev.t.d) : '') + '</td><td><span class="pill ' + EV_CLS[ev.st] + '">' + esc(ev.st.charAt(0).toUpperCase() + ev.st.slice(1)) + '</span>' + (ev.t && ev.t.est ? '<br><small class="muted">n estimada</small>' : '') + '</td>' +
          '<td style="white-space:nowrap"><button type="button" class="btn sm" data-edit="' + a.id + '">Editar</button> <button type="button" class="btn sm danger" data-del="' + a.id + '">Eliminar</button></td></tr>';
      }).join('') + '</tbody></table></div><div id="del-confirm"></div>';
  }
  function bindActionsTable(s) {
    $all('[data-edit]').forEach(function (b) { b.onclick = function () { openActionForm(s, S.actions.filter(function (x) { return x.id === b.dataset.edit; })[0]); }; });
    $all('[data-del]').forEach(function (b) {
      b.onclick = function () {
        var box = $('#del-confirm');
        box.innerHTML = '<div class="confirm" style="margin-top:8px">Vols eliminar aquesta acció? <button type="button" class="btn sm danger" id="del-yes">Eliminar</button><button type="button" class="btn sm" id="del-no">Cancel·lar</button></div>';
        $('#del-yes').onclick = function () { S.actions = S.actions.filter(function (x) { return x.id !== b.dataset.del; }); save(); render(); toast('Acció eliminada'); };
        $('#del-no').onclick = function () { box.innerHTML = ''; };
      };
    });
  }
  function openActionForm(s, a) {
    var m = meta(s), edit = !!(a && a.id); a = a || {};
    var cyc = cicleList(s), cy = a.cicle || curCicle(s);
    var sel = function (id, list, cur) { return '<select id="' + id + '">' + list.map(function (x) { var v = x.v != null ? x.v : x, l = x.l != null ? x.l : x; return '<option value="' + esc(v) + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select>'; };
    var body = '<form id="act-form" class="grid" style="gap:12px">' +
      '<div class="grid g2" style="gap:12px"><div class="field"><label for="a-c">Centre</label>' + sel('a-c', m.centres.map(function (k) { return { v: k, l: cname(k) }; }), a.centre) + '</div>' +
      '<div class="field"><label for="a-q">Pregunta</label>' + sel('a-q', m.qs.map(function (q) { return { v: q, l: qshort(s, q, 90) }; }), a.q) + '</div></div>' +
      '<div class="grid g4" style="gap:12px"><div class="field"><label for="a-cy">PLAENSA que l\'origina</label>' + sel('a-cy', cyc, cy) + '</div>' +
      '<div class="field"><label for="a-ye">PLAENSA d\'avaluació</label><input id="a-ye" type="number" min="2015" max="2040" value="' + esc(a.anyAval || '') + '" placeholder="el següent"></div>' +
      '<div class="field"><label for="a-t">Tipus d\'acció</label>' + sel('a-t', ACTION_TYPES, a.tipus || ACTION_TYPES[0]) + '</div>' +
      '<div class="field"><label for="a-estat">Estat</label>' + sel('a-estat', ['Pendent', 'En curs', 'Feta'], a.estat || 'Pendent') + '</div></div>' +
      '<div class="field"><label for="a-accio">Acció de millora</label><textarea id="a-accio" placeholder="Ex.: rondes informatives a la sala d\'espera cada 60 minuts">' + esc(a.accio || '') + '</textarea></div>' +
      '<div class="grid g4" style="gap:12px"><div class="field"><label for="a-resp">Responsable operatiu</label><input id="a-resp" value="' + esc(a.responsable || '') + '" placeholder="Nom i càrrec"></div>' +
      '<div class="field"><label for="a-per">Periodicitat</label>' + sel('a-per', ['', 'Setmanal', 'Mensual', 'Trimestral', 'Semestral', 'Anual', 'Puntual'], a.periodicitat || '') + '</div>' +
      '<div class="field"><label for="a-ab">Abast</label>' + sel('a-ab', ['', 'Tot el centre', 'Servei o unitat', 'Pilot'], a.abast || '') + '</div>' +
      '<div class="field"><label for="a-data">Data prevista</label><input id="a-data" type="date" value="' + esc(a.data || '') + '"></div></div>' +
      '<div class="grid g2" style="gap:12px"><div class="field"><label for="a-ind">Indicador de procés</label><input id="a-ind" value="' + esc(a.indicador || a.seguiment || '') + '" placeholder="Ex.: % de visites amb informació de demora"></div>' +
      '<div class="field"><label for="a-iv">Valor de l\'indicador</label><input id="a-iv" value="' + esc(a.indicadorValor || '') + '" placeholder="Ex.: 82% (setembre 2027)"></div></div></form>' +
      '<div class="note">L\'avaluació es calcula sola quan es carrega el PLAENSA d\'avaluació: compara el resultat del centre a la pregunta entre el PLAENSA d\'origen i el d\'avaluació (efectiva, no concloent o no efectiva).</div>';
    openModal(edit ? 'Editar acció de millora' : 'Nova acció de millora', body, '<button type="button" class="btn" data-close>Cancel·lar</button><button type="button" class="btn primary" id="act-save">' + (edit ? 'Desar canvis' : 'Afegir acció') + '</button>');
    $('#act-save').onclick = function () {
      var o = { study: s, centre: $('#a-c').value, q: $('#a-q').value, cicle: +$('#a-cy').value, anyAval: $('#a-ye').value ? +$('#a-ye').value : null, tipus: $('#a-t').value, estat: $('#a-estat').value,
        accio: $('#a-accio').value.trim(), responsable: $('#a-resp').value.trim(), periodicitat: $('#a-per').value, abast: $('#a-ab').value, data: $('#a-data').value, indicador: $('#a-ind').value.trim(), indicadorValor: $('#a-iv').value.trim() };
      if (!o.accio) { toast('Escriu la descripció de l\'acció.'); return; }
      if (edit) Object.assign(a, o, { modificat: new Date().toISOString() }); else { o.id = uid(); o.creat = new Date().toISOString(); S.actions.push(o); }
      save(); closeModal(); render(); toast(edit ? 'Acció actualitzada' : 'Acció afegida');
    };
  }
  function exportActions(s, acts) {
    var aoa = [['Estudi', 'Centre', 'Sector', 'Pregunta', 'Codi', 'PLAENSA origen', 'PLAENSA avaluació', 'Tipus', 'Acció', 'Responsable operatiu', 'Periodicitat', 'Abast', 'Data prevista', 'Estat', 'Indicador de procés', 'Valor indicador', 'Resultat origen', 'Resultat avaluació', 'Avaluació']];
    acts.forEach(function (a) { var ev = evalAction(s, a); aoa.push([studyName(s), cfull(a.centre), (S.centres[a.centre] || {}).sector || '', qname(s, a.q), a.q, a.cicle, ev.ye, a.tipus, a.accio, a.responsable, a.periodicitat, a.abast, a.data, a.estat, a.indicador || a.seguiment, a.indicadorValor, fmt(a.q, val(s, a.cicle, a.centre, a.q)), fmt(a.q, ev.ye ? val(s, ev.ye, a.centre, a.q) : null), ev.st]); });
    var wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Accions');
    XLSX.writeFile(wb, 'PLAENSA_' + s + '_accions_millora.xlsx');
  }

  /* ---------- 6. CPR i Accions ---------- */
  function cprStatus(s, k, q) {
    var a = val(s, UI.year, k, q), b = UI.prev ? val(s, UI.prev, k, q) : null;
    if (a == null || b == null || !comparable(s, q)) return { st: 'nd', a: a, b: b, d: null };
    var d = round3(a - b), sg = sig(s, k, q);
    if (d >= 0) return { st: 'ok', a: a, b: b, d: a - b };
    if (sg === 'nc') return { st: 'ok', a: a, b: b, d: a - b, note: 'no significatiu' };
    if (sg === 'sig') return { st: 'ko', a: a, b: b, d: a - b };
    return { st: 'ko?', a: a, b: b, d: a - b };
  }
  function renderCpr(el, s) {
    var m = meta(s), K = selKeys(s), cpr = cfg(s).cpr.filter(function (q) { return m.qs.indexOf(q) >= 0; });
    var html = hl(HL.cpr(s), chips(s, { c: true })) + filterBar(s, { questions: false }) + '<div class="block"><h3 class="sec-h">Indicadors CPR ' + UI.year + (UI.prev ? ' vs ' + UI.prev : '') + '</h3>';
    if (!cpr.length) html += '<div class="note warn">Aquest estudi no té preguntes CPR definides. Les pots marcar a «Objectius i configuració».</div>';
    else if (!UI.prev) html += '<div class="note warn">Cal un any de comparació per avaluar la CPR (millora o no empitjorament respecte al mateix centre).</div>';
    else {
      html += '<div class="note">Criteri: millora o no empitjorament respecte al mateix centre a cada pregunta CPR. Si la diferència és negativa però no significativa (amb n o IC reals) es considera assolida; sense n ni IC queda «pendent de validar» (✗?).</div>' +
        '<div class="tscroll" style="margin-top:8px"><table class="t"><thead><tr><th>Centre</th>' + cpr.map(function (q) { return '<th class="v" title="' + esc(qname(s, q)) + '">' + esc(qshort(s, q, 34)) + ' <span class="qcode">' + q + '</span></th>'; }).join('') + '<th class="v">Assoliment</th></tr></thead><tbody>';
      m.sectors.forEach(function (sc) {
        var ks = K.filter(function (k) { return S.centres[k].sector === sc; }); if (!ks.length) return;
        html += '<tr class="grp"><td colspan="' + (cpr.length + 2) + '">' + esc(sc) + '</td></tr>';
        ks.forEach(function (k) {
          var ok = 0, tot = 0;
          html += '<tr><td>' + cnameHtml(k) + '</td>' + cpr.map(function (q) {
            var r = cprStatus(s, k, q);
            if (r.st !== 'nd') { tot++; if (r.st === 'ok') ok++; }
            var ic = r.st === 'ok' ? '<span class="d-up">✓</span>' : r.st === 'ko' ? '<span class="d-down">✗</span>' : r.st === 'ko?' ? '<span class="d-down" title="Sense IC: pendent de validar">✗?</span>' : '<span class="d-eq">–</span>';
            return '<td class="v">' + fmt(q, r.a) + ' ' + ic + '<br><small>' + dspan(q, r.d) + '</small></td>';
          }).join('') + '<td class="v"><strong>' + (tot ? Math.round(ok / tot * 100) + '%' : '–') + '</strong><br><small>' + ok + '/' + tot + '</small></td></tr>';
        });
      });
      html += '</tbody></table></div>';
    }
    html += '</div>';
    var acts = S.actions.filter(function (a) { return a.study === s && K.indexOf(a.centre) >= 0; });
    html += '<div class="block" style="margin-top:20px"><div class="toolbar" style="justify-content:space-between"><h3 class="sec-h" style="margin:0">Registre d\'accions de millora (' + acts.length + ')</h3><div class="toolbar" style="margin:0"><button type="button" class="btn" id="acc-xlsx">Exportar accions (Excel)</button><button type="button" class="btn primary" id="acc-add">+ Acció de millora</button></div></div>' +
      actionsTable(s, acts, true) + '<div class="note" style="margin-top:8px">L\'anàlisi detallada de cada centre (anys, prioritats i objectius) és a la pestanya «Anàlisi de centre».</div></div>';
    el.innerHTML = html;
    bindFilterBar(s);
    bindActionsTable(s);
    $('#acc-add').onclick = function () { openActionForm(s, { centre: K[0] }); };
    $('#acc-xlsx').onclick = function () { exportActions(s, acts); };
  }

  /* ---------- 7. Objectius i configuració de l'informe ---------- */
  function renderObj(el, s) {
    var m = meta(s), cyc = cicleList(s), nextY = (m.years[0] || new Date().getFullYear());
    if (!UI.objCicle || cyc.indexOf(UI.objCicle) < 0) UI.objCicle = curCicle(s);
    var cy = UI.objCicle, ye = m.years.filter(function (yy) { return yy > cy; }).sort()[0], obs = objectives(s, cy);
    var html = '<div class="note">Els objectius transversals i específics els tria el tècnic de línia per a cada <b>cicle</b>: es fixen a partir d\'un PLAENSA, es treballen amb accions i s\'avaluen al PLAENSA següent. Cada objectiu pot aplicar a tota la regió, a un sector o a un centre concret.</div>' +
      '<div class="toolbar" style="margin-top:12px"><div class="field"><label for="ob-cy">Cicle (PLAENSA que fixa els objectius)</label><select id="ob-cy">' + cyc.map(function (c) { return '<option value="' + c + '"' + (c === cy ? ' selected' : '') + '>PLAENSA ' + c + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="ob-new">Nou cicle</label><input id="ob-new" type="number" min="2015" max="2040" style="width:100px" placeholder="' + nextY + '"></div><button type="button" class="btn sm" id="ob-addcy">Crear</button>' +
      '<div class="field"><label for="ob-copy">Copiar objectius del cicle</label><select id="ob-copy"><option value="">—</option>' + cyc.filter(function (c) { return c !== cy; }).map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select></div><button type="button" class="btn sm" id="ob-docopy">Copiar</button></div>' +
      '<div class="cyc-band">Cicle <b>PLAENSA ' + cy + '</b> → accions ' + (cy + 1) + ' → ' + (ye ? 'avaluació al <b>PLAENSA ' + ye + '</b> (carregat)' : 'avaluació al PLAENSA següent (encara no carregat)') + '</div>';
    // Formulari d'alta
    html += '<div class="card block" style="margin-top:12px"><h3>Afegir objectius al cicle ' + cy + '</h3><div class="toolbar">' +
      '<div class="field"><label for="ob-t">Tipus</label><select id="ob-t"><option value="trans">Transversal</option><option value="esp">Específic</option></select></div>' +
      '<div class="field"><label for="ob-sc">Àmbit</label><select id="ob-sc"><option value="regio">Regió (RSBMN)</option><option value="sector">Sector</option><option value="centre">Centre</option></select></div>' +
      '<div class="field" id="ob-tg-w" hidden><label for="ob-tg">Destinatari</label><select id="ob-tg"></select></div></div>' +
      '<div class="toolbar"><button type="button" class="btn sm" id="ob-qa">Totes</button><button type="button" class="btn sm" id="ob-qn">Cap</button></div><div class="picklist">' +
      m.qs.map(function (q) { var vs = cvals(s, cy, m.active, q), nr = vs.filter(function (x) { return sem(q, x.v) === 'r'; }).length; return '<label><input type="checkbox" data-obq="' + q + '"> <span>' + qhtml(s, q) + (vs.length ? ' <span class="muted small">· ' + nr + ' de ' + vs.length + ' centres en vermell al ' + cy + '</span>' : '') + '</span></label>'; }).join('') +
      '</div><div class="toolbar" style="margin-top:8px"><button type="button" class="btn primary" id="ob-add">Afegir objectius</button></div></div>';
    // Propostes a partir del quadre
    var props = [];
    if (m.years.indexOf(cy) >= 0) {
      m.qs.forEach(function (q) {
        var secW = m.sectors.filter(function (sc) { var e = extremes(s, cy, m.active.filter(function (k) { return S.centres[k].sector === sc; }), m.qs); return e.worst.some(function (x) { return x.q === q; }); });
        var vs = cvals(s, cy, m.active, q), allRed = vs.length && vs.every(function (x) { return sem(q, x.v) === 'r'; });
        if (secW.length >= Math.max(2, Math.ceil(m.sectors.length / 2)) || allRed) props.push({ q: q, why: (allRed ? 'tots els centres en àrea de millora' : '') + (secW.length ? (allRed ? ' · ' : '') + 'pitjor resultat a ' + secW.length + ' de ' + m.sectors.length + ' sectors' : '') });
      });
    }
    if (props.length) html += '<div class="card block" style="margin-top:12px"><h3>Propostes de transversal a partir dels resultats ' + cy + '</h3><ul class="plain">' + props.map(function (x) { var has = obs.some(function (o) { return o.q === x.q && o.scope === 'regio' && o.tipus === 'trans'; }); return '<li>' + qhtml(s, x.q) + ' <span class="muted small">· ' + esc(x.why) + '</span> ' + (has ? '<span class="tag tr">Ja és transversal</span>' : '<button type="button" class="btn sm" data-prop="' + x.q + '">Afegir com a transversal de regió</button>') + '</li>'; }).join('') + '</ul></div>';
    // Llista d'objectius del cicle
    html += '<div class="block" style="margin-top:12px"><h3 class="sec-h">Objectius del cicle ' + cy + ' (' + obs.length + ')</h3>' + (obs.length ? '<div class="tscroll"><table class="t"><thead><tr><th>Pregunta</th><th>Tipus</th><th>Àmbit</th><th class="v">Centres en vermell ' + cy + '</th><th class="v">' + (ye ? 'Centres que milloren al ' + ye : 'Avaluació') + '</th><th>Origen</th><th></th></tr></thead><tbody>' +
      obs.slice().sort(function (a, b) { return (a.tipus > b.tipus ? -1 : a.tipus < b.tipus ? 1 : 0) || qSort(a.q, b.q); }).map(function (o) {
        var ks = m.active.filter(function (k) { return objApplies(o, k); }), vs = cvals(s, cy, ks, o.q), nr = vs.filter(function (x) { return sem(o.q, x.v) === 'r'; }).length;
        var ev = ye ? ks.map(function (k) { return sigTest(s, k, o.q, ye, cy); }).filter(function (t) { return t.st !== 'nd'; }) : [];
        var up = ev.filter(function (t) { return t.d > 0; }).length;
        return '<tr><td>' + qhtml(s, o.q) + '</td><td>' + (o.tipus === 'trans' ? '<span class="tag tr">Transversal</span>' : '<span class="tag es">Específic</span>') + '</td><td>' + esc(scopeLabel(o)) + '</td><td class="v">' + (vs.length ? nr + ' de ' + vs.length : '–') + '</td><td class="v">' + (ev.length ? up + ' de ' + ev.length : '–') + '</td><td class="small muted">' + esc(o.origen || 'Tècnic de línia') + '</td><td><button type="button" class="btn sm danger" data-obdel="' + o.id + '">Treure</button></td></tr>';
      }).join('') + '</tbody></table></div>' : '<div class="note">Encara no hi ha objectius en aquest cicle.</div>') + '</div>';
    // CPR i comparabilitat
    html += '<div class="block" style="margin-top:18px"><h3 class="sec-h">Preguntes CPR i comparabilitat entre anys</h3><div class="note">La CPR és el compromís contractual de l\'estudi (fix per a tots els centres). Marca com a «no comparable» les preguntes noves o modificades: no se\'n calcularan diferències entre anys.</div>' +
      '<div class="tscroll" style="margin-top:8px"><table class="t"><thead><tr><th>Pregunta</th><th class="v">CPR</th><th class="v">No comparable</th></tr></thead><tbody>' +
      m.qs.map(function (q) { return '<tr><td>' + qhtml(s, q) + '</td><td class="v"><input type="checkbox" data-cfgk="cpr" data-q="' + q + '"' + (isCpr(s, q) ? ' checked' : '') + ' aria-label="CPR"></td><td class="v"><input type="checkbox" data-cfgk="noncomp" data-q="' + q + '"' + (!comparable(s, q) ? ' checked' : '') + ' aria-label="No comparable"></td></tr>'; }).join('') + '</tbody></table></div></div>';
    // Fitxa tècnica
    var fy = UI.year, ft = cfg(s).fitxa[fy] || {};
    var fields = [['enquestes', 'Enquestes a Catalunya'], ['ups', 'Unitats proveïdores (UP)'], ['minUp', 'Enquestes mínimes per UP'], ['marge', 'Marge d\'error global'], ['camp', 'Treball de camp'], ['univers', 'Univers']];
    html += '<div class="block" style="margin-top:18px"><h3 class="sec-h">Fitxa tècnica · PLAENSA ' + fy + '</h3><div class="grid g4">' + fields.map(function (f) { return '<div class="field"><label for="ft-' + f[0] + '">' + f[1] + '</label><input id="ft-' + f[0] + '" data-ft="' + f[0] + '" value="' + esc(ft[f[0]] || '') + '"></div>'; }).join('') + '</div><div class="note">S\'inclou a la presentació i a l\'informe del comitè.</div></div>';
    el.innerHTML = html;
    // Interaccions
    var tgW = $('#ob-tg-w'), tg = $('#ob-tg');
    $('#ob-sc').onchange = function () {
      var v = this.value; tgW.hidden = v === 'regio';
      tg.innerHTML = v === 'sector' ? m.sectors.map(function (sc) { return '<option>' + esc(sc) + '</option>'; }).join('') : m.centres.map(function (k) { return '<option value="' + k + '">' + esc(cname(k)) + '</option>'; }).join('');
    };
    $('#ob-cy').onchange = function () { UI.objCicle = +this.value; render(); };
    $('#ob-addcy').onclick = function () { var v = +$('#ob-new').value || nextY; if (cicleList(s).indexOf(v) < 0) { S.objectives.push({ id: uid(), study: s, cicle: v, tipus: 'trans', scope: 'regio', target: '', q: '__cycle', origen: 'cicle' }); } UI.objCicle = v; save(); render(); };
    $('#ob-docopy').onclick = function () {
      var from = +$('#ob-copy').value; if (!from) return;
      var n = 0; objectives(s, from).forEach(function (o) { if (o.q === '__cycle') return; if (!objectives(s, cy).some(function (x) { return x.q === o.q && x.tipus === o.tipus && x.scope === o.scope && x.target === o.target; })) { S.objectives.push(Object.assign({}, o, { id: uid(), cicle: cy, origen: 'Copiat del cicle ' + from })); n++; } });
      save(); render(); toast(n + ' objectius copiats');
    };
    $('#ob-qa').onclick = function () { $all('[data-obq]').forEach(function (x) { x.checked = true; }); };
    $('#ob-qn').onclick = function () { $all('[data-obq]').forEach(function (x) { x.checked = false; }); };
    $('#ob-add').onclick = function () {
      var t = $('#ob-t').value, sc = $('#ob-sc').value, target = sc === 'regio' ? '' : tg.value, qs = $all('[data-obq]').filter(function (x) { return x.checked; }).map(function (x) { return x.dataset.obq; }), n = 0;
      if (!qs.length) { toast('Tria almenys una pregunta.'); return; }
      qs.forEach(function (q) { if (!objectives(s, cy).some(function (o) { return o.q === q && o.tipus === t && o.scope === sc && o.target === target; })) { S.objectives.push({ id: uid(), study: s, cicle: cy, tipus: t, scope: sc, target: target, q: q, origen: 'Tècnic de línia' }); n++; } });
      save(); render(); toast(n + ' objectius afegits al cicle ' + cy);
    };
    $all('[data-prop]').forEach(function (b) { b.onclick = function () { S.objectives.push({ id: uid(), study: s, cicle: cy, tipus: 'trans', scope: 'regio', target: '', q: b.dataset.prop, origen: 'Proposta del quadre' }); save(); render(); }; });
    $all('[data-obdel]').forEach(function (b) { b.onclick = function () { S.objectives = S.objectives.filter(function (o) { return o.id !== b.dataset.obdel; }); save(); render(); }; });
    $all('[data-cfgk]').forEach(function (i) {
      i.onchange = function () { var l = cfg(s)[i.dataset.cfgk], q = i.dataset.q; if (i.checked && l.indexOf(q) < 0) l.push(q); if (!i.checked && l.indexOf(q) >= 0) l.splice(l.indexOf(q), 1); l.sort(qSort); save(); };
    });
    $all('[data-ft]').forEach(function (i) { i.onchange = function () { var f = cfg(s).fitxa; f[fy] = f[fy] || {}; f[fy][i.dataset.ft] = i.value.trim(); save(); }; });
  }

  /* ---------- Visió global (tots els estudis, sense mitjanes) ---------- */
  function overviewRows() {
    return STUDIES.map(function (st) {
      var m = meta(st.id);
      if (!m.years.length) return { st: st, empty: true };
      var y = m.years[0], pv = m.years[1] || null, K = m.active;
      var dist = { r: 0, a: 0, g: 0 };
      K.forEach(function (k) { m.qs.forEach(function (q) { var v = val(st.id, y, k, q); if (v != null) dist[sem(q, v)]++; }); });
      var tot = dist.r + dist.a + dist.g;
      var row = { st: st, y: y, pv: pv, n: K.length, dist: dist, red: tot ? dist.r / tot : 0 };
      ['P101', 'P102'].forEach(function (q) {
        var vs = cvals(st.id, y, K, q), cat = val(st.id, y, 'CAT', q);
        row[q] = { cat: cat, n: vs.length, below: cat == null ? null : vs.filter(function (x) { return round3(x.v) < round3(cat); }).length, min: vs.length ? Math.min.apply(null, vs.map(function (x) { return x.v; })) : null, max: vs.length ? Math.max.apply(null, vs.map(function (x) { return x.v; })) : null, off: off(st.id, y, q) };
      });
      var wq = null;
      m.qs.forEach(function (q) { var vs = cvals(st.id, y, K, q); var nr = vs.filter(function (x) { return sem(q, x.v) === 'r'; }).length; if (vs.length && (!wq || nr > wq.nr)) wq = { q: q, nr: nr, n: vs.length }; });
      row.worst = wq;
      return row;
    });
  }
  function renderOverview() {
    var p = $('#panel'), rows = overviewRows(), full = rows.filter(function (r) { return !r.empty; });
    var hls = [];
    hls.push({ tone: full.length === STUDIES.length ? 'g' : 'a', kicker: 'Cobertura', big: full.length + ' de ' + STUDIES.length, text: 'estudis PLAENSA carregats al quadre', sub: full.map(function (r) { return r.st.id + ' ' + r.y; }).join(' · ') });
    var wb = full.filter(function (r) { return r.P101.cat != null && r.P101.n; }).sort(function (a, b) { return b.P101.below / b.P101.n - a.P101.below / a.P101.n; });
    if (wb.length) {
      hls.push({ tone: 'r', kicker: 'Satisfacció per sota de Catalunya', big: wb[0].P101.below + ' de ' + wb[0].P101.n, text: wb[0].st.name + ': centres per sota de Catalunya (' + fmt('P101', wb[0].P101.cat) + ')',
        viz: { t: 'rank', min: 0, items: wb.map(function (r) { return { name: r.st.id, v: r.P101.below / r.P101.n * 100, tone: r.P101.below / r.P101.n > 0.5 ? 'r' : 'a', label: r.P101.below + '/' + r.P101.n }; }) } });
    }
    if (full.length) {
      var wr = full.slice().sort(function (a, b) { return b.red - a.red; })[0];
      hls.push({ tone: wr.red > 0.25 ? 'r' : 'a', kicker: 'Més àrea de millora', big: pct(wr.dist.r, wr.dist.r + wr.dist.a + wr.dist.g), text: wr.st.name + ': resultats centre·pregunta en vermell', sub: wr.worst ? 'Pregunta amb més centres en vermell: ' + qshort(wr.st.id, wr.worst.q, 60) + ' (' + wr.worst.nr + ' de ' + wr.worst.n + ')' : '',
        viz: { t: 'dist', parts: [{ n: wr.dist.r, tone: 'r', label: 'Vermell' }, { n: wr.dist.a, tone: 'a', label: 'Taronja' }, { n: wr.dist.g, tone: 'g', label: 'Verd' }] } });
      var fg = full.slice().sort(function (a, b) { return b.dist.g / (b.dist.r + b.dist.a + b.dist.g || 1) - a.dist.g / (a.dist.r + a.dist.a + a.dist.g || 1); })[0];
      hls.push({ tone: 'g', kicker: 'Més excel·lència', big: pct(fg.dist.g, fg.dist.r + fg.dist.a + fg.dist.g), text: fg.st.name + ': resultats centre·pregunta en verd' });
    }
    var html = '<div class="study-head"><div class="title-row">' + icon('ALL', 56) + '<div><h2>Visió global PLAENSA</h2><div class="sub">Regió Sanitària Metropolitana Nord · últim any disponible de cada estudi · resultats per centre (sense mitjanes no consolidades)</div></div></div>' +
      '<div class="filters"><button class="btn" type="button" id="ov-rep">Informe comitè (HTML)</button><button class="btn primary" type="button" id="ov-load">Carregar Excel</button></div></div>' +
      '<div style="margin-top:16px">' + hl(hls, ['Tots els estudis', full.length + ' carregats']) + '</div>' +
      '<h3 class="sec-h">Estudis</h3><div class="ov-grid">' + rows.map(function (r) {
        if (r.empty) return '<button type="button" class="ov-tile empty" data-open="' + r.st.id + '"><span class="ov-head">' + icon(r.st.id, 36) + '<span><span class="ov-code">' + r.st.id + '</span><br><span class="ov-name">' + esc(r.st.name) + '</span></span></span><span class="ov-empty">Sense dades · fes clic per obrir-lo i carregar l\'Excel</span></button>';
        var a = r.P101, b = r.P102, c = a.cat != null && a.n ? (a.below > a.n / 2 ? 'r' : a.below ? 'a' : 'g') : 'n';
        return '<button type="button" class="ov-tile t-' + c + '" data-open="' + r.st.id + '">' +
          '<span class="ov-top"><span class="ov-code">' + r.st.id + ' · ' + r.y + (r.pv ? ' vs ' + r.pv : '') + '</span><span class="kpi-meta">' + r.n + ' centres</span></span>' +
          '<span class="ov-head">' + icon(r.st.id, 36) + '<span class="ov-name">' + esc(r.st.name) + '</span></span>' +
          '<span class="ov-kpis"><span><span class="ov-lbl">Satisfacció · centres per sota de CAT</span><span class="ov-big">' + (a.below != null ? a.below + '<small>/' + a.n + '</small>' : '–') + '</span><span class="ov-d">Catalunya ' + fmt('P101', a.cat) + ' · rang ' + fmt('P101', a.min) + '–' + fmt('P101', a.max) + '</span></span>' +
          '<span><span class="ov-lbl">Fidelitat · centres per sota de CAT</span><span class="ov-big sm">' + (b.below != null ? b.below + '<small>/' + b.n + '</small>' : '–') + '</span><span class="ov-d">Catalunya ' + fmt('P102', b.cat) + '</span></span></span>' +
          '<span class="ov-lbl" style="margin-top:6px">Semàfor de ' + r.n + ' centres</span>' +
          hlViz({ t: 'dist', parts: [{ n: r.dist.r, tone: 'r', label: 'Vermell' }, { n: r.dist.a, tone: 'a', label: 'Taronja' }, { n: r.dist.g, tone: 'g', label: 'Verd' }] }) +
          (r.worst ? '<span class="ov-worst"><span class="dot r"></span>Més centres en vermell: <strong>' + esc(qshort(r.st.id, r.worst.q, 60)) + '</strong> · ' + r.worst.nr + ' de ' + r.worst.n + '</span>' : '') +
          '<span class="ov-open">Obrir l\'estudi →</span></button>';
      }).join('') + '</div>' +
      (full.length ? '<div class="grid g2" style="margin-top:18px"><div class="card block"><h3>Satisfacció global · rang de centres i Catalunya</h3><div class="chart-box"><canvas id="ov-101"></canvas></div></div><div class="card block"><h3>Fidelitat · rang de centres i Catalunya</h3><div class="chart-box"><canvas id="ov-102"></canvas></div></div></div>' : '') +
      '<div class="note" style="margin-top:12px">La barra va del centre amb el resultat més baix al més alt; el rombe és el valor de Catalunya. No es calculen mitjanes de la regió: no són dades consolidades. Cada estudi té el seu qüestionari i calendari.</div>';
    p.innerHTML = html;
    $('#ov-load').onclick = openLoad;
    $('#ov-rep').onclick = function () { exportReport('ALL'); };
    $all('[data-open]').forEach(function (b) { b.onclick = function () { openStudy(b.dataset.open); }; });
    ['P101', 'P102'].forEach(function (q) {
      var rs = full.filter(function (r) { return r[q].min != null; });
      chart(q === 'P101' ? 'ov-101' : 'ov-102', {
        type: 'bar',
        data: { labels: rs.map(function (r) { return r.st.id; }), datasets: [
          { label: 'Rang de centres', data: rs.map(function (r) { return [as100(q, r[q].min), as100(q, r[q].max)]; }), backgroundColor: css('--line'), borderColor: css('--muted'), borderWidth: 1, borderRadius: 4, barPercentage: 0.5, order: 2 },
          { type: 'line', label: 'Catalunya', data: rs.map(function (r) { return as100(q, r[q].cat); }), showLine: false, pointStyle: 'rectRot', pointRadius: 8, borderColor: css('--accent'), backgroundColor: css('--accent'), order: 0 }] },
        options: { scales: { y: pctAxis(50), x: { grid: { display: false } } }, plugins: { tooltip: { callbacks: { title: function (it) { return rs[it[0].dataIndex].st.name; }, label: function (c) { var r = rs[c.dataIndex][q]; return c.datasetIndex ? 'Catalunya: ' + fmt(q, r.cat) : 'Centres: ' + fmt(q, r.min) + ' – ' + fmt(q, r.max); } } } } }
      });
    });
  }

  /* ---------- Modals ---------- */
  function openModal(title, body, foot) {
    closeModal();
    var bg = document.createElement('div'); bg.className = 'modal-bg'; bg.id = 'modal';
    bg.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><header><h2>' + esc(title) + '</h2><button type="button" class="btn ghost" data-close aria-label="Tancar">✕</button></header><div class="body">' + body + '</div>' + (foot ? '<footer>' + foot + '</footer>' : '') + '</div>';
    document.body.appendChild(bg);
    bg.addEventListener('click', function (e) { if (e.target === bg || e.target.hasAttribute('data-close')) closeModal(); });
    return bg;
  }
  function closeModal() { var m = $('#modal'); if (m) m.remove(); }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

  /* ---------- Càrrega d'Excel ---------- */
  var pending = [];
  function openLoad() {
    pending = [];
    openModal('Carregar resultats PLAENSA',
      '<div class="drop" id="drop" tabindex="0" role="button">Arrossega aquí els Excel o <strong>fes clic per triar-los</strong><br><small>Format oficial (fila «Pregunta resumida», una columna per centre i any) o plantilla normalitzada. Pots carregar diversos fitxers alhora.</small></div>' +
      '<input type="file" id="file-in" accept=".xlsx,.xls,.xlsm" multiple hidden><div id="files"></div>',
      '<button type="button" class="btn" id="tpl">Descarregar plantilla</button><button type="button" class="btn" data-close>Cancel·lar</button><button type="button" class="btn primary" id="do-merge" disabled>Incorporar dades</button>');
    var drop = $('#drop'), inp = $('#file-in');
    drop.onclick = function () { inp.click(); };
    drop.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.click(); } };
    drop.ondragover = function (e) { e.preventDefault(); drop.classList.add('over'); };
    drop.ondragleave = function () { drop.classList.remove('over'); };
    drop.ondrop = function (e) { e.preventDefault(); drop.classList.remove('over'); readFiles(e.dataTransfer.files); };
    inp.onchange = function () { readFiles(inp.files); };
    $('#tpl').onclick = downloadTemplate;
    $('#do-merge').onclick = doMerge;
  }
  function readFiles(files) {
    Array.prototype.forEach.call(files, function (f) {
      var fr = new FileReader();
      fr.onload = function () {
        try {
          var wb = XLSX.read(new Uint8Array(fr.result), { type: 'array' });
          var p = { file: f.name, wb: wb, opts: {}, parsed: null, sel: {} };
          reparse(p);
          pending.push(p);
        } catch (err) {
          pending.push({ file: f.name, error: 'No s\'ha pogut llegir el fitxer: ' + err.message });
        }
        renderPending();
      };
      fr.readAsArrayBuffer(f);
    });
  }
  function reparse(p) {
    p.parsed = PLP.parseWorkbook(XLSX, p.wb, p.file, p.opts);
    p.study = p.opts.study || p.parsed.study || '';
    p.parsed.sheets.forEach(function (sh) { if (p.sel[sh.name] == null) p.sel[sh.name] = sh.ok; if (!sh.ok) p.sel[sh.name] = false; });
  }
  function colLetter(i) { var s = ''; i++; while (i > 0) { var r = (i - 1) % 26; s = String.fromCharCode(65 + r) + s; i = Math.floor((i - 1) / 26); } return s; }
  function renderPending() {
    var box = $('#files'); if (!box) return;
    box.innerHTML = pending.map(function (p, i) {
      if (p.error) return '<div class="filecard"><strong>' + esc(p.file) + '</strong><div class="note warn">' + esc(p.error) + '</div></div>';
      var crossConf = crossConflicts(p);
      return '<div class="filecard"><div class="fh"><div><strong>' + esc(p.file) + '</strong><div class="kpi-meta">' + (Object.keys(p.parsed.legend).length ? 'Llegenda de sectors trobada (' + Object.keys(p.parsed.legend).length + ' centres)' : '') + '</div></div>' +
        '<div class="filters"><div class="field"><label for="st-' + i + '">Estudi</label><select id="st-' + i + '" data-i="' + i + '" class="st-sel"><option value="">— tria l\'estudi —</option>' + STUDIES.map(function (s) { return '<option value="' + s.id + '"' + (p.study === s.id ? ' selected' : '') + '>' + s.id + ' · ' + esc(s.name) + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label for="dy-' + i + '">Any per defecte</label><input id="dy-' + i + '" data-i="' + i + '" class="dy-in" type="number" min="2015" max="2040" style="width:90px" value="' + (p.opts.defaultYear || '') + '" placeholder="auto"></div></div></div>' +
        p.parsed.sheets.map(function (sh) {
          var info = sh.ok ? (sh.nCentres + ' centres · ' + sh.nQuestions + ' preguntes · anys ' + sh.years.join(', ') + ' · ' + sh.records.length + ' valors · ' + (sh.format === 'plantilla' ? 'plantilla' : 'format oficial')) : esc(sh.reason);
          var manual = '';
          if (!sh.ok && sh.grid && sh.grid.length) {
            manual = '<details><summary>Assignar columnes a mà</summary><div class="toolbar" style="margin-top:6px"><div class="field"><label>Fila de capçalera</label><input type="number" min="1" class="mr" style="width:70px" data-i="' + i + '" data-sh="' + esc(sh.name) + '"></div><div class="field"><label>Columna de preguntes</label><input class="mc" style="width:60px" placeholder="B" data-i="' + i + '" data-sh="' + esc(sh.name) + '"></div><button type="button" class="btn sm apply-m" data-i="' + i + '" data-sh="' + esc(sh.name) + '">Tornar a llegir</button></div>' +
              '<div class="tscroll" style="margin-top:6px"><table class="mini"><tr><td></td>' + (sh.grid[0] || []).slice(0, 10).map(function (_, c) { return '<td class="rn">' + colLetter(c) + '</td>'; }).join('') + '</tr>' + sh.grid.map(function (row, r) { return '<tr><td class="rn">' + (r + 1) + '</td>' + (row || []).slice(0, 10).map(function (v) { return '<td>' + esc(v == null ? '' : v) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table></div></details>';
          }
          return '<div class="sheetrow"><input type="checkbox" class="sh-sel" aria-label="Incloure el full ' + esc(sh.name) + '" data-i="' + i + '" data-sh="' + esc(sh.name) + '"' + (p.sel[sh.name] ? ' checked' : '') + (sh.ok ? '' : ' disabled') + '><div><strong>' + esc(sh.name) + '</strong> <span class="kpi-meta" style="display:inline">' + info + '</span>' +
            (sh.warnings || []).map(function (w) { return '<div class="w">⚠ ' + esc(w) + '</div>'; }).join('') + manual + '</div></div>';
        }).join('') +
        (crossConf.length ? '<div class="note warn">' + crossConf.length + ' valors no coincideixen entre fulls del mateix fitxer (es manté el del primer full marcat). Ex.: ' + esc(crossConf.slice(0, 2).join(' · ')) + '</div>' : '') +
        (!p.study ? '<div class="note warn">Tria l\'estudi per poder incorporar aquest fitxer.</div>' : '') + '</div>';
    }).join('');
    $all('.st-sel').forEach(function (s) { s.onchange = function () { var p = pending[+s.dataset.i]; p.opts.study = s.value; reparse(p); renderPending(); }; });
    $all('.dy-in').forEach(function (s) { s.onchange = function () { var p = pending[+s.dataset.i]; p.opts.defaultYear = +s.value || null; reparse(p); renderPending(); }; });
    $all('.sh-sel').forEach(function (c) { c.onchange = function () { pending[+c.dataset.i].sel[c.dataset.sh] = c.checked; renderPending(); }; });
    $all('.apply-m').forEach(function (b) {
      b.onclick = function () {
        var p = pending[+b.dataset.i], sh = b.dataset.sh;
        var r = +$('.mr[data-i="' + b.dataset.i + '"][data-sh="' + sh + '"]').value, cl = ($('.mc[data-i="' + b.dataset.i + '"][data-sh="' + sh + '"]').value || '').trim().toUpperCase();
        if (!r || !/^[A-Z]+$/.test(cl)) { toast('Indica la fila (número) i la columna (lletra) on hi ha les preguntes.'); return; }
        var c = 0; for (var j = 0; j < cl.length; j++) c = c * 26 + (cl.charCodeAt(j) - 64);
        p.opts.manual = p.opts.manual || {}; p.opts.manual[sh] = { r: r - 1, c: c - 1 };
        p.sel[sh] = true; reparse(p); renderPending();
      };
    });
    var ready = pending.some(function (p) { return !p.error && p.study && p.parsed.sheets.some(function (sh) { return sh.ok && p.sel[sh.name]; }); });
    $('#do-merge').disabled = !ready;
  }
  function crossConflicts(p) {
    var m = {}, out = [];
    p.parsed.sheets.forEach(function (sh) {
      if (!sh.ok || !p.sel[sh.name]) return;
      sh.records.forEach(function (r) {
        var id = r.y + '|' + r.k + '|' + r.q;
        if (m[id] == null) m[id] = { v: r.v, sh: sh.name };
        else if (Math.abs(m[id].v - r.v) > 0.0005) out.push(r.k + ' ' + r.q + ' ' + r.y + ': ' + m[id].v + ' («' + m[id].sh + '») vs ' + r.v + ' («' + sh.name + '»)');
      });
    });
    return out;
  }
  function doMerge() {
    var msgs = [], last = null;
    pending.forEach(function (p) {
      if (p.error || !p.study) return;
      var r = mergeParsed(p.study, p.parsed, p.sel);
      msgs.push(p.study + ': ' + r.added + ' nous, ' + r.updated + ' actualitzats');
      last = p.study;
    });
    save(); closeModal();
    if (last) { UI.study = last; UI.year = null; UI.prev = null; }
    render();
    toast('Dades incorporades · ' + msgs.join(' · '));
    var noSector = Object.keys(S.centres).filter(function (k) { var c = S.centres[k]; return c.type === 'centre' && !c.sector && !c.excluded; });
    if (noSector.length) setTimeout(function () { toast(noSector.length + ' centres sense sector: assigna\'ls a Configuració › Centres i sectors.'); }, 4400);
  }
  function downloadTemplate() {
    var aoa = [['estudi', 'any', 'codi_centre', 'centre', 'sector', 'tipus', 'pregunta_codi', 'pregunta', 'valor', 'n', 'ic_inf', 'ic_sup', 'signif_cat', 'millor_cat'],
      ['AI', 2026, '9999', 'Centre d\'exemple', 'Maresme Central', 'centre', 'P101', 'Grau de satisfacció global', 8.4, 120, 8.1, 8.7, '+', ''],
      ['AI', 2026, '9999', 'Centre d\'exemple', 'Maresme Central', 'centre', 'P102', 'Continuaria venint?', 0.91, 120, 0.85, 0.95],
      ['AI', 2026, 'CAT', 'Catalunya', '', 'referència', 'P101', 'Grau de satisfacció global', 8.1, '', '', '']];
    var help = [['Plantilla normalitzada PLAENSA'], [''],
      ['estudi', 'AEA, URG, AH, TRD, AP, EMB o AI'], ['any', 'Any de l\'edició (p. ex. 2026)'], ['codi_centre', 'Número d\'UP (p. ex. 272) o CAT/RSBMN per a referències'],
      ['centre', 'Nom del centre'], ['sector', 'Sector sanitari (opcional; es pot editar al quadre)'], ['tipus', '"centre" o "referència"'],
      ['pregunta_codi', 'P1, P2 … P101, P102'], ['pregunta', 'Text resumit de la pregunta'], ['valor', 'Proporció 0–1 (o %) ; P101 en escala 0–10'],
      ['n', 'Opcional: nombre de respostes (permet calcular significació)'], ['ic_inf / ic_sup', 'Opcional: interval de confiança del 95%'], ['signif_cat', 'Opcional: + o − si el resultat és estadísticament significatiu respecte a Catalunya'], ['millor_cat', 'Opcional: nom de la UP amb el millor resultat de Catalunya en aquesta pregunta']];
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Dades');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(help), 'Instruccions');
    XLSX.writeFile(wb, 'Plantilla_PLAENSA_normalitzada.xlsx');
  }


  /* ---------- Configuració ---------- */
  var cfgTab = 'centres';
  function openConfig() {
    openModal('Configuració', '<div class="seg" id="cfg-tabs">' + [['centres', 'Centres i sectors'], ['llindars', 'Llindars'], ['dades', 'Dades i còpies']].map(function (x) { return '<button type="button" data-ct="' + x[0] + '" class="' + (cfgTab === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div><div id="cfg-body"></div>', '<button type="button" class="btn primary" data-close>Fet</button>');
    $all('[data-ct]').forEach(function (b) { b.onclick = function () { cfgTab = b.dataset.ct; $all('[data-ct]').forEach(function (x) { x.classList.toggle('on', x === b); }); renderCfg(); }; });
    renderCfg();
    $('#modal').addEventListener('click', function (e) { if (e.target.hasAttribute('data-close')) render(); });
  }
  function renderCfg() {
    var b = $('#cfg-body');
    if (cfgTab === 'centres') {
      var ks = Object.keys(S.centres).filter(function (k) { return S.centres[k].type === 'centre'; }).sort(centreSort);
      var allSec = uniq(SECTOR_ORDER.concat(ks.map(function (k) { return S.centres[k].sector; }).filter(Boolean)));
      b.innerHTML = '<div class="note">Els centres sense sector o marcats com a exclosos (p. ex. Guttmann, monogràfic) no entren a les comparatives ni als marcs de millor/pitjor, però es poden consultar. ICO Badalona s\'assigna per defecte a Barcelonès Nord i Baix Maresme. Les preguntes CPR, transversals i específiques es configuren a la pestanya «Objectius i configuració» de cada estudi.</div>' +
        '<div class="field" style="margin-top:8px"><input type="search" id="cf-find" placeholder="Cerca un centre…" aria-label="Cerca un centre"></div>' +
        '<datalist id="sec-list">' + allSec.map(function (x) { return '<option value="' + esc(x) + '">'; }).join('') + '</datalist>' +
        '<div class="tscroll" style="max-height:55vh;margin-top:8px"><table class="t"><thead><tr><th>Codi</th><th>Nom</th><th>Nom curt</th><th>Sector</th><th>Exclòs</th></tr></thead><tbody>' +
        ks.map(function (k) {
          var c = S.centres[k];
          return '<tr data-find="' + esc((k + ' ' + c.name + ' ' + (c.short || '')).toLowerCase()) + '"><td><code>' + esc(k) + '</code></td><td><input data-k="' + k + '" data-f="name" value="' + esc(c.name) + '" style="width:100%;min-width:180px" aria-label="Nom"></td>' +
            '<td><input data-k="' + k + '" data-f="short" value="' + esc(c.short || '') + '" placeholder="opcional" aria-label="Nom curt"></td>' +
            '<td><input data-k="' + k + '" data-f="sector" list="sec-list" value="' + esc(c.sector || '') + '" aria-label="Sector" style="min-width:200px"></td>' +
            '<td><input type="checkbox" data-k="' + k + '" data-f="excluded"' + (c.excluded ? ' checked' : '') + ' aria-label="Exclòs"></td></tr>';
        }).join('') + '</tbody></table></div>';
      $all('#cfg-body input[data-k]').forEach(function (i) {
        i.onchange = function () { var c = S.centres[i.dataset.k]; c[i.dataset.f] = i.type === 'checkbox' ? i.checked : i.value.trim(); c.userEdited = true; invalidate(); save(); };
      });
      $('#cf-find').oninput = function () { var t = this.value.toLowerCase(); $all('#cfg-body tr[data-find]').forEach(function (r) { r.hidden = t && r.dataset.find.indexOf(t) < 0; }); };
    } else if (cfgTab === 'llindars') {
      var t = S.config.thr;
      b.innerHTML = '<div class="note">Criteris del document de treball: vermell &lt; 75% (àrea de millora), taronja 75–89,9% (estàndard), verd ≥ 90% (excel·lència). P101 (0–10): vermell &lt; 7,5; taronja 7,5–8,9; verd ≥ 9. Diferències rellevants: ±5 pp; P101 ±0,5 punts.</div>' +
        '<div class="grid g4">' + [['red', 'Vermell per sota de (proporció)', t.red], ['green', 'Verd a partir de (proporció)', t.green], ['red101', 'P101 vermell per sota de', t.red101], ['green101', 'P101 verd a partir de', t.green101], ['diff', 'Diferència rellevant (proporció)', t.diff], ['diff101', 'Diferència rellevant P101', t.diff101]]
          .map(function (x) { return '<div class="field"><label for="th-' + x[0] + '">' + x[1] + '</label><input id="th-' + x[0] + '" type="number" step="0.01" data-th="' + x[0] + '" value="' + x[2] + '"></div>'; }).join('') + '</div>' +
        '<div class="toolbar"><button type="button" class="btn" id="th-reset">Restablir valors del document de treball</button></div>';
      $all('[data-th]').forEach(function (i) { i.onchange = function () { var v = parseFloat(i.value); if (!isNaN(v)) { S.config.thr[i.dataset.th] = v; save(); } }; });
      $('#th-reset').onclick = function () { S.config.thr = freshState().config.thr; save(); renderCfg(); toast('Llindars restablerts'); };
    } else {
      var byStudy = STUDIES.map(function (st) { var m = meta(st.id); return { id: st.id, name: st.name, years: m.years, n: Object.keys(S.records).filter(function (k) { return k.indexOf(st.id + '|') === 0; }).length }; });
      b.innerHTML = '<div class="tscroll"><table class="t"><thead><tr><th>Estudi</th><th>Anys</th><th class="v">Valors</th><th></th></tr></thead><tbody>' +
        byStudy.map(function (x) { return '<tr><td>' + x.id + ' · ' + esc(x.name) + '</td><td>' + (x.years.slice().reverse().join(', ') || '—') + '</td><td class="v">' + x.n + '</td><td>' + (x.n ? '<button type="button" class="btn sm danger" data-delst="' + x.id + '">Esborrar dades</button>' : '') + '</td></tr>'; }).join('') + '</tbody></table></div><div id="cfg-confirm"></div>' +
        '<div class="block"><h3>Còpia de seguretat</h3><div class="toolbar"><button type="button" class="btn" id="bk-exp">Exportar còpia (JSON)</button><button type="button" class="btn" id="bk-imp">Importar còpia (JSON)</button><input type="file" id="bk-file" accept=".json,application/json" hidden><button type="button" class="btn" id="bk-tpl">Descarregar plantilla Excel</button><button type="button" class="btn danger" id="bk-reset">Restaurar dades inicials</button></div>' +
        '<div class="note">Les dades es guarden en aquest navegador. La còpia JSON inclou dades, centres, configuració i accions de millora: serveix per passar el quadre a un altre ordinador o company.</div></div>' +
        '<div class="block"><h3>Historial de càrregues</h3>' + (S.loads.length ? '<div class="tscroll"><table class="t"><thead><tr><th>Data</th><th>Fitxer</th><th>Estudi</th><th class="v">Nous</th><th class="v">Actualitzats</th></tr></thead><tbody>' + S.loads.slice().reverse().map(function (l) { return '<tr><td>' + esc(l.date.slice(0, 16).replace('T', ' ')) + '</td><td>' + esc(l.file) + '</td><td>' + esc(l.study) + '</td><td class="v">' + l.added + '</td><td class="v">' + l.updated + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<div class="note">Cap càrrega encara.</div>') + '</div>';
      $all('[data-delst]').forEach(function (x) {
        x.onclick = function () {
          var id = x.dataset.delst;
          $('#cfg-confirm').innerHTML = '<div class="confirm">S\'esborraran tots els valors de ' + id + ' (les accions de millora es conserven). <button type="button" class="btn sm danger" id="cf-yes">Esborrar</button><button type="button" class="btn sm" id="cf-no">Cancel·lar</button></div>';
          $('#cf-yes').onclick = function () { Object.keys(S.records).forEach(function (k) { if (k.indexOf(id + '|') === 0) delete S.records[k]; }); invalidate(); save(); renderCfg(); toast('Dades de ' + id + ' esborrades'); };
          $('#cf-no').onclick = function () { $('#cfg-confirm').innerHTML = ''; };
        };
      });
      $('#bk-exp').onclick = function () { saveBlob(new Blob([JSON.stringify(S)], { type: 'application/json' }), 'PLAENSA_quadre_copia_' + new Date().toISOString().slice(0, 10) + '.json'); };
      $('#bk-imp').onclick = function () { $('#bk-file').click(); };
      $('#bk-file').onchange = function () {
        var f = this.files[0]; if (!f) return;
        var fr = new FileReader();
        fr.onload = function () {
          try {
            var o = JSON.parse(fr.result);
            if (!o || !o.records || !o.centres) throw new Error('format incorrecte');
            S = migrate(Object.assign(freshState(), o)); invalidate(); save(); renderCfg(); toast('Còpia importada');
          } catch (e) { toast('No s\'ha pogut importar la còpia: ' + e.message); }
        };
        fr.readAsText(f);
      };
      $('#bk-tpl').onclick = downloadTemplate;
      $('#bk-reset').onclick = function () {
        $('#cfg-confirm').innerHTML = '<div class="confirm">Es perdran totes les càrregues, la configuració i les accions. Exporta abans una còpia si les vols conservar. <button type="button" class="btn sm danger" id="rs-yes">Restaurar</button><button type="button" class="btn sm" id="rs-no">Cancel·lar</button></div>';
        $('#rs-yes').onclick = function () { S = freshState(); loadDefault(); invalidate(); save(); renderCfg(); toast('Dades inicials restaurades (AEA 2026)'); };
        $('#rs-no').onclick = function () { $('#cfg-confirm').innerHTML = ''; };
      };
    }
  }

  /* ---------- Dades incrustades (AEA 2026 vs 2024) ---------- */
  function loadDefault() {
    var d = window.PL_DEFAULT;
    if (!d) return;
    var sel = {}; d.parsed.sheets.forEach(function (sh) { sel[sh.name] = true; });
    mergeParsed(d.study, d.parsed, sel);
    S.loads[S.loads.length - 1].file += ' (incrustat)';
  }

  /* ---------- Informe estàtic per al comitè ---------- */
  function exportReport(s) {
    var keep = UI.sub, parts = [];
    var list = s === 'ALL' ? [['ov', 'Visió global de tots els estudis']] : SUBS.filter(function (x) { return x[0] !== 'obj'; });
    try {
      list.forEach(function (x) {
        if (s !== 'ALL') UI.sub = x[0];
        render();
        var src = s === 'ALL' ? $('#panel') : $('#sub');
        var cl = src.cloneNode(true);
        var oc = $all('canvas', src), cc = $all('canvas', cl);
        cc.forEach(function (c, i) {
          var img = document.createElement('img'); img.alt = 'Gràfic'; img.style.width = '100%';
          try { img.src = oc[i].toDataURL('image/png'); } catch (e) { /* gràfic no exportable */ }
          c.parentNode.replaceChild(img, c);
        });
        $all('.picklist, .fbar', cl).forEach(function (n) { var g = n.closest('.grid'); if (g) g.remove(); });
        $all('form', cl).forEach(function (f) { var g = f.closest('.grid'); (g || f).remove(); });
        $all('button, .toolbar, .filters, select, input, #del-confirm, .subtabs, .ce-head .field', cl).forEach(function (e) { e.remove(); });
        $all('.chart-box', cl).forEach(function (b) { b.style.height = 'auto'; });
        parts.push('<section class="rep-sec"><h2 class="rep-h">' + esc(x[1]) + '</h2>' + cl.innerHTML + '</section>');
      });
    } finally { UI.sub = keep; render(); }
    var title = s === 'ALL' ? 'Visió global PLAENSA' : studyName(s);
    var scope = s === 'ALL' ? 'Tots els estudis carregats · últim any de cada estudi' : 'PLAENSA ' + UI.year + (UI.prev ? ' vs ' + UI.prev : '') + ' · ' + (UI.sector || 'Regió Sanitària Metropolitana Nord');
    var today = new Date().toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    var logo = window.PL_LOGO ? '<img src="' + window.PL_LOGO + '" alt="Salut · Generalitat de Catalunya" style="height:30px;width:auto">' : '';
    var repCss = '.rep{padding-block:24px;max-width:1280px}.rep-top{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;border-bottom:3px solid var(--accent);padding-bottom:12px;margin-bottom:8px}' +
      '.rep-top h1{font-family:var(--font-display);font-size:30px}.rep-top p{margin:4px 0 0;color:var(--muted)}.rep-h{font-family:var(--font-display);font-size:22px;margin:30px 0 12px;padding-left:10px;border-left:5px solid var(--accent)}' +
      '.rep .tscroll{max-height:none!important}.rep .hl-card{animation:none}.rep .ov-tile{cursor:default}.rep .ov-open{display:none}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
      '@page{size:A4 landscape;margin:10mm}@media print{.rep-sec{break-before:page}.rep-sec:first-of-type{break-before:auto}.hl,.card,.ov-tile,tr{break-inside:avoid}}';
    var doc = '<!doctype html><html lang="ca" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Informe PLAENSA · ' + esc(title) + '</title><style>' + document.getElementById('app-css').textContent + repCss + '</style></head><body><main class="wrap rep">' +
      '<header class="rep-top"><div><h1>Informe per al comitè de direcció · ' + esc(title) + '</h1><p>' + esc(scope) + ' · generat el ' + esc(today) + '</p></div>' + logo + '</header>' +
      parts.join('') + '<footer class="site">Font: CatSalut, PLAENSA. Informe generat amb el quadre de comandament PLAENSA RSBMN. Els semàfors segueixen els llindars del document de treball (vermell &lt; 75%, verd ≥ 90%; P101 &lt; 7,5 / ≥ 9). Per desar-lo en PDF: Imprimeix › Desa com a PDF (A4 horitzontal).</footer></main></body></html>';
    saveBlob(new Blob([doc], { type: 'text/html' }), 'Informe_comite_PLAENSA_' + (s === 'ALL' ? 'global' : s + '_' + UI.year) + '.html');
    toast('Informe generat: ' + title);
  }

  // Informe HTML d'una sola pestanya (p. ex. anàlisi d'un centre)
  function exportSub(s, title, fileName) {
    var src = $('#sub'), cl = src.cloneNode(true), oc = $all('canvas', src), cc = $all('canvas', cl);
    cc.forEach(function (c, i) { var img = document.createElement('img'); img.alt = 'Gràfic'; img.style.width = '100%'; try { img.src = oc[i].toDataURL('image/png'); } catch (e) { /* gràfic no exportable */ } c.parentNode.replaceChild(img, c); });
    $all('button, select, input, .fbar, .ce-head .field, #del-confirm', cl).forEach(function (e) { e.remove(); });
    $all('.chart-box', cl).forEach(function (b) { b.style.height = 'auto'; });
    var logoT = window.PL_LOGO ? '<img src="' + window.PL_LOGO + '" alt="Salut · Generalitat de Catalunya" style="height:30px;width:auto">' : '';
    var doc = '<!doctype html><html lang="ca" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(title) + '</title><style>' + document.getElementById('app-css').textContent +
      '.rep{padding-block:24px;max-width:1280px}.rep-top{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;border-bottom:3px solid var(--accent);padding-bottom:12px;margin-bottom:16px}.rep-top h1{font-family:var(--font-display);font-size:26px}.rep .tscroll{max-height:none!important}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:A4 landscape;margin:10mm}</style></head><body><main class="wrap rep">' +
      '<header class="rep-top"><div><h1>' + esc(title) + '</h1><p class="muted">' + esc(studyName(s)) + ' · PLAENSA ' + UI.year + (UI.prev ? ' vs ' + UI.prev : '') + ' · generat el ' + new Date().toLocaleDateString('ca-ES') + '</p></div>' + logoT + '</header>' + cl.innerHTML + '</main></body></html>';
    saveBlob(new Blob([doc], { type: 'text/html' }), fileName);
    toast('Informe generat');
  }

  /* ---------- Presentació ---------- */
  function buildPptx(s) {
    if (typeof PptxGenJS === 'undefined') { toast('No s\'ha carregat el generador de presentacions.'); return; }
    try {
      var K = scopeKeys(s);
      var ctx = { S: S, UI: UI, s: s, meta: meta(s), K: K, val: val, off: off, hasOff: hasOff, fmt: fmt, fmtD: fmtD, sem: sem, dcls: dcls, norm: norm, extremes: extremes, cname: cname, cfull: cfull,
        qname: qname, qshort: qshort, qlabel: qlabel, isCpr: isCpr, isTrans: isTrans, comparable: comparable, dif: dif, cfg: cfg, cprStatus: cprStatus, studyName: studyName, mean: mean, round3: round3, transitions: transitions,
        objectives: objectives, cicleList: cicleList, scopeLabel: scopeLabel, evalAction: evalAction, cvals: cvals,
        headlines: HL.resum(s).filter(function (h) { return h && !h.hint; }), scope: scopeName() };
      PLPPT.build(ctx).then(function (name) { toast('Presentació generada: ' + name); }).catch(function (e) { toast('Error en generar la presentació: ' + e.message); });
    } catch (e) { toast('Error en generar la presentació: ' + e.message); }
  }

  /* ---------- Arrencada ---------- */
  function boot() {
    app = document.getElementById('app');
    $('#b-load').onclick = openLoad;
    $('#b-cfg').onclick = openConfig;
    $('#b-theme').onclick = function () {
      var r = document.documentElement, cur = r.getAttribute('data-theme');
      var dark = cur ? cur === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      r.setAttribute('data-theme', dark ? 'light' : 'dark'); lsSet('plaensa-theme', dark ? 'light' : 'dark'); render();
    };
    var th = lsGet('plaensa-theme');
    // Per defecte, tema clar (menys contrast); el fosc només si l'usuari el tria
    if (th) document.documentElement.setAttribute('data-theme', th);
    else if (!document.documentElement.getAttribute('data-theme')) document.documentElement.setAttribute('data-theme', 'light');
    UI.sub = lsGet('plaensa-sub') || 'resum';
    document.addEventListener('click', function (e) { if (!e.target.closest('.fbar details.dd')) $all('.fbar details.dd[open]').forEach(function (d) { d.open = false; UI.openDD = ''; }); });
    DB.get('state').then(function (st) {
      if (st && st.records && Object.keys(st.records).length) { S = migrate(Object.assign(freshState(), st)); save(); }
      else { loadDefault(); save(); }
    }).catch(function () { loadDefault(); }).then(function () {
      invalidate();
      var saved = lsGet('plaensa-study');
      UI.study = saved && (saved === 'ALL' || STUDIES.some(function (x) { return x.id === saved; })) ? saved : 'ALL';
      render();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
