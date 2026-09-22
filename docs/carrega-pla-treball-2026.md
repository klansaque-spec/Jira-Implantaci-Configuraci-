# Càrrega del Pla de Treball Metro Nord 2026 a Jira

> Registre de la primera càrrega massiva de dades des de l'Excel "Pla de Treball Metro Nord 2026.xlsx" cap als espais de Jira (rsbmn.atlassian.net). Fet el setembre de 2026, com a pas previ/paral·lel al pilot descrit a `jira-guia-pilot.md`.

## 1. Abast de la càrrega

Es va fer en dues tongades. Primer les 4 línies buides amb espai creat; després, a petició expressa de l'usuari, també AIN i SI tot i tenir-hi ja feina real feta a mà (veure §1.1):

| Espai Jira | Full Excel | Estat |
|---|---|---|
| AH — Atenció Hospitalària | ATENCIÓ HOSPITALÀRIA | ✅ Carregat |
| APR — Atenció Primària | ATENCIÓ PRIMÀRIA | ✅ Carregat |
| ASM — Atenció a la Salut Mental | SALUT MENTAL | ✅ Carregat |
| CIF — Contractació i Facturació | CONTRACTACIÓ I INVERSIONS | ✅ Carregat (línia pilot, la més petita) |
| AIN — Atenció Intermèdia | ATENCIÓ INTERMÈDIA | ✅ Carregat (afegit als 59 issues reals ja existents, sense tocar-los) |
| SI — Sistemes Informació | SISTEMES D'INFORMACIÓ | ✅ Carregat (afegit als ~45 issues existents, sense tocar-los) |

**7 línies del pla encara no tenen espai a Jira** i per tant no s'han pogut carregar: Atenció al Ciutadà, Cronicitat, Farmàcia, Comunicació, Salut Pública, Gènere, Gerència. No es crearan fins que algú amb permisos d'administrador creï els espais corresponents — l'eina de Jira disponible només permet crear issues dins de projectes ja existents, no projectes nous.

### 1.1 AIN i SI: càrrega afegida, no fusionada

AIN i SI ja tenien issues reals fets a mà abans d'aquesta càrrega (59 a AIN, ~45 a SI, alguns de prova evident a SI). El redactat d'aquests issues no coincideix literalment amb l'Excel, així que **no hi ha manera de fusionar-los automàticament** amb les files corresponents. L'usuari va confirmar explícitament que es carregués igualment tot el contingut de l'Excel, sabent que els issues nous conviuen AL COSTAT dels existents (no els substitueixen ni els fusionen). Verificat per recompte exacte abans/després que no s'ha tocat cap issue preexistent: AIN 59→157, SI 45→78.

## 2. Resultat numèric

| Espai | Projectes creats | Accions creades | Comentaris "Revisió" | Nota |
|---|---|---|---|---|
| AH | 33 | 86 | 2 | Espai buit abans de carregar |
| APR | 32 | 127 | 2 | Espai buit abans de carregar |
| ASM | 20 | 82 | 3 | Espai buit abans de carregar |
| CIF | 3 | 3 | 2 | Espai buit abans de carregar; línia pilot |
| AIN | 18 | 80 | 1 | Afegit a 59 issues existents (no tocats) |
| SI | 11 | 22 | 6 | Afegit a ~45 issues existents (no tocats) |
| **Total** | **117** | **400** | **16** | |

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
- **AIN, fila 43**: la columna LÍNIA estava buida (únic cas en aquest full); se li ha assignat "L3 · Atenció Intermèdia" com a la resta del full.
- **SI, "Actualització QC Pla de Treball 2026"**: dues files amb el mateix nom de projecte però amb un espai doble de diferència han generat dos issues "Projecte" bessons ([SI-51](https://rsbmn.atlassian.net/browse/SI-51) i [SI-53](https://rsbmn.atlassian.net/browse/SI-53)) en lloc d'un de sol — es poden fusionar manualment si es vol.
- A AIN i SI, algunes crides van patir timeouts temporals de connexió amb Jira; cada cas es va verificar per JQL abans de continuar, sense duplicats ni pèrdues (recompte final exacte).

## 6. Verificació

Es va comprovar directament (no només l'informe de qui va fer la càrrega) una mostra d'issues a cada espai: els camps Línia/Objectiu/Sector es guarden com a opcions reals de Jira (no text lliure), els enllaços Projecte→Acció són correctes, i les dates es guarden com a camp data natiu. No s'ha detectat cap corrupció de dades.

No s'ha vist cap necessitat de fer servir el tipus "Subtasca": cada fila de l'Excel ja és la unitat atòmica del pla. Queda disponible per si en el futur cal desglossar una Acció concreta en passos més petits durant l'execució real.

## 7. Pendent

- Crear (un administrador de Jira) els 7 espais que falten: Atenció al Ciutadà, Cronicitat, Farmàcia, Comunicació, Salut Pública, Gènere, Gerència. Un cop existeixin, carregar-hi el pla de la mateixa manera.
- Esborrar manualment els 2 issues de prova d'AH marcats "Nevera".
- Corregir a l'Excel font: la data d'AH-43, i (opcionalment) la numeració d'objectius de Salut Mental.
- Valorar si cal fusionar manualment els issues bessons detectats a AIN i SI (variants d'espais en el nom del projecte).
