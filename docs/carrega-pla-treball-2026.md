# Càrrega del Pla de Treball Metro Nord 2026 a Jira

> Registre de la primera càrrega massiva de dades des de l'Excel "Pla de Treball Metro Nord 2026.xlsx" cap als espais de Jira (rsbmn.atlassian.net). Fet el setembre de 2026, com a pas previ/paral·lel al pilot descrit a `jira-guia-pilot.md`.

## 1. Abast de la càrrega

Es va carregar **només 4 de les 6 línies que ja tenien espai creat a Jira**, deixant-ne 2 sense tocar perquè ja contenien feina real feta a mà:

| Espai Jira | Full Excel | Estat |
|---|---|---|
| AH — Atenció Hospitalària | ATENCIÓ HOSPITALÀRIA | ✅ Carregat |
| APR — Atenció Primària | ATENCIÓ PRIMÀRIA | ✅ Carregat |
| ASM — Atenció a la Salut Mental | SALUT MENTAL | ✅ Carregat |
| CIF — Contractació i Facturació | CONTRACTACIÓ I INVERSIONS | ✅ Carregat (línia pilot, la més petita) |
| AIN — Atenció Intermèdia | ATENCIÓ INTERMÈDIA | ⛔ No tocat (ja tenia 59 issues reals fets a mà) |
| SI — Sistemes Informació | SISTEMES D'INFORMACIÓ | ⛔ No tocat (barreja de proves i feina real) |

**7 línies del pla encara no tenen espai a Jira** i per tant no s'han pogut carregar: Atenció al Ciutadà, Cronicitat, Farmàcia, Comunicació, Salut Pública, Gènere, Gerència.

## 2. Resultat numèric

| Espai | Projectes creats | Accions creades | Total issues | Comentaris "Revisió" |
|---|---|---|---|---|
| AH | 33 | 86 | 119 | 2 |
| APR | 32 | 127 | 159 | 2 |
| ASM | 20 | 82 | 102 | 3 |
| CIF | 3 | 3 | 6 | 2 |
| **Total** | **88** | **298** | **386** | **9** |

## 3. Neteja prèvia de l'Excel

Abans de carregar es va corregir l'Excel original (només els errors greus, tal com es va decidir):

- Eliminades **59 files "brossa"** (residus `SP`/`VAC`/`URG`/`FARM`/`CONT` al final de 12 de les 13 pestanyes).
- Corregides **3 dates invertides** (Data final anterior a Data inici): Atenció Primària fila 101, Sistemes d'Informació files 14-15.
- **No** es van tocar: el desfàs de numeració d'objectius de Salut Mental (veure §5) ni les variants d'escriptura de noms de projecte — es van resoldre directament durant la càrrega (veure §4).

## 4. Mapatge de camps aplicat

L'esquema de Jira ja existia (dissenyat prèviament, probablement per l'Elisa) i s'hi ha carregat respectant-lo exactament:

| Excel | Jira |
|---|---|
| Full → | Espai/Projecte Jira |
| PROJECTE (col D) | Issue tipus **Projecte** (1 per nom únic, normalitzant variants d'espais/majúscules) |
| ACCIONS (col E) | Issue tipus **Acció**, penjada del seu Projecte (`parent`) |
| LÍNIA (col A) | Camp `Línia estratègica` (customfield_10190, llista desplegable) |
| OBJECTIU ESTRATÈGIC (col B) | Camp `Objectiu estratègic` (customfield_10191, llista desplegable) |
| SECTOR (col C) | Camp `Sector Sanitari RSBMN` (customfield_10188, multiselecció) |
| Data inici (col F) | `Fecha de inicio` (customfield_10015) — només al Projecte (mín. de les seves accions) |
| Data final (col G) | `Fecha de vencimiento` / duedate — al Projecte (màx.) i a cada Acció (la seva pròpia) |
| ESTAT (col H) | Estat Jira: Completat→Finalitzat, En procés/Amb retard→En curs, Nevera→Nevera. Buit → es queda "Planificat" |
| Marca mensual = REVISIÓ | Comentari a l'Acció: "Revisió pendent al pla de treball 2026 (mes: X)" |
| COMENTARIS (col U) | Afegit a la descripció de l'Acció |

El "rollup" d'estat del Projecte es calcula sobre les seves Accions: si alguna és "En curs" → Projecte "En curs"; si totes "Finalitzat" → "Finalitzat"; si totes "Nevera" → "Nevera"; altrament es queda "Planificat".

## 5. Incidències detectades durant la càrrega

- **Salut Mental**: la numeració d'objectius de l'Excel (`L3OE26-28`) estava desplaçada una unitat respecte al catàleg oficial ja codificat a Jira (`L3OE25-27`, mateix contingut). Es va traduir automàticament en 39 de les 82 accions. **Recomanació**: corregir la numeració a l'Excel font per evitar l'ambigüitat en futures càrregues.
- **AH-43** "Hospital Oncohematològic": Data final = "31/9/2026" (setembre no té dia 31) → creada sense data de venciment. Cal corregir-ho a l'Excel.
- **AH-45** "Radiofarmàcia" i **AH-105** "Seguiment d'indicadors": sense Línia/Objectiu perquè les cel·les ja estaven buides a l'Excel.
- **APR fila 100**: "1/1//2026" interpretat com 2026-01-01.
- **AH i APR completes**: cap fila tenia la columna ESTAT emplenada → tots els issues han quedat a "Planificat" per defecte. No és un error de càrrega, reflecteix que l'Excel encara no s'actualitza amb estats reals en aquestes dues línies.
- **2 issues de prova a AH** (creats per l'Elisa mentre es dissenyava l'esquema) s'han marcat "Nevera" amb un comentari, ja que les eines disponibles no permeten esborrar issues — cal eliminar-los manualment des de la interfície.

## 6. Verificació

Es va comprovar directament (no només l'informe de qui va fer la càrrega) una mostra d'issues a cada espai: els camps Línia/Objectiu/Sector es guarden com a opcions reals de Jira (no text lliure), els enllaços Projecte→Acció són correctes, i les dates es guarden com a camp data natiu. No s'ha detectat cap corrupció de dades.

No s'ha vist cap necessitat de fer servir el tipus "Subtasca": cada fila de l'Excel ja és la unitat atòmica del pla. Queda disponible per si en el futur cal desglossar una Acció concreta en passos més petits durant l'execució real.

## 7. Pendent

- Decidir si es creen els 7 espais que falten (Atenció al Ciutadà, Cronicitat, Farmàcia, Comunicació, Salut Pública, Gènere, Gerència).
- Esborrar manualment els 2 issues de prova d'AH marcats "Nevera".
- Corregir a l'Excel font: la data d'AH-43, i (opcionalment) la numeració d'objectius de Salut Mental.
- Revisar AIN i SI (no tocats en aquesta càrrega) per decidir si cal completar-los amb la resta de files de l'Excel.
