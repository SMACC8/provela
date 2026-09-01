# ProVela

Suite PWA di navigazione a vela: hub più moduli standalone, mobile-first e
offline-first. Nasce come Raffyca / SailingHub, da cui il prefisso `raffyca-`
ancora usato ovunque nei nomi delle chiavi e dei file condivisi.

## Come girano le cose

Niente build e niente server applicativo: sono file statici serviti così come
sono. Tutti i path sono **relativi**, perché il sito vive sotto un
sottopercorso di GitHub Pages.

Per provare in locale, dalla radice del repo:

    python3 -m http.server 8765

poi `http://localhost:8765`. Aprire i file con `file://` **non funziona**:
service worker e `fetch` richiedono un'origine sicura, e localhost conta come
tale.

Deploy: push su `main` → GitHub Pages ricostruisce da solo. `.nojekyll` è già
presente e va lasciato.

L'applicazione non si compila, ma **una parte dei dati sì**: le isobate e le
maschere terra/mare sono uscite di due script in radice (vedi "Dati derivati"
sotto). Sono committate perché il sito è statico, non perché siano scritte a
mano.

## Moduli

Ognuno è una cartella autonoma in radice, con il proprio service worker:

| Cartella | Cosa fa |
|---|---|
| `index.html` | hub: onboarding, menu, vista tracce/WP legacy |
| `meteo/` | previsioni multi-modello ("Il Nastro del Vento") |
| `cruscotto/` | strumenti di bordo, registrazione traccia, regata |
| `routing/` | traversata con polari ORC e maschere costa |
| `carta/` | carta nautica OpenSeaMap, waypoint, tracce, batimetrie |
| `anchor/` | veglia d'ancora, canvas autonomo, zero tile |
| `xte/` | cross-track error (upstream, non reskinnato) |
| `mob/` | uomo a mare |
| `posizione/` | posizione live: `index.html` trasmette, `segui.html` legge |
| `manutenzione/` | registro di bordo — unico modulo su Supabase |
| `impostazioni/` | profilo, tema, caricatore polare CSV, guida |
| `performance/`, `partenza/` | build React precompilati |
| `sole-luna/`, `percorso/`, `calcoli/` | strumenti minori |

## Convenzioni da rispettare

**Bump del service worker.** Ogni modifica a un file che sta nel precache
richiede di alzare la versione del service worker del modulo toccato, altrimenti
i dispositivi continuano a servire la copia vecchia dalla cache. I service worker
sono namespacati per modulo (`provela-hub-v10`, `raffyca-meteo`, `xte`, …): si
alza solo quello del modulo modificato.

**Contratto localStorage.** Tutte le chiavi hanno prefisso `raffyca-` e sono
condivise fra moduli — `raffyca-polar` per esempio è scritta da `performance/`
e letta altrove. L'elenco completo sta in `SITUAZIONE.md`. Non rinominare una
chiave senza prevedere la migrazione: i dati stanno sui dispositivi degli utenti,
non su un server.

**Dati derivati: non si toccano a mano.** `routing/isobate/*.geojson` e
`routing/coastmasks/*.json` sono generati, e vanno rigenerati — non corretti nel
file:

| Script (in radice) | Produce | Sorgente, che **non** sta nel repo |
|---|---|---|
| `build_isobate.py` | `routing/isobate/` | shapefile `isobate_ITALIA_v2` (EMODnet, archivio dell'utente) |
| `build_coastmasks.py` | `routing/coastmasks/` | `land-polygons-complete-4326` da `osmdata.openstreetmap.de` (~880 MB, da riscaricare) |

Tutti e due prendono il percorso della sorgente come primo argomento. Modificare
un `.json` a mano lo fa divergere dallo script e la prima rigenerazione se lo
riprende.

**La costa viene dalle land polygons, non da Overpass.** Overpass restituisce i
tratti grezzi di `natural=coastline`: pezzi di linea da cucire, chiudere e
controllare a mano. È già stato fatto, e ha lasciato buchi grossi — in Basso
Adriatico mancava più terra di quanta ne fosse riconosciuta, e per il router la
costa dalmata era mare aperto. Le land polygons sono lo **stesso dato OSM** già
assemblato e validato da OSMCoastline, rigenerato ogni giorno. Se la costa va
rifatta, la strada è quella: una query Overpass fatta meglio non è la soluzione,
è il modo in cui si è creato il problema.

**I riquadri di zona stanno in quattro posti.** `ZONE_BOX` in
`routing/raffyca-traversata-map.html`, in `carta/index.html` e in
`build_isobate.py`, `ZONE` in `build_coastmasks.py`. Toccarne uno solo
significa isobate o maschere ritagliate su un riquadro che non esiste più — è già
successo, ed è invisibile rileggendo il codice perché il codice resta giusto.
(Nota: su Alto Tirreno `lonW` differisce fra routing 7.50 e carta 9.00; i due
script usano di proposito il più largo, così un pacchetto serve entrambi.)

**Niente credenziali nel codice.** Token Upstash e configurazione Supabase
vivono in localStorage, scritti dall'utente da `impostazioni/`. Nel repo restano
solo i segnaposto. Il repository è pubblico: qualunque chiave committata è da
considerare compromessa.

## La memoria del progetto

`SITUAZIONE.md` è il registro delle decisioni, comprese quelle scartate e il
perché — per esempio l'abbandono della costa GSHHG in favore di OpenStreetMap,
o il bug delle maschere `bits` che dipingevano terra in eccesso. **Va letto
prima di intervenire su routing, coste o maschere di zona**, altrimenti si
rischia di rifare strade già rivelatesi sbagliate.

**E va aggiornato: fa parte del lavoro, non è un extra da concordare ogni
volta.** Ogni intervento non banale si chiude con una voce nuova in fondo,
scritta senza chiedere il permesso. Il formato lo dettano le voci esistenti:
separatore `---`, titolo `## gg/mm/aaaa — cosa`, poi il difetto osservato, le
alternative valutate **e scartate con il motivo**, la correzione, cosa è stato
verificato e cosa no. Il valore sta soprattutto nelle strade scartate e nei
difetti silenziosi: quelli che non si vedono rileggendo il codice.

## Limiti noti

- `performance/` e `partenza/` sono build React: nel repo c'è solo l'`index.html`
  compilato, il sorgente non è qui. Non sono modificabili da questo repository.
- L'allarme di `anchor/` è dichiaratamente foreground-only: i browser non
  permettono audio affidabile in background.
- Le etichette della vista Satellite (Esri) sono in inglese: localizzarle
  richiede l'API ArcGIS con chiave, non l'endpoint libero.

**Il resto dei punti aperti sta in `SITUAZIONE.md`, ed è lì che va letto — non
qui.** Non in una sezione dedicata: in fondo a ogni voce datata, sotto "Aperti"
o "Non verificato". Quel file è cronologico: una voce che segnala un
problema può essere superata da una voce successiva che lo chiude. Va letto
**fino in fondo** prima di dare per aperto qualcosa. Elencare qui i punti aperti
è già stato provato ed è andato male: la voce "tacca `ZONE_BOX` a
Vasto/Abruzzo" era stata copiata da una nota del 21/07 senza vedere il
`[FATTO]` che la chiudeva poche righe dopo (nel codice `Medio Adriatico` ha
`latS:41.50`, in `routing/` e in `carta/`).

**Contare i file non è verificare**, ed è la seconda lezione. Le isobate erano
state date per risolte perché esistono 9 file su 9 zone: dentro, però, c'erano
contorni dipinti in mezzo alle lagune e ritagli fermi a riquadri superati da un
mese. Lo stesso è valso per le maschere costa, complete di file e mancanti di
metà della terra.

Vale per ogni dato derivato di questo repo. Un dato si verifica **misurandone il
contenuto contro un riferimento indipendente** — quanta area è classificata male
rispetto alla sorgente a risoluzione più fine, quanti punti noti finiscono dalla
parte giusta, se i passaggi stretti restano aperti — non elencando i file né
guardando se la carta "sembra giusta".
