# Quadre de comandament PLAENSA · RSBMN

Fitxer únic: **`PLAENSA_quadre_comandament.html`** (amb el logo /Salut · Generalitat de la plantilla corporativa, a `assets/`). S'obre amb doble clic (Chrome/Edge) i funciona sense connexió: les llibreries (SheetJS, Chart.js, PptxGenJS) i les dades AEA 2026 vs 2024 hi van incrustades.

## Què fa
- **Visió global** (pantalla inicial): titulars entre estudis, una targeta per estudi i RSBMN vs Catalunya.
- **Una pestanya per estudi**: AEA, Urgències, Hospitalització amb internament, TRD, Primària, Embaràs/part/puerperi i Atenció Intermèdia.
- **Sub-pestanyes** (cadascuna amb una franja de «Titulars per al comitè de direcció»): Resum KPI i Top 5 · Satisfacció i Fidelitat · Semàfor per centre · Comparativa i evolució · CPR i Accions de millora.
- **Càrrega d'Excel**: llegeix el format oficial (fila «Pregunta resumida», una columna per centre i any) i la plantilla normalitzada (`Configuració › Dades › Descarregar plantilla`). Mostra una vista prèvia per full, avisos d'anys incoherents i valors que no quadren entre fulls. Si no reconeix un full, permet indicar la fila de capçalera i la columna de preguntes a mà.
- **Semàfor**: vermell < 75 %, taronja 75–89,9 %, verd ≥ 90 % (P101: < 7,5 / 7,5–8,9 / ≥ 9). Diferències rellevants ±5 pp (P101 ±0,5). Tots els llindars es poden modificar.
- **Marcs** de millor/pitjor per centre, sector i regió (P101 normalitzada a 0–1).
- **Presentació** `.pptx` per estudi amb l'estructura del model d'Urgències: taules i gràfics editables i conclusions generades a partir de les dades.
- **Accions de millora** per centre: registre, exportació a Excel i informe del centre.

## Dades i persistència
Les càrregues, la configuració (sectors, CPR, transversals) i les accions es guarden al navegador (IndexedDB). Per passar-les a un altre equip, utilitzeu `Configuració › Dades › Exportar còpia (JSON)` i després importeu-la a l'altre equip.

## Regenerar el fitxer
```bash
cd plaensa && npm install && npm run build
# versió sense logos institucionals: node build.js sortida.html --no-logo
```
Codi font a `src/` (`parser.js` lector d'Excel, `app.js` quadre, `pptx.js` presentació, `app.css`, `shell.html`). Les dades incrustades provenen de `dades/AEA_2026_2024_DOC_DE_TREBALL.xlsx`.
