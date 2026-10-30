/* Genera el quadre en un sol HTML: llibreries, dades AEA i codi incrustats (funciona sense connexió). */
const fs = require('fs'), path = require('path');
const XLSX = require('xlsx');
const P = require('./src/parser.js');
const rd = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const js = s => s.replace(/<\/script/gi, '<\\/script').replace(/\uFFFD/g, '\\uFFFD');

const src = path.join(__dirname, 'dades', 'AEA_2026_2024_DOC_DE_TREBALL.xlsx');
const parsed = P.parseWorkbook(XLSX, XLSX.read(fs.readFileSync(src), { type: 'buffer' }), path.basename(src));
parsed.sheets = parsed.sheets.filter(s => s.ok).map(s => ({ name: s.name, ok: true, records: s.records, centres: s.centres, questions: s.questions }));
const def = { study: parsed.study, parsed };

let shell = rd('src/shell.html');
const parts = {
  CSS: rd('src/app.css'),
  BUILD: new Date().toISOString().slice(0, 10),
  LIB_XLSX: js(rd('node_modules/xlsx/dist/xlsx.full.min.js')),
  LIB_CHART: js(rd('node_modules/chart.js/dist/chart.umd.js')),
  LIB_PPTX: js(rd('node_modules/pptxgenjs/dist/pptxgen.bundle.js')),
  PARSER: js(rd('src/parser.js')),
  PPTXJS: js(rd('src/pptx.js')),
  DEFAULT: js(JSON.stringify(def)),
  APP: js(rd('src/app.js'))
};
for (const [k, v] of Object.entries(parts)) shell = shell.split('/*@@' + k + '@@*/').join(v);

const body = shell;
const full = '<!DOCTYPE html>\n<html lang="ca">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' + body.replace('</style>', '</style>\n</head>\n<body>') + '\n</body>\n</html>\n';
fs.writeFileSync(path.join(__dirname, 'PLAENSA_quadre_comandament.html'), full);
if (process.argv[2]) fs.writeFileSync(process.argv[2], body);
console.log('OK', (full.length / 1024 / 1024).toFixed(2) + ' MB', def.parsed.sheets[0].records.length + ' valors AEA');
