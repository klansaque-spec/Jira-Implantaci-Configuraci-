# Pilot Jira RSBMN: elements útils, notificacions i formació de 2 hores

> Versió de text del contingut de les pestanyes "Elements útils", "Notificacions" i "Formació 2h" de la guia interactiva (`docs/guia-jira-rsbmn.html`, publicada com a artifact). Data: 9/10/2026.

## 1. Elements útils en visió usuari (per freqüència d'ús)

### Cada dia (tothom)
| # | Element | Per a què | On |
|---|---|---|---|
| 1 | Assignat a mi | Veure només les teves fitxes | Avatar al costat de "Buscar" a cada vista, o filtre a Llista |
| 2 | Canviar l'estat | Planificat → En curs → Finalitzat / Nevera | Desplegable a la fitxa o arrossegar al Tauler |
| 3 | Comentar (@menció) | Avenç, bloqueig, decisió. Substitueix el correu intern | Peu de la fitxa |
| 4 | Crear amb la tecla C | Alta de Projecte o Acció amb tots els camps. Mètode estàndard | Tecla C o botó "Crear" |
| 5 | Cerca ràpida | Trobar una fitxa per títol o clau | Lupa superior / "Buscar tablero" |

### Cada setmana
| # | Element | Per a què | On |
|---|---|---|---|
| 6 | Llista amb filtres | Taula filtrada per Sector, Prioritat, Assignat; ordenar per venciment | Pestanya Lista → Filtro |
| 7 | Calendari | Venciments del mes | Pestanya Calendario |
| 8 | Cronograma | Projectes com a barres de temps amb les Accions | Pestanya Cronograma |
| 9 | Observar una fitxa | Rebre correu d'una fitxa que no és teva però t'afecta | Icona de l'ull a la fitxa |
| 10 | Adjuntar o enllaçar | Acta, informe, enllaç a carpeta | Clip a la fitxa |
| 11 | Agrupar el Tauler | Per persona o per prioritat | Botó "Grupo" del Tauler |

### Coordinació de línia (responsables)
| # | Element | Per a què | On |
|---|---|---|---|
| 12 | Resum de l'espai | Gràfics automàtics per estat, assignat, prioritat | Pestanya Resumen |
| 13 | Filtres desats | Guardar cerques recurrents | Filtros → Ver todas las incidencias → Guardar como |
| 14 | Subscripció per correu a un filtre | Rebre la llista cada dilluns | Filtre → Detalles → Nueva suscripción |
| 15 | Exportar a Excel | Informes i persones que no entren a Jira | Llista → ··· → Exportar |
| 16 | Quadre de comandament RSBMN | Visió transversal dels 6 espais | Pestanya de la guia |

No s'utilitzen al pilot: sprints, punts d'història, fulls de temps, components, versions, taulers personalitzats.

## 2. Notificacions per correu (4 nivells)

**Nivell 1 · Perfil personal (cada usuari, 2 min).** Avatar → Configuración personal → Notificaciones por correo. Activar: m'assignen, em mencionen, comentaris a fitxes meves o que observo. Desactivar: els meus propis canvis. Activar el resum diari (digest) si existeix.

**Nivell 2 · Esdeveniments de l'espai (administrador, 1 cop per espai).** Configuració de l'espai → Notificaciones.

| Esdeveniment | Rep correu |
|---|---|
| Es crea una fitxa | Responsable de la línia |
| S'assigna una fitxa | Persona assignada |
| Algú comenta | Assignat, informador, observadors |
| Canvia l'estat | Informador, responsable de la línia |
| Es finalitza / Nevera | Informador, responsable de la línia |
| S'edita qualsevol camp | Ningú |

Mentre es facin les assignacions en bloc pendents, desactivar temporalment "S'assigna una fitxa".

**Nivell 3 · Recordatoris automàtics (administrador).** Configuració de l'espai → Automatización → regla programada (JQL) + acció "Enviar correo".

| Regla | Quan | JQL | A qui |
|---|---|---|---|
| R1 Venç aquesta setmana | Dilluns 08:00 | `due <= 7d AND due >= now() AND status NOT IN (Finalitzat, Nevera)` | Assignat |
| R2 Vençuda | Dilluns 08:05 | `due < now() AND status NOT IN (Finalitzat, Nevera)` | Assignat + responsable |
| R3 En curs sense moviment | Dia 1 de mes | `status = "En curs" AND updated <= -30d` | Assignat |
| R4 Hauria d'haver començat | Dia 1 de mes | `status = Planificat AND "Fecha de inicio" <= now()` | Assignat |
| R5 Sense responsable | Dilluns 08:10 | `assignee IS EMPTY AND status != Nevera` | Responsable |

Precaucions: límit d'execucions mensuals segons el pla d'Atlassian (per això setmanals i mensuals); una regla d'espai només actua sobre aquell espai (repetir-la als 6 o crear-la global).

**Nivell 4 · Resum setmanal propi (cada usuari, 3 min).** Filtre desat `assignee = currentUser() AND status NOT IN (Finalitzat, Nevera) ORDER BY due ASC` → subscripció setmanal dilluns 08:00, "no enviar si no hi ha resultats".

## 3. Formació d'arrencada del pilot (2 hores)

Formadors: Elisa i Kilian. Sessió única, cada assistent amb ordinador i sessió a Jira. Es treballa sobre fitxes reals. Grups de 8 a 12.

**Prerequisits (setmana abans):** usuaris actius amb accés; assignacions en bloc fetes; camps obligatoris actius als 6 espais; notificacions d'espai i regles configurades; Nevera en vermell i filtres per defecte; enllaç a la guia a la convocatòria; espai AIN com a demostració.

| Hora | Durada | Bloc | Resultat observable |
|---|---|---|---|
| 0:00 | 10' | Per què canviem l'Excel per Jira (Kilian, 3 diapositives) | Entenen que substitueix l'Excel |
| 0:10 | 15' | Tour guiat en viu sobre AIN (Elisa): 5 vistes, vocabulari, "Assignat a mi" | Reconeixen la pantalla |
| 0:25 | 20' | Exercici 1 · La meva feina: filtre, obrir Acció, canviar estat, comentar amb @menció | 1 transició + 1 comentari per persona |
| 0:45 | 20' | Exercici 2 · Crear bé amb la tecla C, 4 camps obligatoris, localitzar-la | 1 fitxa completa per persona |
| 1:05 | 10' | Pausa | |
| 1:15 | 20' | Vistes per planificar-se: Llista amb filtres, Calendari, Cronograma, Agrupar. Exercici 3: "què venç abans de final d'any al meu sector" | Responen en menys d'1 minut |
| 1:35 | 15' | Notificacions: configurar nivell 1 i nivell 4 en viu; mostrar un correu R1 | Perfil i subscripció configurats |
| 1:50 | 10' | Tancament: regles del pilot, canal de dubtes, seguiment, enquesta | Enquesta contestada |

**Materials:** la guia; les 3 diapositives d'obertura; xuleta d'una cara; enquesta de 3 preguntes.

**Mesura d'èxit:** mateix dia (JQL: 1 transició, 1 comentari, 1 fitxa creada per assistent); setmana 2 (sessió de dubtes de 30 min, % que han tornat a entrar); mensual (% "En curs" actualitzades en 30 dies, vençudes sense comentari); final del pilot (enquesta i decisió sobre els 7 espais pendents).

**Sessió complementària per a responsables de línia (45 min):** Resum de l'espai, filtres desats i subscripcions, exportació, lectura del quadre de comandament, què fer amb R2 i R5.
