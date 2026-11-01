/* PLAENSA · Quadre de comandament RSBMN — lògica de l'aplicació */
(function () {
  'use strict';

  var STUDIES = PLP.STUDIES;
  var SECTOR_ORDER = ['Vallès Oriental', 'Vallès Occidental Est', 'Vallès Occidental Oest', 'Barcelonès Nord i Baix Maresme', 'Maresme Central'];
  var SHORT = {
    UP272: 'Can Ruti (HUGTiP)', UP729: 'Mútua Terrassa', UP734: 'Esperit Sant', UP741: 'Parc Taulí Sabadell',
    UP743: 'H. Sant Celoni', UP744: 'H. Terrassa', UP750: 'H. Granollers', UP753: 'H. Municipal Badalona (BSA)',
    UP908: 'H. Mollet', UP1425: 'H. Mataró', UP3536: 'ICO Badalona'
  };
  var DEFAULT_CPR = { URG: ['P7', 'P23', 'P26', 'P102'], AP: ['P2', 'P9', 'P15', 'P102'], TRD: ['P4', 'P5', 'P7', 'P9'] };
  var PALETTE = ['#1f6fb2', '#c2185b', '#2e7d32', '#ef6c00', '#6a1b9a', '#00838f', '#8d6e63', '#5c6bc0', '#9e9d24', '#d84315'];

  /* ---------- Estat ---------- */
  function freshState() {
    var studies = {};
    STUDIES.forEach(function (s) { studies[s.id] = { cpr: (DEFAULT_CPR[s.id] || []).slice(), trans: [] }; });
    return {
      version: 1, records: {}, centres: {}, questions: {},
      config: { studies: studies, thr: { red: 0.75, green: 0.90, red101: 7.5, green101: 9, diff: 0.05, diff101: 0.5 }, frames: { c: true, s: true, r: true } },
      actions: [], loads: []
    };
  }
  var S = freshState();
  var UI = { study: null, sub: 'resum', year: null, prev: null, sector: '', mxFilter: 'all', mxDiff: true,
    comp: { centres: null, refs: { CAT: true, RSBMN: true }, sectors: true, qs: null, evoQ: 'P101' }, accCentre: '', editAction: null };

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
  function val(s, y, k, q) { var r = rec(s, y, k, q); return r ? r.v : null; }
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
  function qlabel(s, q) { var t = qtext(s, q); return q + (t ? ' ' + t : ''); }
  function cfg(s) { return S.config.studies[s] || (S.config.studies[s] = { cpr: [], trans: [] }); }
  function isCpr(s, q) { return cfg(s).cpr.indexOf(q) >= 0; }
  function isTrans(s, q) { return cfg(s).trans.indexOf(q) >= 0; }
  function qtags(s, q) { return (isCpr(s, q) ? ' <span class="tag cpr">CPR</span>' : '') + (isTrans(s, q) ? ' <span class="tag tr">Transversal</span>' : ''); }

  /* Agregat de sector o regió: valor oficial si existeix (regió), si no mitjana de centres (ponderada per n si hi és). */
  function agg(s, y, scope, q, onlyKeys) {
    if (scope === 'CAT') return { v: val(s, y, 'CAT', q), official: true };
    if (scope === 'RSBMN' && !onlyKeys) {
      var off = val(s, y, 'RSBMN', q);
      if (off != null) return { v: off, official: true };
    }
    var m = meta(s);
    var ks = onlyKeys || (scope === 'RSBMN' ? m.active : m.active.filter(function (k) { return S.centres[k].sector === scope; }));
    var rs = ks.map(function (k) { return rec(s, y, k, q); }).filter(Boolean);
    if (!rs.length) return { v: null };
    var allN = rs.every(function (r) { return r.n; });
    if (allN) {
      var tn = rs.reduce(function (a, r) { return a + r.n; }, 0);
      return { v: rs.reduce(function (a, r) { return a + r.v * r.n; }, 0) / tn, n: tn, weighted: true };
    }
    return { v: mean(rs.map(function (r) { return r.v; })), k: rs.length };
  }
  function scopeKeys(s) {
    var m = meta(s);
    return UI.sector ? m.active.filter(function (k) { return S.centres[k].sector === UI.sector; }) : m.active;
  }
  function scopeName() { return UI.sector || 'RSBMN'; }

  /* Significació de la diferència: n (proporcions, z) o IC (no solapament). */
  function sig(s, k, q) {
    var a = rec(s, UI.year, k, q), b = rec(s, UI.prev, k, q);
    if (!a || !b) return null;
    if (a.lo != null && b.lo != null) return (a.lo > b.hi || a.hi < b.lo) ? 'sig' : 'nc';
    if (a.n && b.n && !is101(q)) {
      var p = (a.v * a.n + b.v * b.n) / (a.n + b.n);
      var se = Math.sqrt(p * (1 - p) * (1 / a.n + 1 / b.n));
      if (!se) return 'nc';
      return Math.abs((a.v - b.v) / se) > 1.96 ? 'sig' : 'nc';
    }
    return null;
  }
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
    return {
      best: cells.filter(function (c) { return c.v === best; }),
      worst: cells.filter(function (c) { return c.v === worst; })
    };
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
        if (!cur.sector && e.type === 'centre') cur.sector = legend[k] || e.sectorHint || '';
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
  function pctAxis(min) {
    return { min: min, max: 100, ticks: { callback: function (v) { return v + '%'; } }, grid: { color: css('--line') } };
  }
  function as100(q, v) { return v == null ? null : Math.round((is101(q) ? v * 10 : v * 100) * 10) / 10; }

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

    var subs = [['resum', 'Resum KPI i Top 5'], ['sf', 'Satisfacció i Fidelitat'], ['semafor', 'Semàfor per centre'], ['comp', 'Comparativa i evolució'], ['cpr', 'CPR i Accions de millora']];
    var html = '<div class="study-head"><div><h2>' + esc(studyName(s)) + '</h2><div class="sub">PLAENSA ' + UI.year + (UI.prev ? ' vs ' + UI.prev : '') + ' · ' + m.centres.length + ' centres · ' + m.qs.length + ' preguntes · Regió Sanitària Metropolitana Nord</div></div>' +
      '<div class="filters">' +
      '<div class="field"><label for="f-year">Any</label><select id="f-year">' + m.years.map(function (y) { return '<option' + (y === UI.year ? ' selected' : '') + '>' + y + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="f-prev">Comparar amb</label><select id="f-prev"><option value="">— cap —</option>' + m.years.filter(function (y) { return y < UI.year; }).map(function (y) { return '<option' + (y === UI.prev ? ' selected' : '') + '>' + y + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="f-sector">Àmbit</label><select id="f-sector"><option value="">Tota la regió (RSBMN)</option>' + m.sectors.map(function (x) { return '<option' + (x === UI.sector ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select></div>' +
      '<button class="btn primary" id="b-pptx" type="button">Descarregar presentació</button>' +
      '</div></div>' +
      '<nav class="subtabs" role="tablist">' + subs.map(function (x) { return '<button type="button" role="tab" class="subtab' + (UI.sub === x[0] ? ' active' : '') + '" data-sub="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</nav>' +
      '<div id="sub"></div>';
    p.innerHTML = html;
    $('#f-year').onchange = function () { UI.year = +this.value; UI.prev = null; UI.prevNone = false; render(); };
    $('#f-prev').onchange = function () { UI.prev = this.value ? +this.value : null; UI.prevNone = !this.value; render(); };
    $('#f-sector').onchange = function () { UI.sector = this.value; render(); };
    $('#b-pptx').onclick = function () { buildPptx(s); };
    $all('.subtab').forEach(function (b) { b.onclick = function () { UI.sub = b.dataset.sub; lsSet('plaensa-sub', UI.sub); render(); }; });
    var sub = $('#sub');
    ({ resum: renderResum, sf: renderSF, semafor: renderSemafor, comp: renderComp, cpr: renderCpr })[UI.sub](sub, s);
  }

  function renderStudyTabs() {
    $('#studies').innerHTML = '<button type="button" class="study-tab overview' + (UI.study === 'ALL' ? ' active' : '') + '" data-st="ALL"><span class="code">RSBMN · tots els estudis</span><span class="nm">Visió global</span></button>' + STUDIES.map(function (st) {
      var m = meta(st.id), has = m.years.length > 0;
      return '<button type="button" class="study-tab' + (UI.study === st.id ? ' active' : '') + (has ? '' : ' empty') + '" data-st="' + st.id + '">' +
        '<span class="code">' + st.id + (has ? ' · ' + m.years.join('/') : ' · sense dades') + '</span><span class="nm">' + esc(st.name) + '</span></button>';
    }).join('');
    $all('.study-tab').forEach(function (b) { b.onclick = function () { openStudy(b.dataset.st); }; });
  }

  function emptyStudy(s) {
    return '<div class="empty-state"><strong>' + esc(studyName(s)) + ': encara no hi ha dades</strong>' +
      '<span>Carrega l\'Excel de resultats PLAENSA d\'aquest estudi (format oficial amb la fila «Pregunta resumida») o la plantilla normalitzada.</span>' +
      '<div class="toolbar" style="justify-content:center"><button class="btn primary" type="button" id="e-load">Carregar Excel</button><button class="btn" type="button" id="e-tpl">Descarregar plantilla</button></div></div>';
  }
  function bindEmpty() { $('#e-load').onclick = openLoad; $('#e-tpl').onclick = downloadTemplate; }

  function sigNote(s) {
    return hasSigData(s) ? '<div class="note">Hi ha n o intervals de confiança: les diferències marcades amb * són estadísticament significatives (p&lt;0,05).</div>'
      : '<div class="note warn">Els fitxers no inclouen la mida mostral ni els intervals de confiança. Les diferències de ±' + (S.config.thr.diff * 100) + ' pp (P101 ±' + String(S.config.thr.diff101).replace('.', ',') + ') són un llindar de rellevància, no de significació estadística: en centres amb poques enquestes poden ser soroll.</div>';
  }

  /* ---------- Titulars per al comitè de direcció ---------- */
  function txtD(q, d) { return d == null ? '' : fmtD(q, d); }
  function shortQ(s, q) { var t = qtext(s, q); return t ? t.replace(/\?$/, '') : q; }
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
        '<div class="hv-legend">' + z.parts.map(function (p) { return '<span><i class="sq t-' + p.tone + '"></i>' + esc(p.label) + ' ' + p.n + '</span>'; }).join('') + '</div>';
    }
    if (z.t === 'strip') {
      return '<div class="hv-strip' + (z.items.length > 30 ? ' dense' : '') + '" role="img" aria-label="' + esc(z.label || '') + '">' + z.items.map(function (x) { return '<span class="t-' + x.tone + '" title="' + esc(x.name + ' · ' + x.label) + '"></span>'; }).join('') + '</div>' +
        '<div class="hv-legend"><span>' + esc(z.left || 'pitjor') + '</span><span>' + esc(z.right || 'millor') + '</span></div>';
    }
    if (z.t === 'diverge') {
      var mx = Math.max(z.up, z.down, 1);
      return '<div class="hv-div" role="img" aria-label="' + z.down + ' empitjoren, ' + z.up + ' milloren"><div class="l"><span class="t-r" style="width:' + (z.down / mx * 100) + '%"></span></div><div class="r"><span class="t-g" style="width:' + (z.up / mx * 100) + '%"></span></div></div>' +
        '<div class="hv-legend"><span>▼ empitjoren ' + z.down + '</span><span>milloren ' + z.up + ' ▲</span></div>';
    }
    if (z.t === 'rank') {
      return '<ul class="hv-rank">' + z.items.map(function (x) { return '<li><span class="nm">' + esc(x.name) + '</span><span class="tr"><span class="t-' + x.tone + '" style="width:' + Math.max(2, Math.min(100, (x.v - (z.min || 0)) / (100 - (z.min || 0)) * 100)) + '%"></span></span><span class="vl">' + esc(x.label) + '</span></li>'; }).join('') + '</ul>';
    }
    return '';
  }
  function hl(items, scope) {
    items = items.filter(Boolean);
    if (!items.length) return '';
    return '<section class="hl" aria-label="Titulars"><header class="hl-head"><span class="hl-eyebrow">Titulars per al comitè de direcció</span><span class="hl-scope">' + esc(scope) + '</span></header><div class="hl-grid">' +
      items.map(function (h) {
        return '<article class="hl-card t-' + h.tone + '"><div class="hl-kicker"><span class="dot ' + (h.tone === 'n' ? 'n' : h.tone) + '"></span>' + esc(h.kicker) + '</div><div class="hl-big">' + esc(h.big) + '</div><p class="hl-text">' + esc(h.text) + '</p>' + hlViz(h.viz) + (h.sub ? '<div class="hl-sub">' + esc(h.sub) + '</div>' : '') + '</article>';
      }).join('') + '</div></section>';
  }
  function hlScope() { return scopeName() + ' · PLAENSA ' + UI.year + (UI.prev ? ' vs ' + UI.prev : ''); }
  function aggS(s, y, q) { var keys = scopeKeys(s); return y ? agg(s, y, scopeName(), q, UI.sector ? keys : null).v : null; }

  var HL = {
    resum: function (s) {
      var m = meta(s), keys = scopeKeys(s), out = [];
      ['P101', 'P102'].forEach(function (q) {
        var v = aggS(s, UI.year, q), cat = val(s, UI.year, 'CAT', q), p = aggS(s, UI.prev, q);
        if (v == null) return;
        var d = cat != null ? v - cat : null, lim = is101(q) ? 0.05 : 0.005;
        out.push({
          tone: sem(q, v), kicker: q === 'P101' ? 'Satisfacció global' : 'Fidelitat',
          big: fmt(q, v),
          text: (q === 'P101' ? 'Satisfacció global ' : 'Fidelitat ') + (d == null ? '' : Math.abs(d) < lim ? 'en línia amb Catalunya' : d > 0 ? 'per sobre de Catalunya (' + txtD(q, d) + ')' : 'per sota de Catalunya (' + txtD(q, d) + ')'),
          sub: SEM_TXT[sem(q, v)] + (p != null ? ' · ' + txtD(q, v - p) + ' vs ' + UI.prev : ''),
          viz: { t: 'bullet', v: as100(q, v), cat: as100(q, cat), tone: sem(q, v), lo: is101(q) ? '4' : '40%', hi: is101(q) ? '10' : '100%', label: fmt(q, v) }
        });
      });
      var qv = m.qs.map(function (q) { var v = aggS(s, UI.year, q); return { q: q, v: v, n: norm(q, v) }; }).filter(function (x) { return x.v != null; });
      if (qv.length) {
        var w = qv.slice().sort(function (a, b) { return a.n - b.n; })[0];
        var st = stripOf(s, keys, w.q), nr = st.filter(function (x) { return x.tone === 'r'; }).length;
        out.push({ tone: sem(w.q, w.v), kicker: 'Punt més feble · ' + w.q, big: fmt(w.q, w.v), text: shortQ(s, w.q), sub: nr + ' de ' + st.length + ' centres en àrea de millora', viz: { t: 'strip', items: st, label: 'Centres per resultat' } });
      }
      if (UI.prev) {
        var up = 0, down = 0;
        keys.forEach(function (k) { m.qs.forEach(function (q) { var a = val(s, UI.year, k, q), b = val(s, UI.prev, k, q); var c = dcls(q, a != null && b != null ? a - b : null); if (c === 'up') up++; if (c === 'down') down++; }); });
        out.push({ tone: up > down ? 'g' : down > up ? 'r' : 'a', kicker: 'Evolució ' + UI.prev + ' → ' + UI.year, big: up + ' ▲  ' + down + ' ▼', text: up >= down ? 'Predominen les millores rellevants' : 'Predominen els empitjoraments rellevants', sub: 'Resultats centre·pregunta amb canvis de més de ' + S.config.thr.diff * 100 + ' pp', viz: { t: 'diverge', up: up, down: down } });
      } else if (qv.length) {
        var b = qv.slice().sort(function (a, b2) { return b2.n - a.n; })[0];
        out.push({ tone: sem(b.q, b.v), kicker: 'Fortalesa · ' + b.q, big: fmt(b.q, b.v), text: shortQ(s, b.q), sub: 'Millor pregunta de l\'àmbit', viz: { t: 'strip', items: stripOf(s, keys, b.q) } });
      }
      return out;
    },
    sf: function (s) {
      var keys = scopeKeys(s), out = [];
      ['P101', 'P102'].forEach(function (q) {
        var st = stripOf(s, keys, q); if (!st.length) return;
        var nr = st.filter(function (x) { return x.tone === 'r'; }).length, ng = st.filter(function (x) { return x.tone === 'g'; }).length;
        out.push({ tone: nr > st.length / 2 ? 'r' : nr ? 'a' : 'g', kicker: q === 'P101' ? 'Satisfacció global (P101)' : 'Fidelitat (P102)', big: nr + ' de ' + st.length,
          text: 'centres en àrea de millora' + (q === 'P101' ? ' (< ' + String(S.config.thr.red101).replace('.', ',') + ')' : ' (< ' + S.config.thr.red * 100 + '%)'), sub: ng + ' en excel·lència · ' + (st.length - nr - ng) + ' en àrea estàndard', viz: { t: 'strip', items: st, label: q } });
      });
      var st1 = stripOf(s, keys, 'P101');
      if (st1.length > 1) {
        var best = st1[st1.length - 1], worst = st1[0];
        out.push({ tone: best.tone, kicker: 'Lidera la satisfacció', big: best.label, text: best.name, sub: 'Pitjor: ' + worst.name + ' (' + worst.label + ') · bretxa ' + fmtD('P101', (best.v - worst.v) * 10).replace('+', ''),
          viz: { t: 'rank', min: 40, items: [best, worst].map(function (x) { return { name: x.name, v: x.v * 100, tone: x.tone, label: x.label }; }) } });
      }
      if (UI.prev) {
        var ch = keys.map(function (k) { var a = val(s, UI.year, k, 'P101'), b = val(s, UI.prev, k, 'P101'); return a != null && b != null ? { k: k, d: a - b } : null; }).filter(Boolean);
        if (ch.length) {
          var mxc = ch.slice().sort(function (a, b) { return Math.abs(b.d) - Math.abs(a.d); })[0];
          var up = ch.filter(function (x) { return dcls('P101', x.d) === 'up'; }).length, dn = ch.filter(function (x) { return dcls('P101', x.d) === 'down'; }).length;
          out.push({ tone: mxc.d >= 0 ? 'g' : 'r', kicker: 'Canvi més gran en P101', big: txtD('P101', mxc.d), text: cname(mxc.k) + (mxc.d >= 0 ? ' millora' : ' empitjora') + ' respecte a ' + UI.prev, sub: 'Canvis rellevants (±' + String(S.config.thr.diff101).replace('.', ',') + '): ' + up + ' milloren, ' + dn + ' empitjoren', viz: { t: 'diverge', up: up, down: dn } });
        }
      }
      return out;
    },
    semafor: function (s) {
      var m = meta(s), keys = scopeKeys(s), out = [], dist = { r: 0, a: 0, g: 0 };
      var byQ = {}, byK = {};
      keys.forEach(function (k) { m.qs.forEach(function (q) { var v = val(s, UI.year, k, q); if (v == null) return; var t = sem(q, v); dist[t]++; if (t === 'r') { byQ[q] = (byQ[q] || 0) + 1; byK[k] = (byK[k] || 0) + 1; } }); });
      var tot = dist.r + dist.a + dist.g;
      if (!tot) return out;
      out.push({ tone: dist.r / tot > 0.25 ? 'r' : dist.r ? 'a' : 'g', kicker: 'Mapa del semàfor', big: Math.round(dist.r / tot * 100) + '%', text: 'dels resultats centre·pregunta en àrea de millora', sub: Math.round(dist.g / tot * 100) + '% en excel·lència · ' + tot + ' resultats', viz: { t: 'dist', parts: [{ n: dist.r, tone: 'r', label: 'Vermell' }, { n: dist.a, tone: 'a', label: 'Taronja' }, { n: dist.g, tone: 'g', label: 'Verd' }] } });
      var qw = Object.keys(byQ).sort(function (a, b) { return byQ[b] - byQ[a] || qSort(a, b); })[0];
      if (qw) out.push({ tone: 'r', kicker: 'Pregunta crítica · ' + qw, big: byQ[qw] + ' de ' + keys.length, text: 'centres en vermell a «' + shortQ(s, qw) + '»', sub: 'Valor de l\'àmbit ' + fmt(qw, aggS(s, UI.year, qw)) + ' · Catalunya ' + fmt(qw, val(s, UI.year, 'CAT', qw)), viz: { t: 'strip', items: stripOf(s, keys, qw) } });
      if (!UI.sector && m.sectors.length > 1) {
        var secs = m.sectors.map(function (sc) {
          var ks = m.active.filter(function (k) { return S.centres[k].sector === sc; }), r = 0, n = 0;
          ks.forEach(function (k) { m.qs.forEach(function (q) { var v = val(s, UI.year, k, q); if (v == null) return; n++; if (sem(q, v) === 'r') r++; }); });
          return { name: sc, v: n ? r / n * 100 : 0, tone: 'r', label: Math.round(n ? r / n * 100 : 0) + '%' };
        }).sort(function (a, b) { return b.v - a.v; });
        out.push({ tone: 'r', kicker: 'Sector amb més vermells', big: secs[0].label, text: secs[0].name + ' concentra la proporció més alta de resultats en vermell', sub: 'Menor proporció: ' + secs[secs.length - 1].name + ' (' + secs[secs.length - 1].label + ')', viz: { t: 'rank', min: 0, items: secs.map(function (x) { return { name: x.name, v: Math.min(100, x.v * 2), tone: 'r', label: x.label }; }) } });
      }
      var kw = Object.keys(byK).sort(function (a, b) { return byK[b] - byK[a]; })[0];
      if (kw) {
        var wq = m.qs.map(function (q) { return { q: q, v: val(s, UI.year, kw, q) }; }).filter(function (x) { return x.v != null; }).sort(function (a, b) { return norm(a.q, a.v) - norm(b.q, b.v); })[0];
        out.push({ tone: 'r', kicker: 'Centre amb més vermells', big: byK[kw] + ' de ' + m.qs.length, text: cname(kw) + ': preguntes en àrea de millora', sub: 'Pitjor: ' + wq.q + ' ' + shortQ(s, wq.q) + ' (' + fmt(wq.q, wq.v) + ')',
          viz: { t: 'strip', items: m.qs.map(function (q) { var v = val(s, UI.year, kw, q); return { name: q + ' ' + shortQ(s, q), tone: sem(q, v), label: fmt(q, v), v: norm(q, v) }; }).filter(function (x) { return x.v != null; }).sort(function (a, b) { return a.v - b.v; }), left: 'preguntes pitjors', right: 'millors' } });
      }
      return out;
    },
    comp: function (s) {
      var cs = UI.comp.centres || [], qs = UI.comp.qs || [], out = [];
      if (!cs.length || !qs.length) return [{ tone: 'n', kicker: 'Comparativa', big: '—', text: 'Tria almenys un centre i una pregunta per veure els titulars de la comparativa', sub: '' }];
      var means = cs.map(function (k) { var v = mean(qs.map(function (q) { return as100(q, val(s, UI.year, k, q)); })); return { k: k, v: v }; }).filter(function (x) { return x.v != null; }).sort(function (a, b) { return b.v - a.v; });
      var tn = function (v) { return v < S.config.thr.red * 100 ? 'r' : v < S.config.thr.green * 100 ? 'a' : 'g'; };
      if (means.length) out.push({ tone: tn(means[0].v), kicker: 'Lidera la selecció', big: means[0].v.toFixed(1).replace('.', ',') + '%', text: cname(means[0].k) + ' té el millor resultat mitjà a les ' + qs.length + ' preguntes triades', sub: means.length > 1 ? 'Últim: ' + cname(means[means.length - 1].k) + ' (' + means[means.length - 1].v.toFixed(1).replace('.', ',') + '%)' : '',
        viz: { t: 'rank', min: 40, items: means.slice(0, 6).map(function (x) { return { name: cname(x.k), v: x.v, tone: tn(x.v), label: x.v.toFixed(1).replace('.', ',') + '%' }; }) } });
      if (cs.length > 1) {
        var gaps = qs.map(function (q) {
          var vs = cs.map(function (k) { return { k: k, v: val(s, UI.year, k, q) }; }).filter(function (x) { return x.v != null; }).sort(function (a, b) { return b.v - a.v; });
          return vs.length > 1 ? { q: q, hi: vs[0], lo: vs[vs.length - 1], g: norm(q, vs[0].v) - norm(q, vs[vs.length - 1].v) } : null;
        }).filter(Boolean).sort(function (a, b) { return b.g - a.g; });
        if (gaps.length) { var g = gaps[0]; out.push({ tone: g.g > 0.15 ? 'r' : g.g > 0.05 ? 'a' : 'g', kicker: 'Bretxa més gran · ' + g.q, big: fmtD(g.q, g.hi.v - g.lo.v).replace('+', ''), text: shortQ(s, g.q), sub: cname(g.hi.k) + ' ' + fmt(g.q, g.hi.v) + ' vs ' + cname(g.lo.k) + ' ' + fmt(g.q, g.lo.v),
          viz: { t: 'rank', min: 40, items: [g.hi, g.lo].map(function (x) { return { name: cname(x.k), v: as100(g.q, x.v), tone: sem(g.q, x.v), label: fmt(g.q, x.v) }; }) } }); }
      }
      var below = 0, above = 0;
      cs.forEach(function (k) { qs.forEach(function (q) { var v = val(s, UI.year, k, q), c = val(s, UI.year, 'CAT', q); if (v == null || c == null) return; if (round3(v) < round3(c)) below++; else above++; }); });
      if (below + above) out.push({ tone: below > above ? 'r' : below ? 'a' : 'g', kicker: 'Respecte a Catalunya', big: below + ' de ' + (below + above), text: 'resultats de la selecció per sota del valor de Catalunya', sub: above + ' iguals o per sobre', viz: { t: 'dist', parts: [{ n: below, tone: 'r', label: 'Per sota' }, { n: above, tone: 'g', label: 'Igual o per sobre' }] } });
      return out;
    },
    cpr: function (s) {
      var m = meta(s), keys = scopeKeys(s), out = [], cpr = cfg(s).cpr.filter(function (q) { return m.qs.indexOf(q) >= 0; });
      if (cpr.length && UI.prev) {
        var items = [], full = 0, koQ = {};
        keys.forEach(function (k) {
          var ok = 0, tot = 0;
          cpr.forEach(function (q) { var r = cprStatus(s, k, q); if (r.st === 'nd') return; tot++; if (r.st === 'ok') ok++; else koQ[q] = (koQ[q] || 0) + 1; });
          if (!tot) return;
          var pct = ok / tot * 100; if (pct === 100) full++;
          items.push({ name: cname(k), tone: pct === 100 ? 'g' : pct >= 50 ? 'a' : 'r', label: Math.round(pct) + '%', v: pct });
        });
        items.sort(function (a, b) { return a.v - b.v; });
        out.push({ tone: full === items.length ? 'g' : full >= items.length / 2 ? 'a' : 'r', kicker: 'Objectiu CPR ' + UI.year, big: full + ' de ' + items.length, text: 'centres assoleixen totes les preguntes CPR', sub: 'Assoliment mitjà ' + Math.round(mean(items.map(function (x) { return x.v; })) || 0) + '%', viz: { t: 'strip', items: items, left: 'menys assoliment', right: 'més assoliment' } });
        var qk = Object.keys(koQ).sort(function (a, b) { return koQ[b] - koQ[a]; })[0];
        if (qk) out.push({ tone: 'r', kicker: 'CPR més incomplerta · ' + qk, big: koQ[qk] + ' centres', text: 'empitjoren a «' + shortQ(s, qk) + '»', sub: 'Valor de l\'àmbit ' + fmt(qk, aggS(s, UI.year, qk)) + ' (' + txtD(qk, aggS(s, UI.year, qk) - aggS(s, UI.prev, qk)) + ')', viz: { t: 'strip', items: stripOf(s, keys, qk) } });
      } else {
        out.push({ tone: 'n', kicker: 'Objectiu CPR', big: '—', text: cpr.length ? 'Cal un any de comparació per avaluar la CPR' : 'Aquest estudi no té preguntes CPR definides', sub: cpr.length ? '' : 'Es poden marcar a Configuració › Preguntes' });
      }
      var acts = S.actions.filter(function (a) { return a.study === s && keys.indexOf(a.centre) >= 0; });
      var cnt = { Pendent: 0, 'En curs': 0, Feta: 0 }; acts.forEach(function (a) { cnt[a.estat] = (cnt[a.estat] || 0) + 1; });
      var redNoAct = keys.filter(function (k) { return m.qs.some(function (q) { return sem(q, val(s, UI.year, k, q)) === 'r'; }) && !acts.some(function (a) { return a.centre === k; }); }).length;
      out.push({ tone: redNoAct ? 'r' : acts.length ? 'g' : 'a', kicker: 'Accions de millora', big: String(acts.length), text: acts.length ? 'accions registrades · ' + cnt.Feta + ' fetes' : 'Encara no hi ha accions registrades', sub: redNoAct + ' centres amb indicadors en vermell sense cap acció', viz: acts.length ? { t: 'dist', parts: [{ n: cnt.Pendent, tone: 'r', label: 'Pendents' }, { n: cnt['En curs'], tone: 'a', label: 'En curs' }, { n: cnt.Feta, tone: 'g', label: 'Fetes' }] } : null });
      return out;
    }
  };

  /* ---------- Visió global (tots els estudis) ---------- */
  function overviewRows() {
    return STUDIES.map(function (st) {
      var m = meta(st.id);
      if (!m.years.length) return { st: st, empty: true };
      var y = m.years[0], pv = m.years[1] || null;
      var g = function (yy, q) { return yy ? agg(st.id, yy, 'RSBMN', q).v : null; };
      var dist = { r: 0, a: 0, g: 0 };
      m.active.forEach(function (k) { m.qs.forEach(function (q) { var v = val(st.id, y, k, q); if (v != null) dist[sem(q, v)]++; }); });
      var qv = m.qs.map(function (q) { var v = g(y, q); return { q: q, v: v, n: norm(q, v) }; }).filter(function (x) { return x.v != null; }).sort(function (a, b) { return a.n - b.n; });
      var tot = dist.r + dist.a + dist.g;
      return { st: st, y: y, pv: pv, n: m.active.length, dist: dist, red: tot ? dist.r / tot : 0, worst: qv[0], best: qv[qv.length - 1],
        p101: g(y, 'P101'), p101p: g(pv, 'P101'), cat101: val(st.id, y, 'CAT', 'P101'), p102: g(y, 'P102'), p102p: g(pv, 'P102'), cat102: val(st.id, y, 'CAT', 'P102') };
    });
  }
  function renderOverview() {
    var p = $('#panel'), rows = overviewRows(), full = rows.filter(function (r) { return !r.empty; });
    var with101 = full.filter(function (r) { return r.p101 != null; }).sort(function (a, b) { return b.p101 - a.p101; });
    var hls = [];
    hls.push({ tone: full.length === STUDIES.length ? 'g' : 'a', kicker: 'Cobertura', big: full.length + ' de ' + STUDIES.length, text: 'estudis PLAENSA carregats al quadre', sub: full.map(function (r) { return r.st.id + ' ' + r.y; }).join(' · '),
      viz: { t: 'strip', items: rows.map(function (r) { return { name: r.st.name, tone: r.empty ? 'n' : sem('P101', r.p101), label: r.empty ? 'sense dades' : fmt('P101', r.p101) }; }), left: STUDIES[0].id, right: STUDIES[STUDIES.length - 1].id } });
    if (with101.length) {
      hls.push({ tone: sem('P101', with101[0].p101), kicker: 'Millor satisfacció global', big: fmt('P101', with101[0].p101), text: with101[0].st.name, sub: with101.length > 1 ? 'Més baixa: ' + with101[with101.length - 1].st.name + ' (' + fmt('P101', with101[with101.length - 1].p101) + ')' : '',
        viz: { t: 'rank', min: 60, items: with101.map(function (r) { return { name: r.st.id, v: r.p101 * 10, tone: sem('P101', r.p101), label: fmt('P101', r.p101) }; }) } });
      var below = with101.filter(function (r) { return r.cat101 != null && round3(r.p101) < round3(r.cat101); });
      hls.push({ tone: below.length > with101.length / 2 ? 'r' : below.length ? 'a' : 'g', kicker: 'RSBMN davant de Catalunya', big: below.length + ' de ' + with101.length, text: 'estudis amb la satisfacció global de la regió per sota de Catalunya', sub: below.length ? 'Per sota: ' + below.map(function (r) { return r.st.id + ' (' + fmtD('P101', r.p101 - r.cat101) + ')'; }).join(' · ') : 'Tots iguals o per sobre',
        viz: { t: 'dist', parts: [{ n: below.length, tone: 'r', label: 'Per sota' }, { n: with101.length - below.length, tone: 'g', label: 'Igual o per sobre' }] } });
    }
    if (full.length) {
      var wr = full.slice().sort(function (a, b) { return b.red - a.red; })[0];
      hls.push({ tone: wr.red > 0.25 ? 'r' : 'a', kicker: 'Més àrea de millora', big: Math.round(wr.red * 100) + '%', text: wr.st.name + ': resultats centre·pregunta en vermell', sub: wr.worst ? 'Pitjor pregunta: ' + wr.worst.q + ' ' + shortQ(wr.st.id, wr.worst.q) + ' (' + fmt(wr.worst.q, wr.worst.v) + ')' : '',
        viz: { t: 'dist', parts: [{ n: wr.dist.r, tone: 'r', label: 'Vermell' }, { n: wr.dist.a, tone: 'a', label: 'Taronja' }, { n: wr.dist.g, tone: 'g', label: 'Verd' }] } });
    }
    var html = '<div class="study-head"><div><h2>Visió global PLAENSA</h2><div class="sub">Regió Sanitària Metropolitana Nord · últim any disponible de cada estudi · valors RSBMN (oficials quan el fitxer els inclou, si no mitjana de centres)</div></div>' +
      '<div class="filters"><button class="btn primary" type="button" id="ov-load">Carregar Excel</button></div></div>' +
      '<div style="margin-top:16px">' + hl(hls, 'Tots els estudis · ' + full.length + ' carregats') + '</div>' +
      '<h3 class="sec-h">Estudis</h3><div class="ov-grid">' + rows.map(function (r) {
        if (r.empty) return '<button type="button" class="ov-tile empty" data-open="' + r.st.id + '"><span class="ov-code">' + r.st.id + '</span><span class="ov-name">' + esc(r.st.name) + '</span><span class="ov-empty">Sense dades · fes clic per obrir-lo i carregar l\'Excel</span></button>';
        var c = sem('P101', r.p101);
        return '<button type="button" class="ov-tile t-' + c + '" data-open="' + r.st.id + '">' +
          '<span class="ov-top"><span class="ov-code">' + r.st.id + ' · ' + r.y + (r.pv ? ' vs ' + r.pv : '') + '</span><span class="pill ' + c + '"><span class="dot ' + c + '"></span>' + SEM_TXT[c] + '</span></span>' +
          '<span class="ov-name">' + esc(r.st.name) + '</span>' +
          '<span class="ov-kpis"><span><span class="ov-lbl">Satisfacció P101</span><span class="ov-big">' + fmt('P101', r.p101) + '</span><span class="ov-d">' + (r.p101p != null ? dspan('P101', r.p101 - r.p101p) + ' vs ' + r.pv : '&nbsp;') + '</span></span>' +
          '<span><span class="ov-lbl">Fidelitat P102</span><span class="ov-big sm">' + fmt('P102', r.p102) + '</span><span class="ov-d">' + (r.p102p != null ? dspan('P102', r.p102 - r.p102p) + ' vs ' + r.pv : '&nbsp;') + '</span></span></span>' +
          hlViz({ t: 'bullet', v: as100('P101', r.p101), cat: as100('P101', r.cat101), tone: c, lo: '4', hi: '10', label: fmt('P101', r.p101) }) +
          '<span class="ov-lbl" style="margin-top:6px">Semàfor de ' + r.n + ' centres</span>' +
          hlViz({ t: 'dist', parts: [{ n: r.dist.r, tone: 'r', label: 'Vermell' }, { n: r.dist.a, tone: 'a', label: 'Taronja' }, { n: r.dist.g, tone: 'g', label: 'Verd' }] }) +
          (r.worst ? '<span class="ov-worst"><span class="dot ' + sem(r.worst.q, r.worst.v) + '"></span>Punt més feble: <strong>' + r.worst.q + '</strong> ' + esc(shortQ(r.st.id, r.worst.q)) + ' · ' + fmt(r.worst.q, r.worst.v) + '</span>' : '') +
          '<span class="ov-open">Obrir l\'estudi →</span></button>';
      }).join('') + '</div>' +
      (with101.length ? '<div class="grid g2" style="margin-top:18px"><div class="card block"><h3>Satisfacció global P101 · RSBMN vs Catalunya</h3><div class="chart-box"><canvas id="ov-101"></canvas></div></div><div class="card block"><h3>Fidelitat P102 · RSBMN vs Catalunya</h3><div class="chart-box"><canvas id="ov-102"></canvas></div></div></div>' : '') +
      '<div class="note" style="margin-top:12px">Cada estudi té el seu propi qüestionari i calendari: compareu nivells i tendències, no diferències petites entre estudis. P101 es mostra en escala 0–100 (× 10) als gràfics.</div>';
    p.innerHTML = html;
    $('#ov-load').onclick = openLoad;
    $all('[data-open]').forEach(function (b) { b.onclick = function () { openStudy(b.dataset.open); }; });
    ['P101', 'P102'].forEach(function (q) {
      var rs = full.filter(function (r) { return r[q === 'P101' ? 'p101' : 'p102'] != null; });
      var k = q === 'P101' ? 'p101' : 'p102', kc = q === 'P101' ? 'cat101' : 'cat102';
      chart(q === 'P101' ? 'ov-101' : 'ov-102', {
        type: 'bar',
        data: { labels: rs.map(function (r) { return r.st.id; }), datasets: [
          { label: 'RSBMN', data: rs.map(function (r) { return as100(q, r[k]); }), backgroundColor: rs.map(function (r) { return semColor(sem(q, r[k])); }), borderRadius: 4 },
          { label: 'Catalunya', data: rs.map(function (r) { return as100(q, r[kc]); }), backgroundColor: css('--line'), borderRadius: 4 }] },
        options: { scales: { y: pctAxis(50), x: { grid: { display: false } } }, plugins: { tooltip: { callbacks: { title: function (it) { return rs[it[0].dataIndex].st.name; }, label: function (c2) { return c2.dataset.label + ': ' + (q === 'P101' ? (c2.parsed.y / 10).toFixed(2).replace('.', ',') : c2.parsed.y + '%'); } } } } }
      });
    });
  }
  function openStudy(id) { UI.study = id; UI.year = null; UI.prev = null; UI.sector = ''; UI.comp.centres = null; UI.comp.qs = null; UI.accCentre = ''; lsSet('plaensa-study', UI.study); render(); window.scrollTo(0, 0); }

  /* ---------- 1. Resum KPI i Top 5 ---------- */
  function renderResum(el, s) {
    var m = meta(s), keys = scopeKeys(s), sc = scopeName();
    var html = hl(HL.resum(s), hlScope());

    // Top 5 preguntes (agregat de l'àmbit)
    var qv = m.qs.map(function (q) { var a = agg(s, UI.year, sc, q, UI.sector ? keys : null); return { q: q, v: a.v, n: norm(q, a.v) }; }).filter(function (x) { return x.v != null; });
    var best = qv.slice().sort(function (a, b) { return b.n - a.n; }).slice(0, 5);
    var worst = qv.slice().sort(function (a, b) { return a.n - b.n; }).slice(0, 5);
    var cells = [];
    keys.forEach(function (k) { m.qs.forEach(function (q) { var v = val(s, UI.year, k, q); if (v != null) cells.push({ k: k, q: q, v: v, n: norm(q, v) }); }); });
    var cb = cells.slice().sort(function (a, b) { return b.n - a.n; }).slice(0, 5);
    var cw = cells.slice().sort(function (a, b) { return a.n - b.n; }).slice(0, 5);
    function rankQ(list) {
      return '<ol class="rank">' + list.map(function (x, i) {
        var p = UI.prev ? agg(s, UI.prev, sc, x.q, UI.sector ? keys : null).v : null;
        return '<li><span class="pos">' + (i + 1) + '</span><span class="lbl">' + esc(qlabel(s, x.q)) + qtags(s, x.q) + (UI.prev ? '<small>' + dspan(x.q, p != null ? x.v - p : null) + ' vs ' + UI.prev + '</small>' : '') + '</span><span class="pill ' + sem(x.q, x.v) + '"><span class="dot ' + sem(x.q, x.v) + '"></span>' + fmt(x.q, x.v) + '</span></li>';
      }).join('') + '</ol>';
    }
    function rankC(list) {
      return '<ol class="rank">' + list.map(function (x, i) {
        return '<li><span class="pos">' + (i + 1) + '</span><span class="lbl">' + esc(cname(x.k)) + '<small>' + esc(qlabel(s, x.q)) + '</small></span><span class="pill ' + sem(x.q, x.v) + '"><span class="dot ' + sem(x.q, x.v) + '"></span>' + fmt(x.q, x.v) + '</span></li>';
      }).join('') + '</ol>';
    }
    html += '<div class="grid g2x" style="margin-top:16px">' +
      '<div class="block"><h3>Top 5 millors preguntes · ' + esc(sc) + '</h3>' + rankQ(best) + '</div>' +
      '<div class="block"><h3>Top 5 pitjors preguntes · ' + esc(sc) + '</h3>' + rankQ(worst) + '</div>' +
      '<div class="block"><h3>Top 5 millors resultats centre·pregunta</h3>' + rankC(cb) + '</div>' +
      '<div class="block"><h3>Top 5 pitjors resultats centre·pregunta</h3>' + rankC(cw) + '</div></div>';

    // Millor i pitjor per sector
    html += '<div class="block" style="margin-top:16px"><h3>Millor i pitjor resultat per sector (' + UI.year + ')</h3><div class="tscroll"><table class="t"><thead><tr><th>Sector</th><th>Classificació</th><th>Centre</th><th>Pregunta</th><th class="v">Resultat</th></tr></thead><tbody>';
    var secs = UI.sector ? [UI.sector] : m.sectors;
    secs.forEach(function (sc2) {
      var ks = m.active.filter(function (k) { return S.centres[k].sector === sc2; });
      var ex = extremes(s, UI.year, ks, m.qs);
      [['Millor', ex.best, 'g'], ['Pitjor', ex.worst, 'r']].forEach(function (t) {
        t[1].forEach(function (c) {
          var v = val(s, UI.year, c.k, c.q);
          html += '<tr><td>' + esc(sc2) + '</td><td><span class="pill ' + t[2] + '">' + t[0] + '</span></td><td>' + esc(cname(c.k)) + '</td><td>' + esc(qlabel(s, c.q)) + '</td><td class="v">' + fmt(c.q, v) + '</td></tr>';
        });
      });
    });
    html += '</tbody></table></div></div>';

    html += '<div class="block card" style="margin-top:16px"><h3>Resultat per pregunta · ' + esc(sc) + ' vs Catalunya (' + UI.year + ')</h3><div class="chart-box tall"><canvas id="c-qs"></canvas></div><div class="note">P101 es mostra en escala 0–100 (valor × 10) per poder-la comparar amb els percentatges.</div></div>';
    html += '<div style="margin-top:12px">' + sigNote(s) + '</div>';
    el.innerHTML = html;

    var labels = qv.map(function (x) { return x.q; });
    chart('c-qs', {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: sc, data: qv.map(function (x) { return as100(x.q, x.v); }), backgroundColor: qv.map(function (x) { return semColor(sem(x.q, x.v)); }), borderRadius: 3 },
          { type: 'line', label: 'Catalunya', data: qv.map(function (x) { return as100(x.q, val(s, UI.year, 'CAT', x.q)); }), borderColor: css('--ink'), backgroundColor: css('--ink'), showLine: false, pointStyle: 'line', pointRadius: 10, pointBorderWidth: 3 }
        ]
      },
      options: {
        indexAxis: 'y',
        scales: { x: pctAxis(0), y: { ticks: { autoSkip: false }, grid: { display: false } } },
        plugins: { tooltip: { callbacks: { title: function (it) { return qlabel(s, it[0].label); }, label: function (c) { return c.dataset.label + ': ' + c.parsed.x + '%'; } } } }
      }
    });
  }

  /* ---------- 2. Satisfacció i Fidelitat ---------- */
  function renderSF(el, s) {
    var m = meta(s), keys = scopeKeys(s);
    var rows = [];
    rows.push({ t: 'ref', name: 'Catalunya', get: function (y, q) { return val(s, y, 'CAT', q); } });
    rows.push({ t: 'agg', name: 'RSBMN (' + (val(s, UI.year, 'RSBMN', 'P101') != null ? 'oficial' : 'mitjana de centres') + ')', get: function (y, q) { return agg(s, y, 'RSBMN', q).v; } });
    var secs = UI.sector ? [UI.sector] : m.sectors;
    secs.forEach(function (sc) {
      rows.push({ t: 'grp', name: sc });
      rows.push({ t: 'agg', name: 'Mitjana ' + sc, get: function (y, q) { return agg(s, y, sc, q).v; } });
      m.active.filter(function (k) { return S.centres[k].sector === sc; }).forEach(function (k) {
        rows.push({ t: 'c', k: k, name: cname(k), get: function (y, q) { return val(s, y, k, q); } });
      });
    });
    var others = m.centres.filter(function (k) { return m.active.indexOf(k) < 0; });
    if (!UI.sector && others.length) {
      rows.push({ t: 'grp', name: 'Fora de sector o exclosos' });
      others.forEach(function (k) { rows.push({ t: 'c', k: k, name: cname(k), get: function (y, q) { return val(s, y, k, q); } }); });
    }
    function cells(r, q) {
      var a = r.get(UI.year, q), b = UI.prev ? r.get(UI.prev, q) : null, c = sem(q, a), sg = r.k ? sig(s, r.k, q) : null;
      return '<td class="v"><span class="pill ' + c + '"><span class="dot ' + c + '"></span>' + fmt(q, a) + '</span></td>' +
        (UI.prev ? '<td class="v">' + fmt(q, b) + '</td><td class="v">' + dspan(q, a != null && b != null ? a - b : null) + (sg === 'sig' ? '*' : '') + '</td>' : '');
    }
    var html = hl(HL.sf(s), hlScope()) + '<div class="grid g2"><div class="card block"><h3>Satisfacció global P101 per centre</h3><div class="chart-box"><canvas id="c-101"></canvas></div></div>' +
      '<div class="card block"><h3>Fidelitat P102 per centre</h3><div class="chart-box"><canvas id="c-102"></canvas></div></div></div>';
    html += '<div class="block" style="margin-top:16px"><h3>Taula de satisfacció i fidelitat</h3><div class="tscroll"><table class="t"><thead><tr><th>Àmbit / centre</th>' +
      '<th class="v">P101 ' + UI.year + '</th>' + (UI.prev ? '<th class="v">P101 ' + UI.prev + '</th><th class="v">Dif.</th>' : '') +
      '<th class="v">P102 ' + UI.year + '</th>' + (UI.prev ? '<th class="v">P102 ' + UI.prev + '</th><th class="v">Dif.</th>' : '') + '</tr></thead><tbody>';
    rows.forEach(function (r) {
      if (r.t === 'grp') { html += '<tr class="grp"><td colspan="' + (UI.prev ? 7 : 3) + '">' + esc(r.name) + '</td></tr>'; return; }
      html += '<tr class="' + (r.t !== 'c' ? 'agg' : '') + '"><td>' + esc(r.name) + '</td>' + cells(r, 'P101') + cells(r, 'P102') + '</tr>';
    });
    html += '</tbody></table></div></div><div style="margin-top:12px">' + sigNote(s) + '</div>' +
      '<div class="legend" style="margin-top:8px"><span><span class="dot r"></span> P101 &lt; ' + String(S.config.thr.red101).replace('.', ',') + ' · P102 &lt; ' + S.config.thr.red * 100 + '%</span><span><span class="dot a"></span> àrea estàndard</span><span><span class="dot g"></span> P101 ≥ ' + S.config.thr.green101 + ' · P102 ≥ ' + S.config.thr.green * 100 + '%</span></div>';
    el.innerHTML = html;

    var cs = rows.filter(function (r) { return r.t === 'c'; });
    ['P101', 'P102'].forEach(function (q) {
      var ds = [{ label: String(UI.year), data: cs.map(function (r) { return as100(q, r.get(UI.year, q)); }), backgroundColor: cs.map(function (r) { return semColor(sem(q, r.get(UI.year, q))); }), borderRadius: 3 }];
      if (UI.prev) ds.push({ label: String(UI.prev), data: cs.map(function (r) { return as100(q, r.get(UI.prev, q)); }), backgroundColor: css('--line'), borderRadius: 3 });
      var cat = as100(q, val(s, UI.year, 'CAT', q));
      ds.push({ type: 'line', label: 'Catalunya ' + UI.year, data: cs.map(function () { return cat; }), borderColor: css('--ink'), borderDash: [5, 4], pointRadius: 0, borderWidth: 1.5 });
      chart(q === 'P101' ? 'c-101' : 'c-102', {
        type: 'bar', data: { labels: cs.map(function (r) { return r.name; }), datasets: ds },
        options: {
          scales: { y: pctAxis(q === 'P101' ? 50 : 50), x: { grid: { display: false }, ticks: { autoSkip: cs.length > 20, maxRotation: 60 } } },
          plugins: { tooltip: { callbacks: { label: function (c) { return c.dataset.label + ': ' + (q === 'P101' ? (c.parsed.y / 10).toFixed(2).replace('.', ',') : c.parsed.y + '%'); } } } }
        }
      });
    });
  }

  /* ---------- 3. Semàfor per centre ---------- */
  function renderSemafor(el, s) {
    var m = meta(s), y = UI.year;
    var secs = UI.sector ? [UI.sector] : m.sectors;
    var qsAll = m.qs;
    var qs = qsAll.filter(function (q) {
      if (UI.mxFilter === 'trans') return isTrans(s, q);
      if (UI.mxFilter === 'spec') return !isTrans(s, q);
      if (UI.mxFilter === 'cpr') return isCpr(s, q);
      return true;
    });
    // marcs: sobre totes les preguntes de l'estudi (com al document de treball)
    var fr = {};
    function mark(list, kind, lvl) { list.forEach(function (c) { var id = c.k + '|' + c.q; fr[id] = fr[id] || []; fr[id].push('fr-' + kind + '-' + lvl); }); }
    if (S.config.frames.c) m.active.forEach(function (k) { var e = extremes(s, y, [k], qsAll); mark(e.best, 'b', 'c'); mark(e.worst, 'w', 'c'); });
    if (S.config.frames.s) m.sectors.forEach(function (sc) { var e = extremes(s, y, m.active.filter(function (k) { return S.centres[k].sector === sc; }), qsAll); mark(e.best, 'b', 's'); mark(e.worst, 'w', 's'); });
    if (S.config.frames.r) { var e = extremes(s, y, m.active, qsAll); mark(e.best, 'b', 'r'); mark(e.worst, 'w', 'r'); }
    function frameCls(k, q) {
      var f = fr[k + '|' + q]; if (!f) return '';
      // prioritat: regió > sector > centre; pitjor abans que millor
      var order = ['fr-w-r', 'fr-b-r', 'fr-w-s', 'fr-b-s', 'fr-w-c', 'fr-b-c'];
      for (var i = 0; i < order.length; i++) if (f.indexOf(order[i]) >= 0) return ' ' + order[i];
      return '';
    }
    var cols = [{ t: 'ref', key: 'CAT', name: 'Catalunya', sec: 'Referència' }, { t: 'agg', key: 'RSBMN', name: val(s, y, 'RSBMN', qsAll[0]) != null ? 'RSBMN oficial' : 'RSBMN (mitjana)', sec: 'Referència' }];
    secs.forEach(function (sc) {
      cols.push({ t: 'agg', key: sc, name: 'Mitjana sector', sec: sc });
      m.active.filter(function (k) { return S.centres[k].sector === sc; }).forEach(function (k) { cols.push({ t: 'c', key: k, name: cname(k), sec: sc }); });
    });
    function getv(c, yy, q) { return c.t === 'c' ? val(s, yy, c.key, q) : agg(s, yy, c.key, q).v; }

    var html = hl(HL.semafor(s), hlScope()) + '<div class="toolbar"><span class="seg" role="group" aria-label="Filtre de preguntes">' +
      [['all', 'Totes'], ['trans', 'Transversals'], ['spec', 'Específiques'], ['cpr', 'CPR']].map(function (x) { return '<button type="button" data-mf="' + x[0] + '" class="' + (UI.mxFilter === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</span>' +
      '<label class="chk"><input type="checkbox" id="mx-diff"' + (UI.mxDiff ? ' checked' : '') + '> Mostrar diferència' + (UI.prev ? ' vs ' + UI.prev : '') + '</label>' +
      '<span class="kpi-meta">Marcs:</span>' +
      [['c', 'per centre'], ['s', 'per sector'], ['r', 'per regió']].map(function (x) { return '<label class="chk"><input type="checkbox" data-fr="' + x[0] + '"' + (S.config.frames[x[0]] ? ' checked' : '') + '> ' + x[1] + '</label>'; }).join('') +
      '<button type="button" class="btn sm" id="mx-xlsx">Exportar a Excel</button></div>';
    if ((UI.mxFilter === 'trans' && !cfg(s).trans.length) || (UI.mxFilter === 'cpr' && !cfg(s).cpr.length)) {
      html += '<div class="note warn">Aquest estudi no té preguntes ' + (UI.mxFilter === 'cpr' ? 'CPR' : 'transversals') + ' marcades. Marca-les a Configuració › Preguntes.</div>';
    }
    html += '<div class="tscroll" style="max-height:72vh"><table class="mx"><thead><tr class="sect"><th class="q"></th>';
    var spans = [];
    cols.forEach(function (c) { if (spans.length && spans[spans.length - 1].sec === c.sec) spans[spans.length - 1].n++; else spans.push({ sec: c.sec, n: 1 }); });
    html += spans.map(function (x) { return '<th colspan="' + x.n + '">' + esc(x.sec) + '</th>'; }).join('') + '</tr><tr><th class="q">Pregunta</th>' +
      cols.map(function (c) { return '<th title="' + esc(c.t === 'c' ? cfull(c.key) : c.name) + '">' + esc(c.name) + '</th>'; }).join('') + '</tr></thead><tbody>';
    qs.forEach(function (q) {
      html += '<tr><td class="q">' + esc(qlabel(s, q)) + qtags(s, q) + '</td>';
      cols.forEach(function (c) {
        var a = getv(c, y, q), b = UI.prev ? getv(c, UI.prev, q) : null, d = a != null && b != null ? a - b : null;
        var cl = 'c ' + (c.t === 'ref' ? 'ref ' : c.t === 'agg' ? 'agg ' : '') + (UI.mxDiff ? dcls(q, d) : '') + (c.t === 'c' ? frameCls(c.key, q) : '');
        var sg = c.t === 'c' ? sig(s, c.key, q) : null;
        html += '<td class="' + cl + '"><div class="in"><span class="row1"><span class="dot ' + sem(q, a) + '"></span>' + fmt(q, a) + '</span>' +
          (UI.mxDiff && UI.prev ? '<span class="dd">' + dspan(q, d) + (sg === 'sig' ? '*' : '') + '</span>' : '') + '</div></td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>' +
      '<div class="legend" style="margin-top:10px">' +
      '<span><span class="dot g"></span> ≥ 90% (P101 ≥ 9)</span><span><span class="dot a"></span> 75–89,9% (P101 7,5–8,9)</span><span><span class="dot r"></span> &lt; 75% (P101 &lt; 7,5)</span>' +
      '<span><span class="sw" style="background:var(--tint-up)"></span>Millora &gt; ' + S.config.thr.diff * 100 + ' pp</span><span><span class="sw" style="background:var(--tint-down)"></span>Empitjorament &gt; ' + S.config.thr.diff * 100 + ' pp</span>' +
      '<span><span class="sw" style="box-shadow:inset 0 0 0 2px var(--sem-r)"></span>Pitjor del centre</span><span><span class="sw" style="box-shadow:inset 0 0 0 3px var(--sem-r);outline:1px dashed var(--sem-r);outline-offset:-6px"></span>Pitjor del sector</span><span><span class="sw" style="box-shadow:inset 0 0 0 4px var(--sem-r)"></span>▼ Pitjor de la regió</span><span>(el mateix en verd = millor)</span></div>' +
      '<div class="note" style="margin-top:8px">Els marcs es calculen sobre totes les preguntes de l\'estudi i els centres amb sector assignat (P101 normalitzada a 0–1). Si hi ha empat es marquen tots els empatats.</div>' +
      '<div style="margin-top:8px">' + sigNote(s) + '</div>';
    el.innerHTML = html;
    $all('[data-mf]', el).forEach(function (b) { b.onclick = function () { UI.mxFilter = b.dataset.mf; render(); }; });
    $('#mx-diff').onchange = function () { UI.mxDiff = this.checked; render(); };
    $all('[data-fr]', el).forEach(function (b) { b.onchange = function () { S.config.frames[b.dataset.fr] = b.checked; save(); render(); }; });
    $('#mx-xlsx').onclick = function () {
      var aoa = [['Pregunta'].concat(cols.map(function (c) { return c.t === 'c' ? cfull(c.key) : (c.t === 'agg' && c.sec !== 'Referència' ? 'Mitjana ' + c.sec : c.name); }))];
      qs.forEach(function (q) {
        aoa.push([qlabel(s, q)].concat(cols.map(function (c) { var v = getv(c, y, q); return v == null ? null : Math.round(v * 10000) / 10000; })));
        if (UI.prev) aoa.push(['  Dif. ' + y + '−' + UI.prev].concat(cols.map(function (c) { var a = getv(c, y, q), b = getv(c, UI.prev, q); return a != null && b != null ? Math.round((a - b) * 10000) / 10000 : null; })));
      });
      var wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Semafor ' + y);
      XLSX.writeFile(wb, 'PLAENSA_' + s + '_semafor_' + y + '.xlsx');
    };
  }

  /* ---------- 4. Comparativa i evolució ---------- */
  function renderComp(el, s) {
    var m = meta(s);
    if (!UI.comp.centres) UI.comp.centres = m.active.slice(0, Math.min(3, m.active.length));
    UI.comp.centres = UI.comp.centres.filter(function (k) { return m.centres.indexOf(k) >= 0; });
    if (!UI.comp.qs) UI.comp.qs = cfg(s).cpr.length ? cfg(s).cpr.filter(function (q) { return m.qs.indexOf(q) >= 0; }) : m.qs.slice(0, 6);
    UI.comp.qs = UI.comp.qs.filter(function (q) { return m.qs.indexOf(q) >= 0; });
    if (m.qs.indexOf(UI.comp.evoQ) < 0) UI.comp.evoQ = m.qs[m.qs.length - 1];

    var groups = m.sectors.map(function (sc) { return { name: sc, ks: m.active.filter(function (k) { return S.centres[k].sector === sc; }) }; });
    var oth = m.centres.filter(function (k) { return m.active.indexOf(k) < 0; });
    if (oth.length) groups.push({ name: 'Fora de sector o exclosos', ks: oth });

    var html = hl(HL.comp(s), (UI.comp.centres.length) + ' centres · ' + UI.comp.qs.length + ' preguntes · ' + UI.year) + '<div class="grid g2"><div class="block"><h3>Centres a comparar</h3><div class="field" style="margin-bottom:6px"><input id="cmp-find" type="search" placeholder="Cerca un centre…" aria-label="Cerca un centre"></div><div class="picklist" id="cmp-centres">' +
      groups.map(function (g) {
        return '<div class="grp"><span>' + esc(g.name) + '</span><button type="button" class="btn sm ghost" data-allsec="' + esc(g.name) + '">Tot el sector</button></div>' +
          g.ks.map(function (k) { return '<label data-name="' + esc(cfull(k).toLowerCase() + ' ' + cname(k).toLowerCase()) + '"><input type="checkbox" value="' + k + '"' + (UI.comp.centres.indexOf(k) >= 0 ? ' checked' : '') + '> ' + esc(cname(k)) + '</label>'; }).join('');
      }).join('') + '</div>' +
      '<div class="toolbar" style="margin-top:8px"><label class="chk"><input type="checkbox" id="cmp-cat"' + (UI.comp.refs.CAT ? ' checked' : '') + '> Catalunya</label><label class="chk"><input type="checkbox" id="cmp-rs"' + (UI.comp.refs.RSBMN ? ' checked' : '') + '> RSBMN</label><label class="chk"><input type="checkbox" id="cmp-sec"' + (UI.comp.sectors ? ' checked' : '') + '> Mitjana dels sectors dels centres triats</label><button type="button" class="btn sm" id="cmp-none">Treure tots</button></div></div>' +
      '<div class="block"><h3>Preguntes (selecció múltiple)</h3><div class="toolbar"><span class="seg">' +
      [['all', 'Totes'], ['trans', 'Transversals'], ['spec', 'Específiques'], ['cpr', 'CPR'], ['none', 'Cap']].map(function (x) { return '<button type="button" data-qs="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</span></div>' +
      '<div class="picklist" id="cmp-qs">' + m.qs.map(function (q) { return '<label><input type="checkbox" value="' + q + '"' + (UI.comp.qs.indexOf(q) >= 0 ? ' checked' : '') + '> ' + esc(qlabel(s, q)) + qtags(s, q) + '</label>'; }).join('') + '</div></div></div>';

    var ents = compEntities(s);
    html += '<div class="card block" style="margin-top:16px"><h3>Comparativa ' + UI.year + ' per pregunta</h3><div class="chart-box tall"><canvas id="c-cmp"></canvas></div></div>';
    html += '<div class="card block" style="margin-top:16px"><div class="toolbar" style="justify-content:space-between"><h3 style="margin:0">Evolució ' + m.years.slice().reverse().join(' → ') + '</h3><div class="field"><label for="evo-q">Pregunta</label><select id="evo-q">' +
      ['__mean'].concat(m.qs).map(function (q) { return '<option value="' + q + '"' + (UI.comp.evoQ === q ? ' selected' : '') + '>' + (q === '__mean' ? 'Mitjana de les preguntes seleccionades' : esc(qlabel(s, q).slice(0, 80))) + '</option>'; }).join('') + '</select></div></div><div class="chart-box"><canvas id="c-evo"></canvas></div>' +
      (m.years.length < 3 ? '<div class="note">Hi ha ' + m.years.length + ' anys carregats per a aquest estudi. L\'evolució s\'allarga automàticament quan carregueu edicions noves del PLAENSA.</div>' : '') + '</div>';

    // Taula
    html += '<div class="block" style="margin-top:16px"><h3>Taula comparativa</h3><div class="tscroll"><table class="t"><thead><tr><th>Pregunta</th>' +
      ents.map(function (e) { return '<th class="v">' + esc(e.name) + '</th>'; }).join('') + '</tr></thead><tbody>';
    UI.comp.qs.forEach(function (q) {
      html += '<tr><td>' + esc(qlabel(s, q)) + qtags(s, q) + '</td>' + ents.map(function (e) {
        var a = e.get(UI.year, q), b = UI.prev ? e.get(UI.prev, q) : null;
        return '<td class="v"><span class="pill ' + sem(q, a) + '"><span class="dot ' + sem(q, a) + '"></span>' + fmt(q, a) + '</span>' + (UI.prev ? '<br><small>' + dspan(q, a != null && b != null ? a - b : null) + '</small>' : '') + '</td>';
      }).join('') + '</tr>';
    });
    html += '</tbody></table></div></div>';
    el.innerHTML = html;

    function readSel() {
      UI.comp.centres = $all('#cmp-centres input:checked').map(function (i) { return i.value; });
      UI.comp.qs = $all('#cmp-qs input:checked').map(function (i) { return i.value; }).sort(qSort);
      render();
    }
    $all('#cmp-centres input, #cmp-qs input').forEach(function (i) { i.onchange = readSel; });
    $('#cmp-find').oninput = function () {
      var t = this.value.toLowerCase();
      $all('#cmp-centres label').forEach(function (l) { l.hidden = t && l.dataset.name.indexOf(t) < 0; });
    };
    $all('[data-allsec]').forEach(function (b) {
      b.onclick = function () {
        var g = groups.filter(function (x) { return x.name === b.dataset.allsec; })[0];
        UI.comp.centres = uniq(UI.comp.centres.concat(g.ks)); render();
      };
    });
    $('#cmp-none').onclick = function () { UI.comp.centres = []; render(); };
    $('#cmp-cat').onchange = function () { UI.comp.refs.CAT = this.checked; render(); };
    $('#cmp-rs').onchange = function () { UI.comp.refs.RSBMN = this.checked; render(); };
    $('#cmp-sec').onchange = function () { UI.comp.sectors = this.checked; render(); };
    $all('[data-qs]').forEach(function (b) {
      b.onclick = function () {
        var t = b.dataset.qs;
        UI.comp.qs = t === 'all' ? m.qs.slice() : t === 'none' ? [] : m.qs.filter(function (q) { return t === 'trans' ? isTrans(s, q) : t === 'spec' ? !isTrans(s, q) : isCpr(s, q); });
        render();
      };
    });
    $('#evo-q').onchange = function () { UI.comp.evoQ = this.value; render(); };

    chart('c-cmp', {
      type: 'bar',
      data: {
        labels: UI.comp.qs,
        datasets: ents.map(function (e, i) {
          return { label: e.name, data: UI.comp.qs.map(function (q) { return as100(q, e.get(UI.year, q)); }), backgroundColor: e.color || PALETTE[i % PALETTE.length], borderRadius: 2 };
        })
      },
      options: {
        scales: { y: pctAxis(0), x: { grid: { display: false } } },
        plugins: { tooltip: { callbacks: { title: function (it) { return qlabel(s, it[0].label); }, label: function (c) { return c.dataset.label + ': ' + c.parsed.y + '%'; } } } }
      }
    });
    var years = m.years.slice().reverse();
    var eq = UI.comp.evoQ;
    chart('c-evo', {
      type: 'line',
      data: {
        labels: years.map(String),
        datasets: ents.map(function (e, i) {
          return {
            label: e.name, borderColor: e.color || PALETTE[i % PALETTE.length], backgroundColor: e.color || PALETTE[i % PALETTE.length], tension: 0.2, pointRadius: 4, spanGaps: true,
            borderDash: e.dash ? [6, 4] : [],
            data: years.map(function (yy) {
              if (eq === '__mean') return mean(UI.comp.qs.map(function (q) { return as100(q, e.get(yy, q)); }));
              return as100(eq, e.get(yy, eq));
            })
          };
        })
      },
      options: { scales: { y: { ticks: { callback: function (v) { return v + '%'; } } } }, plugins: { tooltip: { callbacks: { label: function (c) { return c.dataset.label + ': ' + (c.parsed.y == null ? '–' : c.parsed.y.toFixed(1) + '%'); } } } } }
    });
  }
  function compEntities(s) {
    var ents = [];
    if (UI.comp.refs.CAT) ents.push({ name: 'Catalunya', color: css('--ink'), dash: true, get: function (y, q) { return val(s, y, 'CAT', q); } });
    if (UI.comp.refs.RSBMN) ents.push({ name: 'RSBMN', color: css('--accent'), dash: true, get: function (y, q) { return agg(s, y, 'RSBMN', q).v; } });
    if (UI.comp.sectors) {
      uniq(UI.comp.centres.map(function (k) { return S.centres[k].sector; }).filter(Boolean)).forEach(function (sc, i) {
        ents.push({ name: 'Mitjana ' + sc, color: ['#8d6e63', '#78909c', '#a1887f', '#90a4ae', '#bcaaa4'][i % 5], dash: true, get: function (y, q) { return agg(s, y, sc, q).v; } });
      });
    }
    UI.comp.centres.forEach(function (k, i) { ents.push({ name: cname(k), color: PALETTE[i % PALETTE.length], get: function (y, q) { return val(s, y, k, q); } }); });
    return ents;
  }

  /* ---------- 5. CPR i Accions de millora ---------- */
  function cprStatus(s, k, q) {
    var a = val(s, UI.year, k, q), b = UI.prev ? val(s, UI.prev, k, q) : null;
    if (a == null || b == null) return { st: 'nd', a: a, b: b, d: null };
    var d = round3(a - b), sg = sig(s, k, q);
    if (d >= 0) return { st: 'ok', a: a, b: b, d: a - b };
    if (sg === 'nc') return { st: 'ok', a: a, b: b, d: a - b, note: 'no significatiu' };
    if (sg === 'sig') return { st: 'ko', a: a, b: b, d: a - b };
    return { st: 'ko?', a: a, b: b, d: a - b };
  }
  function renderCpr(el, s) {
    var m = meta(s), cpr = cfg(s).cpr.filter(function (q) { return m.qs.indexOf(q) >= 0; });
    var html = hl(HL.cpr(s), hlScope()) + '<div class="block"><h3>Indicadors CPR ' + UI.year + (UI.prev ? ' vs ' + UI.prev : '') + '</h3>';
    if (!cpr.length) {
      html += '<div class="note warn">Aquest estudi no té preguntes CPR definides. Les pots marcar a Configuració › Preguntes.</div>';
    } else if (!UI.prev) {
      html += '<div class="note warn">Cal un any de comparació per avaluar la CPR (millora o no empitjorament respecte al mateix centre).</div>';
    } else {
      html += '<div class="note">Criteri: millora o no empitjorament respecte al mateix centre en cada pregunta CPR. Si la diferència és negativa però no significativa (amb n o IC) es considera assolida. Sense n ni IC, una diferència negativa queda «pendent de validar».</div>';
      html += '<div class="tscroll" style="margin-top:8px"><table class="t"><thead><tr><th>Centre</th>' + cpr.map(function (q) { return '<th class="v" title="' + esc(qlabel(s, q)) + '">' + q + '</th>'; }).join('') + '<th class="v">Assoliment</th></tr></thead><tbody>';
      (UI.sector ? [UI.sector] : m.sectors).forEach(function (sc) {
        html += '<tr class="grp"><td colspan="' + (cpr.length + 2) + '">' + esc(sc) + '</td></tr>';
        m.active.filter(function (k) { return S.centres[k].sector === sc; }).forEach(function (k) {
          var ok = 0, tot = 0;
          html += '<tr><td>' + esc(cname(k)) + '</td>' + cpr.map(function (q) {
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

    // Accions de millora
    var keys = UI.sector ? m.active.filter(function (k) { return S.centres[k].sector === UI.sector; }) : m.centres;
    if (!UI.accCentre || keys.indexOf(UI.accCentre) < 0) UI.accCentre = keys[0] || '';
    var k = UI.accCentre;
    html += '<div class="block" style="margin-top:20px"><div class="toolbar" style="justify-content:space-between"><h3 style="margin:0">Accions de millora per centre</h3>' +
      '<div class="filters"><div class="field"><label for="acc-c">Centre</label><select id="acc-c">' + keys.map(function (x) { return '<option value="' + x + '"' + (x === k ? ' selected' : '') + '>' + esc(cname(x)) + '</option>'; }).join('') + '</select></div>' +
      '<button type="button" class="btn" id="acc-rep">Informe del centre</button><button type="button" class="btn" id="acc-xlsx">Exportar accions (Excel)</button></div></div>';

    if (k) {
      var worst = m.qs.map(function (q) { return { q: q, v: val(s, UI.year, k, q) }; }).filter(function (x) { return x.v != null; })
        .sort(function (a, b) { return norm(a.q, a.v) - norm(b.q, b.v); }).slice(0, 5);
      var list = [], seen = {};
      function add(q, why) { if (seen[q]) { seen[q].why.push(why); return; } var o = { q: q, why: [why] }; seen[q] = o; list.push(o); }
      worst.forEach(function (x) { add(x.q, 'Top 5 pitjors del centre'); });
      cfg(s).trans.forEach(function (q) { if (m.qs.indexOf(q) >= 0) add(q, 'Transversal'); });
      cpr.forEach(function (q) { var r = cprStatus(s, k, q); if (r.st === 'ko' || r.st === 'ko?') add(q, 'CPR no assolida'); });
      html += '<div class="grid g2" style="margin-top:8px"><div class="block"><h3>Indicadors a revisar · ' + esc(cname(k)) + '</h3><ol class="rank">' + list.map(function (x, i) {
        var a = val(s, UI.year, k, x.q), b = UI.prev ? val(s, UI.prev, k, x.q) : null;
        var n = S.actions.filter(function (ac) { return ac.study === s && ac.centre === k && ac.q === x.q; }).length;
        return '<li><span class="pos">' + (i + 1) + '</span><span class="lbl">' + esc(qlabel(s, x.q)) + '<small>' + x.why.join(' · ') + (UI.prev ? ' · ' + dspan(x.q, a != null && b != null ? a - b : null) : '') + (n ? ' · ' + n + ' accions' : '') + '</small></span>' +
          '<span style="display:flex;gap:6px;align-items:center"><span class="pill ' + sem(x.q, a) + '"><span class="dot ' + sem(x.q, a) + '"></span>' + fmt(x.q, a) + '</span><button type="button" class="btn sm" data-addq="' + x.q + '">+ Acció</button></span></li>';
      }).join('') + '</ol>' + (!cfg(s).trans.length ? '<div class="note" style="margin-top:6px">No hi ha transversals marcades per a aquest estudi (Configuració › Preguntes).</div>' : '') + '</div>' +
        '<div class="block"><h3 id="acc-form-title">' + (UI.editAction ? 'Editar acció' : 'Nova acció') + '</h3><form id="acc-form" class="card grid" style="gap:10px">' + actionForm(s, k) + '</form></div></div>';
    }
    // Taula d'accions
    var acts = S.actions.filter(function (a) { return a.study === s && keys.indexOf(a.centre) >= 0; });
    html += '<div class="block" style="margin-top:16px"><h3>Registre d\'accions (' + acts.length + ')</h3>' + (acts.length ? '<div class="tscroll"><table class="t"><thead><tr><th>Centre</th><th>Pregunta</th><th>Acció</th><th>Responsable</th><th>Data prevista</th><th>Estat</th><th>Seguiment</th><th></th></tr></thead><tbody>' +
      acts.map(function (a) {
        var stc = a.estat === 'Feta' ? 'g' : a.estat === 'En curs' ? 'a' : 'r';
        return '<tr><td>' + esc(cname(a.centre)) + '</td><td>' + esc(a.q) + qtags(s, a.q) + '</td><td>' + esc(a.accio) + '</td><td>' + esc(a.responsable) + '</td><td class="v">' + esc(a.data) + '</td><td><span class="pill ' + stc + '">' + esc(a.estat) + '</span></td><td>' + esc(a.seguiment) + '</td>' +
          '<td style="white-space:nowrap"><button type="button" class="btn sm" data-edit="' + a.id + '">Editar</button> <button type="button" class="btn sm danger" data-del="' + a.id + '">Eliminar</button></td></tr>';
      }).join('') + '</tbody></table></div>' : '<div class="note">Encara no hi ha accions registrades. Fes clic a «+ Acció» al costat d\'un indicador per afegir-ne una.</div>') + '<div id="del-confirm"></div></div></div>';
    el.innerHTML = html;

    var sel = $('#acc-c'); if (sel) sel.onchange = function () { UI.accCentre = this.value; UI.editAction = null; render(); };
    $all('[data-addq]').forEach(function (b) { b.onclick = function () { UI.editAction = null; var f = $('#acc-form'); f.reset(); $('#a-q').value = b.dataset.addq; $('#a-accio').focus(); }; });
    var form = $('#acc-form');
    if (form) form.onsubmit = function (ev) {
      ev.preventDefault();
      var o = { study: s, centre: k, q: $('#a-q').value, accio: $('#a-accio').value.trim(), responsable: $('#a-resp').value.trim(), data: $('#a-data').value, estat: $('#a-estat').value, seguiment: $('#a-seg').value.trim() };
      if (!o.accio) { toast('Escriu la descripció de l\'acció.'); return; }
      if (UI.editAction) { var a = S.actions.filter(function (x) { return x.id === UI.editAction; })[0]; Object.assign(a, o, { modificat: new Date().toISOString() }); toast('Acció actualitzada'); }
      else { o.id = uid(); o.creat = new Date().toISOString(); S.actions.push(o); toast('Acció afegida'); }
      UI.editAction = null; save(); render();
    };
    var cancel = $('#a-cancel'); if (cancel) cancel.onclick = function () { UI.editAction = null; render(); };
    $all('[data-edit]').forEach(function (b) { b.onclick = function () { var a = S.actions.filter(function (x) { return x.id === b.dataset.edit; })[0]; UI.accCentre = a.centre; UI.editAction = a.id; render(); var t = $('#acc-form-title'); if (t) t.scrollIntoView({ block: 'center' }); }; });
    $all('[data-del]').forEach(function (b) {
      b.onclick = function () {
        var box = $('#del-confirm');
        box.innerHTML = '<div class="confirm" style="margin-top:8px">Vols eliminar aquesta acció? <button type="button" class="btn sm danger" id="del-yes">Eliminar</button><button type="button" class="btn sm" id="del-no">Cancel·lar</button></div>';
        $('#del-yes').onclick = function () { S.actions = S.actions.filter(function (x) { return x.id !== b.dataset.del; }); save(); render(); toast('Acció eliminada'); };
        $('#del-no').onclick = function () { box.innerHTML = ''; };
      };
    });
    var xb = $('#acc-xlsx'); if (xb) xb.onclick = function () { exportActions(s, acts); };
    var rb = $('#acc-rep'); if (rb) rb.onclick = function () { centreReport(s, k); };
  }
  function actionForm(s, k) {
    var m = meta(s), a = UI.editAction ? S.actions.filter(function (x) { return x.id === UI.editAction; })[0] : null;
    a = a || {};
    return '<div class="field"><label for="a-q">Pregunta / indicador</label><select id="a-q">' + m.qs.map(function (q) { return '<option value="' + q + '"' + (a.q === q ? ' selected' : '') + '>' + esc(qlabel(s, q).slice(0, 90)) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="a-accio">Acció de millora</label><textarea id="a-accio" placeholder="Ex.: rondes informatives a la sala d\'espera cada 60 minuts">' + esc(a.accio || '') + '</textarea></div>' +
      '<div class="grid g2" style="gap:10px"><div class="field"><label for="a-resp">Responsable</label><input id="a-resp" value="' + esc(a.responsable || '') + '" placeholder="Nom i càrrec"></div>' +
      '<div class="field"><label for="a-data">Data prevista</label><input id="a-data" type="date" value="' + esc(a.data || '') + '"></div>' +
      '<div class="field"><label for="a-estat">Estat</label><select id="a-estat">' + ['Pendent', 'En curs', 'Feta'].map(function (x) { return '<option' + (a.estat === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="a-seg">Indicador de seguiment</label><input id="a-seg" value="' + esc(a.seguiment || '') + '" placeholder="Ex.: P5 ≥ 75% al PLAENSA següent"></div></div>' +
      '<div class="toolbar"><button type="submit" class="btn primary">' + (UI.editAction ? 'Desar canvis' : 'Afegir acció') + '</button>' + (UI.editAction ? '<button type="button" class="btn" id="a-cancel">Cancel·lar</button>' : '') + '</div>';
  }
  function exportActions(s, acts) {
    var aoa = [['Estudi', 'Centre', 'Sector', 'Pregunta', 'Resultat ' + UI.year, 'Acció', 'Responsable', 'Data prevista', 'Estat', 'Indicador de seguiment', 'Creada']];
    acts.forEach(function (a) { aoa.push([studyName(s), cfull(a.centre), (S.centres[a.centre] || {}).sector || '', qlabel(s, a.q), fmt(a.q, val(s, UI.year, a.centre, a.q)), a.accio, a.responsable, a.data, a.estat, a.seguiment, (a.creat || '').slice(0, 10)]); });
    var wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Accions');
    XLSX.writeFile(wb, 'PLAENSA_' + s + '_accions_millora.xlsx');
  }
  function centreReport(s, k) {
    var m = meta(s), c = S.centres[k];
    var rows = m.qs.map(function (q) { var a = val(s, UI.year, k, q), b = UI.prev ? val(s, UI.prev, k, q) : null; return { q: q, a: a, b: b, d: a != null && b != null ? a - b : null, sc: c.sector ? agg(s, UI.year, c.sector, q).v : null, cat: val(s, UI.year, 'CAT', q) }; });
    var red = rows.filter(function (r) { return sem(r.q, r.a) === 'r'; }), down = rows.filter(function (r) { return dcls(r.q, r.d) === 'down'; }), up = rows.filter(function (r) { return dcls(r.q, r.d) === 'up'; });
    var acts = S.actions.filter(function (a) { return a.study === s && a.centre === k; });
    var body = '<div class="report"><div><h3>' + esc(cfull(k)) + '</h3><div class="sub">' + esc(studyName(s)) + ' · PLAENSA ' + UI.year + (UI.prev ? ' vs ' + UI.prev : '') + ' · Sector ' + esc(c.sector || 'no assignat') + '</div></div>' +
      '<p>Satisfacció global P101: <strong>' + fmt('P101', val(s, UI.year, k, 'P101')) + '</strong> (Catalunya ' + fmt('P101', val(s, UI.year, 'CAT', 'P101')) + '). Fidelitat P102: <strong>' + fmt('P102', val(s, UI.year, k, 'P102')) + '</strong>. ' +
      red.length + ' preguntes en àrea de millora; ' + up.length + ' milloren i ' + down.length + ' empitjoren més de ' + S.config.thr.diff * 100 + ' pp.</p>' +
      '<div class="tscroll"><table class="t"><thead><tr><th>Pregunta</th><th class="v">' + UI.year + '</th>' + (UI.prev ? '<th class="v">' + UI.prev + '</th><th class="v">Dif.</th>' : '') + '<th class="v">Sector</th><th class="v">Catalunya</th></tr></thead><tbody>' +
      rows.map(function (r) { return '<tr><td>' + esc(qlabel(s, r.q)) + qtags(s, r.q) + '</td><td class="v"><span class="pill ' + sem(r.q, r.a) + '"><span class="dot ' + sem(r.q, r.a) + '"></span>' + fmt(r.q, r.a) + '</span></td>' + (UI.prev ? '<td class="v">' + fmt(r.q, r.b) + '</td><td class="v">' + dspan(r.q, r.d) + '</td>' : '') + '<td class="v">' + fmt(r.q, r.sc) + '</td><td class="v">' + fmt(r.q, r.cat) + '</td></tr>'; }).join('') +
      '</tbody></table></div><h3>Accions de millora (' + acts.length + ')</h3>' +
      (acts.length ? '<div class="tscroll"><table class="t"><thead><tr><th>Pregunta</th><th>Acció</th><th>Responsable</th><th>Data</th><th>Estat</th><th>Seguiment</th></tr></thead><tbody>' + acts.map(function (a) { return '<tr><td>' + esc(a.q) + '</td><td>' + esc(a.accio) + '</td><td>' + esc(a.responsable) + '</td><td>' + esc(a.data) + '</td><td>' + esc(a.estat) + '</td><td>' + esc(a.seguiment) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p>Sense accions registrades.</p>') + '</div>';
    openModal('Informe del centre', body, '<button type="button" class="btn" id="rep-html">Descarregar informe (.html)</button><button type="button" class="btn primary" data-close>Tancar</button>');
    $('#rep-html').onclick = function () {
      var doc = '<!doctype html><html lang="ca"><head><meta charset="utf-8"><title>Informe ' + esc(cname(k)) + '</title><style>' + document.getElementById('app-css').textContent + '</style></head><body><div class="wrap" style="padding-block:24px">' + body + '</div></body></html>';
      saveBlob(new Blob([doc], { type: 'text/html' }), 'Informe_PLAENSA_' + s + '_' + k + '_' + UI.year + '.html');
    };
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
    var aoa = [['estudi', 'any', 'codi_centre', 'centre', 'sector', 'tipus', 'pregunta_codi', 'pregunta', 'valor', 'n', 'ic_inf', 'ic_sup'],
      ['AI', 2026, '9999', 'Centre d\'exemple', 'Maresme Central', 'centre', 'P101', 'Grau de satisfacció global', 8.4, 120, 8.1, 8.7],
      ['AI', 2026, '9999', 'Centre d\'exemple', 'Maresme Central', 'centre', 'P102', 'Continuaria venint?', 0.91, 120, 0.85, 0.95],
      ['AI', 2026, 'CAT', 'Catalunya', '', 'referència', 'P101', 'Grau de satisfacció global', 8.1, '', '', '']];
    var help = [['Plantilla normalitzada PLAENSA'], [''],
      ['estudi', 'AEA, URG, AH, TRD, AP, EMB o AI'], ['any', 'Any de l\'edició (p. ex. 2026)'], ['codi_centre', 'Número d\'UP (p. ex. 272) o CAT/RSBMN per a referències'],
      ['centre', 'Nom del centre'], ['sector', 'Sector sanitari (opcional; es pot editar al quadre)'], ['tipus', '"centre" o "referència"'],
      ['pregunta_codi', 'P1, P2 … P101, P102'], ['pregunta', 'Text resumit de la pregunta'], ['valor', 'Proporció 0–1 (o %) ; P101 en escala 0–10'],
      ['n', 'Opcional: nombre de respostes (permet calcular significació)'], ['ic_inf / ic_sup', 'Opcional: interval de confiança del 95%']];
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Dades');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(help), 'Instruccions');
    XLSX.writeFile(wb, 'Plantilla_PLAENSA_normalitzada.xlsx');
  }

  /* ---------- Configuració ---------- */
  var cfgTab = 'centres';
  function openConfig() {
    openModal('Configuració', '<div class="seg" id="cfg-tabs">' + [['centres', 'Centres i sectors'], ['preg', 'Preguntes CPR i transversals'], ['llindars', 'Llindars'], ['dades', 'Dades i còpies']].map(function (x) { return '<button type="button" data-ct="' + x[0] + '" class="' + (cfgTab === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div><div id="cfg-body"></div>', '<button type="button" class="btn primary" data-close>Fet</button>');
    $all('[data-ct]').forEach(function (b) { b.onclick = function () { cfgTab = b.dataset.ct; $all('[data-ct]').forEach(function (x) { x.classList.toggle('on', x === b); }); renderCfg(); }; });
    renderCfg();
    $('#modal').addEventListener('click', function (e) { if (e.target.hasAttribute('data-close')) render(); });
  }
  function renderCfg() {
    var b = $('#cfg-body');
    if (cfgTab === 'centres') {
      var ks = Object.keys(S.centres).filter(function (k) { return S.centres[k].type === 'centre'; }).sort(centreSort);
      var allSec = uniq(SECTOR_ORDER.concat(ks.map(function (k) { return S.centres[k].sector; }).filter(Boolean)));
      b.innerHTML = '<div class="note">Els centres sense sector o marcats com a exclosos (p. ex. Guttmann, monogràfic) no entren als agregats de sector i regió ni als marcs de millor/pitjor, però es poden consultar. La regió RSBMN usa el valor oficial quan l\'Excel l\'inclou (Primària).</div>' +
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
    } else if (cfgTab === 'preg') {
      b.innerHTML = '<div class="note">Marca per a cada estudi quines preguntes formen part de la CPR i quines són indicadors transversals (decisió del tècnic). Configuració inicial de la CPR: Urgències P7, P23, P26, P102 · Primària P2, P9, P15, P102 · TRD P4, P5, P7, P9.</div>' +
        STUDIES.map(function (st) {
          var m = meta(st.id), qs = uniq(m.qs.concat(cfg(st.id).cpr).concat(cfg(st.id).trans)).sort(qSort);
          return '<details' + (st.id === UI.study ? ' open' : '') + '><summary><strong>' + st.id + '</strong> · ' + esc(st.name) + ' <span class="kpi-meta" style="display:inline">CPR: ' + (cfg(st.id).cpr.join(', ') || '—') + ' · Transversals: ' + (cfg(st.id).trans.join(', ') || '—') + '</span></summary>' +
            (qs.length ? '<div class="tscroll" style="margin:8px 0"><table class="t"><thead><tr><th>Pregunta</th><th>CPR</th><th>Transversal</th></tr></thead><tbody>' + qs.map(function (q) {
              return '<tr><td>' + esc(qlabel(st.id, q)) + '</td><td><input type="checkbox" aria-label="CPR ' + q + '" data-st="' + st.id + '" data-kind="cpr" data-q="' + q + '"' + (isCpr(st.id, q) ? ' checked' : '') + '></td><td><input type="checkbox" aria-label="Transversal ' + q + '" data-st="' + st.id + '" data-kind="trans" data-q="' + q + '"' + (isTrans(st.id, q) ? ' checked' : '') + '></td></tr>';
            }).join('') + '</tbody></table></div>' : '<div class="note">Carrega dades d\'aquest estudi per marcar-ne les preguntes.</div>') + '</details>';
        }).join('');
      $all('#cfg-body input[data-kind]').forEach(function (i) {
        i.onchange = function () {
          var l = cfg(i.dataset.st)[i.dataset.kind], q = i.dataset.q;
          if (i.checked && l.indexOf(q) < 0) l.push(q); if (!i.checked && l.indexOf(q) >= 0) l.splice(l.indexOf(q), 1);
          l.sort(qSort); save();
        };
      });
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
            S = Object.assign(freshState(), o); invalidate(); save(); renderCfg(); toast('Còpia importada');
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

  /* ---------- Presentació ---------- */
  function buildPptx(s) {
    if (typeof PptxGenJS === 'undefined') { toast('No s\'ha carregat el generador de presentacions.'); return; }
    try {
      var ctx = { S: S, UI: UI, s: s, meta: meta(s), val: val, agg: agg, fmt: fmt, fmtD: fmtD, sem: sem, dcls: dcls, norm: norm, extremes: extremes, cname: cname, cfull: cfull, qlabel: qlabel, qtext: qtext, isCpr: isCpr, isTrans: isTrans, cfg: cfg, cprStatus: cprStatus, studyName: studyName, mean: mean, round3: round3, headlines: HL.resum(s), hlScope: hlScope() };
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
    var th = lsGet('plaensa-theme'); if (th) document.documentElement.setAttribute('data-theme', th);
    UI.sub = lsGet('plaensa-sub') || 'resum';
    DB.get('state').then(function (st) {
      if (st && st.records && Object.keys(st.records).length) S = Object.assign(freshState(), st);
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
