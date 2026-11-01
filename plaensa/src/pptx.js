/* PLAENSA · presentació tipus (estructura del model "PLAENSA RSBMN Urgències") amb PptxGenJS.
   Taules i gràfics natius i editables; textos de conclusions generats a partir de les dades. */
(function (root) {
  'use strict';
  var RED = 'C00000', GREY = '656565', DARK = '333333', LIGHT = 'F2F2F2', LINE = 'D9D9D9';
  var FILL = { r: 'F8D0D0', a: 'FCE3B8', g: 'CDEBCF', n: 'FFFFFF' };
  var DOT = { r: 'C62828', a: 'D98200', g: '2E7D32', n: 'BFBFBF' };
  var FONT = 'Arial';
  var MONTHS = ['de gener', 'de febrer', 'de març', 'd\'abril', 'de maig', 'de juny', 'de juliol', 'd\'agost', 'de setembre', 'd\'octubre', 'de novembre', 'de desembre'];

  function today() { var d = new Date(); return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' de ' + d.getFullYear(); }
  function chunk(a, n) { var o = []; for (var i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o.length ? o : [[]]; }

  function build(c) {
    var m = c.meta, s = c.s, y = c.UI.year, p = c.UI.prev;
    var LOGO = (typeof window !== 'undefined' && window.PL_LOGO) || null;
    var pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';
    pptx.author = 'Atenció a la Ciutadania · RSBMN';
    pptx.title = 'PLAENSA ' + y + ' · ' + c.studyName(s);
    var footer = 'PLAENSA ' + y + ' · ' + c.studyName(s) + ' · RSBMN';

    pptx.defineSlideMaster({
      title: 'CONT', background: { color: 'FFFFFF' },
      objects: [
        { rect: { x: 0, y: 0, w: 0.18, h: 7.5, fill: { color: RED } } },
        { line: { x: 0.5, y: 1.05, w: 12.3, h: 0, line: { color: LINE, width: 0.75 } } },
        { text: { text: footer, options: { x: 0.5, y: 7.05, w: 9, h: 0.3, fontSize: 8, color: GREY, fontFace: FONT } } },
        LOGO ? { image: { x: 9.95, y: 6.98, w: 2.3, h: 0.31, data: LOGO } } : { text: { text: 'Servei Català de la Salut', options: { x: 9.3, y: 7.05, w: 3.0, h: 0.3, fontSize: 8, color: GREY, fontFace: FONT, align: 'right' } } }
      ],
      slideNumber: { x: 9.4, y: 7.05, w: 0.5, h: 0.3, fontSize: 8, color: GREY, fontFace: FONT }
    });
    pptx.defineSlideMaster({ title: 'SECT', background: { color: LIGHT }, objects: [{ rect: { x: 0, y: 0, w: 4.2, h: 7.5, fill: { color: RED } } }] });

    function slide(title, subtitle) {
      var sl = pptx.addSlide({ masterName: 'CONT' });
      sl.addText(title, { x: 0.5, y: 0.3, w: 10.5, h: 0.6, fontSize: 22, bold: true, color: DARK, fontFace: FONT });
      if (subtitle) sl.addText(subtitle, { x: 9.8, y: 0.38, w: 3.0, h: 0.45, fontSize: 12, color: RED, bold: true, fontFace: FONT, align: 'right' });
      return sl;
    }
    function section(n, title) {
      var sl = pptx.addSlide({ masterName: 'SECT' });
      sl.addText(String(n), { x: 0.6, y: 2.6, w: 3, h: 1.8, fontSize: 96, bold: true, color: 'FFFFFF', fontFace: FONT });
      sl.addText(title, { x: 4.8, y: 3.0, w: 8, h: 1.2, fontSize: 32, bold: true, color: DARK, fontFace: FONT });
    }
    function th(t, o) { return { text: t, options: Object.assign({ bold: true, fill: { color: DARK }, color: 'FFFFFF', fontSize: 8, align: 'center', valign: 'middle' }, o || {}) }; }
    function semCell(q, v, d, extra) {
      var cl = c.sem(q, v), txt = c.fmt(q, v);
      var runs = [{ text: txt, options: { bold: true, color: '000000' } }];
      if (d !== undefined) {
        var dc = c.dcls(q, d);
        runs.push({ text: '\n' + c.fmtD(q, d), options: { fontSize: 6.5, color: dc === 'up' ? '2E7D32' : dc === 'down' ? 'C62828' : GREY, bold: dc !== '' } });
      }
      return { text: runs, options: Object.assign({ fill: { color: FILL[cl] }, align: 'center', valign: 'middle', fontSize: 8 }, extra || {}) };
    }
    function qCell(q, bold) { return { text: c.qlabel(s, q), options: { fontSize: 7.5, bold: !!bold, align: 'left', valign: 'middle' } }; }
    var tblOpts = { x: 0.5, y: 1.25, w: 12.3, fontFace: FONT, fontSize: 8, border: { type: 'solid', pt: 0.5, color: LINE }, autoPage: false, margin: 0.03 };
    function d(a, b) { return a != null && b != null ? a - b : null; }
    function rsb(yy, q) { return yy ? c.agg(s, yy, 'RSBMN', q).v : null; }

    // 1. Portada
    var cover = pptx.addSlide();
    cover.background = { color: 'FFFFFF' };
    cover.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 13.33, h: 0.35, fill: { color: RED } });
    if (LOGO) cover.addImage({ data: LOGO, x: 0.8, y: 0.8, w: 4.2, h: 0.565 });
    cover.addText([{ text: 'PLAENSA ' + y, options: { fontSize: 40, bold: true, color: RED, breakLine: true } }, { text: c.studyName(s), options: { fontSize: 30, bold: true, color: DARK } }], { x: 0.8, y: 2.0, w: 11.5, h: 2.2, fontFace: FONT });
    cover.addText([{ text: 'Atenció a la Ciutadania - RSBMN', options: { breakLine: true } }, { text: 'Servei Català de la Salut' }], { x: 0.8, y: 4.4, w: 8, h: 0.9, fontSize: 16, color: GREY, fontFace: FONT });
    cover.addText(today(), { x: 0.8, y: 5.6, w: 6, h: 0.4, fontSize: 12, color: GREY, fontFace: FONT });

    // Missatges clau (titulars per al comitè)
    var hls = (c.headlines || []).slice(0, 4);
    if (hls.length) {
      var mk = slide('Missatges clau', c.hlScope || '');
      var TONE = { r: 'C62828', a: 'D98200', g: '2E7D32', n: '999999' };
      var cw = (12.3 - 0.3 * (hls.length - 1)) / hls.length;
      hls.forEach(function (h, i) {
        var x = 0.5 + i * (cw + 0.3);
        mk.addShape(pptx.shapes.RECTANGLE, { x: x, y: 1.4, w: cw, h: 5.2, fill: { color: '231F1E' }, line: { color: '231F1E' } });
        mk.addShape(pptx.shapes.RECTANGLE, { x: x, y: 1.4, w: cw, h: 0.12, fill: { color: TONE[h.tone] || '999999' }, line: { color: TONE[h.tone] || '999999' } });
        mk.addText(h.kicker.toUpperCase(), { x: x + 0.2, y: 1.7, w: cw - 0.4, h: 0.4, fontSize: 10, color: 'BDB4AF', bold: true, fontFace: FONT });
        mk.addText(h.big, { x: x + 0.2, y: 2.15, w: cw - 0.4, h: 1.0, fit: 'shrink', fontSize: h.big.length > 7 ? 26 : 36, bold: true, color: 'FFFFFF', fontFace: FONT });
        mk.addText(h.text, { x: x + 0.2, y: 3.25, w: cw - 0.4, h: 1.7, fontSize: 15, bold: true, color: 'F7F3F0', fontFace: FONT, valign: 'top' });
        if (h.sub) mk.addText(h.sub, { x: x + 0.2, y: 5.2, w: cw - 0.4, h: 1.2, fontSize: 11, color: 'BDB4AF', fontFace: FONT, valign: 'bottom' });
      });
    }

    // 2-3. Introducció i fitxa tècnica
    section(1, 'Introducció');
    var ft = slide('Fitxa tècnica', c.studyName(s));
    var t = c.S.config.thr;
    var hasN = Object.keys(c.S.records).some(function (k) { return k.indexOf(s + '|' + y + '|') === 0 && (c.S.records[k].n || c.S.records[k].lo != null); });
    ft.addText([
      { text: 'Estudi: ', options: { bold: true } }, { text: 'PLAENSA ' + c.studyName(s), options: { breakLine: true } },
      { text: 'Edicions comparades: ', options: { bold: true } }, { text: y + (p ? ' i ' + p : ''), options: { breakLine: true } },
      { text: 'Àmbit: ', options: { bold: true } }, { text: m.active.length + ' centres de la Regió Sanitària Metropolitana Nord en ' + m.sectors.length + ' sectors' + (m.centres.length > m.active.length ? ' (' + (m.centres.length - m.active.length) + ' centres fora de sector o exclosos)' : ''), options: { breakLine: true } },
      { text: 'Preguntes: ', options: { bold: true } }, { text: m.qs.length + '. P101 (satisfacció global) en escala 0–10; la resta, percentatge de respostes favorables', options: { breakLine: true } },
      { text: 'Semàfor: ', options: { bold: true } }, { text: 'vermell < ' + t.red * 100 + '% (àrea de millora) · taronja ' + t.red * 100 + '–' + (t.green * 100 - 0.1).toFixed(1).replace('.', ',') + '% (estàndard) · verd ≥ ' + t.green * 100 + '% (excel·lència). P101: vermell < ' + String(t.red101).replace('.', ',') + ' · verd ≥ ' + t.green101, options: { breakLine: true } },
      { text: 'Diferències: ', options: { bold: true } }, { text: 'rellevants si superen ±' + t.diff * 100 + ' punts percentuals (P101 ±' + String(t.diff101).replace('.', ',') + ' punts)', options: { breakLine: true } },
      { text: 'Agregats: ', options: { bold: true } }, { text: 'RSBMN i sectors com a mitjana dels centres, excepte quan el fitxer inclou el valor oficial de la regió', options: { breakLine: true } },
      { text: 'Font: ', options: { bold: true } }, { text: 'CatSalut, Pla d\'enquestes de satisfacció (PLAENSA)', options: { breakLine: true } },
      { text: hasN ? '' : 'Nota: els fitxers no inclouen mida mostral ni intervals de confiança; les diferències indiquen rellevància, no significació estadística.', options: { italic: true, color: GREY } }
    ], { x: 0.6, y: 1.4, w: 12, h: 5.3, fontSize: 14, color: DARK, fontFace: FONT, valign: 'top', paraSpaceAfter: 8 });

    // 4. Satisfacció i fidelitat · Catalunya vs RSBMN
    var sf = slide('Satisfacció i Fidelitat ' + c.studyName(s) + ' ' + y, 'Catalunya');
    ['P101', 'P102'].forEach(function (q, i) {
      var labels = ['Catalunya', 'RSBMN'];
      var series = [{ name: String(y), labels: labels, values: [c.val(s, y, 'CAT', q), rsb(y, q)].map(function (v) { return v == null ? 0 : (q === 'P101' ? v : v * 100); }) }];
      if (p) series.push({ name: String(p), labels: labels, values: [c.val(s, p, 'CAT', q), rsb(p, q)].map(function (v) { return v == null ? 0 : (q === 'P101' ? v : v * 100); }) });
      sf.addText(q === 'P101' ? 'Satisfacció global (P101, 0–10)' : 'Fidelitat (P102, %)', { x: 0.5 + i * 6.25, y: 1.2, w: 6, h: 0.4, fontSize: 13, bold: true, color: DARK, fontFace: FONT });
      sf.addChart(pptx.charts.BAR, series, {
        x: 0.5 + i * 6.25, y: 1.6, w: 6, h: 4.9, barDir: 'col', barGrouping: 'clustered', chartColors: [RED, 'A6A6A6'],
        showValue: true, dataLabelFormatCode: q === 'P101' ? '0.00' : '0.0', dataLabelFontSize: 10, valAxisMinVal: q === 'P101' ? 5 : 50, valAxisMaxVal: q === 'P101' ? 10 : 100,
        showLegend: true, legendPos: 'b', legendFontSize: 10, catAxisLabelFontSize: 11, valAxisLabelFontSize: 9, valGridLine: { color: 'E7E6E6', size: 0.5 }
      });
    });

    // 5. Radar
    var rq = m.qs.filter(function (q) { return c.val(s, y, 'CAT', q) != null || rsb(y, q) != null; });
    var rad = slide('Radar ' + c.studyName(s) + ' ' + y, 'Catalunya');
    rad.addChart(pptx.charts.RADAR, [
      { name: 'Catalunya ' + y, labels: rq, values: rq.map(function (q) { var v = c.val(s, y, 'CAT', q); return v == null ? 0 : Math.round(c.norm(q, v) * 1000) / 10; }) },
      { name: 'RSBMN ' + y, labels: rq, values: rq.map(function (q) { var v = rsb(y, q); return v == null ? 0 : Math.round(c.norm(q, v) * 1000) / 10; }) }
    ], { x: 1.5, y: 1.2, w: 10.3, h: 5.6, radarStyle: 'marker', chartColors: ['7F7F7F', RED], showLegend: true, legendPos: 'b', catAxisLabelFontSize: 9, valAxisMinVal: 0, valAxisMaxVal: 100, lineSize: 2 });
    rad.addText('P101 normalitzada a escala 0–100 (valor × 10)', { x: 0.5, y: 6.6, w: 8, h: 0.3, fontSize: 9, color: GREY, italic: true, fontFace: FONT });

    // 6. Resultats any vs anterior (Catalunya i RSBMN)
    var rows = [[th('Pregunta', { align: 'left' }), th('Catalunya ' + y)].concat(p ? [th('Catalunya ' + p), th('Dif.')] : []).concat([th('RSBMN ' + y)]).concat(p ? [th('RSBMN ' + p), th('Dif.')] : [])];
    m.qs.forEach(function (q) {
      var a = c.val(s, y, 'CAT', q), b = p ? c.val(s, p, 'CAT', q) : null, ra = rsb(y, q), rb = rsb(p, q);
      var row = [qCell(q), semCell(q, a)];
      if (p) row.push({ text: c.fmt(q, b), options: { align: 'center' } }, { text: c.fmtD(q, d(a, b)), options: { align: 'center', color: c.dcls(q, d(a, b)) === 'up' ? '2E7D32' : c.dcls(q, d(a, b)) === 'down' ? 'C62828' : GREY, bold: true } });
      row.push(semCell(q, ra));
      if (p) row.push({ text: c.fmt(q, rb), options: { align: 'center' } }, { text: c.fmtD(q, d(ra, rb)), options: { align: 'center', color: c.dcls(q, d(ra, rb)) === 'up' ? '2E7D32' : c.dcls(q, d(ra, rb)) === 'down' ? 'C62828' : GREY, bold: true } });
      rows.push(row);
    });
    var rh = Math.min(0.24, 5.5 / rows.length);
    slide('Resultats ' + c.studyName(s) + ' ' + y + (p ? ' i comparativa amb ' + p : ''), 'Catalunya')
      .addTable(rows, Object.assign({}, tblOpts, { colW: p ? [5.1, 1.2, 1.2, 1.0, 1.2, 1.2, 1.2] : [8.3, 2, 2], rowH: rh, fontSize: rh < 0.2 ? 7 : 8 }));

    // 7. Els millors i pitjors resultats (RSBMN)
    var qv = m.qs.map(function (q) { var v = rsb(y, q); return { q: q, v: v, n: c.norm(q, v) }; }).filter(function (x) { return x.v != null; });
    var best = qv.slice().sort(function (a, b) { return b.n - a.n; }).slice(0, 5), worst = qv.slice().sort(function (a, b) { return a.n - b.n; }).slice(0, 5);
    var bw = slide('Els millors i els pitjors resultats', 'RSBMN');
    [[best, 'Top 5 millors preguntes', 0.5, '2E7D32'], [worst, 'Top 5 pitjors preguntes', 6.75, 'C62828']].forEach(function (g) {
      bw.addText(g[1], { x: g[2], y: 1.2, w: 6, h: 0.4, fontSize: 14, bold: true, color: g[3], fontFace: FONT });
      bw.addTable([[th('Pregunta', { align: 'left' }), th('RSBMN ' + y), th('Catalunya')]].concat(g[0].map(function (x) { return [qCell(x.q), semCell(x.q, x.v, p ? d(x.v, rsb(p, x.q)) : undefined), { text: c.fmt(x.q, c.val(s, y, 'CAT', x.q)), options: { align: 'center' } }]; })),
        Object.assign({}, tblOpts, { x: g[2], y: 1.7, w: 6, colW: [3.8, 1.2, 1.0], rowH: 0.42, fontSize: 9 }));
    });
    var cells = [];
    m.active.forEach(function (k) { m.qs.forEach(function (q) { var v = c.val(s, y, k, q); if (v != null) cells.push({ k: k, q: q, v: v, n: c.norm(q, v) }); }); });
    var cb = cells.slice().sort(function (a, b) { return b.n - a.n; }).slice(0, 5), cw = cells.slice().sort(function (a, b) { return a.n - b.n; }).slice(0, 5);
    bw.addText([{ text: 'Millors resultats centre·pregunta: ', options: { bold: true, color: '2E7D32' } }, { text: cb.map(function (x) { return c.cname(x.k) + ' ' + x.q + ' (' + c.fmt(x.q, x.v) + ')'; }).join(' · '), options: { breakLine: true } },
      { text: 'Pitjors resultats centre·pregunta: ', options: { bold: true, color: 'C62828' } }, { text: cw.map(function (x) { return c.cname(x.k) + ' ' + x.q + ' (' + c.fmt(x.q, x.v) + ')'; }).join(' · ') }],
      { x: 0.5, y: 4.9, w: 12.3, h: 1.6, fontSize: 10, color: DARK, fontFace: FONT, valign: 'top' });

    // 8-9. Resultats RSBMN: semàfor de satisfacció i fidelitat
    section(2, 'Resultats Regió Sanitària Metropolitana Nord');
    var sfRows = [[th('Centre', { align: 'left' }), th('Sector'), th('P101 ' + y)].concat(p ? [th('P101 ' + p)] : []).concat([th('P102 ' + y)]).concat(p ? [th('P102 ' + p)] : [])];
    sfRows.push([{ text: 'Catalunya', options: { bold: true } }, { text: '' }, semCell('P101', c.val(s, y, 'CAT', 'P101'), p ? d(c.val(s, y, 'CAT', 'P101'), c.val(s, p, 'CAT', 'P101')) : undefined)].concat(p ? [{ text: c.fmt('P101', c.val(s, p, 'CAT', 'P101')), options: { align: 'center' } }] : [])
      .concat([semCell('P102', c.val(s, y, 'CAT', 'P102'), p ? d(c.val(s, y, 'CAT', 'P102'), c.val(s, p, 'CAT', 'P102')) : undefined)]).concat(p ? [{ text: c.fmt('P102', c.val(s, p, 'CAT', 'P102')), options: { align: 'center' } }] : []));
    m.active.forEach(function (k) {
      var a1 = c.val(s, y, k, 'P101'), b1 = p ? c.val(s, p, k, 'P101') : null, a2 = c.val(s, y, k, 'P102'), b2 = p ? c.val(s, p, k, 'P102') : null;
      sfRows.push([{ text: c.cname(k), options: { align: 'left' } }, { text: c.S.centres[k].sector, options: { fontSize: 7, color: GREY } }, semCell('P101', a1, p ? d(a1, b1) : undefined)].concat(p ? [{ text: c.fmt('P101', b1), options: { align: 'center' } }] : [])
        .concat([semCell('P102', a2, p ? d(a2, b2) : undefined)]).concat(p ? [{ text: c.fmt('P102', b2), options: { align: 'center' } }] : []));
    });
    chunk(sfRows.slice(1), 16).forEach(function (part, i, all) {
      slide('RSBMN · Semàfor ' + y + (p ? ' vs ' + p : '') + (all.length > 1 ? ' (' + (i + 1) + '/' + all.length + ')' : ''), 'Satisfacció i Fidelitat')
        .addTable([sfRows[0]].concat(part), Object.assign({}, tblOpts, { colW: p ? [3.3, 3.0, 1.5, 1.5, 1.5, 1.5] : [4.3, 4.0, 2, 2], rowH: 0.33 }));
    });

    // 10-13. Resultats i semàfors per sector
    m.sectors.forEach(function (sc) {
      var ks = m.active.filter(function (k) { return c.S.centres[k].sector === sc; });
      var ex = c.extremes(s, y, ks, m.qs), bestSet = {}, worstSet = {};
      ex.best.forEach(function (x) { bestSet[x.k + '|' + x.q] = 1; });
      ex.worst.forEach(function (x) { worstSet[x.k + '|' + x.q] = 1; });
      var qParts = chunk(m.qs, 13), cParts = chunk(ks, 6), nPart = qParts.length * cParts.length, iPart = 0;
      cParts.forEach(function (part) { qParts.forEach(function (qsPart) {
        var i = iPart++, all = { length: nPart };
        var head = [th('Pregunta', { align: 'left' }), th('Catalunya'), th('Mitjana sector')].concat(part.map(function (k) { return th(c.cname(k)); }));
        var body = qsPart.map(function (q) {
          var ca = c.val(s, y, 'CAT', q), sa = c.agg(s, y, sc, q).v, sb = p ? c.agg(s, p, sc, q).v : null;
          return [qCell(q, c.isCpr(s, q)), { text: c.fmt(q, ca), options: { align: 'center', color: GREY } }, semCell(q, sa, p ? d(sa, sb) : undefined)].concat(part.map(function (k) {
            var a = c.val(s, y, k, q), b = p ? c.val(s, p, k, q) : null, id = k + '|' + q;
            var border = worstSet[id] ? { type: 'solid', pt: 2.5, color: 'C62828' } : bestSet[id] ? { type: 'solid', pt: 2.5, color: '2E7D32' } : null;
            return semCell(q, a, p ? d(a, b) : undefined, border ? { border: [border, border, border, border] } : null);
          }));
        });
        var qW = 12.3 - 1.0 - 1.1 - part.length * 1.25;
        slide('Resultats i semàfors ' + sc + (all.length > 1 ? ' (' + (i + 1) + '/' + all.length + ')' : ''), y + (p ? ' vs ' + p : ''))
          .addTable([head].concat(body), Object.assign({}, tblOpts, { colW: [qW, 1.0, 1.1].concat(part.map(function () { return 1.25; })), rowH: 0.38, fontSize: 8 }));
      }); });
    });

    // 14. Conclusions
    var zone = function (q) {
      var o = { r: 0, a: 0, g: 0, below: 0, names: { r: [], a: [], g: [] } }, cat = c.val(s, y, 'CAT', q);
      m.active.forEach(function (k) { var v = c.val(s, y, k, q); if (v == null) return; var z = c.sem(q, v); o[z]++; o.names[z].push(c.cname(k)); if (cat != null && v < cat) o.below++; });
      return o;
    };
    var z1 = zone('P101'), z2 = zone('P102');
    var up = 0, down = 0;
    if (p) m.active.forEach(function (k) { m.qs.forEach(function (q) { var dd = d(c.val(s, y, k, q), c.val(s, p, k, q)); var cl = c.dcls(q, dd); if (cl === 'up') up++; if (cl === 'down') down++; }); });
    var redQs = qv.filter(function (x) { return c.sem(x.q, x.v) === 'r'; });
    var bul = [
      'Satisfacció (P101): ' + z1.r + ' centres en àrea de millora, ' + z1.a + ' en àrea estàndard i ' + z1.g + ' en àrea d\'excel·lència; ' + z1.below + ' per sota del valor de Catalunya (' + c.fmt('P101', c.val(s, y, 'CAT', 'P101')) + ').' + (z1.g ? ' Excel·lència: ' + z1.names.g.join(', ') + '.' : ''),
      'Fidelitat (P102): ' + z2.r + ' centres en àrea de millora, ' + z2.a + ' en àrea estàndard i ' + z2.g + ' en àrea d\'excel·lència; ' + z2.below + ' per sota de Catalunya (' + c.fmt('P102', c.val(s, y, 'CAT', 'P102')) + ').',
      best.length ? 'Millor resultat de la regió: ' + c.qlabel(s, best[0].q) + ' (' + c.fmt(best[0].q, best[0].v) + '). Pitjor: ' + c.qlabel(s, worst[0].q) + ' (' + c.fmt(worst[0].q, worst[0].v) + ').' : '',
      redQs.length ? 'Preguntes amb el valor regional en àrea de millora (< ' + t.red * 100 + '%): ' + redQs.map(function (x) { return x.q; }).join(', ') + '.' : 'Cap pregunta té el valor regional en àrea de millora.',
      p ? 'Evolució ' + p + '→' + y + ': ' + up + ' resultats centre·pregunta milloren més de ' + t.diff * 100 + ' pp i ' + down + ' empitjoren més de ' + t.diff * 100 + ' pp.' : ''
    ].filter(Boolean);
    slide('Conclusions Resultats', 'RSBMN').addText(bul.map(function (b) { return { text: b, options: { bullet: true, breakLine: true } }; }),
      { x: 0.6, y: 1.4, w: 12, h: 5.4, fontSize: 14, color: DARK, fontFace: FONT, valign: 'top', paraSpaceAfter: 10 });

    // 15-21. CPR
    var cpr = c.cfg(s).cpr.filter(function (q) { return m.qs.indexOf(q) >= 0; });
    var nSec = 3;
    if (cpr.length) {
      section(nSec++, 'CPR ' + y);
      var def = slide('CPR ' + y, 'Definició');
      def.addText([{ text: 'Millora de la satisfacció i l\'experiència del pacient segons els resultats PLAENSA.', options: { breakLine: true, bold: true } },
        { text: 'Fórmula: el resultat és percentual i té en compte les ' + cpr.length + ' preguntes rellevants. Es considera assolida cada pregunta amb millora o no empitjorament respecte al mateix centre (' + (p || 'edició anterior') + '). Si la diferència és negativa però no significativa (interval de confiança) també es considera assolida.', options: { breakLine: true } }],
        { x: 0.6, y: 1.3, w: 12, h: 1.6, fontSize: 13, color: DARK, fontFace: FONT, valign: 'top' });
      def.addTable([[th('Pregunta CPR', { align: 'left' }), th('Catalunya ' + y), th('RSBMN ' + y)]].concat(cpr.map(function (q) { return [qCell(q, true), semCell(q, c.val(s, y, 'CAT', q)), semCell(q, rsb(y, q), p ? d(rsb(y, q), rsb(p, q)) : undefined)]; })),
        Object.assign({}, tblOpts, { y: 3.1, colW: [8.3, 2, 2], rowH: 0.45, fontSize: 10 }));
      if (p) m.sectors.forEach(function (sc) {
        var ks = m.active.filter(function (k) { return c.S.centres[k].sector === sc; });
        var head = [th('Centre', { align: 'left' })].concat(cpr.map(function (q) { return th(q); })).concat([th('Assoliment')]);
        chunk(ks, 9).forEach(function (ksPart, ci, call) {
        var body = ksPart.map(function (k) {
          var ok = 0, tot = 0;
          var cellsR = cpr.map(function (q) {
            var r = c.cprStatus(s, k, q);
            if (r.st !== 'nd') { tot++; if (r.st === 'ok') ok++; }
            var mark = r.st === 'ok' ? ' ✓' : r.st === 'ko' ? ' ✗' : r.st === 'ko?' ? ' ✗?' : '';
            var cell = semCell(q, r.a, r.d);
            cell.text[0].text += mark;
            return cell;
          });
          return [{ text: c.cname(k), options: { align: 'left', bold: true } }].concat(cellsR).concat([{ text: tot ? Math.round(ok / tot * 100) + '% (' + ok + '/' + tot + ')' : '–', options: { align: 'center', bold: true } }]);
        });
        var w = (12.3 - 3.2 - 1.6) / cpr.length;
        var sl = slide('CPR ' + y + ' · ' + sc + (call.length > 1 ? ' (' + (ci + 1) + '/' + call.length + ')' : ''), 'Dades provisionals');
        sl.addTable([head].concat(body), Object.assign({}, tblOpts, { colW: [3.2].concat(cpr.map(function () { return w; })).concat([1.6]), rowH: 0.52, fontSize: 9 }));
        sl.addText('✓ millora o no empitjorament · ✗ empitjorament · ✗? empitjorament sense interval de confiança (pendent de validar)', { x: 0.5, y: 6.6, w: 12, h: 0.3, fontSize: 9, italic: true, color: GREY, fontFace: FONT });
        });
      });
    }

    // 22-25. Accions de millora
    section(nSec, 'Accions de Millora');
    var acts = c.S.actions.filter(function (a) { return a.study === s; });
    var groups = [
      ['Indicadors CPR', acts.filter(function (a) { return c.isCpr(s, a.q); })],
      ['Indicadors Transversals', acts.filter(function (a) { return !c.isCpr(s, a.q) && c.isTrans(s, a.q); })],
      ['Altres indicadors', acts.filter(function (a) { return !c.isCpr(s, a.q) && !c.isTrans(s, a.q); })]
    ];
    var any = false;
    groups.forEach(function (g) {
      if (!g[1].length) return;
      any = true;
      chunk(g[1], 9).forEach(function (part, i, all) {
        slide(g[0] + (all.length > 1 ? ' (' + (i + 1) + '/' + all.length + ')' : ''), 'Accions de millora ' + y)
          .addTable([[th('Centre', { align: 'left' }), th('Pregunta', { align: 'left' }), th('Resultat ' + y), th('Acció', { align: 'left' }), th('Responsable'), th('Data'), th('Estat')]].concat(part.map(function (a) {
            var v = c.val(s, y, a.centre, a.q);
            var stc = a.estat === 'Feta' ? FILL.g : a.estat === 'En curs' ? FILL.a : FILL.r;
            return [{ text: c.cname(a.centre), options: { align: 'left' } }, { text: c.qlabel(s, a.q), options: { align: 'left', fontSize: 7 } }, semCell(a.q, v), { text: a.accio, options: { align: 'left' } }, { text: a.responsable || '' }, { text: a.data || '' }, { text: a.estat, options: { fill: { color: stc }, align: 'center' } }];
          })), Object.assign({}, tblOpts, { colW: [1.9, 2.8, 1.0, 3.9, 1.3, 0.8, 0.6], fontSize: 8, rowH: 0.5 }));
      });
    });
    if (!any) {
      slide('Accions de Millora ' + y, 'Pendent').addText('Encara no hi ha accions de millora registrades per a aquest estudi al quadre de comandament (pestanya «CPR i Accions de millora»).', { x: 0.6, y: 2.5, w: 12, h: 1.2, fontSize: 16, color: GREY, fontFace: FONT });
    }

    // Tancament
    var end = pptx.addSlide({ masterName: 'SECT' });
    end.addText([{ text: 'www.catsalut.gencat.cat', options: { breakLine: true, bold: true, fontSize: 26 } }, { text: 'Departament de Salut · Servei Català de la Salut', options: { fontSize: 16, color: GREY } }], { x: 4.8, y: 2.8, w: 8, h: 1.8, color: DARK, fontFace: FONT });

    var name = 'PLAENSA_' + y + '_' + s + '_RSBMN.pptx';
    return pptx.writeFile({ fileName: name }).then(function () { return name; });
  }

  var api = { build: build };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PLPPT = api;
})(this);
