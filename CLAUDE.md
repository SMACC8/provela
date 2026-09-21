# Dritta

Suite PWA di navigazione a vela: hub più moduli standalone, mobile-first e
offline-first. Nasce come Raffyca / SailingHub, da cui il prefisso `raffyca-`
ancora usato ovunque nei nomi delle chiavi e dei file condivisi. Dal 12/09/2026
si chiama **Dritta**; prima si chiamava **ProVela**, nome che compare ancora
nelle voci vecchie di `SITUAZIONE.md` (registro storico, non si riscrive) e nel
nome del repository.

**Il nome è anche una parola dell'interfaccia**: «dritta» è il lato destro della
barca e ricorre ovunque nei testi («mura a dritta», «accosta a dritta»). Quando
si scrive testo nuovo, il marchio va reso distinguibile dal termine nautico —
maiuscola, e meglio se in `<b>` o in una posizione che non lasci dubbi.

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
| `carta/` | carta nautica OpenSeaMap, waypoint, tracce, batimetrie, raster propri |
| `anchor/` | veglia d'ancora, canvas autonomo, zero tile |
| `xte/` | cross-track error (upstream, non reskinnato) |
| `mob/` | uomo a mare |
| `posizione/` | posizione live: `index.html` trasmette, `segui.html` legge |
| `manutenzione/` | registro di bordo — su Supabase (tabelle + bucket `boat-docs`) |
| `impostazioni/` | profilo, tema, caricatore polare CSV, guida |
| `performance/`, `partenza/` | build React precompilati |
| `sole-luna/`, `percorso/`, `calcoli/` | strumenti minori |

## Convenzioni da rispettare

**Bump del service worker.** Ogni modifica a un file che sta nel precache
richiede di alzare la versione del service worker del modulo toccato, altrimenti
i dispositivi continuano a servire la copia vecchia dalla cache. I service worker
sono namespacati per modulo (`dritta-hub-v17`, `raffyca-meteo`, `xte`, …): si
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

**Niente credenziali nel codice.** La configurazione Supabase vive in
localStorage (`raffyca-supabase`), scritta dall'utente da `impostazioni/`. Nel
repo restano solo i segnaposto. Il repository è pubblico: qualunque chiave
committata è da considerare compromessa — è già successo con il token di lettura
Upstash, committato il 20/09/2026 e da revocare, non solo da cancellare.

**L'unica eccezione è `posizione/segui.html`**, che porta nel sorgente
l'indirizzo del progetto e la anon key. Non è una svista e non va "sistemata":
chi segue da terra non ha mai aperto `impostazioni/`, quindi in quel browser
`raffyca-supabase` non esiste. La anon key è pubblica per costruzione e lì non
apre nulla — `live_pos` ha RLS senza policy, si passa solo per `get_pos` e
`put_pos`, e scrivere richiede in più il codice di `raffyca-live-secret`, che
non viaggia nel link.

**Su Supabase ci sono tre moduli.** `manutenzione/` (tabelle e
allegati); `posizione/`, che dal 21/09/2026 pubblica la posizione live nella
tabella `live_pos` passando per due funzioni `security definer` (schema in
`supabase/migrations/`, trasmettitore in `rf-live.js`); e `carta/`, che dal 17/09/2026 manda le immagini delle carte raster
nello **stesso bucket** `boat-docs`, sotto `<boat_id>/carte/`. Non serve un
progetto né un bucket in più: la policy del bucket pretende l'id della barca
come primo segmento del percorso, e quel percorso la rispetta — chi aggiunge un
terzo consumatore rispetti la stessa forma, altrimenti la policy lo rifiuta.
Per `carta/` il cloud è solo **distribuzione**: l'immagine scaricata viene
sempre copiata in IndexedDB, perché in cala senza campo la carta deve esserci.
La configurazione (`raffyca-supabase`) è una chiave `raffyca-*`, quindi viaggia
nel backup: chi importa un backup si porta dietro anche la chiave, e il file
non va mandato in giro.

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

- `performance/` e `partenza/` **non sono più build React** — lo erano, e questa
  riga diceva di non toccarli. Oggi sono vanilla e leggibili: `partenza/` è
  scritto a mano, `performance/` lo assembla `build_perf.py` riusando boot-tema
  e topbar da `cruscotto/` (attenzione: il `ROOT` dentro lo script punta a un
  percorso di un'altra macchina, va corretto prima di rieseguirlo). Verificato
  il 21/09/2026: zero occorrenze di React o webpack in entrambi.
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
