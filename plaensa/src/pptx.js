/* PLAENSA · presentació tipus (estructura del model "PLAENSA RSBMN Urgències") amb PptxGenJS.
   Paleta alineada amb el quadre (vermell teula suau, gris pissarra, semàfor suau);
   taules i gràfics natius i editables; textos de conclusions generats a partir de les dades. */
(function (root) {
  'use strict';
  var ACCENT = 'B5474B', ACCENT_SOFT = 'F8ECEC', INK = '3B4350', MUTED = '7B8391', LINE = 'E4E7EC';
  var SURF2 = 'F1F3F6', BG = 'F6F7F9', PANEL = 'EEF1F5', WHITE = 'FFFFFF', PREV = 'C9CED6';
  var FILL = { r: 'F6DAD8', a: 'FBE8C8', g: 'D9EDDF', n: WHITE };
  var TONE = { r: 'D16A66', a: 'E2A54F', g: '5F9E74', n: 'A8AEB8' };
  var UP = '4E8A62', DOWN = 'C2554F';
  var FONT = 'Arial';
  var MONTHS = ['de gener', 'de febrer', 'de març', 'd\'abril', 'de maig', 'de juny', 'de juliol', 'd\'agost', 'de setembre', 'd\'octubre', 'de novembre', 'de desembre'];
  var NONE = { type: 'none' };
  var HAIR = { type: 'solid', pt: 0.75, color: LINE };
  var ROWB = [HAIR, NONE, HAIR, NONE];

  function today() { var d = new Date(); return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' de ' + d.getFullYear(); }
  function chunk(a, n) { var o = []; for (var i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o.length ? o : [[]]; }
  // Reparteix en parts equilibrades (evita una última diapositiva amb una sola fila)
  function balance(a, max) { var parts = Math.max(1, Math.ceil(a.length / max)); return chunk(a, Math.ceil(a.length / parts)); }

  function build(c) {
    var m = c.meta, s = c.s, y = c.UI.year, p = c.UI.prev;
    var LOGO = (typeof window !== 'undefined' && window.PL_LOGO) || null;
    var pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';
    pptx.author = 'Atenció a la Ciutadania · RSBMN';
    pptx.title = 'PLAENSA ' + y + ' · ' + c.studyName(s);
    var footer = 'PLAENSA ' + y + ' · ' + c.studyName(s) + ' · RSBMN';
    var t = c.S.config.thr;

    pptx.defineSlideMaster({
      title: 'CONT', background: { color: WHITE },
      objects: [
        { rect: { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: ACCENT } } },
        { line: { x: 0.5, y: 1.0, w: 12.33, h: 0, line: { color: LINE, width: 1 } } },
        { line: { x: 0.5, y: 6.95, w: 12.33, h: 0, line: { color: LINE, width: 0.75 } } },
        { text: { text: footer, options: { x: 0.5, y: 7.0, w: 8.5, h: 0.32, fontSize: 9, color: MUTED, fontFace: FONT } } },
        LOGO ? { image: { x: 10.53, y: 7.03, w: 2.3, h: 0.31, data: LOGO } } : { text: { text: 'Servei Català de la Salut', options: { x: 9.8, y: 7.0, w: 3.0, h: 0.32, fontSize: 9, color: MUTED, fontFace: FONT, align: 'right' } } }
      ],
      slideNumber: { x: 9.6, y: 7.0, w: 0.6, h: 0.32, fontSize: 9, color: MUTED, fontFace: FONT }
    });
    pptx.defineSlideMaster({ title: 'SECT', background: { color: BG }, objects: [{ rect: { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: ACCENT } } }] });

    function slide(title, tag) {
      var sl = pptx.addSlide({ masterName: 'CONT' });
      sl.addText(title, { x: 0.5, y: 0.28, w: 9.6, h: 0.6, fontSize: 24, bold: true, color: INK, fontFace: FONT, valign: 'middle', fit: 'shrink' });
      if (tag) sl.addText(tag, { x: 10.2, y: 0.38, w: 2.63, h: 0.4, fontSize: 11, bold: true, color: ACCENT, fontFace: FONT, align: 'center', valign: 'middle', fill: { color: ACCENT_SOFT }, rectRadius: 0.08, shape: pptx.shapes.ROUNDED_RECTANGLE, fit: 'shrink' });
      return sl;
    }
    function section(n, title, sub) {
      var sl = pptx.addSlide({ masterName: 'SECT' });
      sl.addText(String(n).padStart(2, '0'), { x: 0.9, y: 2.2, w: 3, h: 1.6, fontSize: 88, bold: true, color: ACCENT, fontFace: FONT });
      sl.addShape(pptx.shapes.LINE, { x: 0.95, y: 3.95, w: 1.2, h: 0, line: { color: ACCENT, width: 3 } });
      sl.addText(title, { x: 0.9, y: 4.15, w: 11, h: 0.9, fontSize: 34, bold: true, color: INK, fontFace: FONT });
      if (sub) sl.addText(sub, { x: 0.9, y: 5.0, w: 11, h: 0.5, fontSize: 16, color: MUTED, fontFace: FONT });
      if (LOGO) sl.addImage({ data: LOGO, x: 10.43, y: 6.85, w: 2.4, h: 0.32 });
    }
    function th(txt, o) { return { text: txt, options: Object.assign({ bold: true, fill: { color: PANEL }, color: INK, fontSize: 9, align: 'center', valign: 'middle', border: [NONE, NONE, { type: 'solid', pt: 1.5, color: ACCENT }, NONE] }, o || {}) }; }
    function plain(txt, o) { return { text: txt == null ? '' : String(txt), options: Object.assign({ color: INK, align: 'center', valign: 'middle', border: ROWB }, o || {}) }; }
    function dCol(q, dd) { var x = c.dcls(q, dd); return x === 'up' ? UP : x === 'down' ? DOWN : MUTED; }
    function semCell(q, v, dd, extra) {
      var cl = c.sem(q, v);
      var runs = [{ text: c.fmt(q, v), options: { bold: true, color: INK } }];
      if (dd !== undefined) runs.push({ text: '\n' + c.fmtD(q, dd), options: { fontSize: 7.5, color: dCol(q, dd), bold: c.dcls(q, dd) !== '' } });
      return { text: runs, options: Object.assign({ fill: { color: FILL[cl] }, align: 'center', valign: 'middle', border: [HAIR, { type: 'solid', pt: 2, color: WHITE }, HAIR, { type: 'solid', pt: 2, color: WHITE }] }, extra || {}) };
    }
    function qCell(q, bold) { return plain(c.qlabel(s, q), { align: 'left', bold: !!bold }); }
    var tblBase = { x: 0.5, y: 1.25, w: 12.33, fontFace: FONT, fontSize: 10, color: INK, autoPage: false, margin: [0.04, 0.08, 0.04, 0.08] };
    function fitRows(n, max, avail) { return Math.min(max, (avail || 5.45) / n); }
    function d(a, b) { return a != null && b != null ? a - b : null; }
    function rsb(yy, q) { return yy ? c.agg(s, yy, 'RSBMN', q).v : null; }
    function note(sl, txt) { sl.addText(txt, { x: 0.5, y: 6.55, w: 12.33, h: 0.32, fontSize: 9, italic: true, color: MUTED, fontFace: FONT }); }
    function legend(sl) {
      var items = [['r', 'Àrea de millora < ' + t.red * 100 + '%'], ['a', 'Àrea estàndard'], ['g', 'Excel·lència ≥ ' + t.green * 100 + '%']];
      items.forEach(function (it, i) {
        sl.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.5 + i * 2.5, y: 6.62, w: 0.22, h: 0.18, fill: { color: FILL[it[0]] }, line: { color: TONE[it[0]], width: 0.75 }, rectRadius: 0.03 });
        sl.addText(it[1], { x: 0.78 + i * 2.5, y: 6.56, w: 2.2, h: 0.3, fontSize: 9, color: MUTED, fontFace: FONT });
      });
    }

    var p101 = rsb(y, 'P101'), p102 = rsb(y, 'P102');

    // 1. Portada
    var cover = pptx.addSlide();
    cover.background = { color: WHITE };
    cover.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 13.33, h: 0.12, fill: { color: ACCENT }, line: { color: ACCENT } });
    if (LOGO) cover.addImage({ data: LOGO, x: 0.8, y: 0.75, w: 3.8, h: 0.51 });
    cover.addText([{ text: 'PLAENSA ' + y, options: { fontSize: 22, bold: true, color: ACCENT, breakLine: true } }, { text: c.studyName(s), options: { fontSize: 36, bold: true, color: INK } }], { x: 0.8, y: 2.3, w: 7.4, h: 2.2, fontFace: FONT, valign: 'top' });
    cover.addText([{ text: 'Experiència del pacient · Regió Sanitària Metropolitana Nord', options: { breakLine: true } }, { text: 'Atenció a la Ciutadania · Servei Català de la Salut' }], { x: 0.8, y: 4.7, w: 7.4, h: 0.8, fontSize: 14, color: MUTED, fontFace: FONT });
    cover.addText(today() + (p ? ' · comparativa amb ' + p : ''), { x: 0.8, y: 5.9, w: 7, h: 0.4, fontSize: 12, color: MUTED, fontFace: FONT });
    cover.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 8.8, y: 1.6, w: 3.8, h: 4.6, fill: { color: PANEL }, line: { color: PANEL }, rectRadius: 0.12 });
    [['Satisfacció global', 'P101', p101, 1.95], ['Fidelitat', 'P102', p102, 4.0]].forEach(function (k) {
      var cl = c.sem(k[1], k[2]);
      cover.addText(k[0].toUpperCase() + ' · RSBMN', { x: 9.1, y: k[3], w: 3.3, h: 0.3, fontSize: 10, bold: true, color: MUTED, fontFace: FONT });
      cover.addText(c.fmt(k[1], k[2]), { x: 9.1, y: k[3] + 0.3, w: 3.3, h: 0.9, fontSize: 44, bold: true, color: INK, fontFace: FONT });
      cover.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 9.1, y: k[3] + 1.25, w: 0.22, h: 0.22, fill: { color: TONE[cl] }, line: { color: TONE[cl] }, rectRadius: 0.11 });
      var pv = rsb(p, k[1]);
      cover.addText(({ r: 'Àrea de millora', a: 'Àrea estàndard', g: 'Àrea d\'excel·lència', n: '' })[cl] + (pv != null ? ' · ' + c.fmtD(k[1], k[2] - pv) + ' vs ' + p : ''), { x: 9.4, y: k[3] + 1.17, w: 3.1, h: 0.38, fontSize: 11, color: INK, fontFace: FONT });
    });

    // Missatges clau
    var hls = (c.headlines || []).slice(0, 4);
    if (hls.length) {
      var mk = slide('Missatges clau', 'RSBMN ' + y);
      mk.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 1.25, w: 12.33, h: 5.2, fill: { color: PANEL }, line: { color: PANEL }, rectRadius: 0.1 });
      var cw = (11.93 - 0.25 * (hls.length - 1)) / hls.length;
      hls.forEach(function (h, i) {
        var x = 0.7 + i * (cw + 0.25), tone = TONE[h.tone] || TONE.n;
        mk.addShape(pptx.shapes.RECTANGLE, { x: x, y: 1.45, w: cw, h: 4.8, fill: { color: WHITE }, line: { color: LINE, width: 0.75 } });
        mk.addShape(pptx.shapes.RECTANGLE, { x: x, y: 1.45, w: cw, h: 0.1, fill: { color: tone }, line: { color: tone } });
        mk.addText(h.kicker.toUpperCase(), { x: x + 0.2, y: 1.7, w: cw - 0.4, h: 0.45, fontSize: 10, color: MUTED, bold: true, fontFace: FONT, valign: 'top', fit: 'shrink' });
        mk.addText(h.big, { x: x + 0.2, y: 2.15, w: cw - 0.4, h: 0.95, fit: 'shrink', fontSize: h.big.length > 7 ? 28 : 38, bold: true, color: INK, fontFace: FONT });
        mk.addText(h.text, { x: x + 0.2, y: 3.15, w: cw - 0.4, h: 1.7, fontSize: 15, bold: true, color: INK, fontFace: FONT, valign: 'top', fit: 'shrink' });
        if (h.sub) mk.addText(h.sub, { x: x + 0.2, y: 4.95, w: cw - 0.4, h: 1.15, fontSize: 11, color: MUTED, fontFace: FONT, valign: 'bottom', fit: 'shrink' });
      });
    }

    // Introducció i fitxa tècnica
    section(1, 'Introducció', 'Fitxa tècnica i resultats de Catalunya');
    var hasN = Object.keys(c.S.records).some(function (k) { return k.indexOf(s + '|' + y + '|') === 0 && (c.S.records[k].n || c.S.records[k].lo != null); });
    var ftRows = [
      ['Estudi', 'PLAENSA ' + c.studyName(s)],
      ['Edicions comparades', y + (p ? ' i ' + p : '')],
      ['Àmbit', m.active.length + ' centres de la Regió Sanitària Metropolitana Nord en ' + m.sectors.length + ' sectors' + (m.centres.length > m.active.length ? ' (' + (m.centres.length - m.active.length) + ' fora de sector o exclosos)' : '')],
      ['Preguntes', m.qs.length + ' · P101 (satisfacció global) en escala 0–10; la resta, % de respostes favorables'],
      ['Semàfor', 'Vermell < ' + t.red * 100 + '% · taronja ' + t.red * 100 + '–' + (t.green * 100 - 0.1).toFixed(1).replace('.', ',') + '% · verd ≥ ' + t.green * 100 + '%  (P101: < ' + String(t.red101).replace('.', ',') + ' / ≥ ' + t.green101 + ')'],
      ['Diferències rellevants', '±' + t.diff * 100 + ' punts percentuals (P101 ±' + String(t.diff101).replace('.', ',') + ' punts)'],
      ['Agregats', 'RSBMN i sectors: mitjana dels centres, o valor oficial de la regió quan el fitxer l\'inclou'],
      ['Font', 'CatSalut · Pla d\'enquestes de satisfacció (PLAENSA)']
    ];
    var ft = slide('Fitxa tècnica', c.studyName(s));
    ft.addTable(ftRows.map(function (r) { return [plain(r[0], { align: 'left', bold: true, fill: { color: SURF2 }, color: MUTED }), plain(r[1], { align: 'left' })]; }),
      Object.assign({}, tblBase, { colW: [3.0, 9.33], rowH: 0.56, fontSize: 13 }));
    if (!hasN) note(ft, 'Els fitxers no inclouen mida mostral ni intervals de confiança: les diferències indiquen rellevància, no significació estadística.');

    // Satisfacció i fidelitat · Catalunya vs RSBMN
    var sf = slide('Satisfacció i Fidelitat ' + y, 'Catalunya i RSBMN');
    ['P101', 'P102'].forEach(function (q, i) {
      var labels = ['Catalunya', 'RSBMN'];
      var conv = function (v) { return v == null ? 0 : (q === 'P101' ? v : v * 100); };
      var series = [{ name: String(y), labels: labels, values: [c.val(s, y, 'CAT', q), rsb(y, q)].map(conv) }];
      if (p) series.push({ name: String(p), labels: labels, values: [c.val(s, p, 'CAT', q), rsb(p, q)].map(conv) });
      var x = 0.5 + i * 6.3;
      sf.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: x, y: 1.25, w: 6.03, h: 5.2, fill: { color: BG }, line: { color: LINE, width: 0.75 }, rectRadius: 0.08 });
      sf.addText(q === 'P101' ? 'Satisfacció global (P101, 0–10)' : 'Fidelitat (P102, %)', { x: x + 0.2, y: 1.35, w: 5.6, h: 0.45, fontSize: 14, bold: true, color: INK, fontFace: FONT });
      sf.addChart(pptx.charts.BAR, series, {
        x: x + 0.15, y: 1.85, w: 5.73, h: 4.5, barDir: 'col', barGrouping: 'clustered', barGapWidthPct: 60, chartColors: [ACCENT, PREV],
        showValue: true, dataLabelFormatCode: q === 'P101' ? '0.00' : '0.0', dataLabelFontSize: 11, dataLabelColor: INK, valAxisMinVal: q === 'P101' ? 5 : 50, valAxisMaxVal: q === 'P101' ? 10 : 100,
        showLegend: true, legendPos: 'b', legendFontSize: 11, legendColor: MUTED, catAxisLabelFontSize: 12, catAxisLabelColor: INK, valAxisLabelFontSize: 10, valAxisLabelColor: MUTED,
        valGridLine: { color: 'E4E7EC', size: 0.5 }, catAxisLineShow: false, valAxisLineShow: false
      });
    });

    // Radar
    var rq = m.qs.filter(function (q) { return c.val(s, y, 'CAT', q) != null || rsb(y, q) != null; });
    var rad = slide('Perfil de resultats ' + y, 'Catalunya i RSBMN');
    rad.addChart(pptx.charts.RADAR, [
      { name: 'Catalunya ' + y, labels: rq, values: rq.map(function (q) { var v = c.val(s, y, 'CAT', q); return v == null ? 0 : Math.round(c.norm(q, v) * 1000) / 10; }) },
      { name: 'RSBMN ' + y, labels: rq, values: rq.map(function (q) { var v = rsb(y, q); return v == null ? 0 : Math.round(c.norm(q, v) * 1000) / 10; }) }
    ], { x: 1.8, y: 1.15, w: 9.7, h: 5.35, radarStyle: 'marker', chartColors: ['9AA1AC', ACCENT], showLegend: true, legendPos: 'b', legendFontSize: 11, legendColor: MUTED, catAxisLabelFontSize: 10, catAxisLabelColor: INK, valAxisMinVal: 0, valAxisMaxVal: 100, valAxisLabelFontSize: 8, valAxisLabelColor: MUTED, lineSize: 2 });
    note(rad, 'P101 normalitzada a escala 0–100 (valor × 10).');

    // Resultats any vs anterior (Catalunya i RSBMN)
    var head6 = [th('Pregunta', { align: 'left' }), th('Catalunya ' + y)].concat(p ? [th('Catalunya ' + p), th('Dif.')] : []).concat([th('RSBMN ' + y)]).concat(p ? [th('RSBMN ' + p), th('Dif.')] : []);
    var rows6 = m.qs.map(function (q) {
      var a = c.val(s, y, 'CAT', q), b = p ? c.val(s, p, 'CAT', q) : null, ra = rsb(y, q), rb = rsb(p, q);
      var row = [qCell(q), semCell(q, a)];
      if (p) row.push(plain(c.fmt(q, b), { color: MUTED }), plain(c.fmtD(q, d(a, b)), { color: dCol(q, d(a, b)), bold: true }));
      row.push(semCell(q, ra));
      if (p) row.push(plain(c.fmt(q, rb), { color: MUTED }), plain(c.fmtD(q, d(ra, rb)), { color: dCol(q, d(ra, rb)), bold: true }));
      return row;
    });
    balance(rows6, 13).forEach(function (part, i, all) {
      var sl = slide('Resultats ' + y + (p ? ' i comparativa amb ' + p : '') + (all.length > 1 ? ' (' + (i + 1) + '/' + all.length + ')' : ''), 'Catalunya i RSBMN');
      sl.addTable([head6].concat(part), Object.assign({}, tblBase, { colW: p ? [5.13, 1.2, 1.2, 1.0, 1.2, 1.2, 1.4] : [8.33, 2, 2], rowH: fitRows(part.length + 1, 0.5, 5.25), fontSize: 10 }));
      legend(sl);
    });

    // Els millors i pitjors resultats (RSBMN)
    var qv = m.qs.map(function (q) { var v = rsb(y, q); return { q: q, v: v, n: c.norm(q, v) }; }).filter(function (x) { return x.v != null; });
    var best = qv.slice().sort(function (a, b) { return b.n - a.n; }).slice(0, 5), worst = qv.slice().sort(function (a, b) { return a.n - b.n; }).slice(0, 5);
    var bw = slide('Els millors i els pitjors resultats', 'RSBMN ' + y);
    [[best, 'Top 5 millors preguntes', 0.5, UP], [worst, 'Top 5 pitjors preguntes', 6.8, DOWN]].forEach(function (g) {
      bw.addText(g[1], { x: g[2], y: 1.15, w: 6, h: 0.45, fontSize: 15, bold: true, color: g[3], fontFace: FONT });
      bw.addTable([[th('Pregunta', { align: 'left' }), th('RSBMN ' + y), th('Catalunya')]].concat(g[0].map(function (x) { return [qCell(x.q), semCell(x.q, x.v, p ? d(x.v, rsb(p, x.q)) : undefined), plain(c.fmt(x.q, c.val(s, y, 'CAT', x.q)), { color: MUTED })]; })),
        Object.assign({}, tblBase, { x: g[2], y: 1.65, w: 6.03, colW: [3.83, 1.2, 1.0], rowH: 0.5, fontSize: 10 }));
    });
    var cells = [];
    m.active.forEach(function (k) { m.qs.forEach(function (q) { var v = c.val(s, y, k, q); if (v != null) cells.push({ k: k, q: q, v: v, n: c.norm(q, v) }); }); });
    var cb = cells.slice().sort(function (a, b) { return b.n - a.n; }).slice(0, 3), cwst = cells.slice().sort(function (a, b) { return a.n - b.n; }).slice(0, 3);
    [[cb, 'Millors resultats centre·pregunta', 0.5, 'g'], [cwst, 'Pitjors resultats centre·pregunta', 6.8, 'r']].forEach(function (g) {
      bw.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: g[2], y: 4.85, w: 6.03, h: 1.6, fill: { color: BG }, line: { color: LINE, width: 0.75 }, rectRadius: 0.08 });
      bw.addText([{ text: g[1], options: { bold: true, color: TONE[g[3]], breakLine: true } }].concat(g[0].map(function (x, i) { return { text: c.cname(x.k) + ' · ' + x.q + ' ' + c.qtext(s, x.q) + ' (' + c.fmt(x.q, x.v) + ')', options: { breakLine: i < g[0].length - 1, bullet: true } }; })),
        { x: g[2] + 0.15, y: 4.95, w: 5.73, h: 1.4, fontSize: 10, color: INK, fontFace: FONT, valign: 'top', fit: 'shrink' });
    });

    // Resultats RSBMN: semàfor de satisfacció i fidelitat
    section(2, 'Resultats Regió Sanitària Metropolitana Nord', 'Satisfacció, fidelitat i semàfors per sector');
    var sfHead = [th('Centre', { align: 'left' }), th('Sector', { align: 'left' }), th('P101 ' + y)].concat(p ? [th('P101 ' + p)] : []).concat([th('P102 ' + y)]).concat(p ? [th('P102 ' + p)] : []);
    function sfRow(name, sector, k, bold) {
      var g = function (yy, q) { return k === 'CAT' ? c.val(s, yy, 'CAT', q) : c.val(s, yy, k, q); };
      var a1 = g(y, 'P101'), b1 = p ? g(p, 'P101') : null, a2 = g(y, 'P102'), b2 = p ? g(p, 'P102') : null;
      return [plain(name, { align: 'left', bold: !!bold }), plain(sector, { align: 'left', color: MUTED, fontSize: 9 }), semCell('P101', a1, p ? d(a1, b1) : undefined)].concat(p ? [plain(c.fmt('P101', b1), { color: MUTED })] : [])
        .concat([semCell('P102', a2, p ? d(a2, b2) : undefined)]).concat(p ? [plain(c.fmt('P102', b2), { color: MUTED })] : []);
    }
    var sfRows = [sfRow('Catalunya', 'Referència', 'CAT', true)].concat(m.active.map(function (k) { return sfRow(c.cname(k), c.S.centres[k].sector, k); }));
    balance(sfRows, 12).forEach(function (part, i, all) {
      var sl = slide('Satisfacció i fidelitat per centre' + (all.length > 1 ? ' (' + (i + 1) + '/' + all.length + ')' : ''), y + (p ? ' vs ' + p : ''));
      sl.addTable([sfHead].concat(part), Object.assign({}, tblBase, { colW: p ? [3.3, 3.23, 1.45, 1.45, 1.45, 1.45] : [4.3, 4.03, 2, 2], rowH: fitRows(part.length + 1, 0.5, 5.25), fontSize: 10 }));
      legend(sl);
    });

    // Resultats i semàfors per sector
    m.sectors.forEach(function (sc) {
      var ks = m.active.filter(function (k) { return c.S.centres[k].sector === sc; });
      var ex = c.extremes(s, y, ks, m.qs), bestSet = {}, worstSet = {};
      ex.best.forEach(function (x) { bestSet[x.k + '|' + x.q] = 1; });
      ex.worst.forEach(function (x) { worstSet[x.k + '|' + x.q] = 1; });
      var qParts = balance(m.qs, 13), cParts = balance(ks, 6), nPart = qParts.length * cParts.length, iPart = 0;
      cParts.forEach(function (part) { qParts.forEach(function (qsPart) {
        var i = iPart++;
        var head = [th('Pregunta', { align: 'left' }), th('Catalunya'), th('Mitjana sector')].concat(part.map(function (k) { return th(c.cname(k), { fontSize: 8.5 }); }));
        var body = qsPart.map(function (q) {
          var ca = c.val(s, y, 'CAT', q), sa = c.agg(s, y, sc, q).v, sb = p ? c.agg(s, p, sc, q).v : null;
          return [qCell(q, c.isCpr(s, q)), plain(c.fmt(q, ca), { color: MUTED }), semCell(q, sa, p ? d(sa, sb) : undefined)].concat(part.map(function (k) {
            var a = c.val(s, y, k, q), b = p ? c.val(s, p, k, q) : null, id = k + '|' + q;
            var col = worstSet[id] ? DOWN : bestSet[id] ? UP : null;
            var bd = col ? { type: 'solid', pt: 2.25, color: col } : null;
            return semCell(q, a, p ? d(a, b) : undefined, bd ? { border: [bd, bd, bd, bd] } : null);
          }));
        });
        var qW = 12.33 - 1.05 - 1.15 - part.length * 1.2;
        var sl = slide('Semàfor · ' + sc + (nPart > 1 ? ' (' + (i + 1) + '/' + nPart + ')' : ''), y + (p ? ' vs ' + p : ''));
        sl.addTable([head].concat(body), Object.assign({}, tblBase, { colW: [qW, 1.05, 1.15].concat(part.map(function () { return 1.2; })), rowH: fitRows(body.length + 1, 0.46, 5.25), fontSize: 9 }));
        legend(sl);
        sl.addText([{ text: '▢ ', options: { color: DOWN, bold: true } }, { text: 'pitjor del sector   ', options: { color: MUTED } }, { text: '▢ ', options: { color: UP, bold: true } }, { text: 'millor del sector', options: { color: MUTED } }], { x: 8.3, y: 6.56, w: 4.53, h: 0.3, fontSize: 9, fontFace: FONT, align: 'right' });
      }); });
    });

    // Conclusions
    var zone = function (q) {
      var o = { r: 0, a: 0, g: 0, below: 0, names: { r: [], a: [], g: [] } }, cat = c.val(s, y, 'CAT', q);
      m.active.forEach(function (k) { var v = c.val(s, y, k, q); if (v == null) return; var z = c.sem(q, v); o[z]++; o.names[z].push(c.cname(k)); if (cat != null && v < cat) o.below++; });
      return o;
    };
    var z1 = zone('P101'), z2 = zone('P102');
    var up = 0, down = 0;
    if (p) m.active.forEach(function (k) { m.qs.forEach(function (q) { var dd = d(c.val(s, y, k, q), c.val(s, p, k, q)); var cl = c.dcls(q, dd); if (cl === 'up') up++; if (cl === 'down') down++; }); });
    var redQs = qv.filter(function (x) { return c.sem(x.q, x.v) === 'r'; });
    var concl = [
      [z1.r > z1.g ? 'r' : z1.g ? 'g' : 'a', 'Satisfacció global (P101)', z1.r + ' centres en àrea de millora, ' + z1.a + ' en àrea estàndard i ' + z1.g + ' en excel·lència; ' + z1.below + ' per sota de Catalunya (' + c.fmt('P101', c.val(s, y, 'CAT', 'P101')) + ').' + (z1.g ? ' Excel·lència: ' + z1.names.g.join(', ') + '.' : '')],
      [z2.r > z2.g ? 'r' : z2.g ? 'g' : 'a', 'Fidelitat (P102)', z2.r + ' centres en àrea de millora, ' + z2.a + ' en àrea estàndard i ' + z2.g + ' en excel·lència; ' + z2.below + ' per sota de Catalunya (' + c.fmt('P102', c.val(s, y, 'CAT', 'P102')) + ').'],
      best.length ? ['g', 'Fortalesa i punt feble', 'Millor: ' + c.qlabel(s, best[0].q) + ' (' + c.fmt(best[0].q, best[0].v) + '). Pitjor: ' + c.qlabel(s, worst[0].q) + ' (' + c.fmt(worst[0].q, worst[0].v) + ').'] : null,
      [redQs.length ? 'r' : 'g', 'Àrea de millora regional', redQs.length ? 'Preguntes amb el valor de la regió per sota del ' + t.red * 100 + '%: ' + redQs.map(function (x) { return x.q; }).join(', ') + '.' : 'Cap pregunta té el valor regional en àrea de millora.'],
      p ? [up >= down ? 'g' : 'r', 'Evolució ' + p + ' → ' + y, up + ' resultats centre·pregunta milloren més de ' + t.diff * 100 + ' pp i ' + down + ' empitjoren més de ' + t.diff * 100 + ' pp.'] : null
    ].filter(Boolean);
    var cs = slide('Conclusions', 'RSBMN ' + y);
    var hh = Math.min(1.0, (5.3 - 0.12 * (concl.length - 1)) / concl.length);
    concl.forEach(function (cc, i) {
      var yy = 1.25 + i * (hh + 0.12);
      cs.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: yy, w: 12.33, h: hh, fill: { color: BG }, line: { color: LINE, width: 0.75 } });
      cs.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: yy, w: 0.1, h: hh, fill: { color: TONE[cc[0]] }, line: { color: TONE[cc[0]] } });
      cs.addText(cc[1], { x: 0.8, y: yy, w: 3.1, h: hh, fontSize: 13, bold: true, color: INK, fontFace: FONT, valign: 'middle' });
      cs.addText(cc[2], { x: 3.9, y: yy, w: 8.8, h: hh, fontSize: 12, color: INK, fontFace: FONT, valign: 'middle', fit: 'shrink' });
    });

    // CPR
    var cpr = c.cfg(s).cpr.filter(function (q) { return m.qs.indexOf(q) >= 0; });
    var nSec = 3;
    if (cpr.length) {
      section(nSec++, 'CPR ' + y, 'Millora o no empitjorament de les preguntes CPR per centre');
      var def = slide('CPR ' + y, 'Definició');
      def.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 1.25, w: 12.33, h: 1.45, fill: { color: BG }, line: { color: LINE, width: 0.75 }, rectRadius: 0.08 });
      def.addText([{ text: 'Objectiu: ', options: { bold: true, color: ACCENT } }, { text: 'millorar la satisfacció i l\'experiència del pacient segons els resultats PLAENSA.', options: { breakLine: true } },
        { text: 'Fórmula: ', options: { bold: true, color: ACCENT } }, { text: 'resultat percentual sobre les ' + cpr.length + ' preguntes CPR. Cada pregunta s\'assoleix amb millora o no empitjorament respecte al mateix centre (' + (p || 'edició anterior') + '); una diferència negativa no significativa també compta com a assolida.' }],
        { x: 0.75, y: 1.3, w: 11.9, h: 1.35, fontSize: 13, color: INK, fontFace: FONT, valign: 'middle', fit: 'shrink' });
      def.addTable([[th('Pregunta CPR', { align: 'left' }), th('Catalunya ' + y), th('RSBMN ' + y)]].concat(cpr.map(function (q) { return [qCell(q, true), semCell(q, c.val(s, y, 'CAT', q)), semCell(q, rsb(y, q), p ? d(rsb(y, q), rsb(p, q)) : undefined)]; })),
        Object.assign({}, tblBase, { y: 2.95, colW: [8.33, 2, 2], rowH: Math.min(0.62, 3.5 / (cpr.length + 1)), fontSize: 12 }));
      if (p) m.sectors.forEach(function (sc) {
        var ks = m.active.filter(function (k) { return c.S.centres[k].sector === sc; });
        var head = [th('Centre', { align: 'left' })].concat(cpr.map(function (q) { return th(q + ' ' + c.qtext(s, q), { fontSize: 8.5 }); })).concat([th('Assoliment')]);
        balance(ks, 9).forEach(function (ksPart, ci, call) {
          var body = ksPart.map(function (k) {
            var ok = 0, tot = 0;
            var cellsR = cpr.map(function (q) {
              var r = c.cprStatus(s, k, q);
              if (r.st !== 'nd') { tot++; if (r.st === 'ok') ok++; }
              var mark = r.st === 'ok' ? '  ✓' : r.st === 'ko' ? '  ✗' : r.st === 'ko?' ? '  ✗?' : '';
              var cell = semCell(q, r.a, r.d);
              cell.text[0].text += mark;
              return cell;
            });
            var pct = tot ? Math.round(ok / tot * 100) : null, tone = pct === 100 ? 'g' : pct >= 50 ? 'a' : 'r';
            return [plain(c.cname(k), { align: 'left', bold: true })].concat(cellsR).concat([pct == null ? plain('–') : { text: [{ text: pct + '%', options: { bold: true, fontSize: 14, color: INK } }, { text: '\n' + ok + ' de ' + tot, options: { fontSize: 8, color: MUTED } }], options: { align: 'center', valign: 'middle', fill: { color: FILL[tone] }, border: ROWB } }]);
          });
          var w = (12.33 - 3.0 - 1.6) / cpr.length;
          var sl = slide('CPR ' + y + ' · ' + sc + (call.length > 1 ? ' (' + (ci + 1) + '/' + call.length + ')' : ''), 'Dades provisionals');
          sl.addTable([head].concat(body), Object.assign({}, tblBase, { colW: [3.0].concat(cpr.map(function () { return w; })).concat([1.6]), rowH: Math.min(0.72, 5.1 / (body.length + 1)), fontSize: 11 }));
          note(sl, '✓ millora o no empitjorament · ✗ empitjorament · ✗? empitjorament sense interval de confiança (pendent de validar)');
        });
      });
    }

    // Accions de millora
    section(nSec, 'Accions de Millora', 'Registre del quadre de comandament');
    var acts = c.S.actions.filter(function (a) { return a.study === s; });
    var groups = [
      ['Accions · indicadors CPR', acts.filter(function (a) { return c.isCpr(s, a.q); })],
      ['Accions · indicadors transversals', acts.filter(function (a) { return !c.isCpr(s, a.q) && c.isTrans(s, a.q); })],
      ['Accions · altres indicadors', acts.filter(function (a) { return !c.isCpr(s, a.q) && !c.isTrans(s, a.q); })]
    ];
    var any = false;
    groups.forEach(function (g) {
      if (!g[1].length) return;
      any = true;
      balance(g[1], 8).forEach(function (part, i, all) {
        slide(g[0] + (all.length > 1 ? ' (' + (i + 1) + '/' + all.length + ')' : ''), 'Accions ' + y)
          .addTable([[th('Centre', { align: 'left' }), th('Pregunta', { align: 'left' }), th('Resultat ' + y), th('Acció', { align: 'left' }), th('Responsable'), th('Data'), th('Estat')]].concat(part.map(function (a) {
            var v = c.val(s, y, a.centre, a.q);
            var stc = a.estat === 'Feta' ? 'g' : a.estat === 'En curs' ? 'a' : 'r';
            return [plain(c.cname(a.centre), { align: 'left', bold: true }), plain(c.qlabel(s, a.q), { align: 'left', fontSize: 9 }), semCell(a.q, v), plain(a.accio, { align: 'left' }), plain(a.responsable || ''), plain(a.data || '', { fontSize: 9 }), plain(a.estat, { fill: { color: FILL[stc] }, bold: true })];
          })), Object.assign({}, tblBase, { colW: [1.9, 2.6, 1.05, 3.7, 1.4, 0.9, 0.78], fontSize: 10, rowH: fitRows(part.length + 1, 0.62, 5.3) }));
      });
    });
    if (!any) {
      var na = slide('Accions de Millora ' + y, 'Pendent');
      na.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 2.2, y: 2.4, w: 8.9, h: 2.0, fill: { color: BG }, line: { color: LINE, width: 0.75 }, rectRadius: 0.1 });
      na.addText('Encara no hi ha accions de millora registrades per a aquest estudi.\nEs registren al quadre de comandament, a l\'apartat «CPR i Accions».', { x: 2.5, y: 2.5, w: 8.3, h: 1.8, fontSize: 16, color: MUTED, fontFace: FONT, align: 'center', valign: 'middle' });
    }

    // Tancament
    var end = pptx.addSlide({ masterName: 'SECT' });
    if (LOGO) end.addImage({ data: LOGO, x: 0.9, y: 2.2, w: 4.2, h: 0.565 });
    end.addText([{ text: 'www.catsalut.gencat.cat', options: { breakLine: true, bold: true, fontSize: 26, color: INK } }, { text: 'Departament de Salut · Servei Català de la Salut', options: { fontSize: 16, color: MUTED } }], { x: 0.9, y: 3.3, w: 11, h: 1.4, fontFace: FONT });

    var name = 'PLAENSA_' + y + '_' + s + '_RSBMN.pptx';
    return pptx.writeFile({ fileName: name }).then(function () { return name; });
  }

  var api = { build: build };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PLPPT = api;
})(this);
