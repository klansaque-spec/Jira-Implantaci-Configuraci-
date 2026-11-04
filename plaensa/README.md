# Quadre de comandament PLAENSA · RSBMN

Fitxer únic: **`PLAENSA_quadre_comandament.html`** (amb el logo /Salut · Generalitat de la plantilla corporativa, a `assets/`). S'obre amb doble clic (Chrome/Edge) i funciona sense connexió: les llibreries (SheetJS, Chart.js, PptxGenJS) i les dades AEA 2026 vs 2024 hi van incrustades.

## Què fa
- **Visió global**: titulars entre estudis, una targeta per estudi i el rang de centres davant de Catalunya.
- **Per a cada estudi, 7 apartats**, amb titulars vinculats als filtres actius:
  1. *Resum i conclusions*: centres per sota de Catalunya, qui lidera, el centre que més millora i el que més empitjora (satisfacció i fidelitat) i la matriu de canvis d'àrea entre anys (excel·lència / estàndard / millora).
  2. *Satisfacció i Fidelitat*: taula ordenable per qualsevol columna.
  3. *Semàfor per centre*: filtres de centres i preguntes (Totes/Cap) i anys de comparació seleccionables.
  4. *Comparativa i evolució*: títol amb les preguntes triades i colors de cada institució.
  5. *Anàlisi de centre*: comparatiu d'anys, perfil per dimensions, matriu de prioritats, objectius que hi apliquen i plans d'acció amb l'avaluació del cicle.
  6. *CPR i Accions*: registre d'accions (cicle d'origen, tipus, responsable operatiu, periodicitat, abast, indicador de procés i avaluació automàtica).
  7. *Objectius i configuració*: transversals i específics per cicle PLAENSA i per àmbit (regió, sector o centre), propostes a partir dels resultats, CPR, preguntes no comparables i fitxa tècnica.
- **Regles de dades**: no es calculen mitjanes de regió ni de sector (no són dades consolidades); la RSBMN només es mostra quan el fitxer porta el valor oficial. Sense n real, la significació s'estima amb n = 80 per centre (mínim del disseny) i s'indica com a «n estimada».
- **Sortides**: presentació `.pptx` editable, informe per al comitè (HTML) i informe d'un centre (HTML).
- **Logos**: /Salut · Generalitat i les institucions de la xarxa d'aliances (`assets/`), només a la versió local.

## Dades i persistència
Les càrregues, la configuració (sectors, CPR, transversals) i les accions es guarden al navegador (IndexedDB). Per passar-les a un altre equip, utilitzeu `Configuració › Dades › Exportar còpia (JSON)` i després importeu-la a l'altre equip.

## Regenerar el fitxer
```bash
cd plaensa && npm install && npm run build
# versió sense logos institucionals: node build.js sortida.html --no-logo
```
Codi font a `src/` (`parser.js` lector d'Excel, `app.js` quadre, `pptx.js` presentació, `app.css`, `shell.html`). Les dades incrustades provenen de `dades/AEA_2026_2024_DOC_DE_TREBALL.xlsx`.
