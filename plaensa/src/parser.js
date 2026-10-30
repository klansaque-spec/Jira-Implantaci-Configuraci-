/* PLAENSA · lector de fitxers Excel (format ample oficial i plantilla normalitzada).
   Funciona al navegador (global PLP) i a Node (module.exports) per poder-lo provar. */
(function (root) {
  'use strict';

  var STUDIES = [
    { id: 'AEA', name: 'Atenció Especialitzada Ambulatòria', re: /\bAEA\b|ambulat/i },
    { id: 'URG', name: 'Atenció Hospitalària Urgent', re: /urgen|\bURG\b/i },
    { id: 'AH', name: 'Atenció Hospitalària amb Internament', re: /internament|\bAH\b/i },
    { id: 'TRD', name: 'Teràpies Respiratòries Domiciliàries', re: /\bTRD\b|respirat/i },
    { id: 'AP', name: 'Atenció Primària', re: /\bAP\b|prim[àa]ria|\bEAP\b/i },
    { id: 'EMB', name: 'Embaràs, Part i Puerperi', re: /embar|puerp/i },
    { id: 'AI', name: 'Atenció Intermèdia', re: /interm[èe]dia|sociosanit/i }
  ];

  var SECTORS = {
    VOR: 'Vallès Oriental',
    VOCE: 'Vallès Occidental Est',
    VOCO: 'Vallès Occidental Oest',
    BNIBM: 'Barcelonès Nord i Baix Maresme',
    BNIBAIXM: 'Barcelonès Nord i Baix Maresme',
    MAR: 'Maresme Central',
    MARESME: 'Maresme Central'
  };

  var SKIP_COL = /dif|\bvs\b|objectiu|assoliment|puntuaci|refer[eè]ncia/i;

  function str(v) { return v == null ? '' : String(v).trim(); }

  function num(v) {
    if (typeof v === 'number') return isFinite(v) ? v : null;
    var s = str(v).replace('%', '').replace(',', '.');
    if (!s || !/^-?\d+(\.\d+)?$/.test(s)) return null;
    var n = parseFloat(s);
    return str(v).indexOf('%') >= 0 ? n / 100 : n;
  }

  function guessStudy(text) {
    for (var i = 0; i < STUDIES.length; i++) if (STUDIES[i].re.test(text)) return STUDIES[i].id;
    return null;
  }

  function yearsIn(text) {
    var out = [], m, s = str(text);
    var re = /\b(20\d\d)\b/g;
    while ((m = re.exec(s))) out.push(+m[1]);
    // parells de dos dígits: "26 25", "25 i 23", "26_25", "25vs 2022"
    var p = /(?:^|[^\d])(\d\d)\s*(?:vs|i|_|-|\s)\s*(\d\d)(?:[^\d]|$)/i.exec(s);
    if (p) { out.push(2000 + +p[1]); out.push(2000 + +p[2]); }
    return out;
  }

  function sectorFromSigla(text) {
    var toks = str(text).toUpperCase().replace(/\s+/g, '').split('-');
    for (var i = 0; i < toks.length; i++) if (SECTORS[toks[i]]) return SECTORS[toks[i]];
    return null;
  }

  function entitatFromSigla(text) {
    var toks = str(text).split('-').map(function (t) { return t.trim(); });
    for (var i = 0; i < toks.length; i++) if (!SECTORS[toks[i].toUpperCase().replace(/\s+/g, '')]) return toks[i];
    return '';
  }

  /* Identifica el centre (o referència) a partir de la capçalera de columna. */
  function entityFromHeader(h) {
    var s = str(h).replace(/\b20\d\d\b/g, '').replace(/\s+/g, ' ').trim();
    if (/catalunya/i.test(s)) return { key: 'CAT', type: 'ref', name: 'Catalunya' };
    if (/metropolitana\s*nord|\bRSBMN\b/i.test(s)) return { key: 'RSBMN', type: 'ref', name: 'Metropolitana Nord (valor oficial)' };
    var m = /UP\s*[-:]?\s*(\d+)\s*[-–]?\s*(.*)$/i.exec(s);
    if (m) return { key: 'UP' + m[1], type: 'centre', name: m[2].trim() || ('UP ' + m[1]), code: 'UP ' + m[1] };
    m = /^(\d+)\s*[-–]\s*(.+)$/.exec(s);
    if (m) {
      var inner = /\(([^)]+)\)/.exec(m[2]);
      var name = (inner ? inner[1] : m[2]).trim();
      return { key: 'EAP' + m[1], type: 'centre', name: name, code: m[1], place: m[2].replace(/\(.*\)/, '').trim() };
    }
    if (!s) return null;
    return { key: 'X_' + s.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40), type: 'centre', name: s };
  }

  function qFromLabel(label) {
    var m = /^\s*P\s*(\d+)\b\.?\s*(.*)$/i.exec(str(label));
    if (!m) return null;
    return { code: 'P' + (+m[1]), text: m[2].replace(/\s+/g, ' ').trim() };
  }

  function normValue(code, v) {
    if (v == null) return null;
    if (code !== 'P101' && v > 1.5) return v / 100;
    return Math.round(v * 100000) / 100000;
  }

  function gridOf(XLSX, ws) {
    return XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null, blankrows: true });
  }

  function findAnchor(grid) {
    for (var r = 0; r < Math.min(grid.length, 40); r++) {
      var row = grid[r] || [];
      for (var c = 0; c < Math.min(row.length, 15); c++) {
        if (/pregunta\s+resumida/i.test(str(row[c]))) return { r: r, c: c };
      }
    }
    return null;
  }

  function findLongHeader(grid) {
    for (var r = 0; r < Math.min(grid.length, 10); r++) {
      var row = (grid[r] || []).map(function (x) { return str(x).toLowerCase(); });
      if (row.indexOf('estudi') >= 0 && row.indexOf('valor') >= 0 && row.indexOf('pregunta_codi') >= 0) {
        var idx = {};
        row.forEach(function (h, i) { if (h) idx[h] = i; });
        return { r: r, idx: idx };
      }
    }
    return null;
  }

  /* Llegenda de sectors (fulla "Llegenda i sectors" de l'AEA): fila "Hospital | Sector ..." */
  function parseLegend(grid) {
    var out = {};
    for (var r = 0; r < grid.length; r++) {
      var row = grid[r] || [];
      for (var c = 0; c < row.length - 1; c++) {
        if (/^hospital$/i.test(str(row[c])) && /sector/i.test(str(row[c + 1]))) {
          for (var k = r + 1; k < grid.length; k++) {
            var h = str((grid[k] || [])[c]), sct = str((grid[k] || [])[c + 1]);
            if (!h || !sct) break;
            var e = entityFromHeader(h);
            if (e && e.type === 'centre') out[e.key] = sct;
          }
          return out;
        }
      }
    }
    return out;
  }

  function parseLong(grid, hdr, defStudy) {
    var recs = [], centres = {}, questions = {}, warnings = [], ix = hdr.idx;
    function g(row, k) { return ix[k] == null ? null : row[ix[k]]; }
    for (var r = hdr.r + 1; r < grid.length; r++) {
      var row = grid[r] || [];
      var q = qFromLabel(g(row, 'pregunta_codi'));
      var v = num(g(row, 'valor'));
      var y = num(g(row, 'any'));
      if (!q || v == null || !y) continue;
      var raw = str(g(row, 'estudi')).toUpperCase();
      var st = (STUDIES.some(function (x) { return x.id === raw; }) ? raw : guessStudy(raw)) || defStudy || raw;
      var codi = str(g(row, 'codi_centre')), nom = str(g(row, 'centre'));
      var e = entityFromHeader(/^\d+$/.test(codi) ? ('UP ' + codi + ' - ' + nom) : (codi || nom));
      if (!e) continue;
      if (/refer/i.test(str(g(row, 'tipus')))) e.type = 'ref';
      if (nom && e.type === 'centre') e.name = nom;
      if (str(g(row, 'sector'))) e.sectorHint = str(g(row, 'sector'));
      centres[e.key] = centres[e.key] || e;
      if (str(g(row, 'pregunta'))) questions[q.code] = str(g(row, 'pregunta'));
      var rec = { s: st, y: y, k: e.key, q: q.code, v: normValue(q.code, v) };
      var n = num(g(row, 'n')), lo = num(g(row, 'ic_inf')), hi = num(g(row, 'ic_sup'));
      if (n) rec.n = n;
      if (lo != null && hi != null) { rec.lo = normValue(q.code, lo); rec.hi = normValue(q.code, hi); }
      recs.push(rec);
    }
    if (!recs.length) warnings.push('La plantilla no té cap fila vàlida (cal estudi, any, pregunta_codi i valor).');
    return { records: recs, centres: centres, questions: questions, warnings: warnings, format: 'plantilla' };
  }

  /* Format ample oficial: fila "Pregunta resumida" + una columna per centre i any. */
  function parseWide(grid, anchor, sheetName, defaultYear, study) {
    var hr = anchor.r, qc = anchor.c, warnings = [];
    var header = grid[hr] || [];
    var above = function (c) {
      var out = [];
      for (var k = 1; k <= 3; k++) if (hr - k >= 0) out.push(str((grid[hr - k] || [])[c]));
      return out;
    };

    // anys del full: referències, files superiors i nom del full
    var sy = {};
    yearsIn(sheetName).forEach(function (y) { sy[y] = 1; });
    for (var c = qc + 1; c < header.length; c++) {
      var h = str(header[c]);
      if (!h) continue;
      if (/catalunya|metropolitana/i.test(h) && !SKIP_COL.test(h)) yearsIn(h).forEach(function (y) { sy[y] = 1; });
      above(c).forEach(function (a) { if (/^20\d\d$/.test(a)) sy[+a] = 1; });
    }
    var sheetYears = Object.keys(sy).map(Number).sort(function (a, b) { return b - a; });
    if (!sheetYears.length && defaultYear) sheetYears = [defaultYear];

    var cols = [], seen = {}, centres = {};
    for (c = qc + 1; c < header.length; c++) {
      h = str(header[c]);
      if (!h) continue;
      var ab = above(c);
      if (SKIP_COL.test(h) || ab.some(function (a) { return SKIP_COL.test(a); })) continue;
      var e = entityFromHeader(h);
      if (!e) continue;
      var y = null, hy = /\b(20\d\d)\b/.exec(h);
      if (hy) y = +hy[1];
      else for (var i = 0; i < ab.length; i++) if (/^20\d\d$/.test(ab[i])) { y = +ab[i]; break; }
      if (y && sheetYears.length >= 2 && sheetYears.indexOf(y) < 0 && e.type === 'centre') {
        var fixed = sheetYears[sheetYears.length - 1];
        warnings.push('Columna "' + h.slice(0, 50) + '": l\'any ' + y + ' no coincideix amb els anys del full (' + sheetYears.join(', ') + '); s\'assigna a ' + fixed + '.');
        y = fixed;
      }
      if (!y) {
        var occ = seen[e.key] || 0;
        y = sheetYears[occ] || null;
        seen[e.key] = occ + 1;
      }
      if (!y) { warnings.push('Columna "' + h.slice(0, 50) + '": no s\'ha pogut deduir l\'any.'); continue; }
      var sg = ab[0] ? sectorFromSigla(ab[0]) : null;
      if (sg) { e.sectorHint = sg; e.entitat = entitatFromSigla(ab[0]); }
      if (!centres[e.key] || (e.name.length > centres[e.key].name.length && e.type === 'centre')) {
        centres[e.key] = Object.assign({}, centres[e.key] || {}, e);
      }
      cols.push({ c: c, key: e.key, y: y });
    }

    var recs = [], questions = {}, dup = {}, conflicts = 0;
    for (var r = hr + 1; r < grid.length; r++) {
      var q = qFromLabel((grid[r] || [])[qc]);
      if (!q) continue;
      if (q.text && (!questions[q.code] || q.text.length > questions[q.code].length)) questions[q.code] = q.text;
      cols.forEach(function (col) {
        var v = num((grid[r] || [])[col.c]);
        if (v == null) return;
        v = normValue(q.code, v);
        var id = col.y + '|' + col.key + '|' + q.code;
        if (dup[id] != null) { if (Math.abs(dup[id] - v) > 0.0005) conflicts++; return; }
        dup[id] = v;
        recs.push({ s: study, y: col.y, k: col.key, q: q.code, v: v });
      });
    }
    if (conflicts) warnings.push(conflicts + ' valors duplicats amb xifres diferents dins del full (es manté el primer).');
    return { records: recs, centres: centres, questions: questions, warnings: warnings, format: 'ample', years: sheetYears };
  }

  /* opts: { study, defaultYear, manual: { sheetName: {r, c} } } */
  function parseWorkbook(XLSX, wb, fileName, opts) {
    opts = opts || {};
    var probe = fileName + ' ' + wb.SheetNames.join(' ');
    var firstGrid = gridOf(XLSX, wb.Sheets[wb.SheetNames[0]]);
    var title = firstGrid.slice(0, 3).map(function (r) { return (r || []).map(str).join(' '); }).join(' ');
    var study = opts.study || guessStudy(fileName) || guessStudy(title) || guessStudy(probe);
    var fy = yearsIn(fileName);
    var defaultYear = opts.defaultYear || (fy.length ? Math.max.apply(null, fy) : null);
    var sheets = [], legend = {};

    wb.SheetNames.forEach(function (sn) {
      var grid = gridOf(XLSX, wb.Sheets[sn]);
      Object.assign(legend, parseLegend(grid));
      var manual = opts.manual && opts.manual[sn];
      var lh = findLongHeader(grid);
      var res;
      if (lh) res = parseLong(grid, lh, study);
      else {
        var anchor = manual || findAnchor(grid);
        if (!anchor) { sheets.push({ name: sn, ok: false, reason: 'Sense fila «Pregunta resumida»', grid: grid.slice(0, 12) }); return; }
        res = parseWide(grid, anchor, sn, defaultYear, study);
      }
      var nC = Object.keys(res.centres).filter(function (k) { return res.centres[k].type === 'centre'; }).length;
      var ys = {};
      res.records.forEach(function (x) { ys[x.y] = 1; });
      sheets.push({
        name: sn, ok: res.records.length > 0, format: res.format, records: res.records, centres: res.centres,
        questions: res.questions, warnings: res.warnings, nCentres: nC,
        nQuestions: Object.keys(res.questions).length, years: Object.keys(ys).map(Number).sort(),
        reason: res.records.length ? '' : 'Cap valor numèric reconegut', grid: res.records.length ? null : grid.slice(0, 12)
      });
    });
    if (!study) {
      // plantilla: l'estudi ve a la columna "estudi"
      sheets.some(function (sh) { var r = (sh.records || [])[0]; if (r && r.s) { study = r.s; return true; } return false; });
    }
    return { fileName: fileName, study: study, legend: legend, sheets: sheets };
  }

  var api = { STUDIES: STUDIES, SECTORS: SECTORS, parseWorkbook: parseWorkbook, guessStudy: guessStudy, qFromLabel: qFromLabel };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PLP = api;
})(this);
