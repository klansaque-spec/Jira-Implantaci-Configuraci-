# Configuració estàndard dels 6 espais Jira (RSBMN)

> Decisions de configuració preses el 9/10/2026 per a tots els espais del pla de treball (AH, APR, ASM, AIN, SI, CIF). Tot el que hi ha aquí és configuració d'interfície de Jira (projectes "team-managed"): **no es pot aplicar per API** amb els connectors disponibles, s'ha de fer a mà a cada espai. El que sí es pot fer per API és auditar-ho abans i després, i això és el que recull aquest document.

## 1. Camps obligatoris per tipus d'activitat

Estàndard de referència: la configuració del tipus **Projecte** de l'espai AIN (captura de l'usuari), ampliada amb "Persona assignada".

| Camp | Projecte | Acció |
|---|---|---|
| Resum | Obligatori (ja ho és a tots els espais) | Obligatori (ja ho és) |
| Sector Sanitari RSBMN | **Obligatori** | **Obligatori** |
| Nivell de prioritat | **Obligatori** | **Obligatori** |
| Persona assignada | **Obligatori** | **Obligatori** |
| Línia estratègica / Objectiu estratègic | Recomanat | Recomanat |
| Data d'inici / Data de venciment | Recomanat | Recomanat |

Tasca i Subtasca es deixen com estan (només Resum): són unitats de treball intern que pengen d'una Acció ja classificada.

### Com aplicar-ho (a cada espai, dues vegades: Projecte i Acció)

1. Obrir l'espai → **Configuració de l'espai** → **Tipus d'activitat** → seleccionar *Projecte*.
2. A cada camp (Sector Sanitari RSBMN, Nivell de prioritat, Persona assignada): botó "···" a la dreta → marcar **Obligatori**.
3. Si "Persona assignada" no apareix a la llista de camps del tipus, afegir-la primer amb **Afegir camp** i després marcar-la obligatòria.
4. Repetir amb el tipus *Acció*.

### Avís important sobre l'ordre

Fer obligatòria "Persona assignada" (i "Nivell de prioritat") quan centenars de fitxes importades encara tenen el camp buit fa que cada fitxa mostri l'avís de camp pendent i que no es pugui desar cap edició fins a omplir-lo. Ordre recomanat:

1. Primer, les **assignacions en bloc** (Bulk Change, amb "Enviar correu" desmarcat) descrites a la guia.
2. Després, els camps obligatoris.

## 2. Auditoria per API (9/10/2026, abans d'aplicar res)

Font: `getJiraIssueTypeMetaWithFields` amb `requiredFieldsOnly=true` per a Projecte i Acció a cada espai.

| Espai | Projecte: camps obligatoris | Acció: camps obligatoris | Compleix l'estàndard? |
|---|---|---|---|
| AIN | Resum, Sector Sanitari RSBMN, Nivell de prioritat | Resum | Parcial (falta Persona assignada a Projecte; Acció no configurada) |
| AH | Resum | Resum | No |
| APR | Resum | Resum | No |
| ASM | Resum | Resum | No |
| CIF | Resum | Resum | No |
| SI | Resum | Resum | No |

"Persona assignada" no és obligatòria en cap espai ni cap tipus. Els camps de sistema `project` i `reporter` surten com a obligatoris a l'API en alguns espais però els omple Jira automàticament i no afecten l'usuari.

Un cop aplicada la configuració a mà, es tornarà a passar la mateixa auditoria per confirmar que els 6 espais han quedat idèntics.

## 3. Altres decisions de configuració (també manuals)

- **Estat "Nevera" en vermell** a tots els espais, per distingir-lo de "Planificat" (ara comparteixen el gris de la categoria "nou"). Cap connector permet canviar la categoria d'un estat.
- **Filtres visibles per defecte** a les vistes Llista i Tauler de cada espai: Persona assignada, Sector Sanitari RSBMN, Nivell de prioritat. Vista predeterminada: "Assignat a mi", desada per a tothom.
- **Assignacions per línia** (sense notificar, Bulk Change amb correu desmarcat): APR → Mireia Rodríguez; ASM → Maria Salut Martínez; AH (Projectes) → Alba Luna; SI → Elisa Poses; AIN → Kilian Lansaque.

El detall operatiu de cada punt és a la guia interactiva (`docs/guia-jira-rsbmn.html`, pestanyes "Camps per tipus" i "Configurar ara").
