# ProVela (ex Raffyca / SailingHub) — stato al 30/07/2026

Suite velica modulare, mobile-first, offline-first. Hub + moduli standalone che
condividono raffyca.css e un layer localStorage. Deploy GitHub Pages, path relativi.

## Moduli (tutti in radice, zero 404, barra fissa ovunque)
- index.html = Hub (onboarding + menu + vista Tracce/WP legacy dormiente). Mattonella Info.
- meteo/ = Il Nastro del Vento (PWA, SW namespacato raffyca-meteo).
- cruscotto/ = strumenti. Registrazione scrive raffyca-rec. % polare calcolata da raffyca-polar (fallback demo).
- xte/ = XTE upstream (dentro il repo, SW namespacato xte). Non reskinnato (non esiste reskin).
- performance/ = build React (base ./). Gestisce raffyca-polar (fonte di verità).
- partenza/ = build React (base ./).
- routing/raffyca-traversata-map.html = Traversata ricca (polari ORC, maschera Med).
- impostazioni/ = profilo/tema/settings + caricatore polare CSV.
- posizione/ = Posizione Live: index.html (broadcaster Upstash) + segui.html (client sola lettura).
- carta/ = Carta Nautica (OpenSeaMap, WP/tracce, tag, filtri, note, distanza/rilievo, export).
- manutenzione/ = registro di bordo (albero barca, interventi, scadenze, documenti, dossier). UNICO modulo su Supabase.
- info.html = RIMOSSO 11/08: contenuto accorpato in Impostazioni (sezione Guida).

## Contratto localStorage
raffyca-profile {boat,model,zone} · raffyca-waypoints [{id,name,lat,lon,ts,tag?,note?}]
raffyca-tracks [{id,name,ts,dist,dur,pts,tag?,note?}] · raffyca-active-wp · raffyca-active-track (NEW)
raffyca-tags {colore:nome} (NEW) · raffyca-settings (merge-safe) · raffyca-theme · raffyca-rec {on,pts,since}
raffyca-pos {lat,lon} · raffyca-polar {twa,tws,data,meta?} (polare condivisa) · raffyca-live-session
raffyca-supabase {url,key,bucket} (NEW, scritta da Impostazioni) · raffyca-supabase-sess {access_token,refresh_token,exp,email} (NEW, sessione Supabase) · raffyca-manut-schema {firma,sch} (NEW, mappa colonne risolta) · raffyca-manut-cache (NEW, copia di lettura del registro)
raffyca-carta-view {c:[lat,lon],z,base,sea,grid,zones,bathy,fari,fariMode,ais} (NEW, Carta-privata) · raffyca-race-handoff {from,ts,auto?,line,wind} (transiente)
raffyca-notte-velo "0".."3" (29/09/2026, stringa semplice, non JSON: la legge lo script di avvio in <head>; assente = 2) · raffyca-dash {…,picked} (29/09/2026: picked = il suggerimento del Cruscotto non serve piu')
[IndexedDB] DB 'raffyca-backup' store 'snaps' {ts,n,data:{chiavi raffyca-*}} — snapshot automatici (ultimi 5), FUORI dal localStorage per resistere a un suo azzeramento (NEW)

- [FATTO 14/07 Cruscotto] +grandezze AWA/AWS/ETA/TTG/Data-ora/Coordinate/Alba-Tramonto; brg rietichettato Rotta WP; frecce TWA P/S -> Sx/Dx (mure); cifre centrate. Regata: ritardo 2.2s a fine countdown (non taglia la tromba).
- [FATTO 14/07 Cruscotto] Sbandamento (deviceorientation+smoothing, permesso iOS al primo tocco); Data e ora con data (gg/mm HH:MM); Alba/Tramonto centrati (fit min abbassato). Layout 5: bussola grande NON modificabile (disco 0-360, 2 punte teal=prua/ambra=WP, corpo coperto dal cerchio centrale) + 4 campi; tap sulla bussola cicla NORD su / PRUA su / WP su (COMPASS_MODE persistito).
- [FATTO 21/07 Ancoraggio] NUOVO modulo anchor/ (index.html + sw.js anchor-v1 + manifest + assets barca). Veglia d'ancora canvas autonomo (nessun tile, offline in cala). Registra calata=GPS attuale in raffyca-anchor; watchPosition proprio (scrive anche raffyca-pos). Centro ricostruito con fit Kasa su track (finestra 30min/200pt, gating SOG>=0.2kn, reiezione 3sigma, valido solo con spread>=60 gradi, altrimenti fallback su drop). DUE allarmi: sforamento (dist dal centro fittato > raggio MANUALE) + deriva centro (>6 m/10min = arare). Raggio manuale governa; calcolato solo suggerito. Pericoli punto+raggio (rilevamento+distanza o tap), relativi all'ancora, salvati in sessione (no rubrica), azzerati su Salpa. Cono forecast da vento previsto MANUALE (input in Parametri). Costa opzionale lazy da routing/mediterranean_land_10m.geojson. Rischio-tocco da fondo/pescaggio/escursione marea manuali. Alba/tramonto offline. WakeLock+audio WebAudio: DICHIARATO foreground-only (no allarme in background - limite sandbox browser). Icona app ProVela sostituita (pwa-192/512/maskable + apple-touch); hub SW bump v1->v2. Tessera 'Ancoraggio' nell'hub.

- [FATTO 21/07 Traversata/Costa OSM] Costa GSHHG abbandonata (shift ~250 m + deformazione, serviva roto-traslazione: non conveniente). Nuova costa da OpenStreetMap (coastline via Overpass, ~11 m mediana vs ~112 m GSHHG), unita/deduplicata per @id in master (9554 tratti, buchi Rimini-Pesaro e Vasto/Molise tappati; residui non italiani: Dalmazia sud/Montenegro, isole 17E, Corfu, Pantelleria). Generate 9 maschere zona (ZONE_BOX) in formato nativo MED_MASKS: bits full-res (isLand, ~0.5 km/cella) + rings semplificati (DP ~40 m) in routing/coastmasks/<slug>.json (65-431 KB, tot 2.1 MB, lazy per zona). Traversata: initZoneArea ora carica la maschera OSM precotta (loadZoneMaskOSM) invece di rasterizzare dalla costa NE grossolana; FALLBACK a makeZoneArea(costa 10m) se file assente/offline. SW routing v4->v5; coastmasks cache-first al primo uso online. Verificato con harness isolato + punti noti terra/acqua per zona. NB: tacca ZONE_BOX Vasto/Abruzzo (lat<42.55 & lon<15.10) scoperta tra Medio e Basso Adriatico - da sistemare estendendo un rettangolo. Vento/isobate a Vasto/Anzio/Cecina: rimandati. Shapefile master aggiornato per archivio.

- [FATTO 21/07 Zone vento] Chiuse 4 tacche di copertura tra rettangoli ZONE_BOX (vento non coperto): Alto Tirreno latN 43.20->44.20 (Livorno/Toscana N), Medio Adriatico latS 42.55->41.50 (Vasto/Abruzzo-Molise, incl. Gargano), Basso Tirreno latN 41.20->41.80 (Anzio/Lazio), Sardegna lonE 10.90->12.00 (canale Sardegna-continente). Applicato a ZONE_BOX in routing/raffyca-traversata-map.html E carta/index.html (quadro d'unione). Rigenerate le 4 coastmasks corrispondenti (bounds nuovi); verificati 9/9 punti terra/acqua. SW routing v5->v6. NB preesistente: Alto Tirreno lonW differisce tra routing (7.50) e carta (9.00) - lasciato com'era. Vento/isobate residue e batimetrie: ancora da vedere.

- [FATTO 25/07 FIX maschere costa terra/mare] Bug segnalato: WP 45.0837,12.372 (largo del Delta del Po, in mare) risultava "a terra" in Traversata. Causa isolata: il raster `bits` delle 9 coastmasks OSM dipingeva terra in eccesso (fill bacato in fase di generazione originale) — deviava dalla costa vettoriale OSM (`rings`, la fonte che il sistema usa e disegna) di 193–1004 celle per zona (Alto/Medio Adriatico i peggiori). Verificato: sia i `rings` OSM sia il land 10m indipendente dicevano MARE su quel punto; solo i `bits` sbagliavano. Fix: rigenerati i `bits` di tutte e 9 le zone rasterizzando dai `rings` (scanline even-odd al centro cella, stesso packing). Risultato: nuovo raster coincide al 100% con la costa OSM (0 celle di deviazione); tutte le modifiche sono terra→mare (nessuna terra vera aperta come mare); punti noti OK (Venezia/Chioggia/Trieste=terra, WP contestato + largo=mare). SW routing bumpato v6→v7 per scartare le maschere vecchie in cache. Nessuna modifica al codice di lettura (isLand invariato).

- [FATTO 25/07 Lotto 1 correzioni rapide]
  (1) Unità km/h ora FUNZIONA nel Cruscotto: SOG/STW/TWS/VMG/AWS leggono raffyca-settings.units e convertono kt->km/h (x1.852) con etichetta dinamica (spdV/spdUnit/unitOf). Vento in Meteo lasciato in nodi (standard nautico) — estendibile a Traversata su richiesta.
  (2) Distanze <0,5 NM in metri: campo "Dist. WP" del Cruscotto mostra metri interi sotto 0,5 NM (unità dinamica m/NM via LAST_E), NM sopra.
  (3) Meteo previsione 96h con DATE reali (helper relDate "ggsett gg/mm") al posto di oggi/domani/+Ng: striscia nastro, etichette mezzanotte del grafico, pagina Temporali (hourLabel), pianificatore passaggio (dayWord).
  (4) Ancora: valore del raggio in metri etichettato sull'anello d'allarme e sul cerchio marker interno; aprendo i pannelli collassabili (Parametri/Pericoli) scrollIntoView per portarli in vista (interpretazione di "shiftare verso il basso" — DA CONFERMARE se era questo il problema o il foglio "Aggiungi pericolo").
  SW bump: meteo v3->v4, anchor v1->v2 (servivano l'HTML cache-first). Cruscotto senza SW proprio: servito dall'hub in network-first, si aggiorna da solo.

- [FATTO 25/07 Ancora ritocchi] (1) Testo allarme "ARARE" -> "ARANDO" (banner + barra di stato). (2) Cerchio ora AL CENTRO del box: la mappa px() e' ricentrata sul centro fittato (o punto di calata se fit non valido) invece che sul punto di calata; anello d'allarme, rosa, cono e tutto il resto restano coerenti; aggiornato anche l'inverso tap->metri per il posizionamento pericoli (aggiunto offset cc). SW anchor v2->v3.

- [FATTO 25/07 Tema giorno/notte — infrastruttura + Cruscotto] Selettore a 3 stati in Impostazioni: Scuro (attuale) / Giorno (alto contrasto per il sole) / Notte (rosso, visione notturna). Chiave raffyca-theme ora ∈ {dark,day,night}; migrazione legacy 'sun'->'day'. Meccanismo: classe applicata su documentElement (html.day/html.night) da uno script di boot inline nel <head> di ogni modulo (niente flash), + blocchi di override dei token CSS. Palette canonica: GIORNO fondo chiaro #eef1f4/pannelli bianchi/testo #0a1420, accenti scuri saturi (teal #067d70, amber #8f5600, coral #c62020, green #12894f); NOTTE tutto su scala rossa (ink #ff5b5b, accenti rossi). Impostazioni tematizzata nel suo formato HSL. Cruscotto tematizzato COMPLETO: token + topbar (hex->var) + bussola SVG resa theme-aware via cssVar()/getComputedStyle (frecce prua/WP, cardinali, numero, disco seguono il tema); 0 color:# cablati rimasti. NOTA notte: la distinzione verde=dritta/rosso=sinistra collassa su due rossi (chiaro/scuro) — compromesso della visione notturna, da rivalutare per laylines. DA FARE (rollout, un modulo per volta testandolo): Carta, Ancora, XTE, Posizione, Hub. Meteo ha sistema-colore proprio (flag LIGHT, 270 hex) -> passata dedicata. Partenza/Performance (React compilato) -> ambra/teal separati. Cruscotto/Impostazioni senza SW proprio (hub network-first): si aggiornano da soli.

- [FIX 25/07 Cruscotto rotto + Impostazioni gradiente]
  (1) BUG Cruscotto non funzionava: errore TDZ introdotto nel Lotto 1 — l'array METRICS (riga ~405) usava `unit:spdUnit` ma spdUnit e' const dichiarata dopo (~750); alla creazione dell'array JS leggeva spdUnit prima dell'inizializzazione -> l'intero script moriva. (Il controllo di sola sintassi non lo intercetta; trovato caricando la pagina in jsdom.) Fix: riferimento reso pigro `unit:()=>spdUnit()` sui 5 campi velocita' (letto solo al paint). Verificato: script inizializza senza errori; km/h e distanza <0,5NM ancora corretti.
  (2) Impostazioni Giorno: la "sfumatura acciaio" del pannello .rf-instr e l'alone header avevano il fondo scuro CABLATO (hsl 210 42% 9% / 210 45% 12%) non tematizzato -> in Giorno diventavano scuri in basso. Introdotti token --surface2 e --glow (dark/day/night) e agganciati; ora il gradiente resta chiaro in Giorno.
  Nota: distinzione layline verde/rosso di notte -> confermata accettabile dall'utente.
- [FATTO 25/07 Tema — rollout Carta/Posizione/Hub/XTE]
  Metodo consolidato: script boot in <head> (classe su documentElement, no flash) + blocchi html.day/html.night che rimappano i token; per le icone SVG selettori su attributo (html.day [fill="#..."]{fill:...}) — funziona ovunque, iOS incluso, senza toccare il markup; topbar con testo convertito a var() (identico in Scuro) + override sfondo per day/night.
  - Carta: solo chrome/topbar tematizzate; legenda isobate, controlli mappa e overlay restano com'e' (sfondo scuro proprio sopra le tile, leggibili in ogni tema; tinte categoriche invariate).
  - Posizione: standard, applicato.
  - Hub: aveva gia' un tema-giorno completo in body.sun -> rinominato html.day (preservato), aggiunta la NOTTE speculare in rosso (head/screen/footer/badge/tessere/SVG). RIMOSSO il pulsante tema dell'Hub (btnTheme) e la sua logica: unico selettore in Impostazioni come richiesto.
  - XTE: sistema-colore proprio (zone verde/giallo/arancio/rosso). Tematizzata solo la chrome (superfici/testo/topbar); i colori-zona restano INVARIATI in tutti i temi per riconoscibilita' e coerenza (in Giorno un po' brillanti su chiaro ma distinguibili; rivalutabili se serve).
  Verificati in caricamento reale (jsdom): nessun errore di init/sintassi introdotto.
  DA FARE: Ancora (plot su canvas, 13 colori -> passata dedicata theme-aware come la bussola). Meteo (sistema-colore proprio, flag LIGHT). Traversata (43 hex, mappa). Partenza/Performance (React).
- [FATTO 26/07 Tema — Ancora (canvas theme-aware)] Chrome via token override + topbar + boot. Plot su canvas reso theme-aware: helper _cv (getComputedStyle) e _rgba (hex->rgba per i translucidi); palette TH costruita a ogni draw(); tutti i colori del disegno (testo placeholder, tacche bussola, cardinali, anello allarme verde/rosso, cerchio marker teal, pericoli, simbolo ancora, triangolo barca, linea prua, cerchio accuratezza, barra scala, alone etichette) ora seguono il tema. Halo etichette = --dp (chiaro in Giorno, scuro-rosso in Notte) per leggibilita'. 0 colori cablati residui nel disegno. SW anchor v3->v4. Verificato in jsdom con canvas simulato + palette Giorno: nessun errore.
  DA FARE (una per turno, testate): Traversata (~69 colori cablati: separare chrome da tinte categoriche overlay; gradiente body come Impostazioni; map/overlay Leaflet restano). Meteo (270 hex + motore LIGHT proprio: agganciare raffyca-theme day->LIGHT, aggiungere Notte rossa). Partenza/Performance (React compilato: Performance ricostruibile da Lovable; Partenza minificato = valutare).
- [FATTO 26/07 Tema — Traversata] Chrome tematizzata separando dai colori-mappa: sostituzioni fatte SOLO fuori da <script> e dai fill=/stroke= SVG (protetti), cosi' i colori dei layer Leaflet (isocrone, marker, batimetria) in JS restano intatti e semantici. Convertiti a var(): superfici (#0C1C30->panel, #0A1828->panel2, #0E2138->bg2, ecc.), bordi (#2C4763->sub), testo su accento (#07121F->dp), accenti standard (teal/amber/coral/ink/sub/green). Introdotti in :root i token mancanti (--panel/--panel2/--dp/--green). Lasciate INVARIATE le tinte categoriche degli overlay (#9fd8ff vir, #7BD88A tempo, #f78fb3, #c792ea, #9aa7ff, #8fe3ff, ecc.) + gradiente body agganciato a --bg2. Corretto effetto collaterale: <meta theme-color> riportato a colore letterale (non accetta var()). SW routing serve l'HTML network-first -> nessun bump. Verificato in jsdom: nessun errore introdotto; colori-mappa JS e categoriche confermati intatti.
  DA FARE: Meteo (270 hex + motore LIGHT proprio). Partenza/Performance (React).
- [FATTO 26/07 Tema — Meteo] Aveva un motore proprio a 2 stati (dark/light) con chiave separata raffyca_light e pulsante proprio, slegato dal tema globale. Integrato: LIGHT/NIGHT ora derivano da raffyca-theme (day=light riusato, migrazione sun->day); rimosso il pulsante tema del Meteo e il suo wiring (unico selettore in Impostazioni). CSS light rinominato body.light->html.day (identico in Giorno, applicato dal boot su <html> quindi senza flash). Aggiunta la NOTTE: base scura + chrome rosso-shiftata (superfici, testo, tab, bottoni, slider), mantenendo INVARIATI i colori semantici meteo (sole/nubi/pioggia/temporale nelle icone e nei grafici SVG, generati in JS via flag LIGHT) — come XTE, i colori sono informazione. SW meteo v4->v5. Verificato in jsdom (day/night/dark): nessun errore di init; logica boot confermata in isolamento.
  DA FARE: Partenza/Performance (React compilato).
- [FATTO 26/07 Meteo — Carte sinottiche DWD] Decisione: tutto il meteo (radar, DWD, burrasca) va nel Meteo, non in Carta (Carta=navigazione). Aggiunta vista di primo livello "Carte sinottiche (DWD)" raggiungibile dalla home (bottone), come il pianificatore passaggio. Contenuto: SITUAZIONE = analisi al suolo con fronti (bwk_bodendruck_na_ana.png); EVOLUZIONE = previsione ICON al suolo con stepper +36/+48/+60/+84/+108h (ico_tkboden_na_XXX.png). Etichettate distinte osservato/previsione. Immagini via <img> diretto (niente CORS; il SW meteo ignora il cross-origin, rete diretta); cache-busting con bucket 30 min; onerror -> placeholder "non disponibile". URL DWD verificati ancora validi (2026) via ricerca. SW meteo v5->v6. Verificato in jsdom: apertura vista, URL immagini corretti, stepper 5 voci, ritorno home OK.
  NOTA: non ho potuto rendere davvero le immagini (jsdom non carica immagini, web_fetch bloccato da robots DWD). Da confermare sul dispositivo che il DWD non blocchi l'hotlink via Referer. DA FARE Meteo: RainViewer (radar osservato, serve mini-mappa Leaflet nel Meteo); avvisi burrasca meteoam (fragile/CORS).
- [FIX+FATTO 26/07 Meteo — sfondo giorno + Radar RainViewer]
  FIX: in modalità Giorno lo sfondo restava scuro (i box erano bianchi). Causa: rinominando body.light->html.day, la regola dello SFONDO finiva sull'elemento <html> mentre il <body> ha il suo sfondo scuro che lo copriva (le regole .box sono discendenti, quindi ok). Corretto: sfondo su "html.day body" e "html.night body". (Gli altri moduli non hanno il baco: usano var(--bg) sul body, che segue il token.)
  RADAR: aggiunta vista "Radar temporali (osservato)" nel Meteo (RainViewer, endpoint pubblico senza chiave, ultime 2h a 10 min). Leaflet caricato in LAZY solo all'apertura (non appesantisce il Meteo per chi non lo usa). Mappa CARTO Voyager centrata su raffyca-pos (fallback Adriatico centrale), layer radar (color scheme 2, opacità .72, maxNativeZoom 7), timeline prev/play/next con timestamp e refresh 5 min, invalidateSize dopo apertura. Etichettato OSSERVATO, distinto dalla previsione modello della pagina Temporali. SW meteo v7->v8. Verificato in jsdom con Leaflet+RainViewer simulati: apertura, caricamento frame, timestamp, timeline, ritorno OK.
  DA FARE Meteo: avvisi burrasca meteoam (fragile/CORS).
- [FATTO 26/07 Cartelle WP e Tracce] Innestate nel gestore esistente della Carta (non un nuovo modulo). Modello: nuova chiave raffyca-folders [{id,name,kind}] con kind 'wpt'|'trk' (cartelle WP e tracce separate); ogni item ha un campo opzionale folder=id. Funzioni: crea (bottone 🗂＋ nelle schede, o "＋ Nuova" nell'overlay di modifica), assegna via select "Cartella" nell'overlay, lista RAGGRUPPATA per cartella con intestazioni (rinomina ✎ / elimina 🗑). Eliminare una cartella NON cancella gli elementi: tornano "senza cartella". Filtro esteso con opzioni Cartella/Senza cartella (agisce anche sul disegno mappa). Se non ci sono cartelle la lista resta piatta come prima (cartelle opt-in). ID cartella con suffisso casuale (niente collisioni). Carta senza SW proprio (hub network-first). Verificato: logica CRUD/raggruppamento/filtro in isolamento (7/7) + caricamento jsdom con Leaflet simulato (0 errori nel mio codice, raggruppamento nel DOM OK).
  MOB e TRAVERSATA di sistema: ancora rimandate come da tua scelta.
  [SPEC ICONE WP — pronto per il prossimo passo] Dal file caricato ho estratto il set che vuoi:
    Forme: Pallino, Crocino, Quadrato, Rettangolo, Triangolo, Rombo, Stella, Bandiera, Imbarcazione.
    Simboli nautici: Ancoraggio, Darsena, Ormeggio, Carburante, Divieto, Pericolo, Ristorante, Acqua, Boa, Servizi, Ufficio, Farmacia.
    Palette "Tag colore": Grigio #8FA0B3, Turchese #2DD7AB, Ambra #FFC857, Corallo #FB6767, Verde #4BD07F, Blu #5B86FB, Viola #C47FF0.
    Glifi SVG 24x24 (fill/stroke bianco) disponibili nel mockup. Da integrare come campo icona sul WP (oltre al tag colore già esistente).
- [FATTO 26/07 Icone WP] Estratte le 20 icone dal file caricato (era un bundle React gzippato: contenuto vero nel tag __bundler/template). Set: FORME (pallino, crocino, quadrato, rettangolo, triangolo, rombo, stella, bandiera, barca) + NAUTICI (ancora, darsena, ormeggio, carburante, divieto, pericolo, ristorante, acqua, boa) + SERVIZI (ufficio, farmacia). "Servizi" era un'intestazione di sezione, non un'icona. Ogni icona ha modalita' fill/stroke e stroke-width propri.
  Integrazione in Carta: oggetto WP_ICONS + iconSvg(id,color,size) che colora il glifo col colore del tag (currentColor); campo nuovo 'icon' sul WP (default 'pallino' = pallino pieno, retrocompatibile col vecchio cerchio). Selettore icone nell'overlay WP (20 bottoni, colore = tag corrente, si aggiorna al cambio tag). Marker su mappa passato da L.circleMarker a L.marker+L.divIcon con l'SVG nel colore del tag, alone bianco per l'attivo, ombra per leggibilita' sulle tile. Icona anche nella lista (al posto del pallino colore). Le tracce NON hanno icona: il campo e' nascosto per le tracce. Carta senza SW proprio -> nessun bump.
  Delivery nota: un primo tentativo con heredoc NON quotato aveva corrotto il file (la shell interpretava i $('...') come sostituzioni); ripristinato da zip cartelle e rifatto con heredoc quotato leggendo le icone da file.
  Verificato in jsdom (Leaflet simulato): iconSvg valido, 20 icone, glifo in lista, fallback pallino, picker 20 bottoni con selezione corrente, campo icona nascosto per tracce. Cartelle preservate.
- [FATTO 06/08 Carta — Fari a settori + "cosa vedo"] Nuovo layer Fari (toggle ✦ Fari in toolbar, come Batimetria/AIS). Dato: carta/fari.geojson UNICO (3110 luci Med IT, dedup per @id OSM; slim = nome/ref/settori/portata/caratteristica; 549 KB), lazy alla prima attivazione. DUE modalità (barra fariCtl): SETTORI = spicchi di settore veri per i 457 fari settoriali (colore-luce, raggio simbolico 500 m, portata reale on-tap con popup caratteristica; gate zoom >=12; disegno filtrato ai bounds vista; all-round NON disegnati, restano simboli OpenSeaMap). COSA VEDO = da raffyca-pos, rette barca->faro dei soli fari visibili (settore giusto + entro portata nominale), colore = colore visto, etichetta rilievo °T + distanza M. Geometria: settori dati "from seaward" -> arco disegnato col reciproco (+180); inSector con wrap sullo 0°; colori-luce fissi invariati tra i temi (come isobate), casing scuro sotto per leggibilità su Voyager chiara. Pane fariPane z360 (sopra griglia, sotto WP). Nessun SW proprio (Carta network-first dall hub) -> nessun bump. Verificato: node --check 3/3, geometria isolata 12/12, blocco isolato 10/10 (init/wiring/2 modalità/gate zoom/no-POS). NOTA OFFLINE: fari.geojson va scaricato UNA volta con rete; DA CONFERMARE che il SW hub lo tenga in cache per l uso offline in mare (come isobate nel SW routing). TODO: "cosa vedo" usa POS reale (niente barca trascinabile in Carta); portata geografica (curvatura) non applicata (solo nominale).

## In sospeso (backlog)
- Cruscotto DA FARE (sessione dedicata): layout a 5 campi (4 piccoli + 1 grande NON modificabile con bussola SVG 0-360 direzione attuale + rotta WP); rotazione bussola (nord su / prua su / rotta-WP su). Chiarire indicatori Stima/Stima K (serve screenshot). Valutare rendering campi testuali (coordinate/data/sole) nel formato numerico.
- [FATTO 14/07 Batch B] Traversata: (a) slider Efficienza vela 50-100% (deriva la velocita polare, viaggia al worker via STATE.polarEff); (b) export Diario CSV(;) + PDF offline (generatore PDF puro in JS, Courier WinAnsi, salvataggio diretto in Download - niente CDN); (c) intro sfoltita, tolto Nominatim dai crediti (ricerca rimossa).
- [FATTO 14/07 Batch C] Traversata #5: confermato = frecce mostravano solo l'ora di partenza mentre la rotta usa vento variabile. Aggiunto scrubber 'Ora vento in carta' (frecce a qualsiasi ora) + pallino bianco sulla rotta = dove saresti a quell'ora. Convenzione direzione verificata OK (deg2uv/uv2dir coerenti). >>> Sezione Traversata CHIUSA (A+B+C).
- [FATTO 14/07 Regata] RICOMPILATA dal sorgente Lovable (race-ready-buddy) con base RELATIVA -> 404 risolto. Ha laylines + sfondo colorato per distanza (zone-far/good/warn/danger). Reintegrati nel build: rf-topbar ProVela, hook __provelaRaceEnd (fine countdown), branding titolo. Redirect Lovable rimosso. Il sorgente NON usa localStorage (Regata autonoma, nessuna chiave da allineare).
- [FATTO 14/07 Impostazioni] Voce 'Fine countdown regata': Apri Cruscotto (default) / Non fare nulla / Apri URL (+campo). Scrive raceEndAction/raceEndUrl in raffyca-settings (merge-safe).
- [FATTO 14/07 Regata 404 vero] Causa: BrowserRouter con rotte assolute (/tactical) -> su GitHub Pages sottocartella cadeva su NotFound(404). Fix: HashRouter (rotte #/...), portabile in qualsiasi sottocartella. Bundle nuovo: index-BTGGqSu2.js.
- [FATTO 14/07 DEPLOY] Ora TUTTI i file vengono 'toccati' (data aggiornata) prima dello zip: risolve date vecchie e GitHub Desktop che non rilevava le modifiche (cache git size+mtime).
- DA DECIDERE (Regata estetica): il build usa il TEMA del sorgente Lovable (blu scuro + colori-zona), non il reskin LCD esatto della suite (teal #2BD9C4/#060e18). Se vuoi coerenza piena, allineo i token in src/index.css e ricompilo. Verificare anche su cellulare la dimensione box vs sfondo colorato.
- [FATTO 14/07 estetica] Traversata: overlay SVG spostato nell'overlayPane di Leaflet (coord. layerPoint) -> A/B e barca ORA sopra le isocrone; frecce vento riordinate SOPRA le isocrone e ingrandite; zoom mappa solo con modificatore (Cmd/Ctrl/Alt + scroll) per non zoomare scrollando la pagina (pinch invariato su mobile).
- [FATTO 14/07] Aggancio zona (prima passata): Carta = inquadratura iniziale per zona (ripiego se GPS assente); Traversata = area di calcolo per zona (Alto Adriatico usa l'area 'adriatico' pre-fatta; altre zone = riquadro on-device centrato sulla zona, A/B auto in mare). Coerente col Meteo.
- [FATTO 14/07 Batch A] Traversata: (a) riquadri zona LARGHI e SOVRAPPOSTI, costa on-device, Alto Adriatico incluso via ZONE_BOX (Caorle/Venezia/Po, Ravenna, Gargano ora coperti); (b) rimossa ricerca-per-nome (localita+area su misura): resta tocco carta + waypoint di Carta + area A<->B + auto-zona; (c) isocrone piu marcate.
  TRADE-OFF noto: riquadri piu larghi = griglia vento 11x8 piu grossolana. A/B auto per zona restano indicativi.
- [FATTO 14/07] Rimosso 'smacc8' dalla pagina di intro (resta tagline 'suite nautica').
- [FATTO 14/07] Impostazioni: ricerca barca ORC (feedback) + Cruscotto legge raffyca-polar (sottotitolo=nome barca).
- [FATTO 14/07] Zona onboarding (hub) allineata alla tendina di Impostazioni (stessa lista, niente piu testo libero).
- [FATTO 14/07] Lista zone canonica = 9 (tolte Mediterraneo occ./or.) allineata su hub + Impostazioni.
- [FATTO 14/07] Meteo: nomi vento delle zone nuove = rosa dei venti ufficiale (Tramontana/Grecale/Levante/Scirocco/Mezzogiorno/Libeccio/Ponente/Maestrale); Alto Adriatico invariato.
- [FATTO 14/07] Meteo zone-driven da raffyca-profile.zone: SPOTS_BY_ZONE (Alto Adriatico=8 validati; 8 zone x5 spot GENERICI da verificare). Occhielli agganciati alla zona.
- Traversata: asciugare testo pagina (TENERE diario verboso), export diario CSV+PDF, font diverso.
- Impostazioni: formato coordinate (°, °', °'", UTM); sun mode non cablata ai moduli.
- Meteo: VERIFICARE spot/tarature delle 8 zone non-Adriatiche (coordinate reali, ma ar e p generici); confidenza/nastro (5% ma stretto); intensità raffica; fulmine=CAPE.
- Regata: azione a fine countdown + voce Impostazioni; laylines; box con sfondo colorato per distanza linea.
- Performance: riverificare 404; feedback polare ORC trovata.
- [FATTO 14/07] Rename branding a "ProVela" (titoli, header, topbar, manifest, GPX creator, PWA). NON toccate: chiavi raffyca-*, raffyca.css, filenames raffyca-*.html, funzione collectRaffycaKeys.
  NOTA: "Raffyca" lasciato di proposito come NOME-BARCA d'esempio/fallback (placeholder onboarding e Impostazioni, default profBoat, header Cruscotto, fallback segui.html). Se Raffyca non e la tua barca, dimmi e lo cambio.

- [FATTO 17/07 Carta Nautica] (1) base carta: default "Nautica (chiara)" = CartoDB Voyager (poche strade, acqua chiara) + seamark OpenSeaMap sopra -> aspetto piu vicino a una carta; selettore basi (Nautica/Minimal/OSM). NB: niente tile ENC vero gratuito senza chiave/S-57, questa e la strada pragmatica. (2) Griglia meridiani/paralleli attivabile, passo FISSO 1° lat+lon, etichette N/S/E/W, ridisegno su moveend, cap a 80° per evitare migliaia di linee. (3) Checkbox "Zone venti" = rettangoli tratteggiati dei quadri d'unione (stessi ZONE_BOX di Traversata, copiati). (4) Doppio-click su nome WP/traccia in lista -> zoom sull'oggetto (WP setView z15, traccia fitBounds). (5) Creazione WP: click singolo NON apre piu il dialog; ora serve Alt-click (desktop) o pressione lunga/tasto destro (touch = contextmenu). (6) Disegno traccia in carta: modo "Traccia" (tocchi = vertici, ↶ annulla punto, Salva chiede nome, calcola dist NM). (7) Misura: modo "Misura" (2 tocchi) -> distanza NM + rotta 000°. Modalita in mutua esclusione, doubleClickZoom disabilitato in draw/misura, griglia/zone in pane sotto i marker (pointer-events none).
- Memo v2.0 Carta (NON ora): organizzare WP e tracce in gruppi/cartelle attivabili e selezionabili (oltre ai tag colore attuali).

- [FATTO 17/07 Carta fix+AIS] (fix) etichette meridiani non visibili: cadevano sul bordo inferiore della carta (overflow:hidden) -> rialzate dentro l'area (divIcon 70x14, ancora parametrica; paralleli a sx, meridiani centrati e sollevati dal fondo). (fix) box zone venti piu evidente: weight 2.4, opacity .95, tratteggio 9/4, lieve riempimento ambra .05. (NEW) AIS live via AISstream.io: pulsante 📡 AIS, WebSocket wss://stream.aisstream.io/v0/stream, chiave utente in raffyca-ais-key (prompt al primo avvio, pulsante "Chiave" per cambiarla). Sottoscrive il riquadro visibile (pad 0.3), ri-sottoscrive/riconnette su moveend (debounce 800ms), marker freccia verde orientata a COG/TrueHeading, tooltip nome/SOG/COG, pulizia navi ferme da >10 min, spegnimento chiude il socket. NB: nessun tile ENC gratuito; copertura AIS dipende dai ricevitori community.
- Nuova chiave localStorage: raffyca-ais-key (API key AISstream.io dell'utente, solo locale).
- [FATTO 18/07 Batimetria+Costa] Traversata: (1) costa GSHHG full-res riportata al 40% (era 8%: isolette a triangolo) -> mediterranean_land_10m.geojson, 2459 isole; maschera Adriatico rigenerata al 40% (193 anelli). (2) INSERITE ISOBATE EMODnet: cartella isobate/ con 9 file per zona (isobate_<slug>.geojson) allineati ai ZONE_BOX; filtrate (rumore di piattaforma via, contorni profondi chiusi e piccoli scartati oltre -100). Toggle 'batimetria' nel blocco toggle; caricatore per-zona (fetch da profilo raffyca-profile.zone); linee colorate per quota; etichette = tocco su isobata (mostra m) + poche permanenti (2 per quota su -10/-50/-100/-500). SW bumped a raffyca-rt-v2 (forza refresh costa; isobate in cache-first on-demand). NB: EMODnet = dato scientifico, non nautico.
- [FATTO 18/07 Carta+PWA] (1) Isobate anche in Carta Nautica (carta/index.html): pulsante 'Batimetria' in toolbar; carica il file della zona sotto il centro mappa (isoZoneAt sui ZONE_BOX), si aggiorna su moveend; stesse colori/etichette (tocco + poche permanenti); fetch da ../routing/isobate/. (2) PWA sulla HUB: index.html non era installabile (mancavano manifest, service worker, icone). Aggiunti manifest.webmanifest (radice), sw.js (radice, provela-hub-v1: navigazione network-first + shell cache-first), icone pwa-192/512/maskable + apple-touch (riuso da partenza/), e nel head link manifest + theme-color + registrazione SW. I sottomoduli mantengono i loro SW (scope più specifico).
- [FATTO 18/07 Fix batimetria UI] Carta+Traversata: (1) flicker risolto (isoRefresh non cancella piu' quando il centro esce dalle zone); (2) tocco facilitato: doppio strato geoJSON, uno invisibile spesso 12px per il click + uno sottile colorato non-interattivo; (3) etichette ora includono -20 m; (4) LEGENDA colori-profondita' (div #isoLegend, mostrata col toggle). 
- [BUG NOTO batimetria dati] Artefatto: contorni profondi falsi (-100/-200) che seguono la costa in acque basse (es. Delta del Po, dove il fondale reale e' 5-28 m). Causa: nel calcolo isobate riempivo i NaN (terra/vuoti) con la MEDIANA del tile prima di smussare; per i tile profondi (Tirreno/Ligure) il cui bordo tocca coste adriatiche, questo iniettava valori profondi sulla terra -> contorni spuri a riva. FIX validato: smussatura NaN-aware (normalized convolution), nessun riempimento -> niente iniezione nei NaN. RICHIEDE riprocessamento dei 7 grid grezzi EMODnet (cancellati per spazio): l'utente li ricarica dal suo Dropbox. Finche' non riprocessati, le isobate profonde vicino costa in Adriatico sono inaffidabili.
- [FATTO 18/07 Batimetria v2 CORRETTA] Riprocessati tutti e 7 i grid EMODnet con pipeline NaN-aware (smussatura per convoluzione normalizzata, nessun riempimento della terra) -> risolto alla radice l'artefatto dei contorni profondi falsi a riva. Verifica puntuale su tutti i tile: 0-1 artefatti su migliaia di vertici profondi. Filtro piu' severo: aree chiuse piccole rimosse anche a -50/-100 (monti sottomarini = rumore). 9 pacchetti zona rigenerati (drop-in in isobate/). Etichette aumentate: quote [-5,-10,-20,-50,-100,-200,-500], fino a 3 per quota, in Traversata e Carta. Archivio: isobate_ITALIA_v2 (shapefile+geojson+png).

## Deploy
GitHub Desktop. Contenuto dello zip va alla RADICE del repo (zip "flat"). Path relativi
= nome repo irrilevante. MAI cancellare la cartella nascosta .git.
- [FATTO 20/07 Traversata batch] Interfaccia+calcolo su raffyca-traversata-map.html (SW routing bump raffyca-rt-v2 -> v3). (1) PERSISTENZA scelte di pagina: nuova chiave di modulo raffyca-traversata-ui (NON condivisa) che salva A/B, ora partenza, motore+velocità, evita vento forte+soglia, buffer costa+valore, perdita manovra, efficienza, e tutti i toggle (OpenSeaMap/costa/vento/isocrone/toponimi/batimetria/segui). Ripristino a inizio boot; A/B riapplicati clampati all'area attiva anche dopo initZoneArea (zona da profilo, async). saveUI() gganciato in computeRoute + listener delegato per i toggle di sola vista. (2) LEGENDA batimetria spostata DENTRO .mapwrap (bottom-left, pointer-events none): prima era figlia del body e copriva il testo pagina. (3) Pulsante "✥ Muovi A/B": di default pin NON trascinabili e tocco carta NON sposta (evita spostamenti accidentali su touch); il pulsante attiva la modalità (drag + tocco), evidenziato teal, cursore mirino. Dropdown waypoint e "Area su A↔B" restano sempre attivi. (4) FIX "vecchia suddivisione vento": era R_CACHE stantia (isocrone/rotta dell'area precedente) ridisegnata nella finestra async prima che il worker restituisse la nuova rotta. Risultato taggato per area (worker echo c.area=d.area; routeSync R_CACHE.area=FIELD.area); buildOverlay disegna rotta/isocrone/manovre/posizione solo se R.area===FIELD.area (routeOK); linea diretta sempre da STATE.A/B. Anche SW bump per spurgare build vecchi in cache. (5) ISOCRONE ammassi: disegnate a intervalli di tempo ~uniformi (isoStep=max(0.5, eta/10)) invece che a ogni passo (dt=0.4h -> 2-3 linee/ora addossate); niente grumi vicino ad A/B o costa. (6) FIX "Lontano dalla costa" zig-zag/nessuna soluzione: se A o B cade DENTRO il buffer la rotta non poteva chiudere. route() ora esenta dal buffer il corridoio immediato attorno ad A e B (CORR=max(coastBuf,0.8) NM): parti/arrivi sottocosta, offshore preservato in mezzo. + messaggio nel readout quando la rotta non chiude per il buffer (invita a ridurlo/allontanare A-B) o quando un estremo è entro il buffer (avvicinamento forzato).
- Nuova chiave localStorage: raffyca-traversata-ui (stato UI del modulo Traversata, solo locale, di modulo).
- [FIX 20/07 hotfix isocrone] Le isocrone sparivano: la spaziatura le filtrava per tempo (nodo.t), ma il risultato del worker alleggerisce i layer a soli {lat,lon} (niente .t) -> tutti i layer saltati. Corretto: spaziatura per INDICE di layer (passi a durata uniforme => equivale al tempo), nessuna dipendenza da .t. Test jsdom esteso al caso worker (layer senza .t). SW routing v3 -> v4.

- [FATTO 26/07 Cruscotto — Segui traccia attiva] Il Cruscotto ora segue la traccia attiva (raffyca-active-track, gia' impostata dalla Carta col bottone ◎). I punti traccia diventano waypoint sequenziali: brg/dtw/ttg puntano al PROSSIMO punto (bersaglio), XTE calcola lo scarto sul segmento corrente A(punto k)→B(punto k+1) — prima era null perche' mancava l'origine della tratta. Geometria PORTATA di peso dal modulo XTE (proiezione piana locale equirettangolare, fCross firmato, avanzamento segIdx quando il piede supera il segmento t>1) cosi' i due moduli concordano sul segno. Avanzamento MONOTONO in avanti (niente ping-pong alla boa); su avvio/cambio traccia aggancio globale al segmento piu' vicino (followSeed). Convenzione XTE = identica a XTE: signed>0 = sei a destra della rotta -> tag \u25c4 Sx (vira a sinistra); signed<0 -> Dx \u25ba. Numero XTE con colore severita' (|xte| <15 teal / <40 ambra / else coral). Barra in basso (recWp) mostra ▸ nome · k/N · X NM al fine; tap apre il foglio "Segui traccia": Inverti senso, Riaggancia, Smetti di seguire. Topbar: la traccia attiva ha priorita' sul WP singolo nella riga di stato. INDIPENDENTE dal layout (funziona in 2/3/4/5/8; la freccia WP della bussola punta al prossimo punto). Direzione avanti/indietro supportata ("al contrario" per rifare a ritroso una traccia registrata). NUOVA chiave di modulo raffyca-follow-dir ('fwd'|'rev', locale, si resetta ad 'fwd' quando cambia la traccia attiva). Nessun WP singolo toccato quando segui: se non c'e' traccia attiva, comportamento invariato (XTE torna null). Cruscotto senza SW proprio (hub network-first): nessun bump. Validato: node --check su tutti gli script inline; smoke test geometria estratta dal file (aggancio, suf NM, avanzamento monotono, nessun salto di WP a passi fini [2,3,4,5,6], cap all'ultimo segmento, segno XTE E/O, inversione senso, traccia <2 punti scartata); boot completo jsdom (0 errori: eff/paint/renderFollowBar/foglio/stop).
  RESTA (prossimo zip): XTE — disegnare la polilinea della traccia attiva SOTTO il bersaglio (auto-load da raffyca-active-track). Carta — eventuale rietichetta "◎ traccia attiva" in "segui" (facoltativo).

- [FATTO 26/07 Schema grafico traccia — Cruscotto + XTE] CRUSCOTTO: 4a modalita' bussola "TRACCIA" (tap ciclo NORD->PRUA->WP->TRACCIA->NORD; persistita in raffyca-dash.cmode, nessuna whitelist). Mini-mappa NORD in alto: sagoma reale della traccia dalla proiezione locale gia' costruita dal follow (fatto attenuato --dim / da-fare acceso --teal), estremi, punto attivo in ambra (anello+pallino), barca come triangolo orientato al COG (pallino se manca prua/COG), readout basso k/N + XTE con lato (◄Sx / Dx►). Placeholder "nessuna traccia attiva" se il follow e' spento. Decimazione della polilinea per tracce lunghe (past 150 / go 200 punti). Visibile solo nei layout con bussola (3 e 5). XTE: polilinea della rotta caricata disegnata SOTTO il bersaglio (nuovo <g id=trackMini> come primo figlio dell'SVG, dietro freccia e anello): fatto/da-fare, punto attivo in ambra, pallino barca; fit su viewBox 400 con margine, colori via CSS var (tema-aware), decimata. Disegnata gia' al caricamento rotta (renderMini in rebuildProjection) e ad ogni render. NUOVO bottone "Traccia attiva" accanto a Carica GPX: carica raffyca-active-track come rotta XTE (stessa pipeline del GPX: baseRoute/route/segIdx/rebuild/recompute), cosi' XTE e Cruscotto mostrano lo STESSO percorso e lo stesso XTE (risolve l'incoerenza segnalata). Opt-in: il default GPX/embedded resta. SW xte-v1 -> xte-v2 (cache-first, namespaced 'xte'). Cruscotto senza SW: nessun bump. Validato: node --check tutti gli script + sw; jsdom Cruscotto (trackSVG valido, readout 4/9 · 18m ◄Sx, placeholder, campionamento) e XTE (mini all'init dalla rotta embedded, bottone -> "6 punti · Molo", render con punto attivo + XTE 22.2m Sx, indSvg valido). Assunzione presa: mini-mappa NORD in alto (non prua in alto) — se la vuoi course-up si cambia.
  NOTE: la scelta Q2 iniziale era "solo polilinea"; ho aggiunto anche il bottone traccia-attiva perche' senza allineare la sorgente XTE resterebbe su rotta diversa dal Cruscotto (coerenza). Se non lo vuoi, e' un bottone da togliere.

- [FATTO 26/07 Traversata — fix orizzonte 28h + ETA] BUG orizzonte: il motore isocrone aveva MAX=70 passi x dt=0.4h = 28h FISSE (riga 571), slegato dalla lunghezza del campo. Su passaggi lenti (vento leggero / bassa efficienza) B non veniva raggiunto entro 28h -> "[B non raggiunto]" anche con 62 NM. NON era fine-vento. FIX: MAX ora legato alle ore reali del campo -> hAvail=FIELD.slices.length-1; MAX=min(240,max(70,ceil((hAvail-dep)/dt))). Copre fino a ~fine campo (96h col live), minimo 28h (demo=24 slice), cap 240 passi (~96h) per non affogare il mobile. Il worker stringifica route() (r.669) quindi il nuovo MAX si propaga a worker e sync. Scan "Trova il miglior orario": finestra partenze da 14h a 48h (r.771, Math.min(48,...)) — deciso con Sergio: nessuno pianifica la partenza a 3 giorni, e cosi' lo scan resta economico anche col nuovo orizzonte. BUG ETA "27h 60m" (r.759): mancava il riporto dei 60' nel readout (updateReadout); aggiunto if(mm===60){hh++;mm=0}. Le altre fmt tempo (fmtH/clk/fmtElapsed) il riporto ce l'avevano gia'. SW routing = navigazione network-first (r.54) -> nessun bump. Validato jsdom contro il motore reale: campo 96 slice + A/B a 270 NM con vento 5kt -> finished=true eta=60.2h (prima si fermava a 28h); campo 24 slice stesso passaggio -> finished=false eta=28.0h (orizzonte legato al campo, conferma la causa); readout eta=27.996 -> "28h" (niente "60m"); scan cap=48 confermato. node --check su tutti gli script OK.
  ACCANTONATO (Sergio): Routing "Evita aree" — rimandato. PROSSIMO: lettura vocale + GPS.

- [FATTO 26/07 Impostazioni — Cielo GPS] Nuova sezione stato ricevitore GPS (il browser non espone lo sky-plot: solo Geolocation API). Bottone Attiva/Disattiva (serve un gesto utente per il permesso, soprattutto iOS); watchPosition enableHighAccuracy, maximumAge 0, timeout 15s. Mostra: fix (pallino grigio/verde + testo), Accuratezza ±m con grado (ottimo<10 / buono<25 / discreto<50 / scarso, colore proprio), Aggiornato (eta del fix, 'Fix vecchio' oltre 15s), Lat/Lon in gradi-primi, Altitudine ±m, Velocita' (m/s->kn), Rotta COG (solo se speed>0.3kn, evita jitter da fermo), Sorgente. Errori mappati: permesso negato / non disponibile / timeout / non supportato. Foreground: si spegne con Disattiva (nessun wake lock, e' diagnostica). Diagnostico e isolato: NON scrive raffyca-pos (di altri moduli). CSS namespacizzato .gps-* (var --font-mono, hsl(var()/a), 3 temi). Impostazioni senza SW -> nessun bump. Nome tenuto 'Cielo GPS' come da backlog, con sottotitolo onesto sul no-skyplot. Validato jsdom con geolocation stub: attivazione, formattazione DM, kn, soglie qualita', gating COG per velocita', errore permesso, stop+clearWatch. node --check tutti gli script OK.
  PROSSIMO: lettura vocale configurabile in Impostazioni (max 4 grandezze + intervallo).

- [FATTO 26/07 GPS rename + Lettura vocale] Impostazioni: "Cielo GPS" -> "Stato GPS"; tolta la frase sullo sky-plot.
  LETTURA VOCALE (versione semplice, come da Sergio): tasto icona altoparlante nella recbar del Cruscotto che accende/spegne la lettura a rotazione dei campi ATTUALMENTE a schermo (ASSIGN[N], qualunque layout 2/3/4/5/8; la bussola non e' un box valore, esclusa). Legge titolo+valore+unita': es. "SOG 4,5 nodi", "COG 45 gradi". Niente menu di scelta. Rotazione con intervallo regolabile in Impostazioni (nuovo campo 'Intervallo lettura vocale' 2-10s, chiave raffyca-settings.voiceInterval merge-safe, default 3). Dettagli: SpeechSynthesis lang it-IT; valore normalizzato (045->45, '.'->',', simboli letti); unita' a parole (kt/kn->nodi, km/h->chilometri orari, gradi, miglia, metri, percento); campi a '—' saltati; primo speak 'Voce attiva' nel gesto (sblocca iOS + conferma); pausa/ripresa su visibilitychange; TTS diagnostico, non tocca altri stati. Nessun SW nei due moduli -> nessun bump. Validato jsdom (speechSynthesis stub): ttsSec da voiceInterval, frasi "SOG 4,5 nodi"/"COG 45 gradi"/"Vento reale 14,2 nodi", virgola decimale, zero iniziale rimosso, vuoti saltati, on/off pulito. node --check OK su Cruscotto e Impostazioni.

- [FATTO 26/07 96h + tweak voce] Chiarito il vero limite: la previsione era 48h per DATI, non per cache.
  TRAVERSATA: il fetch era forecast_days=2 (48h). Portato a forecast_days=4 (96h). parseField usa H=times.length -> il campo diventa ~96 slice e l'orizzonte (gia' legato a slices.length) arriva a 96h da solo. Network-first -> nessun bump. Validato: forecast_days=4 nel file; il fix orizzonte precedente resta.
  METEO: il fetch era gia' forecast_days=3 (72h) ma la riga 603 TRONCAVA a 48h -> quello era il tetto, non la cache. Ora: fetch forecast_days=4, troncamento a 96, demo genSpot a 96 punti (interp alimentato con i*47/95 per non estrapolare valori assurdi), grafici auto-scalano (X(i,n) e colW usano n=DATA.length). ALLERTE TEMPORALI tenute a 48h di proposito (oltre ~48-72h il rischio temporale e' rumore a bassa confidenza; e' una feature di sicurezza) -> loop computeAlerts limitato a NOW+48, testo allerta invariato '48h'; il nastro/meteogramma vento invece mostra 96h. BUMP SW raffyca-meteo-v8 -> v9 OBBLIGATORIO: il Meteo ha SW cache-first, per questo 'restava a 48h anche dopo aver svuotato la cache' (su Safari il cache-first sopravvive allo svuota-cache; serve il bump o la cancellazione dati sito). Validato jsdom: demo 96 punti tutti finiti/sensati, interp(0..47) ok, nessun errore di boot.
  VOCE: icona altoparlante 18->23px (era troppo piccola); intervallo default 3->10s, range 2-10 -> 3-30 (Cruscotto ttsSec e Impostazioni allineati).
  NOTA DEPLOY: dopo il push, su Safari/PWA il Meteo si aggiorna col nuovo SW v9 (o cancellando i dati del sito). Traversata e' network-first: basta il reload online.

- [FATTO 26/07 Barra trasversale unificata] La rf-topbar era DIVERGENTE tra i moduli: il Cruscotto aveva la versione nuova (temizzata, con traccia attiva) mentre Meteo/Carta/XTE/Impostazioni ecc. avevano una versione vecchia (colori hex fissi non temizzati, solo WP). Definita UNA barra canonica e stampata identica in tutti i 12 file che la contengono (anchor, carta, cruscotto, impostazioni, index(menu), info, meteo, partenza, performance, posizione, routing/traversata, xte). Layout nuovo (tolti orologio e data su richiesta di Sergio): [home] [triangolo+nome barca] [pallino GPS] [modello.polare] --spacer-- [WP o traccia attiva]. Campi: nome barca da raffyca-profile.boat; polare come prima (modello + 'pol X', ambra/coral se integrata/generica); stato = REC GPX > traccia attiva > WP attivo (priorita'); pallino GPS colorato dalla freschezza di raffyca-pos.ts (verde <25s, ambra <15min o senza ts, grigio nessun dato). Dettagli robustezza: CSS con var(--token,#fallback) cosi' e' temizzato dove i moduli definiscono i token e non si rompe dove non li hanno; href 'home' PRESERVATO per file (# nel menu, index.html in info, ../ negli altri); delimitatori a commento come confine, con fallback su </script> per partenza (che non aveva il commento di fine); anchor aveva un commento d'inizio diverso, normalizzato. Aggiunto ts:Date.now() ai writer di raffyca-pos (cruscotto, carta x2, anchor, posizione) perche' prima salvavano solo {lat,lon} e la freschezza non era calcolabile; retro-compatibile. BUMP SW cache-first di cui e' cambiato l'HTML: anchor-v4->v5, raffyca-meteo-v9->v10, xte-v2->v3. Cruscotto/Carta/Impostazioni/hub/info/routing = network-first o SW radice -> nessun bump. Validato: node --check su tutti gli script dei 12 file, barra integra (1 apertura+1 chiusura) ovunque; boot jsdom del Meteo (che aveva la barra vecchia) con dati finti -> barca 'Raffyca'+triangolo, GPS verde 'fix 1s fa' -> ambra a 2min -> ambra senza ts, polare 'First 36.7 · pol ORC', stato 'WP: Molo Audace' e traccia che prevale, orologio rfDt rimosso.

- [FATTO 26/07 WP attivo cliccabile + chiarita priorita'] Priorita' navigazione Cruscotto (righe 655-673): se c'e' traccia attiva con >=2 punti, FOLLOW.on vince e brg/dtw/ttg/xte + bussola puntano alla TRACCIA; il WP e' ignorato per la nav e resta dormiente. Solo senza traccia attiva il WP guida. Nessun conflitto: possono essere entrambi impostati, ma la traccia ha sempre la precedenza (anche nella barra alta: REC>traccia>WP). Chiesto da Sergio.
  NUOVO: WP attivo ora mostrato nella barra bassa #recWp quando NON si segue una traccia (⚑ WP: <nome>, cliccabile), come per la traccia. Tap -> nuovo foglietto #wpsheet (attenzione: #wsheet era gia' il vento manuale, quindi #wpsheet) con 'Disattiva waypoint' che azzera raffyca-active-wp. renderFollowBar esteso: traccia (FOLLOW.on) -> WP (wpTarget) -> vuoto. Click #recWp: se FOLLOW.on apre foglio traccia, altrimenti apre foglio WP. Nessun CSS nuovo (.rec-wp b gia' teal). Cruscotto servito dal SW radice network-first -> nessun bump. Validato jsdom: WP in bar cliccabile, sheet apre, Disattiva azzera e svuota la bar; con traccia+WP entrambi attivi la bar mostra la TRACCIA e il click apre il foglio traccia (priorita' confermata). node --check OK.

- [DEBUG TOTALE 26/07] Passata di validazione su tutta la suite, nessun fix necessario. Controllato: 42 script inline in 17 HTML (node --check tutti OK); 7 sw.js + med_area_data.js + 2 workbox + 2 bundle Vite index (OK); 27 JSON/GeoJSON/webmanifest (tutti validi con json.load); barra rf-topbar integra in tutti i 12 file (1 apertura + 1 chiusura, ID rfBoat/rfGps/rfPol/rfStatus unici per file), zero ID duplicati, zero riferimenti orfani dopo la rimozione orologio/data (rfDt/rfSun/tickClock/elDt/elSun/sunDay = 0; i sunTimes/hhmm rimasti sono funzioni autonome di anchor e cruscotto, legittime); versioni SW coerenti (anchor-v5, meteo-v10, xte-v3); manifest referenziati tutti esistenti; body padding-top:40px una volta per file. Regressione feature (tutte verdi): Traversata orizzonte 96h (campo 96->finished eta 60.2h, campo 24->cap 28h, ETA rollover, scan 48), Meteo demo 96 punti sani, Voce ('SOG 4,5 nodi', ttsSec da voiceInterval, virgola, zero rimosso), Barra su Meteo (barca+GPS ok/old+polare+stato, orologio via), WP cliccabile + priorita' traccia, pannello Stato GPS. Boot jsdom di tutti i 12 moduli: la barra si inizializza ovunque (gli onerror residui su carta/anchor/routing sono limiti degli stub jsdom - Leaflet control.layers/Icon.extend, canvas non installato - non bug, e avvengono dopo l'init barra).

- [FIX 27/07 Android: recbar Cruscotto invisibile] Sintomo: su Android la barra inferiore (registra traccia / marca WP) non appariva; su desktop ok. Causa: la barra alta aggiunge body{padding-top:40px}, togliendo 40px all'altezza utile; il body e' un flex column height:100dvh (border-box) con overflow:hidden. La griglia usa righe 1fr, che in CSS Grid hanno minimo implicito auto (min-content): su viewport corti (Android con barra URL) le righe non scendono sotto il contenuto, la griglia diventa piu' alta di <main> (che aveva min-height:0 ma NON overflow), trabocca verso il basso e COPRE la recbar. Su desktop, viewport alto -> ci stava ancora, per questo si vedeva solo su mobile. FIX (solo Cruscotto, CSS): righe griglia da 1fr a minmax(0,..) in tutti i layout (n2/n3/n4/n5/n8) cosi' le celle si restringono e la griglia non supera mai main (i contenuti slot hanno gia' overflow:hidden -> clip pulito); overflow:hidden su main come rete di sicurezza; fallback height:100vh prima di 100dvh per WebView Android vecchie senza dvh. Nessun bump SW (Cruscotto = SW radice network-first). Validato: node --check OK, boot jsdom pulito (barra/WP/voce intatti). NOTA: il layout non e' verificabile in jsdom (niente motore di layout) -> da confermare a bordo su Android.

- [FIX 27/07 SW radice: Cruscotto stantio a intermittenza] Sintomo: recbar 'appare e poi sparisce'; con ?v=N appare sempre. Diagnosi: il fix CSS e' corretto (confermato da ?v=3), il problema e' il SERVING. Il Cruscotto non ha SW proprio: e' controllato dal SW radice (./sw.js, registrato dall'hub, path relativo -> regge anche col repo rinominato). Navigazione = network-first, ma (a) il fetch passava dalla cache HTTP di GitHub Pages (max-age ~10min) e a volte ridava il vecchio ri-salvandolo in SHELL; (b) su rete lenta/assente ripiegava sulla SHELL che poteva contenere il vecchio. Da qui l'intermittenza. FIX root sw.js: VERSION provela-hub-v2 -> v3 (l'activate cancella la SHELL vecchia col Cruscotto stantio) + fetch di navigazione con {cache:'reload'} (salta la cache HTTP, network-first prende davvero l'ultimo da Pages; offline -> catch -> cache come prima). Vale per tutti i moduli serviti dal SW radice (Cruscotto/Carta/Impostazioni/hub/info/posizione); Meteo/Anchor/XTE hanno SW propri con scope piu' specifico, non toccati. NOTA: il sito non e' piu' su smacc8.github.io/raffyca/ (404); percorso cambiato, ma la registrazione ./sw.js e' relativa quindi ok. node --check OK.

- [FIX 27/07 PWA standalone: recbar dietro la nav bar Android] Isolato con repo NUOVO (provelaver1def): dal browser la recbar c'e', da PWA installata sparisce -> NON e' mai stata cache, e' la modalita' standalone. Con viewport-fit=cover la PWA disegna edge-to-edge dietro le barre di sistema; la recbar (in fondo) finisce dietro la barra di navigazione Android. env(safe-area-inset-bottom) su Android e' inaffidabile (spesso 0) quindi non compensa. FIX: rimosso viewport-fit=cover dal viewport del Cruscotto -> la PWA confina il contenuto nell'area sicura, recbar sopra la nav bar. Solo Cruscotto (unico con barra fissa in fondo critica); gli altri moduli scrollano e restano cover. Da confermare a bordo su PWA Android (jsdom non simula standalone/safe-area). Se non basta: reserve fisso in @media (display-mode:standalone).

- [FIX 27/07 recbar spostata IN ALTO] Dopo che il problema PWA-standalone persisteva (recbar dietro la nav bar Android anche senza viewport-fit=cover), scelta di Sergio: spostare la recbar in alto. Ora ordine Cruscotto: rf-topbar > header > toolbar > RECBAR > griglia. La recbar non tocca piu' nessun bordo occupato dalle barre di sistema (status bar in alto coperta da rf-topbar+header; nav bar in basso non la sfiora piu') -> non puo' piu' sparire. CSS: tolto env(safe-area-inset-bottom) dal padding (inutile in alto), border-top -> border-bottom. Mantenuto viewport-fit=cover rimosso (conservativo, tiene tutto nell'area sicura). JS invariato (stessi id, solo spostati nel DOM) - validato WP/follow/voce. node --check OK.

- [FATTO 28/07 Performance riscritto VANILLA - addio bundle Lovable] Il modulo Performance era un bundle React/Lovable (assets minificati, CSS interno chiuso, SW proprio vite-pwa). Riscritto da zero come modulo vanilla performance/index.html, assemblato da build_perf.py che riusa boot-tema e rf-topbar VERBATIM da cruscotto (regex sui marcatori), token :root/.day/.night identici alla suite, niente <link manifest> e niente SW proprio (come cruscotto -> servito dal SW radice network-first). Quattro schede: INSERIMENTO (ex Log Dati), POLARE (ex Grafico Polare), TRACCIA POLARE (NUOVA), CONVERTI (ex Conversione).
  INSERIMENTO: gruppi REALE (TWA/TWS, teal) e APPARENTE (AWA/AWS, ambra) come coppie alternative; selettore sorgente 'Inserisco il REALE / l'APPARENTE'; definiti STW e Mura l'app calcola l'altra coppia dal vivo (formule vettoriali standard). Record salvati in raffyca-perf-log (nuova chiave); export CSV del log.
  POLARE: legge la polare condivisa raffyca-polar (schema {twa,tws,data}); disegna la curva simmetrica (una sola traccia teal, non piu' due) e calcola VMG bolina/lasco; se manca -> empty state che rimanda a Traccia polare/Impostazioni.
  TRACCIA POLARE: nuvola di punti (TWA,STW) accumulata su piu' USCITE (pannello Sessioni includi/escludi + elimina, in raffyca-polar-cloud) filtrata per FASCIA TWS; inviluppo grezzo dei massimi (ambra) e polare DEFINITIVA arrotondata (P90 per settore da 10 gradi, non il picco -> robusto agli outlier; doppio smoothing pesato + Catmull-Rom; settori con <3 punti esclusi). Export CSV della definitiva e 'Salva come polare della suite' che assembla le fasce salvate (raffyca-polar-def) nella matrice raffyca-polar col meta source:campo. Import CSV v1 = conteggio punti validi (aggancio alla nuvola vera quando avremo il formato CSV dello strumento). Overlay riferimento ORC opzionale (tratteggiato). Nuvola al momento demo (generata) finche' non arriva il flusso reale CSV/NMEA.
  CONVERTI: due riquadri apparente<->reale con angolo CON SEGNO (- sinistra, + dritta), script dedicato pulito.
  BUG CORRETTI rispetto allo scaffold precedente (le 'molti errori'): (1) in INSERIMENTO il toggle mostrava/nascondeva dei div segnaposto vuoti invece degli input veri -> in modo apparente restavano visibili sia input che calcolato; ora il toggle agisce sugli input reali (#i-twa/#i-tws/#i-awa/#i-aws) e sui display calcolati. (2) CONVERTI aveva un blocco rotto (handler legati a #c1-out/#c2-out inesistenti) che uno .replace() fragile avrebbe dovuto togliere: rimosso del tutto, resta un solo script CONVJS corretto.
  DEPLOY (trappola SW): il vecchio Performance Lovable registrava un SW con scope /performance/; cancellare i file NON lo de-registra sui client -> continuerebbe a servire la vecchia app (classico 'sito vecchio dopo il push'). Aggiunto nel nuovo index.html uno script di migrazione che de-registra i SW con scope /performance/ e cancella le cache orfane (workbox/precache/vite/-perf-/performance), lasciando intatta la SHELL radice provela-hub-v3. Rimossi dalla cartella tutti gli artefatti bundle (sw.js, workbox, assets/, manifest, robots, favicon, placeholder, icon-512): resta solo performance/index.html, come cruscotto.
  CONTRATTO localStorage - nuove chiavi: raffyca-perf-log (log rilevamenti), raffyca-polar-cloud (nuvola per sessioni), raffyca-polar-def (definitive per fascia). raffyca-polar scritto con lo schema esistente (verificato contro cruscotto/impostazioni/routing: {twa,tws,data,meta,ts}, data[twaIdx][twsIdx]).
  VALIDATO: node --check su tutti e 5 gli script inline OK; smoke jsdom (21 check verdi): conversione reale->app->reale coerente, percentile P90, definitiva valida/ordinata/settori scarsi esclusi, polarTarget su schema reale interpola giusto (0 deg = 0), tab switch senza errori + SVG disegnato, 3 sessioni renderizzate, INSERIMENTO input reali visibili/nascosti nei due modi, salva record con apparente calcolato corretto (TWA45,TWS12,STW6 -> AWA 30.36), 'Salva come polare' produce raffyca-polar con schema e matrice coerenti.
  ETICHETTA RISCHIO: TOCCA IL LAYOUT (modulo nuovo intero) -> prova a bordo su Android/iOS. Da confermare sul dispositivo: leggibilita' testo in tema GIORNO (Sergio l'ha trovato un filo piccolo nel prototipo: al build valutare corpo +1 e secondari piu' scuri in html.day), resa SVG della polare, PWA/standalone.
  APERTO: formato CSV reale dello strumento (parser da tarare, ora conta solo i punti); STW vs SOG nei dati importati (corrente); se 'Salva come polare' debba pretendere piu' fasce prima di scrivere raffyca-polar (ora scrive anche con una sola fascia); collegamento NMEA (placeholder).

- [FIX 28/07 Performance - revisione post-prova Sergio] Corretti i problemi segnalati sul modulo vanilla.
  POLARE (scheda): ridisegnata come l'originale Grafico Polare. Diagramma BICOLORE (verde mura dritta a sinistra, coral mura sinistra a destra, curva simmetrica specchiata da raffyca-polar), CERCHI/assi ora su var(--sub) con opacita' (prima var(--dim), invisibili sul pannello scuro) + etichette scala (1..maxV) ed etichette angolari (30..150 su entrambi i lati), PALLINI VMG su bolina e lasco (verde/coral sui due lati), BARCHETTA ORIENTATA sulla rotta dell'ultimo punto (transform rotate: dx -> -TWA, sx -> +TWA) e PUNTO PRESTAZIONE ATTUALE (pallino ambra 'ultimo punto' con linea tratteggiata dal centro ed etichetta 'TWA / STW kn', dall'ultimo record raffyca-perf-log). Reintrodotti i campi ULTIMO TWA e ULTIMO STW (erano stati sostituiti da VMG); ora riga1 = TWS curva + Ultimo TWA + Ultimo STW, riga2 = VMG bolina + VMG lasco, poi diagramma con legenda. Nuova funzione svgShared() dedicata alla polare condivisa; svgPolar() (Traccia) resta mono teal per la definitiva (simmetrica) come voluto, con cerchi resi piu' visibili.
  SORGENTE VELOCITA' SOG/STW: aggiunto selettore in Inserimento (default SOG cosi' senza solcometro si lavora subito; STW se c'e' il log, piu' preciso perche' esclude la corrente). Il record salva rec.spdSrc. Default letto da raffyca-settings.speedSrc se presente. Nota fisica: la conversione apparente<->reale userebbe STW; con SOG e' un'approssimazione (ignora la corrente), accettata da Sergio.
  SMOOTHING SOG: lo slider era stato tolto dall'Inserimento (giusto: senza feed live non serve li'); da spostare in Impostazioni come impostazione globale per i moduli live - RINVIATO al passaggio Impostazioni (Cruscotto non ha oggi una media SOG configurabile da agganciare).
  TESTI: rimossi i due testi tecnici richiesti ('salvate in raffyca-polar-cloud):' e il paragrafo 'Definitiva: P90...assembla le fasce in raffyca-polar'). Le chiavi localStorage restano nel JS. Messaggio di 'Salva come polare' spostato sotto il bottone (#t-saved2).
  VALIDATO: node --check su tutti e 5 gli script; smoke jsdom 16 check verdi (toggle SOG/STW, record con spdSrc, polare bicolore verde+coral, pallino ambra ultimo punto, barchetta rotate, etichetta 'TWA/STW kn', Ultimo TWA/STW popolati, VMG calcolate, cerchi su var(--sub), etichette angolari, testi tecnici rimossi, definitiva Traccia teal).
  APERTO/DA CONFERMARE con Sergio: (1) BUG barra polare - la topbar mostra raffyca-profile.model + 'pol {source}', ma Impostazioni scrive raffyca-polar.meta.boat e NON aggiorna profile.model -> il chip resta col vecchio modello e sembra non cambiare (Traversata invece e' corretta perche' legge raffyca-polar). Fix proposto: il chip usa raffyca-polar.meta.boat quando presente, altrimenti profile.model (tocca la rf-topbar in TUTTI i 12 file). In attesa di conferma del comportamento. (2) Smoothing SOG + default sorgente velocita' da aggiungere in Impostazioni (raffyca-settings merge-safe) e agganciare al Cruscotto: passaggio dedicato. ETICHETTA: TOCCA IL LAYOUT -> prova a bordo (bicolore/cerchi/barchetta/leggibilita' giorno).

- [FIX 28/07 Barra polare (rf-topbar) - il chip non rifletteva la polare scelta] Sintomo (Sergio): scegliendo la polare in Impostazioni, Traversata era corretta ma il chip nella barra in alto restava sbagliato. Causa: tickPolar mostrava raffyca-profile.model + 'pol {source}', ma Impostazioni scrive raffyca-polar.meta.boat e NON aggiorna profile.model -> il modello nel chip restava quello vecchio. Fix: polarLabel() ora ritorna anche .boat; tickPolar() usa model = L.boat || profile.model (il boat della polare attiva vince). Generica: txt='generica' con boat mostrato (niente doppione). Applicato IDENTICO ai file con topbar via script (blocco byte-identical confermato in tutti).
  PARTENZA esclusa/ripristinata: e' un modulo buildato Vite/Workbox (come lo era Performance); la sua SW precache serve index.html dal revision hash, quindi una modifica a mano al suo HTML non ha effetto finche' non lo si ricostruisce. Ripristinato all'originale; il fix barra arrivera' con la sua riscrittura vanilla (come per Performance).
  SW BUMP (cache-first, HTML barra cambiato): meteo v10->v11, anchor v5->v6, xte v3->v4. Network-first/root (hub, info, carta, cruscotto, impostazioni, posizione, traversata) nessun bump.
  VALIDATO: node --check sul blocco topbar di tutti gli 11 file modificati OK; smoke jsdom 5 check (chip mostra boat della polare e non il vecchio model; pol ORC; fallback a model+integrata senza polare; generica con warn).
  ANCORA IN SOSPESO (concordato, passaggio dedicato Impostazioni): spostare Smoothing SOG in Impostazioni come impostazione globale (raffyca-settings) e agganciarla al Cruscotto; aggiungere il default sorgente velocita' SOG/STW (Performance gia' lo legge da raffyca-settings.speedSrc).

- [FIX 30/07 Performance - i KPI non calcolavano nulla] I riquadri in alto in Inserimento (VMG, SOG, Target, Perf) erano placeholder fissi a '—', mai collegati al calcolo. Aggiunti id ai valori e funzioni insResolved()/insKPI(): ora si aggiornano DAL VIVO mentre si digita e, a form vuoto dopo il salvataggio, mostrano l'ultimo record. Calcoli: SOG/STW = velocita' inserita (etichetta secondo la sorgente scelta); VMG = velocita'*cos(TWA); Target = polarTarget su raffyca-polar a (TWA,TWS) [in modo apparente usa TWA/TWS derivati]; Perf = velocita'/target*100 con colore semantico (verde >=98, ambra >=90, coral sotto). Se manca la polare, Target/Perf restano '—'. insKPI() chiamato in insRender e sui click SOG/STW. VALIDATO: node --check OK; smoke jsdom (SOG=vel, etichetta SOG/STW, VMG=3*cos60=1.50, Target 60/12=6.00, Perf 50% coral, modo apparente non rompe, dopo salva+reset i KPI mostrano l'ultimo record). Nota: VMG mostrato con segno (negativo = lasco); se preferito il valore assoluto e' una riga. ETICHETTA: solo logica (aggancio KPI), ma da vedere a bordo con una polare salvata.

- [FATTO 30/07 Impostazioni: sorgente velocita' + Media SOG globali; aggancio Cruscotto] Spostato in Impostazioni cio' che serve ai moduli live, come concordato con Sergio (prima di rifare Partenza, che ne dipende).
  IMPOSTAZIONI (impostazioni/index.html): nella sezione Navigazione due nuovi campi. (1) 'Sorgente velocita'' segmented SOG/STW -> raffyca-settings.speedSrc ('sog'|'stw'), default SOG. (2) 'Media SOG' numerico 1-30 s -> raffyca-settings.sogSmooth, con clamp. Scrittura MERGE-SAFE via patchSettings (aggiunte 'speedSrc','sogSmooth' a OWNED); load() ripopola i controlli; toast di conferma. Nessun bump SW (modulo network-first).
  CONTRATTO: raffyca-settings ora possiede anche speedSrc e sogSmooth (merge-safe, di proprieta' di Impostazioni). Performance gia' legge raffyca-settings.speedSrc come default della sua sorgente velocita'.
  CRUSCOTTO (cruscotto/index.html): la SOG GPS era grezza (c.speed*1.94384 o derivata dalla distanza). Aggiunta MEDIA MOBILE TEMPORALE sulla finestra sogWin() (=raffyca-settings.sogSmooth, default 5 s, clamp 1..30): buffer GPS._sogBuf di {t,v}, potatura dei campioni piu' vecchi della finestra, GPS.sog = media dei campioni residui. La sorgente velocita' STW-se-presente-altrimenti-SOG resta invariata (speedSrc globale non forza il Cruscotto: da valutare se/quando serve). Nessun bump SW (network-first).
  VALIDATO: node --check su Impostazioni e Cruscotto OK; jsdom Impostazioni (speedSrc sog/stw scritto, merge-safe con chiavi esistenti intatte, sogSmooth scritto e clampato a 30, UI ripopolata da load); test isolato dello smoothing SOG con la sogWin() reale (finestra default 5s, media dentro finestra, potatura campioni vecchi, finestra 10s rispettata, clamp fuori range->5).
  ETICHETTA: solo logica. Da provare a bordo il comportamento della media SOG col GPS reale (jsdom non vede il GPS). PARTENZA: rewrite in chat nuova (Sergio vuole rivedere alcune funzioni); consumera' speedSrc/sogSmooth.

- [FATTO 30/07 Partenza — rewrite vanilla] Abbandonato il bundle Lovable/Vite di `partenza/` (React + Workbox precache, scope /partenza/). Riscritto `partenza/index.html` vanilla auto-contenuto sul pattern di Performance: token hex nel `:root` + blocchi `html.day`/`html.night`, boot-tema, rf-topbar verbatim (home `../`), NESSUN SW proprio (servito dall'hub network-first). Rimossi dal repo i file del vecchio bundle (assets/, sw.js, workbox-*.js, manifest, splash-*, icone, robots, placeholder, favicon): la cartella ora è solo `index.html`. Script di migrazione inline de-registra il vecchio SW Workbox e purga le sue cache (come per Performance).
  FUNZIONI: linea a due estremi (ping GPS "qui" o coordinate lat/lon editabili) OPPURE un estremo + direzione (scelta ancora PIN/RC pingabile; lunghezza ignota → niente vantaggio in metri). Countdown con set manuale ±min, sync-al-minuto, segnali audio (WebAudio) + vibrazione ai minuti/ultimi 10s/via, persistenza dell'orologio in corsa (sopravvive a reload/lock), azione di fine countdown via raffyca-settings.raceEndAction (default Cruscotto). Distanza dalla linea CON SEGNO lungo la normale (lato percorso definito dal vento) → OCS quando negativa. TTL da VMG-alla-linea (SOG proiettata sulla normale), TTK = residuo − TTL. Bias: lato favorito + gradi + vantaggio in metri (due estremi). Grafico con auto-zoom (linea+estremi+barca sempre a vista), freccia vento con punta al centro (proviene DA), lato percorso ombreggiato.
  VELOCITÀ: la linea è ancorata al fondale → tutto riferito al fondo. Il modulo usa SEMPRE la SOG (IGNORA speedSrc; STW darebbe TTL sbagliato con corrente), rispettando la finestra media raffyca-settings.sogSmooth. Scrive raffyca-pos con ts.
  SFONDI PROSSIMITÀ: display countdown+Dist. e alone in cima cambiano colore ciano→verde→giallo→rosso (OCS) secondo la distanza. Colori SEMANTICI invarianti (non temizzati) così restano distinguibili di giorno; di notte sono tenuti SPENTI per la visione notturna (scelta Sergio, opzione b). Soglie configurabili in Impostazioni (verde/giallo, default 50/20 m).
  REGISTRAZIONE: al via si registra a 1 Hz {t(al via, negativo prima), lat, lon, sog, cog, dist, ttl, ocs}; a fine countdown si salva in raffyca-starts (tetto ultime 50). Archivio in-app: lista con esporta JSON (download) / elimina / cancella tutte. SOLO JSON, niente replay grafico (rimandato a v2, d'accordo con Sergio).
  NUOVE CHIAVI localStorage (prefisso raffyca-, module-local): `raffyca-startline` {pin,rc,mode,dir,anchor}, `raffyca-start` {twd,tws,target,audio,cdRunning,cdEnd,cdTarget}, `raffyca-starts` [array registrazioni]. raffyca-settings: aggiunte `startDistG`/`startDistY` (merge-safe, di proprietà di Impostazioni).
  ALTRO: info.html — nuova card "Abbreviazioni" (SOG COG STW BRG TWD/TWS TWA AWA/AWS VMG XTE DTW/TTG ETA RC PIN OCS TTL TTK). Impostazioni — due campi "Partenza · soglia verde/gialla".
  VALIDATO: node --check su tutti gli script inline (partenza, impostazioni, info) OK; smoke jsdom di partenza (boot pulito, geometria calcolata — linea 122 m/85°, vento DA 20° → favorito RC 25° +52 m — SVG disegnato, stato LINEA OK).
  ETICHETTA: TOCCA IL LAYOUT — serve prova su dispositivo/PWA (Android + iOS/Safari). Da verificare a bordo: leggibilità dei 4 colori di sfondo nei tre temi, audio/vibrazione al via, auto-zoom del grafico, persistenza countdown dopo lock schermo. Nota migrazione: se apri prima la vecchia Partenza in cache, ricarica una volta online (lo script di de-registrazione SW libera lo scope). Su Safari può servire cancellare i dati del sito.

- [FATTO 30/07 Rifiniture post-review]
  PARTENZA: rimossa la fascia titolo sopra il countdown (recuperato spazio, padding-top ridotto); "SOLO INFO"→"info" (pill vento allineati); PIN sempre rosso e RC sempre teal — il favorito si distingue SOLO per dimensione (r 11 vs 6), non più per colore; suono countdown molto più deciso (onda quadra + ottava, gain alto) con nuovo pattern: >1min al minuto e ai :30, <1min ogni 10s, <10s ogni secondo, al via corto+lungo. ETICHETTA: tocca il layout.
  INFO: (1) collisione topbar — la topbar usa `<span class="mod">` ma info ha una `.mod` di pagina (display:flex + border-bottom) che la rendeva blocco sottolineato a due righe: isolata con `.rf-topbar .rf-pol .mod{display:inline;border:0;padding:0;font-size:inherit}` (problema solo in info). (2) glossario VMG con inglese "Velocity Made Good".
  CRUSCOTTO: box tagliati in fondo su Android — height `100dvh`→`100svh` (in standalone PWA coincide; nel browser evita il taglio col chrome). DA VERIFICARE su device: possibile piccolo gap in basso quando la barra si ritira.
  ANCORA: i collassabili Parametri/Pericoli facevano `scrollIntoView` all'apertura, tirando su il canvas della veglia (che deve restare intero) — rimosso l'auto-scroll: ora il pannello si espande sotto e il canvas resta fermo.
  DA VEDERE (segnalati, sessioni dedicate): PERFORMANCE — la polare non si aggiorna dai dati inseriti in "Inserimento"; TRAVERSATA — ancora vari errori, sessione a parte.
  VALIDATO: node --check su partenza/info/cruscotto/anchor OK; smoke jsdom partenza OK.

- [FATTO 31/07 Partenza fix alone] Spazio vuoto sopra il countdown: la regola `.pv>*{position:relative}` sovrascriveva il `position:fixed` di `.pv-glow` (stessa specificità, dichiarata dopo) rendendolo un blocco di 190px nel flusso. Corretto con `.pv>*:not(.pv-glow)`. ETICHETTA: tocca il layout.
- [DIAGNOSI 31/07 Performance polare] "La polare non si aggiorna da Inserimento": Inserimento salva i record reali in `raffyca-perf-log`, ma `cloudFor()` (Traccia polare) legge `raffyca-polar-cloud` e GENERA punti casuali (rnd) dal solo conteggio sessioni — non usa mai i valori veri. La polare salvata (`raffyca-polar`, source 'campo') nasce da nuvola sintetica. FIX (sessione dedicata): ricablare cloudFor/renderTraccia/envelope/definitiva perché la nuvola usi i rilevamenti reali di raffyca-perf-log (raggruppati per fascia TWS, side dalle mura), eliminando rnd. Decisioni aperte: (a) polare di campo solo da perf-log vs sessioni come contenitori reali; (b) campione minimo per fascia.

- [FATTO 31/07 Performance — tab Polare segue il vento] Chiarito il design (correzione della diagnosi precedente): Polare è un VISUALIZZATORE della polare canonica (ORC o CSV da Impostazioni) per una data fascia di vento, con sovrapposti i dati di Inserimento; Traccia polare resta il costruttore da nuvola (giustamente scollegato da Inserimento). Bug reale: la curva era inchiodata allo slider `#p-twsr` (default 12 kn) e non seguiva il vento del dato; inoltre leggeva solo il record salvato. Fix (solo tab Polare): nuova `polPoint()` che prende il punto da `insResolved()` (input correnti di Inserimento, quindi ANCHE senza salvare) con fallback all'ultimo record `raffyca-perf-log[0]`; la curva ora usa il TWS del punto arrotondato all'intero (interpolato da `polarTarget`), clampato 4–30; lo slider `#p-twsr` diventa OVERRIDE manuale (`POL_MANUAL`), e rientrando nella tab Polare si ri-aggancia al dato. `#p-utwa`/`#p-ustw` e il punto ambra ora riflettono il punto live/ultimo. Nessun cambio a Traccia/Converti/Inserimento. VALIDATO: node --check OK; smoke jsdom (record a 16 kn → curva a 16.0, non 12; punto ambra 100°/6.2). ETICHETTA: solo logica (nessun cambio di layout). Da provare a bordo il caso "digito e non salvo, poi apro Polare".

- [FATTO 31/07 Traversata — motore stabile (fase 1)] Diagnosi confermata leggendo `route()` (righe 563-594): il test d'arrivo a B girava SOLO sui punti sopravvissuti al pruning (`frontier`), e il pruning teneva un solo punto per settore (il più lontano dalla partenza). Da qui l'erraticità non-monotòna vista da Sergio (efficienza 90/100 arrivano, 95 no = impossibile fisicamente → artefatto). Il worker è generato da `route.toString()` (rfWorkerSource, riga 665): una sola sorgente, il fix si propaga a main+worker. Tre correzioni, tutte MONOTÒNE PER COSTRUZIONE (possono solo rendere B più raggiungibile, mai meno):
  (1) ARRIVO sganciato dal pruning: cerco B tra TUTTI i candidati del fronte (pre-filtro `dist(pc,Gp)>12` → economico), non solo tra i sopravvissuti.
  (2) PRUNING con beam per settore: oltre al più lontano dalla partenza (esploratore) tengo anche il più vicino a B (cacciatore di meta) — un ramo diretto a B non viene più scartato. Il set vecchio (farthest-per-settore) resta incluso, quindi nessuna rotta prima trovata va persa.
  (3) GUARDIA DI SEQUENZA nel worker (`rfApplied`): `onmessage` ignora i risultati con `seq` più vecchio dell'ultimo applicato → niente rotte stantie quando si cambia in fretta / si toggla "evita vento forte" (caso c1). Il `seq` tornava già dal worker (riga 672).
  Costo: fronte ~2× (beam) → motore un filo più pesante (ok da Sergio); arrivo su tutti i candidati reso economico dal pre-filtro distanza.
  VALIDATO: node --check su main E sul sorgente worker generato da route.toString(); boot jsdom OK; verificato che il worker generato contiene il nuovo codice (beam + arrivo su candidati). DA FARE (fase 2): harness automatico di MONOTONÌA su campo con maschera/ostacolo (sweep efficienza 0.80→1.05: raggiungibilità deve essere monotòna) come rete anti-regressione; e verifica a bordo dei casi a/b/c sui dati reali. Se restano varchi ostici tra isole → valutare motore a griglia spazio-tempo (Dijkstra). ETICHETTA: solo logica.

- [FATTO 31/07 Tema Giorno — uniformata la topbar + Info] Audit Giorno di Sergio: le barre "scure" erano i moduli SENZA l'override sfondo `html.day/.night .rf-topbar` (il testo topbar è già var(--ink), che in Giorno diventa scuro → scuro-su-scuro). Chi aveva l'override (Traversata, XTE, Posizione, Ancora, Carta) mostrava la barra chiara; chi non ce l'aveva (Hub, Info, Meteo, Performance, Cruscotto, Impostazioni, Partenza) restava scuro. FIX: aggiunte le 2 righe canoniche override barra (day chiara #ffffff/#e7ecf1 bordo #a7b5c2; night rossa) a tutti i 7 file mancanti — ora la barra è uniforme (chiara in Giorno) ovunque. INFO era "tutto nero": mancava del tutto il tema Giorno (niente boot-script né token html.day). Aggiunti boot-tema in <head> + blocchi html.day/html.night sui token (bg/panel/dp/line/ink/sub/teal/amber) → pagina e barra chiare in Giorno. VALIDATO: node --check script Info OK; boot jsdom (theme=day → classe 'day' applicata, override barra + token pagina presenti). Solo CSS/boot, nessun cambio logico.
  RESTA (passate di contenuto per-modulo, tema Giorno): XTE — pulsanti con fondo scuro letterale + testo scuro (illeggibili in Giorno); CRUSCOTTO — recbar (2ª barra) scura, pulsanti scuro-su-scuro, hint "Tieni premuto…" nero-su-nero; ANCORA — canvas dello schema nero (serve canvas theme-aware, già a backlog) + i pannelli collassabili si aprono VERSO L'ALTO coprendo lo schema (bug strutturale di layout, il precedente togli-scroll non bastava: da correggere la direzione di apertura). Da fare un modulo per volta, testato.

- [FATTO 31/07 Cruscotto — tema Giorno superfici] Le superfici "rialzate" avevano gradienti scuri CABLATI (non var()) che in Giorno restavano scuri, mentre il testo var(--ink) diventava scuro → scuro-su-scuro. Aggiunto un blocco di override html.day (solo Giorno; Scuro/Notte invariati — di notte superfici scure + testo rosso vanno bene) per: header, .recbar (la "2ª barra"), .back/.src/.wind-src/.mbtn/.stepper button/.f-btn/.rec-btn (pulsanti chiari), .seg, .sheet-card (+grip), .f-btn.stop (rosso chiaro), .toast (era #0e2036 fisso → il messaggio "Tieni premuto…" era nero-su-nero; ora bianco con testo scuro). Testo (var(--ink)/--sub/--teal) già scuro in Giorno → leggibile su chiaro. La bussola/mini-mappa era già theme-aware. VALIDATO: node --check OK; boot jsdom in Giorno (classe 'day', regole recbar/pulsanti/toast/topbar chiare presenti). Solo CSS. NON toccato (non segnalato): bezel strumenti ha uno stop intermedio #18303e, .viti e .side-tag scuri — se in Giorno danno fastidio si sistemano nella prossima passata. RESTA tema Giorno: XTE (pulsanti), Ancora (canvas nero + pannelli che si aprono verso l'alto).

- [FATTO 31/07 XTE — tema Giorno pulsanti/input] La barra era già chiara; erano i pulsanti/input con superfici scure CABLATE + testo var(--ink)/var(--muted) (scuro in Giorno) → scuro-su-scuro. Aggiunto blocco html.day (solo Giorno): .setBtn e button/label.btn → gradiente chiaro (#ffffff→#eef2f6, bordo #c2ccd6); .thRow input e l'input inline #trigNum → #ffffff con !important (lo stile inline vinceva sul foglio). Gli stati attivi (.setBtn.on[data-mode=auto], #startBtn.on) mantengono l'accento giallo per specificità. Testo già scuro in Giorno → leggibile. VALIDATO: node --check OK; boot jsdom in Giorno (regole setBtn/button/input presenti, modulo carica). Solo CSS. RESTA tema Giorno: Ancora (canvas nero + pannelli che si aprono verso l'alto) — ultima passata.

- [FATTO 31/07 Ancora — collassabili come sheet dal basso] Canvas resta scuro (scelta Sergio). Il problema dei pannelli Parametri/Pericoli: su telefono canvas quadrato + valori riempiono lo schermo, i pannelli sono in fondo → aprirli in flusso costringeva a scorrere e il canvas spariva ("si aprono verso l'alto/coprono lo schema"). Il precedente togli-scrollIntoView non bastava (problema di flusso, non di scroll). FIX: `.collap:not(.closed)` ora è un SHEET fisso dal basso (position:fixed;bottom:0;z-index:9350 sotto il #sheet pericoli 9500;max-height:64vh;overflow:auto;radius top;.hd sticky in cima come maniglia/chiusura;chevron ruota). All'apertura `toggleCollap(card)` chiude gli altri (uno alla volta) e riporta la pagina in cima (scrollTo top) così il canvas resta visibile sopra il pannello. Pericoli ora parte chiuso (prima aperto). onclick inline -> toggleCollap globale. Trade-off telefono: lo sheet copre la parte bassa, il canvas resta visibile in alto (~36vh); per vedere SEMPRE tutto il cerchio servirebbe rimpicciolire il canvas (decisione separata, non fatta). VALIDATO: node --check OK; smoke jsdom (start entrambi chiusi, apre uno alla volta, intestazione chiude, css sheet presente). Solo CSS + una funzione. Con questo si chiude il giro tema-Giorno (Cruscotto/XTE contenuti + Ancora collassabili).

- [FATTO 31/07 Ancora — revert sheet + overlay + editor pericolo Giorno] Dagli screenshot di Sergio (Giorno): (a) i pannelli in linea sono puliti e NON coprono il canvas; lo sheet dal basso (mio 1620) invece COPRE il canvas → scelta sbagliata: REVERTATA la conversione, i collassabili tornano in linea (espansione verso il basso, niente overlay, niente auto-scroll). (b) Testo overlay in alto a sx del canvas illeggibile: .ovl non aveva color esplicito → ereditava var(--ink) che in Giorno diventa scuro, su overlay scuro = invisibile. Il canvas resta scuro in tutti i temi, quindi overlay SEMPRE chiaro: .ovl color #cfe2ee (bg leggermente più opaco), .ovl.tr amber fisso #ffc24b. (c) Editor "Nuovo pericolo" (#sheet) scuro in Giorno: .inner background #13202c cablato → aggiunto html.day #sheet .inner{background:#f3f6f9} + html.day .handle chiaro; i controlli interni usano già i token, quindi si schiariscono. VALIDATO: node --check OK; jsdom (toggle in linea ok, niente sheet fisso, overlay chiaro, regola editor Giorno presente). RESIDUO NOTO: l'editor "Nuovo pericolo" è un modale, mentre è aperto copre la parte bassa (canvas top visibile) — normale per un modale. Se Sergio vuole il cerchio di veglia SEMPRE interamente visibile, il canvas va rimpicciolito (disegna una semicirconferenza con molta area scura sprecata in basso: fitCanvas h=w*1.0 → si potrebbe ridurre), ma tocca il disegno → passata separata, non fatta.

- [FATTO 31/07 Ancora — canvas che collassava (bug fitCanvas)] Il canvas spariva a intermittenza (telefono e desktop). Causa: fitCanvas faceva w=cv.clientWidth; h=w; se al momento della chiamata la larghezza non era ancora impaginata (w=0), impostava height:0px e il canvas collassava restandoci. FIX: fitCanvas robusto — larghezza da cv.clientWidth, altrimenti wrap.clientWidth, altrimenti window.innerWidth-20; se <80 ripiego a min(innerWidth-20,460); h=w (disegno resta quadrato come da design). Mai altezza 0. Aggiunto #wrap{max-width:460px;margin:auto} così su desktop/finestra larga il canvas non diventa gigante. Nessun cambio al disegno. Confermato che il layout (canvas sopra, opzioni sotto, scroll) è quello giusto (idea di Sergio): niente sheet, niente auto-scroll. VALIDATO: node --check OK; jsdom forzando clientWidth=0 → cv.style.height=392px (non più 0), cap desktop presente. RIEPILOGO Ancora ora: pannelli in linea, overlay canvas chiaro in tutti i temi, editor pericolo chiaro in Giorno, canvas robusto. Chiuso.

- [FATTO 01/08 SERVICE WORKER stantii — la vera causa dei "deploy che non arrivano"] Sergio vedeva Ancora ancora rotta (canvas collassato) nonostante il fix 2117 e "cache cancellata n volte". CAUSA VERA: diversi moduli avevano un service worker CACHE-FIRST che serviva sempre la vecchia index.html dalla precache; svuotare la cache del browser NON tocca la cache del SW → i deploy non arrivavano mai. Trovati cache-first: anchor (anchor-v6), xte (xte-v4), meteo (raffyca-meteo-v11). routing era GIÀ network-first (per quello Traversata si aggiornava). FIX: riscritti anchor/sw.js (v7), xte/sw.js (v5), meteo/sw.js (v12) a NETWORK-FIRST per l'HTML/navigazione (l'ultima versione quando c'è rete; cache solo offline → l'ancora funziona anche senza segnale; meteo mantiene il passthrough diretto per Open-Meteo cross-origin). skipWaiting + clients.claim per subentrare subito. VALIDATO: node --check su tutti. NOTA DEPLOY: dopo il push, ricaricare un paio di volte perché il nuovo SW si installi e prenda il controllo; da lì in poi i deploy arrivano da soli. Con questo il fix del canvas 2117 e tutti i fix recenti di Ancora/XTE finalmente compaiono.
  PRINCIPIO (aggiungere ai learning): ogni SW di modulo DEVE essere network-first per l'HTML, mai cache-first, altrimenti i redeploy restano bloccati. Bump di versione della cache a ogni modifica.

- [FATTO 01/08 Ancora — fix canvas alla radice + timbro versione] Dopo 5 sessioni sul canvas che collassava: risolto alla RADICE come Regata (che usa SVG auto-dimensionante). L'altezza del canvas ora è SOLO CSS: #cv{width:100%;height:auto;aspect-ratio:1/1;min-height:180px}. Rimossa del tutto la riga JS `cv.style.height=...` (fitCanvas ora imposta solo il buffer di disegno da getBoundingClientRect). #wrap ha min-height:200px come ulteriore rete. Con aspect-ratio+min-height è FISICAMENTE IMPOSSIBILE che il riquadro sia <180px: se Sergio lo vede collassato, sta servendo un FILE VECCHIO (confermato: testava da cartelle nuove /test/, /test2/ = percorsi senza SW, quindi file raw = build vecchia scompattata per errore). Per chiudere l'ambiguità "quale build sto guardando" ho aggiunto un TIMBRO DI VERSIONE VISIBILE in pagina (#pvBuild, fisso in alto a destra, "build 0801-0100"): se non lo vede, è un file vecchio. SW anchor -> v9. VALIDATO: node --check OK, aspect-ratio+min-height presenti, cv.style.height rimosso, timbro presente. LEARNING: per elementi visuali usare dimensionamento CSS (aspect-ratio) non JS; e un timbro di build visibile risolve alla radice il tempo perso su "sto testando la versione giusta?".

- [FATTO 01/08 Ancora CHIUSA + pulizia pacchetto] Sergio conferma: build 0801-0100 visibile e canvas con altezza corretta (niente collasso). Fix canvas alla radice CONFERMATO funzionante. Rimosso il timbro di versione (#pvBuild, era di debug). Rimosso dallo zip il relitto annidato ProVela-20260726-2245.zip (cruft che si trascinava da consegne precedenti e gonfiava il pacchetto). Da ora la procedura di zip esclude *.zip (oltre a .git e .DS_Store) → pacchetti ~3 MB, niente archivi dentro archivi. Ancora: chiusa (pannelli in linea, overlay chiaro, editor pericolo Giorno chiaro, canvas robusto via CSS).

- [FATTO 08/08 BATCH 1 — vittorie rapide] Cinque interventi piccoli, uno per modulo + una passata topbar.
  TOPBAR (tutti i 13 file): rimossa la veletta decorativa davanti al nome barca (era ridondante con la vela-home, che resta). Tolti sia l'uso `SAIL+` sia la dichiarazione `var SAIL` (niente codice morto); blocco rf-topbar ancora byte-identico ovunque. Cache-first con SW proprio bumpati perché l'HTML è cambiato: anchor v9->v10, meteo v12->v13, xte v5->v6. ETICHETTA: tocca il layout (topbar) — occhiata su device.
  o) PERCORSO (percorso/index.html): slider "Passaggio boa automatico" min da 30 a 10 m (max 150, step 10 invariati). Solo logica.
  f) TRAVERSATA (routing/raffyca-traversata-map.html): etichetta "Ora vento in carta" -> "Vento in carta adesso". Aggiunta riga "Vento nel punto" sotto lo slider windHour: mostra TWD (3 cifre) + TWS (kt interi) campionati con windAt() nel punto del pallino (posizione lungo la rotta all'ora mostrata) o, se non c'è rotta/pallino, al centro carta. Nuovi helper windViewPoint()/updateWindPt(), agganciati a syncWindView() e all'handler dello slider. Solo logica (aggiunge una riga UI). Da vedere a bordo con campo vento caricato.
  i) ANCORA (anchor/index.html): rimosso il cerchio tratteggiato interno + relativa etichetta metri — era puramente decorativo (rInner = 0.45 x raggio d'allarme, non legato a catena/fondale/nulla). ringLbl resta (serve all'anello d'allarme). SW anchor bumpato (vedi topbar). Tocca il disegno del canvas.
  g) PERFORMANCE (performance/index.html): nella tab Polare, nuovo box "Bolina · alla VMG" e "Lasco · alla VMG" con TWA (verde=reale) e AWA (ambra=apparente) agli angoli VMG-ottimali. Gli angoli (vbT bolina, vlT lasco) erano già calcolati in drawSharedPolar; AWA = |atan2(TWS·sinTWA, TWS·cosTWA+STW)| con STW = polarTarget al quell'angolo. Reset a "—" se manca la polare o VMG non valida. Solo logica (aggiunge un box).
  VALIDATO: node --check su tutti gli script inline dei 13 HTML + i 3 sw.js OK; verifica numerica AWA (bolina 45°->30°, lasco 150°->119°) e formato direzione. jsdom pieno non fatto (cambi piccoli). DA PROVARE A BORDO: readout vento Traversata, box angoli Performance con polare salvata, canvas ancora senza cerchio interno, topbar pulita in tutti i temi.

- [FATTO 08/08 BATCH 2 — flusso regata] Tre interventi (q, p, n). Nessun bump SW (impostazioni/partenza/percorso sono network-first serviti dall'hub).
  q) FINE COUNTDOWN "diretto" — nuova opzione + riordino menu. IMPOSTAZIONI: select #raceEnd riordinato (Non fare nulla / Cruscotto / Percorso regata / Regata — diretto / URL) e aggiunta la voce value="diretto"; whitelist di raceEndAction estesa con "diretto". PARTENZA: writeRaceHandoff ora accetta un flag auto e lo scrive in raffyca-race-handoff ({...,auto:true}); raceEndAction gestisce "diretto" come "percorso" ma con auto=true (scrive handoff + naviga a ../percorso/). PERCORSO: checkRaceHandoff salta il confirm() quando h.auto è true — applica linea+vento, apre la scheda Regata (show('rc')) e avvia la registrazione se raceReady, senza chiedere nulla. Con "percorso" (non diretto) resta la conferma. CONTRATTO: raffyca-race-handoff ora ha campo opzionale auto (bool). Solo logica.
  p) PERCORSO — boa da GPS alla creazione. Nell'editor rotta, modalità Coordinate, aggiunto tasto "GPS" (#mkFix) che riempie mkLat/mkLon con gpsOnce() (o posizione simulata), coerente con i tasti GPS degli estremi linea. Poi "＋ Aggiungi" crea la boa a quelle coordinate: ora si può fissare la posizione da GPS anche la prima volta, non solo riposizionando una boa esistente. Tocca il layout (un bottone in una riga esistente).
  n) PARTENZA — auto-zoom del grafico più aderente. drawSvg imponeva MIN=90 su ENTRAMBI gli assi + padding fisso 34: quando la barca era vicina alla linea l'asse corto sprecava spazio e tutto rimpiccioliva (riempiva ~metà larghezza). Riscritto il fit: MIN=90 resta solo come pavimento sull'estensione DOMINANTE (anti-sovrazoom con punti vicini/coincidenti), padding proporzionale (16% della span) per margini visivi costanti a ogni zoom. Scala uniforme invariata (niente distorsione). Verifica numerica: scena vicina sc 1.84->2.65 (76% larghezza), scena lontana inquadra barca+linea (76% altezza), solo-barca resta finito. Tocca il layout (visivo) -> prova a bordo.
  VALIDATO: node --check sugli script inline di impostazioni/partenza/percorso OK; test numerico fit auto-zoom (vicino/lontano/degenerato) e routing handoff (diretto=auto:true, percorso=auto:false, cruscotto=nessun handoff). jsdom pieno non fatto. DA PROVARE A BORDO: catena Partenza countdown->"diretto"->Percorso/Regata senza conferma con registrazione avviata; tasto GPS boa in creazione; inquadratura del grafico Partenza nei casi vicino/lontano.

- [FATTO 08/08 BATCH 3 — Carta: persistenza vista + fari] Tre interventi (l, b, d). Carta non ha SW proprio (hub network-first) → nessun bump.
  l) PERSISTENZA VISTA CARTA. Nuova chiave Carta-privata raffyca-carta-view {c:[lat,lon], z, base('nautica'|'minimal'|'osm'), sea(bool), grid, zones, bathy, fari, fariMode('sett'|'vedo'), ais}. saveView() scrive su moveend/zoomend/baselayerchange/overlayadd/overlayremove e sul click dei toggle (tGrid/tZone/tBathy/tFari/tAis + modi fari). Al boot cartaView() ripristina: setView(centro,zoom) salvati (invece del default POS/zona), base layer + simboli nautici salvati, e ri-attiva gli overlay che erano ON richiamando il click dei rispettivi toggle (riusa la logica esistente, quindi ricarica dati/riconnette). La vista salvata VINCE sul salto-a-GPS del timeout di boot (guardia if POS && !CV.c). Draw e Misura NON persistono (modalità transitorie). Fallback base sicuro (sconosciuto→nautica). Verificato round-trip serializzazione + tutti i ternari in isolamento. Tocca il layout (comportamento vista).
  b) FARI più cliccabili in zoom-out. Gate spicchi FARI_MINZOOM 12→10 (spicchi e marker compaiono già più da lontano).
  d) FARI all-round cliccabili (chiarito NON è un bug dati). Punta Canigione ecc. sono nel dato come ty:beacon_cardinal con ar:[["W",4]] — sono GENUINAMENTE all-round, l'arco giallo che si vedeva era il simbolo generico OpenSeaMap, non un settore: il nostro dato è corretto. Il problema vero: in modalità Settori le 2312 luci all-round non erano cliccabili (solo le 457 settoriali). Ora fariRender disegna anche un piccolo pallino (raggio 3, colore = colore luce, cliccabile→popup nome/caratteristica/ref) per le luci all-round in vista; contatore aggiornato "N con settori · M all-round in vista". Densità verificata: ~101 marker nel tratto più fitto a z10 (Golfo Aranci/La Maddalena), molti meno a z11-12 — gestibile. TRADE-OFF: i pallini all-round si sovrappongono ai simboli luce di OpenSeaMap (doppione visivo), ma i nostri sono cliccabili e danno i dati; se troppo affollato a z10 si alza il gate all-round a z11. Solo la modalità "Cosa vedo" resta invariata (già usava ss+ar).
  VALIDATO: node --check sugli script inline di carta OK; conteggi densità fari; round-trip persistenza. jsdom pieno con Leaflet non fatto (serviva stub pesante). DA PROVARE A BORDO: uscire dalla Carta e rientrare mantiene base/centro/zoom/overlay; tap su faro all-round dà il popup; affollamento pallini a z10 accettabile.

- [FATTO 08/08 BATCH 4 — fari sovrapposti + boe] Due interventi (c, e), solo Carta (nessun SW proprio → nessun bump).
  c) FARI SOVRAPPOSTI ora raggiungibili (bug noto CHIUSO). Metodo scelto: selettore nel popup. fariPick ora, dopo aver selezionato il faro toccato (quello in cima), calcola i fari co-locati con fariNear() (tutti quelli renderizzati entro 16 px dal punto, via map.latLngToLayerPoint/distanceTo) e, se ce ne sono altri, aggiunge al popup una lista "Anche qui (N): ▸ nome · tipo · caratteristica" cliccabile; il tap su una voce (fariPickById) seleziona quel faro (spicchi + popup con i suoi vicini), così si raggiunge deterministicamente anche quello sotto, a qualsiasi z-order. Nessuno spiderfy/offset dei marker. TRADE-OFF: prima selezioni quello in cima, poi scegli il sotto dalla lista (un tap in più) invece di vederli fan-out; se preferisci tap-ciclico o spiderfy si cambia. Verificato in isolamento: co-locati (~1.5 m) raggruppati, faro a ~840 m escluso.
  e) BOE con portata — GIÀ nel dato, ora cliccabili. Scoperta: le boe erano già in fari.geojson (201 boe luminose: buoy_lateral/special/cardinal/safe_water/isolated_danger/light_float), tutte con luce all-round (ar); 67 hanno portata reale. Col Batch 3 (all-round cliccabili) sono già toccabili in Settori, e le 67 con portata entrano già in "Cosa vedo". Nessuna riquery Overpass necessaria. Aggiunta solo l'etichetta tipo al popup: fariTy(ty) → "Boa"/"Meda"/"Faro"/"Piattaforma", mostrata accanto al nome per ogni luce (fari e boe). OPZIONALE non fatto: rendere le boe visivamente distinte sulla mappa (forma/marker diverso dai fari) — è una scelta estetica, si valuta a parte.
  VALIDATO: node --check carta OK; test grouping selettore + fariTy in isolamento. jsdom pieno con Leaflet non fatto. DA PROVARE A BORDO: tap su fari sovrapposti (es. faro + meda vicini) → lista "Anche qui" e raggiungibilità del sotto; tap su una boa → popup con "Boa" + caratteristica; boe con portata visibili in "Cosa vedo".

- [FATTO 11/08 LOTTO A - tre bug segnalati] Consegna parziale: la Partenza (convenzione PIN/RC) resta in attesa di conferma sull'orientamento del grafico.
  AIS RIMOSSO dalla Carta (scelta Sergio: "ci abbiamo provato"). Tolti bottone #tAis, barra #aisCtl, l'intero blocco AISstream (~3,4 KB: aisConnect/aisSubscribe/aisStart/aisStop/aisSweepStale/aisIcon/aisBBox + il moveend che risottoscriveva il riquadro), i due handler e il campo ais di raffyca-carta-view (salvataggio e ripristino). La chiave raffyca-ais-key resta orfana nel localStorage: innocua, nessun codice la legge piu'. Contratto: raffyca-carta-view perde il campo ais (le viste gia' salvate con ais:true si ignorano da sole). L'AIS vero arrivera' da un ricevitore sul bus NMEA2000 via Signal K.
  FARI, LUCI MINORI NON CLICCABILI - causa trovata. Non era il pane ne' lo z-order: il bersaglio ERA il simbolo stesso, un circleMarker di raggio 3 px (all-round) o 4 px (settoriali). Sei pixel non si centrano col dito (un polpastrello ne copre ~40). Nel Batch 4 dell'08/08 avevo aggiunto il gestore click ma non un'area di tocco. FIX: nuovo helper fariDot(f,lat,lon,rad,ring,fill,fop) che separa le due cose - il simbolo resta identico (stessi raggi e colori) ma diventa interactive:false, e sopra ci va un L.marker con divIcon trasparente 30x30 px (FARI_HIT) in un pane nuovo 'fariHitPane' a zIndex 450: sopra gli overlay (400: tracce, isobate, zone) e sotto i marker WP (600), che mantengono la precedenza. Il divIcon e' un elemento DOM: prende il tocco in modo affidabile su Android e iOS, al contrario di un cerchio SVG con riempimento all'1%. Le luci co-locate si risolvono come prima con l'elenco "Anche qui" del popup.
  FARI, POPUP ILLEGGIBILE - i colori del popup erano pensati per un fondo scuro che non c'e' mai stato: il popup di Leaflet ha sfondo BIANCO. Link dei fari vicini con style inline color:#7fe (turchese chiarissimo), separatore con bordo rgba(255,255,255,.18) e opacity .85. FIX: rimossi gli stili inline dal JS (ora classi .frsep/.frsib), blocco CSS .leaflet-popup.fari-pop con sfondo bianco esplicito, testo #12242e, link #0a4a42 in grassetto con riga di separazione e stato :active, tutti !important cosi' ne' Leaflet (a{color:#0078A8}) ne' i token del tema possono vincere. Aree di tocco delle voci portate a 7 px di padding.
  ANCORA, "TOCCA LA PLANIMETRIA" NON FUNZIONAVA - causa trovata, ed era strutturale: #sheet e' position:fixed;inset:0, cioe' un modale a tutto schermo. Con l'editor aperto la planimetria era COPERTA: il tocco non poteva arrivarci in nessun modo. Non era un problema di coordinate ne' di evento. FIX: nuova classe #sheet.tapping (background trasparente + pointer-events:none sullo scrim, pointer-events:auto sul pannello) che in attesa del tocco riduce il modale a una barra in fondo e lascia passare i tocchi; nascosti in quello stato maniglia, campi rilevamento e il nuovo blocco #hzFull (Tipo + Raggio), mentre la fascia dei modi RESTA visibile per poter tornare indietro. setSeg attiva/disattiva tapping e porta la planimetria in vista; l'evento passa da "pointerdown" a "click" (il pointerdown scatta anche all'inizio di uno scroll); al tocco il pannello si ripristina e l'hint diventa "Punto acquisito: NNN gradi - NN m dall'ancora"; anteprima del pericolo sulla planimetria (cerchio tratteggiato ambra col raggio impostato) mentre lo si posiziona; guardia su Salva se in modo tocco manca il punto; etichetta "Tocca sulla carta" -> "Tocca la planimetria" (una carta non c'e').
  SW: anchor v10 -> v11 (HTML cambiato). Carta senza SW proprio (hub network-first) -> nessun bump.
  VALIDATO: node --check su tutti gli script inline di carta e anchor + anchor/sw.js; nessun id referenziato dal JS e mancante nell'HTML; zero residui AIS. Smoke jsdom Ancora 15/15 (boot pulito, apertura editor, classe tapping, CSS pointer-events, tocco acquisito con gradi e metri, salvataggio, guardia senza punto). Test mirato Carta 15/15 con Leaflet simulato (un bersaglio per luce, 30 px, ancorato al centro, gestore click, pane 450, simboli non interattivi, popup con classi frsep/frsib e nessun colore inline, elenco "Anche qui" corretto).
  ETICHETTA: TOCCA IL LAYOUT - serve prova su dispositivo. Da verificare a bordo: tocco delle luci minori a zoom 12-16 (Golfo Aranci), leggibilita' del popup nei tre temi, e il giro completo Aggiungi pericolo -> Tocca la planimetria -> tocco -> Salva su telefono in PWA installata.
  IN SOSPESO (in attesa di Sergio): Partenza convenzione PIN/RC (orientamento del grafico: da linea o da vento); sincronizzazione Supabase degli altri dati; bussola magnetica nel Cruscotto (campo HDG separato). FATTO 11/08: accorpamento Info in Impostazioni e tessera Manutenzione.


- [FATTO 11/08 LOTTO A - completamento: PARTENZA, convenzione PIN/RC] Regola dichiarata da Sergio (schema a mano, ruotabile a piacere): guardando la linea lungo la perpendicolare, RC a destra = sei dalla parte giusta, RC a sinistra = sei oltre la linea. Vale INDIPENDENTEMENTE da vento e rotta, perche' e' la convenzione di posa (il comitato non inverte mai gli estremi). Ne discende che il lato percorso e' sempre a SINISTRA del vettore PIN->RC.
  BUG DI FONDO (logica, non solo grafica): computeNav costruiva la normale n come perpendicolare a PIN->RC e poi la ORIENTAVA COL VENTO (if n.wu<0 -> n=-n). Con la stessa identica linea, un salto di vento oltre i 90 gradi ribaltava il segno di dist: la barca ferma dalla parte giusta veniva dichiarata OCS, con TTL e closing di segno opposto. Ora n={x:-u.y,y:u.x} e basta, senza flip: dist, ocs, closing e ttl diventano invarianti al vento, come la regola. Il calcolo del BIAS resta com'era e continua a usare il vento: il lato favorito e' una faccenda di vento, il lato di partenza no.
  RETE DI SICUREZZA: se il vento inserito dice che la corsa sarebbe dall'altra parte (n.wu<0 con tws>0 e due estremi pingati), gli estremi sono stati puntati al contrario. Non si corregge in silenzio: nell'intestazione della scheda Linea compare "PIN/RC invertiti?" in corallo accanto al rilevamento. E' il caso realistico da coprire (Sergio che pinga l'estremo sbagliato), non il comitato che inverte.
  GRAFICO ORIENTATO SULLA LINEA (non piu' nord in alto). Assi ruotati in drawSvg: x lungo PIN->RC, y lungo la normale. Risultato: linea sempre ORIZZONTALE, PIN a sinistra, RC a destra, lato percorso in alto -> barca sotto = OK, sopra = OCS, esattamente lo schema di Sergio. Implementato con RT(p) (proiezione del punto sugli assi u,n con origine in A) e RA(a)=a-lineBrg+90 per gli angoli bussola; nel quadro ruotato la linea usa u=(1,0) e n=(0,1). Ruotano di conseguenza la prua della barchetta (COG) e la rosa del vento; il testo "DA nnn gradi" resta il valore VERO. Aggiunto in alto a sinistra un indicatore del NORD (stesso stile della rosa del vento): il quadro non e' piu' a nord in alto e va detto. Senza linea definita il quadro resta a nord in alto (RT/RA diventano l'identita').
  Partenza e' servita dal SW radice (network-first) -> nessun bump.
  VALIDATO: node --check sui 4 script inline. Smoke jsdom 20/20 pilotando dal DOM (il modulo e' in IIFE, niente e' esposto su window: le scene si costruiscono scrivendo raffyca-startline/raffyca-start e simulando il GPS): barca a est di una linea S->N non OCS sia con vento da N sia da S e con distanza IDENTICA (252 m in entrambi i casi), barca a ovest OCS in entrambi i casi, avviso invertiti presente solo quando il vento contraddice la posa e mai senza vento inserito, PIN a sinistra di RC, linea orizzontale, barca sotto/sopra secondo il lato, prua ruotata correttamente (COG 000 con linea 000 -> 90; con linea 090 -> 0), indicatore nord presente; ripetuto con la linea ruotata di 90 gradi con gli stessi esiti.
  ETICHETTA: TOCCA IL LAYOUT - il grafico cambia orientamento. Da provare a bordo: leggibilita' del quadro ruotato con la linea reale, coerenza della freccia di prua durante le bordate di avvicinamento, e che l'avviso "PIN/RC invertiti?" non compaia mai in una posa normale.
  RISPOSTE DI SERGIO REGISTRATE: (4) Supabase - ci vuole pensare, sospeso. (5) bussola magnetica - CAMPO HDG SEPARATO, niente ripiego automatico sotto soglia. (6) home - ok accorpare Info in Impostazioni e tessera Manutenzione con chiave inglese in SVG.

- [FATTO 11/08 MANUTENZIONE - nuovo modulo, Supabase-first] Riscritto in vanilla il prototipo React (1583 righe) come `manutenzione/index.html` auto-contenuto: token della suite, boot-tema, rf-topbar verbatim da cruscotto (home `../`), nessun SW proprio (servito dal SW radice network-first). Catalogo suggerimenti in `manutenzione/catalogo.json` (173 voci su 10 categorie, con filtri `if` sugli attributi barca/motore).
  QUATTRO SCHEDE. Barca = albero per categoria, gerarchia padre-figlio a livelli, conteggio interventi e anno di installazione sul nodo; non si compila a mano, nasce dagli interventi. Lavori = cronologia degli interventi eseguiti con costo, percorso del componente e chip dei documenti collegati. Da fare = lavori previsti (teal, ordinati per priorita' urgente/stagione/poi) MESCOLATI alle scadenze ricorrenti maturate (ambra, ordinate per giorni residui): una scadenza gia' matura precede un urgente, che e' il comportamento voluto. Documenti = galleria filtrabile con miniature vere dal bucket e contatore dei documenti citati da piu' interventi. Dossier = documento stampabile (window.print) con stato dei componenti per categoria, cronologia, lavori previsti e tre interruttori (costi / allegati / dismessi).
  FLUSSO DI REGISTRAZIONE (il cuore del prototipo, conservato). Un unico foglio "Nuova voce" con interruttore Gia' fatto / Da fare: in modo previsto sparisce la data e compare la priorita', e cambiano tutte le etichette (Cosa hai fatto -> Cosa c'e' da fare, Costo -> Preventivo, Fattura -> Preventivo). La ricerca del componente gira su TUTTE le categorie insieme (chi registra non deve sapere dove sta una voce) e mescola i componenti gia' in elenco con i suggerimenti del catalogo filtrati per gli attributi della barca: con saildrive esce "Anodo saildrive" e non "Anodo asse elica". Scegliendo un suggerimento nuovo, il componente viene creato al salvataggio e, se il catalogo prevede un intervallo, nasce anche la sua scadenza. I verbi (Sostituito, Riparato, ...) sostituiscono il verbo del titolo conservando l'oggetto. Un intervento eseguito su un componente esistente fa ripartire l'orologio della scadenza e aggiorna la data di installazione.
  MODIFICA COMPONENTE: marca/modello/seriale/date/note, riassegnazione di categoria e genitore con guardia anti-ciclo (un componente non puo' finire sotto se stesso o sotto un proprio discendente), scadenza ricorrente attivabile, e "Dismesso" che lo toglie dalle scadenze lasciandolo nello storico.
  DOCUMENTI: caricamento reale su Supabase Storage (bucket configurabile, default `documenti`), URL firmati a un'ora tenuti in cache, miniature nella galleria e nel visore, navigazione avanti/indietro tra i documenti dello stesso intervento, "Apri / Scarica" e cancellazione. Il legame documento-intervento e' molti-a-molti: lo stesso file (una fattura di cantiere) puo' essere citato da piu' interventi.
  SCHEMA DEL DATABASE - RISOLTO A RUNTIME. Avevo solo la migrazione 003, non le 001/002: invece di indovinare i nomi delle colonne, il modulo li SCOPRE. All'avvio prova per ogni tabella un `select` cumulativo coi nomi attesi; se passa, una sola richiesta per tabella e ha finito. Se fallisce (PostgREST risponde 400 nominando la colonna che non esiste) scende a provare candidato per candidato: `categoria|cat|category`, `parent_id|parent`, `esecutore|eseguito_da|fornitore`, `costo|importo`, `percorso|path|storage_path`, e cosi' via. Cerca anche la tabella ponte tra le varianti plausibili e, se non c'e', ripiega sul legame 1:N `documents.intervention_id`. Il risultato finisce in `raffyca-manut-schema`, legato a una firma della configurazione: cambi progetto, si rifa'. Le colonne opzionali assenti vengono semplicemente saltate in scrittura, non fanno fallire nulla.
  OFFLINE: Supabase-first significa che le SCRITTURE richiedono la rete, e il modulo lo dice invece di fingere. Ogni lettura riuscita lascia una copia in `raffyca-manut-cache`: senza rete l'albero, lo storico, le scadenze e il dossier restano consultabili in sola lettura, con un banner che dichiara la data della copia.
  IMPOSTAZIONI: nuova sezione Manutenzione con indirizzo del progetto, chiave anon (campo password), bucket, "Prova il collegamento" (distingue chiave rifiutata / RLS / tabella mancante / server irraggiungibile) e "Dimentica". Scrive `raffyca-supabase` e invalida `raffyca-manut-schema` a ogni cambio.
  INFO ACCORPATA IN IMPOSTAZIONI: `info.html` eliminato, contenuto rifuso nella sezione Guida (tre blocchi a fisarmonica: strumenti, abbreviazioni, come sono fatti i dati). Elenco strumenti aggiornato (mancavano Percorso e Ancoraggio, c'era ancora "Regata"). Tessera Info dell'hub sostituita dalla tessera MANUTENZIONE con la chiave inglese in SVG, come chiesto. SW radice provela-hub-v3 -> v4: `info.html` fuori dal precache, dentro `manutenzione/` e `catalogo.json`.
  PULIZIA: rimosso `vchk.js` dalla radice, script di verifica jsdom finito nel pacchetto l'08/08 (stesso genere del relitto .zip annidato dell'01/08).
  VALIDATO: node --check su tutti gli script inline dei 18 HTML e sui 6 .js; 27 JSON integri; nessun id richiesto dal JS e assente nell'HTML; nessun riferimento orfano a info.html. Test jsdom del modulo con un Supabase simulato e schema VOLUTAMENTE DIVERSO dai primi candidati (65/65): risoluzione delle colonne, albero e gerarchia, esclusione dei previsti dai lavori, ordinamento del da-fare, scadenze calcolate, filtri galleria, dettaglio e modifica componente con guardia anti-ciclo, suggerimenti filtrati per attributi, composizione del titolo, e le due scritture (fatto e previsto) verificate sui nomi di colonna reali. Test dei casi degradati (14/14): senza configurazione e senza rete con copia locale. Test Impostazioni + Hub (19/19).
  DA PROVARE A BORDO: tutto il giro con il database vero, che e' l'unica cosa che i test finti non possono dire. In particolare: che la risoluzione dello schema trovi le colonne giuste (se sbaglia, il modulo lo dice invece di rompersi in silenzio), il caricamento di una foto dal telefono, la stampa del dossier su iOS, e le regole RLS in scrittura.
  APERTO: le migrazioni 001/002 non le ho viste, quindi la mappa dei candidati e' un'ipotesi informata; se una colonna ha un nome fuori elenco va aggiunta in CANDIDATI (un array in cima al file). La tabella `boats` deve contenere la barca: il modulo la cerca per nome dal profilo ProVela e altrimenti prende la prima. La vista `v_da_fare` della migrazione 003 NON e' usata: il modulo ricalcola da interventions+schedules per poter mostrare anche le voci senza scadenza e restare coerente offline.


- [FIX 11/08 MANUTENZIONE - arrivata la migrazione 002, cinque correzioni] Sergio ha ritrovato la 002 (la 001 no). Leggendola sono emersi quattro errori nelle mie ipotesi piu' un problema strutturale che avrebbe impedito al modulo di funzionare del tutto.
  (1) TABELLA PONTE. Si chiama `document_links` e nella mia lista di candidati NON c'era. Peggio: il mio ripiego era `documents.intervention_id`, ma la 002 quella colonna la DROPPA dopo aver travasato i collegamenti. Quindi i documenti non si sarebbero agganciati agli interventi in nessun modo. Ora `document_links` e' il primo candidato.
  (2) BOAT_ID SUL COLLEGAMENTO. `document_links.boat_id` e' NOT NULL e c'e' un trigger (`check_link_stessa_barca`) che verifica che documento, intervento e componente siano della stessa barca. Io scrivevo solo {intervention_id, document_id}: ogni collegamento sarebbe stato rifiutato. Ora la risoluzione dello schema rileva anche la colonna boat e la valorizza.
  (3) DATA DEL DOCUMENTO. E' `data_documento`, non `data`: i documenti sarebbero risultati tutti senza data (galleria non ordinabile, visore muto).
  (4) IMPORTO. E' `importo_totale`, non `totale`: il confronto fra somma degli interventi e totale del documento non sarebbe mai comparso. Anche `nome_file` e `storage_path` sono ora i primi candidati invece che i terzi.
  (5) AUTENTICAZIONE - il problema vero. Le policy della 002 sono `for all to authenticated` con `boat_id in (select my_boat_ids())`. Con la sola chiave anon PostgREST usa il ruolo `anon`: zero righe in lettura e zero scritture, senza nemmeno un errore parlante. Il modulo cosi' com'era non avrebbe mai mostrato niente. AGGIUNTA la sessione: login email/password su `/auth/v1/token?grant_type=password` da Impostazioni, token in `raffyca-supabase-sess`, `Authorization: Bearer <access_token>` al posto della chiave anon in tutte le chiamate REST e Storage, rinnovo automatico su 401 con `grant_type=refresh_token` (una sola richiesta di rinnovo condivisa, non una per chiamata) e ripetizione trasparente della richiesta. Se il rinnovo fallisce, la sessione viene cancellata e il messaggio dice di rifare l'accesso. Senza sessione il modulo non prova nemmeno a leggere: lo dichiara e, se c'e', mostra la copia locale in sola lettura.
  IMPOSTAZIONI: sezione Manutenzione estesa con Email / Password / Accedi / Esci e riga di stato ("Collegato come ..."). "Prova il collegamento" ora distingue quattro casi: server irraggiungibile, chiave rifiutata, tabella assente, e collegato-ma-senza-barche (che di solito vuol dire utenza non associata in `my_boat_ids`). La password non viene mai salvata: si tengono solo i token.
  VALIDATO: node --check su tutti gli script; test del modulo rifatto contro uno schema finto costruito SULLA 002 (document_links con boat_id, data_documento, importo_totale, nome_file, storage_path) - 69/69, incluso il controllo che le richieste viaggino col token utente e non con la anon key; nuovo test autenticazione 23/23 (nessun accesso, token scaduto con rinnovo automatico e una sola chiamata di refresh, login con password sbagliata e giusta, logout); degradati 14/14; Impostazioni+Hub 19/19.
  APERTO: la 001 resta non vista, quindi `components`, `interventions`, `schedules` e `boats` sono ancora risolti per tentativi (funziona, ma i nomi li scopre invece di saperli). `document_links` puo' puntare a un COMPONENTE invece che a un intervento: il database lo prevede, la mia interfaccia no (i documenti si allegano solo agli interventi) - da valutare se serve allegare un manuale direttamente al componente. Le viste `v_documenti`, `v_allegati_intervento` e `v_da_fare` esistono ma non le uso: ricalcolo da tabelle per restare coerente offline.


- [FATTO 11/08 MANUTENZIONE - arrivato lo schema 001, nomi cablati + verifica contro CONVENZIONI] Sergio ha ritrovato `manutenzione-schema.sql` e ha spostato la chat dentro il Progetto, quindi ho finalmente letto `ProVela-CONVENZIONI.md` (nelle due sessioni precedenti NON era accessibile: `/mnt/project` non era montato).
  NOMI CABLATI. Con lo schema in mano i candidati veri sono ora i primi della lista, cosi' la scorciatoia risolve tutto con UNA richiesta per tabella (misurate meno di 12 sonde al primo avvio contro le ~60 di prima). Correzioni: `installato_il` e `garanzia_fino` (io provavo prima `installato`/`garanzia`), `interventions.descrizione` (non `note`). Confermati giusti: `categoria`, `parent_id`, `esecutore`, `costo`, `costo_previsto`, `nome_file`, `storage_path`, `data_documento`, `importo_totale`, `document_links`. Il meccanismo di scoperta resta come rete di sicurezza, ma ora e' un ripiego, non la regola.
  BUCKET SBAGLIATO. Lo schema crea `boat-docs` (privato, 10 MB per file); il mio default era `documenti`, quindi ogni caricamento sarebbe finito su un bucket inesistente. Corretto nel modulo e in Impostazioni. La policy dello storage pretende `{boat_id}/...` come primo segmento del percorso e il mio schema di path lo rispettava gia'. Aggiunti `mime` e `dimensione` sulla riga documento (erano colonne previste e lasciate vuote) e il controllo dei 10 MB lato client, con messaggio esplicito invece dell'errore opaco del server.
  RIPIEGO 1:N ristretto. `documents.intervention_id`/`component_id` esistono nella 001 ma la 002 le DROPPA: cercarle sempre faceva fallire la scorciatoia su documents. Ora si sondano solo se non si trova nessuna tabella ponte.
  TOKEN COLORE - la convenzione e' imprecisa e ho evitato una regressione. La sez. 2 prescrive triplette HSL con `hsl(var(--teal) / .12)`. Avevo convertito il modulo, poi ho verificato: il design system canonico `raffyca.css` definisce i token in HEX; sono Impostazioni e Percorso a usare HSL (eredita' shadcn, lo dice il loro stesso commento), e i moduli vanilla recenti (Cruscotto, Performance, Partenza) usano hex. Soprattutto: la rf-topbar consuma `var(--ink,#deedf5)`, quindi con token HSL le sue regole di colore diventano INVALIDE. Convertire avrebbe sbiadito la barra. REVERTATO ai token hex, tenendo pero' accanto le triplette per le sole trasparenze (`--hteal/--hamber/--hgreen/--hpanel`): cosi' `hsl(var(--hteal) / .16)` segue il tema, mentre un `rgba()` cablato in Notte sarebbe rimasto azzurro sul fondo rosso. Spariti anche gli override per-tema che quel cablaggio richiedeva.
  BUG PREESISTENTE TROVATO E CORRETTO. In IMPOSTAZIONI e PERCORSO i token di pagina sono triplette HSL, quindi la rf-topbar li riceve come `var(--ink,#deedf5)` -> dichiarazione invalida -> nome barca e chip polare NON prendono il loro colore (ereditano il grigio della barra). Difetto cosmetico presente da mesi. Fix: tre righe che ridefiniscono i token in hex sul SOLO scope `.rf-topbar`, inserite FUORI dal blocco delimitato dai commenti, quindi la barra resta byte-identica e la regola d'oro della sez. 3 e' rispettata.
  Aggiunto il fallback `min-height:100vh` prima di `100dvh` (sez. 6).
  VALIDATO: node --check su tutto; test del modulo contro uno schema finto costruito su 001+002+003 completo di tutte le colonne (72/72, incluso il controllo che le sonde siano poche e che le scritture usino i nomi veri); autenticazione 23/23; degradati 14/14; Impostazioni+Hub 19/19.
  DIVERGENZA NOTA NON TOCCATA: la rf-topbar ha due varianti nel repo. In 5 file (anchor, carta, posizione, traversata, xte) le due righe di override tema stanno DENTRO il blocco, negli altri 8 fuori. L'override c'e' ovunque, quindi e' solo posizione: nessun effetto visibile, ma viola la regola "blocco identico ovunque". Da normalizzare in una passata dedicata, non oggi (toccherebbe 13 file per zero resa visiva).
  DA AGGIORNARE IN CONVENZIONI: sez. 1 elenca ancora `info.html` (rimosso, accorpato in Impostazioni) e non elenca Manutenzione e Percorso; sez. 2 andrebbe corretta (hex canonici, HSL solo in Impostazioni/Percorso); sez. 4 va estesa con le tre chiavi nuove; sez. 5 riporta versioni SW vecchie (ora root v4, meteo v13, anchor v11, xte v6).


- [FATTO 21/08 MANUTENZIONE - sei correzioni dopo la prova sul campo di Sergio] Prima sessione di test reale del modulo. Sei rilievi, discussi prima di toccare il codice.
  (1) VERBI. Il participio passato va per i lavori fatti ma non per quelli da fare. Ora ci sono due liste ACCOPPIATE (`AZIONI`, coppie participio/sostantivo allo stesso indice): Sostituito/Sostituzione, Riparato/Riparazione, ecc. Al cambio di modo il titolo si RICONIUGA, ma solo se inizia con un'azione riconosciuta in una delle due forme: "Sostituito girante" -> "Sostituzione girante", mentre un titolo libero ("Carena rifatta a nuovo") resta intatto.
  (2) LISTA PIATTA - scelta di Sergio. Il campo "Fa parte di" nel foglio di registrazione era una mia contraddizione: il CATALOGO E' PIATTO, la gerarchia sta gia' dentro il nome ("Girante pompa acqua mare", "Filtro olio motore"), quindi il menu non poteva che essere vuoto all'inizio e per costruire una catena servivano tre registrazioni preliminari. Campo RIMOSSO dalla registrazione: il componente nuovo nasce sempre al primo livello della sua categoria. La nidificazione resta possibile ma solo nella modifica del componente, per chi la vuole; gli alberi gia' esistenti continuano a rendersi indentati.
  (3) SCADENZE IRRAGGIUNGIBILI. Erano modificabili solo da Barca -> componente -> Modifica; le righe ambra in "Da fare" non erano cliccabili: vicolo cieco. Ora aprono il componente. Nota: il toggle DISATTIVA (`attiva=false`) senza cancellare la riga - comportamento confermato con Sergio.
  (4) ANAGRAFICA A DUE TESTE. Il nome barca compariva in tre punti con tre fonti diverse: topbar sinistra da `raffyca-profile`, seconda casella dalla POLARE (per convenzione della barra: "Te' Salt" era il nome della polare CSV, non un errore), intestazione e Dossier dalla tabella `boats`. Cambiare il modello in Impostazioni non aggiornava il Dossier. Deciso: `boats` resta la fonte per il Dossier (piu' ricca e non legata a un singolo telefono), e Impostazioni diventa l'unico punto di scrittura -> salvando il Profilo, se sei collegato, si allinea da sola la riga `boats` (`window.rfBoatSync`, silenziosa se non c'e' sessione). Aggiunti in Impostazioni CANTIERE, ANNO e MATRICOLA, che vivono solo sul registro e finiscono in testa al Dossier (prima non erano scrivibili da nessuna parte). Tolta la ripetizione del nome: l'intestazione del modulo ora mostra "Beneteau First 36.7 - 2003", non piu' il nome che la topbar gia' dice.
  (5) CANCELLAZIONE CONDIZIONATA. Esisteva solo "Dismesso". Ora: se il componente non ha interventi ne' figli si elimina davvero (con conferma); altrimenti niente bottone e una riga che spiega perche' e rimanda all'archiviazione. Cosi' una voce creata per sbaglio si toglie e uno storico vero non si perde.
  (6) ICONA. Il tratto era 2 dentro un gruppo `scale(1.6667)`, quindi 3,33 effettivi contro il 2 delle vicine, ed era un disegno su griglia 24 buttato in una casella 40 senza centratura. Ridisegnata: scalata numericamente (rx/ry degli archi compresi, flag esclusi) e centrata per iterazione MISURANDO il raster con cairosvg. Ingombro finale 4,5-35,5 su entrambi gli assi, identico ad Ancoraggio, tratto 2, nessun `scale()`.
  BUG TROVATO DAI TEST: `anaCarica()` girava prima che `var ANA` fosse valorizzata (hoisting: definita ma undefined) e faceva esplodere il boot di Impostazioni al primo avvio senza sessione. Spostata in coda. Corretto anche lo svuotamento dei campi anagrafica, che scriveva stringa vuota invece di null.
  VALIDATO: node --check su tutto; nuovo test dedicato alle sei correzioni (24/24, comprese riconiugazione e titolo libero non toccato, nascita al primo livello, scadenza cliccabile, cancellazione permessa e negata); nuovo test anagrafica (13/13, con e senza sessione); regressione 74/74 + 23/23 + 14/14 + 20/20.
  DA PROVARE: il giro completo con database vero, in particolare l'allineamento `boats` alla prima modifica del profilo e l'icona a schermo sul telefono.


- [FATTO 21/08 · PASSATA UNICA SULLA BARRA + CALCOLI DI BORDO + HUB A ELENCO] Sessione decisa insieme: invece di rimandare, si fa una volta sola e non si ripete piu'.
  RF-TOPBAR.JS CONDIVISO. CSS e logica della barra erano DUPLICATI in 13 file (6,7 KB l'uno): ogni ritocco costava 13 file e una-due sessioni di verifica, motivo per cui la normalizzazione era ferma da mesi. Ora stanno in `/rf-topbar.js`, caricato con un tag script. Resta INLINE il solo markup, e in particolare il link alla home: e' l'unico modo per uscire da un modulo e non deve dipendere da un file esterno (se non si caricasse, la barra sarebbe brutta ma funzionante). Da adesso un cambio alla barra costa UN file. Chiusa contestualmente la voce di backlog sulle due varianti divergenti: la validazione ora trova UNA sola variante su 14 file.
  REGISTRAZIONE GPX - il bug severo. La registrazione non stava nella Carta ma nel Cruscotto, e i punti vivevano SOLO nella memoria della pagina: `raffyca-rec` conteneva `{on, pts:<numero>, since}`, cioe' il CONTEGGIO, non i punti. Uscendo dal Cruscotto la pagina veniva scaricata e i punti erano PERSI, non sospesi; la chiave restava con `on:true` e per questo in ogni modulo si vedeva un contatore congelato — la lapide della registrazione morta. Ora il registratore sta in rf-topbar.js, che e' aperto in ogni schermata: i punti si accumulano su localStorage (`{on,since,iv,pts:[[lat,lon,t],…]}`) e il campionamento prosegue qualunque modulo si stia guardando. Aggiunto Wake Lock mentre registra (come Ancora) e ripresa su `visibilitychange`. Il Cruscotto ora ha solo il bottone e delega a `window.rfRec` (avvia/ferma/punti/durata/attiva); il salvataggio su `raffyca-tracks` avviene dentro rfRec, quindi e' identico da qualunque modulo si fermi. Formato punti conforme al contratto: `[lat,lon]`. Retrocompatibile con la vecchia chiave numerica.
  NESSUNA COLLISIONE con Partenza e Percorso, verificato: Percorso usa `raffyca-race-log` e persiste ogni 20 campioni (sopravvive gia'), Partenza usa `raffyca-starts` e registra solo durante il countdown. Restano registratori indipendenti e possono girare insieme.
  CARTA. Non seguiva affatto il GPS: chiedeva la posizione UNA volta all'apertura, quindi il puntino non si muoveva proprio. Aggiunto `watchPosition`; il marker diventa un TRIANGOLO orientato sulla rotta sopra 0,5 kn (sotto e' rumore e resta il punto), con rotta dedotta da due fix quando `heading` non arriva. Scia della registrazione in MAGENTA `#e83ec8` (scelta di Sergio dopo la mia obiezione sul nero: sparirebbe sul fondo scuro in Notte e si confonderebbe con la costa in Giorno; il magenta e' la convenzione dei plotter ed e' l'unico colore non gia' usato).
  CRUSCOTTO. Coordinate da gradi e primi a GRADI DECIMALI a 5 cifre, allineate a Carta e Percorso: era l'unico formato diverso nella suite.
  HUB A ELENCO. La matrice 3 colonne non reggeva con 14 voci (nomi a capo, tessere schiacciate). Ora e' un elenco: icona 34 px a sinistra, nome e descrizione a destra, badge di stato in fondo; su schermi oltre 760 px due colonne per non avere righe lunghissime.
  CALCOLI DI BORDO integrato in `calcoli/`: cinque schede (Carichi, Carteggio, Meteo e maree, Barca, Turni) con una ventina di calcolatori. Interventi: boot-tema a tre stati, token propri sostituiti con quelli della suite mantenendo i nomi locali come alias (--surface, --muted, --warn) per non riscrivere 50 regole, manifest proprio RIMOSSO (il modulo vive dentro la PWA ProVela, non e' un'app a se'), intestazione interna spostata da `top:0` a `top:40px` perche' finiva sotto la barra, topbar canonica. Verificato un calcolo reale: 24 NM a 5,5 kn danno 4h 22m.
  SW: radice v4->v5 (aggiunti rf-topbar.js e calcoli/), anchor v11->v12, xte v6->v7, meteo v13->v14, routing v7->v8 — i quattro moduli con SW proprio devono tenersi in cache il file condiviso, altrimenti offline si aprirebbero senza barra.
  VALIDATO: node --check su tutto, compreso rf-topbar.js. Nuovo test della barra (21/21) che simula il percorso reale con localStorage condiviso tra pagine: avvio dal Cruscotto, passaggio al Meteo dove il contatore CONTINUA a salire e i punti precedenti non si perdono, lettura dalla Carta, chiusura dal Cruscotto con traccia salvata nel formato giusto. Nuovo test Calcoli (12/12). Regressione: 74+24+13+23+14+20 tutti verdi.
  TROVATI E CORRETTI durante i test: il bottone Traccia restava "Traccia" fino al primo giro del timer rientrando nel Cruscotto durante una registrazione (ora si allinea subito); un `</script>` dentro un commento di rf-topbar.js (innocuo con src, ma trappola se qualcuno lo inglobasse inline).
  DA PROVARE A BORDO: la registrazione che attraversa i moduli e' l'unica cosa che i test simulati non certificano fino in fondo — in particolare il comportamento con schermo bloccato e app in background, dove il browser congela comunque la pagina (il Wake Lock aiuta solo a schermo acceso).
  RESTA DA FARE (chiuso 22/08): SOLE E LUNA — vedi voce dedicata piu' sotto nel changelog.


- [FATTO 22/08 (5a passata) · TRAVERSATA: LUCE ALL'ARRIVO + due verifiche] Chiuso il backlog aperto dalla nascita di Sole e Luna.
  TRAVERSATA. Aggiunta la riga "luce all'arrivo" sotto il readout, alimentata da `rf-astro.js` (secondo consumatore del motore condiviso: la scelta di estrarlo il 22/08 mattina si ripaga qui, nessuna riga di astronomia duplicata). Fonti gia' presenti nel modulo: ora di partenza = `FIELD.times[Math.round(STATE.dep)]`, durata = `R.eta` (ore decimali), punto = `R.goal`. Stessa scala a sei stati e stessa scelta di Sole e Luna: nessun giudizio di sintesi, tre voci (stato del sole, contributo lunare, distanza dal passaggio di luce successivo), alert solo sulla condizione fattuale, disclaimer nuvolosita' sempre visibile. In Traversata il terzo dato conta il doppio: qui la partenza si puo' ancora spostare, quindi "arrivi 14 min prima della fine del crepuscolo nautico" e' un'informazione che cambia una decisione.
  DUE TRAPPOLE EVITATE: (1) FUSO — `FIELD.times` viene da Open-Meteo con `timezone=auto`, quindi e' gia' ora locale della zona e combacia con rf-astro; se fosse stato UTC il calcolo sarebbe slittato di due ore in estate, cioe' proprio a cavallo del tramonto. Verificato in `buildURL` prima di scrivere. (2) SAFARI — parser esplicito `parseOraLocale()` con regex invece di `new Date(stringa)`: Safari e' storicamente schizzinoso sulle stringhe ISO senza secondi, e il modulo deve girare su iPhone. (3) La riga non compare se la rotta non chiude (`R.finished` falso): meglio niente che un orario inventato sull'ultimo punto raggiunto.
  SW: `routing/sw.js` v9 -> v10 con `../rf-astro.js` in precache, altrimenti offline il calcolo sparirebbe (era la trappola annotata quando `rf-astro.js` e' nato).
  VALIDATO: smoke test dedicato 14/14 — parsing (compresi formati malformati e con secondi), catena partenza+durata, durata frazionaria (3,5 h -> 09:30), traversata che scavalca la mezzanotte, e la verifica che le preposizioni restino corrette in entrambi i versi del sole.
  ETICHETTA: TOCCA IL LAYOUT (riga nuova sotto il readout, con bordo colorato secondo la condizione di luce).
  FARI IN CARTA — VERIFICATO, ERA GIA' RISOLTO: `fariPick` chiama `fariNear()` ed elenca i fari vicini nel popup come link cliccabili ("Anche qui (n)"), con `fariPickById` per raggiungerli. Il marker sopra puo' anche intercettare il tocco: quello sotto si apre dall'elenco. Voce di backlog chiusa senza toccare codice.
  RIGHE DOPPIE IN BOATS — CHIUSA DEFINITIVAMENTE (verifiche di Sergio su Supabase, 22/08 pomeriggio):
  (a) `create unique index boats_owner_nome_uniq on boats (owner_id, lower(nome))` eseguito SENZA ERRORE. Non e' solo una rete per il futuro: se fossero rimaste righe duplicate il comando sarebbe fallito, quindi conferma che la pulizia era completa. Da ora il duplicato e' impossibile, non improbabile. AVVERTENZA: vincola (owner_id, lower(nome)), quindi una seconda barca con lo stesso nome verrebbe rifiutata.
  (b) Elenco trigger: NESSUNO scrive su `boats`. `tr_check_filters`, `update_objects_updated_at`, `enforce_bucket_name_length_trigger`, `protect_buckets_delete`, `protect_objects_delete` sono di Supabase (schemi realtime e storage). `trg_boats_touch`, `trg_comp_touch`, `trg_int_touch`, `trg_sched_touch` sono BEFORE UPDATE e aggiornano solo `updated_at`. `trg_int_same_boat` e `trg_link_stessa_barca` sono BEFORE INSERT OR UPDATE su interventions e document_links: controlli di coerenza della barca (il secondo e' quello citato nella nota sulla migrazione 002). Nessun AFTER INSERT su auth.users.
  CONCLUSIONE: nessun INSERT nel repo + nessun trigger che scriva su boats => righe create a mano durante le prove, o da una versione del codice precedente a quelle viste. Non e' una certezza, e' cio' che resta dopo aver escluso il resto. La protezione lato codice resta comunque (ancora `raffyca-boat-id`, ordinamento stabile, avviso sulle omonime): serve se un giorno si lavora su un database dove l'indice unico non c'e'.
  [nota storica dell'indagine]  cercato in TUTTO il repo, non esiste alcun POST/INSERT/upsert su `boats`; Manutenzione e Impostazioni fanno solo `select` e `PATCH`. Le migrazioni SQL non sono mai state nel pacchetto, quindi la causa e' fuori dal codice ProVela: versione precedente o inserimenti manuali durante le prove. Sergio ha ripulito e ora la riga e' una sola, e non ne sono ricomparse: l'ipotesi del trigger attivo e' debole. La protezione resta comunque in piedi (ancora `raffyca-boat-id` + ordinamento stabile + avviso sulle omonime). Suggerito a Sergio un indice unico su (owner_id, lower(nome)) come rete definitiva, e la query per elencare eventuali trigger.

- [FATTO 22/08 (4a passata) · CHIUSURA] SEGUI.HTML: documentata nel file la procedura per stringere il token di lettura. Il token li' resta necessariamente nel sorgente (chi segue da terra non puo' inserirlo), ma non deve piu' essere quello di sola lettura GENERALE del database, che permette di leggere qualunque chiave e rende il codice sessione una barriera solo apparente. Procedura verificata sulla documentazione Upstash e scritta come commento sopra CFG:
    ACL SETUSER raffyca_segui on >PASSWORD ~raffyca:pos:* +get -@dangerous
    ACL RESTTOKEN raffyca_segui PASSWORD
  Il token cosi' ottenuto puo' fare solo GET, solo su raffyca:pos:*, e non puo' elencare le chiavi (-@dangerous toglie KEYS e SCAN). Scelto `+get` invece di `+@read` per privilegio minimo: segui.html non usa altri comandi.
  ETICHETTA: solo logica (solo un commento; nessuna riga eseguibile toccata).
  RESTA A SERGIO: eseguire i due comandi su Upstash e incollare il token in segui.html. Finche' non lo fa, segui.html funziona come prima ma con la debolezza descritta.
  CONFERMATO A BORDO dalle passate precedenti: chevron in barra sul telefono (era il caso rotto e il piu' insidioso, si vedeva solo sul dispositivo giusto), righe duplicate in `boats` ripulite e anagrafica corretta.

- [FATTO 22/08 (3a passata) · RITOCCO] POSIZIONE: tolto l'avviso doppio sulla chiave. `#cfgWarn` ripeteva parola per parola il messaggio gia' mostrato sotto il campo, due righe piu' in basso (segnalato con screenshot). Rimosso elemento e logica; resta il solo `#tokMsg`, contestuale al campo. Il messaggio in cima alla pagina (`#txMsg`) non e' un duplicato: parla della trasmissione, non della chiave.
  ETICHETTA: solo logica (un elemento rimosso, nessuna regola CSS toccata).
  ANNOTATO, non modificato: `posizione/segui.html` usa ancora `READ_TOKEN` come costante nel sorgente, e li' DEVE restare — chi apre il link da terra non ha modo di inserirlo, quindi il trucco del localStorage usato per la chiave di scrittura non si applica. Conseguenza da tenere presente: chi riceve il link puo' leggere quel token dal sorgente della pagina; con un token di lettura pieno potrebbe interrogare il database oltre la singola chiave di sessione, quindi il codice sessione NON e' l'unica barriera, al contrario di quanto lascia intendere il testo in Posizione. Mitigazione verificata sulla documentazione Upstash: creare un utente ACL ristretto al prefisso `~raffyca:pos:*` con `-@dangerous` (che revoca KEYS e SCAN) e generare da quello il token REST per segui.html. Da valutare quando si vorra' stringere: non e' urgente, il dato esposto sono posizioni con TTL.
  MANUTENZIONE, "Prometeo" — la causa era piu' grossa del nome. Lo screenshot di Supabase ha mostrato CINQUE righe in `boats`, tutte con nome "Raffyca" e stesso `owner_id`, con cantieri diversi (Beneteau, Prometeo, Promoteo) e un "Te' Salt" finito in `modello`. Nel codice attuale NON esiste alcun INSERT su `boats` (Manutenzione e Impostazioni fanno solo PATCH), quindi le righe vengono da versioni precedenti, da prove manuali o da un trigger nel database: da verificare lato Supabase.
  IL BACO VERO: `trovaBarca` faceva `select=*&limit=50` SENZA ORDER BY e poi prendeva `[0]`. Con righe omonime Postgres non garantisce l'ordine, quindi il modulo poteva agganciare una barca diversa a ogni caricamento — e siccome componenti e interventi sono legati a `boat_id`, il sintomo non era solo il modello sbagliato in testa: erano i DATI che sparivano e ricomparivano. Sergio l'aveva letto come "il modello resta quello sbagliato", che era la faccia visibile del problema.
  CORREZIONE: la riga scelta viene ancorata in `raffyca-boat-id` (localStorage) e riusata; in mancanza di ancora si filtra per nome e si ordina in modo STABILE per id. La stessa ancora e' usata da Impostazioni, altrimenti i due moduli potevano puntare a righe diverse e si sarebbe modificata un'anagrafica mentre il registro ne mostrava un'altra. Aggiunto un avviso in testa a Manutenzione quando le omonime sono piu' d'una: il codice non puo' indovinare quale sia quella buona, quindi lo dice invece di scegliere in silenzio.
  RESTA DA FARE A SERGIO (dati, non codice): capire quale riga ha i collegamenti e cancellare le altre. Query di diagnosi fornita in chat (conteggio di components/interventions per boat_id).

- [FATTO 22/08 (2a passata) · CORREZIONI DA PROVA IN MARE] Sergio ha provato la consegna delle 00:03 su Mac, Android e tablet. Sei interventi, cinque moduli. Root `provela-hub-v6 -> v7`.
  SOLE E LUNA, ripetizione dei tasti che non si fermava (Mac). Diagnosi: `bumpEta` chiamava `renderArrival`, che riscriveva l'intera card con innerHTML. I bottoni venivano quindi DISTRUTTI e ricreati a ogni tick della ripetizione, e il `pointerup` arrivava a un nodo ormai staccato dal documento: `stop()` non girava mai e l'intervallo restava acceso per sempre. Due correzioni: (1) la struttura della card e' ora markup FISSO nell'HTML e `renderArrival` aggiorna solo testi e classi — `bindArrival()` gira UNA volta all'avvio; (2) `bindHold` ascolta il rilascio su `window` invece che sull'elemento, cosi' regge anche se il puntatore esce dal bottone o la finestra perde il fuoco. Test di regressione in jsdom che verifica l'identita' del nodo prima/dopo l'aggiornamento (`before === after`): il baco e' ora strutturalmente impossibile, non solo corretto.
  SOLE E LUNA, riga della soglia. La parola "soglia" era gergo interno e non diceva nulla a chi legge (segnalato da Sergio). Riscritta: "Arrivi 24 min prima della fine del crepuscolo nautico, alle 19:15." Il caso senza soglia non usa piu' quella parola. TROVATO E CORRETTO UN ERRORE MIO PIU' GRAVE, non segnalato: `nextThreshold` usava la stessa banda in entrambi i versi del sole, ma la stessa altezza di -6 gradi la sera e' la FINE del crepuscolo civile e la mattina ne e' l'INIZIO — all'alba il modulo produceva frasi false ("arrivi 9 min dopo la fine del crepuscolo civile" mentre mancavano 20 minuti all'alba). Ora la regola distingue il verso: sera -> confine verso il buio, mattina -> confine verso la luce, pieno giorno -> sempre il tramonto. Aggiunta `durata()` perche' "185 min prima del tramonto" non si legge (oltre 90 min passa a ore). Verificate a mano tutte le frasi generate nei nove casi limite, alba e tramonto compresi.
  BARRA (rf-topbar.js, tocca TUTTI i moduli). (1) Tolta l'icona vela a sinistra del nome barca: il logo e' gia' nel tasto home due caselle piu' a sinistra. (2) Il chevron non compariva su telefono: `white-space:nowrap` + `overflow:hidden` stavano sul BOTTONE, cosi' su schermo stretto il testo spingeva il chevron oltre il bordo e l'overflow lo tagliava — su Mac e tablet c'era spazio e si vedeva. Ora a restringersi e' il solo `.rf-txt` (`min-width:0`, `flex:0 1 auto`), il chevron e' `flex:0 0 auto`. (3) Aggiunta la regola di stampa QUI e non nei moduli, perche' e' la barra a introdurre `body{padding-top:40px!important}`: in stampa barra, pannello, scrim e toast spariscono e il padding va a zero.
  PERFORMANCE. La lista dei record NON ESISTEVA: `raffyca-perf-log` veniva scritto e riletto solo per il contatore, il CSV e l'ultimo valore. Non era un baco di rendering, era funzionalita' mancante. Aggiunta la card "Record salvati": elenco con TWA/TWS/STW, data e ora, mura, AWA/AWS, nota; cancellazione singola con la ×; "Cancella tutti" con conferma. Il tasto "Reset" e' stato rinominato "Svuota campi" (svuotava i campi del modulo, non i record: l'etichetta ingannava, ed e' il motivo della segnalazione) e ha perso lo stile `warn`, che ora spetta alla cancellazione vera.
  MANUTENZIONE, stampa. Il PDF usciva di 4 pagine con dentro i moduli di inserimento. Il CSS di stampa elencava cosa NASCONDERE (`.no-print`), quindi bastava un pannello aperto per finire nel foglio. Invertito: `body > *{display:none}` e si riaccende il solo `#ovDossier`. Aggiunto `@page{margin:14mm}`.
  IMPOSTAZIONI, guida. Aggiunta la sezione "Sole e Luna" (due viste, luce all'arrivo, scala a sei stati, spirale lunare, precisione) e le due voci mancanti nell'elenco strumenti: Sole e Luna e Calcoli di bordo. Il testo e' stato ADATTATO al modulo reale rispetto alla bozza di Sergio, che descriveva ancora il prototipo: niente "verdetto" (rimosso per scelta), e la destinazione e' "traccia attiva o waypoint" per via della gerarchia.
  VALIDATO: `node --check` su TUTTI gli script inline dell'intera suite (15 file, 0 errori) e su tutti i service worker. jsdom Sole e Luna 23/23 (3 nuovi test di regressione sugli stepper e sulla frase). jsdom Performance 12/12, nuovo: elenco, cancellazione singola, e la verifica che "Svuota campi" NON tocchi i record.
  ETICHETTA: TOCCA IL LAYOUT (barra su tutti i moduli, card nuova in Performance, sezione nuova in guida, stampa di Manutenzione).
  DA PROVARE: chevron su telefono (era il caso rotto); assenza della vela in barra su tutti i moduli; ripetizione dei tasti in Sole e Luna su Mac col mouse tenuto premuto; stampa del dossier Manutenzione (deve uscire SOLO il dossier); elenco record in Performance e cancellazione.
  NON RISOLTO, non e' codice: MANUTENZIONE mostra "Prometeo First 36.7" perche' `cantiere` e `modello` arrivano dal record barca su SUPABASE, non da `raffyca-profile`. "Prometeo" e' un dato salvato nel database, va corretto li' (o serve un'interfaccia per modificarlo, che oggi Manutenzione non ha). Da notare: il modello vive in due posti scollegati, il profilo locale e il DB.
  POSIZIONE — RISOLTO nella stessa passata, con `rf-live.js` (nuovo file condiviso, 3o dopo rf-topbar.js e rf-astro.js).
  DIAGNOSI. Non era il sistema operativo ne' lo schermo spento, come avevo detto in un primo momento sbagliando: ProVela e' MULTIPAGINA, ogni modulo e' un documento a se'. Andando da Posizione a Meteo il browser scarica la pagina e con essa `watchPosition`, il timer e la variabile `txOn` — e nulla in localStorage ricordava che la trasmissione era accesa. Il Service Worker NON era un'alternativa: l'API di geolocalizzazione non e' esposta ai worker, un SW non puo' leggere il GPS.
  RIMEDIO. Stato in `raffyca-live` ({on, freq}); ogni pagina che si apre lo legge e, se acceso, riaggancia GPS e timer da sola. Posizione non e' piu' la macchina ma il PANNELLO DI COMANDO: accende, spegne, mostra, e si aggiorna via `rfLive.onChange()`. Resta un buco di 1-3 secondi durante il cambio pagina: irrilevante con intervalli da 30 s in su, ma e' un buco vero e va detto. Aggiunta anche la ripresa fra schede diverse (evento `storage`).
  TOKEN SPOSTATO. Emerso durante il lavoro: `WRITE_TOKEN` era una costante nel sorgente e nel pacchetto e' sempre stato il segnaposto `INCOLLA_QUI_IL_WRITE_TOKEN` — cioe' Sergio lo riscriveva a mano a ogni consegna, e spargere quel file su 15 pagine avrebbe moltiplicato il problema per quindici. Ora vive in `raffyca-live-token` (localStorage), con un campo dedicato in Posizione: si inserisce UNA volta e sopravvive agli aggiornamenti. Resta un segreto in chiaro sul dispositivo, ma da' accesso in scrittura al solo database delle posizioni. NOTA PER SERGIO: alla prima apertura dopo questa consegna la chiave va inserita una volta in Posizione, poi mai piu'.
  CORRETTO UN DIFETTO EMERSO DAL TEST: al primo fix GPS non si inviava nulla fino allo scadere del timer — con frequenza a 60 minuti e un fix che arriva pochi secondi dopo l'avvio, la prima posizione sarebbe partita un'ora dopo. Ora il primo fix utile invia subito.
  COSTO DI DEPLOY: una riga in 15 pagine (14 moduli + hub), piu' il bump dei 5 service worker. E' la passata che Sergio valuta 1-2 sessioni sul suo lato, qui giustificata da una ragione funzionale e non estetica. SW: root `v6 -> v7` (+ rf-live.js), `raffyca-meteo-v14 -> v15`, `anchor-v12 -> v13`, `xte-v7 -> v8`, `raffyca-rt-v8 -> v9`, tutti con rf-live.js in precache accanto a rf-topbar.js.
  VALIDATO: smoke test jsdom dedicato 29/29 con due DOM successivi che condividono lo stesso localStorage, cioe' la simulazione del cambio modulo. Verificano: a freddo non trasmette; senza token non invia ma lo stato resta; col token invia con l'header giusto e il payload corretto; LA PAGINA NUOVA RIPRENDE DA SOLA mantenendo la stessa sessione (il link di chi segue resta valido); lo stop e' persistente e una pagina nuova non riparte; `raffyca-pos` resta aggiornato da qualunque modulo.
  DA PROVARE A BORDO: avviare la trasmissione, cambiare due o tre moduli e verificare sul link di chi segue che i punti continuino ad arrivare; il campo chiave in Posizione; che il pallino GPS in barra resti vivo negli altri moduli.

- [FATTO 22/08 · SOLE E LUNA — nuovo modulo, `rf-astro.js` condiviso] Tradotto in vanilla il prototipo React di 1119 righe (motore astronomico validato contro astronomy-engine: sole/crepuscoli < 5 s, luna < 9 s). Due file nuovi: `rf-astro.js` (281 righe) e `sole-luna/index.html` (972 righe).
  RF-ASTRO.JS. Stesso schema di rf-topbar.js: un file solo, `<script src="../rf-astro.js">`, nessuna dipendenza dal DOM. Costruito da subito (non solo quando servira' a Traversata/Cruscotto) perche' le funzioni erano gia' pure: farlo ora o estrarle poi costa uguale, farlo ora evita di ritoccare Sole e Luna quando arrivera' il secondo consumatore. VALIDATO NUMERICAMENTE: script di confronto riga per riga fra l'output del prototipo originale e rf-astro.js su sole/luna/illuminazione/sunTimes/moonTimes/track per una data e un punto reali — delta 0 su ogni valore (nessuna approssimazione introdotta dalla riscrittura ES5). Aggiunte due funzioni nuove non presenti nel prototipo: `nextThreshold` (soglia rilevante, vedi sotto) e `arrivoAlBuio` (alert fattuale: sole sotto -12° e contributo lunare trascurabile, stessa soglia di `lightAt`).
  SCELTA DI PRODOTTO RIBALTATA RISPETTO AL PROTOTIPO: la card "Che luce trovero' all'arrivo" nel prototipo terminava con un `verdict()` che restituiva un giudizio di sintesi ("Buio nautico e luna inutile: ingresso al buio..."). Discusso con Sergio PRIMA di toccare il modulo: il giudizio nasconde un'inferenza sulla nuvolosita' che non abbiamo. Rimosso, sostituito da una composizione a tre voci non giudicanti: (1) stato del sole, uno dei sei della scala; (2) contributo lunare con fase e altezza; (3) distanza dalla soglia rilevante in minuti, non lo stato stesso ("mancano 24 min alla fine del crepuscolo nautico", non "sei in crepuscolo nautico"). Alert SOLO per la condizione fattuale (arrivoAlBuio). Disclaimer sulla nuvolosita' sempre visibile, non a piè di pagina.
  SOGLIA RILEVANTE (nextThreshold): confine di uscita dello stato corrente nella direzione del tramonto se l'ETA cade nella meta' del giorno solare dopo il transito, verso l'alba se cade prima. Nessuna soglia oltre il crepuscolo nautico (livello 4-5): il conto alla rovescia non aiuta piu' una decisione li'. Verificato con due casi a mano (arrivo 40 min dopo il tramonto, arrivo 25 min prima della fine del crepuscolo nautico) — risultati coerenti.
  GERARCHIA ARRIVO, decisa con Sergio: traccia attiva batte WP attivo, stessa regola del Cruscotto (capo della traccia nel verso di percorrenza, non il punto successivo lungo la rotta — per questa stima e' la distanza in linea d'aria dalla posizione GPS al capo, non il residuo esatto lungo la traccia: sarebbe servito duplicare tutta la macchina di proiezione/aggancio del Cruscotto per un pannello di pianificazione, non uno strumento di governo). NOTA PER QUANDO TOCCHERA' A TRAVERSATA (backlog, non bloccante): Sergio ha chiesto la stessa gerarchia anche li'.
  SORGENTE (selettore in alto): solo GPS + WP attivo, niente elenco di tutti i waypoint (scelta di Sergio). Si nasconde da sola se non c'e' un WP attivo (resta solo il chip GPS).
  SOG: `raffyca-pos` non lo porta (e' solo `{lat,lon,ts}`, confermato leggendo tutti gli 8 scrittori nel pacchetto) — lo tiene il Cruscotto ma solo in memoria, non lo scrive da nessuna parte condivisa. Sole e Luna se lo stima da se' con un proprio `watchPosition` e due fix ravvicinati (media su un piccolo buffer), esattamente come fa il Cruscotto al suo interno. Finche' non arrivano due fix la velocita' resta quella manuale (default 5,5 kn); i tasti +/- congelano il valore (ST.speedAuto=false) fino a un reset implicito quando cambia la destinazione.
  TEMI: token di chrome (bg/panel/panel2/dp/line/ink/sub/teal/amber/coral) allineati a quelli VERI di raffyca.css per Scuro e Giorno (stessi valori di Manutenzione/Calcoli, verificati riga per riga). Notte: chrome allineato allo stesso rosso del resto della suite (per coerenza della rf-topbar condivisa, che prende var(--teal) ecc. da qualunque pagina la ospiti), MA la palette del canvas (sole/luna/volta celeste: sphIn, sun, moonLit, ecc.) resta quella del prototipo, gia' pensata e validata per la visualizzazione astronomica — sono namespace separati, la seconda non tocca la rf-topbar. Tema locale del prototipo (i tre bottoni Scuro/Giorno/Notte) RIMOSSO: il controllo canonico e' Impostazioni, come in ogni altro modulo.
  SW: nessun SW proprio, network-first dal SW radice (come Manutenzione/Calcoli, non come Meteo/Ancora/XTE/Traversata) — nessuna dipendenza da API esterne, resta disponibile offline una volta aperta online la prima volta. Root `provela-hub-v5 -> v6`: aggiunti `rf-astro.js` e `sole-luna/` al precache. Tessera nuova nell'hub (elenco, non piu' matrice) fra Calcoli e Manutenzione.
  VALIDATO: `node --check` su tutti gli script inline (rf-astro.js, sole-luna/index.html, index.html) e su sw.js. Confronto numerico completo rf-astro.js vs motore del prototipo (vedi sopra). Smoke test jsdom dedicato (16/16): boot senza destinazione (card vuota col messaggio giusto, un solo chip GPS), boot con WP attivo (due chip, nome destinazione/distanza/stato-luce/disclaimer presenti in card), cambio vista Giorno<->Sfera. Verifica incrociata id JS<->HTML e var(--token) CSS<->:root sull'intero file: nessun orfano. NOTA sui limiti di jsdom (sez. 7 delle convenzioni): canvas stub a vuoto (clientWidth 0 in jsdom fa gia' da guardia nelle drawSphere/drawChart), quindi il disegno vero non e' testato qui.
  ETICHETTA: TOCCA IL LAYOUT — modulo nuovo, tutto da vedere su device. DA PROVARE A BORDO: leggibilita' e contrasto nei tre temi (in particolare Notte, con la palette rossa); disegno della sfera 3D e trascinamento yaw/pitch su Android e iOS (canvas + touch, mai provato fuori da jsdom); il grafico giorno con lo scrub touch; la stima del SOG da due fix GPS ravvicinati (quanto tempo serve perche' converga a un valore sensato); switch del tema da Impostazioni e rientro nel modulo; icona della tessera hub (luna a falce sovrapposta al sole, mai vista a schermo).
  APERTO (backlog, non bloccante): condizioni di luce all'ETA in Traversata e Cruscotto, ora possibile con `rf-astro.js` gia' pronto — quando si fa, ricordare la gerarchia traccia>WP anche li' (richiesta di Sergio) e bumpare il precache di `routing/sw.js` (Traversata ha SW proprio) per il nuovo file condiviso.

- [FATTO 21/08 · PANNELLO "STATO DI BORDO" nella barra] Problema posto da Sergio: la registrazione si avviava e si fermava SOLO dal Cruscotto (te lo devi ricordare), e waypoint e traccia attiva si disattivavano solo dalla Carta — "un po' da smanettoni". Ma senza sporcare la barra con tasti nuovi.
  SOLUZIONE: nessun tasto nuovo. La zona di stato a destra GIA' mostra REC / traccia / WP, cioe' esattamente le tre cose su cui si vuole agire: e' diventata un bottone. Aggiunto solo un chevron di ~10 px che resta anche a zona vuota, altrimenti nessuno scoprirebbe che li' si preme. Due tasti dedicati sarebbero costati larghezza proprio a nome barca e polare, che sul telefono si mangiano gia' fino all'80% della barra.
  PROTOTIPO PRIMA DEL CODICE, come da convenzioni sez. 11: due varianti (tendina sotto la barra / foglio dal basso) x tre temi x quattro stati, toccabile. Sergio ha scelto la TENDINA (variante A): apre da dove premi, il legame col punto toccato e' evidente.
  CONTENUTO: (1) Registrazione — avvia/ferma da qualunque modulo, con durata, punti e miglia percorse. (2) Navigazione — waypoint attivo o traccia attiva con "togli", piu' l'elenco dei waypoint ORDINATI PER DISTANZA con rilevamento (in mare "i piu' vicini per primi" batte l'ordine alfabetico); senza posizione ripiega sull'alfabetico. Mostra i primi 7 e dichiara quanti altri ce ne sono.
  GERARCHIA RESA VISIBILE: se c'e' una traccia attiva il Cruscotto ignora il waypoint, comportamento che finora avveniva in SILENZIO. Ora il pannello lo scrive. Scegliere un waypoint dal pannello toglie la traccia attiva, perche' altrimenti la scelta non avrebbe effetto.
  CONFINE DICHIARATO: il pannello SCEGLIE soltanto. Per creare o modificare waypoint si va nella Carta, e c'e' scritto. Senza questo paletto fra sei mesi ci sarebbero due gestori di waypoint che si contraddicono.
  DIVIDENDO DELL'ESTERNALIZZAZIONE: lo <span id="rfStatus"> del markup inline viene PROMOSSO a <button> dal file condiviso a runtime. Cioe' la struttura della barra e' cambiata senza riaprire i 14 file — verificato prima che nessun modulo tocchi rfStatus/rfBoat/rfPol/rfGps. L'intera modifica e' UN file, `rf-topbar.js`. Il percorso della Carta viene ricavato dall'href della home, che e' gia' corretto per ogni profondita'.
  Etichetta REC accorciata da "REC GPX ·" a "REC ·" per far posto al chevron. Chiusura con Esc, tocco fuori, o dopo una scelta. aria-haspopup/aria-expanded, prefers-reduced-motion rispettato.
  VALIDATO: test del pannello 34/34 (promozione a bottone, ordinamento per distanza verificato su 8 waypoint dati di proposito in ordine sbagliato, rilevamento a tre cifre, scelta e disattivazione, gerarchia traccia/WP, ciclo completo di registrazione dal pannello con nome della traccia, tre modi di chiusura) e test multi-modulo 30/30 (hub con home="#", sottocartelle, e la Traversata che ha nome file diverso — il link alla Carta si deriva giusto in tutti). Regressione: 74+24+13+23+14+20+21+12 verdi.
  DA PROVARE: raggiungibilita' col pollice sul telefono. La tendina apre dall'alto, che con una mano sola in pozzetto e' la cosa che potrebbe dare fastidio: se succede, passare al foglio dal basso costa tre righe di CSS nello stesso file.


## Bug noti aperti (aggiornamento)
- Fari sovrapposti: RISOLTO 08/08 (selettore "Anche qui" nel popup).
- Boe: incluse e cliccabili 08/08. Distinzione visiva boa-vs-faro sulla mappa: opzionale, non fatta.

- [DIAGNOSI+FATTO 08/08 AIS] Segnalazione: AIS "in ascolto" ma 0 navi, mentre MarineTraffic vede traffico nella stessa zona (Gallura/La Maddalena). Verificato il codice AIS (carta/index.html) contro la documentazione AISstream.io ATTUALE: è CORRETTO — subscription {APIKey, BoundingBoxes:[[[lat,lon],[lat,lon]]] angoli opposti, FilterMessageTypes:["PositionReport","ShipStaticData"]}, endpoint wss://stream.aisstream.io/v0/stream, parsing MetaData.MMSI/latitude/longitude/ShipName (doc conferma lat/lon minuscoli). Che si arrivi a "in ascolto" (non "chiusa") prova che la chiave è accettata. CONCLUSIONE: 0 navi NON è un bug nostro. Cause: (1) AISstream è un feed di ricevitori terrestri della community, niente satellite affidabile → attorno alla Sardegna NE la copertura può essere scarsa mentre MarineTraffic aggrega molte più fonti; (2) AISstream richiede INTERNET → inutile al largo senza copertura cellulare. È quindi una funzione "sottocosta con dati", non offline.
  MIGLIORIE FATTE (Carta, nessun SW): (a) aisBBox() ora ha una dimensione MINIMA (~±0.4° lat / ±0.5° lon, box ~89 km) anche a zoom stretto, oltre alla vista corrente: a zoom da porto prima il box era ~5 km e pescava pochissimo; a zoom largo domina la vista. (b) Dopo 20 s con 0 navi lo stato diventa "in ascolto · 0 navi qui (copertura AISstream scarsa?)" per non lasciare l'utente nel dubbio. Verificato node --check + dimensione box.
  RACCOMANDAZIONE STRATEGICA (per l'AIS vero, offline e affidabile a bordo): serve un RICEVITORE AIS sul bus NMEA2000/SeaTalkng (i50/i60 sono vento/log/eco, NON AIS) esposto via Signal K (WebSocket/REST) e letto localmente da ProVela — coerente col percorso Signal K già anticipato (signalkUrl/windSource) e con l'hardware HALPI2/RPi. AISstream resta l'opzione "vicino a riva con dati". Diagnostica utile: col box più largo, se sottocosta con dati vedi ancora 0 navi → conferma buco di copertura AISstream lì; se ora compaiono navi → era il box piccolo.

- [FATTO 08/08 S — difesa dati] Contro l'episodio di azzeramento (barca/WP/tracce spariti, Android PWA). Nuovo modulo rfBackup (IIFE window.rfBackup), inline e identico in Hub e Impostazioni. Meccanismo: snapshot automatico di TUTTE le chiavi raffyca-* in IndexedDB (DB 'raffyca-backup', store 'snaps', rolling ultimi 5), archivio SEPARATO dal localStorage così sopravvive a un suo azzeramento. Non sovrascrive mai con vuoto (se collect() è vuoto non salva, per non perdere lo snapshot buono).
  HUB (index.html): all'avvio rfBackup.snapshot() + (dopo 800 ms) checkLoss() — se il localStorage NON ha alcuna chiave raffyca-* ma esiste uno snapshot, chiede conferma e ripristina + reload. Nessun falso prompt per utenti nuovi (nessuno snapshot → niente offerta).
  IMPOSTAZIONI (impostazioni/index.html): stessa IIFE + sezione "Backup dati" con stato ultimo backup, "Esporta backup (file)" (scarica JSON {app,ts,keys} con nome ProVela-backup-YYYYMMDD-HHMM.json) e "Importa da file" (con conferma, filtra solo chiavi raffyca-, poi reload). snapshot() anche all'apertura di Impostazioni.
  Hub/Impostazioni network-first (SW radice serve HTML fresco) → nessun bump. Nessun Supabase. VALIDATO: node --check OK (dopo fix: avevo accidentalmente rimosso un </script>, ripristinato; tag bilanciati 4/4 e 6/6); test logica pura in isolamento (collect solo raffyca-*, export shape, wipe→checkLoss offre, restore, import filtra chiavi estranee). IndexedDB/Blob/FileReader non testabili in node ma standard (OK anche iOS).
  CAVEAT iOS: il download del file via <a download>+Blob su iOS Safari può APRIRE il JSON invece di scaricarlo (limite iOS) — l'utente può comunque salvarlo/condividerlo; la difesa vera (auto-snapshot IndexedDB + ripristino) non dipende dal download. DA PROVARE A BORDO: azzerare i dati e riaprire l'hub → offerta di ripristino; export/import in Impostazioni; verifica su iOS.
  OPZIONALE non fatto: agganciare snapshot/checkLoss anche a Carta (ingresso via deep-link) — al momento coperti Hub+Impostazioni.

- [FATTO 08/08 m — analisi partenza (opzione B)] Partenza registrava già i campioni a 1 Hz in raffyca-starts ({t al via, lat, lon, sog, cog, dist linea, ttl, ocs}), ma l'archivio solo elencava/esportava/eliminava. Aggiunta la VISTA DI ANALISI della singola partenza (come lista→replay di Percorso, ma con metriche+grafico nel tempo).
  Tap su una partenza in archivio → pannello (#archAn) con "‹ archivio" per tornare. startStats(s) calcola: distanza dalla linea al via (campione con t più vicino a 0; firmata, <0 = oltre), OCS (dist<0 al via o flag ocs), velocità al via, timing linea (t interpolato del passaggio dist +→-: <0 anticipo, >0 ritardo, null se non attraversata), velocità media/max nell'ultimo minuto, n campioni + durata. Sei KPI (an-kpis) con colori semantici (OCS/oltre = coral). drawStartChart(s): SVG dual-axis distanza(m, teal) e velocità(kn, ambra) vs secondi al via, con riga VIA (t=0, coral) e riga linea (dist=0). Wiring: click sull'item (esclusi i tasti Esporta/Elimina) apre l'analisi; renderArchive() torna alla lista. CSS .an-kpis/.an-kpi dedicato.
  NOTA scope B: niente piano spaziale né scrubber (era l'opzione C). Il grafico distanza/velocità-nel-tempo funziona su TUTTE le partenze già in archivio (usa solo i campioni). La registrazione NON salva la geometria della linea → un eventuale piano spaziale (C) richiederebbe di salvarla da lì in avanti.
  Partenza servita dal SW radice (network-first) → nessun bump. VALIDATO: node --check OK (tag 4/4); test startStats su 3 casi (buona: 4m/no OCS/cross null; OCS: oltre 12m/anticipo 5s; tardi: 60m corto/ritardo 9s) tutti corretti. jsdom pieno non fatto. DA PROVARE A BORDO: registrare qualche partenza e aprirla dall'archivio → KPI coerenti e grafico leggibile su schermo piccolo.

- [DEBUG COMPLETO 08/08] Passata di verifica su TUTTO il pacchetto (non solo i file toccati oggi). Strumenti: node --check su ogni script inline + ogni .js; bilanciamento tag <script>; ID referenziati dal JS vs presenti nell'HTML; funzioni chiamate ma non definite (con commenti/stringhe rimossi); mappa chiavi localStorage (chi scrive/chi legge); confronto della topbar tra i 13 file; link/risorse locali; integrità dei 22 file JSON/GeoJSON; smoke test jsdom (boot reale, 6 moduli) + test FUNZIONALI che verificano il DOM popolato.
  RISULTATI: 18 HTML + 7 JS con sintassi e tag OK; 22 file dati integri; nessun link rotto (gli "isobate_/coastmasks/" sono URL prefisso+slug: verificati tutti e 9 gli slug ISO_SLUG contro i file presenti); 6/6 moduli si avviano senza errori runtime.
  BUG TROVATO E CORRETTO #1 — PERFORMANCE, VMG/angoli di bolina sbagliati (PREESISTENTE, non introdotto oggi; il box TWA/AWA lo ha reso visibile). drawSharedPolar cercava la VMG su tutto il range 0..180 a passo 3, ma polSpan AGGANCIA ogni TWA sotto il primo angolo della polare al primo valore; siccome VMG=stw*cos(twa) e cos(0°)=1 > cos(40°)≈0.77, la VMG "finta" a 0° vinceva sempre → bolina riportata a TWA 0° e VMG di bolina GONFIATA (test: 0°/VMG 4.90). FIX: il disegno continua a usare il range pieno (pts 0..180, invariato), mentre la ricerca della VMG usa un array separato vmgPts limitato agli angoli realmente coperti [max(25,primo TWA) .. min(179,ultimo TWA)] a passo 1°. Dopo il fix: bolina 45° TWA / 31° AWA, VMG 3.89; lasco 169°/158°. NOTA: il valore "VMG bolina" mostrato finora agli utenti era sbagliato per le polari che partono da 40-52° (cioè tutte le ORC) — ricontrollare a bordo con la polare reale.
  BUG TROVATO E CORRETTO #2 — TOPBAR divergente in Partenza (violazione della regola "byte-identica"). partenza/index.html aveva una versione più vecchia di polarLabel/tickPolar: restituiva {txt,cls} senza il campo boat e usava model=profilo.model, mentre gli altri 10 moduli usano {txt,cls,boat} e model=L.boat||profilo.model. Effetto: con una polare "generica" Partenza mostrava "pol <nome barca>" invece di "<nome barca> · pol generica". Allineata alla versione canonica. Verifica: topbar ora IDENTICA in tutti e 13 i file (hash uguale a meno degli href, legittimamente diversi: hub "#", info "index.html", moduli "../").
  CODICE MORTO INDIVIDUATO (nessun crash, NON rimosso — da valutare in una passata di pulizia): percorso/index.html renderTwd/renderTws/renderDials + CSS .dials/.dial scrivono su #dialTwd/#dialTws/#twdV/#twsV che NON esistono più nel DOM (residuo dei dial sostituiti dagli slider orizzontali) ma renderDials non è mai chiamata → innocuo; routing/raffyca-traversata-map.html geocode()/createCustomArea() mai chiamate (usano #q/#qarea/#findBtn inesistenti); meteo/index.html toggleLight() mai chiamata, scriverebbe la chiave fuori contratto 'raffyca_light' (underscore) — il tema vivo usa raffyca-theme + html.day/night. Falsi positivi verificati e scartati: gpsDot/gpsTxt e themeBtn e areaBtn sono guardati con if(el); rad/deg in carta sono arrow function a riga 297.
  SW: anchor-v10, raffyca-meteo-v13, xte-v6, provela-hub-v3 (radice, network-first per HTML), routing. VALIDATO dopo i fix: node --check OK su tutti, smoke 6/6, funzionali OK (Performance bolina/lasco coerenti; analisi Partenza su caso buono e caso OCS con colori corretti; menu regata nell'ordine none→cruscotto→percorso→diretto→url; slider boa min=10; #mkFix presente; rfBackup esposto; nessun residuo rInner).

---

## 27/08/2026 — Correzioni da uso in mare (Manutenzione, Traversata, Carta, Sole e Luna, diagnostica storage)

**Etichetta: tocca il layout** (Manutenzione, Carta e Sole e Luna cambiano struttura visibile; Traversata e Impostazioni solo logica + un pannello nuovo). Serve prova su dispositivo e in PWA installata.

### rf-astro.js — conto alla rovescia esteso al crepuscolo astronomico *(solo logica)*
`nextThreshold()` restituiva `null` per `level >= 4`, cioe' sia crepuscolo astronomico (sole −12…−18) sia notte piena (sotto −18). I due moduli consumatori avevano lo stesso ripiego `else if(level>=4)` con il testo "il sole e' sotto i −18°": con sole a −13° la frase contraddiceva la fascia dichiarata nella riga sopra (segnalato con screenshot, arrivo 22/08 21:19).

Ora la soglia si ferma a `level >= 5`. Aggiunti due confini:
- sera, livello 4 → **fine del crepuscolo astronomico** (`astronomical.set`)
- mattina, livello 4 → **inizio del crepuscolo nautico** (`nautical.rise`)

Vale la stessa asimmetria alba/tramonto gia' corretta il 22/08: il confine dipende dal verso del sole, non solo dalla fascia. Il livello 5 resta senza conto (prima dell'alba astronomica del giorno dopo non c'e' nulla da attendere) e conserva il testo "sotto i −18°", che ora e' vero perche' scatta solo li'.

Validato su 96 campioni a 15 minuti (Ancona, 22–23 agosto) piu' il solstizio d'inverno: nessun caso di conto alla rovescia a notte piena, nessun caso di ripiego "−18" con sole sopra −18. Il caso dello screenshot ora stampa "arrivi 25 min prima della fine del crepuscolo astronomico".

Consumatori aggiornati: `routing/raffyca-traversata-map.html`, `sole-luna/index.html`.

### Manutenzione — sei correzioni *(tocca il layout)*
1. **Foto da libreria**: rimosso `capture="environment"`, che e' un ordine al browser ("apri la fotocamera") e non un suggerimento. Senza, Android e iOS mostrano il menu completo (Libreria / Scatta / Sfoglia). Aggiunto `multiple` su foto e documenti.
2. **Campo Note** sull'intervento (textarea). La colonna esisteva gia' in `SCH.interventions.note` (`descrizione`/`note`), era solo non esposta. Scritta in creazione e in modifica, riletta all'apertura, mostrata in elenco Lavori sotto il titolo.
3. **Elenco allegati completo**: `disegnaDocForm()` faceva `if(!d) return;` e scartava in silenzio ogni allegato il cui documento non fosse in `ST.docs`. Ora la voce resta visibile come "documento non piu' disponibile" e il conto torna sempre.
4. **Coda di caricamento visibile**: i file in transito compaiono nel form con il loro stato (in corso / fallito con motivo e tasto "riprova"). Prima l'unico segnale era un toast di 3,2 s su un nodo unico: allegando piu' foto di fila, il toast di errore veniva sovrascritto dal "Documento caricato" successivo. E' la causa piu' probabile delle foto che "sparivano". La coda si azzera all'apertura di ogni form.
5. **Limite 4 foto** per intervento (`MAX_FOTO`), contatore a schermo, tasto Foto disabilitato al raggiungimento. Le foto in coda contano, quelle fallite no. I documenti/PDF non sono limitati.
6. **Compressione prima dell'upload**: canvas, lato lungo 1600 px, JPEG q 0.75. Non si comprime sotto i 350 kB, e si ripiega sull'originale se il risultato non guadagna nulla o se il browser non sa decodificare il file (HEIC di iPhone: Safari lo apre, Chrome su Android no). Costruttore `File` con fallback per WebView vecchie.
7. **"Fatture" + "Preventivi" → "Documenti"**: un solo chip di filtro, `passaFiltro()` copre fattura/preventivo/documento/ricevuta/scontrino. Il campo `tipo` sul database **non cambia**: cambia solo come si filtra e come si chiama a schermo. Il tasto del form non alterna piu' "Fattura"/"Preventivo".

### Carta nautica — cartelle collassabili *(tocca il layout)*
Intestazione cartella cliccabile con freccia. Le cartelle nascono **chiuse**; fa eccezione quella che contiene l'elemento attivo (WP o traccia), che si apre da sola. Una volta toccata, la scelta dell'utente vince sempre e viene ricordata.

Nuova chiave `raffyca-folders-open` `{ "wpt:f123": true, "trk:__none__": false }` — stato per cartella **e per scheda**. Eliminando una cartella si cancella anche il suo stato. Rinomina/elimina fermano la propagazione, cosi' non aprono/chiudono per sbaglio.

### Sole e Luna — tasto "aggiorna" *(tocca il layout)*
Tasto nell'intestazione della card Arrivo: rilegge WP/traccia attiva e posizione GPS, ricalcola l'ETA e lo riporta in modalita' "calcolato" (una correzione manuale fatta su un'altra destinazione sarebbe peggio che perderla).

Aggiunto anche il ricalcolo automatico su `visibilitychange` e su `pageshow` con `persisted` (bfcache di Safari/iOS). ProVela e' multipagina, ma in PWA la pagina resta viva in background: cambiando WP dalla Carta e tornando qui, `destPoint()` non veniva piu' riletto e l'ETA restava ancorato alla vecchia destinazione — oltre a invecchiare da solo, essendo legato a `Date.now()`. Se la destinazione cambia mentre la pagina e' in primo piano il tasto si accende in ambra (controllo ogni 5 s) invece di aggiornare di nascosto.

### Partenza / Percorso — dati persi: diagnosi e strumenti *(solo logica)*
Segnalata perdita dei dati salvati **solo** in questi due moduli, mentre tracce e waypoint di Carta nautica erano intatti. Nessun codice cancella quelle chiavi: `raffyca-starts`, `raffyca-startline`, `raffyca-race-course`, `raffyca-race-log` non compaiono in nessun `removeItem`, e sia il backup sia il reset di Impostazioni lavorano sull'intero prefisso `raffyca-`.

**Ipotesi principale: quota localStorage esaurita.** Tutte le scritture dei due moduli erano in `try{...}catch(e){}` **muto**: con lo spazio finito il salvataggio fallisce senza nessun segno e il dato precedente resta congelato. Torna con il fatto che tracce e WP — scritti *prima* — siano sopravvissuti mentre tutto quel che e' arrivato dopo no. I divoratori: `raffyca-tracks` (una traccia di dieci ore a un punto ogni 5 s vale centinaia di kB) e `raffyca-manut-cache`, che contiene l'intero registro di manutenzione.

Due strumenti per confermarlo o escluderlo al prossimo giro:
- **Impostazioni › Dati › Spazio usato**: totale, barra e classifica delle 12 chiavi piu' pesanti (misura chiave+valore in UTF-16, come contano Chromium e WebKit, tetto ~5 MB). Si apre da solo oltre il 70%.
- **Scritture non piu' mute**: `writeJSON` in Partenza e `save`/`saveLog` in Percorso avvisano a schermo quando falliscono, dicendo che il dato **non** e' stato registrato e dove andare a liberare spazio.

Se al prossimo controllo lo spazio risulta sotto il 50% l'ipotesi cade e si cerca altrove.

### Service worker
`sw.js` radice → **provela-hub-v8**, `routing/sw.js` → **raffyca-rt-v11**. Obbligatorio: il SW radice serve tutto cio' che non e' navigazione in **cache-first**, quindi `rf-astro.js` (modificato) resterebbe alla versione vecchia. Nota: le CONVENZIONI riportavano ancora `provela-hub-v3`, valore superato.

### Validazione
`node --check` su tutti gli script inline toccati e sui due `sw.js`; 49 smoke test jsdom verdi; test numerico rf-astro su 96 campioni + solstizio; `json.load` su tutti i JSON/GeoJSON/webmanifest (27 file). **Nessuno di questi test dice nulla su come appare a schermo**: cartelle, coda allegati, tasto aggiorna e pannello spazio vanno guardati sul tablet e in PWA installata.

### Aperti
- Foto "solo 2": nel codice non esisteva alcun limite a due. La correzione punta sulla causa piu' probabile (upload falliti in silenzio). Se dopo questa consegna il problema si ripresenta, ora sara' visibile *dove* si rompe.
- Bug layer Fari con due fari quasi sovrapposti (invariato).
- Monotonia isocrone Traversata fase 2 (invariato).

---

## 28/08/2026 — Nuovo modulo MOB (uomo in mare)

**Etichetta: tocca il layout.** Modulo nuovo `mob/`, piu' `rf-topbar.js` (sezione nuova nel pannello e stato in barra: cambia in tutti e quattordici i moduli), hub e service worker.

### Ipotesi quota localStorage: SMENTITA
Il pannello Spazio usato consegnato il 27/08 riporta **0,7%** dello spazio disponibile, circa 36 kB su ~5 MB. Non c'e' mai stata pressione sulla quota, quindi la perdita dati di Partenza e Percorso ha un'altra causa. Le scritture rumorose e il pannello restano (servono comunque), ma la diagnosi va rifatta da capo. Prossimo passo: verificare se `raffyca-starts` e `raffyca-race-course` compaiono nella classifica vuote (qualcosa le ha riscritte) o non compaiono affatto (mai scritte o rimosse) — sono due strade diverse, e la lista lo dice a colpo d'occhio.

### Il modulo
Quattro dati, come da richiesta, ma il quarto e' cambiato in fase di progetto. "Tempo per arrivare" e' stato scartato: presuppone rotta diretta a velocita' nota, che sotto vela non succede mai (si straorza o si abbatte), e un numero che dice "2 minuti" durante una manovra e' peggio di nessun numero. Al suo posto **scarto di rotta**, il dato che il timoniere usa davvero.

**La direzione si costruisce sul COG del GPS, mai sul magnetometro.** A bordo la bussola del telefono e' falsata da massa ferrosa ed elettronica e in cabina e' inservibile; la rotta sul fondo no. Il limite e' dichiarato invece che nascosto: **sotto 1,5 nodi il COG e' rumore**, quindi la freccia si spegne e resta il solo rilevamento vero in cifre. `coords.heading` e' null da fermo su iOS e capriccioso su Android: il COG si ricava dai fix successivi quando la barca si e' spostata almeno dieci metri (`DERIVA_MIN`), sotto quella soglia sarebbe rumore anche quello.

**Il punto viene segnato al tocco, non dopo il caricamento della pagina.** `segnaMob()` in `rf-topbar.js` scrive waypoint e stato con l'ultima posizione nota e solo dopo naviga: a sei nodi un secondo di caricamento vale tre metri. Senza nessun fix disponibile non si inventa niente, si apre il modulo e tocca a lui acquisire.

**Il punto finisce fra i waypoint subito**, non alla chiusura: sopravvive a riavvio del telefono, chiusura dell'app e navigazione fra moduli. Per questo "Ferma emergenza" non distrugge nulla, e la conferma lo dice — altrimenti si esita a premere e si tiene aperta una schermata che non serve piu'.

### Gerarchia visiva
Rifatta due volte in prototipo. La prima versione aveva cinque corpi di testo e tre assi di allineamento: l'occhio ricominciava da capo a ogni riga. Ora:
- **un asse solo** sopra la linea, per i due dati che si guardano ogni secondo (distanza e direzione);
- **tre corpi** e non cinque: uno enorme, uno medio, uno piccolo;
- separazione **per urgenza, non per tipo**: sotto la linea sta solo cio' che serve una volta sola, al VHF.

Distanza in metri interi sotto i 1000 m: "340 m" si usa, "0,18 NM" no.

**Freccia**: code a 30° dall'asse, punta e code sullo **stesso raggio** dal centro di rotazione (96 su un riquadro 240). Il cerchio spazzato e' costante, quindi il margine resta identico a ogni angolo e nulla tocca il bordo — nella prima versione le code, piu' lontane dal centro della punta, uscivano. Niente rosa dei venti: un solo triangolo si legge con la coda dell'occhio mentre si guarda l'acqua. Ambra entro 10° dalla rotta giusta: conferma senza dover leggere un numero.

### Palette invariante
Come le zone XTE, i colori **non seguono i tre temi dell'app**: in emergenza la leggibilita' non e' una preferenza. Chiara di default (in coperta col sole il bianco pieno vince nettamente), con **inversione manuale e mai automatica**, persistita su `raffyca-mob-scuro` e applicata nel boot per non far lampeggiare il bianco di notte. La disposizione non cambia di un pixel: cambiano solo fondo e inchiostro.

Nella variante chiara l'ambra `#FFB020` va sostituita: su bianco sta sotto 2:1 di contrasto. Diventa ocra `#8A5200`. Rosso MOB `#D01A00` chiaro / `#FF3B24` scuro, geometria identica.

### Contratto localStorage (aggiunte)
| chiave | contenuto |
|---|---|
| `raffyca-mob` | `{on,lat,lon,ts,fixTs,wpId}` — stato dell'emergenza |
| `raffyca-mob-scuro` | `"1"` / `"0"` — inversione dei colori |
| `raffyca-folders-open` | (27/08) stato aperto/chiuso delle cartelle Carta |

Lo stato vive in localStorage e non in memoria di pagina: ProVela e' multipagina e in PWA basta cambiare modulo per perdere le variabili. Stessa lezione di `rf-live.js` e del registratore GPX.

### Topbar
Sezione MOB **in cima** al pannello, perche' e' l'unica cosa li' dentro che non puo' aspettare. Con emergenza viva il tasto diventa "Emergenza in corso · tocca per tornare alla schermata" e la zona di stato in barra mostra `MOB · 4 min` in rosso, scavalcando REC, traccia e waypoint. Da qualunque modulo.

### Altri dettagli
- **Wake Lock** con riacquisizione su `visibilitychange`: su Android si perde ogni volta che si esce e si rientra.
- **Annulla** come barra piena a tutta larghezza per dieci secondi, non una X in un angolo: un falso allarme si tocca per sbaglio, e recuperarlo deve essere piu' facile che confermarlo.
- **Conferma di chiusura**: il tasto sicuro ("Continua l'emergenza") e' quello pieno a tutta larghezza; "Si, ferma" e' un contorno sotto.
- **Coordinate** in gradi decimali su una riga, virgola italiana, niente spazio prima dell'emisfero: `43,61580°N   13,51890°E`. Cinque decimali ≈ 1 m; oltre si detterebbero al VHF cifre che il GPS non conosce.
- **Copia** con ripiego su `execCommand` perche' Safari in PWA nega talvolta l'API clipboard.
- Nessun allarme sonoro e nessuna stima di raggio di ricerca: la deriva non la conosciamo, inventarla sarebbe lo stesso errore del verdetto sulla nuvolosita'.

### Service worker
`sw.js` radice → **provela-hub-v9** con `./mob/` in precache (il modulo deve esserci offline); `routing/sw.js` → **raffyca-rt-v12**. Obbligatorio: `rf-topbar.js` e' servito cache-first e resterebbe alla versione senza MOB.

### Validazione
75 test jsdom sul modulo (geometria, scarto su 1700 combinazioni, soglia COG, raggio della freccia, persistenza, palette, integrazione topbar, DOM) piu' i 49 del ciclo precedente, tutti verdi. `node --check` su ogni script inline del progetto e su tutti i JS standalone. Conformita' ES5 verificata: nessuna arrow function, template literal, `let` o `const`.

Due test erano difettosi e sono stati corretti, non il codice: la formula dello scarto restituisce `[−180, +180)` e non `(−180, +180]` (con il punto esattamente a poppa esce −180, innocuo); e il controllo sull'ordine in `segnaMob` prendeva la prima uscita anticipata invece del corpo della funzione.

**Nessuno di questi test dice come si comporta in mare.** Da provare sul tablet: acquisizione GPS a freddo, comportamento del COG sotto 1,5 kn, leggibilita' della schermata chiara al sole, tenuta del wake lock, e sopravvivenza dello stato uscendo e rientrando dall'app.

### Aperti
- Diagnosi Partenza/Percorso da rifare (quota esclusa).
- Diario e Cambusa: discussi, non decisi. Per il Diario la direzione e' local-first su IndexedDB con voci agganciate alla traccia attiva, non un silo separato. Per la Cambusa resta da chiarire se e' checklist di partenza (allora va dentro Manutenzione) o vettovagliamento con calcolo persone × giorni (allora ha senso da sola).
- Bug layer Fari con due fari quasi sovrapposti (invariato).
- Foto "solo 2" in Manutenzione: da riverificare dopo la consegna del 27/08.

---

## 28/08/2026 (sera) — MOB: freccia che spariva

**Etichetta: solo logica** (una regola CSS rimossa, nessuno spostamento di elementi). `mob/index.html`, `sw.js` → **provela-hub-v10**.

### Il difetto: due centri di rotazione sovrapposti
Segnalato: "la freccia sparisce, sembra ruotare attorno a un asse fuori schermo". Descrizione esatta.

Il JS scriveva l'attributo SVG `transform="rotate(angolo 120 120)"`, che **contiene gia' il proprio centro**. Il CSS aggiungeva `transform-origin:120px 120px` sullo stesso elemento. I browser mappano l'attributo `transform` sulla proprieta' CSS `transform`, quindi le due traslazioni si **sommano** invece di sostituirsi: il perno finiva a circa (240,240), fuori dal riquadro 240x240, e dopo pochi gradi la sagoma era gia' oltre il bordo.

Aggravante di compatibilita': `transform-origin` su SVG dipende da `transform-box`, il cui valore predefinito e' cambiato nel tempo e differisce fra Safari e Chromium. Anche scritto "giusto" sarebbe rimasto fragile proprio sui dispositivi non provabili qui.

**Correzione:** la rotazione vive solo nell'attributo SVG. Via `transform-origin`, via `transition`, via la dipendenza da `transform-box`.

### Conseguenza: lisciatura spostata in JS
Tolta la transizione CSS serviva un sostituto, perche' il COG grezzo balla di qualche grado a ogni fix e una freccia che sobbalza si legge peggio di una ferma. Nessuna interpolazione CSS comunque: a 1 Hz una transizione di 0,3 s mostrerebbe per un terzo del tempo una direzione che non e' quella corrente, e su uno strumento di emergenza il ritardo e' una piccola bugia.

Filtro a due stadi, e **l'ordine conta**:
1. **zona morta sul bersaglio** (1,5°): un movimento sotto soglia e' rumore e non viene accettato;
2. **inseguimento** del bersaglio accettato con coefficiente 0,35, senza soglia.

La prima stesura applicava la zona morta all'**errore residuo**: la freccia si bloccava appena entrata entro 1,5° e restava disallineata per sempre, mentre la cifra sotto mostrava il valore esatto. Difetto trovato dai test di convergenza, non a occhio. Con la zona morta sull'ingresso la convergenza e' completa (errore < 0,01° dopo 200 passi) e il rumore di ±1° continua a non muovere nulla.

Entrambi gli stadi lavorano sull'angolo **piu' corto**: da 179° a −179° sono due gradi, non 358.

La cifra sotto la freccia resta lo scarto **reale**, non quello lisciato: la freccia si guarda, il numero si legge.

### Validazione
18 test mirati nuovi (perno unico, coerenza fra centro dichiarato e sagoma, via corta su 6000 combinazioni, convergenza, zona morta, assenza di errore residuo) piu' i 75 del modulo e i 49 del ciclo precedente. Tutti verdi.

Due test della tornata precedente erano difettosi: cercavano `transform-origin` e `transform-box` in tutto il file e pescavano il **commento** che spiega perche' non ci sono. Ora guardano le sole dichiarazioni CSS, coi commenti rimossi.

**Da provare a bordo:** che la freccia ruoti davvero su se stessa a tutti gli angoli, e che la lisciatura non risulti troppo lenta con il COG reale. Se sembra pigra, il numero da toccare e' `MORBIDO` (0,35: piu' alto = piu' pronta e piu' nervosa).

---

## 01/09/2026 — Via CARTO: le tile stampavano "API KEY REQUIRED"

**Etichetta: fornitore esterno** (nessuna logica dell'app toccata). `carta/index.html`,
`meteo/index.html`, `routing/raffyca-traversata-map.html`, `routing/sw.js` →
**raffyca-meteo v16**, **raffyca-rt v13**.

### Il difetto non era nostro
Segnalato: scritta "API KEY REQUIRED · carto.com/basemaps/apikey" in diagonale sopra
tutte le tile, in Carta Nautica e in Traversata. CARTO ha reso obbligatoria una API key
per i basemap raster: le tile continuano a tornare 200, ma con il watermark cotto dentro
l'immagine. Colpiti tre punti: base Nautica e base Minimal in Carta, base della
Traversata, base del radar RainViewer nel Meteo.

### Cosa ho provato e scartato
Confronto su Sottomarina a zoom 13, con l'overlay OpenSeaMap sopra:

- **Esri Ocean** — a zoom 13 risponde "Map data not yet available". Copertura troppo
  grossolana per la navigazione costiera.
- **Esri Light Gray Canvas** — pulitissimo e con pochissime strade, ma dipinge **mare e
  terra dello stesso grigio**. Su una carta nautica non e' una questione estetica: non
  distingui la costa. Scartato.
- **Wikimedia** — non serve tile fuori dai siti Wikimedia.
- **CARTO con chiave gratuita** — avrebbe conservato l'aspetto identico, ma la chiave
  andrebbe messa in localStorage e reinserita su ogni dispositivo (come Upstash), e in
  un repo pubblico non puo' stare nel codice. Costo di gestione sproporzionato.
- **Positron come tile vettoriali** (OpenFreeMap) — lo stile esatto esiste ancora
  gratis, ma richiederebbe MapLibre al posto di Leaflet. Fuori proporzione.

### La sostituzione
**OSM Humanitarian** (`tile-{s}.openstreetmap.fr/hot`, sottodomini `abc`): gratuito,
senza chiave, toni pastello, acqua verde-azzurra nettamente distinta dalla terra. E' il
piu' vicino all'obiettivo con cui era stato scelto il Voyager il 17/07 — poche strade,
acqua chiara, i simboli nautici risaltano.

**La base "Minimal" e' caduta.** Era il Positron; senza chiave un equivalente non
esiste, e le alternative minimali provate sono quelle scartate sopra. Meglio due basi
leggibili che tre di cui una pericolosa. Le viste gia' salvate in `raffyca-carta-view`
con `base:'minimal'` ricadono su `'nautica'` senza errori: il ramo e' esplicito, non e'
un caso fortunato.

### Aggiunta: vista Satellite
Colta l'occasione, visto che il selettore delle basi era gia' aperto. **Esri World
Imagery**, gratuito e senza chiave, fino a zoom 19. Con i simboli OpenSeaMap sopra si
leggono bene secche e basse. Valore salvato: `base:'sat'`.

### Un match troppo largo, evitato per un soffio
In `routing/sw.js` l'host in cache era `basemaps.cartocdn.com`. La prima stesura lo
sostituiva con un match generico su `openstreetmap.org` — che avrebbe intercettato anche
`nominatim.openstreetmap.org`, che venti righe piu' sotto deve restare **solo rete, senza
cache**, mettendo in cache le ricerche di localita'. Il match ora e' sugli host specifici
(`tile.openstreetmap.org`, `openstreetmap.fr`, `openseamap.org`).

### Perche' i bump dei service worker
Non per il codice — per la **cache**: le tile con il watermark sono gia' finite nei
bucket TILES dei dispositivi, e senza bump continuerebbero a essere servite anche dopo
l'aggiornamento. L'`activate` cancella i bucket che non iniziano con la versione nuova.

### Validazione
Verificato in locale su tutte e tre le mappe: Carta (tre basi, satellite compreso),
Traversata, radar del Meteo. Nessun watermark, attribuzioni aggiornate; il radar carica
40 tile da `openstreetmap.fr`, zero da CARTO. Corretta anche la didascalia del radar, che
citava ancora CARTO a video.

**Da provare a bordo:** leggibilita' della base HOT al sole, e se la satellite regge in
zone con rete scarsa (le tile pesano piu' delle vettoriali di prima).

---

## 01/09/2026 (seguito) — Selettore basi in Traversata, toponimi, e la batimetria che non tornava

**Etichetta: mappa + un difetto vecchio venuto a galla.** `carta/index.html`,
`routing/raffyca-traversata-map.html`, `routing/sw.js` → **raffyca-rt v13→v15**.

### Selettore basi anche in Traversata
Aveva una base fissa. Ora ha le stesse tre di Carta Nautica con gli stessi nomi
(Nautica chiara / OpenStreetMap / Satellite): passando da un modulo all'altro si
ritrova la stessa scelta, non un'altra grammatica. La base attiva e' persistita in
`raffyca-traversata-ui` come campo **`base`** — campo nuovo, nessuna chiave
rinominata; le UI salvate senza quel campo partono da `nautica`.

### Toponimi sulla satellite, e perche' non da Overpass
`World_Imagery` non porta un solo nome. Ipotesi valutata: estrarli da Overpass
Turbo e disegnarli noi. **Scartata**, e non per pigrizia: significherebbe scegliere
quali nomi mostrare a quale zoom, disegnarli con l'anti-sovrapposizione, tenerli
aggiornati e portarsi il peso nel repo. Il vantaggio teorico sarebbe l'offline, ma
le immagini satellitari sono tile pure anche loro: senza rete non c'e' comunque la
mappa, quindi non si guadagna nulla.

Usato invece **World_Boundaries_and_Places**, il layer di sole scritte che Esri
pubblica apposta per stare sopra le sue immagini: trasparente, gratuito, senza
chiave. La satellite e' ora un `layerGroup` immagini+etichette in entrambi i moduli,
cosi' non si puo' finire per sbaglio con le immagini mute.

**Limite noto:** le etichette Esri sono in **inglese** (Rome, Florence). Localizzarle
richiede l'API ArcGIS con chiave, non l'endpoint libero. In Traversata pesa poco,
perche' i 17 nomi curati a mano del layer TOPONIMI restano sopra in italiano e non
vanno in conflitto; in Carta quel layer non c'e', quindi li' e' tutto inglese.

### Il difetto di impilamento (introdotto con il selettore)
`L.control.layers` assegna da se' uno z-index crescente alle basi man mano che le
registra. In Traversata la satellite, **terza voce dell'elenco**, finiva a z 3 dentro
il `tilePane` e copriva il seamark a z 1. Non dipendeva dalla satellite: bastava
cambiare l'ordine delle voci per spostare il difetto altrove.

Correzione strutturale, non aritmetica: le basi vivono ora in un pane proprio
(**`basePane`, z 150**) sotto il `tilePane` (200) del seamark e sotto tutti gli altri
— griglia 350, fari 360, isobate e tracce in overlayPane 400. I pane sono contesti di
impilamento separati, quindi nessun ordine di registrazione puo' piu' ribaltare le
cose. Applicato a Carta e Traversata.

### Il difetto vero: la batimetria non tornava mai accesa
Segnalato come "la base copre le isobate". Non le copriva: **non venivano disegnate**.

`ISO_ON`, `ISO_COL`, `ISO_SLUG` e `ISO_LABEL_DEPTHS` erano inizializzate in fondo al
file, **dopo il boot**. La sequenza era: il ripristino delle impostazioni scatena
`change` su `tBathy` → il gestore mette `ISO_ON=true` e accende la legenda → poi le
`var` in coda rimettono `ISO_ON=false`. In piu' `ISO_SLUG` era ancora `undefined`, e
`refreshIsobate` moriva con un TypeError silenzioso. Risultato: casella spuntata,
legenda visibile, nessuna isobata.

**Si vedeva solo dopo un ricaricamento.** Cliccando la casella a mano durante la
sessione funzionava, perche' a quel punto le righe incriminate erano gia' passate —
ed e' per questo che il difetto e' sopravvissuto tanto a lungo senza essere isolato.

Le quattro dichiarazioni sono ora in cima con le altre variabili di modulo; le
funzioni erano gia' hoistate, quindi non serviva altro. **Solo Traversata:** in Carta
la dichiarazione di `isoOn` (riga 617) precede gia' il ripristino (riga 824).

### Cache
`arcgisonline` aggiunto al ramo delle tile in `routing/sw.js`. Senza, le immagini
satellitari sarebbero cadute nel ramo generico in fondo, che scrive nella app-shell —
dove il tetto di 600 tile non c'e' e la cache sarebbe cresciuta senza limite sul
telefono.

### Validazione
Verificato in locale con zona "Alto Adriatico": isobate scaricate, disegnate e
leggibili sopra la satellite insieme a costa modello, frecce vento e marker A/B;
selettore funzionante e scelta ricordata dopo il ricaricamento; `basePane` a 150 sotto
il seamark a 200. Verificato anche sul sito pubblicato dopo il deploy.

**Non provato:** i fari con la nuova satellite. Vivono in pane dedicati a 360 e 450,
quindi sono strutturalmente sopra le basi e la correzione li copre, ma non sono stati
accesi a video.

**Da provare a bordo:** leggibilita' della base HOT al sole; se la satellite regge dove
la rete e' scarsa (le tile pesano piu' di prima). Nota: `openstreetmap.fr` e' un server
di volontari con una politica d'uso, non un CDN commerciale come era CARTO — se un
giorno le tile non caricassero, il sospettato e' quello.

---

## 01/09/2026 (terzo) — Isobate ritagliate da capo, lagune tolte, e la costa che il router usa davvero

**Etichetta: dati + carta.** `build_isobate.py` (nuovo), `routing/isobate/*` (9 file
rigenerati), `routing/raffyca-traversata-map.html`, `routing/sw.js` → **raffyca-rt v15→v16**.

### 1. Il ritaglio delle isobate era fermo ai riquadri di prima

Il 21/07 quattro `ZONE_BOX` erano stati allargati per chiudere le tacche di
copertura del vento — Alto Tirreno a nord, Medio Adriatico fino a 41.50, Basso
Tirreno fino ad Anzio, Sardegna fino al continente. Le isobate no: restavano
ritagliate sui riquadri vecchi. Vasto, il Gargano, Anzio e il canale di Sardegna
erano dentro la zona e senza fondali, e non si vedeva rileggendo il codice perche'
il codice era giusto: erano i **dati** a essere vecchi. La nota del 21/07 lo
diceva («Vento/isobate residue e batimetrie: ancora da vedere») ed e' rimasta li'.

Ora il ritaglio sta in `build_isobate.py`, con i riquadri scritti dentro **una
volta sola**: sono l'unione di quelli di `routing/` e di `carta/`, che
differiscono su Alto Tirreno (`lonW` 7.50 contro 9.00) — vale il piu' largo, cosi'
un pacchetto solo serve tutti e due i moduli. In piu' un **margine di 0.15°** (~17
km) oltre ogni bordo: le zone confinanti si accavallano e passando un confine,
dove il file cambia, i fondali non spariscono per un istante.

### 2. Le lagune

EMODnet e' un dato scientifico interpolato: dentro Marano, Grado e Venezia produce
contorni che non sono fondali navigabili. A video sembravano isobate vere in mezzo
alla terra, cosa che nella carta di un modulo di navigazione e' peggio che non
averne.

**Scartato — buttare i contorni interi che toccano una laguna:** un solo contorno
-5 corre da Venezia a Grado entrando e uscendo dalle lagune. Buttarlo avrebbe
cancellato anche il tratto sottocosta buono.

**Scartato — togliere tutto cio' che cade a terra usando la maschera del router:**
la maschera e' a ~1.5 km per cella, mangerebbe i tratti veri appena sottocosta.

**Fatto:** due poligoni disegnati a mano (`LAGUNE` in `build_isobate.py`) e
sottrazione **per tratto**, non per contorno: ogni segmento e' spezzato sulle
intersezioni col bordo e ogni pezzo tenuto o buttato in base al suo punto medio.
I poligoni hanno il lato di mare sulla linea dei lidi — Lido/Pellestrina/
Sottomarina a Venezia, Bibione/Lignano/Grado in Friuli — e il lato di terra
volutamente largo, molto oltre la costa, dove isobate non ce ne sono comunque:
**la precisione serve solo sul lato di mare**, ed e' li' che vanno riguardati se
un giorno si toccano.

### 3. Lo shapefile e' piu' rado dei file che sostituisce, ma non piu' impreciso

Sospetto legittimo: `isobate_ITALIA_v2` ha ~99 vertici per grado di linea, i file
zona vecchi ne avevano ~148 nello stesso riquadro. Misurato invece di dedurlo:
scarto geometrico massimo fra vecchio e nuovo, su 12 contorni lunghi presi a caso,
**7 metri**. Era ridondanza piu' arrotondamento a 4 decimali (11 m), non forma
persa. Il file `.geojson` gemello nell'archivio e' identico allo shapefile
(verificato contorno per contorno), quindi la sorgente e' una sola.

**Non fatto — rigenerare i contorni dai 7 grid EMODnet grezzi**, che sono di nuovo
nel Dropbox dell'utente (7 `.asc`, ~300 MB l'uno, in `Batimetria/Dati grezzi/`).
Darebbe la risoluzione piena, ma e' un'altra pipeline (smussatura NaN-aware +
contouring + filtri) e, visti i 7 m di scarto, non e' li' che sta il guadagno. Se
un giorno serve, quella e' la strada.

### 4. Verifica delle isobate

- **Vertici ben dentro terra** (celle di terra con tutte e quattro le vicine di
  terra, contro la maschera OSM della zona): Alto Adriatico **246 → 3**, Medio
  Adriatico 5 → 5, Alto Tirreno 13 → 9. Su 103.000 vertici totali ne restano 19.
- Copertura: tutte e 9 le zone arrivano ora al bordo del riquadro + margine.
- Totale 2,3 MB, come prima.
- A video in Traversata e in Carta, sopra OSM: niente dentro le lagune, i contorni
  al largo di Grado e dei lidi intatti.

**Non verificato:** le altre lagune (Orbetello, Comacchio, Stagnone) — non
chieste, e non guardate. **Resta aperto** il difetto dei contorni che non
chiudono: non e' stato toccato.

### 5. Traversata: l'azzurro spariva sulle basi chiare

Con il selettore di basi introdotto stamattina le basi vanno dal quasi-bianco
(Nautica chiara) al quasi-nero (Satellite). Isocrone `#bfe6ff`, linea diretta
`#cfe0f0` e vento debole `#2BD9C4` sulla prima non si leggevano.

**Scartato — cambiare i colori:** qui sono semantici (la scala del vento si legge
a colpo d'occhio) e SITUAZIONE dice da luglio di non toccarli.

**Fatto:** sotto ogni tratto un filo scuro (`CASE`, `halo()`) — stessa geometria,
piu' spesso, quasi opaco. E' la stessa soluzione dei fari in Carta («casing scuro
sotto per leggibilita' su Voyager chiara», 06/08). Le punte delle frecce vento
hanno un bordo scuro dentro il `<marker>`, con `overflow="visible"` perche'
altrimenti il riquadro del marker lo taglia.

**Difetto introdotto e corretto durante il lavoro:** avevo ingrandito il marker a
9×9 per far stare il bordo. Le misure del marker sono in **unita' di
stroke-width**, non in pixel: le frecce erano diventate triangoli enormi.
Ripristinate le misure originali, bordo sottile piu' `overflow`.

Le isocrone si disegnano in **due passate** — prima tutti i fili scuri, poi tutti
gli azzurri. Per elemento, il filo scuro di un'isocrona mangiava quella accanto
dove si addossano.

### 6. Traversata: isocrone solo lungo la rotta

Il fronte si apre a ventaglio e dopo qualche ora copre mezza zona, schiacciandosi
sulla costa. Quei lobi non dicono nulla sulla traversata: la rendono solo
illeggibile.

Nuova casella **«solo lungo la rotta»** (`tIsoCorr`, accesa di default, persistita
in `raffyca-traversata-ui`; le UI salvate senza il campo partono dal default
dell'HTML, cioe' accesa). Filtra i nodi su assi A→B: fascia di traverso pari al
30% della distanza A-B (fra 3 e 30 M) e avanzamento fra -10% e +110%. Spegnendola
si torna al ventaglio intero.

**Scartato — filtrare per raggio o per numero di nodi:** il ventaglio e' un
problema di direzione, non di quantita'; tagliare per raggio accorcia le isocrone
utili e lascia i lobi.

### 7. La costa disegnata non era la costa del router

L'errore segnalato a Bibione: la linea passava mezzo chilometro dentro il paese.
Non e' una fonte da cercare — la fonte buona era gia' nel repo.

`buildCoastSegs()` disegnava **sempre** `mediterranean_land_10m.geojson`, cioe' la
costa **GSHHG**, quella con lo shift di ~250 m e la deformazione per cui il 21/07
le maschere erano gia' passate a OpenStreetMap. Dal 21/07 il router usa gli anelli
OSM di `coastmasks/<slug>.json`; la casella diceva «costa modello — il confine
della maschera terra/mare che il router usa davvero» e mostrava un'altra linea.
Confrontate le due sopra OSM a Bibione: GSHHG taglia dentro l'abitato e fa
poligoni ad angoli attorno a Valle Vecchia, gli anelli OSM seguono la battigia e
risalgono la bocca di Porto Baseleghe.

`buildCoastSegs()` ora preferisce `MED_MASKS[FIELD.area].rings` quando ci sono
(11.893 segmenti in Alto Adriatico) e tiene GSHHG come **ripiego**: area di
default, zona senza maschera, maschera non ancora scaricata. `mediterranean_land_10m.geojson`
resta comunque necessario — `makeZoneArea`, `rasterMask` e l'area su misura da
Nominatim ci girano sopra.

**Sulla domanda «dove trovo una fonte affidabile»:** Overpass da' i tratti grezzi
di `natural=coastline`, non una costa: vanno cuciti, chiusi e controllati, ed e'
li' che il risultato delude. Il prodotto gia' cucito e validato esiste ed e' lo
stesso dato — le **land polygons** di `osmdata.openstreetmap.de` (uscita di
OSMCoastline, rigenerate ogni giorno). Se un giorno le maschere vanno rifatte,
quella e' la sorgente, non una nuova query Overpass.

### Cache
`routing/sw.js` v15→v16: le isobate stanno nel bucket app-shell, che ha il
prefisso di versione, quindi il bump le spurga. **Carta non ha bisogno di bump:**
e' servita dal SW dell'hub, che sui non-navigazione fa `caches.match(req) || fetch(req)`
e non scrive mai — le isobate non ci finiscono. (Che e' anche il motivo per cui in
Carta la batimetria **non** e' disponibile offline, cosa che resta aperta.)

**Da provare a bordo:** se il corridoio al 30% e' troppo stretto su traversate
lunghe; se il filo scuro sotto le frecce vento appesantisce troppo la carta al
sole.

---

## 01/09/2026 (quarto) — La costa rifatta dalle land polygons OSM: in Basso Adriatico mancava metà della terra

**Etichetta: dati + modello.** `build_coastmasks.py` (nuovo), `routing/coastmasks/*`
(9 file rigenerati), `routing/raffyca-traversata-map.html`, `routing/sw.js` →
**raffyca-rt v16→v17**.

### Il difetto, misurato

Segnalata «la linea di costa». Cercando la causa e' venuto fuori che non era un
problema di disegno. Confrontando la maschera OSM del router con la costa GSHHG —
imprecisa ma **completa** — cella per cella, contando solo le celle di terra con
tutte e quattro le vicine di terra (per non contare il frastaglio del bordo):

| zona | terra riconosciuta | terra mancante |
|---|---|---|
| basso-adriatico | 5.377 | **6.691** |
| alto-adriatico | 8.364 | 397 |
| sicilia | 6.659 | 9 |
| le altre sei | — | 0 |

**In Basso Adriatico mancava piu' terra di quanta ne fosse riconosciuta**: tutta la
sponda orientale da lon 16.5 a 20.3 — Dalmazia sud, Curzola, Sabbioncello,
Montenegro, Albania. Per il router non era costa, era mare aperto: una rotta verso
la Croazia del sud passava dentro le isole. La nota del 21/07 lo diceva a mezza
bocca («residui non italiani: Dalmazia sud/Montenegro, isole 17E, Corfu,
Pantelleria») ma non diceva quanto, e messo cosi' sembrava un dettaglio.

### Perche' non un'altra query Overpass

Overpass restituisce i tratti grezzi di `natural=coastline`: pezzi di linea, non
una costa. Vanno cuciti per `@id`, chiusi e controllati — ed e' esattamente li'
che il giro del 21/07 ha lasciato i buchi (9.554 tratti, con «buchi Rimini-Pesaro
e Vasto/Molise tappati» a mano: i tappi a mano sono il sintomo).

**Scartato — rattoppare solo i buchi con una query mirata:** il master OSM del
21/07 non e' nel repo, ci sono solo le 9 maschere derivate. Qualunque correzione
richiedeva comunque di rigenerare da una sorgente, quindi tanto valeva prenderne
una intera e buona.

**Scartato — tappare con GSHHG**, che e' gia' nel repo ed e' completa: ha lo shift
di ~250 m per cui era stata abbandonata, e ci sarebbe stata una cucitura visibile
dove le coste straniere incontrano quelle italiane.

**Fatto:** le **land polygons** di `osmdata.openstreetmap.de` — lo stesso dato OSM
gia' cucito, chiuso e validato da OSMCoastline, rigenerato ogni giorno.
`land-polygons-complete-4326`, 877 MB, 831.139 poligoni, WGS84. **Questa e' la
risposta alla domanda «dove trovo una fonte affidabile»: non una query fatta
meglio, ma il prodotto gia' assemblato.**

### `build_coastmasks.py`

Legge il .shp in streaming: il riquadro sta nell'intestazione di ogni record,
quindi i poligoni che non servono si saltano senza leggerne i punti — 831 mila
record diventano 6.240 poligoni in 37 secondi, senza librerie geospaziali (non ci
sono: niente GDAL, niente shapely; c'e' numpy).

Il riempimento e' lo stesso even-odd per scanline di `rasterMask()` nel modulo,
cosi' la maschera nuova si comporta come quella che sostituisce. Due scarti che
sembrano azzardati e non lo sono, e vale la pena scriverli perche' rileggendo il
codice non si vedono:

- un anello **chiuso** tutto a ovest (o tutto a est) del riquadro taglia una data
  latitudine un numero **pari** di volte, quindi non cambia la parita' dentro il
  riquadro: si puo' buttare. Senza questo bisognerebbe tenere le coste
  dell'Atlantico per contare giusto;
- un singolo segmento tutto a est di `lonE` produce un attraversamento che nessuna
  colonna del riquadro conta mai (si contano solo quelli a sinistra).

### Gli anelli non sono piu' chiusi, ed e' voluto

I `rings` di prima erano poligoni chiusi dal ritaglio, che pero' **correva lungo i
bordi del riquadro**: 9 segmenti per 3,91 gradi complessivi in Alto Adriatico,
righe dritte che da stamattina — da quando la carta disegna gli anelli invece
della costa GSHHG — finivano disegnate come se fossero costa. Sono quelle le
righe sottili che tagliano la mappa negli screenshot di prova. Ora il ritaglio e'
per polilinea e produce **catene aperte**: ne restano 2 in tutte e nove le zone.

### Il buco nella correzione di stamattina, trovato provando

Con la zona attiva la costa ora e' giusta. Premendo **«Area su A↔B»** no: quel
pulsante — come la ricerca Nominatim, e come il ripiego quando la maschera di zona
non si scarica — ricostruiva la maschera con `buildCoastMask()`, che rasterizza
**GSHHG**. Quindi la stessa barca vedeva due coste diverse a seconda del pulsante
premuto, e la correzione di stamattina non arrivava proprio nel percorso che si usa
per preparare una traversata.

Tutti e tre passano da `buildCoastMask()`, quindi si e' corretto li' una volta
sola: se la zona di profilo ha la sua maschera OSM (`ZONE_MASK`, tenuta da parte
perche' `MED_MASKS['custom']` viene sovrascritto) e il riquadro chiesto ci sta
dentro, quella viene **ricampionata** invece di rasterizzare GSHHG, e si porta
dietro i suoi anelli per il disegno. La cella resta quella grossa della zona: non
si guadagna risoluzione, si guadagna che e' la stessa costa. Fuori dalla zona, o
senza maschera, GSHHG resta il ripiego.

### Verifica

- **Terra GSHHG mancante**, stesso conteggio di prima: basso-adriatico **6.691 →
  2**, alto-adriatico **397 → 2**, sicilia **9 → 0**. Le altre erano e restano 0.
- **46 punti noti** (citta', isole, mare aperto) su vecchia e nuova maschera:
  **nessun peggioramento**, cinque miglioramenti (Dubrovnik, Curzola, Montenegro,
  Albania, Pantelleria). I punti che restano sbagliati — Ancona, Bari, Taranto,
  Siracusa, Capri, Ponza, Capraia, La Maddalena — lo erano **identici** anche
  prima: e' la griglia a 200 colonne (1,5–2,9 km per cella), non il dato.
- **Lagune** (Venezia, Marano, Grado, Comacchio, Orbetello, Stagnone): 10 punti,
  comportamento **identico** a prima. Nessun cambio di nascosto.
- **Isole piccole presenti fra gli anelli** disegnati: Capri, Ponza, Ustica,
  Capraia, La Maddalena, Tremiti, Levanzo, Palagruza, Pantelleria.
- **Rotta vera**: Gargano (41.90, 16.60) → Montenegro (42.60, 18.00), 43 punti,
  ETA 16,7 h, **0 punti di rotta a terra**. Prima quella traversata attraversava
  isole che il modello non conosceva.
- **Area su A↔B** nello stesso riquadro: 90 celle su 9.800 (0,9%) in disaccordo
  fra maschera ricampionata e GSHHG, tutte sottocosta — fra cui Mljet, che GSHHG
  decimata si era persa.
- File: **1,93 MB** in tutto, meno dei 2,03 MB di prima, con molta piu' costa.
- Integrita': 9/9 file, chiavi attese, lunghezza dei bit = w×h/8, nessuna catena
  degenere.

### Cache
`routing/sw.js` v16→v17: le coastmasks stanno nel bucket app-shell, che ha il
prefisso di versione. **Nota:** la v16 dello stesso giorno non era ancora stata
pubblicata quando e' arrivata questa modifica; il bump a v17 vale per entrambe.

### Aperti
- **La griglia resta a 200 colonne** (1,5–2,9 km per cella). E' il motivo per cui
  Capri, Ponza, Capraia e i centri storici sul mare cadono ancora fra due celle.
  Alzarla costa pochissimo in byte (i bit sono ~4 KB su file da 200–400 KB, il
  peso sono gli anelli) ma cambia il comportamento del router — passaggi stretti
  fra isole che oggi risultano navigabili diventerebbero chiusi. Non toccata qui
  per non muovere due cose insieme.
- L'area su misura **fuori** dalla zona di profilo usa ancora GSHHG. Serve la
  maschera di un'altra zona, quindi va caricata a richiesta: non fatto.
- Le land polygons scaricate (877 MB zip + 1,3 GB scompattato) stanno nella
  cartella temporanea di sessione, **non** nel repo. Per rieseguire lo script
  vanno riscaricate.

---

## 01/09/2026 (quinto) — Griglia della maschera a cella fissa: l'area sbagliata si dimezza

**Etichetta: modello.** `build_coastmasks.py`, `routing/coastmasks/*` (9 file
rigenerati), `routing/raffyca-traversata-map.html`, `routing/sw.js` →
**raffyca-rt v17→v18**.

### Il tetto lo detta il router, non la carta

La maschera aveva **200 colonne fisse**, quindi la cella cambiava da zona a zona
(0.014° in Mar Ligure, 0.026° in Basso Adriatico: da 1,1 a 2,9 km). Alzare per
alzare non ha senso: `hitsLand()` campiona la terra ogni **0,4 M = 741 m** lungo
il segmento, quindi una maschera piu' fine di cosi' descrive isolotti che il passo
di campionamento salta comunque, e non sarebbero nemmeno colpiti in modo
prevedibile — un'isola larga meno del passo viene presa o mancata a seconda di
dove cadono i campioni.

Il criterio e' quindi passato da "200 colonne" a **cella di lato fisso, 0.010°**:
815×1113 m a 45N, 889×1113 m a 37N. Sempre sopra i 741 m, quindi **qualunque
singola cella di terra attraversata viene per forza colpita da un campione**, e
sotto quel valore non si scende perche' non servirebbe.

### Misurato, non stimato

Il conteggio sui punti noti non basta a decidere: sono 46 punti scelti a mano,
quasi tutti sottocosta. La misura giusta e' **quanta area viene classificata
male**. Rasterizzata la sorgente a 0.002° (cinque volte piu' fine) e presa come
verita', confrontando cella per cella:

| zona | 200 colonne | cella 0.010 |
|---|---|---|
| alto-adriatico | 1,42% | **0,85%** |
| basso-adriatico | 0,93% | **0,41%** |
| sicilia | 0,68% | **0,33%** |
| mar-ligure | 0,31% | **0,23%** |

**L'area sbagliata si dimezza.** Costo: +155 KB su tutte e nove le zone (1,93 →
2,08 MB) — i bit sono 12–25 KB per zona, il peso dei file restano gli anelli.
`coastDistField` passa da 2–5 ms a 7–18 ms, ma e' memoizzato sulla maschera: si
paga **una volta per area**, non a ogni ricalcolo. Il tempo di calcolo della rotta
non cambia (830–950 ms in Basso e Medio Adriatico, come prima): lo domina la
ricerca a fascio, non la maschera.

### I passaggi stretti non si chiudono

Il rischio vero di una maschera piu' fine e' che un canale navigabile diventi
terra. Misurato il varco d'acqua che ogni maschera lascia lungo un transetto, su
12 passaggi: **nessuno si chiude**, e diversi diventano piu' veritieri — Vela
Vrata da 2.550 a 3.750 m (vero ~5.000), Passo della Moneta da 2.000 a 1.100 m
(vero ~400). Messina, Bonifacio, Piombino, Bocca Piccola, Procida, Zara,
Morlacca, Mali Ston, San Pietro: tutti aperti prima e dopo.

### Attenzione a come si misura: i punti sul bordo cella

Il primo confronto sui 46 punti dava tre **peggioramenti** — Dubrovnik, Genova,
Sanremo. Erano un artefatto del test, non della maschera: sono coordinate a due
decimali su una griglia di 0.010° allineata a `lonW`/`latN`, anch'essi a due
decimali, quindi **cadono esatte sul bordo di una cella** e l'arrotondamento in
virgola mobile decide da che parte. Verificati i centri di cella contro il
poligono sorgente: coerenti tutti e tre. Scostando i punti dal bordo il conto
diventa 35/46 → **39/46, quattro miglioramenti e nessun peggioramento**
(Taranto, Siracusa, Capri, Palermo).

Vale come regola: **un punto di prova a coordinate tonde su una griglia a
coordinate tonde non prova niente.**

### Il difetto che la griglia fine ha fatto emergere

Con la cella fine l'Alto Adriatico si apriva con **una rotta di un punto solo**.
Non era la griglia: il centro geometrico di quella zona cade **nel Quarnaro, in
mezzo alle isole**, e `findSea()` — che cerca il mare *piu' vicino*, giusto per
scostare un punto finito a terra — piazzava A e B a **0,42 M dalla costa**, in
due pozze chiuse. Il difetto c'era gia' (con la maschera di stamattina erano 13
punti e la rotta non chiudeva lo stesso), la cella fine risolve le pozze e lo
porta all'estremo.

Nuova `findOpenSea()`, usata **solo** per gli A/B di esempio (i tre punti che li
scelgono: zona da profilo, area su misura da Nominatim, ripiego). `findSea()`
resta dov'era per il resto.

**Scartato — prendere il mare piu' aperto della zona:** provato, e A e B finivano
nella **stessa identica cella**, la piu' al largo. In Medio Adriatico la rotta di
esempio veniva lunga 0,4 ore. Massimizzare l'apertura e' la cosa sbagliata.

**Fatto:** soglia, non massimo. Si guarda l'apertura massima nella finestra, si
fissa la soglia a `min(3 M, meta' del massimo)`, e fra le celle che la superano si
prende quella **piu' vicina a dove il punto era stato chiesto**. Le pozze hanno
per definizione distanze piccole e perdono; il punto resta dove ha senso.

Risultato: **8 zone su 9** aprono con una rotta di esempio sensata (A-B fra 16 e
73 M, tutte chiuse, 0 punti a terra).

### Aperto: la Sicilia
La nona non chiude, e non e' colpa della griglia. Il centro geometrico della zona
Sicilia cade **dentro l'isola**: A finisce sulla costa sud (Agrigento) e B su
quella nord (Cefalu'). Sono 73 M in linea d'aria ma la rotta deve girare intorno
alla Sicilia, oltre l'orizzonte di calcolo. Il vecchio `findSea` dava la stessa
coppia sui medesimi due versanti (70,4 M): il difetto e' preesistente e
indipendente da tutto questo. Servirebbe scegliere B **nello stesso specchio
d'acqua** di A — un riempimento per connessita' sulla maschera, che e' poco
codice ma e' un'altra cosa e non e' stato fatto qui.

---

## 01/09/2026 (sesto) — Sicilia: A e B di esempio sulle due coste opposte

**Etichetta: carta.** Solo `routing/raffyca-traversata-map.html`. **Nessun bump:**
il SW serve l'HTML network-first, e i dati non sono stati toccati.

### Il difetto
Il centro geometrico della zona Sicilia cade **dentro l'isola**. `findOpenSea()`
scostava A sulla costa sud (al largo di Agrigento) e B — che parte dal centro piu'
uno scarto del 22% — su quella nord (al largo di Cefalu'). Sono 73 M in linea
d'aria, ma per mare bisogna girare intorno alla Sicilia: la rotta di esempio
correva 71 passi e 28 ore senza arrivare, e il modulo si apriva con «NON CHIUSA».
Difetto vecchio, indipendente dalla griglia: il `findSea()` originale dava la
stessa coppia sui medesimi due versanti (70,4 M).

### Scartato — il riempimento per connessita'
Era l'idea ovvia, ed e' sbagliata: **il mare a nord e a sud della Sicilia e' lo
stesso specchio d'acqua**. Ci si passa dallo Stretto di Messina, che sta dentro il
riquadro della zona, e comunque si gira intorno all'isola. Un riempimento a
quattro vicini li trova connessi e non separa niente. Vale la pena scriverlo
perche' e' la prima cosa che verrebbe da riprovare.

### Fatto — linea di vista
Il criterio giusto non e' «raggiungibile» ma «**una traversata, non un periplo**»:
B dev'essere un punto che A vede in linea retta. `findOpenSea()` prende un quarto
parametro facoltativo `from`; quando c'e', fra le celle che passano la soglia di
apertura si prende la piu' vicina a dove il punto era stato chiesto **che abbia
linea di vista libera da `from`**. Per A (nessun `from`) niente cambia.

Il test e' su `maskLand()` e non su `hitsLand()`, perche' quello guarda
`MED_MASKS[FIELD.area]` e qui la maschera e' ancora in costruzione: l'area attiva
non e' quella.

**Difetto introdotto e corretto durante il lavoro.** Prima versione con un tetto
di 4.000 candidati per non pagare troppo: non cambiava niente. La lista e' ordinata
per distanza dal punto chiesto, e 4.000 celle attorno a un punto a nord della
Sicilia sono ancora tutte a nord della Sicilia — il vincolo si esauriva prima di
arrivare al mare giusto. Tolto il tetto e aggiunta invece una **scrematura a sei
campioni** in testa a `seaLineFree()`: quasi tutti i candidati sono dietro un'isola
e cadono li', senza pagare il campionamento a mezza cella. Il caricamento della
zona Sicilia resta a 168 ms.

### Verifica
Tutte e 9 le zone, con le impostazioni salvate azzerate:

| | A-B | vista libera | rotta | ETA | punti a terra | setup |
|---|---|---|---|---|---|---|
| Alto Adriatico | 16 M | si | chiusa 14 pt | 5,0 h | 0 | 345 ms |
| Medio Adriatico | 58 M | si | chiusa 32 pt | 12,3 h | 0 | 666 ms |
| Basso Adriatico | 59 M | si | chiusa 32 pt | 12,3 h | 0 | 566 ms |
| Mar Ionio | 73 M | si | chiusa 40 pt | 15,5 h | 0 | 257 ms |
| Basso Tirreno | 51 M | si | chiusa 29 pt | 11,3 h | 0 | 294 ms |
| Alto Tirreno | 53 M | si | chiusa 30 pt | 11,6 h | 0 | 432 ms |
| Mar Ligure | 33 M | si | chiusa 23 pt | 8,9 h | 0 | 102 ms |
| Sardegna | 56 M | si | chiusa 31 pt | 12,0 h | 0 | 312 ms |
| **Sicilia** | **37 M** | **si** | **chiusa 18 pt** | **6,9 h** | **0** | **168 ms** |

In Sicilia A e B stanno ora tutti e due sulla costa sud: Licata → Gela/Pozzallo,
guardato anche a video.

**Nota su cosa succede a B:** con il vincolo, B non finisce piu' dove lo scarto del
22% lo chiedeva, ma nel punto in vista piu' vicino a quello. E' voluto — meglio una
traversata corta e sensata che una lunga e impossibile — ma vuol dire che in una
zona con molte isole l'esempio puo' venire piu' corto di prima.

---

## 02/09/2026 — Tre angoli del sole nello stesso riquadro, e il buffer costa sotto il miglio

**Etichetta: carta + comandi.** `routing/raffyca-traversata-map.html`,
`sole-luna/index.html`, `routing/sw.js` → **raffyca-rt v18→v19**, `sw.js` →
**provela-hub-v10→v11** (`./sole-luna/` sta nel precache dell'hub).

### La luce all'arrivo diceva tre numeri e uno solo era una misura

Segnalato leggendo il riquadro di fretta: «il sole sarà a −12, −18 o −20?».
Comparivano insieme

- `sole −20°` — l'altezza vera del sole all'arrivo, **l'unico fatto**;
- «Il sole è sotto i −18°: notte piena…» — la soglia che **definisce** la fascia;
- «Arrivi al buio: sole sotto i −12°…» — il criterio che fa scattare l'avviso.

Le ultime due sono proprieta' della **scala**, non di quell'arrivo, e la fascia
la dice gia' l'etichetta in grassetto ("Notte piena"): ripeterne il confine non
aggiunge nulla e trasforma una misura in un indovinello.

Correzione: i numeri delle soglie escono dal testo, l'altezza del sole va in
**grassetto** perche' si veda che e' lei la misura.

| | prima | dopo |
|---|---|---|
| fascia | `Il sole è sotto i −18°: notte piena, nessun altro passaggio di luce da attendere.` | `Nessun passaggio di luce da attendere: la notte è al suo punto più scuro.` |
| avviso | `⚠ Arrivi al buio: sole sotto i −12° e contributo lunare trascurabile.` | `⚠ Arrivi al buio: l'orizzonte non si distingue più e la luna non aiuta.` |

L'avviso nuovo dice **cosa vuol dire** −12°: e' la fine del crepuscolo nautico,
cioe' il punto in cui l'orizzonte non si stacca piu' dal cielo. Piu' utile a
bordo del numero, e non si somma alle altre cifre.

Applicato a tutti e due i moduli che usano `rf-astro.js`, con le stesse parole:
`renderLuceArrivo()` in Traversata, `arrSub` / `arrSoglia` / `arrAlert` in Sole e
Luna. **Nessun cambiamento di logica:** `lightLevel`, `nextThreshold` e
`arrivoAlBuio` sono intatti, sono cambiate solo le stringhe e un `<b>`.

### Buffer costa: fermate scelte invece di un passo fisso

Chiesto di poter scendere sotto il miglio. Lo slider andava da 1 a 6 con passo
0,5; abbassare il minimo a 0,2 tenendo il passo avrebbe prodotto fermate su 0,7 /
1,2 / 1,7. Ora lo slider e' un **indice** in `COAST_STEPS = [0.5, 1, 1.5, 2, 3, 4,
5, 6]`: sotto il miglio si scende, e sopra i 3 NM non ci sono passi inutili.

**0,2 NM chiesto e non messo, con la misura in mano.** `coastDist` non e' una
distanza continua: e' un campo calcolato sulla griglia della maschera, quindi
quantizzato sulla cella. Il valore non nullo piu' piccolo che esiste e' **0,42 M
in Alto Adriatico, 0,45 in Basso Adriatico, 0,48 in Sicilia** — la cella e' 0,010
gradi, che in longitudine valgono meno mano a mano che si scende di latitudine.
Un buffer di 0,2 M non escluderebbe **nemmeno una cella**: sarebbe un comando
indistinguibile dal buffer spento. Verificato invece che 0,5 M morde davvero, su
una rotta sottocosta in Istria:

| buffer | rotta | punto piu' vicino a terra |
|---|---|---|
| spento | chiusa, 8,2 h | 0,42 M |
| **0,5 NM** | chiusa, 8,2 h | **0,73 M** |
| 1 NM | chiusa, 8,3 h | 1,16 M |
| 2 NM | chiusa, 8,4 h | 2,00 M |

Monotono e a costo zero in tempo. 0,5 NM vuol dire, in pratica, «stai almeno una
cella al largo».

**Migrazione della chiave.** `raffyca-traversata-ui` salvava `coastBufRaw`, cioe'
il valore grezzo dello slider quando erano miglia. Adesso il grezzo e' un indice,
quindi un "2" salvato prima significherebbe 1,5 NM. `coastBufRaw` **non si salva
e non si legge piu'**: la fermata si ricostruisce da `coastBuf`, che e' in miglia
ed e' l'unico valore stabile. L'arrotondamento e' **per eccesso**, non alla
fermata piu' vicina: e' un margine di sicurezza e un 2,5 salvato non deve tornare
come 2. Verificato con impostazioni in formato vecchio (`coastBuf: 2.5`,
`coastBufRaw: "2.5"`): tornano slider su 3 NM, etichetta "3", `STATE.coastBuf` 3 e
readout «costa ≥3 NM», tutti d'accordo.

### Verificato
Le nove fermate percorse una per una con etichetta e `STATE` allineati; blocco
luce riletto a video in tutte e due i moduli, con arrivo in notte piena e con
avviso forzato; migrazione dal formato vecchio; nessun residuo di `coastBufRaw`
nel file.

### Aperto
- `route()` esenta dal buffer un corridoio attorno ad A e B pari a
  `max(coastBuf, 0.8)`. Con il buffer a 0,5 NM il pavimento di 0,8 diventa piu'
  largo del buffer stesso — prima non poteva succedere, perche' il minimo era 1
  NM. Effetto pratico trascurabile (con mezzo miglio la rotta sta gia' sottocosta)
  e non toccato per non cambiare il comportamento anche da 1 a 6 NM, ma e' un
  regime nuovo e va saputo.
- La registrazione del service worker fallisce nel browser di prova incorporato
  ("An unknown error occurred when fetching the script"): e' l'ambiente, non i
  moduli — `RF_WORKER` parte e le rotte si calcolano. Non verificabile da qui se
  sul telefono va.

---

## 03/09/2026 — Prontuario di bordo: nuovo modulo

Mancava il posto dove stanno le cose che a bordo si cercano su un libretto
bagnato. Nuovo modulo `prontuario/`, sei voci: simulatore fari, bandiere,
alfabeto fonetico, messaggio VHF, legenda della carta, bollettini.

### Perche' il simulatore fari e' il pezzo centrale
Non e' un modulo da alimentare a mano: `carta/fari.geojson` contiene gia' la
caratteristica in forma canonica per **2.769 luci su 3.110**. Il simulatore la
legge com'e', quindi il dato nuovo da scaricare e' **zero**. Deep link
`?v=fari&ch=...&n=...` gia' pronto perche' la Carta possa aggiungere "Come si
vede" al popup di un faro — l'aggancio non e' ancora fatto, ma l'interfaccia
c'e' e non tocca `carta/`.

### Difetti trovati misurando, non rileggendo
Il parser e' stato passato su **tutte e 764 le caratteristiche distinte** del
file fari, non su un campione scelto da me. Sono usciti due difetti che
rileggendo il codice non si vedevano:

1. **La cardinale sud spariva.** `Q(6)+LFl` veniva letta come `Q(6)` e il lampo
   lungo cadeva: la boa piu' importante da riconoscere mostrava il ritmo
   sbagliato. In piu' il dato OSM la scrive `Q+LFl(6)`, cioe' col numero
   dall'altra parte rispetto alla notazione di carta. Ora il parser regge
   entrambe e danno lo stesso disegno (14 fasi, periodo 15 s).
2. **Una caratteristica incompleta lasciava a schermo la luce precedente.**
   `renderTimeline` leggeva `L.parsed.color` senza guardia: con `parsed` nullo
   lanciava, il testo non veniva aggiornato e restava la luce di prima —
   silenziosamente sbagliata, con l'aria di funzionare. Ora la guardia c'e', il
   testo si scrive PRIMA del disegno, e la lampada resta spenta.

Diciannove caratteristiche su 764 restano non animabili: sono **incomplete nel
dato di partenza** (solo colore, o `Al` alternata). Il modulo lo dice invece di
inventare. Aggiunti `IQ` (scintillante interrotto, presente nel dato) e il
riconoscimento delle quattro cardinali: N/E/S/W ricavate dal ritmo e annunciate
con il lato dove sta il pericolo — nel file reale ne riconosce 30.

### Alternative scartate
- **Durate del lampo dedotte dal dato**: impossibile, la caratteristica dice il
  ritmo e tace sulla durata. Si usano le convenzioni IALA (lampo 0,5 s, lungo
  2 s, occultazione 1 s, scintillio 0,3 s) e **lo si scrive in pagina**, invece
  di lasciar credere che sia misura.
- **Tabella degli orari Meteomar per stazione costiera**: scartata. Le fonti
  pubbliche non concordano (01:35/07:35/13:45/19:35 UTC in una, 06:35/12:35/18:35
  locali in un'altra, "variabili secondo la stazione") e un orario sbagliato e'
  peggio di nessun orario: resti in ascolto per un bollettino che non arriva.
  Resta il dato stabile — **ore sinottiche di emissione 00/06/12/18 UTC** — con
  la conversione in locale calcolata dal telefono, cosi' l'ora legale la gestisce
  il sistema e non una tabella nostra che invecchia. Piu' il canale 68 continuo.

### VHF
Tre livelli con tendine contestuali: Routine, PAN-PAN (7 casi di assistenza),
MAYDAY (7 casi di pericolo di vita). Il testo mostrato e quello **pronunciato**
sono due stringhe diverse, ed e' voluto: `MAYDAY` si scrive cosi' ma viene dal
francese *m'aidez*, quindi la voce dice **"mede'"**; MMSI e coordinate si dettano
cifra per cifra; il nominativo si compita con l'alfabeto fonetico dello stesso
modulo (`IZ1ABC` -> "India Zulu Unaone Alfa Bravo Charlie"). Coordinate con la
convenzione gia' fissata per il MOB. Due avvisi in pagina, non trattabili: la
voce serve a chi parla e **non va avvicinata al microfono** (la stazione fa
domande e deve sentire una persona), e per l'emergenza vera **il primo gesto e'
il DSC**.

### Impostazioni
Tre campi nuovi nel Profilo barca: `mmsi`, `callsign`, `owner`. Contratto:
`raffyca-profile` passa da `{boat, model, zone}` a
`{boat, model, zone, mmsi, callsign, owner}` — additivo, nessuna migrazione.
Non passano da `rfBoatSync` (non stanno nella tabella `boats`). L'MMSI si salva
anche se non ha 9 cifre, con avviso: rifiutarlo farebbe perdere l'input, ma un
MMSI di lunghezza sbagliata dentro un MAYDAY e' peggio di un MMSI assente.

### Impianto
Nessun service worker proprio: servito dall'hub come Carta e Cruscotto.
`sw.js` hub **v11 -> v12** con `./prontuario/` nel precache. Tessera nuova
nell'hub dopo Calcoli.

### Verificato
764/764 caratteristiche parsate senza eccezioni, 745 con diagramma (le 19
mancanti sono incomplete nel dato); le due notazioni della cardinale sud
coincidono; le fasi coprono esattamente il periodo in tutti i casi provati;
navigazione fra le sei viste e ritorno; salto legenda -> simulatore con la
caratteristica giusta decodificata; deep link `?v=&ch=&n=`; testo VHF nei tre
livelli e **testo pronunciato** catturato intercettando `SpeechSynthesisUtterance`
senza far parlare il dispositivo; campi Impostazioni in scrittura e rilettura,
con normalizzazione (MMSI solo cifre, nominativo maiuscolo); nessun errore in
console; nessun overflow orizzontale; resa a 375x812.

### Aperto
- **Le bandiere non sono verificate.** I 27 disegni sono ricostruiti a memoria,
  non riprodotti da fonte controllata, e in pagina c'e' l'avviso in rosso. Vanno
  confrontati uno per uno con la tavola ufficiale del Codice Internazionale dei
  Segnali prima di toglierlo. Le meno sicure: **R**, **W**, **Y**, **Z** e il
  pennello **AP**; le lettere a fasce e a scacchi sono geometria semplice e
  rischiano meno.
- La voce dipende dalle voci italiane installate sul dispositivo: se non ce n'e'
  una `it-*` il sistema usa quella di default e "mede'" puo' uscire storto. Non
  provato su iOS in PWA installata, dove `speechSynthesis` ha limiti suoi.
- L'aggancio "Come si vede" dal popup faro della Carta non e' fatto: il modulo
  accetta gia' il deep link, manca la riga in `carta/index.html`.
- Il simulatore usa il `ch` cosi' com'e': se il dato OSM e' sbagliato, il
  prontuario mostra fedelmente un ritmo sbagliato. Non c'e' verifica incrociata
  con una fonte nautica.

---

## 03/09/2026 — Bandiere: verificate sulla fonte, e ne mancava mezza sezione

Sergio ha portato il **Regolamento di Regata 2025-2028** (FIV), che contiene sia i
Segnali di Regata sia la tavola del Codice Internazionale dei Segnali. E' la fonte
che nella voce precedente mancava.

### Come si e' letto il PDF, visto che non si poteva
Sulla macchina non c'e' niente per i PDF: nessun `pdftotext`, nessun `pdftoppm`,
niente PyObjC, niente Homebrew. Installare Homebrew per leggere un file non e'
una scelta che tocca a me. Vie percorse e scartate:
- **estrattore di testo in Python puro** (zlib + operatori `Tj`/`TJ`): scritto e
  buttato. Le pagine dei segnali sono **immagini raster**, non testo: usciva
  rumore binario. Anche fosse andato, il testo non dice i colori.
- **PDF aperto nel pannello browser**: il pannello lo scarica invece di renderlo.
- **PDF.js da cdnjs in una pagina locale**: questa funziona. Decodifica i font
  (il testo delle altre pagine esce pulito: il regolamento e' di **177 pagine**,
  non 21) e soprattutto **renderizza su canvas**, da cui si leggono i pixel.

### La verifica vera: misurare i pixel, non guardare la figura
Sulla tavola resa a scala 3 ho campionato il colore in punti interni ai quattro
triangoli della Zulu, classificandolo sui colori di riferimento del Codice.
Risultato: **alto GIALLO, battente BLU, basso ROSSO, inferitura NERO**.

Nel codice la Zulu era **ruotata**: alto nero, inferitura giallo, basso blu,
battente rosso. Nessuno dei quattro triangoli era al posto giusto. Rileggendo il
file non si vedeva — quattro triangoli colorati sembrano sempre plausibili — e
guardando la miniatura della tavola nemmeno, perche' a quella scala i triangoli
sono di dieci pixel. **Corretta.**

Stesso metodo ha confermato che la **Oscar era gia' giusta** (diagonale con rosso
in alto a sinistra, giallo in basso a destra), che era l'altra su cui avevo dubbi.

### Secondo difetto: l'Intelligenza era della forma sbagliata
Era disegnata come una bandiera **rettangolare** a fasce rosso/bianche. Sulla
tavola e' un **pennello** che si assottiglia. Un rettangolo a fasce rosso-bianche
non e' l'Intelligenza: e' un'altra cosa. Rifatta con la sagoma giusta.

### Cosa mancava, e ora c'e'
La sezione aveva solo 27 disegni e nessun numero. Ora 47, in quattro gruppi:
- **Alfabeto** (26) — ognuna con il significato CIS e, dove esiste, quello
  **diverso in regata** preso dal regolamento (I -> regola 30.1, Z -> 30.2,
  U -> 30.3, X richiamo individuale, S percorso ridotto, Y giubbotto, ecc.).
- **Pennelli numerici** (10, da 1 a 0) — mancavano del tutto.
- **Ripetitori e Intelligenza** (4) — mancavano del tutto.
- **Segnali di regata** (7): bandiera Nera (regola 30.4), Arancione (estremita'
  linea di partenza), Blu (estremita' linea di arrivo), e le quattro del Cambio
  del Prossimo Lato (triangolo verde a dritta, rettangolo rosso a sinistra,
  barra nera accorcia, croce nera allunga).

Impianto: tre sagome ritagliate (`SW` coda di rondine, `PEN` pennello tronco,
`TRI` pennello triangolare) con `clipPath` a id progressivo, cosi' non collidono.
Le bandiere hanno **altezza fissa** invece di larghezza piena: quadre e pennelli
hanno viewBox diversi e a larghezza piena si deformavano.

### Verificato
47 bandiere in 4 gruppi rese senza SVG a larghezza zero e senza id `clipPath`
duplicati; alfabeto confrontato a video con la tavola; Zulu e Oscar confrontate
per campionamento di pixel; scheda di dettaglio con significato CIS e di regata;
**zero errori nuovi** intercettando `window.onerror` mentre si forzano le
caratteristiche incomplete e si apre/chiude una scheda (gli errori in console
erano cronologia dei test fatti PRIMA della guardia di ieri, non del codice
attuale — controllato contando solo gli errori generati sul momento).

### Aperto
- **Pennelli numerici e ripetitori restano ricostruiti**, non campionati: sulla
  tavola sono piccoli e la mia individuazione automatica delle macchie li
  spezzava. Il disegno d'insieme corrisponde, ma proporzioni e dettagli (in
  particolare il **9** e i tre **ripetitori**) vanno guardati una volta sulla
  tavola. L'avviso in pagina lo dice, e ora e' ambrato invece che rosso perche'
  il resto e' verificato.
- Le composte (Intelligenza su H, su A, su pennello; N su H, su A) sono
  descritte a parole nella scheda, non disegnate come coppia di bandiere.
- Il PDF non e' nel repo ed e' giusto cosi': e' il regolamento FIV, si scarica
  dalla fonte. Serviva per verificare, non per essere ridistribuito.

---

## 03/09/2026 — Rotta salvabile in Carta, viste agganciabili, stato di apertura pulito

Sei interventi decisi con Sergio punto per punto. Toccati `routing/`,
`carta/`, `impostazioni/`, `prontuario/`. SW bump: `raffyca-rt-v19 -> v20`.

### 1. La rotta di Traversata si salva in Carta Nautica
Nuovo tasto **⤓ Salva in Carta** accanto a Esporta GPX. Scrive `raffyca-tracks` e
`raffyca-folders` secondo il contratto condiviso, **da dentro `routing/`**: la
Carta non e' stata toccata per questa funzione, quindi zero rischio sul modulo
che custodisce waypoint e tracce dell'utente.

Il motivo non e' l'archivio, e' la **catena**: in Carta la rotta diventa una
traccia, una traccia si puo' rendere attiva (`raffyca-active-track`) e il
Cruscotto la segue (voce 26/07). Il GPX resta un file da ritrovare nel telefono.

`R_CACHE` vive in memoria: chiudi il modulo o cambi zona e la rotta non esiste
piu'. Solo A/B e i parametri stavano in `raffyca-traversata-ui`.

**Contro la deperibilita'**, che e' il vero rischio (in Carta una rotta di
routing e' indistinguibile da una traccia registrata, e il Cruscotto la
seguirebbe come un piano valido):
- nome con **data e ora di partenza**: `Rotta 03/09 06:00 · Alto Adriatico`;
- `note` con tutte le condizioni del calcolo (zona, campo vento live o
  sintetico, ETA, buffer costa, perdita manovra, efficienza polare, motore,
  limite di vento) e la riga "Le condizioni cambiano: ricalcola prima di usarla";
- `tag` viola fisso `#c792ea`, diverso dal teal delle tracce disegnate.

**NON** viene resa attiva da sola: attivarla e' un gesto deliberato in Carta.

La cartella **"Rotte Traversata"** si crea **pigramente** al primo salvataggio ed
e' una cartella **normale**. Scartata la proposta iniziale di Sergio di una
cartella non cancellabile: eliminare una cartella in Carta gia' oggi non cancella
gli elementi (tornano "senza cartella", voce 26/07), quindi non c'e' niente da
proteggere, e un'eccezione nel modello delle cartelle si sarebbe pagata in
`delFolder`, `renameFolder`, select e filtro.

Distanza calcolata con `dist()` del router, non con una formula nuova: il numero
scritto in Carta e' lo stesso su cui la rotta e' stata calcolata. Nomi duplicati
(stessa partenza salvata due volte) numerati ` (2)`, ` (3)`.

**Il tasto Naviga NON diventa ridondante** ed e' rimasto: accende il GPS e guida
su *questa* rotta *adesso*, con "ricalcola da qui" che rifa' il calcolo dalla
posizione mentre il vento gira. E' l'unica cosa che solo Traversata puo' fare,
perche' solo li' ci sono campo di vento e polare.

### 2. Vista carta condivisa fra Carta e Traversata
Nuova chiave **condivisa** `raffyca-map-view {c:[lat,lon], z}` — **solo centro e
zoom**. Base e overlay restano privati di ogni modulo: le basi non coincidono
(Carta nautica/sat/osm, Traversata le sue) e un overlay acceso di la' non
significa niente di qua. Interruttore in **Impostazioni > Aspetto > Vista carta
condivisa** (`raffyca-settings.syncMapView`), **default spento**.

**La guardia e' la parte che conta.** In Traversata la vista condivisa si applica
solo se il riquadro risultante **contiene A e B**; altrimenti si torna a
`fitArea`. Senza, arrivando dalla Carta zoomati su un porto, A e B finiscono
fuori schermo e a video sembra che la rotta sia sparita. Implementata provando la
vista e annullandola se i bounds non contengono i due punti.

`raffyca-carta-view` resta e continua a fare il suo lavoro quando l'aggancio e'
spento. La carta dei temporali del Meteo non e' stata toccata (scelta di Sergio:
si guarda in generale).

### 3. Stato di apertura: si riapre puliti
**Traversata** si apre con mare + vento + toponimi accesi, e costa modello,
isocrone, "solo lungo la rotta" e batimetria **spenti**. **Carta** si apre con
tutti gli overlay spenti (griglia, zone venti, batimetria, fari).

Questo **supera in parte** la persistenza dei toggle introdotta il 20/07 per
Traversata e il ripristino overlay della voce 08/08 (l) per la Carta. Il motivo:
sono strumenti d'**analisi**, si accendono quando servono; ritrovarli accesi il
giorno dopo vuol dire aprire su una carta illeggibile senza ricordarsi perche'.
Restano persistiti centro, zoom, base e tutte le **scelte** (A/B, motore, buffer,
efficienza). In Carta i campi `grid/zones/bathy/fari` continuano a essere
**scritti** in `raffyca-carta-view`: non costano nulla e servono se un giorno si
vuole un'opzione "riapri com'era".

### 4. Impostazioni: dati radio
Aggiunti al profilo **MMSI**, **nominativo internazionale** e **armatore**.
Contratto: `raffyca-profile {boat, model, zone, mmsi, callsign, owner}`.
MMSI ripulito delle non-cifre e troncato a 9; nominativo forzato maiuscolo.
Un MMSI di lunghezza sbagliata **si salva comunque** con avviso ("MMSI salvato,
ma non ha 9 cifre"): rifiutare l'input lo farebbe perdere, ma un MMSI sbagliato
dentro un MAYDAY e' peggio di uno assente, quindi va detto. Non passano da
`rfBoatSync` (non stanno nella tabella `boats`).

### 5. Prontuario — bandiere: due errori e le didascalie
- **Terzo ripetitore sbagliato**, segnalato da Sergio e confermato leggendo la
  tavola riga per riga (mappa ASCII dei colori campionata a scala 3): e' bianco
  con **fascia nera IN MEZZO**, non nera in alto come l'avevo disegnato.
- **Secondo ripetitore** anche lui sbagliato, trovato con lo stesso metodo:
  fascia **blu all'inferitura** e bianco fino alla punta, non un triangolo bianco
  su blu. Il primo era giusto (triangolo giallo all'inferitura su blu).
- **Filetto nero** attorno a ogni sagoma, dentro l'SVG e fuori dal ritaglio
  (dentro, il clip ne mangia meta' spessore). Tolti bordo e fondo CSS: adesso un
  pennello si vede triangolare invece che dentro un rettangolo bianco.
- **Didascalie**: non erano invisibili, erano **troncate prima
  dell'informazione**. Arancione e Blu mostravano entrambe "L'asta che espone
  questa bandiera e' un…", identiche: non si capiva quale fosse partenza e quale
  arrivo. Stesso per dritta/sinistra. Aggiunto un campo `c` (didascalia corta e
  distintiva) usato in griglia; il testo ufficiale completo resta nella scheda.

### 6. Prontuario — simulatore fari: il confronto era incomprensibile
Sergio: "non e' chiarissimo cosa sto vedendo con la seconda luce, come si carica
e che nome ha". Aveva ragione su tutti e tre i punti: gli esempi caricavano
**sempre** la prima luce, la seconda si chiamava "Confronto", e la barra dei
tempi mostrava solo la prima.
Ora: distintivi **A/B** sotto le lampade per scegliere quale stai modificando,
etichette che dicono dove va a finire l'esempio che tocchi ("Esempi reali dalla
carta -> caricano la luce B"), **una barra dei tempi per luce** con il suo nome,
e la decodifica riferita alla luce selezionata. Le due partono dallo **stesso
`t`**, quindi lampeggiano in fase come le vedresti dalla barca.

### Verificato
Con server locale e browser vero, non a lettura:
- **Salvataggio rotta**: cartella creata al primo salvataggio, **non duplicata**
  al secondo, **ricreata** dopo averla cancellata a mano; nome/nota/tag/formato
  punti `[lat,lon,0]` conformi al contratto; 41 punti e 41,66 NM su Trieste-Istria;
  Carta rilegge le tracce (contatore a 3). Rifiuto corretto con rotta assente
  ("Nessuna rotta da salvare") e con rotta di area diversa.
- **Vista condivisa**, quattro casi con mappa dimensionata a 760x560:
  vista larga che contiene A e B -> **applicata**; vista stretta su porto ->
  **rifiutata**, torna a `fitArea`; impostazione spenta -> non applica e **non
  scrive** la chiave.
- **Stato di apertura**: i sette toggle di Traversata nello stato chiesto;
  i quattro overlay di Carta spenti.
- **Impostazioni**: interruttore default "Separate", scrive e cancella
  `syncMapView`, i tre campi radio presenti; zero errori JS.
- **Prontuario**: 47 bandiere, **tutte** col filetto (contate via DOM), terzo
  ripetitore con la fascia a `y=14 h=12`, didascalie di regata distinte;
  confronto fari: 1 lampada/1 barra da spento, 2 e 2 acceso, esempio caricato
  su B lascia A invariata, decodifica etichettata; zero errori intercettando
  `window.onerror`.

### Aperti
- **Il router non produce rotta nel browser di anteprima** (`path.length` 1,
  `finished:false`). **Non e' una regressione**: verificato estraendo da git la
  versione precedente e servendola in parallelo, si comporta identica. E' il
  worker che non gira in quell'ambiente. Il salvataggio e' stato provato
  iniettando una rotta della forma vera. **Da riprovare a bordo con una rotta
  calcolata davvero.**
- **Bandiera generica (logo/vela)** chiesta da Sergio: rimandata, deve ancora
  spiegare a cosa serve.
- Pennelli numerici: restano ricostruiti (vedi voce precedente); i **ripetitori**
  ora sono campionati e non sono piu' fra i dubbi.
- Nessuna delle cose di oggi e' stata vista su telefono: **tocca il layout** il
  filetto delle bandiere, i distintivi A/B e il tasto in piu' nella barra di
  Traversata (ora sono due bottoni dove ce n'era uno).

---

## 03/09/2026 (2) — Il motore dei fari esce dal Prontuario, e una regressione mia

### Regressione: "vedila" nella legenda non funzionava
Segnalata da Sergio. Causa: riscrivendo il simulatore per il confronto a due luci
ho sostituito `CURNAME` con `NOMI`/`SEL`, ma **due punti continuavano ad
assegnare a `CURNAME`** — il salto dalla legenda e il deep link `?ch=&n=`.
Il file e' `"use strict"`, quindi assegnare a una variabile inesistente **lancia**
e il gestore muore prima di cambiare vista.

Due lezioni, entrambe gia' note a questo repo e ripetute lo stesso:
- il difetto **non si vedeva al caricamento**, solo al clic: nessun errore in
  console finche' non tocchi quella riga;
- avevo provato il salto dalla legenda **prima** della riscrittura e non l'ho
  riprovato **dopo**. Una prova fatta prima di un rifacimento non vale piu'.

Ironia utile: lo stesso difetto avrebbe rotto il deep link, cioe' proprio
l'aggancio dalla Carta che stavo per costruire.

### `rf-fari.js`: motore condiviso
Il calcolo delle caratteristiche (parser, fasi, descrizione in italiano,
riconoscimento cardinali) esce dal Prontuario e diventa `rf-fari.js` in radice,
accanto a `rf-topbar.js` / `rf-astro.js` / `rf-live.js`, che e' la convenzione
gia' in uso. Motivo: due copie dello stesso disegno divergono, e a divergere
sarebbe la risposta a "che luce sto vedendo".

API: `rfFari.parse / phases / stateAt / describe / cardinale / COL / lampada`.
`lampada(host, ch, opt)` disegna e anima un riquadro autonomo e restituisce uno
`stop()`.

Il Prontuario ora ha solo **alias** con i nomi locali (`parseCh`, `buildPhases`,
`describe`, `cardinale`, `stateAt`): il resto del modulo non e' stato toccato,
scelta deliberata dopo la regressione qui sopra.

### Carta Nautica: "come si vede" sul faro toccato
Toccando un faro, il popup ora apre **sopra** i dati un riquadro con la luce che
lampeggia davvero, la sua barra dei tempi e la descrizione a parole. Una luce
sola: qui stai identificando QUESTO faro. Il confronto a due luci resta nel
Prontuario, dove serve a distinguerne due — scelta di Sergio, ed e' giusta.

Il popup ha fondo chiaro ma il riquadro ha il suo fondo scuro: una luce va vista
su scuro, come di notte.

Una sola animazione viva per volta (`fariAnim`): si ferma su `popupclose` e
prima di aprirne un'altra, altrimenti ogni faro toccato lascia un
`requestAnimationFrame` che gira a vuoto.

SW hub v12 -> v13, `rf-fari.js` aggiunto al precache.

### Verificato
- "vedila": clic **sul testo** e clic **sulla riga**, entrambi portano al
  simulatore con la caratteristica giusta; deep link `?v=fari&ch=&n=` carica
  caratteristica e nome. Zero errori.
- Prontuario sul motore condiviso: decodifica, confronto A/B, esempio caricato
  su B, caratteristica non riconosciuta. Zero errori.
- Carta: 3110 fari caricati, popup su "Isola Palmaiola" (`Fl W 5s 10M`) mostra
  lampada, 2 segmenti di barra e "1 lampo bianco, ogni 5 s · portata 10 M".
  **Lampeggio misurato**: 26 campioni a 200 ms su un periodo da 5 s, 2 accesi —
  coerente con un lampo da 0,5 s; testina che avanza; animazione **fermata**
  alla chiusura del popup.

### Aperti
- Il riquadro in Carta **non e' stato visto su telefono**: e' dentro un popup
  Leaflet, che su schermo stretto e' la cosa piu' facile da far strabordare.
- La lampada nel popup parte sempre da t=0 del proprio `rfFari.lampada`, quindi
  la fase non e' sincronizzata con l'orologio: serve a riconoscere il ritmo, non
  a prevedere quando il faro lampeggera' davvero. Vale gia' per il Prontuario.

### Aggiunta 03/09 — etichetta del filtro isocrone
`solo lungo la rotta` -> **`solo isocrone della rotta`**, piu' il testo di aiuto
al passaggio del mouse. La vecchia dizione era ambigua nel modo peggiore:
sembrava dire che il *calcolo* avvenisse solo lungo la rotta, che sarebbe una
cosa diversa e pericolosa (il router esplora in tutte le direzioni, e deve).
Il filtro e' e resta di sola VISTA: `isoCorridor()` decide quali isocrone
disegnare, non come si calcola. SW routing v20 -> v21.
Verificato: etichetta e suggerimento a video, spunta spenta all'apertura,
`isoCorridor()` restituisce una funzione con la casella accesa e `null` con la
casella spenta.

---

## 03/09/2026 (3) — "vedila" apre un foglio, e il simulatore sa cosa vedi da qui

Due richieste di Sergio sul Prontuario, piu' un secondo pezzo di motore condiviso.

### "vedila" non porta piu' via dalla legenda
Prima il collegamento dalla legenda **cambiava vista**: stavi leggendo le sigle,
toccavi "vedila" e ti ritrovavi nel simulatore, con la ricerca da rifare per
tornare alla riga dopo. Ora apre il **foglio** gia' usato dalle bandiere, con
dentro il riquadro di `rfFari.lampada`: guardi il lampeggio, chiudi, sei ancora
al tuo posto nell'elenco.

Una sola lampada viva per volta (`sheetAnim`), fermata alla chiusura: senza,
ogni apertura lasciava un `requestAnimationFrame` a girare a vuoto. Stessa
attenzione gia' presa in Carta con `fariAnim`.

### "Fari visibili da qui" al posto degli esempi
Nel simulatore, bottone **◎ Fari visibili da qui**: legge `raffyca-pos`, calcola
quali luci ti raggiungono davvero e le mette al posto degli esempi, dalla piu'
vicina, ognuna col rilevamento e le miglia sul chip
(`Isola Palmaiola · 103° 1.1M`) e il dettaglio completo nel suggerimento. Il
bottone fa da interruttore e si torna agli esempi.

E' la domanda vera: non "com'e' fatta una Fl(2)" ma "quella luce laggiu', quale
delle tre e'". Gli esempi restano perche' servono a un'altra cosa: imparare a
leggere una caratteristica quando la carta non ce l'hai davanti.

**Il dato non si carica all'apertura.** `carta/fari.geojson` sono 549 KB: il
Prontuario deve aprirsi leggero e senza rete, quindi si scarica al primo tocco
del bottone e poi resta in memoria. Se manca la rete e il file non e' mai stato
preso, lo dice e indica come procurarselo (aprire i Fari in Carta una volta).

Ereditata da Carta la **regola prudente**: senza portata nota nel dato, la
visibilita' **non si afferma**. Meglio tacere che dire che vedi una luce che non
vedi. Ed e' scritto in chiaro che la portata e' quella **nominale** — quanto il
faro puo' arrivare, non quanto vedi tu stanotte.

### La geometria passa in `rf-fari.js`
`brg`, `distM`, `inSector` e il nuovo `visibili(features, pos)` stanno ora nel
motore condiviso. In Carta `frBrg` / `frDist` / `frInSector` sono diventati
**alias**, come gia' fatto per il calcolo delle caratteristiche: il resto del
modulo non e' stato toccato.

### Ancora lo stesso tranello di stamattina
Riscrivendo il disegnatore dei chip ho tolto il `var box` locale di `initFari`,
e una funzione piu' sotto (`scritto`) continuava a usarlo: sotto `"use strict"`
sarebbe esploso al primo carattere digitato, esattamente come `CURNAME`.
Trovato **prima** di provarlo, cercando i riferimenti orfani con uno script
invece che a occhio. E' la seconda volta in un giorno: quando si sposta o
rinomina una variabile in questo file, la ricerca dei riferimenti va fatta
sull'intero blocco, non sulla funzione che si sta modificando.

### Verificato
- **Foglio dalla legenda**: si apre con caratteristica, titolo, barra a 6
  segmenti e testo giusti per `Oc(3) W 12s 15M`; la vista resta `v-legenda`
  prima, durante e dopo; chiusura pulita.
- **Fari visibili**, dal canale di Piombino (42.87 N, 10.45 E): 11 luci, prima
  "Isola Palmaiola · 103° 1.1M" con suggerimento
  `Fl W 5s 10M · rilevamento 103°T · 1.1 M · portata nominale 10 M`; toccandola
  carica `Fl W 5s 10M` col nome vero; ritorno agli esempi corretto; senza
  posizione, messaggio che spiega come ottenerla.
- **Carta non rotta dalla delega**: rilevamento verso est 89,99°, distanza 1630 m
  su 0,02° di longitudine a 42,87° (atteso ~1632), settore dentro/fuori e
  **a scavalco dello zero** corretti; "cosa vedo" disegna 22 elementi.
- **Conferma incrociata**: dalla stessa posizione Carta traccia 11 luci (22
  elementi, due polilinee per luce) e il Prontuario ne elenca 11. I due moduli
  concordano perche' ora fanno lo stesso conto — che era il motivo di
  `rf-fari.js`.
- Zero errori nuovi intercettando `window.onerror` in tutti i giri.

SW hub v13 -> v14.

### Aperti
- Niente di questo e' stato visto **su telefono**: il foglio con la lampada e la
  fila di chip con rilevamento e miglia sono le due cose che possono strabordare
  su schermo stretto.
- I chip mostrano le **14 piu' vicine**: con molte luci vicine (rade affollate)
  il taglio potrebbe togliere proprio quella che cerchi. Da vedere in uso se 14
  e' il numero giusto.
- La lampada parte da t=0 all'apertura: riconosce il **ritmo**, non prevede
  quando il faro lampeggera'. Vale per tutti e tre i posti dove appare.

---

## 03/09/2026 (4) — In Carta solo la luce, e il popup smette di sfondare

Prima prova su schermo stretto (schermata di Sergio), e sono usciti due difetti
che a schermo largo non si vedevano.

### Il riquadro era spaginato, ma il difetto vero era di contenuto
Nel popup, largo ~300 px, la colonna di destra con nome, caratteristica, barra e
descrizione si riduceva a sei caratteri: il testo andava a capo **ogni parola**
("1 / lampo / giallo, / ogni / 3 s / portata / 4 M"), su dieci righe.

Si poteva aggiustare il CSS, ma la chiamata giusta l'ha fatta Sergio ed e' di
merito, non di forma: **in Carta quel testo non serve**. Nome e caratteristica
sono gia' scritti nel popup due centimetri piu' sotto, e la Carta non e' il posto
dove si impara a interpretare i fari — li' serve solo **vedere** il ritmo. Chi
vuole leggerla apre il Prontuario.

`rfFari.lampada` ha ora due tagli: `{solaLuce:true}` disegna solo la lampada
(Carta), l'impostazione completa resta al Prontuario, dove imparare a leggere una
caratteristica e' esattamente lo scopo.

Diametro ridotto in un secondo giro (58 -> 38 il cerchio esterno, 34 -> 20 la
lampada): il riquadro passa da 82 a **56 px** e il popup da 131 a **105**. La
luce si legge lo stesso perche' a renderla visibile e' l'**alone**, non il
diametro del disco — e infatti l'alone e' stato ridotto in proporzione, altrimenti
restava grande come prima e riempiva il riquadro rimpicciolito.

### Secondo difetto, trovato dalla prova e non dalla segnalazione
Con piu' luci vicine, l'elenco "Anche qui" faceva crescere il popup **oltre
l'altezza della mappa**: su telefono finiva fuori schermo proprio la cima, cioe'
la luce che lampeggia. Aggiunto `maxHeight` al popup, calcolato come due terzi
dell'altezza della mappa e non come numero fisso: in orizzontale la mappa e'
bassa e un valore fisso avrebbe sbagliato di nuovo.

### Verificato
Con viewport emulato a **375x812** (telefono), che e' la condizione in cui il
difetto si era manifestato:
- riquadro alto 56 px, lampada 38x38, **nessun testo dentro** (stringa vuota),
  popup largo 301 px e alto 105;
- `rffBox` e' il primo elemento del contenuto: la luce sta in cima;
- popup contro una mappa di 372 px: **ci sta**, con tetto a 246;
- zero errori JS.
A schermo si vede il riquadro scuro con la luce e sotto
`Palau Meda / Fl Y 3s 3M / E 0990`.

SW hub v14 -> v15.

### Aperti
- La lampada **spenta** e' un cerchio scuro su fondo scuro: corretto (una luce
  buia e' buia), ma se apri il popup durante la fase di buio di una Fl 3s il
  riquadro sembra vuoto per due secondi e mezzo. Il bordo del cerchio lo rende
  distinguibile; da vedere a bordo se basta.
- La prova e' su viewport emulato, non su tablet vero.

---

## 03/09/2026 (5) — Bandiere in Partenza: discusso, non deciso

Nessuna riga di codice. La voce esiste perche' qui il valore sta nella strada
scartata e nella forma raggiunta: fra due settimane, senza questo, resta solo
"volevamo mettere le bandiere nella Partenza".

### L'idea
Durante il countdown di `partenza/`, mostrare le bandiere della sequenza — prima
l'Intelligenza, poi via via quelle previste dalle istruzioni di regata, con
un'ammainata che ne chiama un'altra. Da qui era nata anche la richiesta della
**bandiera generica** (il guidone di circolo, che nelle partenze si vede spesso):
nel Prontuario **non c'e' ancora** — le 47 sono alfabeto, pennelli numerici,
ripetitori con Intelligenza, segnali di regata.

### Scartata: l'AI che legge le istruzioni di regata in PDF
Era l'ipotesi di partenza di Sergio, scartata da lui stesso ("le variazioni sul
tema sono davvero tante") e confermata scartata per un motivo piu' forte: **le
istruzioni non contengono l'informazione che serve nel momento in cui serve.**
Dicono l'ora dell'avviso e la bandiera di classe; differimenti, richiami
generali e cambi d'ordine li decide il Comitato quel giorno. Un PDF interpretato
bene sarebbe autorevole e sbagliato esattamente a -3:00. In piu' girerebbe
offline e non e' verificabile: l'estrazione non la controlli mentre sei in mezzo
alla flotta. Se un giorno torna, il posto e' **a terra**: pre-compilare un
profilo che l'utente conferma in porto — comodita', non funzione.

### La forma raggiunta (da riprendere quando si riparte)
Le bandiere sono **due famiglie**, e trattarle allo stesso modo e' l'errore:
- **programmate** — avviso, preparatoria, le due ammainate. Nessuna variazione:
  e' la regola 26 (5-4-1-0). Schema **compilato prima** in porto come lista di
  eventi a tempo (`-5:00 issa classe`, `-4:00 issa preparatoria`, `-1:00 ammaina
  preparatoria`, `0:00 ammaina classe`), seminata da un preset ed editabile;
  poi la esegue il countdown da solo. Le "variazioni sul tema" le assorbe la
  lista, non l'AI.
- **reattive** — Intelligenza, 1&deg; ripetitore, X, N. Non prevedibili, restano
  manuali, e non sono disegni da mostrare ma **ri-ancoraggi dell'orologio**
  (sospendi; torna all'avviso un minuto dopo l'ammainata). E' li' che uno schema
  automatico puo' andare fuori fase con la realta': e' il pezzo delicato.

Guadagni gratis se lo schema e' ancorato al countdown: `cdSync` e i `+/-1 minuto`
trascinano l'intera sequenza; e i bip generici di `cdCue` possono diventare i
**segnali sonori veri** (avviso, preparatorio, suono lungo al minuto, via).

### Vincoli emersi
- **"Attese", mai "issate".** L'app non vede l'albero del Comitato. Scrivere
  "issata: P" quando sull'albero c'e' la Nera costa una squalifica (30.4).
- **Gli SVG non si duplicano.** Stanno in `prontuario/index.html` in una closure
  con helper locali e `clipPath` a id progressivo. Sono gia' stati corretti due
  volte (2&deg; e 3&deg; ripetitore, Zulu, Intelligenza): una copia in Partenza
  tornerebbe a divergere in silenzio. Vanno estratti in un `rf-bandiere.js`
  condiviso, come `rf-astro.js` e `rf-fari.js` — con il secondo consumatore gia'
  in mano, che e' la condizione in cui quell'estrazione si e' ripagata.
- **La perdita dati di Partenza non e' diagnosticata** (quota esclusa il 27/08).
  Uno schema che sparisce a -6:00 e' peggio di uno schema assente: vive dentro
  `raffyca-start` (chiave che non risulta fra le perse) e in sua assenza si
  ricade sul preset 26, non sul vuoto.

### Aperti (decisioni di Sergio, nessuna presa)
Durata della sequenza (solo 5-4-1-0, o anche 10-5-0 e i 3 minuti di certi
circoli); partenze in sequenza per classi dentro o fuori dalla prima versione;
quanto spazio a schermo nell'ultimo minuto, dove servono numeri e distanza dalla
linea; uno schema solo o schemi salvati con un nome.

**Sospeso per scelta**: Sergio si ferma qui per provare a bordo quello che c'e'
gia' e per riprendere la rinomina in **Dritta**. Niente e' bloccato da questa
voce.

### Nota fuori tema, trovata leggendo
`CLAUDE.md` dice che `partenza/` e' un build React non modificabile da questo
repository. **Non e' piu' vero dal 30/07** (riscritto vanilla, cartella con il
solo `index.html`): resta vero per `performance/`. Da correggere in CLAUDE.md.

---

## 04/09/2026 — Due backup in Impostazioni, e il vecchio rifiutava i file del nuovo

Sergio ha notato due backup nella stessa pagina. C'erano davvero, entrambi
funzionanti e con la stessa portata (tutto il prefisso `raffyca-`), ma in
formati file diversi:

- sezione **Dati** → `btnExport`/`btnImport`, il piu' vecchio. Scriveva
  `provela-backup-AAAA-MM-GG.json` come `{_raffyca:true,_version:1,_exported,keys}`;
- sezione **Backup dati** → `rfBackup` (voce del 08/08, difesa dati dopo
  l'azzeramento su Android PWA). Snapshot automatico in IndexedDB, stato
  dell'ultimo backup, file `ProVela-backup-AAAAMMGG-HHMM.json` come
  `{app,ts,keys}`.

### Il difetto silenzioso, che non era la duplicazione
I due import non erano simmetrici. `rfBackup.importFile` legge `j.keys || j` e
quindi accetta anche i file vecchi; il vecchio `importBackup` pretendeva il
flag `data._raffyca`, che l'export nuovo **non scrive**. Esportare da "Backup
dati" e reimportare da "Dati" dava "Backup non riconosciuto" con in mano un
file valido — nel momento peggiore, cioe' durante un ripristino dopo una
perdita. Rileggendo il codice non si vede: i due blocchi sono lontani nel file
e ciascuno, da solo, e' corretto. E' lo stesso schema dei riferimenti orfani
del 03/09.

Il vecchio aveva anche due comportamenti inferiori: importava senza chiedere
conferma e non ricaricava la pagina, lasciando i moduli gia' aperti sui dati
pre-import.

### Alternative scartate
- **Tenere i due e allineare i formati** (aggiungere `_raffyca` all'export
  nuovo, o accettare entrambi nel vecchio): risolve l'incompatibilita' ma
  lascia due bottoni "Esporta backup" nella stessa pagina, cioe' il difetto
  che Sergio ha segnalato. Due strade che fanno la stessa cosa divergono di
  nuovo alla prima modifica.
- **Tenere il vecchio e buttare `rfBackup`**: perderebbe snapshot automatico,
  offerta di ripristino all'avvio e stato dell'ultimo backup — cioe' proprio
  la difesa scritta contro un episodio reale.
- **Lasciare "Backup dati" dov'era, in fondo**: stava dopo la polare, staccata
  da "Azzera dati…", il cui avviso dice di esportare prima un backup.

### Correzione
Rimossi da `impostazioni/index.html` i bottoni `btnExport`/`btnImport`,
l'input `fileImport` e le funzioni `exportBackup`, `importBackup`,
`collectRaffycaKeys` (53 righe). `RF_PREFIX` resta: lo usa `resetData`.
Il contenuto di "Backup dati" e' stato spostato in testa alla sezione **Dati**,
che ora legge: copia di sicurezza → snapshot automatico → esporta/importa →
spazio usato → azzera. La sezione standalone (col commento sbagliato
`<!-- INFO -->`) e' sparita. `rfBackup` non e' stato toccato: identico a quello
inline nell'Hub.

### Verificato
Su `localhost:8765`, viewport mobile: nessun errore in console; nessun residuo
dei simboli rimossi (grep); sintassi dei 5 script inline OK (`jsc`); lo stato
"Ultimo backup automatico: … · 3 voci" compare popolato, quindi lo snapshot
IndexedDB gira anche dopo lo spostamento nel DOM; `rfBackup.importFile`
provato con un file **vecchio formato** e uno **nuovo formato**, entrambi
accettati e scritti in localStorage — nessun backup gia' sul telefono di
Sergio diventa illeggibile.

### Non verificato
Il download vero di `Esporta backup (file)` (il browser di prova non salva
file); il percorso `checkLoss` con localStorage svuotato; niente prova su
tablet. Nessun bump di service worker: `impostazioni/index.html` non sta nel
PRECACHE di `sw.js` e le navigazioni HTML sono network-first.

---

## 04/09/2026 (2) — Giro di debug su tutti i moduli: niente di rotto, tre residui morti

Sergio ha chiesto un debug generale, senza un sintomo. Non c'era un difetto da
inseguire, quindi il lavoro e' stato costruire un controllo ripetibile e farlo
girare su tutto, per distinguere "non si e' visto niente" da "si e' guardato".

### Cosa e' stato controllato, e come
- **Sintassi**: 58 sorgenti (script inline delle 22 pagine + i `.js` in
  radice e nei moduli) passati a `jsc` con `checkSyntax`: 0 errori. `node` non
  c'e' su questa macchina; `jsc` sta in
  `/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc`
  e `checkSyntax` vuole un **nome di file**, non una stringa di sorgente.
- **Caricamento**: le 22 pagine servite da `python3 -m http.server 8765` e
  aperte in viewport 375x812: nessun errore di pagina in console.
- **Service worker**: per ciascuno dei 5 le voci del precache esistono su
  disco, e nessun file precachato e' stato toccato da un commit successivo
  all'ultimo bump (`git log <ultimo-bump>..HEAD -- <file>` per ogni voce).
- **Riferimenti al DOM**: ogni `getElementById('x')` / `querySelector('#x')`
  negli script inline confrontato con gli `id` del markup dello stesso file.
  Tre orfani, tutti innocui (sotto).
- **Link e fetch relativi**, icone dei manifest, chiavi `raffyca-*` lette e
  scritte, membri di `rfFari` / `rfLive` / `rfRec` usati fuori dai file che li
  definiscono: tutto risolto.
- **Controlli interattivi** ("smash test"): in ogni pagina uno script clicca
  ogni bottone/chip/checkbox visibile, cambia ogni select e riempie ogni input,
  con `window.onerror` e `unhandledrejection` agganciati; `alert/confirm/prompt`
  neutralizzati (confirm -> false, quindi "Azzera dati" e simili non passano),
  `input[type=file]` disinnescato, geolocalizzazione finta (42.80N 10.30E).
  Contati: Carta 39, Traversata 31, Meteo 50, Impostazioni 25, Manutenzione 15,
  Cruscotto 14, Partenza 12, Sole-Luna 11, Calcoli 11, XTE 8, Posizione 6,
  Performance 4, Percorso 3, MOB 3, Prontuario 67 (bandiere 48, fari 14,
  VHF 5; alfabeto, legenda e bollettini non hanno controlli). Zero eccezioni.
- **Carta, popup faro**: posizione finta all'Elba, zoom 12, `fariPick` su
  quattro luci (Monte Poro Fl W 5s 16M, E 1441 F R 3M, E 1440 Fl R 5s 3M,
  Marina di Campo Fl W 3s 10M) in entrambi i modi (Settori / Cosa vedo): il
  riquadro `#rffBox` c'e', il contenuto cambia con la luce, il popup sta in
  333 px su 375 senza scorrimento orizzontale, "Anche qui (3)" elencato.

### Falsi allarmi, e perche'
- **MOB "copia" lancia `Cannot read properties of null (reading 'ts')`**: vero
  solo nella sequenza sintetica segna -> annulla -> copia, dove il tasto era
  gia' stato nascosto da `ferma()` insieme a tutto `#attivo`. Il primo script
  clickava una lista raccolta prima, senza ricontrollare la visibilita'; con il
  ricontrollo l'errore sparisce. Nessun percorso reale arriva a `copia()` con
  `MOB` nullo.
- **"An unknown error occurred when fetching the script"** su ogni pagina: e'
  il browser d'anteprima che non lascia registrare i service worker (la
  richiesta a `sw.js` non compare nemmeno nel log di rete). Non e' del codice.
- **429 da `api.open-meteo.com`**: limite di frequenza dopo una decina di
  ricaricamenti di Meteo in pochi minuti; al ricaricamento successivo tutte 200.

### Residui morti trovati (non toccati: niente e' rotto)
- `routing/raffyca-traversata-map.html`: `geocode()` (riga ~1135) e
  `createCustomArea()` (~1201) leggono `#q`, `#findBtn`, `#qarea`, `#areaBtn`
  che non esistono piu' nel markup. Nessuno le chiama: se qualcuno le
  ricollegasse a un bottone, lancerebbero al primo tocco. `loadCoast()` legge
  `#areaBtn` ma lo protegge con `if(ab)`.
- `meteo/index.html`: `toggleLight()` cerca `#themeBtn` (assente, protetto da
  `if(b)`) e scrive `raffyca_light`, con l'underscore, che nessuno legge. E' il
  tema di prima di `raffyca-theme`.
- `raffyca-mob-scuro` risulta "solo letta" al grep ma e' scritta tramite la
  costante `K_SCURO`: non e' un residuo, e' un limite del controllo.

### Lezioni sull'ambiente di prova (valgono per la prossima volta)
- Le schede aperte in background dal pannello browser hanno **viewport 0x0**
  finche' non si chiama `resize_window` su quella scheda: la Carta non disegna
  i fari (nessun layer, `getBounds()` degenere) e i controlli senza larghezza
  intrinseca risultano invisibili. Controllare `innerWidth` prima di fidarsi
  di un conteggio.
- A pannello nascosto Chrome **strozza i timer**: `setTimeout` a 1/s, e dopo
  qualche minuto a 1/min. Uno script di prova che fa `await sleep(10)` fra un
  click e l'altro sembra bloccato (tre timeout di fila sul Prontuario, ogni
  volta su un chip diverso). Rimedio: cedere il controllo con `MessageChannel`,
  che non e' strozzato. Anche i click via `computer` vanno in timeout a
  pannello nascosto: si guida la pagina con `javascript_tool`.
- `preview_start` con `python3 -m http.server` muore con `PermissionError` su
  `os.getcwd()`: il server va lanciato da Bash in background e il pannello
  aperto con `preview_start` sull'URL.
- Leaflet tiene il popup chiuso nel DOM durante la dissolvenza: leggendo subito
  dopo `closePopup()` si legge quello vecchio. Aspettare `opacity 0` o
  rimuoverlo.
- Lo smash test sporca il localStorage del browser di prova (profilo, tema,
  registrazione traccia avviata dal Cruscotto): pulito a fine giro con
  `localStorage.clear()` sull'origine 127.0.0.1:8765.

### Non verificato
Service worker e cache offline (bloccati nel pannello); GPS vero; download dei
file (GPX, backup, CSV/PDF del diagnostico); voce del VHF; il router con il
worker (come gia' notato il 03/09, non gira qui); tablet e telefono veri.
Nessuna riga di codice cambiata, nessun bump di service worker.

---

## 07/09/2026 — Il cruscotto che si spagina, la carta che non segue, i conti sulle linguette

Sergio ha usato l'app in mare sabato 05/09, tablet e telefono in parallelo, e ha
riferito tre cose. Piu' una quarta che non e' dell'app (vedi in fondo).

### 1. Cruscotto spaginato: un vincolo circolare, non un numero sbagliato
Alla perdita del segnale, o rientrando da uno stop del dispositivo, la colonna
destra dei campi finiva **fuori schermo** e ci restava. Nello screenshot: SOG
enorme a sinistra, "DIST. WP" e "ARRIVO WP ETA" tagliati dal bordo.

La causa non e' il font grande: e' che **la larghezza della card dipendeva dal
numero e il numero dalla larghezza della card**.
- `fit()` misurava `dp.clientWidth` e ci scriveva dentro il numero piu' grande
  che ci stesse;
- le colonne erano `grid-template-columns:1fr 1fr`, cioe' `minmax(auto,1fr)`:
  il minimo automatico e' il **min-content** della card, quindi la card poteva
  allargarsi per contenere il numero.

Chi cede per primo? La griglia: si allarga oltre il contenitore e la seconda
colonna esce dallo schermo. Peggio, e' un **cricchetto**: `fitAll()` scorre gli
slot uno alla volta e ogni `fit()` rilegge la larghezza *dopo* che il
precedente l'ha gia' allargata, cosi' il campo dopo si adegua alla colonna
gonfiata. E non si raddrizza da solo, perche' `paint()` richiama `fit()` **solo
se cambia il numero di caratteri** (`slot._shape`): un corpo sbagliato resta
appiccicato finche' il valore non cambia forma.

Le righe usavano gia' `minmax(0,1fr)` — qualcuno aveva incontrato la stessa
cosa in verticale e l'aveva chiusa li', senza accorgersi dell'orizzontale.

**I due inneschi riferiti sono lo stesso difetto.** `gpsFresh()` scade a 15 s:
alla perdita del segnale tutti i campi passano al trattino insieme, la forma
cambia e `fit()` riparte; alla ripresa dallo stop e' l'evento `resize` a
chiamare `fitAll()` mentre il layout non e' ancora assestato. In tutti e due i
casi si misura qualcosa che di li' a poco non c'e' piu'.

Difetto secondario nella stima: `chars*0.60` em per carattere sbaglia di
grosso sul **trattino** del dato assente, che di em ne occupa uno intero, e non
contava ne' l'unita' ne' lo spazio fra le due.

#### Alternative scartate
- **Abbassare il tetto dei 220 px.** Cura il sintomo nel caso peggiore e lascia
  in piedi il vincolo circolare: basta una card un po' piu' alta e ci si torna.
- **`overflow:hidden` sulla card.** Nasconde il numero tagliato ma non impedisce
  alla colonna di allargarsi: le card restano fuori schermo, solo mute.
- **Rifare `fit()` con un canvas `measureText()`.** Misura esatta e nessun
  reflow, ma va tenuto allineato a font, `letter-spacing` e `tabular-nums` del
  CSS: due verita' sulla stessa cosa, che divergono alla prima modifica di
  stile. Si misura il DOM vero.
- **Ricalcolare tutto a ogni `paint()`** invece che al cambio di forma: due
  reflow al secondo per campo, su un dispositivo che deve durare una traversata.

#### Correzione
- CSS: `minmax(0,1fr)` su **tutte** le colonne (n2, n3, n4, n5, n8) e
  `min-width:0` su `.instr`, gemello del `min-height:0` gia' presente. Rotto il
  cerchio: la card non si allarga piu' per il numero.
- `fit()`: parte dall'altezza, poi **misura la larghezza vera** (`row.scrollWidth`)
  e rimpicciolisce finche' ci sta, al massimo 5 passate. Niente piu' stime.
- `fit()` con misura impossibile (contenitore a zero: pagina nascosta, ripresa
  dallo stop, layout non assestato) **non indovina**: lascia il campo com'e' e
  azzera `_shape`, cosi' la prossima passata rimisura davvero.
- Rimisura al momento giusto: **`ResizeObserver`** sulla griglia al posto del
  solo `resize`, piu' `pageshow` e `visibilitychange`. L'osservatore arriva
  *dopo* che il layout si e' assestato, con le misure buone. Non puo' innescare
  un ciclo proprio perche' ora il corpo del carattere non cambia piu' la
  dimensione della card.

### 2. Carta: "segui la barca", come opzione
La posizione non restava al centro. Era voluto a meta': `onFix()` aggiornava il
puntino e basta, e il tasto ◎ centrava **una volta sola** (voce del 03/09, "la
carta ora segue il GPS", che in realta' seguiva solo il puntino).

Sergio ha chiesto esplicitamente che sia **un'opzione**, e cosi' e': ◎ diventa
un interruttore. Acceso (fondo verde acqua), ogni fix ricentra. Si spegne al
**primo trascinamento** — se stai guardando un'altra zona la carta non deve
strapparti indietro — ma **non** allo zoom, che ingrandire mentre segui e'
normale. Da spento, com'e' all'apertura, si comporta esattamente come prima.

#### Alternative scartate
- **Centrare sempre, senza interruttore**: rende impossibile guardare la carta
  avanti a te mentre navighi, che e' meta' del lavoro di una carta nautica.
- **Riaprirlo acceso il giorno dopo** (salvarlo e ripristinarlo): stessa ragione
  per cui gli overlay non si riaccendono (voce 08/08) — e' un modo di
  navigazione, non una preferenza. Il campo `segui` **viene scritto** in
  `raffyca-carta-view` insieme agli altri, per il giorno che si volesse un
  "riapri com'era", ma non viene riletto.
- **Spegnerlo anche allo zoom**: provato a ragionarci e scartato, vedi sopra.

Effetto collaterale visto prima di sbatterci: `saveView` e' agganciato a
`moveend`, quindi con "segui" acceso ogni fix avrebbe scritto in localStorage —
una scrittura al secondo — e la **vista condivisa** con la Traversata
(`raffyca-map-view`, opzionale) avrebbe inseguito il GPS. Ora i movimenti fatti
dal GPS si salvano al massimo ogni 15 s; quelli fatti a mano subito. Cambi di
base e overlay restano fuori dalla strozzatura: sono scelte, si ricordano
all'istante.

### 3. Manutenzione: il numero dei record sulle linguette
Chiesto da Sergio. "Lavori" e "Da fare" portano il conteggio accanto al nome.

Il punto delicato non e' mostrarlo, e' **da dove si prende**. I due filtri
vivevano dentro i renderer (`renderLavori`, `renderDaFare`), e un conteggio
scritto a parte sarebbe la cosa che diverge in silenzio: cambi il filtro fra sei
mesi, la lista dice una cosa e la linguetta un'altra, e te ne accorgi contando
le righe a mano. Estratte in `lavoriLista()` e `dafareRighe()`, usate **sia**
dai renderer **sia** dal conteggio: non possono piu' separarsi.

"Da fare" conta scadenze **e** lavori previsti, come la lista. Lo zero non si
scrive: la pastiglia sparisce (`.cnt:empty`) e la barra resta pulita.
Aggiunto `white-space:nowrap` alle linguette perche' col numero accanto
"Da fare" andava a capo sotto i 340 px e la barra raddoppiava d'altezza.

### Verificato
Su `localhost:8765`, viewport 375x812 (piu' 320 e 280 per la barra linguette):
- **Cruscotto**: riprodotto il difetto col codice di prima — a valori realistici
  la griglia misurava **506 px in uno schermo da 375**, colonna destra fuori.
  Col codice nuovo: 355 px in tutti e cinque i layout, colonne uguali, nessuna
  card fuori schermo, e resta cosi' anche dopo i due colpi che spaginavano
  (contenitore transitoriamente alto 1400 px, e contenitore a zero). Nessun
  errore in console; il testo sta dentro la card a meno di 1 px di arrotondamento.
- **Carta**: con fix simulati — da spento la carta non si muove; acceso centra
  (zoom 14 se eri piu' largo) e segue ogni fix mantenendo lo zoom; `dragstart`
  lo spegne e il tasto torna scuro; da li' i fix non muovono piu' niente.
  Strozzatura: 20 fix di fila = 0 scritture, una mossa a mano = scrittura subito.
- **Manutenzione**: con dati finti in `raffyca-manut-cache`, pastiglia **3** e
  righe disegnate **3** su Lavori, **4** e **4** su Da fare; toccando la
  pastiglia la linguetta cambia lo stesso (il gestore usa `closest`); con zero
  record la pastiglia sparisce; a 320 px una riga sola.
- Sintassi (`jsc checkSyntax`) dei tre file: pulita. Nessun errore cliccando
  tutti i controlli visibili delle tre pagine.
- Bump: `provela-hub-v15` -> **v16**, perche' `./manutenzione/` sta nel PRECACHE
  dell'hub. `carta/` e `cruscotto/` non stanno in nessun precache e le
  navigazioni HTML sono network-first: nessun altro bump.

### Non verificato
Niente e' stato visto su tablet o telefono veri, ne' con GPS vero: i fix sono
simulati chiamando `onFix`/`paint` come fa il codice. Non provata la ripresa
vera dallo stop del dispositivo (qui e' simulata muovendo il contenitore e
nascondendo la pagina). `ResizeObserver` c'e' su tutto quello che ci interessa,
ma il ripiego su `resize` per i browser vecchi non e' stato esercitato.
Sotto i 282 px la barra delle linguette sborda dal proprio riquadro (la pagina
no): nessun telefono in commercio e' cosi' stretto, non ci ho messo mano.

### Fuori tema: il tablet che perde il GPS e il telefono no
Non e' dell'app — l'app fa la stessa richiesta sui due dispositivi
(`enableHighAccuracy:true`), e il modulo che perde il segnale e' lo stesso
codice che sull'altro lo tiene. La spiegazione di gran lunga piu' probabile e'
che **il tablet non abbia un ricevitore GNSS**: i modelli solo-Wi-Fi quasi mai
ce l'hanno, e si posizionano triangolando reti Wi-Fi e celle. In porto
funziona, al largo non c'e' niente da triangolare e il fix scade. Da controllare
sulla scheda del modello, voce "GPS/GLONASS". Se invece il GNSS c'e', i sospetti
in ordine sono: risparmio energetico Android che sospende il browser, permesso
di posizione non su "sempre / precisa", schermo spento.
Quello che l'app puo' fare, e ora fa, e' **degradare bene**: campi a trattino e
niente layout che si sfascia. Il resto e' antenna.

---

## 07/09/2026 (2) — Il fix vecchio non e' un fix mancante

Seguito della voce di stamattina. Il tablet di Sergio **ha** il chip GNSS e ha
la sua SIM, e il problema si vede anche con altre app: quindi non e' ProVela,
ma ProVela ci convive male in due punti. Chiesto da lui, fatte tutte e due.

Il difetto comune: **due stadi dove ne servono tre**. Un fix c'e' o non c'e', e
in mezzo — il fix che c'era mezzo minuto fa — i due moduli facevano scelte
opposte, tutte e due sbagliate. Il cruscotto buttava via tutto a 15 s. La
veglia d'ancora teneva l'ultimo fix per sempre **senza dirlo**.

### 1. Veglia d'ancora: sembrava sveglia ed era cieca
`onErr()` e' vuoto con il commento "mantiene ultimo fix", e ha ragione: un buco
di due secondi non deve far perdere il punto d'ancoraggio. Ma da li' in poi
`cur` non invecchia mai:
- `evalAlarms()` calcola la distanza dal centro sulla **posizione congelata**:
  non cambia piu', quindi `over` resta falso e **l'allarme non puo' suonare**;
- il riquadro in alto a destra scriveva `no fix` **solo se una posizione non era
  mai arrivata**; dopo la prima mostrava per sempre `±8 m`, la precisione di
  quel fix li'. A colpo d'occhio: tutto a posto.

Su un dispositivo che perde il segnale, la veglia resta verde e muta mentre la
barca ara. E' la funzione che si lascia accesa dormendo.

**Correzione.** Tre stadi, con l'eta' del fix in chiaro:

| eta' del fix | stato | suono |
|---|---|---|
| < 30 s | `● IN AREA`, riquadro `±8 m` | no |
| 30 s – 3 min | `◐ GPS VECCHIO` giallo, "ultima posizione N fa · i numeri qui sotto sono fermi a quel momento", riquadro `fermo da N` in rosso | no |
| > 3 min | `⚠ GPS FERMO ⚠` rosso, "la veglia non puo' accorgersi se ari" | **si'** |

Tre minuti perche' a un nodo di deriva sono novanta metri che nessuno ha
guardato. Il suono passa dalla macchina d'allarme che c'era gia', quindi
"Tacita 5 min" funziona anche su questo.

**Grazia di 20 s al ritorno in primo piano.** Con lo schermo spento il browser
sospende la posizione: al risveglio il fix e' vecchio *per forza*. Senza grazia,
ogni volta che riprendi in mano il telefono ti parte la sirena per un dato che
sta arrivando. Il ritorno di `visibilitychange` fa ripartire il conto.

#### Alternative scartate
- **Solo l'avviso a schermo, senza suono.** Non serve a niente proprio nel caso
  per cui esiste la veglia: di notte, con gli occhi chiusi.
- **Suonare gia' a 30 s.** Sul tablet di Sergio suonerebbe tutta la notte: una
  sirena che urla sempre e' una sirena che si spegne, e allora tanto vale niente.
- **Azzerare `cur` quando invecchia** (cioe' far tornare "no fix"). Butta via il
  punto e con lui la distanza dall'ancora, che vecchia vale comunque piu' di un
  trattino: e' l'errore opposto, lo stesso che faceva il cruscotto.

### 2. Cruscotto: tre stadi anche qui
`gpsFresh()` scadeva a 15 s e da li' tutti i campi andavano a trattino. Con un
GPS a singhiozzo il cruscotto e' vuoto quasi sempre, e un trattino dice **meno**
dell'ultimo valore buono con scritto quanto e' vecchio.

Ora: sotto 15 s come prima (`gpsFresh()` non cambia significato, e chi pretende
un fix vero continua a chiederlo — salvare un waypoint lo rifiuta ancora). Fra
15 s e 5 minuti il valore **resta**, con una pastiglia `vecchio 40 s` accanto
all'etichetta, gialla sotto il minuto e rossa sopra. Oltre 5 minuti si tace
davvero: quel dato non descrive piu' dove sei.

La pastiglia **copre** quella della sorgente (`stima`, `man`): fra "vento
stimato" e "questo numero e' fermo da due minuti", la seconda e' quella che
cambia il significato di cio' che stai leggendo. Fuori dall'elenco `pos` e
`sun`, che leggono `raffyca-pos` e puo' averla scritta un altro modulo piu' di
recente; `heel`, che viene dall'accelerometro; `clk`, che e' l'orologio.
La posizione usata per XTE, distanza e rotta al waypoint e' ora **lo stesso
fix** dei numeri sopra, vecchio o no: prima i valori sparivano e la posizione
restava, e non era detto venissero dallo stesso momento.

### Verificato
Su `localhost:8765`, viewport 375x812, invecchiando il fix a mano:
- **Cruscotto**: a 3 s valori e nessuna pastiglia; a 40 s `5.4` e `137` ancora
  li' con pastiglia gialla `vecchio 40 s`; a 2 min gli stessi valori con
  pastiglia rossa; a 6 min trattino, come prima. Waypoint con fix di 2 minuti:
  rifiutato, messaggio invariato. Griglia sempre dentro lo schermo, etichette su
  due righe senza sfondare (la correzione di stamattina regge la pastiglia in
  piu').
- **Veglia d'ancora**: calata l'ancora dal tasto vero, poi fix a 2 s -> `IN
  AREA`; 45 s -> `GPS VECCHIO` giallo, `fermo da 45 s`, nessun suono; 4 min ->
  `GPS FERMO`, allarme acceso, suono partito una volta; dentro i 20 s di grazia
  -> torna a `GPS VECCHIO` e tace; al ritorno del fix torna `IN AREA` da solo.
  L'allarme vero non e' stato toccato: spostato a 442 m dal centro con fix
  fresco, `⚠ ARANDO ⚠ · fuori area: 442 m > 40 m`.
- Sintassi `jsc` pulita su tutti e due. Bump: **`anchor-v13` -> `v14`**
  (`anchor/index.html` sta nel suo precache). `cruscotto/` non sta in nessun
  precache: nessun bump.

### Non verificato
Niente su tablet o telefono veri, e nessun GPS vero: i fix sono simulati
scrivendo `GPS.ts` e `cur.t`. La grazia al ritorno in primo piano e' provata
impostando `graziaFino` a mano, perche' nel pannello di prova `document.hidden`
resta vero e il gestore esce subito: **la strada dell'evento non e' stata
percorsa davvero**. Il suono non e' stato ascoltato (l'AudioContext non e'
armato nel pannello): verificato che la chiamata parta, non che esca rumore.
Le soglie (30 s, 3 min, 5 min) sono scelte a tavolino e vanno riviste dopo una
notte vera all'ancora col tablet.

### Nota sull'ambiente di prova
Il pannello browser **serve dalla cache** l'HTML gia' visto: dopo aver
modificato un file, la prima prova girava ancora sul codice vecchio e sembrava
che la modifica non avesse effetto. Si carica con `?nocache=1` in coda.

---

## 07/09/2026 (3) — Due correzioni alle voci di oggi

Nessuna riga di codice. Servono perche' correggono cose che ho scritto io poche
ore fa in questo stesso file, e chi rilegge deve trovare la smentita accanto
all'affermazione.

### L'allarme suona davvero, e segue lo stato
Nella voce (2) avevo messo fra i "non verificato" che il suono non era stato
ascoltato — verificata la chiamata, non il rumore. **Sergio l'ha sentito**: il
browser di prova gira sul suo Mac e l'AudioContext era stato armato dalla
calata dell'ancora simulata, quindi i beep sono usciti dalle casse per davvero.
E "cambiava", cioe' partiva e si fermava seguendo lo stato: silenzio in area,
silenzio a `GPS VECCHIO`, beep a `GPS FERMO`, silenzio nei 20 s di grazia, beep
di nuovo su `ARANDO`.

Il tono in se' **non** varia ed e' giusto cosi': `beep()` e' un'onda quadra a
880 Hz di 0.36 s ripetuta ogni 900 ms, uguale per qualunque allarme. Quello che
cambia e' se suona o no. La catena `evalAlarms` -> `updateUI` ->
`startAlarmSound`/`stopAlarmSound` e' quindi verificata da un capo all'altro,
compreso il ramo nuovo della cecita'. Resta non ascoltato solo il ritorno del
suono **su telefono**, dove entra in ballo la politica audio del browser mobile.

### Il tablet: quello che ho scritto stamattina non regge piu'
Nella voce (1), sotto "Fuori tema", avevo dato come spiegazione piu' probabile
l'assenza del ricevitore GNSS su un tablet solo-Wi-Fi. **Falso**: il tablet ha
il chip **e** ha la sua SIM. Cade con quella anche la seconda ipotesi, quella
dell'assistenza dalla rete che non arriva, salvo che al largo la SIM resti
davvero senza dati.

Il fatto nuovo e' un altro: **riavviando il tablet il GPS torna a posto per un
po'**, poi degrada di nuovo. Un'antenna schermata non guarisce al riavvio, e
un'impostazione di sistema non si rimette da sola: quindi il difetto e' **stato
software che si deteriora col tempo di accensione**, non hardware e non
configurazione. I sospetti, in ordine:
1. **risparmio energetico** che declassa il browser man mano che resta in
   secondo piano (i "bucket" di Android, le "app in sospensione profonda" di
   Samsung); il riavvio azzera i contatori;
2. **servizio di posizione impiantato** dopo ore di accensione — regge bene il
   fatto che il problema si veda con tutte le app;
3. **dati di assistenza A-GPS vecchi o corrotti** in cache, che il riavvio
   rinfresca.

Prova che li separa, da fare quando degrada: **chiudere forzatamente il browser
e riaprirlo, senza riavviare**. Se basta, e' l'ipotesi 1. Se serve il riavvio
pieno, e' la 2 o la 3, e a quel punto un'app di stato GNSS che azzera i dati di
assistenza distingue le ultime due.

Non e' un difetto di ProVela e non c'e' niente da correggere qui: sta scritto
perche' e' il genere di cosa che fra sei mesi si ricomincia a indagare da capo.
Quello che l'app poteva fare — non far finta di avere una posizione che non ha —
e' la voce (2).

---

## 12/09/2026 — ProVela diventa Dritta

Il nome era in discussione dal 02/09: **ProVela** e' gia' usato nel settore
(Pro-Vela, scuola di foil sul Mar Menor, `pro-vela.com`, `@ProVela`), e in
minuscolo si legge "prove la". Sergio ha deciso: **Dritta**, per assonanza con
**Vetta**, nata nel frattempo per il trekking. Il nome ha due sensi che remano
insieme — il lato di dritta, e "una dritta" nel senso di un consiglio.

### Cosa e' stato toccato

Sostituzione `ProVela` -> `Dritta`, `PROVELA` -> `DRITTA`, `provela` ->
`dritta` su **37 file**: titoli, `aria-label` della barra, manifest PWA,
intestazioni dei moduli, testi visibili, commenti, e i nomi dei file scaricati
(`Dritta-backup-…json`, `Dritta-diario-…pdf`, `Dritta-partenza-…json`,
`dritta-traccia-…gpx`, `dritta-percorso-…gpx`, `dritta-<zona>.gpx`).

Bump dei cinque service worker, tutti con file rinominati dentro il precache:
`dritta-hub-v17` (era `provela-hub-v16`), `raffyca-rt-v22`,
`raffyca-meteo-v17`, `anchor-v15`, `xte-v9`.

### Alternative scartate

**Rinominare anche il prefisso `raffyca-` delle chiavi localStorage.** No: i
dati stanno sui dispositivi degli utenti, non su un server, e una rinomina
senza migrazione li perde. Il prefisso e' gia' il residuo di un nome
precedente (Raffyca / SailingHub) e resta tale: e' un identificatore, non un
marchio, e nessuno lo vede.

**Lasciare il prefisso `provela-hub-` alle cache del service worker dell'hub**,
per non orfanare quelle gia' installate. Scartata perche' il problema si
risolve meglio nell'altro verso: il `VERSION` e' diventato `dritta-hub-v17`, e
il filtro di `activate` ora cancella **entrambi** i prefissi
(`k.indexOf('dritta-hub-')===0||k.indexOf('provela-hub-')===0`). Cosi' la
vecchia `provela-hub-v16` viene rimossa alla prima attivazione invece di
restare per sempre sul dispositivo. Il filtro col vecchio prefisso va tenuto
finche' c'e' il sospetto che qualche dispositivo non si sia ancora aggiornato.

**Riscrivere `SITUAZIONE.md`.** No, e' un registro storico: le voci fino a ieri
parlano di ProVela ed e' giusto che continuino a farlo.

**Rinominare il repository `SMACC8/provela`.** Non fatto, e' una decisione
separata di Sergio. Conseguenze se si procede: il localStorage **sopravvive**
(l'origine resta `smacc8.github.io`), ma cambia il sottopercorso di GitHub
Pages, quindi **le PWA installate e i segnalibri si rompono** e vanno
reinstallate. Per questo restano due `provela` volutamente: `ROOT =
"/home/claude/work/provela"` in `build_perf.py` (un percorso su una macchina
che non e' questa, si aggiorna insieme al repo) e il filtro di cancellazione
cache sopra.

### Il difetto che la rinomina ha introdotto, e come e' stato chiuso

**"dritta" e' gia' una parola dell'interfaccia.** Ricorre ovunque nei testi
nautici dei moduli — "mura a dritta", "accosta a dritta", "boa spostata a
DRITTA", "Scarroccio ° a dritta+" — e da oggi e' anche il marchio. Nei titoli e
nelle intestazioni non c'e' ambiguita' (maiuscola, posizione, spesso in `<b>`).

C'e' invece in **un punto solo**, ed e' in `routing/`: il bottone della polare
integrata diceva `Ripristina ProVela`, che rinominato secco sarebbe diventato
**`Ripristina Dritta`** — su una pagina che poche righe sotto scrive "mura a
dritta". Si legge come un comando di virata. Tolti i tre riferimenti al
marchio, che li' non servivano: il riepilogo dice `integrata`, il bottone
`Ripristina la polare integrata`, il toast `Polare integrata ripristinata`.
E' l'unica modifica di questo intervento che non sia una sostituzione
meccanica, ed e' banale da annullare se Sergio la preferisce com'era.

Corretto anche un accordo di genere: ProVela era trattato al maschile in
`anchor/` ("Tieni ProVela **aperto** in pozzetto") — ora "aperta". Gli altri
usi erano gia' femminili ("ProVela aggiornata", "Polare ProVela ripristinata").

`percorso/` esporta estensioni GPX in un namespace proprio: prefisso `pv` e URI
`http://provela.app/gpx/1`, diventati `dr` e `http://dritta.app/gpx/1`. Si puo'
cambiare senza rischio perche' il lettore GPX dello stesso modulo legge solo
`lat`/`lon`/`name` e **non** guarda le estensioni: un file esportato ieri si
rilegge oggi.

### Un link di ritorno di troppo, che la rinomina ha fatto notare

Sergio ha guardato Traversata e ha visto tre volte la stessa cosa in tre righe:
la vela della `rf-topbar`, poi un link `‹ Dritta` in verde, poi l'occhiello
`DRITTA · TRAVERSATA` in grigio. Il link inline c'era da sempre (diceva
`‹ ProVela`), ma con un nome lungo e inconfondibile la ripetizione passava
inosservata; con una parola corta salta all'occhio.

**Rimosso.** La vela della topbar e' gia' l'uscita dal modulo — `href="../"`,
`aria-label="Menu Dritta"` — ed e' inline in ogni pagina proprio perche' non
deve dipendere da nulla; l'occhiello dice gia' dove sei. Al suo posto un
commento che spiega perche' li' non c'e' niente, altrimenti fra sei mesi
qualcuno lo rimette.

Controllato che fosse un caso isolato prima di toccarlo: gli altri `‹` della
suite (`‹ Aree` in `meteo/`, `‹ Hub` in `index.html`, `‹ archivio` in
`partenza/`) tornano a una **vista precedente dentro lo stesso modulo**, non
alla home, e restano dove sono. Traversata era l'unica pagina con un secondo
link verso `../` oltre alla vela.

Nessun bump aggiuntivo: `raffyca-rt-v22` non era ancora stato pushato, quindi la
modifica viaggia con quello.

### Le pagine info, controllate una per una

Sergio ha chiesto di guardare le pagine "info", **meteo in particolare**: sono
il posto dove il nome dell'app e' piu' concentrato, e dove una rinomina
meccanica lascia i residui piu' facilmente.

Sono due sole in tutta la suite. **`meteo/presentazione.html`** (il bottone
`ⓘ Info` di `meteo/`): tre occorrenze, tutte corrette — `Dritta Meteo` nel
titolo grande, e due nel corpo ("Dritta non nasconde quel disaccordo",
"Dritta te lo dice invece di scegliere per te"). Riaperta e riletta a 375px:
`Dritta Meteo` sta su una riga, niente va a capo male. **`impostazioni/`**,
sezioni Guida e Info: la Guida non nomina mai l'app, la descrive e basta
("Una cassetta degli attrezzi per navigare a vela", "Suite modulare pensata per
il telefono"), quindi non aveva niente da rinominare; l'unico nome e' `Suite:
Dritta` nella scheda Info. **Zero residui.**

Due cose trovate mentre guardavo, **nessuna delle due causata dalla rinomina**:

1. **`meteo/manifest.json` dichiarava una copertura sbagliata**: "Meteo tattico
   per la vela in **Alto Adriatico**", mentre `SPOTS_BY_ZONE` nello stesso
   modulo ha **9 zone** (Alto/Medio/Basso Adriatico, Ionio, Basso/Alto
   Tirreno, Ligure, Sardegna, Sicilia) e il `<meta name="description">` di
   `meteo/index.html` diceva gia' "in **Italia**". E' il testo che si vede
   installando la PWA. Allineato alla `<meta>`: e' una parola, si annulla in un
   attimo se Sergio la rivuole com'era. Nessun bump in piu': `manifest.json`
   sta nel precache di `raffyca-meteo-v17`, non ancora pushato.

2. **`SviluPPAta da Sergio Moro`**, nel piede della pagina info del meteo. Le
   maiuscole in mezzo alla parola sono li' dal commit di import del 31/08
   (`Import ProVela dallo snapshot ProVela-20260828-1140`), immutate: non e'
   un effetto della rinomina. L'avevo lasciata com'e' non sapendo se fosse
   voluta; **lo e'**. Sergio: e' il suo slogan, **`PPA` al contrario si legge
   `APP`**. Non si tocca, e soprattutto non si "corregge" in `sviluppata` al
   prossimo passaggio: da fuori sembra un tasto maiuscolo rimasto premuto.
   Sopravvive alla rinomina senza modifiche perche' non contiene il nome
   dell'app.

   Cercandolo per bene, pero', **stava in tre posti scritto in due modi
   diversi**, ed e' il motivo per cui l'avevo preso per un refuso: l'ho
   incontrato prima nella versione muta. Nell'hub (`index.html`, piede) era
   gia' `Svilup<b>PPA</b>ta`, e `footer b{color:var(--teal)}` dipinge il PPA
   con l'accento: il gioco si vede. Nei due di `meteo/` era testo nudo dentro
   uno stile `.credit` monospaziato, spaziato e smorzato — le condizioni
   esatte in cui tre maiuscole in mezzo a una parola si leggono come un tasto
   rimasto premuto. Il quarto credito, in `partenza/`, non era nemmeno lo
   slogan: diceva "sviluppo **Sergio Moro**", col grassetto sul nome.

   **Allineati tutti e quattro** su richiesta di Sergio, compreso `partenza/`
   (il `<b>` li' si sposta da "Sergio Moro" a "PPA"): stessa frase, stesso
   markup, accento sul PPA. Il colore non e' stato messo a mano dappertutto —
   `partenza/` ridefinisce gia' `--teal` nei tre temi e ha `.foot b`, quindi
   bastava spostare il grassetto; `meteo/presentazione.html` e' sempre scura e
   ha il token, una regola sola. **`meteo/index.html` e' il caso scomodo**:
   quel file **non ridefinisce i token** (lo dice un suo commento) e tinge a
   mano tema per tema, quindi ci sono voluti tre colori letterali presi dal
   file stesso — `#2BD9C4` scuro, `#067d70` giorno (lo stesso di
   `html.day .rf-topbar .rf-status.wp b`), `#ff6b6b` notte (quello di
   `html.night .eyebrow`).

   Difetto scoperto **facendo** questa modifica: in tema notte `.credit` non
   aveva override, quindi restava grigio-azzurro mentre tutto il resto va sul
   rosso. Prima non si notava; con un PPA rosso acceso dentro una riga
   grigio-azzurra si notava eccome. Aggiunta `html.night .credit{color:#a85050;}`,
   il grigio della famiglia notte gia' usato per il testo smorzato.

   Nessun bump in piu': `meteo/index.html` sta nel precache di
   `raffyca-meteo-v17`, non ancora pushato; `partenza/` non e' precacheata da
   nessun service worker e `presentazione.html` nemmeno.

### Verificato

- **Sintassi**: `checkSyntax` su tutti gli 8 `.js` toccati e sui **46 blocchi
  `<script>` inline** dei 22 `.html` modificati — zero errori. I quattro
  manifest riparsati come JSON.
- **Caricamento**: tutti i **18 moduli** aperti in iframe dal server locale,
  nessun errore non catturato, titolo corretto ovunque. (`xte/` resta
  "XTE Guide": e' upstream non reskinnato, non aveva "ProVela" nel titolo.)
- **Backup, che era il punto piu' a rischio** perche' scrive `app:'ProVela'`
  nel file: un backup **vecchio**, marcato `ProVela`, viene ancora importato
  (2 chiavi su 2). Regge perche' `importFile` non guarda `app`, filtra le
  chiavi `raffyca-`. Export: `Dritta-backup-20260912-0336.json`. Rifiuto di un
  file senza chiavi: "nessuna chiave Dritta nel file".
- **GPX di `percorso/`**: generato e riparsato; `getElementsByTagNameNS`
  sull'URI nuovo trova `dr:sog` col valore giusto, quindi il prefisso e'
  dichiarato bene.
- **GPX e diario di `routing/`**: `buildGPX()` parsa, `creator="Dritta"`,
  `<metadata><name>Dritta — traversata Alto Adriatico`; `diarioName()` da
  `Dritta-diario-20260912-0337.csv|.pdf`.
- **Il bottone della polare** premuto davvero: riepilogo, etichetta e toast
  cambiano come previsto.
- **Traversata dopo la rimozione del link**: la pagina riapre, il primo
  elemento di `.wrap` e' l'occhiello, e resta **un solo** link verso `../` in
  tutto il documento, quello della vela. Nessuna regola CSS e nessun
  `querySelector` dipendeva da quell'`<a>` (cercati `.wrap a`, `first-child` e
  simili: zero occorrenze).
- **Lo slogan nei quattro piedi**, riletto dal DOM invece che dal sorgente:
  markup identico ovunque (`Svilup<b>PPA</b>ta da Sergio Moro`), e il PPA
  prende l'accento giusto **nei tre temi** — meteo `#2BD9C4` / `#067d70` /
  `#ff6b6b`, partenza `#2BD9C4` / `#067d70` / `#ff4d4d` via `--teal`,
  presentazione `#2BD9C4`. Controllato con `getComputedStyle` commutando
  `html.day` / `html.night`, non a occhio.

### Non verificato

- **La cache offline**, come sempre da qui: il pannello browser rifiuta di
  registrare i service worker. Che `dritta-hub-v17` si installi e che cancelli
  davvero la vecchia `provela-hub-v16` si vede solo su un dispositivo vero,
  aprendo l'hub due volte.
- **Il nome della PWA gia' installata**: cambia il `manifest`, ma quando il
  sistema aggiorni l'icona e l'etichetta sulla schermata iniziale lo decide il
  sistema operativo, non noi.
- **`performance/` e `partenza/`** sono build React: il titolo e la barra sono
  rinominati nel wrapper, il bundle dentro non e' stato letto. `build_perf.py`
  e' allineato (il titolo li', la topbar la ritaglia da `cruscotto/`), ma non
  e' stato rieseguito.

---

## 17/09/2026 — Una carta propria sulla mappa, e lo Studio virate arriva da Vetta

`carta/index.html`, `percorso/index.html`. **Nessun bump di service worker**, e
il motivo va scritto perche' contraddice la lettura ingenua della regola:
`carta/` e `percorso/` **non hanno un `sw.js` proprio** (gli unici cinque sono
`sw.js`, `anchor/`, `meteo/`, `routing/`, `xte/`), e non compaiono in nessun
precache — quello dell'hub elenca `manutenzione/`, `calcoli/`, `sole-luna/`,
`mob/`, `prontuario/`; quello di `routing/` solo i tre `rf-*.js`, la sua mappa,
il suo geojson e Leaflet da cdnjs. Le navigazioni sono network-first con
`cache:'reload'`, quindi la pagina nuova arriva fresca.

Lavorato su un worktree separato (`../ProVela-raster-virate`, branch
`raster-e-virate`) per non toccare `main` mentre era aperto GitHub Desktop.

### 1. Carta raster georeferenziata (`carta/`)

Nuovo strumento in toolbar accanto ai sei esistenti. Si carica un'immagine
propria (scansione, ritaglio di portolano, screenshot di plotter), si piazzano
punti di coordinate note col mirino, e l'immagine finisce sulla mappa
deformata al punto giusto. Primo overlay non-tile del repo: `ImageOverlay` non
compariva da nessuna parte.

Warp proiettivo con **`transform: matrix3d`** su un `<img>` in un pane proprio
a z-index 160, fra le basi (150) e il `tilePane` (200) dove stanno i simboli
OpenSeaMap — cosi' il raster copre la base ma i simboli nautici gli restano
sopra. La trasformazione si calcola **una volta sola in spazio Mercatore a
zoom 0**: e' costante, e il passaggio al pixel corrente e' scala piu'
traslazione, che composta con l'omografia resta un'omografia. Zero librerie.

Immagine in **IndexedDB** (`dritta-raster`), calibrazione in **localStorage**
(`raffyca-rasters`, 227 byte per carta). Separate di proposito: `rfBackup`
copia tutte le chiavi `raffyca-*` e ne tiene cinque snapshot, quindi un raster
in localStorage ci finirebbe moltiplicato per cinque. Conseguenza dichiarata
nella UI: **il backup salva i punti, non il file**. Su un altro dispositivo le
carte ci sono, le immagini vanno ricaricate — ma senza ripiazzare i punti.

### 2. Studio virate (`percorso/`, scheda Analisi)

Porting di `SpeedEvents.kt` di **Vetta desktop** ("Studio velocita'"). Non era
iniettabile: e' Kotlin/Compose, 145 righe di logica piu' 362 di UI. La logica
si e' tradotta quasi 1:1 — dipendeva solo da `distanceM`/`bearingDeg`, che qui
sono `hav`/`brg`. Porta due misure che Dritta non aveva da nessuna parte:
**metri persi per manovra** e **secondi di recupero**.

Gira solo sulle **sessioni regata** (`raffyca-race-log`), che hanno
`{t,lat,lon,cog,sog,twd,tws}` per punto. Le tracce normali restano fuori:
`rfRec.ferma()` fa `pts.map(p => [p[0], p[1]])` e **butta il timestamp**, e non
e' migrabile perche' il dato non esiste piu'.

### Alternative scartate

**Il modello dedotto dal numero di punti** (2 = similitudine, 3 = affine, 4 =
proiettiva). Era la prima idea ed era sbagliata proprio sul caso piu' comune.
Sergio ha portato un raster vero: screenshot di **qtVlm** della laguna veneta,
16,0 x 21,3 NM, con cinque WP di coordinate note ai quattro angoli e al
centro. Quattro punti su un'omografia sono otto equazioni per otto incognite:
residuo **zero per costruzione**. Misurato con errore di puntamento di +/-2 px
su 400 giri: la proiettiva dichiara **RMS 0,0 m** e sbaglia davvero **23,3 m**
al centro; la similitudine dichiara 22,6 m e sbaglia **16,0 m**. Il modello
piu' ricco mente sulla propria accuratezza ed e' peggiore del 46%. Ora il
modello **si sceglie** (similitudine predefinita) e i punti in piu' vanno ai
minimi quadrati.

**Distinguere Mercatore da equirettangolare.** Preoccupazione stimata a occhio
in ~40 m, **misurata in 16 m** sulle coordinate reali: sotto il rumore di
puntamento. Nessuna macchina, si lavora in Mercatore. Vale come promemoria che
a occhio si sbaglia di piu' del doppio.

**GeoTIFF e KAP/BSB.** geotiff.js sono ~200 KB da CDN contro l'offline-first, e
il KAP ha il payload RLE compresso ed e' diffuso solo in OpenCPN.

**I soli due angoli NO/SE** (`L.imageOverlay` nativo, ~30 righe): una scansione
storta di due gradi resterebbe storta senza modo di correggerla.

**Le costanti di Vetta copiate tali e quali.** Presuppongono il GPS Android a
1 Hz; `recSample()` campiona a `raceInterval`, minimo e predefinito **5 s**.
Una finestra di smoothing fissa a 3 s starebbe sotto l'intervallo fra due
punti e non farebbe nulla. Le finestre si derivano dal `dt` mediano misurato.

**Scendere sotto i 5 s di campionamento** per avere misure piu' fini. No, coi
numeri: a 1 s una regata di 2 h fa ~7200 punti, ~570 KB, e per sei sessioni
tenute sono 3,4 MB su una quota localStorage di ~5 MB. A 5 s sono ~115 KB a
sessione.

**Il `cog` del GPS per le rotte prima/dopo.** In `raffyca-race-log` e' `null`
ogni volta che il GPS non lo dava. Si misura dalle posizioni, come fa Vetta.

### Validazione

**Virate — dodici test in JS, eseguiti con `jsc` sul codice estratto dal file
vero, non da una bozza.** I quattro casi di `SpeedEventsTest.kt` di Vetta
portati (una virata misurata, cinque di fila senza sovrapposizioni, velocita'
costante senza eventi, soglia al 60% che non passa) piu' otto nuovi, fra cui i
due di regressione sul difetto qui sotto. Tutti verdi.

### Il difetto che i test non vedevano, e come e' saltato fuori

Serviva una regata finta per far provare la scheda a Sergio, e l'ho fatta con
**manovre di qualita' diversa** invece che tutte uguali — dieci manovre con
cali dal 22% al 52%, sei virate, due strambate, un'abbattuta alla boa e
un'onda senza cambio di mura. Su quella, la scheda ne trovava **otto su
dieci**. I dodici test erano tutti verdi lo stesso.

Causa: **la finestra d'ingresso finiva dentro il calo**. Il punto che
l'algoritmo esamina e' il minimo di velocita', cioe' 6-10 s dopo l'inizio
della manovra; con il bordo vicino a −5 s, la finestra da cui si ricava la
velocita' "di prima" era gia' in decelerazione. Misurato sul caso perso: il
riferimento scendeva da 3,09 a 2,83 m/s, il calo letto si restringeva sotto il
20% e la manovra spariva. **A 1 Hz non si vede**, perche' la finestra ha
tredici campioni e uno sporco si diluisce; a 5 s i campioni sono tre e uno
sporco vale un terzo.

Correzione: il bordo vicino arretra col campionamento, `entryFrom =
max(15 s, 6·dt)` e `entryTo = max(3 s, 3·dt)`. A 1 Hz da' −15..−3, cioe'
esattamente i valori di Vetta; a 5 s da' −30..−15. Dopo: **dieci su dieci**.

**E la mia tabella di degrado era fuorviante.** L'avevo costruita con sei
virate tutte da 40% e concludeva "regge fino a 15 s, muore a 20 s". Vero per un
calo del 40%; falso in generale. Rimisurato con cali diversi:

| dt | prima | dopo la correzione |
|---|---|---|
| 5 s | 8/10 | **10/10** |
| 10 s | 6/10 | **8/10** |
| 15 s | 3/10 | 4/10 |
| 25 s | 1/10 | 3/10 |

Quindi il rifiuto e' sceso da 15 s a **10 s**: a 15 s ne troverebbe meno della
meta' *senza dirlo*, e la riga delle medie diventerebbe falsa sembrando
completa. Dato mancante che sembra completo e' il tipo peggiore.

Quel che regge a ogni campionamento: **l'ordine**. Sui dieci cali veri
30/52/34/45/28/41... l'ordinamento misurato coincide con quello vero
(scarto 0 posizioni nel test di regressione). La manovra che la scheda indica
come peggiore e' davvero la peggiore, ed e' quello che serve a bordo. Il
valore assoluto del calo e' sempre un po' sottostimato, e la scheda lo dice.

Lezione generale, e vale oltre questo modulo: **i casi di prova tutti uguali
non provano niente**. Dodici test verdi e un difetto che si vedeva al primo
dato realistico.

Prova nel browser: `prova-bolina.html` in radice semina una regata finta
nell'origine di prova (pagina di servizio, non collegata da nessuna parte; il
suo bottone di pulizia tocca **solo** le sessioni "Regata di prova", niente
`localStorage.clear()`, cosi' non puo' fare danni se un giorno finisse
online). Su quella: **dieci manovre su dieci**, agli istanti esatti, e tutte e
tre le etichette giuste — sei "virata", due "strambata", l'onda senza cambio
di mura "rallentamento", e l'abbattuta alla boa "manovra", che e' la risposta
esatta perche' TWA +45 -> −150 non e' ne' una virata ne' una strambata.
Nessun errore in console.

**Raster — contro una verita' nota per costruzione.** Generato un reticolato in
Mercatore 1600x1518 px su un riquadro noto, calibrato con **due soli punti**, e
misurati **tutti e 35 gli incroci**: errore **0,000 m**. Poi, sulla mappa, la
trasformazione confrontata con `latLngToLayerPoint` di Leaflet su un incrocio
non usato per tarare, da zoom 8 a 16: scarto **sotto 0,12 px** di schermo
(l'arrotondamento intero di `getPixelOrigin`). Mirino della calibrazione
verificato a **6 m** dall'incrocio, cioe' 0,17 px di schermo. Ricaricata la
pagina: la carta torna da IndexedDB, e in localStorage ci sono 227 byte di
calibrazione e nessuna immagine — il limite dichiarato e' davvero quello.

Le coordinate d'ingresso sono state validate prima di scrivere codice: qtVlm
dava anche rotta e distanza dei cinque WP da un punto comune, informazione
**ridondante** rispetto alle coordinate. Risolvendo per quel punto, tutti e
cinque i rilevamenti tornano a **0,01°** e le distanze a 0,05 NM. Costa nulla
ed esclude in partenza la causa piu' stupida.

### Non verificato

- **Niente e' stato provato su un raster vero**: il file qtVlm originale non e'
  recuperabile, e le prove sono su immagine sintetica. Restano da fare le due
  prove sul campo: il punto centrale tenuto fuori dalla taratura, e i fari di
  `carta/fari.geojson` — fonte indipendente sia dall'immagine sia dai WP — che
  devono cadere sui fari disegnati nelle tre bocche di porto.
- **Niente e' stato provato su un telefono**, e lo zoom della calibrazione e'
  proprio la parte che si giudica col dito. Sul raster di Sergio la scala e'
  ~21 m/px (misurata, non stimata): senza zoom un telefono da 380 px mostra
  ~110 m per pixel di schermo, quindi lo zoom fino a 2:1 e il mirino fisso non
  sono comodita', sono il 90% dell'accuratezza.
- **L'offline non e' stato provato**: il pannello browser blocca la
  registrazione dei service worker (nota del 04/09). Il raster pero' vive in
  IndexedDB e non passa dal SW, quindi in teoria e' il pezzo piu' offline di
  tutta la suite.
- Lo Studio virate non e' mai girato su una regata vera, solo su sessioni
  sintetiche.

### Aperti

- Le tracce normali (`raffyca-tracks`) restano fuori dallo Studio virate finche'
  `rfRec.ferma()` butta i timestamp. Sbloccarle e' una riga piu' il bump di
  `raffyca-rt-v22` (`rf-topbar.js` e' precacheato da `routing/sw.js`), ma le
  tracce gia' salvate restano mute per sempre: il dato non c'e' piu'.
- L'import GPX di `carta/` fa `pts.push([lat,lon,0])` e butta il `<time>`:
  tracce da altri plotter, o da Vetta stessa, oggi non sono analizzabili.
- **Difetto trovato di passaggio e NON corretto qui**: il `fetch` dell'hub per
  le non-navigazioni fa `caches.match(req) || fetch(req)` **senza `put`** —
  non c'e' cache runtime. Quindi `carta/fari.geojson` non finisce mai in cache
  dall'hub, nonostante il commento in `carta/index.html` dica il contrario. Il
  commento e' falso e chi legge il codice non se ne accorge.

---

## 17/09/2026 (2) — Il mirino al centro non arrivava agli angoli

`carta/index.html`, `percorso/index.html`. Nessun bump di service worker (vedi
la voce precedente per il perche'). Tre difetti segnalati da Sergio alla prima
prova vera, e il secondo e' di progetto, non di rifinitura.

### Il mirino fisso al centro escludeva il caso d'uso

La calibrazione teneva il mirino **fisso al centro** del riquadro e lo si
portava sul punto **scorrendo l'immagine**. Sembrava preciso. E' inservibile,
per un motivo che si vede solo provando: scorrendo, il bordo dell'immagine
arriva al massimo al bordo del contenitore e **mai al centro**, quindi tutti i
punti vicini agli angoli erano **irraggiungibili**. Sergio calibra mettendo
quattro WP **ai quattro angoli** — cioe' esattamente i punti che il mio
meccanismo non sapeva puntare. E piu' i punti sono distanti fra loro, meglio e'
condizionata la taratura: gli angoli non sono una scelta qualsiasi, sono la
scelta giusta.

Va detto come me ne sono accorto, perche' e' la parte istruttiva: **non me ne
sono accorto**. Avevo verificato la matematica misurando un punto al centro
dell'immagine (0,000 m su 35 incroci, 0,12 px su sei livelli di zoom) e mi ero
fermato li'. La matematica era giusta e l'interazione era rotta: due cose
diverse, e la prima non dice niente sulla seconda.

Ora il mirino **si posa dove si tocca**, scorre con l'immagine, e quattro
frecce lo spostano di un pixel immagine alla volta per l'ultimo aggiustamento.
I punti gia' messi si vedono come pallini numerati sulla carta. Verificato
cliccando i quattro incroci piu' esterni: tutti raggiunti.

E si e' potuto misurare **quanto serve lo zoom**, che finora era un argomento e
non un numero: gli stessi cinque punti, messi a carta intera, danno RMS 22 m;
rimessi a 2:1, RMS 0 m. A carta intera un pixel di schermo vale 4,7 pixel di
carta, e non c'e' modo di fare meglio di cosi'.

### Il riquadro si lasciava schiacciare

`.rwrap` e' un figlio flex di `.sheet`, che e' `display:flex; flex-direction:
column`. Senza `flex:0 0 auto` si restringe man mano che la lista dei punti
cresce: con cinque punti il riquadro dell'immagine era una striscia di **40 px**
invece di 374. Non si vedeva con due punti, cioe' non si vedeva finche' non si
usava sul serio.

Sintomo riferito da Sergio come «mi e' scomparso il cursore orizzontale»: non
era la barra di scorrimento, era il riquadro collassato. La diagnosi dal
sintomo era sbagliata, quella dalla misura no.

### Il grafico delle virate cresceva da solo

`#svPlot` aveva `viewBox="0 0 400 250"` con `width:100%`: su schermo largo lo
SVG si ingrandiva **tutto insieme**, testo e spessori compresi, mentre
l'interfaccia intorno restava ferma. A 640 px erano 1,6x: un carattere da 9
diventava 14,4 accanto a `.hint` da 11.

Ora il `viewBox` si misura dai pixel veri del riquadro a ogni disegno, con
altezza fissa a 190 px, e si ridisegna su `resize`. Verificato a 375 e a 900
px di larghezza: testo reso a **10 px** in entrambi i casi, contro gli 11 px
del testo intorno.

### Alternative scartate

**Tenere il mirino al centro e aggiungere un margine attorno all'immagine**
grande quanto meta' riquadro, cosi' che scorrendo si possa portare al centro
anche un angolo. Funzionerebbe, ma resta il lavoro da orologiaio di centrare a
mano due barre di scorrimento per ogni punto, che era l'altra meta' della
critica di Sergio.

**Pinch per lo zoom** invece dello slider: il `meta viewport` non ha
`user-scalable=no`, quindi il pinch lo intercetta il browser e ingrandisce la
pagina intera. Servirebbe disabilitarlo per tutto il modulo, che e' un prezzo
alto per un pannello solo.

**Rendere modificabile un punto gia' messo.** Oggi si cancella col × e si
rifa'. Con i residui per punto in elenco si sa quale rifare, quindi il giro e'
breve. Resta un'asperita', non un difetto.

**Etichetta della scala come rapporto** (`2x`, `1:0.5`): ambigua, perche' `2x`
li' voleva dire *ridotto* di due volte. Ora si mostra solo **metri per pixel di
schermo**, che e' il numero che dice quanto puoi sbagliare puntando, e non ha
bisogno di spiegazioni.

### Non verificato

- Sempre niente su un raster vero e niente su un telefono vero. Il tocco e'
  stato simulato con eventi `click` sintetici: un dito ha un'area, un mouse no,
  e le quattro frecce esistono proprio per quello.
- Lo scorrimento dentro il riquadro non e' stato provato con un dito: sul
  desktop le barre ci sono, su iOS sono a scomparsa.

---

## 17/09/2026 (3) — Le carte raster sugli altri dispositivi, e un messaggio che mentiva

`carta/index.html`, `CLAUDE.md`. Nessun bump di service worker.

Sergio, prima di fare la prova sul raster vero: «l'allineamento devo ripeterlo
per tutti i device? Supabase non puo' aiutare?». Domanda giusta al momento
giusto, e ha scoperchiato un difetto mio.

### Il messaggio prometteva una cosa che il codice non faceva

Quando l'immagine di una carta non c'era sul dispositivo, l'avviso diceva:
«ricaricalo con ＋ Carta e **i punti restano**». Falso. Il gestore di
`fileRaster` creava **sempre** una carta nuova, con `id:'r'+Date.now()` e
`pts:[]`. I punti non restavano: la calibrazione arrivata col backup era
inutilizzabile per sempre, e l'utente avrebbe riallineato tutto da zero
credendo di aver sbagliato qualcosa.

Difetto silenzioso del tipo peggiore: non si vede rileggendo il codice, perche'
il codice fa una cosa coerente — e' il **testo** che dice un'altra. Si vede
solo provando il giro completo su due dispositivi, che non avevo fatto.

Corretto: se la carta scelta ha punti ma non l'immagine, `＋ Carta` **chiede**
se riagganciare il file a quella carta tenendo i suoi punti. Se le dimensioni
dell'immagine sono diverse da quelle registrate, avverte e riscala i punti in
proporzione — con il distinguo esplicito che se e' un'inquadratura diversa
sono da rifare, non da riscalare.

### Supabase: stesso progetto, stesso bucket

Sergio ne ha uno solo e non puo' aprirne altri. Non serve: le carte vanno in
`boat-docs/<boat_id>/carte/<id>.jpg`, cioe' **il bucket che manutenzione usa
gia'**. La policy pretende l'id della barca come primo segmento del percorso, e
quel percorso la rispetta, quindi **nessuno SQL da lanciare, nessuna policy da
aggiungere, niente da toccare nella console**. Stesse intestazioni di
`manutenzione/` (`apikey` + `Bearer`, sessione se c'e' altrimenti chiave anon),
stesso limite di 10 MB per file.

Il giro completo: al caricamento l'immagine va in IndexedDB **e** sul bucket,
e la calibrazione segna `sb:true`; su un dispositivo che ha la calibrazione ma
non il file, `rsAttiva` la scarica e la **copia in IndexedDB**. Il cloud
distribuisce, non sostituisce: senza copia locale, alla prima cala senza campo
la carta sparirebbe.

E si incastra col backup meglio del previsto: `raffyca-supabase` e'
una chiave `raffyca-*`, quindi la configurazione viaggia gia' nel backup. Su un
dispositivo nuovo si importa il backup e arrivano configurazione e
calibrazione; l'immagine si scarica da sola. Zero passaggi manuali.

### Alternative scartate

**Mettere le immagini dentro il file di backup**, in base64. Funzionerebbe
senza account ne' chiavi ne' rete, che e' molto in linea con questo progetto.
Scartata perche' il backup diventa ingestibile: una carta da 3 MB fa ~4 MB di
JSON, tre carte fanno un backup da 12 MB da passare a mano fra dispositivi. E
`rfBackup` ne tiene **cinque** snapshot in IndexedDB.

**Un progetto o un bucket Supabase dedicato.** Inutile: la policy esistente
accetta gia' il percorso, e un bucket in piu' vuol dire una policy in piu' da
scrivere e tenere allineata.

**Solo correggere il riaggancio, senza cloud.** Era la strada minima e onesta,
ma lascia addosso il lavoro di ritrovare e ricaricare il file su ogni
dispositivo. Scartata perche' Sergio ha chiesto esplicitamente la sincronia.

**Far fallire il caricamento se il cloud non risponde.** No: la carta deve
funzionare su questo dispositivo comunque. L'invio e' un'aggiunta, e se non va
lo dice nella riga di stato senza fermare niente (`sb:false`, e si ritenta al
prossimo caricamento).

### Validazione

**Riaggancio, provato per davvero.** Simulato un dispositivo nuovo: carta con
3 punti in `raffyca-rasters`, immagine cancellata da IndexedDB. Ricaricato lo
stesso file: **stesso id, 3 punti conservati, una sola carta in elenco** (non
due), immagine e layer sulla mappa. Prima della correzione lo stesso giro
produceva una carta nuova vuota.

**Supabase, provato con `fetch` finto** — non con il progetto vero di Sergio,
che non va toccato senza che guardi. Verificato: la POST va a
`/storage/v1/object/boat-docs/barca-7/carte/rX.jpg` con `apikey`,
`Authorization: Bearer` e `x-upsert:true`; la calibrazione segna `sb:true` e la
barra mostra la nuvoletta; cancellata l'immagine locale, la GET riporta il
blob, che finisce **in IndexedDB** e sulla mappa.

Nota metodologica: al primo giro lo scarico sembrava fallito. Non era il
codice, era il mio codice di prova che leggeva `RS.url` prima che la catena
`fetch -> blob -> IndexedDB -> layer` finisse. Rifatto con un registro degli
eventi invece di un `setTimeout`, ed era a posto. Vale la pena scriverlo: una
corsa nel banco di prova sembra identica a un difetto nel codice.

### Non verificato

- **Niente e' stato provato contro il Supabase vero.** Le chiamate sono
  simulate: la forma dell'URL e delle intestazioni e' copiata da
  `manutenzione/`, ma che la policy accetti davvero quel percorso lo dira' solo
  il primo caricamento vero.
- **Il giro su due dispositivi non e' stato fatto.** Il "dispositivo nuovo" e'
  stato simulato cancellando IndexedDB nella stessa scheda.
- Il limite di 10 MB non e' stato toccato: non e' stata provata una carta che
  lo supera, quindi il messaggio d'errore relativo non e' mai apparso.
- Se la stessa carta viene ricalibrata su due dispositivi, vince l'ultimo che
  esporta il backup. Non c'e' fusione e non e' stata cercata.

---

## 17/09/2026 (4) — «Nessuna carta»: su Supabase viaggiava solo mezza cosa

`carta/index.html`. Nessun bump di service worker.

Sergio ha georeferenziato la carta sul Mac ed e' andato a vedere sul telefono:
tendina vuota, «Nessuna carta». Non era un difetto di trasporto: era che ne
avevo sincronizzato **meta'**.

### Il buco

Su Supabase andava solo l'**immagine**. La **calibrazione** — i punti, il
modello, le dimensioni — restava in `raffyca-rasters`, cioe' viaggiava solo
dentro il file di backup. Quindi sull'altro dispositivo non c'era niente da
scaricare: senza la calibrazione la carta non compare nemmeno in elenco, e
l'immagine sul bucket non serve a nessuno perche' non si sa che esiste.

Il giro che avevo verificato era «immagine su, immagine giu'». Il giro che fa
l'utente e' «calibro qui, apro la' e la trovo». Sono due cose diverse, e la
prima non dice niente sulla seconda. **Secondo caso in giornata dello stesso
errore**: il primo era la matematica giusta con l'interazione rotta (mirino al
centro, voce (2)), questo e' il trasporto giusto con il percorso dell'utente
interrotto. La lezione da tenere: verificare il **viaggio dell'utente**, non il
pezzo che ho appena scritto.

### La correzione

Un `index.json` nello **stesso bucket, stesso prefisso**:
`<boat_id>/carte/index.json`, con dentro la calibrazione di tutte le carte.
Poche centinaia di byte per carta. Ancora nessuna tabella, nessuno SQL,
nessuna policy nuova — il prefisso e' quello che la policy accetta gia'.

All'apertura dello strumento Raster si scarica l'indice, si **fonde** con
quello locale carta per carta (vince il `mts` piu' recente) e poi si carica la
carta scelta, che a sua volta si scarica l'immagine se manca. Quindi due sole
richieste per arrivare da zero a carta sulla mappa.

L'invio dell'indice e' **ritardato di 2 s e accorpato**: la trasparenza si
muove a slider e senza il ritardo manderebbe una richiesta per pixel di
trascinamento.

Sul cloud non si manda `H` (la matrice): si ricalcola in un istante, e
mandarla vuol dire poterla avere vecchia.

### Alternative scartate

**Una tabella Supabase per le calibrazioni**, con le righe per carta. Piu'
ordinata sulla carta, ma vuole uno schema, una policy RLS e una migrazione, e
in cambio non da' niente: le calibrazioni si leggono e si scrivono tutte
insieme, mai per campo. Un oggetto JSON e' la forma giusta del dato.

**Un file per carta** (`<id>.json`) invece di un indice unico: costringe a
elencare il bucket per sapere cosa c'e', e l'elenco e' un'altra chiamata con
un'altra policy da verificare. Con l'indice unico basta una GET.

**Fusione vera dei punti** fra due dispositivi che hanno ricalibrato la stessa
carta. Scartata: non e' un caso reale, e una fusione sbagliata di punti di
controllo produce una calibrazione plausibile e falsa, che e' il difetto
peggiore possibile qui. Vince l'ultimo che ha modificato, e si vede dal
residuo se qualcosa non torna.

**Sincronizzare anche senza `boat_id`**, mettendo le carte in un percorso
neutro. No: la policy pretende l'id della barca come primo segmento, e
aggirarla vorrebbe dire scrivere una policy nuova per un secondo percorso.
Meglio dire all'utente di aprire Manutenzione una volta.

### Validazione

**Giro completo A -> B, con un bucket finto in memoria.** Dispositivo A:
calibra, e finiscono sul bucket `barca-7/carte/rMAC.jpg` **e**
`barca-7/carte/index.json`. Dispositivo B azzerato (0 carte, `raffyca-rasters`
assente, IndexedDB vuoto): apre lo strumento e si ritrova la carta «Laguna» in
tendina con i suoi **2 punti e il modello giusto**, immagine scaricata,
**copiata in IndexedDB** e disegnata sulla mappa. Due richieste in tutto
(`GET index.json`, `GET rMAC.jpg`), zero avvisi.

**Senza rete**, con `fetch` che rifiuta sempre: un solo tentativo verso
l'indice, nessun avviso, e la carta c'e' comunque — elenco da localStorage,
immagine da IndexedDB, layer sulla mappa. E' la promessa del progetto («il
cloud distribuisce, non sostituisce») e ora e' misurata, non dichiarata.

### Non verificato

- **Ancora niente contro il Supabase vero.** Il bucket e' simulato in memoria.
  Che la policy accetti `<boat_id>/carte/index.json` lo dira' il primo
  caricamento vero, esattamente come per le immagini.
- Il giro non e' stato fatto su due dispositivi fisici: il "telefono" e' stato
  simulato azzerando localStorage e IndexedDB nella stessa scheda.
- Non e' stato provato cosa succede se due dispositivi salvano l'indice
  **nello stesso momento**: l'ultimo sovrascrive, e non c'e' controllo di
  versione sull'oggetto.

---

## 17/09/2026 (5) — La sincronia andava in un verso solo, e una bandiera vecchia bloccava il recupero

`carta/index.html`. Nessun bump di service worker.

Sergio dopo la correzione precedente: «ancora niente ne' sul telefono ne' sul
tablet». Il codice era online (verificato: `origin/main` a `fe645c6`, pagina
live identica byte a byte alla locale), quindi il difetto era nel mio disegno.
Due difetti, in fila.

### 1. La sincronia partiva solo sui cambiamenti

L'invio dell'indice era agganciato a `rsStore()`, cioe' a una **modifica**.
Sergio aveva calibrato **prima** che questo codice esistesse: aprendo Carta col
codice nuovo non cambiava niente, quindi non partiva niente, e sul cloud non
c'era mai stato nulla da scaricare. Vale anche per chi calibra senza campo e
poi torna in rete.

Una sincronia che parte solo sui cambiamenti **non sincronizza quello che
c'era gia'**, che e' proprio il caso di chi accende la funzione per la prima
volta — cioe' di tutti, una volta.

Ora `rsSyncIndice` va nei due versi: scarica, fonde, e se in locale c'e'
qualcosa che sul server manca o e' piu' vecchio lo **rimanda su**. In piu'
`rsSyncImmagini` manda le immagini delle carte che hanno `sb!==true`, una per
volta. Aprendo lo strumento e non toccando nulla, un dispositivo che aveva
calibrato "prima" pubblica tutto da solo.

### 2. Una bandiera di stato usata come cancello

Trovato dal test, non ragionandoci: dopo la correzione 1 la carta compariva
sul telefono con i suoi punti, ma **l'immagine no**.

Causa: `rsAttiva` scaricava l'immagine solo `if(cal.sb&&SB.pronto())`. Ma
l'indice viene pubblicato **prima** delle immagini, quindi l'indice sul server
porta `sb:false`; il dispositivo che lo legge vede `sb:false` e non prova
nemmeno. La bandiera era vera in locale sul Mac e falsa sul server: lo stesso
dato in due posti, e quello sbagliato comandava.

Correzione, e vale come regola: **un percorso di recupero non si mette dietro
una bandiera di stato replicata.** Se l'immagine manca e il cloud c'e', si
prova; se non c'e' arriva un 404 e si dice all'utente. `sb` resta, ma solo
per disegnare la nuvoletta. In piu' `rsSyncImmagini` **rimanda l'indice** quando
ha finito, cosi' anche la nuvoletta e' giusta sugli altri dispositivi.

### Alternative scartate

**Mandare l'indice dopo le immagini** invece di prima, per avere `sb` giusto al
primo colpo. Non basta: se l'invio di un'immagine fallisce per rete, l'indice
non partirebbe affatto e si tornerebbe al punto di partenza. Meglio pubblicare
subito quello che conta (la calibrazione: senza quella la carta non esiste) e
correggere dopo.

**Togliere `sb`.** Serve: senza, non si puo' mostrare quali carte sono al
sicuro sul cloud e quali stanno solo su questo dispositivo — che e'
un'informazione che l'utente vuole prima di cancellare qualcosa.

**Un avviso quando il cloud non e' configurato.** Scartato l'alert, che
fermerebbe la calibrazione per una cosa non urgente. Aggiunto invece
**«· solo qui»** nella riga di stato accanto all'RMS: informa senza
interrompere. Prima, se Supabase non era pronto, non compariva proprio niente
e l'utente non aveva modo di sapere che non stava sincronizzando.

### Validazione

Bucket finto in memoria, e la situazione **esatta** di Sergio: carta con
`sb:false`, immagine solo in IndexedDB, cloud vuoto, e nessuna modifica fatta
a mano. Aprendo lo strumento: `GET index.json` (404), `POST index.json`,
`POST rV.jpg`, e **un secondo `POST index.json`**. Verificato che nell'indice
sul server `sb` sia ora `true`.

Poi telefono azzerato (0 carte, `raffyca-rasters` assente, IndexedDB vuoto):
`GET index.json`, `GET rV.jpg`, e sullo schermo la carta «Laguna» con i suoi
2 punti, l'immagine in IndexedDB e il layer sulla mappa. **Zero avvisi.**

### Non verificato

- **Ancora niente contro il Supabase vero.** E questa e' la terza voce di fila
  in cui lo scrivo: il bucket e' simulato, e tutti e tre i difetti di oggi
  sarebbero usciti in dieci minuti con un caricamento vero. La simulazione ha
  preso il difetto 2 ma non i difetti 1 e 3, perche' riproduceva il pezzo e
  non la storia dell'utente.
- Due dispositivi che aprono Carta nello stesso istante: l'ultimo `POST`
  vince, e non c'e' controllo di versione sull'oggetto.

---

## 18/09/2026 — L'immagine non era mai partita, e l'hanno detto i log del progetto

`carta/index.html`. Nessun bump di service worker.

Terzo giro sulla stessa funzione, e stavolta la diagnosi non viene dal
ragionamento ma dai **log di Supabase**. Sergio ha dato il riferimento del
progetto e in una query e' finita ogni ipotesi.

### Il dato

Richieste verso `boat-docs/<boat_id>/carte/` nelle 24 ore:

| chi | metodo | oggetto | stato | quante |
|---|---|---|---|---|
| Mac | POST | `index.json` | 200 | 6 |
| Android | POST | `index.json` | 200 | 1 |
| Mac / Android | GET | `index.json` | 200/304 | 19 |
| Android | GET | **immagine** | **400** | **12** |
| Android | OPTIONS | immagine | 200 | 4 |

E nella stessa finestra, cercando **tutti** i POST verso `/storage/`: sette, e
tutti e sette `index.json`. **Dell'immagine non esiste un solo tentativo di
caricamento, mai, verso nessun percorso.**

Quindi: la calibrazione saliva e scendeva perfettamente (CORS a posto,
preflight 200), e il 400 sull'immagine non era un rifiuto di policy — era
Supabase che diceva «oggetto non trovato», perche' l'oggetto non c'era. Il
dispositivo che doveva caricarlo aveva deciso di non farlo.

### La causa, e la sua classe

`rsSyncImmagini` filtrava su `!c.sb`: caricava solo le carte che la bandiera
locale diceva **non** essere sul cloud. Sul Mac quella bandiera era `true`
mentre sul bucket non c'era niente. Non ho ricostruito con certezza come ci
sia arrivata, e ho smesso di cercarlo: **non e' la domanda giusta.**

La domanda giusta e' perche' una bandiera di stato replicato stesse decidendo.
E' la **terza volta in due giorni**:

1. voce (2): residuo zero *per costruzione* preso per una misura;
2. voce (5): `cal.sb` come cancello del download, falso perche' l'indice si
   pubblica prima delle immagini;
3. questa: `c.sb` come cancello dell'upload, falso per ragioni ignote.

Il filo comune non e' la distrazione, e' un errore di impostazione: **usare un
dato replicato come ingresso di una decisione, invece di chiedere alla
realta'**. Uno stato sbagliato che si autoconferma non si ripara mai da solo,
e non produce nemmeno un errore da leggere: produce silenzio.

### La correzione

`SB.esiste(id)` fa un **HEAD** sull'oggetto. `rsSyncImmagini` non filtra piu'
su niente: per ogni carta guarda cosa c'e' **davvero** in locale
(`RDB.get`) e cosa c'e' **davvero** sul server (`HEAD`), e colma la
differenza. `sb` resta solo per disegnare la nuvoletta, e viene riallineato da
cio' che risponde il server. Costo: un HEAD per carta a ogni apertura dello
strumento. E' il prezzo per non restare mai in uno stato sbagliato.

### E un difetto di diagnosi, non di codice

L'avviso «Immagine non salita sul cloud: …» era un messaggio passeggero da sei
secondi. Ieri e' svanito prima che Sergio potesse leggerlo, e alla mia domanda
«cosa dice il messaggio?» non aveva niente da riferire — un giro perso a
ipotizzare. Ora gli errori del cloud **restano appiccicati** alla riga di
stato finche' non si risolvono (`RS_ERR`). Un errore che scompare da solo e'
un errore che non esiste, dal punto di vista di chi deve riferirlo.

### Alternative scartate

**Ricostruire come `sb` sia diventata `true`.** Interessante e inutile: la
correzione non deve dipendere dal sapere la storia, altrimenti ci sara' una
quarta storia.

**Elencare il bucket** (`/storage/v1/object/list/...`) invece di un HEAD per
carta: una chiamata sola invece di N. Scartata perche' l'endpoint di elenco ha
una forma e una policy diverse da quella dell'oggetto, e verificarla vorrebbe
dire aprire un fronte nuovo per risparmiare qualche richiesta su una lista che
avra' tre voci.

**Fidarsi di `sb` ma ritentare a tempo** (per esempio ogni sette giorni). Fa
la cosa giusta per caso e dopo, che e' il modo di lasciare la carta mancante a
bordo nel giorno in cui serve.

### Validazione

Riprodotta la situazione **esatta** letta nei log: `sb:true` in locale,
indice presente sul bucket, immagine assente. Aprendo lo strumento senza
toccare nulla: `GET index.json` -> `HEAD rDelta.jpg` (assente) ->
`POST rDelta.jpg` -> `POST index.json`. Immagine sul bucket.

Poi dispositivo azzerato: `GET index.json`, `GET rDelta.jpg`, carta «Delta» in
tendina con i suoi 2 punti, immagine in IndexedDB, layer sulla mappa, zero
avvisi.

### Non verificato

- Il bucket delle prove e' ancora simulato. **Ma per la prima volta la
  diagnosi e' venuta dal progetto vero**, e quella e' la differenza che conta:
  i tre difetti di ieri li ho trovati indovinando, questo l'ho letto.
- Non e' stato provato il caso di un HEAD che risponde 200 su un oggetto
  troncato o corrotto: si darebbe per presente un file illeggibile.
- Due dispositivi che aprono nello stesso istante: l'ultimo `POST` dell'indice
  vince, senza controllo di versione.

---

## 19/09/2026 — Il token scadeva, e `carta/` non lo rinnovava

`carta/index.html`. Nessun bump di service worker.

L'errore finalmente leggibile, dalla riga di stato appiccicata aggiunta ieri:

    403 Unauthorized · "exp" claim timestamp check failed · AccessDenied

E l'osservazione di Sergio che vale piu' dell'errore: **«l'errore va via se si
apre Manutenzione»**. Cioe': non era una policy, non era un percorso, non era
una bandiera. Era il **token di sessione scaduto**, e Manutenzione lo rinnova
mentre `carta/` no.

### La causa

`SB.token()` prendeva `access_token` da `raffyca-supabase-sess` e lo usava
com'era. La sessione dura un'ora. Passata quella, ogni chiamata allo storage
tornava 403 e la sincronia si fermava. Aprire Manutenzione rimetteva a posto
tutto perche' `manutenzione/` ha `rinfresca()` e riscrive la sessione: `carta/`
si ritrovava il token buono **per effetto collaterale di un altro modulo**.

Difetto mio di lettura: avevo copiato da `manutenzione/` `hdr()`, `token()` e
la forma degli URL — cioe' le tre righe che si vedono — e **non** `scriviSess`,
`rinfresca` e il ritentativo, che sono la parte che tiene in piedi le altre.
Copiare la superficie di un livello di accesso e lasciarne fuori la gestione
del ciclo di vita e' un modo affidabile di scrivere qualcosa che funziona per
un'ora.

### La correzione

Dentro `SB`, la stessa procedura di `manutenzione/`: `exp` salvato nella
sessione (`expires_in` meno un minuto), rinnovo su
`/auth/v1/token?grant_type=refresh_token`, e una sola richiesta di rinnovo in
volo per volta (`RINF`).

Tutte le chiamate allo storage passano ora da `chiama()`, che:

1. rinnova **prima** se `exp` e' passato;
2. se il server risponde 401/403 lo stesso, rinnova e **ritenta una volta** —
   perche' l'orologio del dispositivo puo' essere sfasato e `exp` puo' mentire;
3. se il rinnovo non riesce, dice all'utente cosa fare: «apri una volta
   Manutenzione per rientrare», invece di un codice di errore.

La sessione si rilegge da localStorage **a ogni chiamata**, non una volta al
caricamento: un altro modulo o un'altra scheda puo' averla rinnovata nel
frattempo.

### Alternative scartate

**Dire all'utente di aprire Manutenzione e basta**, visto che funziona. No:
e' un rito senza motivo apparente, e a bordo ci si dimentica. Una funzione che
dipende dall'aver aperto un altro modulo nell'ultima ora non e' una funzione.

**Fare login da `carta/`.** Vorrebbe dire una seconda schermata di accesso e
la gestione delle credenziali in un modulo che non ne ha bisogno: il rinnovo
basta, e l'accesso resta una cosa sola, in Manutenzione.

**Rinnovare a orologeria** (un timer che tiene viva la sessione finche' la
pagina e' aperta). Spreca richieste quando non si usa il cloud, e non risolve
il caso della pagina appena aperta con sessione gia' vecchia.

**Fidarsi solo di `exp`** senza ritentare sul 403. Scartata dopo tre giorni di
lezioni sullo stesso tema: `exp` e' un dato locale, e un dato locale non e' la
verita'. Il server e' la verita', e se dice 403 si rinnova e si riprova.

### Validazione

Tre casi, con `fetch` finto che distingue token buono e token vecchio:

| caso | sequenza osservata | esito |
|---|---|---|
| sessione scaduta (`exp` passato) | rinnovo, poi POST | riuscito, token nuovo salvato |
| `exp` valido ma 403 dal server | POST, rinnovo, POST | riuscito |
| rinnovo impossibile | rinnovo fallito, ripiego su chiave anon, 403 | messaggio «apri Manutenzione» |

### Non verificato

- Non provato contro il progetto vero: il rinnovo e' simulato. Ma l'errore da
  cui si parte e' reale, letto sul dispositivo di Sergio.
- **Rotazione del refresh token fra moduli, punto aperto.** Supabase emette un
  refresh token nuovo a ogni rinnovo. Se `manutenzione/` e' aperta in un'altra
  scheda, tiene in memoria quello vecchio (lo legge una volta sola al
  caricamento): quando prova a rinnovare a sua volta fallisce, e chiede di
  rientrare. Non e' un danno — si rientra — ma e' un fastidio che nascera'
  dall'avere due moduli che rinnovano la stessa sessione. La strada, se
  diventa noioso, e' far rileggere anche a `manutenzione/` la sessione da
  localStorage prima di rinnovare.
- Non provato cosa succede se il rinnovo riesce mentre un upload da 3 MB e' a
  meta': il corpo e' un Blob e si rilegge, quindi in teoria il ritentativo
  funziona, ma con un file vero non e' stato visto.

---

## 20/09/2026 — Le maree: la tendenza, non il livello

Sole e Luna diventa **Sole, Luna e maree**. Non per fare un mareografo: per
rispondere a una domanda sola, che in bocca di porto vale piu' di tutte —
**la marea monta o cala, e quando si ferma?** Il verso della corrente in una
bocca, in un canale, in una laguna lo decide quello, non il livello.

Quindi la grandezza attorno a cui e' costruito tutto il modulo non e' `h` ma
`dh/dt`, e nemmeno per un passaggio si campiona il livello per differenziarlo
dopo: la derivata e' in **forma chiusa**, costituente per costituente, con
ogni termine moltiplicato per la propria pulsazione. E la stanca si cerca
sullo **zero della derivata**, non sul colmo del livello: vicino a un massimo
il livello e' piatto, varia come il quadrato dello scarto, e individuarne il
vertice al minuto non si puo'; la derivata invece attraversa lo zero con
pendenza piena, e li' la bisezione morde.

Roba nuova: `rf-maree.js` (motore, ES5, niente dipendenze, niente rete),
`maree/eot20-italia.bin` + `.json` (388 kB), `build_maree.py` (rigenera il
pacchetto), `valida_maree.py` (le prove), `maree/LEGGIMI.md` (procedura e
citazione). Nel modulo, una scheda **Marea** con tendenza, prossima stanca,
grafico del giorno colorato per verso, interruttore *bacino con bocche*,
attendibilita' motivata. Hub: tessera rinominata, `sw.js` a
**dritta-hub-v18** con i tre file nuovi nel precache. Chiave nuova nel
contratto: `raffyca-marea-bacino`.

Dati: **EOT20** (Hart-Davis et al. 2021, SEANOE doi:10.17882/79489, CC BY
4.0), 1/8 di grado, ritagliato su 6-19,5 E / 35-46 N, dieci costituenti su
diciassette. La citazione e' nel LEGGIMI e va tenuta **anche nei crediti
dell'app**: la licenza la pretende.

### Alternative scartate

**Interpolare ampiezza e fase invece delle componenti.** Le fasi sono angoli
(fra 350 e 10 gradi la media non e' 180) e vicino a un punto anfidromico
ruotano di 360 gradi in poche celle. Nel pacchetto vanno reale e immaginaria,
che sono due campi continui e si annullano insieme.

**Far valere zero come «terra».** Nei NetCDF di EOT20 la terra e' scritta 0,0.
Ma zero e' anche un'ampiezza legittima — nei punti anfidromici la marea si
annulla davvero — quindi la terra sta in una maschera a parte, un byte per
cella. Una cella e' terra se e' zero in **tutte** le costituenti: con la sola
M2 sarebbero finiti «a terra» punti di mare aperto.

**Togliere M4 per alleggerire.** Sul livello e' un centimetro. Sulla derivata
pesa il doppio di quanto pesi sul livello, perche' ogni costituente ci entra
moltiplicata per la propria pulsazione, ed e' lei a rendere il riempimento di
durata diversa dallo svuotamento. Toglierla sarebbe stato buttare via proprio
il dato che si cerca.

**Correzioni nodali tabellate o poste a 1.** Il nodo lunare in 18,6 anni
modula M2 del 4 %, K1 del 12 %, K2 del 29 %. Sul livello l'errore sarebbe
piccolo; sull'ISTANTE della stanca si sposta di minuti, e l'istante e' il
prodotto. Si calcolano da N, all'istante richiesto.

**Restituire `flow` sempre.** Il campo c'e' solo se il chiamante dichiara
`basin`. In un bacino a bocche la portata segue il prisma di marea (`Q = A ·
dh/dt`), quindi corrente massima a **meta' marea** e nulla ai colmi: sembra
sbagliato e non lo e', livello e corrente sono in quadratura. Ma in un canale
fra due bacini — Messina — conta il dislivello fra i due capi e la regola non
vale. Meglio un campo assente che un campo che mente; nel codice c'e' un
commento apposta, perche' chi legge dopo e' tentato di «correggere».

**Quantizzare a 1 mm.** Sembrava il passo naturale (ed era quello che avevo
scritto). Ma il valore piu' grande del riquadro e' 271 mm su 32767
disponibili: si buttavano cinque bit su sedici, e l'errore di quantizzazione
diventava il termine **dominante** nello scarto da EOT20 (0,22 cm sul livello,
fino a 25 minuti sulla stanca dove la marea e' piccola). A 0,1 mm per unita',
a parita' di byte, lo scarto e' sceso a 0,03 cm e 3,6 minuti. Il fattore sta
nell'header, il runtime non lo sa.

**Correzione di ampiezza nella tabella di calibrazione.** Solo fase: sul segno
della tendenza e sull'istante della stanca l'ampiezza non incide.

### Il trabocchetto di S1, e come si e' visto

La prima validazione contro EOT20 dava un centimetro di scarto sul livello e
oltre un'**ora** sulla stanca dove la marea e' piccola. Colpa della
convenzione di fase di S1: la famiglia OTIS/TPXO le da' −90 gradi, la famiglia
FES/GOT — a cui EOT20 appartiene — nessuno scarto. Con la convenzione
sbagliata S1 (2,8 cm di ampiezza massima nel riquadro) entra in opposizione e
sporca proprio la derivata. E' il primo posto dove guardare se la validazione
peggiora di colpo; nel codice c'e' il commento.

### Validazione

Due prove, e tutte e due fanno girare **il codice vero** dentro
JavaScriptCore: una riscrittura in Python avrebbe provato la riscrittura.

**Contro EOT20 a piena precisione** (argomenti astronomici di `pyTMD`, 30
giorni, 8 punti): livello entro 0,03 cm, derivata entro 0,014 cm/h, stanca
entro 3,6 minuti nel caso peggiore.

**Contro 60 giorni di osservato RMN** (19/07-18/09/2026; i sensori sono quelli
di `mareografico.it`, presi pero' dal servizio IOC perche' il sito ISPRA non
e' interrogabile da uno script):

| | segno | fuori banda morta | contro la sola marea | varianza che e' marea | stanca |
|---|---|---|---|---|---|
| Trieste | 91,8 % | 94,2 % | **97,7 %** | 94 % | 6,8 min |
| Venezia | 88,4 % | 90,8 % | **97,8 %** | 93 % | 6,7 min |
| Ancona | 80,3 % | 87,5 % | **94,0 %** | 87 % | 14,3 min |
| Cagliari | 68,9 % | 72,7 % | **98,6 %** | 77 % | 4,6 min |

La colonna che misura il modello e' la terza: il confronto con la **sola
marea** estratta dall'osservato per analisi armonica. Le prime due misurano
il modello contro il mare vero, sovralzo compreso, e la differenza non e'
imprecisione: e' meteorologia. Si vede bene a Cagliari, dove la marea
astronomica vale pochi centimetri e spiega il 77 % di quello che fa il
livello — il modello azzecca la marea al 98,6 % e il livello osservato al
69 %, perche' li' il livello lo fa il vento. E' il motivo per cui
`setMeteoWarning()` esiste.

Controprova: ampiezze e fasi di EOT20 interpolate nei quattro punti contro
quelle ricavate dagli osservati coincidono entro 1 cm e pochi gradi su M2,
S2, N2, O1 (Trieste, M2: 26,7 contro 26,8 cm, 0,6 gradi = un minuto e mezzo).

**Due errori miei, nella validazione, che valgono piu' del risultato.**

1. *Le stanche osservate cercate sulla derivata filtrata a 30 minuti.* Uscivano
   da 12 a 42 «stanche» al giorno invece di 4: a quella scala il mare vero ha
   sesse e onde lunghe che attraversano lo zero in continuazione, e a Cagliari,
   dove l'escursione astronomica e' di pochi centimetri, sono dieci volte piu'
   numerose delle stanche. Appaiarle vuol dire misurare rumore. Servono due
   filtri: 30 minuti per il confronto dei segni (come da specifica), 3 ore per
   **trovare** le stanche.
2. *Orari letti con `mktime`.* Il servizio pubblica in UTC; `mktime` li legge
   come ora locale e d'estate ci aggiunge pure l'ora legale. Risultato: un'ora
   tonda di ritardo apparente, identico a un ritardo idraulico di stazione — e
   per un giro di misure l'ho preso per tale, arrivando a proporre
   `delta_min: -60` per Trieste e Venezia. Con `timegm` gli sfasamenti veri
   sono fra −15 e +5 minuti. Morale gia' nota in questo repo: un numero che
   conferma quello che ti aspetti va controllato **piu'** degli altri.

### Aperti

- **`delta_min` resta vuoto, di proposito.** Gli sfasamenti misurati sono
  rumore (mezzo punto di concordanza). La tabella serve **dentro** le lagune,
  dove il ritardo e' vero e vale mezz'ora e piu': mancano gli osservati. I
  quattro valori misurati sono annotati commentati in `rf-maree.js`.
- **Ancona e' la piu' debole** (94,0 % contro la marea, 14,3 minuti sulla
  stanca): M2 vale 6,7 cm e la stazione sta dietro un molo. Non indagata.
- **La griglia non entra nelle lagune.** Dentro Venezia il modulo dichiara
  attendibilita' bassa e dice perche', ma dichiararlo non e' risolverlo.
- **Nessuna prova su dispositivo vero.** Provato nel pannello browser a 375
  px: scheda, grafico, interruttore bacino, avviso meteo, punti a terra e
  fuori riquadro (che sollevano un'eccezione con messaggio in italiano). Il
  service worker nel pannello non si registra, quindi **il precache dei 388 kB
  non e' stato verificato**: va guardato a bordo, in modalita' aereo.
- **Crediti**: la citazione EOT20 e' nel LEGGIMI, nei commenti del motore e
  nella riga delle fonti di `impostazioni/` (la licenza CC BY la pretende).
  Non e' un punto aperto, e' fatto: resta da guardare che su schermo stretto
  quella riga, ora lunga, non diventi illeggibile.

---

## 21/09/2026 — La Posizione Live passa da Upstash a Supabase

Upstash era il solo servizio esterno rimasto oltre a Supabase, per una
funzione sola. Ora la posizione viaggia nello stesso progetto di Manutenzione
e Carta: un servizio in meno da tenere vivo, una configurazione sola da
inserire, e la chiave condivisa `raffyca-supabase` gia' scritta da
`impostazioni/` che si riusa invece di duplicare indirizzo e token.

**Dove stava davvero il trasmettitore.** Non in `posizione/index.html`: la
funzione che invia e' `invia()` in `rf-live.js`, in radice, caricato da dieci
moduli (spostato li' il 22/08 perche' cambiare pagina fermava la
trasmissione). Conseguenza pratica, facile da dimenticare: `rf-live.js` sta
nel precache di **cinque** service worker, non uno. Alzati tutti e cinque —
hub v18→v19, meteo v17→v18, anchor v15→v16, routing v22→v23, xte v9→v10 —
altrimenti meta' suite avrebbe continuato a parlare con Upstash dalla cache,
e sarebbe stato invisibile dal codice.

**Lo schema.** `supabase/migrations/20260921_live_pos.sql`: tabella
`live_pos`, RLS attiva e **nessuna policy**, piu' due funzioni
`security definer` — `put_pos` e `get_pos` — concesse ad `anon`. Postgres non
ha il TTL di Redis: la scadenza e' la colonna `expires_at`, la rispetta chi
legge, e le righe morte da piu' di un giorno le raccoglie la scrittura
successiva. Il `ttl` resta quello di prima, `max(3 * intervallo, 3600)`.

### Alternative scartate

**Client JS di Supabase e Realtime.** Avrebbero portato una dipendenza in un
progetto che non ne ha, e Realtime avrebbe riscritto una funzione che
funziona: il polling a un minuto resta com'e'.

**Anon key nel link di condivisione**, per non committarla. E' un JWT da
duecento caratteri: il link passa da sessanta a trecento e il QR — che a
bordo si inquadra al volo — diventa molto piu' denso. Scartata: la anon key
sta nel sorgente di `segui.html`, che e' il posto dove sta in qualunque
applicazione web che parli con Supabase.

**`put_pos` concessa solo ad `authenticated`.** Sarebbe la chiusura piu'
stretta, ma obbligherebbe `rf-live.js` a rinnovare il token come ha dovuto
fare `carta/` il 19/09, e in mare il fallimento diventerebbe «apri
Manutenzione per rientrare» su una funzione che deve funzionare sempre.

**Lo schema esattamente come proposto**, con `put_pos` aperta ad `anon` senza
altro. Con la anon key pubblica, chiunque avesse il link — e quindi il codice
sessione — avrebbe potuto scrivere una posizione falsa nella sessione altrui:
oggi non puo', perche' scrivere richiede il write token che sta solo sulla
barca, e la migrazione avrebbe tolto quella barriera senza che si vedesse.
Aggiunta invece una colonna `secret` e un quarto parametro: il codice di
scrittura lo genera `rf-live.js` da solo alla prima trasmissione (chiave
nuova `raffyca-live-secret`, 24 caratteri da `crypto.getRandomValues`), non
viaggia nel link, e vale la regola del primo arrivato — la prima scrittura
di una sessione lo registra, le successive devono combaciare. Una sessione
scaduta si puo' riprendere, altrimenti chi svuota il localStorage resta
chiuso fuori dalla propria sessione.

**Tenere `raffyca-live-token` per il codice nuovo.** Il nome sarebbe andato
bene, ma dentro c'e' il token Upstash: riusare la chiave avrebbe lasciato un
segreto morto in chiaro sul telefono, con l'aria di servire ancora.
`rf-live.js` ora lo **cancella** alla prima trasmissione.

### Due trappole della migrazione, entrambe silenziose

1. **`put_pos` non restituisce niente**: 204 con corpo vuoto. Il vecchio
   codice faceva `r.json()` e confrontava `j.result === "OK"`. Su un corpo
   vuoto `r.json()` solleva, l'eccezione finisce nel `.catch` e l'utente
   legge «invio fallito: rete» mentre la scrittura e' andata a buon fine.
   Ora si guarda `r.ok`, e il corpo non si tocca.
2. **`get_pos` restituisce gia' un oggetto.** Upstash tornava una stringa
   dentro `{result:"..."}`, quindi `segui.html` faceva `JSON.parse`. Tenuto,
   avrebbe passato a `paint()` una stringa: `paint()` non solleva, legge
   `d.lat` su una stringa, trova `undefined` e lascia l'interfaccia vuota
   **senza un errore in console**.

### Validazione

Il progetto vero non e' raggiungibile da qui (le credenziali stanno sul
dispositivo di Sergio, non nel repo), quindi la prova e' stata fatta contro
un finto Supabase locale che risponde come quello vero: 204 a corpo vuoto
sulla scrittura, oggetto o `null` in lettura, 400 con `{"message":...}` sugli
errori, e la stessa regola del primo arrivato.

| prova | esito |
|---|---|
| nessuna configurazione | «Database non configurato: apri Impostazioni», trasmissione ferma |
| trasmissione con GPS finto | due scritture, `ttl 3600` con intervallo 30 s (invariato), «Trasmissione attiva» |
| token Upstash sul dispositivo | cancellato alla prima trasmissione; codice nuovo di 24 caratteri generato |
| lettura sessione viva | barca, 047°, 6,0 kn, posizione, mappa OpenSeaMap, «In diretta» |
| lettura sessione inesistente | «La barca non ha ancora trasmesso», banner in attesa |
| link senza codice sessione | «Link senza codice sessione» |
| `segui.html` con i segnaposto | «Indirizzo o chiave del progetto non inseriti» |
| scrittura con codice altrui | 400 «codice di scrittura non valido», la posizione vera resta |
| `ttl` fuori intervallo | 400 «ttl fuori intervallo» |
| scadenza reale (ttl 60 s) | dopo 65 s la lettura torna `null` e l'interfaccia dice che e' scaduto |

### Aperti

- **Lo schema SQL non e' mai girato su Postgres.** La logica e' stata provata
  contro una sua riscrittura in Python, che puo' concordare con me e non con
  Postgres. Da eseguire nel SQL Editor e riprovare i quattro casi della
  tabella qui sopra. In particolare `on conflict ... do update ... where`
  con `not found`: e' il modo corretto per evitare la corsa fra due primi
  invii, ma va visto funzionare.
- **`segui.html` ha i segnaposto.** Finche' Sergio non incolla indirizzo e
  anon key, chi segue vede il messaggio e non la posizione.
- **Il token di lettura Upstash e' nei commit** — `8f4a227` del 20/09, su
  `origin/main` di un repository pubblico. Toglierlo dal file non lo toglie
  dalla storia: **va revocato dalla console Upstash**. Il write token invece
  non e' mai finito in un commit.
- **Non provato su Safari iOS.** Il pannello di prova e' Chromium. Nel codice
  nuovo non c'e' niente che iOS non digerisca (nessuna sintassi oltre l'ES5,
  `fetch` e `crypto.getRandomValues` da anni), ma la prova vera e' il primo
  giro col telefono.
- **`keepalive.yml`** non e' ancora mai scattato, e vuole i due segreti
  `SUPABASE_URL` e `SUPABASE_ANON_KEY` nelle impostazioni del repository.
  GitHub disattiva i workflow schedulati dopo 60 giorni senza commit: se
  Dritta resta ferma a lungo, si addormenta anche il guardiano.

---

## 21/09/2026 (2) — Sorgente GPS scegliibile, e la barca finta parte dalla linea

Tre richieste in una volta: una scelta nuova in Impostazioni, una domanda
sull'orientamento del quadro di Partenza, e la posizione di partenza del
simulatore di Percorso.

### 1. Sorgente della posizione (Impostazioni → Stato GPS)

Segmento a due stati, chiave nuova `raffyca-gps` = `{alta:true}`, default
GPS diretto — cioe' il comportamento che la suite ha sempre avuto.

**Cosa si puo' scegliere davvero.** Una pagina web non puo' dire al telefono
«usa il servizio di Google»: l'unica leva dell'API di geolocalizzazione e'
`enableHighAccuracy`, e chi risponde lo decide il sistema operativo. Con
`false` la risposta arriva dalla stima di rete — che su Android e' quella di
Google e su iPhone quella di Apple — immediata, quasi gratis in batteria,
imprecisa, e al largo **assente**, perche' celle e wi-fi non ce ne sono. Il
testo in Impostazioni lo dice cosi', senza promettere una scelta di fornitore
che non esiste.

Il lettore condiviso sta in `rf-topbar.js` (`window.rfGeo`), che e' l'unico
file caricato da **tutti** i moduli: nessun file nuovo, nessun service worker
in piu' da gestire. Ogni chiamante mantiene i suoi `maximumAge` e `timeout`,
che `opzioni()` non tocca: chi disegna una rotta e chi tiene una veglia hanno
bisogni diversi e li sanno meglio loro.

Collegati: barra GPS/registratore GPX, `rf-live.js`, cruscotto, percorso,
carta, meteo, routing, xte, sole-luna, partenza, e la prova in Impostazioni.

**`anchor/` e `mob/` NON sono collegati, di proposito.** La veglia d'ancora
deve accorgersi di un'arata di dieci metri e l'uomo a mare va cercato al
metro: una posizione di rete li renderebbe inutili senza dirlo. E' una scelta
tolta all'utente, non una dimenticanza — sta scritto nel commento in
`rf-topbar.js` e nel testo in Impostazioni.

### La trappola: `window.rfGps` era uno `<span>`

Il nome scelto all'inizio era `window.rfGps`. Nel markup della barra c'e' da
sempre `<span class="rf-gps" id="rfGps">`, e **un id nel DOM diventa una
variabile globale omonima**: finche' `rf-topbar.js` (che e' `defer`) non
veniva eseguito, `window.rfGps` era quello span. Il ripiego scritto come
`window.rfGps ? window.rfGps.opzioni(o) : …` passava il controllo e poi
esplodeva su `.opzioni`, con un `TypeError` a meta' pagina: in `percorso/`
il modulo si fermava prima di esporre `__pvTest`, e il sintomo sembrava
tutt'altro. Rinominato in **`rfGeo`** (nessun id omonimo nel repo) e il
ripiego ora controlla `typeof g.opzioni === "function"`, non la sola
esistenza. Lezione generale: in questa suite ogni `id=` e' anche un nome
globale, e un `if (window.qualcosa)` non dice che sia il *tuo* qualcosa.

### 2. Orientamento del quadro di Partenza — nessuna modifica

Era una domanda, e la risposta era gia' nel codice
(`partenza/index.html`, commento sopra `drawSvg`): **il quadro ruota con la
LINEA**, non col nord e non col vento. Assi ruotati: x lungo PIN→RC con RC a
destra, y lungo la normale col lato percorso in alto. Cosi' la convenzione di
posa e' leggibile a colpo d'occhio — barca sotto la linea = sei a posto,
sopra = sei OCS — e resta la stessa comunque ruotino vento e barca. Il nord
non sparisce: e' la rosa in alto a sinistra, che gira; il vento e' quella in
alto a destra. Orientare al nord vorrebbe dire che a ogni posa cambia il
significato di «sopra» e «sotto», che e' esattamente cio' che in partenza non
si vuole dover ricalcolare.

### 3. Simulatore di Percorso: si parte dal centro della linea

Difetto osservato: la simulazione partiva **dalla posizione GPS reale**. Il
centro linea era gia' previsto, ma dietro un `if(!POS)`, cioe' solo quando il
GPS non aveva ancora agganciato: con un fix in tasca la barca finta partiva
da casa e attraversava mezza regione per andare alla prima boa, rendendo
illeggibili distanze, TTG e lati.

Ora `simPartenza()` decide in ordine: centro della linea, un estremo solo se
ce n'e' uno solo, 400 m sottovento alla prima boa, e in ultimo un punto
qualunque per non restare senza. Si applica **a ogni accensione**, non solo
la prima: fermare e riavviare riporta la barca in griglia invece di lasciarla
dove l'aveva portata il giro precedente.

Due cose trovate strada facendo e sistemate:

- **La posizione finta finiva in `raffyca-pos`**, il contratto condiviso:
  una prova a tavolino spostava la barca anche nella barra GPS, in Carta e in
  Sole Luna e maree. Ora durante la simulazione non si scrive.
- **Allo stop restava la scia finta.** Ora `POS`, `COG`, `SOG` e `_lastFix` si
  azzerano e il primo fix vero riprende il comando.

### Validazione

Nel pannello browser, a 375 px, con server locale.

| prova | esito |
|---|---|
| preferenza assente | `alta()` vero, `opzioni()` da `enableHighAccuracy:true` |
| «Servizio» | scritto `{"alta":false}`, segmento e cella «Sorgente» allineati |
| percorso, carta, cruscotto con «Servizio» | `enableHighAccuracy:false`, `maximumAge` e `timeout` di ciascuno intatti |
| `anchor/` con «Servizio» | nessun helper: resta su GPS diretto, come voluto |
| simulatore con fix GPS a Trieste e linea in Sardegna | parte dal centro linea (41.2100 / 9.4050) e dopo 3 s si e' mosso verso la boa |
| `raffyca-pos` durante la simulazione | invariata |
| stop simulazione | `POS` azzerata, etichetta tornata «Avvia simulazione» |
| sintassi | tutti i blocchi `<script>` dei file toccati passano `checkSyntax` |

Alzati i cinque service worker che precacheano `rf-topbar.js`/`rf-live.js`:
hub v19→v20, meteo v18→v19, anchor v16→v17, routing v23→v24, xte v10→v11.

### Corretto un «limite noto» che non era piu' vero

`CLAUDE.md` diceva che `performance/` e `partenza/` sono build React non
modificabili da questo repository. **Non lo sono piu'**: zero occorrenze di
React o webpack in entrambi, `partenza/` e' scritto a mano (61 funzioni,
commenti in italiano) e `performance/` lo assembla `build_perf.py`, che sta
in radice e dice di se' «sostituisce il vecchio bundle Lovable». Quella riga
mi ha quasi fatto rispondere «non si puo' toccare» a una domanda su
`partenza/`. Attenzione pero': il `ROOT` dentro `build_perf.py` punta a
`/home/claude/work/provela`, un percorso di un'altra macchina, e va corretto
prima di rieseguirlo.

### Aperti

- **La sorgente si legge quando il watch parte.** Cambiarla mentre un modulo
  sta gia' seguendo il GPS non ha effetto fino al riavvio del watch (cambio
  pagina, o spegni e riaccendi). In Impostazioni la prova si riavvia da sola,
  proprio per poter confrontare le accuratezze; altrove no. Se diventa
  noioso, la strada e' un evento `storage` che faccia ripartire i watch.
- **Non provato su telefono**: il pannello e' Chromium su desktop, dove
  «Servizio» e «GPS diretto» danno la stessa risposta e quindi la differenza
  di accuratezza non si vede. Va guardata all'aperto, col telefono, sulla
  cella «Accuratezza» della prova in Impostazioni.
- `performance/index.html` non e' stato toccato (non usa la geolocalizzazione)
  e non e' stato verificato se e' ancora allineato a `build_perf.py`.

---

## 21/09/2026 (3) — La barca finta girava intorno alla boa, per due motivi diversi

Quattro cose in una volta, l'ultima tornata sulla PWA prima di dedicarsi
all'apk: il simulatore di regata che si piantava sulla B1, l'ordine delle
schede in Sole Luna e maree, l'autonomia della batteria nei Calcoli, le
conversioni nel Prontuario.

### 1. Il simulatore non superava la prima boa

Difetto segnalato: caricato il percorso Barcolana 2026 (GPX esportato dal
modulo stesso: linea CB/PIN e le boe B1, B2, B3, B4, A), la simulazione
arriva sulla **B1 e li' si ferma**. Non si blocca la pagina: la barca gira
intorno alla boa e la target non avanza mai.

Le cause sono **due, indipendenti, con lo stesso sintomo**. La prima sta qui
sotto ed e' reale ma rara; la seconda — sezione seguente — e' quella che ha
colpito davvero, e si e' vista solo dalle schermate. Vale la pena tenerle
scritte tutte e due: cercando la prima non avrei trovato la seconda, e
fermandomi alla prima avrei chiuso un difetto ancora aperto.

**Prima causa: non e' la navigazione, e' la misura del passaggio.** In `tick()`
il passaggio boa si decideva con `hav(POS, boa) < COURSE.buffer`, cioe'
confrontando il **punto** del fix con il raggio. Fra un fix e l'altro pero'
la barca percorre un tratto, e se la boa sta **dentro quel tratto ma fuori
dai due estremi** nessuno se ne accorge: la barca scavalca la boa, se ne
allontana, torna indietro, riscavalca, e continua cosi' per sempre.
Misurato sul posto, col simulatore a 10x: distanza dalla boa che oscilla
**22 → 32 → 22 → 32 m** all'infinito, con il raggio a 10 m.

Le condizioni che lo fanno accadere: passo lungo (simulatore a 10x, che fa
30–70 m per campione secondo la polare) e raggio stretto (10–20 m). A 1x, o
col raggio da 60 m di fabbrica, il caso non capita quasi mai — ed e' il
motivo per cui non era mai saltato fuori prima. **Non e' un difetto del solo
simulatore**: a 8 nodi con dieci secondi fra un fix e l'altro la barca vera
fa 41 m, e una boa segnata con raggio piccolo si perde allo stesso modo.

**Correzione**: la distanza si misura sul **tratto** fra il fix precedente e
quello attuale, non sul punto. Helper nuovo `distSeg(a,b,p)` (distanza
punto-segmento sul piano locale, gli stessi metri di `toXY`), e `onFix`
tiene il tratto appena percorso in `_seg`, che `tick()` consuma. Il tratto
vale solo se i due fix sono **davvero consecutivi** — meno di 30 s e meno di
2 km — altrimenti un GPS riagganciato dopo dieci minuti, o l'accensione del
simulatore, farebbero «passare» tutte le boe scavalcate dal salto.

Alternative valutate e scartate:

- **Allargare il raggio minimo dello slider** (da 10 a 40 m): nasconde il
  difetto invece di toglierlo, e lascia intatto il caso della barca vera con
  un buco GPS. Il raggio stretto e' una scelta legittima su una boa piccola.
- **Rallentare il 10x**: il 10x serve proprio a vedere un giro intero in
  pochi minuti. E comunque non risolve il buco GPS.
- **Far virare il simulatore quando resta fermo** (contatore di stallo): un
  cerotto che maschera il sintomo. La barca finta gia' naviga bene; era la
  misura del passaggio a essere sbagliata.
- **Rifare `simStep` con virata sulla layline**: sarebbe piu' realistico, ma
  e' un'altra cosa, e non e' la causa. Resta un'idea per quando serve un
  simulatore che assomigli a una regata e non solo a un collaudo.

### La seconda causa — ed era QUESTA quella segnalata

Leggendo il codice per la prima correzione ne e' saltata fuori una seconda,
che porta allo **stesso identico sintomo**: `simStep` insegue `curTarget()`
anche a **regata ferma**, ma i passaggi li conta `tick()` solo `if(NAV.on)`.
Chi accende il simulatore senza aver premuto **▶ Avvia** vede la barca
arrivare sulla prima boa, superarla, tornare indietro, e ballare li' fra due
rotte opposte per sempre; e il bottone «Boa passata» e' disabilitato proprio
perche' la regata non e' avviata.

Alla prima correzione questa l'avevo solo **segnalata con un avviso**,
lasciando il comportamento com'era, con la motivazione che il simulatore
muove la barca e la regata conta le boe. Sbagliato due volte: perche' quello
stato non e' utile a nessuno, e perche' — dalle schermate mandate — **era
proprio quello il caso reale**. Si vede tutto: sotto «PROSSIMA BOA B1» c'e'
scritto *premi Avvia*, il raggio e' a **60 m** di fabbrica, e le distanze
lette sono **43 m e 19 m**, cioe' ben dentro il raggio. SOG e COG che
saltano da 10,5 kn / 082° a 6,0 kn / 262°: la barca entra nel cerchio, esce,
rientra. Con la regata ferma non c'era raggio abbastanza largo per salvarla.

**Correzione**: se la regata e' ferma, **la avvia la simulazione**. Allo stop
lo stato di gara torna esattamente com'era (`SIM.navPrima` conserva `on`,
`tIdx`, `startT` e il registro), cosi' una prova a tavolino non lascia una
regata mezza corsa in `raffyca-race-course`. **Niente `startRec()`**: una
prova non deve riempire l'Analisi di registrazioni finte. Se invece la regata
l'hai avviata tu, il simulatore non tocca niente — ne' all'accensione ne'
allo spegnimento.

Scartate: (a) lasciare l'avviso e basta — e' quello che avevo gia' fatto, e
il difetto e' rimasto; (b) far contare i passaggi al simulatore invece che
alla regata — il quadro continuerebbe a dire «premi Avvia» mentre la barca
gira il percorso, e tempo, TTG e boe rimaste resterebbero spenti; (c)
disabilitare il bottone del simulatore a regata ferma — toglie un uso
legittimo (guardare la barca muoversi) per un problema che si puo' risolvere
facendo la cosa giusta da soli.

Trovati di passaggio, tutti e due sulla stessa strada:

- Allo stop `tick()` esce subito perche' `POS` e' gia' `null`, quindi il
  quadro non si ridisegnava e restava sull'ultimo stato della prova. Ora lo
  stop chiama `rcUi()`.
- **A percorso finito la barca finta ripuntava la prima boa.** `simStep`
  usava `COURSE.marks[0]` come ripiego quando `curTarget()` e' nullo: chiuso
  il giro, la barca tornava verso la B1 e ricominciava a girarle intorno, con
  la regata ormai finita — di nuovo lo stesso sintomo, in coda invece che in
  testa. Ora la simulazione si **spegne da sola** quando il percorso e'
  completo.

### Verifica

Percorso Barcolana 2026 importato dal GPX vero, nel pannello browser con
server locale.

| prova | esito |
|---|---|
| caso segnalato riprodotto (polare rapida, raggio 10 m, 10x, TWD 40°) | prima: fermo sulla B1, distanza 22/32 m all'infinito |
| lo stesso caso dopo la correzione | giro completo: B1, B2, B3, B4, A, arrivo |
| 12 direzioni di vento a 10x, raggio 60 m, polare demo | 12 giri su 12 completati |
| 6 direzioni di vento a 1x | 6 su 6 completati |
| modello fuori dal browser, 12960 casi (2 velocita' × 10 intensita' × 15 raggi × 36 direzioni) × 4 polari di taglia crescente | col punto 59 giri piantati, **col tratto 0** |
| caso reale delle schermate (regata ferma, raggio 60 m, TWD 217°) | prima: fermo sulla B1 a 43 e 19 m; dopo: giro completo |
| 12 direzioni di vento a 10x partendo **da regata ferma**, dai bottoni veri | 12 su 12 completate |
| 4 direzioni a 1x, da regata ferma | 4 su 4 completate |
| stop dopo un giro intero | `nav` torna a `{on:false, tIdx:0, startT:null, log:[]}`, anche nel salvato |
| stop a meta' del primo lato | stessa cosa, e il quadro torna a «premi Avvia» |
| regata avviata a mano, poi simulatore | `SIM.navPrima` nullo, allo stop la regata resta avviata e `tIdx` intatto |
| percorso completato | la simulazione si spegne da sola dopo 935 passi, avviso «🏁 Arrivo» |
| Analisi dopo tutte le prove | **zero** registrazioni lasciate |
| `raffyca-pos` durante la simulazione | non scritta |
| stop simulazione | `POS`, `_seg` e `_posT` azzerati, etichetta ripristinata |

Nota: nelle 59 piantate del modello la boa incriminata **non e' sempre la
B1** — sono B1, B2, B3, B4, A e anche l'arrivo, secondo il vento. La B1 e' la
prima che si incontra, ed e' li' che il giro si interrompe.

### 2. Sole, Luna e maree: prima la luce, poi la marea

Nella scheda **Giorno** il grafico *Altezza sull'orizzonte* era sotto la
scheda Marea. Scambiate: la luce e' la domanda che si fa piu' spesso, e
adesso sta subito sotto le schede Sole e Luna, con la marea di seguito. Solo
markup, nessuna logica toccata (i due canvas si dimensionano da soli).

**«attendibilita' bassa» non si scrive piu'.** Si legge come «il calcolo e'
sbagliato», mentre quello che dice e' un'altra cosa: che li' la griglia da
1/8 di grado non risolve il bacino e il dato va confrontato con quello che si
vede. Ora la pastiglia dice **«da verificare le condizioni locali»**, e la
riga di spiegazione sotto la nota comincia allo stesso modo. Media e alta
restano «attendibilita' media/alta»: quelle si leggono per quello che sono.

### 3. Calcoli di bordo → Barca: autonomia della batteria

Richiesta di chi **non ha l'alternatore sul motore**: il conto e' solo a
scendere, e l'unico rientro e' la banchina o il solare. Si danno capacita',
tensione, tipo, stato di carica, potenza accesa e ore al giorno; si leggono
energia utile, corrente assorbita, **tempo prima che si scarichi** (tutto
acceso) e **autonomia in giorni** con l'uso dichiarato — le due letture della
richiesta, che non sono la stessa cosa.

Due scelte non ovvie:

- **La scarica utile non e' la capacita' di targa**: piombo/AGM 50%, gel 60%,
  litio 80%. La voce «fino a zero» c'e' ma e' dichiarata teorica.
- **Peukert**, con esponente per tipo (1,20 piombo, 1,15 gel, 1,05 litio):
  a corrente alta una batteria al piombo rende molto meno della targa, ed e'
  la differenza fra un frigo che arriva a sera e uno che molla nel
  pomeriggio. **Il guadagno sotto la corrente di targa invece non si conta**:
  la formula lo darebbe (a C/20 e meno la resa sale), ma e' la prima cosa che
  l'eta' della batteria si mangia, e un conto di autonomia che promette piu'
  del cartellino non serve a nessuno. Per questo `tPeuk` e' limitato a
  `tCont`, e l'etichetta della riga dice quale dei due casi si sta vedendo.

Nella nota, le potenze indicative di bordo a 12 V (frigo, pilota, plotter,
VHF, luci di via, sentina, AIS) e l'avvertenza che il frigo lavora a
intermittenza: la potenza di targa non e' il consumo medio.

### 4. Prontuario → Conversioni

Tessera nuova nel menu e vista `?v=conversioni`. Nove grandezze lineari
(lunghezza, area, volume, massa, velocita', forza, pressione, potenza,
tempo) piu' le **coordinate**.

Struttura: **un fattore per unita' verso una base**, e tutto passa dalla
base. Niente tabella N×N — con nove grandezze sarebbero centinaia di numeri
da sbagliare. I fattori sono quelli **esatti per definizione** (miglio
nautico 1852 m, piede 0,3048 m, libbra 0,45359237 kg, psi 6894,757293168 Pa),
non arrotondati.

Dettagli che contano:

- **Unita' di partenza sensata per grandezza** (metri, non millimetri; nodi;
  hPa; CV; ore), altrimenti la prima cosa che si vede e' una colonna di
  esponenziali.
- Le unita' che a bordo si confondono hanno la riga di spiegazione: braccio e
  gomena, hPa uguali ai millibar, CV diverso da hp, daN vicino al kgf,
  tonnellata lunga del rapporto D/L, e il miglio nautico che **non** e' il
  miglio terrestre.
- **Coordinate**: parser tollerante (decimali, gradi-primi, gradi-primi-
  secondi, virgola o punto, emisfero o segno meno) e lo stesso punto scritto
  nei tre modi, piu' una riga da incollare altrove. I gradi decimali sono a
  **cinque decimali** come nel MOB e in Carta: sei cifre significative
  darebbero 45,6876, cioe' undici metri di incertezza. Bottone «dalla mia
  posizione» che legge `raffyca-pos`, il contratto condiviso — nessuna
  chiamata al GPS da qui.
- A 375 px le coordinate non stanno su una riga: latitudine e longitudine
  sono impilate, non in tabella.

### Service worker

`calcoli/`, `sole-luna/`, `prontuario/` e `index.html` stanno nel precache
dell'hub: **`dritta-hub-v20` → `v21`**. `percorso/` non e' precacheato da
nessuno e non richiede bump. Aggiornate anche le due descrizioni delle
tessere dell'hub, che elencano gli strumenti dei due moduli.

### Aperti

- **Un salto di GPS sotto le soglie passa le boe che scavalca.** Il tratto si
  considera valido fino a 30 s e 2 km: dentro quei limiti un fix sbagliato
  che attraversa una boa la fa contare. E' il compromesso scelto — meglio un
  passaggio di troppo, che si annulla con «↩ Indietro», di una boa che non si
  conta mai — ma se dovesse capitare davvero, la strada e' confrontare il
  tratto con la velocita' dichiarata dal GPS.
- **Se una registrazione e' gia' aperta e si accende il simulatore, la traccia
  finta finisce dentro quella sessione.** Non e' stato toccato: capita solo
  avviando la regata a mano, registrando, e poi accendendo il simulatore. La
  strada, se da' fastidio, e' saltare `recSample()` con `SIM.on`.
- **L'autonomia della batteria non e' stata confrontata con una misura
  vera.** I fattori sono da manuale; la verifica e' un amperometro e una
  notte alla fonda.
- **Niente conversione di temperatura** nelle Conversioni: non e' un fattore
  moltiplicativo e l'elenco richiesto non la comprendeva.
- **Nessuna prova su telefono**: pannello Chromium a 375 px.

---

## 21/09/2026 (4) — Strumenti di bordo, e Dritta diventa anche un'app Android

**Ramo `capacitor`, worktree separato: `main` non e' toccata.** Quanto segue non
e' nel sito pubblicato.

Sergio ha chiesto se valesse la pena impacchettare Dritta in un APK invece di
lasciarla PWA. La risposta breve: **per una cosa sola, ma quella cosa non si
puo' avere in nessun altro modo** — il collegamento agli strumenti di bordo.

### Perche' il browser non arriva agli strumenti (verificato, non supposto)

Il gateway che Sergio sta per comprare e' uno **Yacht Devices YDWG-02**
(NMEA 2000 -> Wi-Fi). Letto il manuale (YDWG02-010, marzo 2024, 64 pagine):
pubblica i dati **solo** su **TCP (porta 1456 di fabbrica) o UDP**, in NMEA
0183 o RAW. Le parole «WebSocket» e «JSON» **non compaiono mai**. Le «Web
Gauges» sono una pagina servita dal dispositivo, non un'API.

Una pagina web una socket TCP non la sa aprire: non esiste nel web. E c'e' una
beffa in piu' — il sito sta su GitHub Pages, quindi HTTPS, e una pagina HTTPS
non puo' nemmeno parlare in `ws://` o `http://` con un apparato locale
(contenuto misto). Quindi anche l'unica strada che il web concederebbe (un
SignalK via WebSocket) sarebbe chiusa dal fatto di essere pubblicati in HTTPS.

**La barca**: Raymarine SeaTalk NG, **i50** (profondita' e velocita') e **i60**
(vento). Niente bussola sul bus: nessun EV-1, nessun i70. Conseguenza pesante,
vedi sotto. Da comprare la variante **SeaTalk NG** del gateway (suffisso R),
non la DeviceNet.

### Cosa c'e' adesso

| file | |
|---|---|
| `rf-nmea.js` | il lettore: ES5, nessuna dipendenza, stessa forma di `rf-live.js` |
| `strumenti.html` | banco di prova: valori vivi + frasi grezze + indirizzo |
| `ponte_nmea.py` | TCP -> WebSocket, per provare tutto nel browser |
| `app/` | il guscio Capacitor 8 + il plugin Java della socket |
| finto gateway | in scratchpad: `finto_ydwg.py`, parla come il YDWG-02 |

Il parser **non e' duplicato** fra browser e app: il plugin nativo legge righe
e le passa a `rf-nmea.js`, che e' lo stesso file provato nel browser. Cambia
solo il tubo.

### Il TWD senza bussola: tre scelte, tutte visibili a schermo

Gli strumenti danno il vento **relativo alla prua** (TWA). Per avere il TWD —
il numero su cui `partenza/` calcola il lato favorito — serve sapere dove
punta la barca. Senza bussola si ricava dal COG, che e' un'altra cosa:
coincide con la prua solo senza scarroccio ne' corrente, e a bassa velocita'
balla. Quindi:

1. **e' sempre etichettato** «stimato dal COG — niente bussola», in giallo.
   Verde solo il giorno che arriva un sensore di prua;
2. **media circolare su 60 secondi** accanto all'istantaneo. Il COG contiene
   l'imbardata e il lato favorito sfarfallerebbe mentre lo leggi. La media e'
   a vettori: su valori attorno allo zero quella aritmetica darebbe il vento
   all'opposto (358 e 2 gradi -> 180);
3. **sotto 1,5 kn tiene l'ultimo valore buono** e dice da quanti secondi,
   invece di seguire un COG che a barca ferma e' rumore puro.

`partenza/` usa la media e torna a manuale da sola appena scrivi nel campo.

### Alternative scartate

**TWA (Trusted Web Activity).** Impacchetta la PWA in un APK pubblicabile, ma
dentro resta un browser: niente socket, niente GPS in background. Avrebbe dato
l'icona e nient'altro.

**Riscrivere nativo.** Sedici moduli, una persona.

**Un plugin di terze parti per le socket.** Scritto il nostro, un centinaio di
righe di Java: nessuna dipendenza da mantenere, e il codice che ci serve e'
esattamente quello che c'e'.

**`server.url` verso il sito pubblicato.** Comodo per provare, ma l'app
mostrerebbe `main`, dove `rf-nmea.js` non esiste. Il sito viene impacchettato
dentro l'APK da `app/prepara-sito.js`.

**Lasciare vivi i service worker dentro l'app.** Nel sito servono, nell'app no
— i file sono gia' nell'APK — e un SW che sopravvive a un aggiornamento
continuerebbe a servire la copia vecchia. `prepara-sito.js` inietta in ogni
pagina un guardiano che dentro l'app li annulla e ne cancella le cache.

### Cinque cose che si sono rotte, e come

1. **JDK 25 e' troppo nuovo** per il Gradle che Capacitor genera:
   `Unsupported class file major version 69`. Serve un JDK 21 (messo in
   `~/.local/jdk21`, insieme a `~/.local/node`).
2. **L'APK conteneva se' stesso.** Il file finito stava nella radice del sito
   e lo script di impacchettamento copia tutto: 8 MB di app con dentro 7,6 MB
   di app. Ora esce in `app/` e l'estensione `.apk` e' esclusa comunque.
3. **Le frasi arrivavano doppie** — scoperto sul tablet, guardando l'elenco
   delle frasi grezze. Cambiando l'indirizzo del gateway restavano attaccati
   gli ascoltatori vecchi *e* un secondo ciclo di lettura sul lato Java. I
   valori reggevano (rileggere la stessa frase da' lo stesso numero) ma al
   terzo cambio sarebbero state tre letture. Corretto in due punti: gli
   ascoltatori si registrano una volta sola, e il plugin ha un **numero di
   giro** — il ciclo vecchio, che puo' essere fermo su una `readLine()` e
   morire secondi dopo, smette di parlare appena non e' piu' il corrente. Era
   lui, col suo «fermo» di commiato in ritardo, a spegnere la spia a
   collegamento riuscito.
4. **I link a cartella si accumulavano.** Prima prova vera dell'APK in mano
   a Sergio: il menu non apriva i moduli, e quando apriva qualcosa l'indirizzo
   era diventato
   `https://localhost/performance/performance/cruscotto/cruscotto/...` fino
   all'errore. Dritta e' piena di link come `href="../"` e
   `data-href="cruscotto/"`: su un server web vero chiedere una cartella
   restituisce il suo `index.html` e l'indirizzo resta quello della cartella.
   **Il server locale di Capacitor non risolve le cartelle**: non trova il
   file, ripiega sulla index.html della radice, e a video ricompare il menu —
   ma all'indirizzo sbagliato, e il tocco dopo aggiunge un altro pezzo.
   Corretto in `prepara-sito.js`, che negli HTML che entrano nell'APK rende
   espliciti i link (`../` -> `../index.html`), href, data-href e
   `location.href` compresi. Il sito pubblicato **non** si tocca: li' quei
   link funzionano, e cambiarli sarebbe una modifica a quaranta file per un
   problema che li' non esiste.

5. **Schermata nera sul tablet, e NON era il codice.** Il Play Store ha
   aggiornato la System WebView mentre l'app girava; da quel momento
   `ActivityManager: Unable to launch app … SandboxedProcessService0: process
   is bad`. Il bridge partiva, la pagina veniva servita, ma non c'era nessun
   renderer a eseguirla: nero, zero errori. Messo un canarino
   (`console.log` a fine pagina) per distinguere «pagina morta» da
   «schermata che mente»: non parlava nemmeno lui, quindi la pagina davvero
   non girava — ma per colpa del sistema. **Cura: riavvio del tablet.** Da
   ricordare, perche' la prossima volta somigliera' a una regressione.

### Validazione

**Parser, contro il finto gateway** (jsc, senza barca e senza app):

| prova | esito |
|---|---|
| flusso consegnato a pezzi casuali da 1 byte | frasi ricostruite, nessuna persa |
| checksum, con una frase alterata | rifiutata, valore buono preservato |
| m/s, km/h, piedi, emisferi S/W | convertiti |
| vento reale ricalcolato dall'apparente, nel test | scarto **0,014 gradi** e **0,014 kn** da quello dichiarato |
| TWD ricostruito contro quello vero del simulatore | **0,05 gradi** |
| media circolare attorno allo zero | 0,1 gradi (l'aritmetica darebbe 180) |
| barca ferma, COG a 188 invece di 30 | tiene 315, non salta a 113 |
| flusso fermo | media **congelata**: prima scivolava da sola (319 -> 321 a stream fermo) |

**Nel browser**: `partenza/` col vento vero — TWD da 311 a 321 gradi, il lato
favorito da «PIN 43 gradi +343 m» a «PIN 32 gradi +270 m».

**Nell'app, sul tablet vero** (Active 8 Pro, Android 13, via Wi-Fi, col Mac a
fare da gateway): vento 320 gradi, 13,0 kn, apparente 52 gradi a sinistra,
velocita' acqua 5,7 kn, profondita' 15,6 m, temperatura 22,4 gradi, COG 33 —
frasi singole, un ciclo al secondo, spia «GATEWAY COLLEGATO». Riconnessione
provata staccando il gateway: `ENETUNREACH`, riprova ogni 3 secondi, riparte
da sola.

### Aperti

- **Il GPS in background non e' fatto.** E' l'altra meta' del motivo per cui
  esiste il guscio: il foreground service per la veglia d'ancora a schermo
  spento. La prova che decide: ancora in veglia, schermo spento, telefono in
  tasca, camminare oltre il raggio.
- **Il gateway vero non e' ancora arrivato.** Tutto e' provato contro una
  finta che parla come il manuale dice che parli il YDWG-02. Il primo
  collegamento vero puo' smentire qualcosa.
- **Firma di debug.** Per una cosa seria serve una chiave di release, e un
  modo di aggiornare il sito dentro l'app senza ricostruire l'APK.
- **L'app parte con localStorage vuoto**: profilo, waypoint e polari non
  arrivano dalla PWA. Si porta un backup da `impostazioni/`.
- **Solo `partenza/` legge gli strumenti.** `percorso/` (laylines e VMG),
  `cruscotto/` (STW) e `anchor/` (profondita' vera) usano ancora dati
  manuali: stesso schema, lavoro meccanico.
- **L'indirizzo del ponte e del gateway si imposta da `strumenti.html`**, non
  da `impostazioni/`. Va spostato quando la cosa smette di essere una prova.

---

## 22/09/2026 — L'APK alla prima prova vera: GPS muto, nessun file, nessuna via d'uscita

Prima prova dell'APK sul tablet, e quattro cose rotte tutte insieme. Sono
guaste **diverse** fra loro, ma hanno una radice comune: dentro una WebView
mancano tre servizi che nel browser si danno per scontati — il permesso di
posizione, lo scaricamento di un file e la barra di stato che non ti sta
addosso. Il sito non era sbagliato: era **ospitato male**.

### 1. Il GPS non agganciava, e non chiedeva nemmeno il permesso

Il sintomo: nessuna posizione, in nessun modulo, e **nessuna domanda a
video**. Quel «nessuna domanda» e' la traccia che conta: se Android avesse
chiesto e l'utente avesse negato, la domanda si sarebbe vista.

Il manifesto dichiarava un solo permesso, `INTERNET`. Quando la pagina chiama
`navigator.geolocation`, il ponte di Capacitor chiede ad Android
`ACCESS_FINE_LOCATION`: un permesso che il manifesto non nomina Android lo
nega **all'istante e in silenzio**, senza mostrare niente, e alla pagina
arriva un `PERMISSION_DENIED` indistinguibile da un rifiuto dell'utente.

Corretto aggiungendo `ACCESS_FINE_LOCATION` e `ACCESS_COARSE_LOCATION`, piu'
`uses-feature android.hardware.location.gps` con `required="false"`.

**Scartato: scrivere un plugin di posizione nativo.** Esiste
`@capacitor/geolocation`, e si sarebbe potuto anche fare in casa come per il
NMEA. Ma non serve: la WebView la geolocalizzazione ce l'ha gia' —
`setGeolocationEnabled(true)` lo fa Capacitor da se' — e un plugin in piu'
vorrebbe dire due strade per la stessa posizione, una nel browser e una
nell'app, che col tempo divergono. Mancava solo la riga nel manifesto.

**Non fatto: il GPS in background.** Resta quello che era, un punto aperto:
serve un foreground service, non un permesso.

### 2. Esportare non faceva niente, importare non mostrava niente

Due guasti diversi, uno per verso.

**In uscita.** Tutta Dritta esporta come esporta il web: Blob, URL
temporaneo, clic finto su un `<a download>` — otto punti fra tracce,
waypoint, polari, backup e rotte. In una WebView quel clic **non fa
assolutamente niente**: non c'e' un gestore di scaricamenti, e un URL `blob:`
non sarebbe scaricabile comunque, perche' quei byte stanno dentro la pagina e
non su un server. Nessun errore, nessun avviso: e' il caso peggiore, perche'
sembra che il bottone non risponda.

Ora il guardiano iniettato da `prepara-sito.js` intercetta il clic sui link
con `download`, rilegge il Blob e lo passa in base64 al plugin nuovo
**`SalvaPlugin`**, che scrive nella cartella Download vera del dispositivo e
lo dice con un avviso. Si intercettano due strade — `HTMLAnchorElement.click`
(il codice crea link mai attaccati al documento, che un ascoltatore sul
documento non vedrebbe) e il clic vero in cattura — perche' Dritta usa
entrambe.

**Scartato: toccare gli otto punti di esportazione.** Avrebbe voluto dire
otto file, una funzione condivisa in piu' e il sito pubblicato che cambia per
un difetto che li' non esiste. L'intercettazione sta in un posto solo, come
gia' il guardiano dei service worker e i link a cartella.

**Scartato: `DownloadListener` sulla WebView.** E' il modo canonico, ma
riceve solo l'URL, e da un `blob:` non c'e' niente da scaricare: i byte
bisogna comunque farseli dare dalla pagina.

**In entrata.** `<input type="file" accept=".gpx">` nell'app apriva un
selettore **vuoto**, o non lo apriva affatto. Capacitor traduce ogni
estensione dell'`accept` in un tipo MIME usando la tabella di Android, che
`.gpx` non ce l'ha: con una sola estensione la lista tradotta e' vuota, con
`.gpx,application/gpx+xml` il selettore parte filtrato su un tipo che nessun
gestore di file assegna ai .gpx — che arrivano come `application/octet-stream`
— e i file compaiono spenti, non selezionabili. **Ed e' il motivo per cui
l'app non si lasciava nemmeno riempire con un backup**: `accept` del backup
e' `application/json,.json`, stessa trappola.

Ora `prepara-sito.js` allarga il filtro a «qualsiasi tipo» in tutti gli
`accept`, tranne dove Android sa davvero rispondere: `image/*`, `video/*` e
`application/pdf` (che servono anche alla scorciatoia fotocamera di
`manutenzione/`). Si sceglie l'un contro l'altro: filtro giusto e file
invisibili, oppure tutti i file e l'utente che riconosce il suo.

### 3. La barra in alto stava sotto la barra di stato

Sergio l'ha vista da `strumenti.html` — «non si torna indietro, manca
l'icona in alto a sinistra» — ma **non era un difetto di quella pagina sola**.
Da Android 15 la WebView e' a tutto schermo e la barra di stato del sistema
le sta sopra: `rf-topbar`, fissata a `top:0` e alta 40px, finiva **interamente
sotto** l'orologio e le icone di sistema. Il tasto home c'era, disegnato, e
non si poteva toccare. In tutti i moduli.

La correzione sta in `rf-topbar.js`, il file che tutti caricano:
`--rf-sicuro: env(safe-area-inset-top,0px)` e `--rf-barra: calc(40px + var(--rf-sicuro))`.
La barra si alza dell'inset, e il `padding-top` del corpo lo segue. Nel
browser e sul desktop l'inset vale 0 e non cambia niente. Perche' `env()`
non torni 0 serve `viewport-fit=cover` nel meta viewport: mancava in cinque
pagine (`cruscotto/`, `performance/`, `partenza/`, `manutenzione/`, `xte/`),
aggiunto. In `mob/` i due `calc(100dvh - 40px)` diventano
`calc(100dvh - var(--rf-barra,40px))`.

**Scartato: rinunciare al tutto schermo lato Android**
(`windowOptOutEdgeToEdgeEnforcement`). Sarebbe stata una riga sola e zero
modifiche al sito, ma e' una deroga che Android smette di rispettare per chi
punta all'SDK 36 — cioe' noi, gia' adesso: sull'emulatore Android 17 non ha
effetto. Rispettare le safe area e' la strada che regge.

E `strumenti.html` la barra non ce l'aveva proprio: aggiunta col markup
canonico degli altri moduli, home a `./` (che nell'APK diventa
`./index.html`).

### 4. L'icona era ancora quella di Capacitor

Nel lanciatore c'era il robottino del modello, e all'avvio il logo di
Capacitor su fondo bianco. Dritta la sua icona ce l'ha gia' — la barca su
fondo blu della PWA — quindi non se ne disegna un'altra: **`app/fai-icone.py`**
la ricava da `pwa-maskable-512.png`.

Il punto meno ovvio e' la separazione della barca dal fondo: l'icona e' un
PNG senza trasparenza. Il fondo pero' e' una sfumatura radiale regolare,
descritta da tre numeri (centro a un quarto del lato, lineare da (26,55,90) a
(8,21,37)); si ricostruisce e si confronta, e dove il pixel e' piu' chiaro
del fondo previsto c'e' disegno. Errore massimo del modello, misurato sui
pixel senza disegno: **8,6 su 255**, contro una soglia di 12 da cui l'alfa
comincia a salire.

L'altro punto: l'icona adattiva si disegna su 108dp ma se ne vedono i 72dp
centrali, e il ritaglio puo' essere tondo. Nell'icona della PWA la barca
arriva a 0,348 del lato dal centro; rimpicciolita a 0,306 sta dentro il
cerchio sicuro. Senza, le creste delle onde restavano fuori.

Prodotti: i cinque `ic_launcher_foreground.png`, le icone piene quadrata e
tonda, il fondo come sfumatura vettoriale (`drawable/ic_launcher_background.xml`)
e le undici `splash.png`. Da Android 12 pero' la schermata d'avvio non e'
piu' un'immagine: il sistema disegna l'icona dell'app su una tinta unita, e
l'unica cosa che l'app decide e' il colore — `windowSplashScreenBackground`
in `styles.xml`, `#0C1E33`. Senza, l'avvio era un lampo bianco.

### Verificato

Su emulatore **Pixel 10, Android 17** (il tablet vero non era collegato),
APK di debug installato di lato:

| prova | esito |
|---|---|
| posizione | **compare la richiesta di permesso**, concessa: fix 42,1050 / 14,7050 con 5 m, cioe' la posizione finta iniettata nell'emulatore |
| `carta/` | la mappa si apre sul punto giusto, spia GPS verde in barra |
| esportazione backup da `impostazioni/` | file in `Download/Dritta-backup-20260922-0435.json`, contenuto corretto, avviso a video |
| importazione backup | il selettore mostra **tutti** i file, il .json si legge, profilo ripristinato |
| importazione GPX in `carta/` | «Importati: 2 waypoint, 1 tracce» |
| barra in alto | sotto la barra di stato, tasto home libero, in tema Scuro e Giorno |
| `strumenti.html` → tasto home | torna all'hub (`https://localhost/index.html`) |
| icona nel lanciatore | la barca di Dritta |
| schermata d'avvio | icona Dritta su fondo blu |
| icone di sistema in tema Giorno | nere su barra bianca, leggibili |

### Verificato sul tablet vero

Poi `main` e' stata fusa nel ramo, l'APK ricostruito e installato sul tablet
di bordo (**Ulefone Armor Pad 3 Pro "Active 8 Pro", Android 13, 1200x2000**),
sui dati veri di Raffyca:

| prova | esito |
|---|---|
| posizione | **compare la richiesta di permesso**, in italiano; concessa, fix in **1 secondo con 15 m** di errore dichiarato |
| esportazione backup da `impostazioni/` | `Download/Dritta-backup-20260922-0510.json`, 4,6 kB, avviso «Salvato in Download/…» |
| importazione dello stesso file | il selettore mostra **tutti** i file, il .json si legge, le voci tornano identiche — giro completo senza toccare un dato |
| `strumenti.html` → tasto home | torna all'hub |
| icona nel lanciatore e all'avvio | la barca di Dritta |
| `calcoli/` e `prontuario/` nell'elenco dell'hub | ci sono: la fusione e' dentro l'APK |

**Su Android 13 le safe area valgono zero** (`env(safe-area-inset-top)` = 0,
la barra resta alta 40px): la WebView li' non e' ancora a tutto schermo. La
correzione della barra quindi **su questo tablet non cambia niente** — serve
ad Android 15 e oltre, dove il difetto e' stato visto. Provata sull'emulatore
e verificata come non-regressione qui.

### Aperti

- **La cartella Download pubblica si usa solo da Android 10 in su.** Sotto,
  `SalvaPlugin` scrive nella cartella dell'app: raggiungibile, ma scomoda.
  Scelta deliberata, per non chiedere `WRITE_EXTERNAL_STORAGE` a tutti per un
  caso che sul tablet di bordo non si presenta.
- **Se Android uccide l'app mentre il selettore di file e' aperto, al ritorno
  si riparte dall'hub e l'importazione si perde in silenzio.** Visto una
  volta sull'emulatore a 2 GB (l'ha ucciso il lowmemorykiller), non piu' a 4.
  Non e' stato affrontato: vorrebbe dire salvare e ripristinare la pagina
  corrente.
- **L'inset in basso (24px di barra dei gesti) non e' gestito** se non in
  `percorso/`, che gia' lo faceva. Nei moduli a tutta altezza — `cruscotto/`
  per primo — l'ultima riga di riquadri finisce sotto la barra dei gesti.
  Si e' scelto di non mettere una regola globale su `body`: sono diciassette
  layout e non tutti hanno `box-sizing:border-box` sul corpo, quindi una
  riga sola potrebbe aggiustarne uno e rompere gli altri. E' un ritaglio,
  non un blocco.
- **`main` e' stata fusa dentro `capacitor` subito dopo queste prove**, cosi'
  l'APK contiene anche `calcoli/`, `prontuario/`, `sole-luna/` e `percorso/`
  nella versione buona. Due conflitti, tutti e due previsti: la versione del
  service worker dell'hub (tenuta **v22**, che scavalca la v21 di `main`) e
  la coda di questo file, dove le due voci «21/09 (3)» sono state rimesse in
  ordine — quella di `main` resta la (3), il guscio Android diventa la (4).
  `partenza/index.html` non ha dato conflitto: `main` non l'aveva toccata
  dopo la biforcazione. Le prove sull'emulatore sono di PRIMA della fusione,
  quelle sul tablet di dopo.
- **Service worker**: alzati `dritta-hub-v20 → v22` (v21 esiste gia' su
  `main`, e saltarlo evita che chi ha preso quella versione resti con la
  cache vecchia), `xte-v11 → v12`, `raffyca-meteo-v19 → v20`,
  `anchor-v17 → v18`, `raffyca-rt-v24 → v25`. Dentro l'app i service worker
  restano spenti dal guardiano: i bump servono al sito.

---

## 22/09/2026 (2) — Il QR mandava a casa propria, e nella WebView non parla nessuno

Seconda prova dell'APK sul tablet, in serata. Tre segnalazioni, due guasti
veri e una cosa che con Dritta non c'entra.

### 1. Il QR della Posizione Live portava a `localhost`

Sintomo: si inquadra il QR con un telefono qualunque e Chrome dice
**«Impossibile raggiungere il sito — Connessione negata da localhost»**,
`ERR_CONNECTION_REFUSED`, su un indirizzo `localhost/posizione/segui.html`.

Il link lo costruiva `new URL("segui.html#"+session(), location.href)`. Nel
browser, servito da GitHub Pages, quello e' giusto. Dentro l'APK
`location.href` e' `https://localhost/posizione/index.html`, perche' il
server di Capacitor vive li': il QR finiva per contenere «localhost», e chi
lo inquadra con un ALTRO telefono chiama se' stesso, dove non risponde
nessuno. Lo stesso succede col server di prova su `localhost:8765`.

E' un difetto di ragionamento, non di ambiente: **chi segue da terra sta
sempre su un altro dispositivo**, quindi quel link non puo' mai essere
relativo a dove gira il trasmettitore. Ora `baseCondivisione()` riconosce le
origini locali (`localhost`, `127.0.0.1`, `[::1]`) e in quel caso punta al
sito pubblico; da un sito vero resta relativo com'era.

Questo introduce la seconda costante di tutto il repo che conosce il proprio
indirizzo in rete — `SITO_PUBBLICO` in `posizione/index.html`, accanto alla
chiave in `segui.html`. **Scartato: dedurlo.** Non c'e' niente da cui
dedurlo: dentro l'APK non esiste alcuna traccia di dove il sito sia
pubblicato. **Scartato anche metterlo in `raffyca-supabase` o in una
impostazione**: sarebbe una domanda in piu' all'utente per un dato che
cambia solo se cambia il repository.

### 2. La lettura vocale non funzionava — ne' nel Cruscotto ne' nel VHF

Non era un difetto del codice: **la WebView di Android non implementa la Web
Speech API**. Misurato sul tablet, `typeof window.speechSynthesis` =
`"undefined"`. Le due pagine se ne accorgono e si spengono con garbo — il
Cruscotto mostra «voce non supportata dal browser», il Prontuario disabilita
il tasto con «Voce non disponibile» — ed e' per questo che sembrava una
funzione mancante e non un guasto.

Nuovo **`VocePlugin`** (TextToSpeech nativo) piu' un guardiano iniettato da
`prepara-sito.js` che costruisce un finto `window.speechSynthesis` e un
finto `SpeechSynthesisUtterance` sopra il plugin.

**Scartato: cambiare le due pagine** perche' chiamassero il plugin. Sarebbe
stato piu' diretto, ma avrebbe creato due strade per la stessa cosa — una
per il browser e una per l'app — che col tempo divergono; ed e' esattamente
l'errore che il progetto ha gia' evitato col parser NMEA. Imitando l'oggetto
standard, `cruscotto/` e `prontuario/` non sanno niente di tutto questo.

**Scartato: un plugin di terze parti** (`@capacitor-community/text-to-speech`).
Fa di piu' di quel che serve, aggiunge una dipendenza da aggiornare, e la
parte difficile non e' parlare: e' la **coda**. Il Prontuario accoda quattro
frasi in un colpo e mette `onend` solo sull'ultima, quindi il finto
`speechSynthesis` deve tenere la corrispondenza fra frase e callback. La
tiene una mappa id → utterance, e gli eventi `inizio`/`fine`/`errore` del
plugin la consumano; la coda vera la fa Android con `QUEUE_ADD`.

### 3. keepalive Supabase: non e' Dritta

Il workflow fallisce **in 3 secondi**, che e' il tempo di arrivare al
controllo dei segreti e uscire. Provata la stessa chiamata dal Mac con la
chiave pubblica del progetto: `POST /rest/v1/rpc/get_pos` → **HTTP 200**,
corpo `null`, cioe' esattamente quello che il workflow si aspetta. Quindi
il workflow e' giusto e mancano i due segreti su GitHub
(`SUPABASE_URL`, `SUPABASE_ANON_KEY`), o sono rimasti al formato vecchio.
Non e' una cosa che si aggiusta nel repo.

### Verificato sul tablet

Active 8 Pro, Android 13, APK ricostruito e installato:

| prova | esito |
|---|---|
| link da condividere | `https://smacc8.github.io/provela/posizione/segui.html#…` — non piu' localhost; QR rigenerato |
| quel sito risponde davvero | `HTTP 200` sia sulla radice sia su `posizione/segui.html` |
| `speechSynthesis` nell'app | da `undefined` a `object`, `SpeechSynthesisUtterance` a `function` |
| motore vocale | `{pronto:true, lingua:"it-IT", italiano:true}` |
| due frasi accodate | inizio A a 382 ms, fine A a 3,4 s, fine B a 6,0 s: ordine e `onend` come nel browser |
| Prontuario → VHF → «Leggilo» | tasto abilitato, legge le quattro righe, e a fine lettura torna da solo a «▶ Leggilo» |
| Cruscotto → tasto voce | si accende e resta acceso, nessun avviso di voce non supportata |

### Service worker

**Nessun bump.** `posizione/index.html` non sta nel precache di nessun
service worker (l'hub precachea `rf-live.js`, non il pannello), e le
navigazioni l'hub le serve network-first. La correzione della voce non tocca
nemmeno un file del sito: vive tutta nel guscio Android.

### Aperti

- **`SITO_PUBBLICO` e' scritto a mano.** Se il repository cambia nome — e il
  nome `provela` e' gia' fuori tempo — il QR punta a un indirizzo morto
  senza che niente protesti. E' il solito difetto silenzioso: il codice
  continua a sembrare giusto.
- **La voce non e' stata provata in cuffia ne' col Bluetooth acceso**, che a
  bordo e' il caso vero.
- **Il tasto «Ferma» del VHF non e' stato provato a meta' lettura**: la
  lettura e' stata lasciata finire da sola.
- **Se il motore vocale del dispositivo non ha l'italiano**, `stato()` lo
  sa dire ma nessuna pagina lo chiede: si sentirebbe una voce inglese che
  legge parole italiane. Sul tablet l'italiano c'e'.

---

## 24/09/2026 — La veglia d'ancora a schermo spento, e cinque difetti trovati provandola

Giornata dei punti in coda: il GPS in background, `SITO_PUBBLICO` meno
fragile, i pallini di Sole e Luna, e una domanda di Sergio sulle carte
raster senza rete. Il pezzo grosso e' il primo, e la parte che vale di piu'
di questa voce sono i difetti che le prove hanno tirato fuori — tre erano
miei, di questa settimana, e uno faceva **morire l'app**.

### 1. La veglia d'ancora a schermo spento

**Il limite di partenza**, dichiarato fin dal 21/07: in `anchor/` l'allarme
suona solo con la pagina davanti e lo schermo acceso. Col tablet in tasca
Android sospende il JavaScript, la posizione smette di arrivare e la veglia
e' cieca senza dirlo.

**Com'e' fatto adesso** (solo nell'APK; nel browser non cambia niente):

- `VegliaService`, servizio in primo piano di tipo *location*: tiene il GPS
  a schermo spento, un `PARTIAL_WAKE_LOCK` perche' il controllo del GPS
  fermo giri anche fra un fix e l'altro, e una notifica fissa «Veglia
  d'ancora accesa · 12 m dall'ancora · raggio 40 m».
- **Il suono lo fa sempre il servizio**, sulla suoneria sveglia di sistema
  (stream sveglia: si sente anche col telefono in silenzioso), piu'
  vibrazione e notifica a tutto schermo che accende lo schermo e apre
  **Ancoraggio**, da qualunque pagina si fosse.
- **Chi decide se suonare, invece, cambia.** Finche' `anchor/` e' aperta e
  visibile batte ogni secondo (`rfVeglia.presente(allarme)`) e decide lei,
  col modello completo: centro stimato col fit, deriva, silenzio di cinque
  minuti. Quando il battito si ferma — schermo spento, app dietro, un'altra
  pagina di Dritta — decide il servizio, con le due regole che non hanno
  bisogno di storia: fuori dal raggio per **tre fix di fila**, oppure
  **nessun fix da tre minuti** (lo stesso `FIX_CIECO` della pagina).
- Al rientro la pagina si riprende i fix raccolti dal servizio
  (`recuperaDalServizio`), cosi' il fit del cerchio non ha un buco lungo
  quanto il sonno.
- Ponte lato pagina: `rf-veglia.js` in radice. Senza il plugin — cioe' nel
  browser — ogni chiamata e' senza effetto.

**Scartato: `ACCESS_BACKGROUND_LOCATION`.** Era quello che mi aspettavo di
dover chiedere (lo avevo scritto martedi'). Non serve: un servizio
*location* avviato con l'app in uso — il tocco su «Cala ancora» — conserva
il permesso «mentre usi l'app» anche a schermo spento. Il permesso «sempre»
costringerebbe l'utente a un giro nelle impostazioni di sistema, e servirebbe
solo per partire dal background, che qui non succede mai.

**Scartato: rifare in Java il modello della pagina** (fit di Kasa, deriva).
Due copie della stessa logica che divergono: l'errore che il progetto evita
dal parser NMEA in poi. Il servizio fa solo le due regole senza storia, la
pagina il resto quando c'e'.

**Una differenza voluta** fra pagina e servizio: il servizio vuole tre fix
consecutivi fuori raggio, la pagina uno. Nella pagina un falso allarme costa
un'occhiata; col telefono in tasca sveglia qualcuno alle tre di notte. A un
nodo di deriva tre secondi sono un metro e mezzo.

### 2. I difetti che le prove hanno tirato fuori

Tutti sull'emulatore (Pixel 10, Android 17), a schermo spento, con la barca
spostata di 100 m. **Nessuno si vedeva rileggendo il codice.**

**a) Undici secondi muti.** `MediaPlayer.prepare()` sincrono sulla suoneria
di sistema: lettore creato alle 09:33:05, partito alle 09:33:16. E la
notifica a tutto schermo, pubblicata dopo, ha acceso lo schermo con lo
stesso ritardo. Ora la notifica va per prima e la suoneria si prepara in
modo asincrono.

**b) Otto secondi di thread principale fermo.** Spostata la notifica in
testa, lo schermo si accendeva in 0,4 s, ma la sola creazione del
`ToneGenerator` bloccava il processo dalle 09:37:31,65 alle 09:37:39,7:
l'audio di un dispositivo assopito si sveglia con calma. Sul thread
principale passano i fix e il controllo del GPS fermo — cioe' la veglia era
cieca proprio mentre suonava. Tutto l'audio ora sta su un thread suo.

**c) La pagina muta.** La prima versione faceva suonare la pagina (WebAudio)
finche' era davanti, e il servizio solo dopo. Ma il WebAudio si arma solo
con un tocco: riaprendo la pagina dalla notifica d'allarme la pagina diceva
«guardo io», il servizio taceva, e **non suonava nessuno**. Da qui la regola
del punto 1: nell'app la pagina non suona mai, decide soltanto.

**d) Due suonerie, una non piu' tacitabile.** Al rientro la pagina, appena
aperta e senza ancora una posizione, diceva «allarme no»; il servizio
fermava e ripartiva, e il vecchio lettore restava vivo accanto al nuovo —
irraggiungibile, cioe' non piu' spegnibile. Due correzioni: la pagina
decide solo con un fix fresco (prima tace, e decide il servizio), e l'audio
non crea mai un secondo lettore.

**e) Il silenzio sopravviveva alla calata.** «Tacita 5 min», poi «Salpa» e
una nuova calata entro cinque minuti: la veglia nuova partiva muta
(`motivo: fuori`, `suona: false`). Il silenzio era statico nel servizio e
nessuno lo azzerava. Ora ogni calata e ogni salpata lo azzerano.

### 3. L'app tornava all'hub, e poteva morire

Durante le prove l'app e' tornata da sola sull'hub a veglia appena calata.
Non era un mio comando: `configuration_changed 0x80000000` — gli «asset
path», cioe' un cambio degli overlay di tema o un aggiornamento della
WebView — e Android **ha ricreato l'attivita'**. Capacitor a ogni creazione
carica la pagina iniziale: la veglia d'ancora spariva dallo schermo. Quel
cambio non si puo' dichiarare in `configChanges`, non ha un nome.
`MainActivity` ora salva l'indirizzo della pagina e alla ricreazione la
riapre.

Riprodotto a comando cambiando la dimensione del carattere
(`settings put system font_scale 1.15`), e li' e' venuto fuori il peggio:
**il `VocePlugin` di martedi' faceva morire l'app.** L'avvio del motore
vocale e' asincrono, e la sua callback arrivava dopo che la ricreazione
aveva distrutto il plugin: `NullPointerException` su un campo gia' a null,
processo morto. Quindi un cambio di sfondo col colore dinamico, a bordo,
avrebbe chiuso Dritta. Corretto: l'ascoltatore si aggancia subito, il resto
si fa dopo e solo se il motore e' ancora il nostro. Provato con quattro
ricreazioni di fila: app viva, pagina al suo posto, voce pronta.

E probabilmente e' questa, e non la memoria scarsa, la spiegazione del
«ritorno all'hub dopo il selettore di file» del 22/09 — anche se allora il
processo era morto davvero (pid nuovo), quindi i casi erano due.

### 4. Le carte raster senza rete

La domanda di Sergio: le carte georeferenziate stanno su Supabase, e in mare
senza internet? **Le immagini stanno in locale**, in IndexedDB — Supabase le
distribuisce, non le sostituisce, ed era gia' cosi'. **Ma c'era un buco:**
`rsSyncImmagini()` mandava sul cloud le immagini che mancavano la', e saltava
quelle che mancavano QUI («non tocca a noi»). Un'immagine arrivava su un
dispositivo solo APRENDO quella carta. Una carta calibrata sul Mac e mai
aperta sul tablet prima di partire, in mare non c'era. Ora appena si apre
Carta con la rete si scaricano tutte quelle che mancano.

**Resta aperto, e va detto chiaro:** le piastrelle della **mappa di base**
(OpenStreetMap, OpenSeaMap, Esri) non si tengono offline da nessuna parte —
`carta/` non ha service worker, e nell'APK i service worker sono spenti. In
mare senza rete la carta raster, il GPS, i waypoint e le tracce ci sono; lo
sfondo intorno no.

### 5. `SITO_PUBBLICO` meno fragile

Due guardie, una per momento.

- **Quando si costruisce l'APK**, `prepara-sito.js` ricava l'indirizzo di
  GitHub Pages dal remote git (`utente.github.io/repo/`, oppure il dominio
  del file `CNAME`) e **si ferma** se `SITO_PUBBLICO` non combacia. Provato
  con un repo finto rinominato in `dritta` e con un `CNAME`: esce con errore
  in tutti e due i casi. Poi bussa alla pagina: quello e' solo un avviso,
  perche' si deve poter costruire senza rete.
- **Nell'app**, sotto il link della Posizione Live, se l'indirizzo non
  risponde compare un avviso rosso prima che il QR finisca in mano a
  qualcuno. **Trappola trovata provandolo:** GitHub Pages manda
  `Access-Control-Allow-Origin: *` sulle pagine che esistono ma NON sul 404,
  quindi una `fetch` su un indirizzo morto fallisce come se mancasse la rete
  — e non avvisava. Nell'app si usa la richiesta nativa di Capacitor, che il
  CORS non lo conosce.

### 6. Sole, Luna e maree — i pallini

Nel grafico «Altezza sull'orizzonte» i pallini di adesso erano di 4 e
3,5 px, sopra una curva del loro stesso colore. Ora 7 e 6,5 px, con un
alone e un bordo nel colore del testo, che li stacca in tutti e tre i temi.

### Verificato

Sull'emulatore, con la barca spostata di 100 m:

| prova | esito |
|---|---|
| calata | chiede il permesso notifiche; servizio in primo piano, tipo `location` (0x8) |
| schermo spento, barca fuori (quattro prove) | allarme 3 s dopo lo spostamento (i tre fix); dall'allarme: **primo bip fra +0,02 e +0,25 s**, schermo acceso fra +0,5 e +0,8 s, suoneria sveglia fra +0,2 e +1,8 s |
| rientro | pagina su Ancoraggio, «ARANDO», **una** suoneria che continua |
| «Tacita 5 min» dalla pagina | silenzio; a schermo spento, ancora fuori raggio, il servizio rispetta i cinque minuti |
| tacita, salpa e ricala subito | la veglia nuova suona (difetto e) |
| app sull'hub, barca fuori | il servizio suona: il battito si e' fermato |
| app sul Meteo, schermo spento, barca fuori | lo schermo si accende **su Ancoraggio** |
| localizzazione spenta | «GPS FERMO» a 180 s esatti, notifica e suono |
| «Salpa» | servizio fermo, nessuna notifica |
| app aggiornata con ancora calata | riaprendo Ancoraggio il servizio riparte da solo |
| quattro ricreazioni di fila | app viva, pagina al suo posto, voce pronta |
| `anchor/` nel browser | invariata: allarme col WebAudio, avviso «non allarme in background» |
| costruzione dell'APK | controllo di `SITO_PUBBLICO` passato; con repo rinominato si ferma |

### Service worker

`dritta-hub-v22 → v23` (`sole-luna/` e' nel precache dell'hub);
`anchor-v18 → v19`, con `../rf-veglia.js` aggiunto al precache. `carta/` e
`posizione/` non stanno in nessun precache.

### Aperti

- **Niente di questo e' stato provato sul tablet.** Era scollegato. La prova
  che decide resta quella di martedi': ancora calata, schermo spento, tablet
  in tasca, camminare oltre il raggio. In piu', sul tablet vero: il volume
  **sveglia** (se e' a zero non si sente niente, e Dritta non lo alza da se'),
  il blocco con PIN (l'allarme deve continuare finche' non si sblocca), e le
  ottimizzazioni della batteria di Ulefone, che potrebbero chiudere il
  servizio dopo ore.
- **Nessuna prova lunga.** La piu' lunga e' di pochi minuti. Una notte vera
  e' un'altra cosa: consumo, e se Android tiene vivo il servizio.
- **A schermo spento la deriva del centro non suona**: il servizio non ha il
  fit. Si vede riaprendo. Scritto anche nell'avviso della pagina.
- **Il registratore di tracce di `rf-topbar.js` non usa il servizio**: una
  traccia registrata col telefono in tasca ha ancora i buchi. Il servizio
  raccoglie gia' i fix; collegarli al registratore e' il passo dopo.
- **Le piastrelle della mappa di base non sono offline** (punto 4).
- **Queste correzioni stanno sul ramo `capacitor`, non su `main`**: il sito
  pubblicato non ha ancora i pallini nuovi, il prefetch delle carte ne' il
  controllo del link.

---

## 28/09/2026 — Dopo l'uscita notturna: la barca rossa, il crocino, la partenza che segnava mezzanotte

Prima prova lunga dell'APK a bordo: 50 miglia di notte, tablet in murata su
supporti magnetici. Sei punti da sistemare, tutti fatti sul ramo `capacitor`
(worktree `ProVela-capacitor`); **`main` non e' toccata**.

### 1. Carta: la barca era verde su azzurro

Il «cursore» e' il segnaposto della posizione, pallino da fermi e triangolo
orientato sulla COG sopra mezzo nodo. Era `#2BD9C4`, il colore d'accento
della suite: sulla base nautica chiara, cioe' sul mare azzurro, non si
trovava. Ora `POS_COL = #FF2D2D` con bordo bianco piu' spesso. Scelto il
rosso perche' nessun altro segno della carta lo usa a quell'intensita' (la
scia di registrazione e' magenta). Il bottone ◎ «segui» resta acqua: e' un
controllo, non un segno sulla mappa.

### 2. Carta: crocino al centro con distanza e rilevamento

Quando la carta **non** segue la barca compare un crocino al centro con
un'etichetta «2,77 M · 038°»: distanza e rilevamento vero **dalla barca al
centro**, cioe' la rotta da tenere per andarci. Una linea tratteggiata sottile
unisce barca e centro, perche' con la carta molto spostata la barca e' fuori
schermo e la linea dice da che parte sta. Sparisce col «segui» acceso (il
centro e' la barca) e quando il centro cade a meno di 12 px dal segnaposto.
Senza posizione il crocino resta e mostra le coordinate del centro. Sotto
0,1 M la distanza e' in metri.

Scartato: usare il mirino del raster (`.rmark`), che e' un'altra cosa — si
posa dove si tocca un'immagine da calibrare, non sta sulla mappa.

### 3. Traversata: «A = qui»

Bottone **📍 A = qui** accanto a «Muovi A/B». Chiede un fix vero; se il GPS
tace ripiega su `raffyca-pos` purche' abbia meno di 15 minuti, e lo dice
(«ultimo fix, 5 min fa»). **Fuori dalla zona di calcolo A non si mette**:
`setAB` la schiaccerebbe sul bordo del riquadro, cioe' in un posto dove non
sei, senza avvisare. Si dice invece quale zona scegliere, cercando la
posizione nei `ZONE_BOX`.

### 4. Traversata: la partenza a mezzanotte — due difetti sovrapposti

La partenza era un **indice fisso** nel campo vento (`STATE.dep = 2`) e il
campo comincia alla mezzanotte di oggi. Quindi alle 02:00, gia' passate.
Ma la mezzanotte vista a bordo veniva da un secondo difetto, silenzioso: il
campo **sintetico** con cui la pagina si apre scriveva le ore con
`toISOString()`, cioe' in **UTC**. La mezzanotte locale diventava «22:00» del
giorno prima, e l'indice 2 si leggeva «00:00». Riprodotto su `main` nel
pannello: `t0 = 2026-09-27T22:00`, «Partenza 00:00» alle 06:11 del 28.
Anche `parseOraLocale` e quindi la «luce all'arrivo» ragionavano su un'ora
sbagliata di due, col campo sintetico.

Correzioni:

- campo sintetico in ora locale (`oraLocaleISO`) e di **48 ore**, non 24:
  la sera non restava orizzonte per partire;
- `syncDep()`: il cursore della partenza parte dall'**ora in corso**
  (`idxAdesso`) e non torna indietro; il massimo lascia almeno 12 ore di
  vento dopo la partenza. Se il campo e' tutto passato (dati vecchi, senza
  rete) resta sull'ultima ora disponibile — l'«ultima disponibilita'» della
  domanda;
- la scelta si salva come **ora** (`depT` in `raffyca-traversata-ui`), non
  come indice: un indice salvato ieri oggi vuol dire un'altra ora. Il vecchio
  `u.dep` si ignora; nessuna migrazione serve, e' una chiave di modulo;
- con la rete **il vento reale si carica da solo** all'apertura e a ogni
  cambio di zona. Prima si apriva sul campo sintetico e bisognava ricordarsi
  «⟳ Carica vento reale»: a bordo la rotta mostrata era quella di un vento
  inventato. Senza rete resta il sintetico, e la pastiglia lo dice. Un
  contatore (`LIVE_SEQ`) scarta le risposte arrivate tardi: tutte le zone di
  profilo si chiamano `custom`, quindi il nome dell'area non basta a capire
  se il campo e' ancora quello giusto;
- l'ora si scrive col giorno quando non e' oggi («mar 06:00»): con 96 ore di
  campo «06:00» da solo e' ambiguo. Vale per partenza, vento in carta,
  readout e scansione;
- «Trova il miglior orario» scandisce da adesso, non dalla mezzanotte; le
  etichette del grafico usavano la posizione della barra come indice del
  campo, corretto;
- il nome della rotta salvata porta la **data della partenza**, non quella
  di oggi.

### 5. Traversata: frecce del vento

Mezza lunghezza da `clamp(6+0,6·tws, 8, 16)` a `clamp(7,5+0,75·tws, 10, 18)`,
testa larga 5,2 invece di 7 (il marker scala con lo spessore 2,2, quindi era
una punta di 15 px per lato). Provato anche il tetto a 20: a zoom di zona le
frecce vicine si toccavano, tenuto 18.

### 6. La barra di sistema copriva le funzioni (telefono «G15»)

Riprodotto sull'emulatore Android 17 con navigazione **a tre tasti**: il piede
dell'hub finiva sotto i tasti, e le icone della barra di stato erano scure su
fondo scuro. E' l'«inset in basso non gestito» lasciato aperto il 22/09.

Il meccanismo, letto in `SystemBars.java` di Capacitor 8.5: con
`viewport-fit=cover` e WebView 140+, il plugin **passa le barre alla
pagina** e si aspetta che la pagina le scansi con `env()`. `rf-topbar.js` lo
fa per quella in alto; per quella in basso nessuno. Senza `cover`, lo stesso
plugin fa l'altra cosa: **imbottisce la finestra** di quanto sono alte le
barre, sopra e sotto.

Correzione, tutta lato APK:

- `prepara-sito.js` toglie `viewport-fit=cover` dalle copie che entrano
  nell'APK (`senzaCover`). Tutti i moduli insieme, senza toccarne uno;
  `env()` torna 0 e la barra di Dritta resta a 40px, niente doppio margine;
- `styles.xml`: `windowBackground` = `@color/dritta_fondo`, il colore delle
  due strisce;
- `capacitor.config.json`: `SystemBars.style = DARK`, icone chiare.

Scartato: una regola `padding-bottom: env(safe-area-inset-bottom)` globale in
`rf-topbar.js` — e' la stessa strada scartata il 22/09 per le stesse ragioni
(diciassette impaginazioni, corpi a `100vh`/`100dvh` e barre fisse diverse in
ogni modulo). Scartato anche il ritorno a `windowOptOutEdgeToEdgeEnforcement`,
che con `targetSdk 36` Android non rispetta piu'.

**Resta aperto per la PWA**: il sito pubblicato tiene `cover` (serve su
iPhone), quindi la PWA installata da Chrome su un Android 15 ha ancora il
difetto, e li' va affrontato modulo per modulo. Il G15 usa l'APK (vedi sotto).

### Verificato

| prova | esito |
|---|---|
| Traversata su `main`, pannello, 06:11 | riprodotto: `t0 22:00`, «Partenza 00:00» |
| Traversata corretta, primo avvio | vento live caricato da solo, partenza 06:00, cursore 6–83 |
| partenza spostata a mar 06:00, pagina riaperta | torna a «mar 06:00», `depT` salvato |
| 📍 con fix in zona | A spostata, «A → la tua posizione» |
| 📍 con fix a 43,6 N (fuori Alto Adriatico) | A ferma, «scegli «Medio Adriatico», poi di nuovo 📍» |
| 📍 con GPS in errore e `raffyca-pos` di 5 min | A dall'ultimo fix, lo dice |
| scansione orari | da 06:00 di oggi a mer 06:00 |
| Carta, pannello, carta spostata | «2,77 M · 038°», uguale al calcolo indipendente `hav`/`brng` |
| Carta, «segui» acceso | crocino e linea spariti |
| APK su emulatore Android 17, tre tasti | piede dell'hub sopra i tasti, ultima fila del Cruscotto intera, icone di stato chiare su blu |
| APK sul tablet vero, Android 13 | nessun doppio margine; Carta col GPS vero: pallino rosso, crocino «0,10 M · 092°» |

Sintassi: `jsc checkSyntax` sugli script di `carta/` e Traversata.
Service worker: `raffyca-rt-v25 → v26` (Traversata e' nel precache di
`routing/`). `carta/` non e' in nessun precache e l'hub serve gli HTML dalla
rete per primi: nessun bump.

### Non verificato / aperti

- ~~Il G15 vero non l'ho visto~~ — **poi verificato**: e' un **moto g15**,
  Android 15, navigazione a tre tasti, con l'APK (`it.dritta.bordo`, non la
  PWA). Installato sopra la versione del 24/09 via adb senza fili, dati
  conservati; Sergio conferma: «la barra in basso ora e' a posto».
- **Avviso «A a terra»** sul punto di esempio dell'Alto Adriatico
  (45,70 / 13,42) al primo avvio: c'e' identico su `main`, non viene da qui.
  Non indagato.
- All'avvio dell'APK la pagina resta bianca un paio di secondi prima di
  disegnarsi: e' il fondo della WebView. Non toccato.
- Il vento reale non si conserva: senza rete al largo si riapre sul
  sintetico. Tenerne l'ultimo campo in memoria e' il passo successivo.
- Tutto questo sta sul ramo `capacitor`: il sito pubblicato non lo ha.

---

## 28/09/2026 (2) — Scorciatoia Cruscotto ⇄ Carta, pensata per i guanti

In navigazione si passa di continuo fra Cruscotto e Carta, e dal menu costa
due tocchi e uno scorrimento. Sta tutta in `rf-topbar.js` (`scorciatoia()`),
che si accende solo in quelle due pagine:

- **un bottone in barra**, «⇄ Carta» sul Cruscotto e «⇄ Cruscotto» in Carta,
  **34×88 px**. E' il comando vero: Sergio ha sollevato il problema dell'uso
  d'inverno coi guanti, e un gesto su una striscia di 40 px coi guanti non si
  fa. Sotto i 420 px di larghezza la scritta della polare in barra sparisce
  per fargli posto;
- **uno scorrimento orizzontale sulla barra** (oltre 70 px, e piu' di lato
  che in verticale), come scorciatoia per chi lo conosce.

Gesti scartati, e perche':

- **sul contenuto della pagina**: la Carta usa trascinamento, pizzico,
  pressione lunga (nuovo WP); il Cruscotto la pressione lunga sui riquadri;
- **dal bordo dello schermo**: su Android a gesti e' il «indietro» di sistema;
- **doppio tocco sulla barra**: stesso posto dello scorrimento, e nessuno lo
  scopre;
- **scuotere**: in barca il telefono si scuote da solo.

**Tasto fisico** (per esempio volume giu' tenuto premuto, solo nell'APK):
discusso, non fatto. Sarebbe l'unico comando sicuro coi guanti spessi, ma
toglie il volume a quel tasto mentre Dritta e' aperta — e il volume serve
alla lettura vocale del Cruscotto.

Il link porta `index.html` esplicito: nasce in JavaScript, dove la
riscrittura degli href di `prepara-sito.js` non arriva, e il server di
Capacitor non risolve le cartelle.

Service worker: `rf-topbar.js` e' nel precache dell'hub,
**`dritta-hub-v23 → v24`**.

### Verificato

Emulatore Android 17, tre tasti, APK ricostruito: dal Cruscotto il bottone
porta in Carta; in Carta compare «⇄ Cruscotto»; lo scorrimento sulla barra
(partito sopra la freccina del pannello) riporta al Cruscotto senza aprire il
pannello. Sintassi con `jsc`.

### Non verificato

- ~~Sul tablet no~~ — **poi verificato**. Dopo l'installazione la WebView
  era rimasta nera con `process is bad` nei log, lo stesso stato del 21/09
  (vedi `app/LEGGIMI.md`), mentre lo stesso APK sull'emulatore partiva.
  Riavviato il tablet via adb: Dritta riparte, «⇄ Carta» dal Cruscotto porta
  in Carta (pallino rosso e crocino «0,21 M · 292°» col GPS vero), e lo
  scorrimento sulla barra riporta al Cruscotto. Sul tablet, largo, la scritta
  della polare resta accanto al bottone.
- Coi guanti veri, ovviamente no.

### Il ramo `capacitor` entra in `main`

Stesso giorno, su richiesta di Sergio («procedi pure»): `main` era ferma su
`e04c97c` e interamente contenuta nel ramo, quindi l'unione e' un
avanzamento senza conflitti. Da qui **un ramo solo**: l'APK si costruisce da
`main` (vedi `CLAUDE.md`). Il sito pubblicato riceve cosi' anche il lavoro
del 21–24/09 rimasto sul ramo — lettore NMEA, veglia d'ancora a schermo
spento, voce e salvataggi nell'APK — che nel browser resta inerte dove
serve `window.Capacitor`. La cartella `app/` finisce anche su GitHub Pages:
sono sorgenti, nessuno la linka, `node_modules` e `www` non sono committati.


---

## 28/09/2026 (3) — La nuova organizzazione dell'interfaccia: decisa, non ancora fatta

Sergio, confrontando Dritta con Vetta: l'interfaccia è disorganica. Sembrano
app diverse (colori, caratteri, controlli nativi accanto a pulsanti
stilizzati), ma soprattutto si usa male: troppe sezioni, troppo testo di
spiegazione, e per passare da un modulo all'altro si torna sempre al menu.

**Nessuna riga di codice cambiata.** Questa voce registra l'inventario e la
struttura decisa, che è il punto di partenza del lavoro vero.

### Cosa ha mostrato l'inventario

Fatto leggendo il markup delle 18 pagine del menu e, per ogni chiave
`raffyca-*`, chi la scrive e chi la legge. La mappa completa, con tabella per
schermo, sta in un artifact privato di Sergio («Mappa di Dritta»).

- **Tutto passa dal menu.** In tutta l'app i passaggi diretti fra schermi sono
  cinque: Cruscotto ⇄ Carta (voce (2) di oggi), Partenza → Cruscotto,
  Partenza → Percorso, Posizione → Impostazioni, Manutenzione → Impostazioni.
- **Nei dati invece i moduli sono già collegati**: waypoint, tracce, polare,
  posizione e passaggio di regata viaggiano già per `localStorage`. Il flusso
  esiste, ma l'interfaccia non lo segue. Per esempio la Traversata salva la
  rotta in Carta (`raffyca-tracks`), e poi per vederla bisogna passare dal
  menu.
- **Doppioni**: due «Traversate» (quella in linea retta dentro `meteo/`, con
  località cercate per nome, e quella di `routing/`); `strumenti.html` accanto
  al Cruscotto; sei viste geografiche separate (Leaflet in Carta, Traversata e
  radar del Meteo; planimetrie proprie in Ancora, XTE e Percorso).
- **Codice morto**: nell'hub, la schermata `#screen-wp` «Tracce e Waypoint».
  La apre solo un riquadro con `data-view`, e nessun riquadro ce l'ha più.
- **Stile condiviso solo a metà**: quasi tutti ricopiano gli stessi colori
  (`#060e18`, turchese, ambra) invece di importarli; `raffyca.css` lo caricano
  7 pagine su 18. Fanno eccezione la Traversata (`#0A1628`), XTE (`#0b0d10`) e
  Impostazioni (variabili con nomi propri).

### La struttura decisa

Proposta di Sergio, con due correzioni concordate:

- **Barra in basso, quattro voci**:
  - **Preparazione**: Meteo, Traversata, Sole & Luna;
  - **Navigazione**: Carta (con XTE come modalità), Cruscotto (con dentro i
    dati di `strumenti.html`), Ancoraggio, Posizione live;
  - **Regata**: Partenza, Percorso, Performance;
  - **Barca**: Manutenzione, Prontuario, Calcoli.
- **Barra in alto**, quella di oggi estesa: MOB (già attivo ovunque), GPS,
  registrazione traccia, waypoint attivo, Posizione live come interruttore, e
  l'icona delle Impostazioni.
- **Esce** la schermata «Tracce e Waypoint» dell'hub.

Scartato, e perché:

- **Ripartire da zero con un'app nuova**: il valore di Dritta sta nei motori
  (router, maschere, isobate, veglia, NMEA, offline) e nei difetti silenziosi
  già scoperti. Si rifà l'involucro, non i motori.
- **Prima la grafica, poi l'organizzazione**: uno stile uniforme applicato a
  sezioni scollegate lascia sezioni scollegate. Prima la struttura.
- **App a pagina unica**: non serve. Restano pagine separate con i loro
  service worker; la barra in basso si carica come quella in alto, da un file
  condiviso. L'APK la eredita.
- **Nome «Bordo»** per la quarta sezione: ambiguo, in barca si è a bordo
  sempre. Diventa «Barca».
- **Strumenti dentro «Barca»**: `strumenti.html` legge dati vivi dal gateway,
  quindi è navigazione. La configurazione del gateway va in Impostazioni.
- **Impostazioni come quinta voce in basso**: si apre di rado, e un posto nella
  barra in basso vale troppo, soprattutto coi guanti. Va in alto, come icona.
- **Una sezione «Consulta» separata** per Prontuario e Calcoli: la barra
  sarebbe salita a cinque o sei voci.

### Aperti

- Le due Traversate: fonderle in due passi della stessa schermata, oppure il
  Meteo passa A e B al routing e la sua versione sparisce.
- Cosa si apre all'avvio: l'ultima sezione usata, oppure una pagina di stato
  (vento, waypoint attivo, ancora, marea).
- Il rilevamento manuale di Performance: con il gateway NMEA potrebbe bastare
  quello automatico.
- Le maree stanno in Sole & Luna, ma la prossima stanca serve anche in Carta,
  entrando in porto.
- Da fare dopo la struttura: il foglio di stile unico, e i testi di
  spiegazione tolti dalle schermate operative e spostati in un aiuto a
  richiesta.

---

## 28/09/2026 (4) — La barra in basso: le quattro sezioni in ogni pagina

Primo passo della struttura decisa nella voce (3). Sta tutta in
`rf-topbar.js`, che ogni pagina carica già: nessuna pagina toccata.
Lavorato sul ramo `barra-in-basso`, in un worktree separato (`../ProVela-barra`).

### Cosa fa

- **Barra in basso** con Preparazione, Navigazione, Regata, Barca. Un tocco
  apre un foglio con i moduli della sezione, un secondo tocco ci entra: da
  qualunque schermo a qualunque altro in due tocchi. La sezione della pagina
  aperta è evidenziata, e nel foglio il modulo corrente porta «QUI».
- XTE e Strumenti compaiono ancora come voci di Navigazione. Usciranno
  quando diventeranno una modalità della Carta e una parte del Cruscotto.
- **Ingranaggio delle Impostazioni** in fondo alla barra in alto.
- **Non compare in `mob/`**: quella schermata è tutta per l'emergenza.
- **Grande di proposito.** Sergio, a lavoro in corso: col sole, e col tablet
  montato in basso, i testi piccoli non si leggono. Altezza 66 px su
  telefono e 74 da 600 px in su; etichette da 12,5 px (15 sul tablet,
  11,5 sotto i 360 px); righe del foglio da 64 px; grigi schiariti
  (`#a3b8ca` su fondo scuro).
- Nel tema Notte anche le evidenziazioni sono rosse (variabile `--tinta`):
  alla prima prova il riquadro «QUI» era verdino.

### Difetti silenziosi, per chi tocca la barra dopo

- **z-index 19 da chiusa, di proposito.** La finestra più bassa dei moduli è
  il foglio del Cruscotto, a 20: ogni finestra deve coprire la barra,
  altrimenti i suoi bottoni in fondo ci finiscono sotto. A foglio aperto,
  barra e foglio salgono a 8985/8984, sotto il pannello della barra in alto.
- **Leaflet non chiude i suoi strati** (z-index 400-1000): scorrendo la
  pagina, la mappa passava sopra la barra e ne prendeva i tocchi. Si
  risolve con `isolation:isolate` su `.leaflet-container`.
- **Gli elementi fissi in basso dei moduli** vanno alzati uno per uno:
  `.toast`, `#toast`, `.fab`, `.rf-toast`, più i 92 px che Manutenzione
  lascia per il suo bottone. L'elenco è nel CSS, fatto leggendo le pagine:
  **chi aggiunge un elemento fisso in basso lo aggiunga lì.**
- **`font:600 11px/1.1 inherit` non è CSS valido**, e il browser scarta la
  regola intera senza dire niente: le etichette prendevano il carattere di
  default e «Preparazione» diventava «Preparazio…». Scritto in proprietà
  separate.

### Corretto strada facendo: MOB e Carta dalla barra in alto, nell'APK

`urlMob()` e `urlCarta()` attaccavano la cartella al link home. Nell'APK
`prepara-sito.js` riscrive quel link in `../index.html`, quindi ne usciva
`../index.htmlmob/`: il punto MOB veniva salvato, ma la schermata MOB non si
apriva. Ora tutti i link passano da `radice()`, che toglie `index.html`, e
portano `index.html` esplicito. Trovato rileggendo il codice: a bordo non è
mai stato visto, e sull'APK la correzione non è ancora provata.

Service worker (tutti precaricano `rf-topbar.js`): **`dritta-hub-v25`,
`anchor-v20`, `raffyca-meteo-v21`, `raffyca-rt-v27`, `xte-v13`**.

### Verificato

Nel browser integrato, sulle 18 pagine del menu, a 375×812:
- la barra c'è ovunque tranne in `mob/`;
- la sezione evidenziata è quella giusta;
- scorrendo la pagina all'inizio, a metà e in fondo, in 5 punti della barra
  il tocco arriva alla barra e non alla pagina;
- le etichette sono intere;
- l'ingranaggio c'è, e in Impostazioni è evidenziato;
- nessun errore JavaScript.

Il fondo di ogni pagina resta raggiungibile sopra la barra. Percorso scorre
nel suo contenitore, che ora finisce sopra la barra. Nella Traversata, in
Calcoli e in Impostazioni c'è contenuto sotto il limite, ma sta dentro
sezioni chiuse.

Etichette misurate a 320, 360, 375, 412 e 800 px: stanno tutte. I link
generati sono giusti sia con il link home `#` (hub) sia con `../index.html`
(APK, simulato cambiando l'attributo). Guardati a occhio i temi Scuro,
Giorno e Notte.

**Sul tablet** (Ulefone Active 8 Pro, Android 13), con l'APK costruito dal
worktree e installato con `-r`, quindi con i dati di Sergio intatti:
- la barra sta sopra i tasti di Android senza sovrapporsi;
- Navigazione apre il foglio, e «Cruscotto» porta al Cruscotto, che si
  ridimensiona sopra la barra;
- dal pannello della barra in alto, «Apri nella Carta» porta alla Carta. Con
  il codice di prima il link sarebbe stato `../index.htmlcarta/`.

Visto anche lì, a conferma degli aperti: i testi propri della Carta sul tablet
sono piccoli.

### Non verificato

- **Telefono vero, Android 15**: niente. In particolare il margine di
  sistema in basso, che nell'app scansa Android (niente `viewport-fit=cover`).
- Il MOB dalla barra in alto, nell'APK, **non l'ho premuto**: avrebbe aperto
  un'emergenza e scritto un waypoint nei dati di Sergio. Passa però dalla
  stessa `radice()` di «Apri nella Carta», provata sul tablet (sotto).
- Coi guanti e al sole.
- XTE ha una sua barra a schede in fondo: ora sono due barre impilate.
  Sparirà quando XTE diventerà una modalità della Carta.

### Aperti

- **Testi e comandi più grandi in tutta l'app.** È la richiesta di Sergio
  per il sole e il tablet in basso, applicata per ora solo alla barra nuova.
  Nelle pagine la base resta 11-13 px, con grigi a basso contrasto
  (`--sub:#5a7a94`). Va fatto con il foglio di stile unico, non modulo per
  modulo.
- L'hub mostra la barra anche nella schermata di benvenuto del primo avvio.

---

## 28/09/2026 (5) — Tre decisioni, e l'hub diventa una pagina di stato

### Decise da Sergio (i tre aperti della voce 3)

- **Una Traversata sola, nel routing.** La ricerca delle località per nome
  passa nella Traversata del routing; dal Meteo un tasto «Pianifica la
  traversata» ci porta con la zona già scelta; la versione in linea retta
  del Meteo sparisce. Scartato: tenerle tutte e due collegate come «colpo
  d'occhio + rotta vera», perché rimangono due modi di scegliere A e B.
  **Da fare.**
- **All'avvio, una pagina di stato** al posto del menu. Scartato: riaprire
  l'ultimo modulo usato, più veloce ma senza lo stato generale; e il menu a
  riquadri, che ormai ripete la barra in basso. **Fatto qui sotto.**
- **Performance: il rilevamento manuale resta, ma chiuso**, dietro il
  confronto automatico con GPS e gateway. Scartato: toglierlo, perché senza
  gateway il modulo avrebbe solo il GPS. **Da fare.**

### La pagina di stato

`index.html` non elenca più i moduli: ci pensa la barra in basso. Mostra:

- **Adesso**: vento previsto per l'ora corrente (Open-Meteo, al punto della
  posizione), con freccia, direzione e raffiche; la nota dice «Previsione del
  modello per le hh:mm». Sotto, la posizione in gradi e
  primi, con età del fix, SOG e COG se è recente.
- **In corso**, ognuna tocca e porta al suo modulo: ancora calata (raggio e
  da quanto), registrazione traccia (apre il pannello della barra in alto,
  che la ferma), waypoint attivo o traccia seguita (distanza e rilevamento),
  posizione live attiva. Se non c'è niente: «Niente in corso.»
- **Oggi**: alba, tramonto, buio nautico (`rf-astro.js`); marea montante o
  calante e prossima stanca (`rf-maree.js`, già nella cache dell'hub).
- **La barca**: il profilo, con «modifica» che riapre il benvenuto.
- **MOB attivo**: un riquadro rosso in cima, che riporta alla schermata MOB.

Grande come la barra: numeri del vento da 46 px (64 sul tablet), righe da
64 px, etichette schiarite (`--lab`), due colonne da 760 px in su.

**Nessuna chiave nuova**: legge `raffyca-pos`, `-anchor`, `-rec`, `-mob`,
`-live`, `-active-wp`, `-active-track`, `-waypoints`, `-tracks`,
`-profile`. Il vento non viene salvato: senza rete resta l'ultimo scaricato
nella pagina aperta, altrimenti un trattino e il motivo.

**Esce la schermata «Tracce e Waypoint» dell'hub** (`#screen-wp`, con il suo
import/export GPX), già irraggiungibile: le stesse funzioni sono in Carta.
Tolte anche le regole di tema delle tessere, rimaste senza elementi.

### Corretto strada facendo: l'ingranaggio usciva dalla barra in alto

Con la registrazione attiva, a 375 px, la barra in alto misurava 410 px e
l'ingranaggio delle Impostazioni finiva fuori schermo. La causa era la zona
di stato a `flex:none`, che non si restringeva. Ora si restringono lei e la
scritta della polare, con i puntini.

Service worker: **`dritta-hub-v26`, `anchor-v21`, `raffyca-meteo-v22`,
`raffyca-rt-v28`, `xte-v14`**.

### Verificato

Nel browser, con dati d'esempio su un'origine di prova, poi cancellati:
- tutte le righe «In corso»; «Registrazione traccia» apre il pannello in
  alto; i link portano ai moduli giusti;
- il riquadro MOB compare e scompare con `raffyca-mob`, anche da un'altra
  scheda (evento `storage`);
- stato vuoto e senza posizione: compare il bottone «Prendi la posizione dal
  GPS»;
- «modifica» riporta al benvenuto con i dati;
- il vento arriva (Open-Meteo), marea e sole si calcolano;
- a 375 px la barra in alto misura 375 px e l'ingranaggio sta a 365;
- tablet a due colonne, tema Notte;
- sintassi degli script inline con `jsc`.

**Sul tablet**, con l'APK dal worktree e i dati veri di Sergio:
- vento previsto 4 kt da NE, posizione di casa (Verona), alba, tramonto e
  buio;
- «Marea non disponibile qui»: giusto per un punto nell'entroterra.

Lì si è visto anche che il tablet è largo **600 px CSS**: la soglia dei testi
grandi è scesa da 760 a 560 px. Le due colonne restano da 760.

Il primo avvio dopo l'installazione è rimasto nero con `process is bad`
(stesso incastro della WebView del 21/09 e di stamattina). Riavviato il
tablet via adb, si è ripreso. La seconda installazione è andata senza
`am force-stop` prima dell'avvio, ed è partita subito: sembra la sequenza
«installa, forza lo stop, riapri» a provocarlo, ma non è dimostrato.

### Non verificato

- Il bottone GPS dentro l'APK.
- Il vento con la rete di bordo lenta. Dopo 12 s la richiesta si
  interrompe e la pagina dice «Senza rete…»: il limite c'è, ma non l'ho
  provato su una rete lenta vera.
- Il vento letto dal gateway NMEA al posto della previsione: l'hub non
  carica `rf-nmea.js`. Sarebbe il passo giusto quando a bordo c'è.

Tolti su richiesta di Sergio, dopo averla vista sul tablet: «Non è una misura»
nella nota del vento, e la spiegazione sotto «Niente in corso» (quali cose vi
compaiono). Stessa linea della voce (3): meno testo nelle schermate.

---

## 28/09/2026 (6) — Performance: prima l'analisi, l'inserimento a mano chiuso

### Il presupposto sbagliato

Nella voce (5) la decisione era «confronto automatico in primo piano,
inserimento a mano chiuso». Leggendo il modulo è venuto fuori che
**Performance non ha nessun confronto automatico**: tutti i numeri vengono dai
rilevamenti inseriti a mano, e il pulsante «Collega NMEA» della Traccia polare
non aveva nessun gestore. Il confronto dal vivo esiste, ma sta nel
**Cruscotto** (campi «% polare» e «VMG», da SOG o STW e dal vento del gateway,
stimato o manuale). La proposta era mia e partiva da una cosa non verificata:
rimessa a Sergio con i fatti giusti.

Scelto da Sergio: **Performance diventa il posto dell'analisi**. Scartati:
- **registrazione automatica** dei punti mentre si naviga: il lavoro più
  lungo, e serve davvero solo con il gateway a bordo;
- **sola pulizia**, senza cambiare l'ordine delle schede.

### Cosa cambia

- Si apre sulla **Polare** (prima si apriva su Inserimento). In cima c'è un
  rimando «% polare e VMG dal vivo · Cruscotto». Il calcolo dal vivo non
  viene duplicato qui.
- Schede in quest'ordine: Polare, Traccia polare, **Rilevamenti** (ex
  Inserimento), Converti.
- In Rilevamenti l'elenco è in vista, con «Esporta CSV» (spostato fuori dal
  modulo) e «Cancella tutti». L'inserimento a mano sta in un `<details>`
  chiuso, «Nuovo rilevamento a mano». Tolte le due frasi di spiegazione del
  modulo: i pulsanti dicono già SOG/STW e reale/apparente.
- Tolto il pulsante morto «Collega NMEA».

### Ritirato `build_perf.py`

Assemblava `performance/index.html` riusando barra e tema dal Cruscotto. Ma la
pagina era stata corretta a mano il 22/09 (`viewport-fit=cover`) e lo script
no, e il suo `ROOT` puntava a `/home/claude/work/provela`, un'altra
macchina. Tenerli entrambi voleva dire che la prima rigenerazione avrebbe
cancellato le correzioni. Ora **la pagina è il sorgente**; lo script resta
nella storia di git. `CLAUDE.md` aggiornato.

Nessun service worker da alzare: `performance/` non è nel precache di nessuno
(la serve l'hub dalla rete, con la copia in cache solo di riserva).

### Verificato

Nel browser, a 375 px, con una polare d'esempio poi cancellata:
- si apre sulla Polare con il diagramma disegnato;
- il modulo manuale parte chiuso, si apre, e il rilevamento si salva: elenco,
  contatore e indicatori (VMG, target, perf) si aggiornano;
- la Polare mostra l'ultimo punto;
- Traccia polare si disegna, senza più «Collega NMEA»;
- Converti calcola;
- nessun errore JavaScript; sintassi degli script con `jsc`.

**Sul tablet**, con l'APK: da Regata → Performance si apre sulla Polare, con
la polare ORC e l'ultimo rilevamento veri di Sergio (55° / 5,0 kn). Lì le
etichette delle schede e degli indicatori restano piccole (9-12 px): è il
lavoro del foglio di stile unico, non di questa voce.

### Trovato e non toccato

- **L'importazione CSV della Traccia polare conta soltanto i punti** validi
  e crea una sessione vuota; non carica la nuvola. Il codice lo dice («v1:
  conteggio punti validi; aggancio nuvola reale col formato strumento
  definitivo»). Chi importa un CSV vede «N punti validi» e pensa di averli
  caricati.

---

## 29/09/2026 — Una Traversata sola, con la ricerca per nome

Decisione della voce (5): una Traversata sola, nel routing, con la ricerca
delle località; dal Meteo un tasto porta lì.

### Cosa si è trovato aprendo i due file

- **La Traversata del Meteo non si apriva più**: `openPassage()` esisteva, ma
  niente la chiamava. Circa 90 righe irraggiungibili, con il loro markup e
  37 regole CSS.
- **Anche la ricerca per nome del routing era morta**: `geocode()` cercava
  `#q` e `#findBtn`, che nella pagina non ci sono più. Oggi quindi nessuna
  delle due Traversate cercava per nome.

### Cosa cambia

**Meteo.** Tolta la Traversata in linea retta: funzioni, markup, ascoltatori
e le 37 regole CSS, di cui 8 in parte, cioè solo la metà morta dei selettori
raggruppati. Tolte anche quattro funzioni rimaste senza chiamate
(`haversineNM`, `bearingDeg`, `fmtClock`, `dayWord`).

Tre ascoltatori (`pBack`, `pDep`/`pSpd`, `pFromQ`/`pToQ`) avrebbero lanciato un
errore al caricamento, perché cercano elementi tolti: trovati con uno script
sui nomi, non a occhio (lezione del Prontuario).

Nella vista di un'area c'è **«Pianifica la traversata da qui»**, che apre il
routing con `?a=lat,lon&n=nome`.

**Routing.**
- **Campo «Cerca località…»** accanto a «A/B da waypoint»: Open-Meteo
  geocoding, lo stesso servizio del Meteo, in italiano. Imposta A o B, secondo
  quale dei due è selezionato.
- **`mettiAB()`** porta il punto dentro l'area di calcolo e, se cade a terra,
  lo sposta sul mare più vicino con `findSea()`. L'avviso lo dice («B →
  Chioggia · spostato in mare»).
- **`?a=` applicato due volte**: al boot e in `activateZoneCustom()`. Per le
  zone con la maschera OSM l'area si attiva dopo il boot e riporta A e B ai
  valori salvati: applicandolo solo al boot, la partenza dal Meteo veniva
  sovrascritta.
- Tolti `geocode()` e la frase di spiegazione sotto i pulsanti.

Scartati:
- **`findOpenSea()` per spostare in mare il punto**: cerca mare *aperto*, e
  da un porto sposterebbe la partenza di miglia. `findSea()`, il mare più
  vicino, è fatta proprio per «scostare un punto finito a terra».
- **Nominatim**, che era la fonte del vecchio `geocode()`: dà un risultato
  solo, richiede un User-Agent riconoscibile, e il Meteo usava già Open-Meteo.
- **Mostrare anche le località fuori area, spente.** Provato: per «Pir»
  l'elenco si riempiva di Stati Uniti, Romania e Iran. Ora se ne chiedono 30
  e si mostrano solo quelle dentro l'area, al massimo 8. Se non ce n'è
  nessuna, lo si dice.
- Open-Meteo dà spesso **lo stesso posto due volte** (città e comune):
  stesso nome a meno di circa 5 km conta una volta sola.

Service worker: **`raffyca-meteo-v23`, `raffyca-rt-v29`**.

### Verificato

Nel browser, a 375 px, profilo Alto Adriatico (dati di prova poi cancellati):
- Meteo: il tasto c'è e porta a `?a=45.7000,13.7200&n=Golfo di Trieste`;
- il routing, dopo l'attivazione della zona, ha A lì, spostata di poco in
  mare, con l'avviso;
- «Chioggia» come B finisce nel mare davanti a Sottomarina, e la scelta
  viene salvata in `raffyca-traversata-ui`;
- «Piran» trova Pirano, «Rovigno» Rovigno; «Pir» e «Napoli» dicono che
  nell'area non c'è niente; «Grado» va come A; Esc chiude l'elenco;
- nessun errore JavaScript; sintassi con `jsc`.

**Sul tablet**, con l'APK: Preparazione → Meteo → Golfo di Trieste →
«Pianifica la traversata da qui» apre la Traversata con A nel golfo. Quindi
il parametro `?a=` arriva anche con le pagine servite da Capacitor. Nota: la
prova ha sostituito la partenza A salvata sul tablet di Sergio.

### Trovato e non toccato: le larghezze dei moduli

Sergio, guardando sul tablet: alcuni moduli occupano tutto lo schermo, altri
sono colonne strette. Misurato il 29/09, contenuto visibile a 600 px (tablet
in verticale) e a 1000 px:
- **a tutto schermo**: hub, Meteo, Cruscotto, Carta, Ancora, Manutenzione,
  Sole-Luna, Posizione, Percorso, XTE;
- **colonne fisse**: Performance 526, Prontuario 536, Impostazioni 538-541,
  Strumenti 572-612, Calcoli 561-696, **Partenza 428** (due terzi del tablet),
  MOB 320 (voluto).

Proposta, da fare con il foglio di stile unico:
- schermate operative a tutto schermo;
- tutte le altre sulla stessa colonna, per esempio fino a 720 px, con gli
  stessi margini;
- sotto i 720 px tutte a tutta larghezza.

**Il Meteo è più largo del telefono.** A 375 px la pagina iniziale si
impagina a **634 px** e la vista di un'area a 404: il browser rimpicciolisce
tutto di circa il 40%. Colpevoli sono le schede delle aree, che mettono
nome, grafichetto, vento, confidenza, temperatura e freccia su una sola
riga senza andare a capo.

C'è già in `main`: confrontato sulla versione prima di questa voce. Spiega
una parte dei «testi piccoli» del Meteo. **È il primo punto del foglio di
stile.**

---

## 29/09/2026 (2) — Il foglio di stile comune, e il Meteo che finalmente sta nello schermo

Richiesta di Sergio (28/09): testi e comandi più grandi, perché al sole e dal
tablet montato in basso non si leggono; e un'interfaccia che non sembri tre
app diverse. Questa è la **prima fase**: lo strato comune, e il primo modulo
che lo adotta.

### Un file solo, e perché proprio quello

`raffyca.css` era già nato come «design system condiviso della suite»
(«caricalo in ogni app»), ma lo avevano adottato 7 pagine su 18: il resto
ricopiava i colori a mano, ed è così che la suite si è divisa.

Scartato un secondo file (`dritta.css`): avrebbe rifatto lo stesso errore, due
sorgenti per le stesse misure. **Il foglio unico resta `raffyca.css`.**

Due ostacoli, entrambi silenziosi:
- **cominciava con un azzeramento globale** (`*{margin:0;padding:0}`,
  `html,body{height:100%}`, sfondo e colore di `body`). Collegarlo a una pagina
  nuova le cambiava margini e impaginazione ovunque. Ora quelle regole valgono
  solo con `<html class="rf-reset">`, aggiunto alle 8 pagine che lo collegavano
  già (le 7 del menu più `prova-bolina.html`). Sono dentro `:where()`, perché
  la specificità resti identica: un `html.rf-reset *` avrebbe battuto
  `.card{padding}` e rotto proprio quelle pagine;
- **il suo tema Giorno è ancora `body.sun`**, il vecchio modo. Lo strato nuovo
  usa `html.day` / `html.night` come il resto della suite. `body.sun` resta
  per ora: nessuna pagina lo accende più, ma toglierlo è un lavoro a parte.

### Lo strato di leggibilità

In fondo a `raffyca.css`, solo variabili e classi `rf-`, nessuna regola sugli
elementi: una pagina lo collega senza cambiare finché non lo usa.

- **Scala dei caratteri** in variabili (`--t-etichetta`, `--t-piccolo`,
  `--t-testo`, `--t-titolo`, `--t-grande`, `--t-enorme`): 13 / 14 / 16 / 20 /
  28 / 44 px sul telefono, **14 / 15,5 / 18 / 23 / 34 / 56 da 560 px** in su
  (l'Active 8 Pro è largo 600 px CSS). Un modulo che usa le variabili si
  ingrandisce sul tablet senza scriverlo.
- `--lab`: il grigio leggibile al sole, nei tre temi.
- `--colonna` (720 px), `--margine`, `--tocco` (48 / 54 px, comandi da guanti).
- Classi `rf-colonna`, `rf-etichetta`, `rf-cifre`.

### Il Meteo, primo modulo

- **Non si impagina più più largo del telefono.** A 375 px la pagina iniziale
  misurava 634 px, e la vista di un'area 411. Tre colpevoli:
  - la riga in cima alle schede delle aree (nome, grafichetto, tre
    indicatori, freccia) non andava a capo. Sotto i 620 px ora va su due
    righe: nome e freccia, poi grafichetto e indicatori;
  - la riga in cima alla vista di un'area;
  - il cursore delle ore, che spingeva fuori le date ai suoi lati.
- **46 regole di carattere convertite**, selettore per selettore:
  - il **monospazio resta solo sulle cifre** (velocità, direzioni, orari,
    valori);
  - titoli, nomi delle aree, etichette, pulsanti e note passano al
    carattere normale;
  - le misure sotto i 13 px (fino a 9 px) passano alle variabili comuni;
  - velocità nelle fasce da 12,5 a 16 px, indicatori da 14 a 17;
  - fasce e indicatori si allargano per starci.
- `.rvTime` usava `var(--sub)` senza definirla: il colore ricadeva sul
  bianco ereditato. Con il file comune sarebbe diventato il grigio scuro;
  ora è `--lab`.

### Difetto trovato strada facendo: `raffyca.css` non era in nessuna cache

Non era nel precache di nessun service worker, e quello dell'hub non mette in
cache quello che non ha già. Quindi le 7 pagine che lo usavano da mesi,
**offline, molto probabilmente si aprivano senza il loro stile**. Non l'ho
visto succedere: è dedotto leggendo il service worker. Ora è nel precache
dell'hub e del Meteo.

Service worker: **`dritta-hub-v27`** (anche per le pagine delle 7 con la
classe nuova), **`raffyca-meteo-v24`**.

### Verificato

Nei riquadri di prova a 320, 375, 600 e 1000 px, sulla versione nuova:
- larghezza della pagina uguale allo schermo nella pagina iniziale e in tutte
  e quattro le viste di un'area (Nastro, Rosa, Temporali, Diagrammi);
- nessun testo visibile sotto i 13 px (14 sul tablet).

Sul tablet, con l'APK: il Meteo riempie lo schermo, in carattere normale e più
grande, con le cifre in monospazio. Prima era rimpicciolito e tutto in
monospazio.

### Non verificato

- Le 7 pagine con la classe `rf-reset` dopo la modifica: la specificità è
  identica per costruzione, ma non le ho riaperte una per una.
- La cache offline di `raffyca.css`, sia prima sia dopo: il pannello del
  browser blocca i service worker.
- I temi Giorno e Notte del Meteo convertito.

---

## 29/09/2026 (3) — La Traversata riorganizzata

Sergio, dopo la voce (1): «Traversata non l'hai quasi toccata. È da
riorganizzare pesantemente.» Aveva ragione: la ricerca per nome non cambiava
la struttura, che era quella della sua prima schermata del 28/09.

### Com'era

Dall'alto:
1. titolo e descrizione, «Carica vento reale», la pastiglia dei dati;
2. **7 caselle** per gli strati;
3. **9 comandi** per A e B;
4. la mappa, con sotto una frase sullo zoom;
5. Naviga, due caselle, Salva in Carta, GPX;
6. **7 cursori e 3 interruttori** con tre frasi di spiegazione;
7. il diario;
8. la polare.

La risposta (quando arrivo, quanto dura, che vento) era **una riga di testo**
sopra il diario.

### Com'è

Proposta mostrata a Sergio con uno schizzo e approvata:

- **In vista**: «Da» e «A» (nome o coordinate), «Partenza» (ora, con
  «miglior orario»), la mappa, e il **riquadro della rotta**: arrivo e durata
  in cifre grandi, distanza con la media, vento minimo e massimo. Sotto, la
  luce all'arrivo, poi «Naviga» grande e il menu «⋯».
- **Toccando «Da» o «A»** si apre un foglio con:
  - la ricerca per nome;
  - «Dove sono adesso», solo per A;
  - «Tocca la carta»;
  - i waypoint ordinati per distanza.
- **Toccando «Partenza»**: il cursore dell'ora e «Trova il miglior orario».
- **Gli strati**: nel pulsante con la lista a spunte, in alto a destra sulla
  carta. Le basi di Leaflet scendono in basso a destra, perché due icone
  uguali si confondevano.
- **Il vento sulla carta**: una barra del tempo sopra la mappa, al posto del
  cursore «Vento in carta adesso».
- **Nel menu «⋯»**: Salva in Carta, GPX, Ricalcola, Area su A e B, Trascina
  A e B, Punti di esempio, la zona.
- **Sezioni chiuse con il riassunto a destra**:
  - «Impostazioni del calcolo» (es. «senza motore · manovra 12 s»);
  - «Diario di rotta» (grafico del vento, manovre, CSV e PDF);
  - «Polare».
- **Le opzioni di navigazione** («segui la barca», «ricalcola da dove sono»)
  compaiono solo mentre si naviga.
- **Tolte le frasi di spiegazione.** Nascosta la riga di testo della rotta,
  che ripeteva il riquadro: la logica la scrive ancora. L'unico avviso che
  aveva in più (rotta che non chiude per la distanza dalla costa) è passato
  nella nota del riquadro.
- **Tablet in orizzontale e schermi larghi (da 960 px)**: carta a sinistra
  alta quanto lo schermo, tutto il resto a destra.

### Come è fatto, e perché così

**Gli elementi sono gli stessi, con gli stessi `id`: cambia solo dove
stanno.** La logica li cerca per `id` in 70 punti, controllati con uno
script prima di andare avanti. Mancavano solo `areaBtn` e `qarea`, che non
esistevano già prima, e `wpPick`, protetto da un controllo.

Il resto è **uno script nuovo, in fondo, che avvolge le funzioni esistenti
invece di riscriverle**:
- `setAB`: dimentica il nome quando il punto si sposta a mano, e chiude
  «Tocca la carta» dopo un tocco;
- `mettiAB`: ricorda il nome;
- `updateReadout`: riempie il riquadro;
- `saveUI`: salva i nomi in `raffyca-traversata-ui`, campi `nomeA` e `nomeB`,
  **senza chiavi nuove**.

Calcolo, salvataggio e navigazione non sono stati toccati.

Scartato **riscrivere la pagina**: sono 1.800 righe con worker, maschere e
diario, verificate in mare. Un errore lì sarebbe stato silenzioso, mentre uno
spostamento di markup si vede subito.

Le opzioni di navigazione seguono la classe di `#navBtn`, non di `#navp`:
`#navp` si accende solo al primo fix GPS, e fino ad allora le opzioni
sarebbero rimaste nascoste proprio quando servono.

Usa lo strato comune di `raffyca.css` (scala dei caratteri, `--lab`,
`--tocco`), aggiunto al precache del routing. Service worker:
**`raffyca-rt-v30`**.

### Verificato

Nel browser, a 375, 600 e 1000 px, con waypoint d'esempio poi cancellati:
- **larghezza**: la pagina sta nello schermo a 375 e 600 px; a 1000 va su due
  colonne;
- **riquadro della rotta**: si riempie con il vento reale;
- **fogli**:
  - il foglio di B non mostra il GPS ed elenca i waypoint per distanza;
  - scelto un waypoint, B prende il nome, la rotta si ricalcola e il nome si
    salva;
  - «Tocca la carta» mette A al primo tocco, poi il trascinamento si
    richiude da solo;
- **strati, menu e partenza**: si aprono e si chiudono; il menu ha le sue 7
  voci;
- **errori**: nessun errore JavaScript; sintassi con `jsc`.

### Non verificato

- «Naviga» e le sue opzioni: il pannello del browser non ha GPS, e
  `startNav()` si ferma prima. Da provare sul tablet.
- Temi Giorno e Notte della disposizione nuova.

### Dopo la prima prova di Sergio sul tablet

- **Il foglio «Partenza A» finiva sotto la barra del tempo e il pulsante degli
  strati.** Il riquadro della carta non chiudeva i livelli dei suoi figli
  (640 e 1000), che scavalcavano i fogli (41). Risolto con
  `isolation:isolate` sul riquadro, senza toccare i livelli interni. Poi
  verificato con `elementFromPoint`: nei punti controllati sopra il foglio il
  tocco arriva al foglio.
- **I pulsanti della polare e del diario** avevano ancora lo stile vecchio
  (`.go` a pillola, 13 px). Ora sono pieni, alti `--tocco`, con la scala
  comune.
- **Cruscotto senza scheumorfismo.** Sergio: «cruscotto è l'unico che ha
  elementi scheumorfici (rivetti e cornice). Togli». Tolte:
  - la cornice metallica sfumata (`.instr`);
  - le righe di scansione e l'ombra interna del display (`.dp`);
  - le quattro viti, sia il markup generato dal JavaScript (2 punti) sia lo
    stile;
  - sfumature e riflessi di intestazione, pulsanti, selettori e fogli.

  Il blocco sta in fondo allo stile, con `html:root` davanti, perché vinca
  anche sulle varianti `html.day`, senza cercarle una per una. Nessun service
  worker da alzare: `cruscotto/` non è in nessun precache.
- **Tolta la sezione Polare dalla Traversata.** Sergio: «la polare la
  toglierei proprio da Traversata. Che senso ha?». Nessuno: era un doppione di
  Impostazioni, che ha le stesse tre funzioni (ricerca nel DB ORC sullo
  stesso `routing/orc_med.json`, CSV incollato o da file, ritorno alla
  integrata). La Traversata usa comunque la polare condivisa
  (`raffyca-polar`). Controllato prima di togliere.

  Tolti il markup, i due ascoltatori (`polApply`, `polReset`), la ricerca ORC
  (`orcSelect`, `orcRender`, `orcEnsure`), `saveSharedPolar` (non la usava
  nessun altro) e il loro CSS. Restano `parsePolarText`, `applyPolar` e
  `loadSharedPolar`, che caricano la polare condivisa.

  Dentro «Impostazioni del calcolo» c'è ora la riga «Polare · *nome* ›», che
  porta a `impostazioni/index.html?polar=1`. Usa l'`id` `polStatus`, quindi il
  nome lo scrive la logica di sempre. Verificato: con una polare ORC salvata
  la riga dice «Salt 6.50 · ORC», nessun errore.

---

## 29/09/2026 (4) — Il vento del Cruscotto era inventato; nasce rf-strumenti.js, e la Carta ha la sua striscia

Richiesta di Sergio: al posto del salto Cruscotto ⇄ Carta, o in aggiunta,
una striscia di campi nella Carta, «almeno 4». Scelta, dopo averne parlato:
**striscia in Carta, niente nuova vista nel Cruscotto**. Una vista «carta
con strumenti» nel Cruscotto sarebbe stata la settima mappa della suite,
proprio mentre le stiamo riducendo. Il salto ⇄ resta, per gli strumenti a
tutto schermo.

### Il difetto trovato leggendo il Cruscotto per estrarne i calcoli

**Il vento «Stima» non veniva da nessuna previsione.** Era `S`, un oggetto
di valori d'esempio (14,2 kt da 158°), fatto oscillare a caso ogni 1,2 s da
`drift()`. Nel Cruscotto non c'era nessuna chiamata a un servizio meteo.
L'interfaccia lo presentava come «Dati: Stima · GPS + meteo» e «Vento:
Stima».

Quindi **TWS, TWD, TWA, VMG, % polare e vento apparente erano inventati**,
ogni volta che il vento non era impostato a mano. Nel registro non ce n'era
traccia come cosa nota.

C'era di più: **il Cruscotto non caricava `rf-nmea.js`**. La modalità
«Signal K» commutava solo l'etichetta («Signal K / WebSocket NMEA») mentre
vento, STW, profondità e temperatura restavano quelli simulati, anche
nell'APK collegato al gateway.

### `rf-strumenti.js`: i numeri di bordo calcolati in un posto solo

Stessa forma di `rf-nmea.js`: ES5, niente DOM. Lo usano Cruscotto e Carta.

- **Vento**, in quest'ordine:
  1. manuale, se scelto nel Cruscotto (`raffyca-dash`);
  2. strumenti di bordo, se `rf-nmea.js` ha TWS e TWD vivi;
  3. previsione Open-Meteo per posizione e ora, al massimo ogni 10 minuti
     o dopo 5 NM.

  Ogni valore porta `ventoDa`. Senza rete e senza strumenti il vento è
  `null`, e i campi mostrano «—».
- **STW, profondità, temperatura, AWS e AWA** dal gateway, quando ci sono.
- **% polare** dalla polare condivisa. Senza polare, niente % (nessun
  ripiego su una polare d'esempio).
- **Waypoint attivo**: distanza, rilevamento, tempo e ETA.
- **Catalogo dei 17 campi** con nome, unità e valore già formattato, più la
  nota della fonte (`prev.`, `man.`, lato `sx`/`dx`).

**Difetto introdotto e trovato provando.** `isFinite(null)` è `true`,
perché `null` diventa 0. Il Cruscotto, al caricamento, chiama il calcolo
senza fix (`lat: null`): il controllo lo lasciava passare, `null.toFixed()`
lanciava un'eccezione **dopo** aver segnato la richiesta come «in corso», e
quel segno restava acceso per tutta la sessione. Risultato: **la previsione
non arrivava mai**. Non c'era nessun errore in console, perché la funzione
era chiamata dentro il ciclo di disegno.

Trovato con una funzione di sola lettura, `rfStrumenti._previsione()`,
rimasta per la diagnosi. Ora:
- le coordinate si controllano con `typeof === "number"`;
- il segno «in corso» si accende solo dopo che l'indirizzo è stato
  costruito;
- lo stesso controllo vale per il vento manuale e per le coordinate del
  waypoint.

### Il Cruscotto

- `eff()` prende vento, STW, profondità e temperatura da `rf-strumenti`.
  Via `drift()` e il suo intervallo.
- **Pulsante del vento**, stessi tre stati con un significato vero:
  - «Auto»: strumenti se ci sono, altrimenti previsione;
  - «Strumenti»: solo il gateway, altrimenti vuoto;
  - «Manuale».
- **Distintivi**: «prev.» sulla previsione, «man» sul manuale, «n/d» quando
  il dato manca. Prima «stima» copriva i numeri simulati.
- **Il pulsante «Dati»** da interruttore finto diventa un indicatore:
  «Strumenti · gateway» se arrivano dati, «Solo GPS» altrimenti. Toccandolo,
  un avviso dice dove si configura il gateway.
- `fmt` di TWS e TWD protetti: facevano `.toFixed()` sul vento senza
  controllo, e con il vento assente (offline) si sarebbero rotti.

### La striscia della Carta

- **4 campi sul telefono, 6 da 600 px**, sotto la carta. Di serie: SOG, COG,
  distanza WP, vento, TWA, polare.
- **Si tocca un campo per cambiarlo**, da un foglio con i 17 campi.
- **La scelta sta in `raffyca-carta-view`, campo `striscia`**, aggiunto
  dentro `saveView()`: quella funzione riscrive la chiave da capo, e la
  scelta sarebbe sparita al primo spostamento della carta. Nessuna chiave
  nuova.
- Il fix è quello della Carta (`POS`, `SOG`, `COG`).
- **Misure**:
  - cifra proporzionale alla casella (19–28 px sul telefono, 22–34 sul
    tablet);
  - unità accanto al nome del campo, perché a 320 e 600 px cifra e unità
    insieme non ci stavano;
  - nomi accorciati («WP», «Polare», «Fondo»).

  Misurato a 320, 375, 600 e 1000 px: nessuna cifra e nessuna etichetta
  tagliata.

Service worker: **`dritta-hub-v28`**, con `rf-nmea.js` e `rf-strumenti.js`
nel precache (Carta e Cruscotto stanno sotto l'hub).

### Verificato

Nel browser, con fix, waypoint e polare d'esempio poi cancellati:
- **striscia**: SOG 5,2, COG 200°, WP 11,8 NM, vento 6,1 kt «prev.»; la
  scelta di un campo si applica e resta dopo lo spostamento della carta;
- **Cruscotto**: vento previsto 6,2 kt «prev.», TWA e % polare calcolati da
  lì; «Solo GPS»; senza fix nessun numero inventato, solo «n/d»;
- **errori**: nessun errore JavaScript; sintassi con `jsc`.

### Non verificato

- **Il gateway vero**: la strada «strumenti» è scritta sul contratto di
  `rf-nmea.js` (`dati()`), ma non l'ho vista con dati reali.
- **La striscia con il GPS del telefono**: nel pannello i valori di SOG e
  COG li ho dati a mano.
- **La polare d'esempio del Cruscotto** (`POL_DEMO`) è ancora il ripiego del
  suo % polare quando non c'è una polare caricata: l'intestazione dice
  «polare demo», ma il numero resta fatto su una barca che non è la tua.
  Da decidere se toglierlo come in `rf-strumenti`.

### Dopo, su indicazione di Sergio

- **Tolta la polare demo del Cruscotto** (`POL_DEMO`). Senza una polare
  caricata `POL` resta vuota, `polarTarget()` restituisce 0 ed `eff()` lo
  trasforma in `null`, non più in «0 %»: il campo mostra «—». L'intestazione
  dice «nessuna polare». Verificato nel browser.
- **Riquadri del Cruscotto squadrati** (`.instr`, `.dp` a raggio 0). Ho
  interpretato così «gli angoli arrotondati dei box di cruscotto», nello
  stesso spirito delle viti tolte: da confermare.
- **Previsione dopo un errore di rete: nuovo tentativo dopo 20 s**, non più
  60. In una prova il primo tentativo al caricamento è fallito (intoppo di
  rete, ripreso da solo al giro dopo) e il vento è rimasto «n/d» per un
  minuto intero.

---

## 29/09/2026 (5) — La Carta riorganizzata

Stesso metodo della Traversata: prima un inventario e uno schizzo approvati
da Sergio, poi solo spostamenti di elementi esistenti con i loro `id`.

### Com'era

Dall'alto:
1. titolo con il filtro;
2. la mappa (46% dello schermo) e la striscia;
3. 4 pulsanti per waypoint e GPX;
4. **7 strumenti in fila**, metà strati da vedere (griglia, zone venti,
   batimetria, fari) e metà modalità di lavoro (traccia, misura, raster),
   mescolati;
5. le barre di controllo degli strumenti, **sotto** la carta, lontano da dove
   si tocca;
6. la riga «posizione: —»;
7. l'elenco.

### Com'è

- **La mappa riempie lo spazio** fino alla striscia e ai comandi, che restano
  sempre in vista. Misurato a 375 px: dal 54% al **72%** dello spazio utile
  tra le due barre.
- **Strati** nel pannello con la lista a spunte, sulla carta (sotto le basi
  di Leaflet): griglia, zone venti, batimetria, settori dei fari.
- **Attrezzi** in un foglio: misura, disegna traccia, «Fari: cosa vedo»,
  carta raster. La loro barra di controllo compare **sopra la carta, in
  basso**, solo mentre sono attivi.
- **I fari si dividono**, come chiesto da Sergio:
  - negli strati i settori (il gestore di `tFari` gira prima, poi si forza
    la modalità «sett»);
  - negli attrezzi «cosa vedo», che accende i fari se sono spenti e passa a
    «vedo».
- **Il foglio «Waypoint»** raccoglie «Qui, dove sono (GPS)», «Per coordinate»
  e «Tocca la carta»: quest'ultimo ricorda la pressione lunga, che resta.
- **Il menu «⋯»** contiene Importa ed Esporta GPX.
- **Tolti** il titolo e la riga della posizione. La riga resta nascosta,
  perché `updatePosInfo()` ci scrive ancora.
- **Il filtro** è sopra l'elenco. L'elenco resta visibile sotto: Sergio ha
  chiesto quanto avrebbe guadagnato la mappa a chiuderlo. Misurato:
  **niente**, perché l'altezza della mappa non dipendeva dall'elenco ma era
  fissa (`46vh`). Il guadagno viene dal togliere quello che stava attorno
  alla mappa.
- **Da 960 px** (tablet in orizzontale) la carta va a sinistra alta quanto lo
  schermo, e a destra la striscia su tre colonne, i comandi e l'elenco.

### Difetto trovato: la legenda della batimetria

Stava in fondo alla pagina, fuori dalla carta, posizionata rispetto allo
**schermo** (`bottom:26px`, livello 650). Con la barra in basso le finiva
sopra e la copriva. Ora sta dentro il riquadro della carta, in alto a
sinistra sotto lo zoom.

### Verificato

Nel browser, con dati d'esempio poi cancellati:
- **`id`**: i 76 riferiti dal JavaScript esistono tutti, senza doppioni
  (controllo con uno script);
- **fogli**: quello dei waypoint e quello degli attrezzi si aprono e si
  chiudono;
- **attrezzi**: Misura chiude il foglio, accende la sua barra dentro la carta
  e si richiude;
- **strati e fari**: la griglia si accende dagli strati; i fari dagli strati
  vanno in «sett», da «Cosa vedo» in «vedo», e si spengono;
- **menu**: ha le due voci GPX;
- **larghezza**: la pagina sta nei 375 px; a 1000×600 vanno le due colonne
  (carta 601×462);
- **errori**: nessun errore JavaScript; sintassi con `jsc`.

### Non verificato

- Disegno di una traccia e carta raster fino in fondo: ho provato solo che si
  aprono dai loro nuovi posti.
- Temi Giorno e Notte.

### Dopo la prova di Sergio sul tablet

- **Zoom «+ / −» e posizione «◎» a 48 px**, in Carta e in Traversata. Erano i
  pulsanti di serie di Leaflet, da 30 px. Sergio li aveva dati per mancanti,
  poi sono comparsi (la carta stava ancora caricando). Sul tablet però erano
  davvero piccoli, e si usano coi guanti. Il pulsante degli strati e la
  legenda della batimetria scendono di conseguenza, senza sovrapporsi.
- **Via la scorciatoia «⇄ Carta / ⇄ Cruscotto»** dalla barra in alto (voce
  28/09 (2)), compreso lo scorrimento sulla barra: ora ci sono la barra in
  basso e la striscia. Tolti `scorciatoia()` e il suo CSS da `rf-topbar.js`.
- **Separatore della barra in basso.** Sergio: «usandola di fretta non si
  capisce dove finisce la pagina e dove cominciano Preparazione,
  Navigazione…». Nello screenshot del tablet si vedeva il bordo delle
  linguette dell'elenco spuntare a ridosso della barra. Ora la barra ha una
  **linea continua di 2 px** in un colore contrastato nei tre temi
  (`--confine`: `#4f7390` scuro, `#6b7f92` giorno, `#7a2424` notte) e
  un'ombra più marcata verso l'alto.

Service worker (tutti precaricano `rf-topbar.js`): **`dritta-hub-v29`,
`anchor-v22`, `raffyca-meteo-v25`, `raffyca-rt-v31`, `xte-v15`**.

---

## 29/09/2026 (6) — L'Ancoraggio riorganizzato, con il vento del cono automatico

Stesso metodo: inventario e schizzo approvati da Sergio, poi solo spostamenti
di elementi esistenti con i loro `id` (40 riferiti dal JavaScript, controllati
con uno script, nessun doppione).

### Com'era

Dall'alto:
1. un avviso di tre righe sui limiti del browser, o di quattro nell'APK;
2. la planimetria;
3. lo stato;
4. quattro indicatori: distanza, deriva, alba, tramonto;
5. due indicatori: catena/fondo, rischio di toccare;
6. **«⚓ Cala ancora», il comando principale, per ultimo**;
7. le sezioni Parametri e Pericoli, con **il vento del cono da scrivere a
   mano**.

### Com'è

- **Prima di calare**: la planimetria, lo stato con una riga «GPS 4 m · fondo
  8 m · catena 30 m», e subito «⚓ Cala ancora» grande. Gli indicatori sono
  nascosti (`html:not(.a-attiva)`): prima di calare non dicono niente.
- **All'ancora**:
  - la distanza dal centro in grande, «14 m su 40»;
  - deriva, catena/fondo e vento;
  - «Tocca con la bassa marea», solo quando è calcolabile;
  - Tacita e Salpa.
- **Alba e tramonto** escono (Sergio: «togli pure»): stanno nella pagina di
  stato. Gli elementi restano nascosti perché `updateUI()` ci scrive.
- **Il vento del cono è automatico** (Sergio: «va bene»), da `rf-strumenti.js`:
  strumenti, altrimenti previsione. Il campo manuale resta nei parametri:
  «vuoto = automatico». Il riassunto dei parametri dice «vento auto» o
  «vento manuale».
- **Gli avvisi** diventano una riga piccola in fondo, «ⓘ Solo a schermo
  acceso» o nell'APK «ⓘ Veglia anche a schermo spento», che si apre per
  leggerli per intero.
- **Da 960 px** la planimetria va a sinistra e il resto a destra.

### Il punto delicato: il vento automatico non entra nello stato

Il cono si disegna da `S.fcast`, che `save()` scrive in `raffyca-anchor`, e
che all'avvio torna nel campo manuale (`inFcast`). Mettere lì il vento
automatico l'avrebbe fatto diventare «manuale» al primo riavvio, fermo per
sempre.

Quindi `draw()` è avvolta: se il campo manuale è vuoto, `S.fcast` prende il
vento automatico **solo per la durata del disegno** e torna subito `null`.
Verificato:
- all'ancora il cono è disegnato dal vento previsto (da NE, barca a SO);
- `S.fcast` resta `null`;
- anche il salvato in `raffyca-anchor` resta `null`.

Service worker: **`anchor-v23`**, con `raffyca.css`, `rf-nmea.js` e
`rf-strumenti.js` nel precache.

### Verificato

Nel browser, a 375 px, con fix d'esempio poi cancellato:
- **prima di calare**: la riga GPS/fondo/catena, niente indicatori, riassunto
  «raggio 40 m · vento auto»;
- **dopo «Cala ancora»**: «IN AREA», 14 m su 40, vento «10 kt NE prev.» (su
  due righe, prima andava a capo su tre), il rischio di toccare nascosto
  finché non si può calcolare, «Salpa» visibile;
- **dopo un ricaricamento** la veglia resta attiva;
- **errori**: nessun errore JavaScript; sintassi con `jsc`.

### Non verificato

- «Salpa» fino in fondo: chiede conferma, e nel pannello del browser le
  conferme rispondono sempre di no. Il comportamento è quello di prima.
- La veglia a schermo spento nell'APK dopo la riorganizzazione: la logica
  non è stata toccata, ma va rivista in rada.
- Temi Giorno e Notte.

---

## 29/09/2026 (7) — Il Cruscotto riorganizzato: lo spazio va ai numeri

Schizzo approvato da Sergio, con una priorità dichiarata: «guadagnare spazio
per i campi, soprattutto per il 2, che deve avere i numeri più grandi
possibile». Solo spostamenti di elementi esistenti con i loro `id` (30
riferiti dal JavaScript, controllati con uno script: tutti presenti, nessun
doppione).

### Com'era

Sopra i campi c'erano tre righe, circa 180 px:
1. «nessuna polare» e il bottone «Dati»;
2. il selettore «2 3 4 5 8 campi», con «campi» tagliato a 375 px, e
   «Vento»;
3. voce, «＋ Waypoint», «Traccia», più la riga del WP attivo, presente anche
   quando era vuota.

**Il dato assente sembrava un valore.** `fit()` ingrandiva il trattino «—»
come un numero: a 375 px diventava una barra spessa, colorata come il campo.

### Com'è

- **Una riga sola sopra i campi**: «▦ 4», «Vento», «Solo GPS». Il numero di
  campi si sceglie da un foglio (`lsheet`) che contiene lo stesso
  `segLayout`, con gli stessi `data-n`.
- **Il nome della polare** esce: lo mostra già la barra in alto (`rfPol`).
  `#profile` resta nascosto, perché `updateProfileSub()` ci scrive.
- **La riga del WP o della traccia** (`recWp`) compare solo quando ha
  qualcosa da dire (`:empty`).
- **Voce, Waypoint e Traccia in fondo**, alti 52 px, sopra la barra delle
  sezioni.
- **L'unità va in alto a destra della casella**, accanto al nome, come nella
  striscia della Carta. Nella riga del numero rubava larghezza, ed è la
  larghezza a limitare le cifre sul telefono.
- **`fit()`**:
  - altezza della cifra a 1,12 volte lo spazio (era 0,98: le cifre sono
    alte circa 0,73 em, e restava vuoto un quarto della casella);
  - tetto a 600 px (era 220, e sul tablet il layout a 2 campi lo toccava);
  - il trattino del dato assente resta piccolo (al massimo 48 px) e grigio
    (`.num.na`).
- **Bordi e spazi fra le caselle** da 10 e 9 px a 6.
- **Il suggerimento «Tieni premuto un campo…»** non compare più dopo il
  primo cambio di campo: campo `picked` dentro `raffyca-dash`, nessuna
  chiave nuova.

### Misure, layout a 2 campi, prima e dopo

Stessa pagina, stesso fix d'esempio (SOG 6,4), misurate nello stesso browser:

| | 375 × 812 | 800 × 1280 |
|---|---|---|
| prima | corpo 156 px, cifre larghe 273 px | 220 px (il tetto), 384 px su 778 |
| dopo | corpo 192 px, cifre larghe 335 px | 433 px, cifre quasi a tutta casella |

### Difetto introdotto e trovato provando

A 375 px con 4 campi, il TWA con il distintivo «◄ Sx» usciva di 1–2 px dalla
casella. Il ciclo di `fit()` scalava di 0,995, e il distintivo, che non
scala, lo lasciava sempre appena oltre il limite. Ora scala di 0,98. Dopo la
correzione, con i layout 2, 3, 4, 5 e 8, nessuna riga di numero esce dalla
casella.

Service worker: nessuno da alzare. `cruscotto/` non è nel precache, e l'HTML
lo serve prima la rete (`dritta-hub`).

### Verificato

Nel browser, con fix, vento manuale e WP d'esempio poi cancellati:
- **layout 2, 3, 4, 5, 8** a 375, 600 e 1000 px: nessuna cifra tagliata,
  nessuno scorrimento orizzontale, nome e unità mai sovrapposti (misurato sul
  testo, non sul riquadro);
- **nessuna cifra tagliata in altezza** nel layout 2, a 375 e a 800 px
  (controllato a occhio sugli screenshot);
- **foglio dei campi**: si apre, la scelta si applica, si chiude, «▦ N» si
  aggiorna e resta dopo un ricaricamento;
- **riga WP**: compare con un WP attivo, apre il suo foglio, e sparisce con
  «Disattiva waypoint»;
- **suggerimento**: dopo un cambio di campo e un ricaricamento non compare;
- **errori**: nessun errore JavaScript; sintassi con `jsc`.

### Non verificato

- Sul tablet e con i guanti: altezza dei bottoni in fondo e del foglio dei
  campi.
- Temi Giorno e Notte della disposizione nuova: i colori sono le variabili di
  sempre, ma non li ho guardati.
- Bussola (layout 3 e 5): non toccata, ma non l'ho rivista col GPS vero.

### Dopo, guardando il layout a 2 con Sergio

Con SOG 12.0 e COG 332 si vedevano tre cose:
- **Il 12.0 veniva più piccolo del 332**: il carattere dà al punto lo spazio
  di una cifra, e con quattro caratteri comandava la larghezza.
- **Nome, unità e «◄ Sx» restavano a 11–12 px** accanto a cifre di 400 px,
  sul tablet.
- **Il COG sul tablet arrivava a filo del bordo.** Sergio: «pochissimo più
  piccolo».

Strade valutate per il 12.0:
- **punto stretto**, cioè il solo punto a metà larghezza: circa +12%;
- **decimale a due terzi**, come sugli strumenti di bordo.

Scelto il decimale ridotto (`.dec`, 0,66 em): la parte intera è quella che si
legge da lontano. Vale per tutti i campi con decimali. La lettura vocale non
cambia, perché legge da `fmt()` e non dalla pagina.

Nome, unità, distintivi e «◄ Sx» ora seguono la casella, con la variabile
`--lf` scritta da `fit()`: 11 px sul telefono, fino a 22 sul tablet, e il
«◄ Sx» a 1,3 volte. Il margine laterale del numero diventa l'8% della
casella, con un minimo di 26 px.

**Difetto introdotto e trovato provando.** Con il margine in proporzione il
COG sul tablet era sceso da 430 a 331 px invece che di poco. Il ciclo di
`fit()` misurava `row.scrollWidth`, che non scende mai sotto la larghezza
della riga. Finché il limite era la riga intera non si notava; con un limite
più stretto il numero si rimpiccioliva a ogni giro. Ora si misurano il numero
e il distintivo.

Misure dopo la correzione:

| | 375 × 812 | 800 × 1280 |
|---|---|---|
| SOG 12.0 | 143 → **170 px** | 322 → **369 px** |
| COG 332 | 188 → **186 px** | 430 → **406 px** (−6%, con margine ai lati) |

Controllo ripetuto sui layout 2, 3, 4, 5 e 8, a 375, 600 e 1000 px, con WP
attivo, vento manuale e «◄ Sx»: nessun numero o distintivo fuori dalla
casella, nome e unità mai sovrapposti, nessun errore JavaScript, sintassi con
`jsc`.

Ancora dopo, sul tablet: Sergio chiede la parte intera del SOG «pochissimo»
più bassa. Il SOG è limitato dalla larghezza, quindi una riduzione applicata
prima del ciclo sulla larghezza sarebbe stata ricalcolata e annullata. La
riduzione (0,94, costante `DEC_K`) si applica **dopo** il ciclo, solo ai
numeri con decimale. `.dec` passa da 0,66 a 0,70 em, così il decimale resta
quasi invariato.

Misure con SOG 12.0:
- **telefono**: parte intera da 170 a 156 px, decimale da 112 a 109;
- **tablet**: parte intera da 369 a 339 px, decimale da 244 a 237.

---

## 29/09/2026 (8) — La Notte è troppo luminosa: segnalazione, non ancora risolta

Sergio, dall'uscita notturna: **anche con la luminosità dello schermo al
minimo, la modalità Notte era troppo luminosa.** Registrato qui perché non si
perda; nessuna correzione ancora.

Cosa si sa, guardando il codice:
- **Ogni modulo ha la sua tavolozza notte** (`html.night`, 18 file), tutta
  su rossi accesi: `--ink:#ff5b5b`, `--teal:#ff4d4d`. Il rosso preserva
  l'adattamento al buio, ma a quella intensità, su superfici grandi, illumina
  comunque.
- **Nel Cruscotto le cifre sono enormi** (fino a 400 px sul tablet) e hanno
  un alone (`text-shadow`): in Notte sono la superficie accesa più grande
  della suite.
- **La Carta di notte non scurisce le mattonelle**: in `carta/index.html` non
  c'è nessuna regola `html.night` sulla mappa. Mare azzurro e terra chiara
  restano a piena luminosità, probabilmente la fonte peggiore.
- **Tablet** (Active 8 Pro, Android 13): `screen_brightness` 110 su 255
  quando l'ho letto, di giorno. Le impostazioni di sistema «Luminosità extra
  ridotta» (`reduce_bright_colors_*`) risultano mai impostate: non so se
  l'Ulefone le esponga nel menu.

Da decidere con Sergio (proposta nel messaggio di oggi): un velo scuro unico,
regolabile, in `rf-topbar.js`; mattonelle della Carta scurite in Notte; alone
tolto dalle cifre in Notte.

---

## 29/09/2026 (9) — Il velo della Notte, e le carte scurite

Chiude la segnalazione della voce (8): «anche con la luminosità dello schermo
al minimo, la modalità Notte era troppo luminosa». Proposta approvata da
Sergio.

### Strade valutate

- **Scurire le 18 tavolozze `html.night`, una per una.** Scartata: 18 file,
  ciascuno con i suoi rossi, e il rischio di dimenticarne uno. Non avrebbe
  scurito comunque le mattonelle delle carte.
- **Abbassare la retroilluminazione dall'APK**, con un plugin che imposta
  `screenBrightness`. Scartata per ora: il minimo del pannello è quello che
  Sergio aveva già, e nella PWA non esiste.
- **Scelto: un velo nero unico sopra tutto** (`html.night::after`, opacità
  `--rf-velo`, `pointer-events:none`), in `rf-topbar.js`. Scende sotto il
  minimo dello schermo perché spegne i colori, non la luce del pannello. Il
  nero puro non migliora; migliora tutto ciò che è acceso.

### Com'è fatto

- **Quattro livelli**: 0, 35, 55 e 75%. **Il default è 55%**: la segnalazione
  era proprio che «niente» era troppo luminoso.
- **Il livello sta in `raffyca-notte-velo`**, come stringa semplice.
- **Si sceglie in due posti**:
  - Impostazioni, «Oscuramento notte», sotto il Tema;
  - il **☾** nella barra in alto, visibile solo in Notte: ogni tocco passa al
    livello successivo, con un avviso che dice la percentuale.
- **Niente lampo a ogni cambio di pagina.** `rf-topbar.js` è caricato con
  `defer`: se il velo nascesse solo lì, ogni pagina apparirebbe per un
  istante a piena luce. Per questo lo script di avvio del tema, già presente
  in `<head>` in 18 pagine e identico in tutte (controllato con un hash), ora
  in Notte scrive `--rf-velo` e una regola di stile prima del primo disegno.
  Modificato con uno script che pretendeva una sola occorrenza per file: 18
  su 18. **I livelli stanno quindi in due posti**, lo script di avvio e
  `VELI` in `rf-topbar.js`: il commento lo dice in tutti e due.
- **MOB non riceve mai il velo**: una schermata d'emergenza non si scurisce.
  Il suo script di avvio è diverso e non è stato toccato, e `applicaVelo()`
  lo salta.
- **Carte Leaflet**, in tutti i moduli: le mattonelle in Notte vengono
  invertite, virate al rosso e scurite. Mare rosso scuro, terra quasi nera,
  come le carte notturne dei plotter. Anche i bottoni di zoom e i crediti,
  che erano riquadri bianchi, diventano scuri.
- **Cruscotto**: in Notte niente alone attorno alle cifre.

### Difetti trovati provando

1. **Filtro sullo strato sbagliato.** Filtrando `.leaflet-tile-pane` la
   Carta restava a colori: tiene la base in uno strato suo,
   `leaflet-base-pane`, e quello standard contiene solo i segnali di
   OpenSeaMap. Ora il filtro va sulle mattonelle (`img.leaflet-tile`),
   qualunque sia lo strato.
2. **Virare al rosso non basta.** Senza invertire, la carta (quasi tutta
   chiara) diventava rosa salmone, **più luminosa** di prima. Visto sullo
   screenshot. Ora prima si inverte.

Service worker, tutti quelli che precaricano `rf-topbar.js` o una pagina
toccata: **`dritta-hub-v30`, `anchor-v24`, `raffyca-meteo-v26`,
`raffyca-rt-v32`, `xte-v16`**.

### Verificato

Nel browser, a 375 px:
- **18 pagine in Notte** (hub, Meteo, Cruscotto, Traversata, Carta, Ancora,
  XTE, Posizione, Manutenzione, Impostazioni, Performance, Partenza, Sole e
  Luna, Percorso, Calcoli, Prontuario, Strumenti): velo al 55% già dallo
  script di avvio, ☾ presente, nessun errore JavaScript;
- **MOB**: velo 0, nessun ☾;
- **i tocchi attraversano il velo**: `elementFromPoint` restituisce il
  bottone sotto, e il foglio dei campi del Cruscotto si apre;
- **il ☾ gira** su 3 → 0 → 1 → 2, e l'opacità segue;
- **Impostazioni** mostra il livello, lo cambia, e resta in accordo con il ☾;
- **in Giorno** il velo non c'è, e il ☾ è nascosto;
- **la barra in alto** con il ☾ e la registrazione attiva sta nei 375 px, e
  l'ingranaggio resta dentro;
- **Carta**: tutte le mattonelle filtrate, controllato a occhio sugli
  screenshot;
- **sintassi** di `rf-topbar.js` con `jsc`.

### Non verificato

- **Al buio, sul tablet**: è l'unica prova che conta. Da vedere se il 55% è
  il livello giusto e se al 75% i numeri si leggono ancora.
- **Le carte raster proprie e la vista Satellite in Notte**. Le prime escono
  in negativo come la carta, e dovrebbe andar bene; la seconda diventa un
  negativo, di notte comunque inutile.
- **Il costo del filtro sulle mattonelle** con molte mattonelle, spostando la
  carta su un tablet lento.
- **«Luminosità extra ridotta» di Android**: non so se l'Ulefone la mostri.
  Se c'è, si somma al velo.

---

## 29/09/2026 (10) — La Partenza riorganizzata: PIN e RC dove servono

Schizzo approvato da Sergio con una correzione: «procedi con il vento, con
maggiore evidenza al vento in manuale». Solo spostamenti di elementi
esistenti con i loro `id`: 57 riferiti dal JavaScript, tutti presenti. Lo
script segnala un `cdState` doppio, ma è un falso allarme: il secondo sta
dentro una stringa JavaScript che riscrive lo stesso elemento, ed era così
anche prima.

### Com'era

Una colonna di 428 px anche sul tablet, alta 1400 px sul telefono. Dall'alto:
- conto alla rovescia, poi Dist / TTL / TTK;
- grafico della linea (420×290);
- vento (due campi);
- SOG e VMG in un riquadro loro;
- definizione della linea, con dentro **i bottoni per prendere PIN e RC**;
- archivio.

**Nei minuti prima del via, i bottoni che servono stavano quasi in fondo.**

### Com'è

- **In cima** conto alla rovescia (26vw sul telefono, fino a 150 px), i tre
  numeri e subito sotto **«PIN qui» / «RC qui»**, alti 58 px, ciascuno con il
  suo distintivo «ok».
- **Vento subito dopo**, con il manuale in evidenza:
  - campi a 34 px;
  - il distintivo della sorgente più grande, da toccare;
  - «manuale» in acqua invece che in grigio.
- **Grafico** limitato a 34vh sul telefono e 52vh sul tablet, con il
  favorito sotto.
- **SOG, VMG e COG** su una riga.
- **Definizione della linea e archivio** in due fogli («Linea ›»,
  «Archivio ›»): servono prima e dopo, non durante.
- **Da 600 px, due colonne**: conto, numeri, PIN/RC e vento a sinistra;
  grafico, SOG e fogli a destra. Sul tablet in verticale sta tutto in una
  schermata.
- **Via la cornice sfumata** (`.rf-instr`), come nel Cruscotto. In Notte
  niente alone sulle cifre.

### Il vento: la previsione scartata

Lo schizzo proponeva il vento automatico da `rf-strumenti.js` (strumenti,
altrimenti previsione), come in Ancora e Cruscotto. Leggendo il codice: **la
Partenza ha già la sua sorgente automatica, ed è migliore.** Usa
`rf-nmea.js` con la media circolare a 60 s, segna in giallo il TWD stimato
dal COG, e torna in manuale appena si scrive nel campo.

La previsione non è stata aggiunta. Per il lato favorito serve la direzione
al grado; un modello orario sbaglia di dieci gradi e più, e darebbe un
favorito dall'aria sicura senza esserlo. Il ripiego in Ancora e Cruscotto va
bene perché lì basta l'ordine di grandezza. Qui no.

### Difetto trovato e corretto

**«Imposta qui (GPS)» senza fix non faceva nulla, in silenzio**:
`pingHere()` usciva senza dirlo. Nel pre-partenza uno crede di aver preso
l'estremo e non l'ha preso. Ora c'è un avviso, «Niente GPS: PIN non preso».
Quando invece riesce: vibrazione e «PIN preso qui». L'avviso usa la classe
`.toast`, che è già nell'elenco di `rf-topbar.js`, quindi sale sopra la barra
in basso.

Service worker: nessuno da alzare. `partenza/` non è nel precache, e l'HTML
lo serve prima la rete (`dritta-hub`).

### Verificato

Nel browser, con una linea e un vento d'esempio poi cancellati:
- **PIN senza GPS**: l'avviso compare;
- **linea salvata**: «L 280 m · 76°», «favorito RC · 4° · +18 m»;
- **vento a 10°**: il favorito si ricalcola, «RC · 24° · +113 m»;
- **sorgente del vento**: «manuale» → «nessun dato» (strumenti non
  collegati) → «manuale»;
- **fogli**: Linea e Archivio si aprono e si chiudono, dal fondo e da
  «Chiudi»; in «un estremo + direzione» la riga della direzione compare e
  «RC qui» si disattiva;
- **larghezze**: a 375, 600 e 1000 px niente sborda; sul telefono la pagina
  passa da 1400 a 1180 px, sul tablet due colonne da 380 px;
- **Notte**: velo al 55%, nessun alone;
- **errori**: nessun errore JavaScript; sintassi con `jsc`.

### Non verificato

- **Conto alla rovescia vero, segnali audio, OCS e archivio con una partenza
  registrata**: la logica non è stata toccata, ma senza GPS in movimento nel
  pannello non si prova.
- **I bottoni con i guanti**, sul tablet.

### Dopo, dal tablet: la linea lontana spaginava la schermata

Sergio, con uno screenshot del tablet: linea lunga 3,6 km, barca a 110 km
(«caso limite»). La distanza era scritta **«109824 m»**. La prima casella dei
tre numeri si allargava per il contenuto e spingeva TTL e TTK fuori dalla
colonna, sopra il grafico; «time to kill» andava a capo su tre righe.

Due difetti, e due correzioni, perché ognuna da sola non basta:
- **Il formato.**
  - La distanza è in metri fino a 999, poi in miglia: una cifra decimale
    sotto le 100 NM, intere sopra (`fmtDist`).
  - TTL e TTK passano a ore e minuti oltre l'ora («1h06»), e oltre le 99
    ore scrivono «>99h» (`fmtTL`). Prima `fmtT` avrebbe dato «6100:00».
    Il conto alla rovescia continua a usare `fmtT`.
- **La griglia.**
  - Le colonne sono `minmax(0,1fr)` e le caselle hanno `min-width:0`: un
    numero non può più allargare la sua casella.
  - Il numero viene rimpicciolito finché ci sta (`adatta()`, anche alla
    rotazione).
  - Le note sotto i numeri restano su una riga.

Verificato:
- **formati**: `fmtTL` e `fmtDist` provati con `jsc` su 17 casi, compresi
  59:59 → 1h00, «>99h», 999 m → 0,5 NM, 109824 m → 59,3 NM, tutti giusti;
- **larghezze**: con un GPS finto in una copia temporanea della pagina (poi
  cancellata), linea e barca a 650 m, 2 km, 110 km e 400 km, a 375, 600, 800
  e 1000 px: nessuna casella fuori dalla sua colonna, nessun numero tagliato;
- **il caso di Sergio** a 800 × 1280: «54.7 NM» nella casella, TTL e TTK al
  loro posto.

Non verificato: **TTL con la barca che si avvicina**. Il GPS finto dà una
posizione sola, e la Partenza ricava la COG da posizioni successive: TTL
resta «non avvicini». Il formato l'ho provato a parte.

---

## 29/09/2026 (11) — Percorso: i comandi della gara sempre in vista

Schizzo approvato da Sergio. Toccata solo la scheda **Regata**; Percorso
(costruzione) e Analisi restano come erano, tranne titolo e viti.

### Il difetto

Nella scheda Regata **«▶ Avvia», «Boa passata» e «↩ Indietro» stavano
sotto la planimetria**:
- telefono, 375 px: a 1003 px dall'inizio di un'area che ne mostra 646;
- tablet, 800 px: a 1375 su 1106, perché la planimetria era larga quanto lo
  schermo (780 px).

Per segnare una boa a mano, in gara, bisognava scorrere.

### Com'è

- **I tre comandi in fondo alla scheda, `position:sticky`**: restano in
  vista dentro `.rf-main`, che è quello che scorre. Non sono un elemento
  fisso, quindi non vanno nell'elenco di `rf-topbar.js`. Alti 56 px;
  «Indietro» diventa un «↩» stretto (con `aria-label`), perché a 375 px
  «Boa passata» andava a capo.
- **Griglia a quattro blocchi**:
  - sul telefono: prossima boa e valori, planimetria (al massimo 40vh),
    vento e comandi secondari;
  - da 600 px: la planimetria a destra (fino a 62vh), il resto a sinistra.
    Sul tablet in verticale sta tutto senza scorrere.
- **«Sposta boa qui» e «Fine registrazione»** su una riga, sotto il vento.
- **Gli avvisi** salgono sopra la barra dei comandi, invece di coprirla, e
  vanno a capo invece di uscire dallo schermo a destra.
- **Via il titolo** «Percorso regata», che ripeteva la barra in alto. **Il
  piede** entra nel contenuto che scorre, invece di occupare una riga
  sempre visibile.
- **Via viti e cornice sfumata**, come nel resto della suite. Scritto nella
  pagina, non in `raffyca.css`, che è condiviso e precaricato.

### Controlli sugli `id`

- Un solo `id` sparito, `endRecRow`, il contenitore di «Fine
  registrazione». Nessun codice lo usa (cercato).
- Sei `id` riferiti dal JavaScript mancano nella pagina: `dialTwd`,
  `dialTws`, `twdV`, `twsV`, `gpsDot`, `gpsTxt`. **Mancavano identici anche
  prima** (confrontato con la versione in `main`): è il codice morto già
  registrato il 04/09.

Service worker: nessuno da alzare. `percorso/` non è nel precache, e l'HTML
lo serve prima la rete.

### Verificato

Nel browser, con un percorso d'esempio (2 boe, 2 giri) e il simulatore, poi
tutto cancellato:
- **«Boa passata» in vista** a 375 px sia in cima sia in fondo alla scheda;
  a 800 px senza scorrimento;
- **comandi**: «Boa passata» porta a Boa 2, «↩» torna a Boa 1, fermando il
  simulatore il bottone torna «▶ Avvia»;
- **avvisi**: sopra la barra, dentro lo schermo;
- **schede**: Percorso, Regata e Analisi si alternano;
- **errori**: nessun errore JavaScript; sintassi con `jsc`.

### Non verificato

- **Una regata vera col GPS**: il passaggio boa automatico entro il raggio
  non è stato toccato, ma non l'ho visto fuori dal simulatore.
- **Sfogliare i valori col dito**, dentro la griglia nuova, sul tablet.

---

## 29/09/2026 (12) — Performance leggibile, e la Traccia polare che era inventata

Proposta approvata da Sergio; la Traccia polare è una scoperta fatta durante
il lavoro, decisa con lui.

### Leggibilità e tablet

Chiude i punti rimasti aperti dalla voce 28/09 (6).
- **Prima**:
  - colonna di 560 px anche sul tablet;
  - diagramma polare al massimo 330 px;
  - nomi degli indicatori a 9 px, schede a 12, note a 10-11.
- **Ora**:
  - tutto lo schermo, fino a 1100 px;
  - da 700 px, in Polare e Traccia polare, indicatori a sinistra (quello
    col cursore su tutta la riga) e grafico a destra;
  - diagramma fino a 560 px (393 sul tablet in verticale);
  - scritte: indicatori 12 px, schede 15 px e alte 48, note 13.
- Le etichette dentro i grafici crescono con il grafico, che è un SVG in
  `viewBox`.

### Importa CSV: il messaggio onesto

`parseCSV` **conta** soltanto i punti validi. Prima si creava comunque una
sessione «CSV importato» con N punti dichiarati e nessuno dentro, e il
messaggio diceva «N punti validi». Ora:
- non si crea niente;
- il messaggio è «Riconosciuti N punti validi, ma il caricamento della
  nuvola non c'è ancora: non sono stati aggiunti».

Il caricamento vero aspetta un file degli strumenti di Sergio, per fissarne
il formato (scelta sua: «messaggio onesto per ora»).

### La Traccia polare era inventata — ed era pericolosa

Guardando la scheda con il localStorage vuoto comparivano **tre uscite**:
- 27/07 Golfo di Trieste, 64 pt;
- 20/07 Alto Adriatico, 51 pt;
- 12/06 Golfo di Trieste, 45 pt.

Erano **scritte nel codice**, come valore predefinito di
`raffyca-polar-cloud`. La nuvola di punti **non veniva da nessuna
registrazione**: `cloudFor()` generava N punti a caso (`mulberry32`)
attorno a `vBoatDemo`, una barca d'esempio. Anche «rif. ORC» era
`vBoatDemo`, non la polare ORC.

**Il pericolo**: «Traccia polare definitiva» → «Salva come polare della
suite» scriveva in **`raffyca-polar`**, cioè sopra la polare ORC che usano il
Cruscotto (% polare) e la Traversata (routing), una polare ricavata da punti
inventati. Nessun avviso. Stessa famiglia del vento «Stima» del Cruscotto
(voce 29/09 (4)): numeri d'esempio presentati come veri.

Sul tablet di Sergio non è successo: la barra in alto dice «pol ORC» (dal suo
screenshot di oggi).

Strade proposte a Sergio:
1. **svuotare e bloccare** (scelta sua);
2. togliere la scheda;
3. lasciarla con un'etichetta «esempio».

Fatto:
- **`sessions()` mostra solo sessioni con punti veri** (`pts`, elenco di
  `{twa, tws, stw}`; `twa` con segno, negativo a sinistra). Le tre d'esempio
  e le «CSV importato» vuote, se un dispositivo le ha già salvate, non si
  vedono e non generano niente. Non vengono cancellate dal dispositivo: il
  primo salvataggio della lista le toglie comunque.
- **`cloudFor()` legge quei punti** (fascia TWS ±2 kn), non li inventa.
  Tolte `vBoatDemo` e `mulberry32`, non più usate.
- **Il riferimento è la polare della suite** (`polarTarget` su
  `raffyca-polar`); senza polare, niente riferimento.
- **Senza punti veri**:
  - la scheda dice «Nessuna uscita registrata»;
  - «Traccia polare definitiva» e «Salva come polare della suite» non
    compaiono;
  - il salvataggio, anche chiamato a mano, risponde «la polare della suite
    non viene toccata».

Il formato `pts` è nuovo e **nessuno lo scrive ancora**: è pronto per quando
si registreranno le uscite, o per l'importazione CSV vera.

Service worker: nessuno da alzare. `performance/` non è nel precache.

### Verificato

Nel browser, con una polare d'esempio poi cancellata:
- **localStorage con le tre uscite d'esempio e una «CSV importato» vuota**
  (come può essere su un dispositivo): 0 sessioni mostrate, 0 punti,
  messaggio «Nessuna uscita registrata», bottoni nascosti;
- **salvataggio forzato**: messaggio, e `raffyca-polar` identica a prima;
- **riferimento**: disegnato dalla polare della suite;
- **una sessione con 56 punti veri**: nuvola disegnata, curva definitiva e
  «Salva» di nuovo disponibili;
- **Importa CSV** (file di prova via `DataTransfer`): «Riconosciuti 2 punti
  validi…», sessioni 3 prima e 3 dopo;
- **larghezze**: le quattro schede a 375 e 800 px senza scorrimento
  orizzontale;
- **errori**: nessun errore JavaScript; sintassi dei 4 script con `jsc`.

### Non verificato

- **Il salvataggio vero della polare da punti reali**: il codice non è
  cambiato, ma non ci sono ancora punti reali.

---

## 29/09/2026 (13) — Sezione Barca: un giro leggero di leggibilità

Manutenzione, Prontuario e Calcoli si consultano in porto o all'ancora, non
in manovra. L'inventario non ha trovato comandi nascosti né dati inventati:
l'unico `Math.random` genera un identificativo. Quindi niente spostamenti,
solo misure. Proposta approvata da Sergio, che ha mandato due screenshot di
Manutenzione con i suoi dati dal tablet.

### Cosa c'era

| Modulo | Tablet | Scritte sotto i 12 px |
|---|---|---|
| Calcoli | colonna di 720 px | 55 su 170 (10,5 e 11 px: unità, formule sotto i risultati) |
| Prontuario | colonna di 560 px, riquadri su 2 colonne | 7 nella pagina, più una ventina nelle sezioni (sigle, intestazioni, scale del simulatore fari) |
| Manutenzione | colonna di 560 px | distintivi, conteggi, didascalie a 10,5-11 px |

Il tablet di Sergio è largo 600 px CSS in verticale: lì le colonne di
560-720 px occupano già quasi tutto. **Il guadagno vero sono le scritte**; le
larghezze contano in orizzontale.

Dagli screenshot di Manutenzione:
- **«Elimina lavoro» stava attaccato sotto «Salva modifiche».** C'è già la
  conferma («Elimina davvero»), ma il primo tocco non deve cadere lì per
  sbaglio: ora c'è uno stacco di 18 px.
- **Il nome della barca è diverso** fra la barra in alto («Te' Sailt cr»,
  dal profilo di Impostazioni) e l'intestazione di Manutenzione («Proteus Tè
  Salt · 2003», dal database). Segnalato a Sergio, non toccato: è un dato,
  non il codice.

### Fatto

Tutto in blocchi di stile in fondo alle tre pagine, nessuna logica toccata:
- **Calcoli**: fino a 900 px; unità, formule e intestazioni di tabella
  almeno 12 px.
- **Prontuario**:
  - fino a 900 px, riquadri su 3 colonne da 760 px;
  - righe dei riquadri 13 px;
  - dentro le sezioni: scelte rapide (`.chip`) 13 px e più alte, sigle,
    intestazioni, scala dei tempi del simulatore fari, sottotitoli dei
    tre bottoni VHF almeno 12 px.
- **Manutenzione**:
  - stacco sopra «Elimina lavoro / intervento / componente»;
  - distintivi e conteggi a 12 px;
  - la tabella del Dossier resta a 9,5 pt, perché è il documento da
    stampare.

Service worker: **`dritta-hub-v31`**. Le tre pagine sono nel precache
dell'hub.

### Verificato

Nel browser, con localStorage vuoto:
- **Calcoli**, a 375 e 1000 px con tutte le sezioni aperte: 170 testi,
  **nessuno sotto i 12 px** (erano 55), niente sborda;
- **Prontuario**: pagina iniziale 0 sotto i 12 px (erano 7); aprendo una
  per una le sette sezioni, 339 testi, **nessuno sotto i 12 px**, niente
  sborda, a 375 e 1000 px;
- **Manutenzione**: niente sborda, stacco di 18 px sopra «Elimina»;
- **errori**: nessun errore JavaScript.

### Non verificato

- **Manutenzione con i dati veri**: senza il database, nel pannello si vede
  solo la schermata vuota. I dati di Sergio non li ho usati per provare.
  Da guardare sul tablet: elenco lavori, schede, Dossier.

---

## 29/09/2026 (14) — Sole & Luna: la marea in vista, e niente posizione di comodo

Ultimo modulo della sezione Preparazione nel programma di riorganizzazione.
Metodo solito: inventario, schizzo con la tabella «oggi → nello schizzo»,
approvazione di Sergio («sì, ma mantieni i grafici»), elementi spostati
tenendo gli `id`.

### Cosa c'era

Al tablet (600 px):
- la **marea** cominciava a 1284 px, sotto il grafico delle altezze: fuori
  dallo schermo;
- **18 tipi di scritte sotto i 12 px** (etichette a 10,5, sigla del chip a
  9,5, coordinate, didascalie);
- «aggiorna» alto 28 px, la casella del bacino 18 px, i passi dell'arrivo
  36 px;
- tre fasce in alto (schede, barra della data, «Adesso»).

E due dati non veri, trovati aprendo la pagina con il localStorage vuoto:
- **Il punto di comodo.** Senza nessuna posizione (GPS mai acceso, nessuna
  `raffyca-pos`), la pagina calcolava alba, luna e marea su un punto fisso,
  `DEFAULT_POS` = 41,21 N 9,40 E (Bocche di Bonifacio), e il chip diceva
  **«GPS · Posizione attuale»**. Stessa famiglia del vento «Stima» del
  Cruscotto e della Traccia polare di Performance: un numero d'esempio
  presentato come vero. In più, il primo fix non rimpiazzava il punto:
  `onGeo` ridisegnava ma non ricalcolava il giorno, quindi si restava su
  Bonifacio fino al primo tocco.
- **La velocità all'ormeggio.** Il SOG stimato da due fix veniva preso
  sempre, con un minimo di 0,1 kn: con la barca ferma l'arrivo finiva a
  giorni di distanza. E anche qui un fix nuovo non ricalcolava l'arrivo.

### Scelte di Sergio

- Senza posizione: **dirlo e non calcolare niente** (scartato: tenere
  Bonifacio con l'etichetta «predefinita»).
- Velocità: **il GPS solo sopra 1 kn**; sotto resta quella a mano (5,5 kn di
  partenza, o quella scelta con − e +). Scartato: sempre a mano.
- I due grafici restano alla loro dimensione (li ha chiesti esplicitamente).

### Fatto

- **In alto** una riga sola: data (senza l'anno, se è quello corrente) e
  «Adesso», poi Giorno / Volta celeste. Sotto, i luoghi: **«Qui»** se il fix
  ha meno di 2 minuti, altrimenti «Qui · 3 min fa», «· 3 h fa»; il
  waypoint, o la **fine della traccia attiva** (sigla TR), che prima non
  era fra i luoghi.
- **Senza posizione** un riquadro «Posizione sconosciuta: accendi il GPS,
  oppure attiva un waypoint dalla Carta» e nient'altro. Il primo fix
  ricalcola e fa comparire la pagina; una barca spostata di oltre un miglio
  fa ricalcolare il giorno.
- **Luce all'arrivo** (era «Che luce troverò all'arrivo»): prima l'ora
  grande e la condizione di luce, poi «calcolato · 10,0 nm a 5,5 kn a
  mano / dal GPS», poi tre comandi alti `--tocco` (ora, giorno, nodi). La
  riga sulla nuvolosità è diventata «Non tiene conto delle nuvole.»
- **Tre riquadri: Sole, Luna, Marea.** Quello della Marea dice se cala o
  cresce e quando arriva la stanca; toccandolo si scende al dettaglio. Da
  900 px il riassunto sparisce, perché la marea intera sta nella colonna
  accanto.
- **Da 900 px due colonne**: luce a sinistra (arrivo, Sole e Luna, grafico),
  marea e crepuscoli a destra. Volta celeste: sfera a sinistra, comandi a
  destra.
- **Leggibilità**: collegato `raffyca.css` per `--t-*`, `--lab`, `--tocco`;
  nessuna scritta sotto i 12 px; `--sub` e `--muted` schiariti nei tre temi;
  righe della marea e dei crepuscoli alte 44 px; riga del bacino alta
  `--tocco` con casella da 26 px; cursore del tempo con pomello da 30 px;
  etichette degli assi dei due grafici da 10 a 12 px.

La logica astronomica e quella della marea non sono state toccate.

Service worker: **`dritta-hub-v32`** (`sole-luna/` è nel precache
dell'hub; `raffyca.css` c'era già).

Dopo l'approvazione, tre ritocchi chiesti da Sergio:
- nel chip della posizione un **mirino** al posto della sigla «GPS», poi
  anche senza «Qui» e senza cornice: resta solo il mirino (teal quando è
  scelto) e, se il fix è vecchio, l'età («3 h fa»);
- il pomello del cursore del tempo è **teal**, non più ambra: «sembra il
  sole», e nel grafico accanto ambra è proprio il sole;
- nella Volta celeste **sole e luna un po' più grandi**: disco del sole da
  8,5 a 12 px (alone da 24 a 32), luna da 9 a 12.

### Verificato

Nel browser, dal worktree:
- **localStorage vuoto**: riquadro «Posizione sconosciuta», niente data né
  schede, nessun errore; passando a Volta celeste resta nascosto tutto;
- **primo fix finto** (geolocalizzazione sostituita prima del caricamento):
  la pagina compare, chip «GPS Qui», alba calcolata sul punto del fix;
- **posizione di 3 ore prima**: chip «Qui · 3 h fa»;
- **barca ferma** (due fix nello stesso punto): velocità resta 5,5 kn «a
  mano», arrivo invariato; **in moto**: velocità «dal GPS», arrivo
  ricalcolato; **+ a mano**: torna «a mano»;
- **larghezze**: a 375, 600 e 1000 px niente sborda, **nessuna scritta sotto
  i 12 px**, nessun comando sotto i 40 px (la casella del bacino è 26 px,
  ma la sua riga intera è il bersaglio, alta 54);
- al tablet (600 px) il riassunto della marea sta a 523 px, nel primo
  schermo (la marea era a 1284);
- tema giorno a 600 px;
- sintassi con `jsc`; ogni `id` riferito esiste.

APK costruito dal worktree e installato sul tablet via adb, senza toccare lo
schermo.

### Non verificato

- **Sul tablet, al sole**: da guardare la riga in alto (data + schede) e i
  tre riquadri a 600 px, che sono stretti (circa 180 px l'uno).
- **Il GPS vero** in movimento: la soglia di 1 kn è provata solo con fix
  finti.
- Tema notte: non guardato dopo le modifiche.

---

## 30/09/2026 — Posizione live: il QR in vista, e il nome che arriva a terra

Primo modulo della sezione Navigazione rimasto fuori dal programma di
riorganizzazione. Metodo solito: inventario, schizzo con la tabella «oggi →
nello schizzo», approvazione di Sergio, elementi spostati tenendo gli `id`.
La trasmissione vera (`rf-live.js`) non è stata toccata, salvo il nome
della barca.

### Cosa c'era

Al tablet (600 px), con il localStorage vuoto:
- **sei riquadri**, nell'ordine Trasmissione, Dati a bordo, Verso il WP,
  Impostazioni invio, Link, Dove finisce la posizione: il QR, cioè la cosa
  che si mostra a chi resta a terra, cominciava a 810 px, sotto la barra in
  basso;
- **quattro tipi di scritte sotto i 12 px** (etichette a 9,5, titoli a 11);
- Copia link e Nuovo codice alti 35-37 px, la frequenza 37;
- display con le righe da monitor vecchio e l'ombra incassata;
- tre paragrafi di spiegazione, e un rimando a «Tracce & Waypoint», che
  non esiste più.

### Il nome della barca

Aprendo la pagina senza profilo si trova, in `posizione/index.html`,
`boatName()` che ripiega su **«Raffyca»**. Sembrava il nome che arriva a chi
segue. Non lo era: `boatName()` e `buildPayload()` **non le chiamava nessuno**
dal 22/08, quando la trasmissione è passata in `rf-live.js`. Il payload vero
lo costruisce `nomeBarca()` in `rf-live.js`, che ripiegava su **«Dritta»**;
e `segui.html`, se il nome mancava, mostrava «Raffyca».

Tutti e due i ripieghi sono sbagliati: «Dritta» è il nome dell'app, e chi
segue da terra lo legge come il nome della barca; «Raffyca» è una barca
d'esempio. Scelta di Sergio: **«Barca»**, e un avviso nella pagina di bordo.

- `rf-live.js`: il ripiego è «Barca»;
- `segui.html`: il ripiego è «Barca»;
- `posizione/index.html`: tolte `boatName()` e `buildPayload()`, codice morto;
  nuova riga «Chi ti segue vede «Barca»: il nome della barca si mette in
  Impostazioni», che compare solo se il profilo non ha né `boat` né `model`.

Scartato: lasciare «Raffyca» (non era neanche lui a partire).

### Fatto

- **Trasmissione**: Avvia/Ferma e frequenza sulla stessa riga, alti
  `--tocco`; sotto «Ultimo invio · prossimo fra»; lo stato; l'avviso del
  database non configurato porta a Impostazioni. Il riquadro «Dove finisce la
  posizione» è tolto: diceva la stessa cosa in un secondo posto.
- **Cosa stai inviando** (erano «Dati a bordo» e «Verso il WP attivo»): SOG,
  COG, età del fix, posizione, e il waypoint con distanza, TTG, ETA. Display
  piatti. Senza waypoint: «attivalo dalla Carta».
- **Link per chi ti segue**: QR da 190 px accanto al link e ai due bottoni;
  una riga sola di testo. Da 900 px sta nella colonna di destra, in alto.
- **Età del fix mai negativa**: con l'ora del GPS un po' avanti rispetto
  all'orologio del dispositivo, usciva «−6s».
- **Leggibilità**: collegato `raffyca.css`; niente scritte sotto i 12 px;
  `--sub` schiarito nei tre temi.
- **`segui.html`, solo leggibilità** (scelta di Sergio: è la pagina pubblica,
  si tocca poco): display piatti, etichette da 12 px, testi da 13-15 px, la N
  della bussola da 8 a 11 px, grigio schiarito. Niente spostato.

Service worker: `rf-live.js` sta nel precache di cinque moduli, e sono stati
alzati tutti e cinque — **`dritta-hub-v33`**, **`xte-v17`**,
**`raffyca-rt-v33`**, **`raffyca-meteo-v27`**, **`anchor-v25`** —
altrimenti metà suite avrebbe continuato a mandare «Dritta» dalla cache.
`posizione/` e `segui.html` non sono in nessun precache.

### Verificato

Nel browser, dal worktree:
- **localStorage vuoto a 600 px**: tutta la pagina nel primo schermo, QR a
  608 px (era 810); avviso del database e del nome;
- **trasmissione con GPS e database finti** (geolocalizzazione e `fetch`
  sostituiti prima di premere Avvia): parte una `put_pos` con
  **`b: "Barca"`**, posizione, COG, SOG 5,8, waypoint Pirano a 9,99 nm;
  pagina in «LIVE», «Trasmissione attiva»;
- **con il nome nel profilo** l'avviso sparisce;
- **larghezze**: a 375, 600 e 1000 px niente sborda, nessuna scritta sotto i
  12 px, nessun comando sotto i 44 px; a 1000 px due colonne;
- **`segui.html`** a 375 px, con un dato passato a mano a `paint()`: «Barca»,
  nessuna scritta sotto i 12 px fuori dalla mappa;
- sintassi con `jsc`; ogni `id` riferito esiste.

APK costruito dal worktree e installato sul tablet via adb, senza toccare lo
schermo.

### Non verificato

- **Il giro vero**: trasmissione dal tablet e lettura di `segui.html` da un
  altro telefono, con il progetto Supabase vero.
- **La traccia attiva non arriva a chi segue**: il payload porta solo il
  waypoint attivo, mentre gli altri moduli danno la precedenza alla traccia.
  Non toccato: cambia il contratto del payload.
- Temi giorno e notte non guardati dopo le modifiche.

---

## 30/09/2026 (3) — Strumenti esce da Navigazione: il gateway va in Impostazioni

Applicata la parte della struttura decisa il 28/09 (voce (3)) che riguarda
`strumenti.html`: «Cruscotto con dentro i dati di strumenti.html» e «la
configurazione del gateway va in Impostazioni».

XTE, che veniva prima nel programma, è **sospeso**: Sergio ha visto la vista
a corridoio (ramo `xte`, non unito; storia nella voce 30/09 (5)) e ha scritto «la grafica
non mi convince, per adesso saltiamo». Il ramo resta come parcheggio.

### Cosa c'era

`strumenti.html` è un banco di prova del lettore NMEA: otto riquadri
(vento reale e apparente, STW, profondità, prua, COG/SOG, temperatura), la
provenienza di ogni valore, le ultime frasi grezze, e la casella
dell'indirizzo. Tutti gli otto valori sono già riquadri del **Cruscotto**, che
li legge dallo stesso `rf-nmea.js` via `rf-strumenti.js` dal 29/09: come voce
di Navigazione era un doppione. L'indirizzo del gateway invece si poteva
impostare **solo** lì.

### Fatto (proposta approvata da Sergio)

- **Menu**: «Strumenti» tolto dalla sezione Navigazione (`rf-topbar.js`).
- **Impostazioni**: riquadro nuovo «Strumenti di bordo (NMEA)», dopo lo Stato
  GPS: indirizzo (nell'app il **gateway**, nel browser il **ponte**
  WebSocket, stessa logica della casella che c'era), stato del collegamento
  con il pallino, Salva, e «Diagnostica» che apre `strumenti.html`.
  Impostazioni ora carica `rf-nmea.js`: nell'app si collega al gateway anche
  da lì, come fanno già le altre pagine che lo caricano.
- **`strumenti.html` diventa «Diagnostica strumenti»**: stessi valori, stesse
  note sulla provenienza, stesse frasi grezze; l'indirizzo si mostra in sola
  lettura con «si cambia in Impostazioni» (un posto solo per cambiarlo).
  Scritte da 12 px in su, grigi schiariti.
- **Cruscotto, riquadro Alba / Tramonto**: senza posizione calcolava su
  Trieste (45,65 N 13,77 E) senza dirlo — stessa famiglia di Bonifacio in
  Sole & Luna (voce 29/09 (14)). Ora senza posizione «—». Scelta di Sergio.

Service worker: `rf-topbar.js` sta nel precache di cinque moduli, alzati
tutti e cinque — **`dritta-hub-v34`**, **`xte-v18`**, **`raffyca-rt-v34`**,
**`raffyca-meteo-v28`**, **`anchor-v26`**. `impostazioni/`, `cruscotto/` e
`strumenti.html` non sono in nessun precache.

**Attenzione per il ramo `xte` parcheggiato**: usa anche lui `xte-v18`. Se
un giorno si unisce, va portato almeno a `xte-v19`, altrimenti i dispositivi
che hanno già la v18 di questa voce non scaricano l'XTE nuovo.

### Verificato

Nel browser, dal worktree, a 600 px:
- **Impostazioni**: etichetta «Ponte» (browser), Salva scrive
  l'indirizzo in `rf-nmea` («✓ Salvato»), senza ponte acceso lo stato passa
  a «caduto» con il pallino rosso;
- **Diagnostica**: «Ponte ws://127.0.0.1:1460 · si cambia in Impostazioni»,
  nessuna scritta sotto i 12 px, niente sborda;
- **menu Navigazione**: Carta, Cruscotto, Ancoraggio, Posizione live, XTE;
- sintassi con `jsc` di tutti gli script toccati; ogni `id` riferito esiste.

APK costruito dal worktree e installato sul tablet via adb, senza toccare lo
schermo.

### Non verificato

- **Il gateway vero dall'app**: salvare l'indirizzo da Impostazioni e vedere
  i valori nel Cruscotto. La logica è la stessa della casella di prima, ma
  da questa pagina non è stata provata.
- Il riquadro Alba / Tramonto non l'ho visto a schermo: modifica di una riga,
  controllata leggendo.
- In Diagnostica, a collegamento spento, la prua dice «nessuna bussola sul
  bus»: vero solo a collegamento acceso. Non toccato.

---

## 30/09/2026 (4) — L'hub: il vento dallo stesso motore del Cruscotto

Ultimo pezzo del programma di riorganizzazione. L'hub era già stato rifatto
il 28/09 (voce (5)) come pagina di stato: a 600 px sta tutto in una
schermata, nessun comando sotto i 44 px. L'inventario ha trovato tre cose,
proposte a Sergio e approvate tutte e tre.

### Il vento

L'hub scaricava **sempre** la previsione di Open-Meteo con una sua `fetch`,
anche col gateway collegato: il Cruscotto mostrava il vento degli strumenti,
l'hub quello del modello, senza che la differenza si vedesse. Era l'aperto
lasciato nella voce del 28/09 («l'hub non carica `rf-nmea.js`»).

Ora l'hub carica `rf-nmea.js` e `rf-strumenti.js` e chiede il vento a
`rfStrumenti.vento()`, lo stesso ordine del Cruscotto e della Carta:
manuale se scelto nel Cruscotto, poi strumenti di bordo, poi previsione.
La nota sotto il numero dice sempre da dove viene: «Dagli strumenti di
bordo», «Vento manuale, impostato nel Cruscotto», «Previsione del modello
per le hh:mm · raffiche N kt». La `fetch` propria dell'hub è tolta: un posto
solo che scarica la previsione.

Il vento si rilegge ogni 5 s (la previsione `rf-strumenti` la scarica al
massimo ogni 10 minuti o dopo 5 NM) e a ogni cambiamento del gateway; due
riletture ravvicinate all'avvio, perché la prima risposta della previsione
arriva dopo.

Perso rispetto a prima: il **limite di 12 s** sulla richiesta. In
`rf-strumenti.js` la `fetch` non ha un timeout; su una rete lenta la nota
resta «Cerco il vento…» finché la richiesta non si chiude. Non toccato qui:
riguarda anche Cruscotto e Carta, e cambiarlo vuol dire alzare cinque
service worker.

### Le due scritte

- Marea: «stima incerta qui» → «da verificare le condizioni locali», come
  in Sole & Luna (voce 20/09 (2): «incerta» si legge come «sbagliata»).
- «suite nautica» sotto il nome: da 10 a 12 px. Il piede con lo slogan non
  è stato toccato: è allineato con gli altri tre.

Service worker: **`dritta-hub-v35`** (`index.html` è nel precache;
`rf-nmea.js` e `rf-strumenti.js` c'erano già).

### Verificato

Nel browser, dal worktree, a 600 px:
- **previsione**: «2 kt, da ESE · 114°, Previsione del modello per le 07:15 ·
  raffiche 7 kt» (Open-Meteo vero);
- **strumenti** (`rfNmea.dati` sostituita con TWS 18,3 e TWD 245°): «18 kt,
  da WSW · 245°, Dagli strumenti di bordo»; tolti gli strumenti torna la
  previsione;
- **manuale** (`raffyca-dash` con `wind: manual`): «10 kt, da E · 090°, Vento
  manuale, impostato nel Cruscotto»;
- **senza posizione**: «Il vento compare quando c'è una posizione»;
- marea con la dicitura nuova; sintassi degli script con `jsc`.

APK costruito dal worktree e installato sul tablet via adb, senza toccare lo
schermo.

### Non verificato

- Il gateway vero: provato sostituendo la funzione che legge i dati.
- La rete lenta (vedi sopra, il limite di 12 s perso).

### Dove è arrivato il programma

Fatti tutti i moduli della lista del 28/09, tranne **XTE**, sospeso con la
grafica non approvata (ramo `xte`). Ripreso subito dopo con lo schema di
Sergio: voce 30/09 (5).

---

## 30/09/2026 (5) — XTE: lo schema di Sergio, e l'aggancio che sbagliava segmento

XTE era ancora il modulo upstream «non reskinnato»: palette propria
(`#0b0d10`), sfera lucida con ombre, e una sua barra a schede impilata sopra
quella di Dritta. Questa voce raccoglie due giri: una prima grafica bocciata,
e quella disegnata da Sergio.

### Cosa c'era

Al tablet (600 px), con il localStorage vuoto:
- **«Avvia GPS» stava nella scheda Impostazioni**: il comando da usare in
  navigazione non era nella schermata di navigazione (stesso schema trovato
  in Partenza e Percorso).
- **Il pallone al centro copriva la traccia** (segnalato da Sergio), e la
  freccia orizzontale copriva il resto.

E tre dati non veri:
- **La rotta di comodo.** `EMBEDDED`, 73 punti di un canale a Porto Levante
  scritti nel codice, era la rotta di partenza: senza rotta scelta, acceso il
  GPS, XTE avrebbe dato uno scarto in metri da un canale mai scelto.
- **Non si ricordava niente**: soglie, set, cambio automatico, Audio, Inversa
  e il GPX caricato si perdevano a ogni riapertura, e si tornava a Levante.
- **La traccia attiva della Carta non si caricava da sola.**

Trovato provando, e più grave di tutti: **l'aggancio sbagliava segmento.**
`updateXTE` cerca il segmento più vicino solo fra l'ultimo usato e i sei
successivi, e all'accensione partiva dall'inizio della rotta. Acceso il GPS a
metà canale (prova: barca 15 m a destra del segmento 20 di 60), XTE si
agganciava al segmento 7 e diceva **«34 m, correggi a destra»**: numero e
lato sbagliati. Il Cruscotto non ha il difetto perché al primo fix cerca su
tutta la traccia (`followSeed`, voce 26/07).

### Il primo giro: bocciato

Scelte chiuse da Sergio con «accetto tue proposte»: XTE resta una pagina a sé
(la modalità della Carta decisa il 28/09 è rinviata, non scartata); senza
rotta si usa la traccia attiva, se no «Nessuna rotta»; si ricordano soglie,
set, GPX e interruttori.

La grafica proposta era una **vista a corridoio**: rotta con tre fasce
trasparenti larghe quanto le soglie, anello esterno colorato, freccia sul
bordo. Sergio: «la grafica non mi convince, per adesso saltiamo». Le fasce
sovrapposte si leggevano male.

### Lo schema di Sergio

Disegnato da lui: la **traccia schematizzata col verso**, un **cerchio** per
il fuoco, la **barca** come pallino alla sua distanza dalla traccia, e **due
triangoli** fuori dal cerchio, a sinistra e a destra, col vertice verso il
cerchio: si accende quello dal lato in cui si è, e punta dove si deve andare.

Aggiunte concordate:
- il triangolo acceso prende il **colore della zona**: giallo, arancio e,
  nell'ultima, **magenta al posto del rosso**. Sergio: in navigazione verde è
  dritta e rosso è sinistra, e un triangolo rosso su un lato si legge come
  un lato. Il verde resta solo per «in rotta», quando i triangoli sono spenti;
  il pallino delle soglie «aranc.» e il resto della pagina non usano il rosso
  per le zone;
- il numero dei metri resta sopra il cerchio, con «correggi a sinistra /
  a destra»;
- **rotta in alto** (il tratto in corso punta sempre verso l'alto: sinistra e
  destra del disegno sono quelle della barca). Scartato: nord in alto, che
  con rotta a sud inverte i lati;
- **il bordo del cerchio è la soglia arancio del set attivo** (25 m in Largo,
  10 in Stretto; sotto il disegno «cerchio 25 m»): se il pallino tocca il
  bordo si è in zona rossa. Scartate: scala fissa e scala automatica.

### Fatto

- **Indicatore**: viewBox 480×400, cerchio al centro, triangoli ai lati, fuori
  dal cerchio; la traccia parte dal piede della barca sul tratto in corso e
  va in avanti e all'indietro fino al bordo del riquadro, con la punta del
  verso dove esce in avanti. Senza posizione: la rotta intera dentro il
  cerchio, nord in alto, col verso.
- **Aggancio**: al primo fix dopo il caricamento della rotta o
  l'accensione del GPS si cerca su tutta la rotta; e di nuovo se lo scarto
  supera tre volte la soglia arancio del set Largo.
- **Avvia GPS e Audio in fondo alla schermata**, alti `--tocco`.
- **In alto la riga della rotta** («◎ nome · N punti», «GPX · nome») e ⚙; senza
  rotta, in ambra, «Nessuna rotta: attiva una traccia dalla Carta, o carica
  un GPX dal ⚙».
- **Impostazioni in un foglio** dal ⚙, sotto la barra in alto; tolta la
  seconda barra a schede.
- **Tolta `EMBEDDED`**.
- **Memoria**: chiave nuova del contratto **`raffyca-xte`** — `{sets,
  setMode, triggerIdx, audio, inverted, src, trackId, name, gpx}`. Il GPX si
  tiene coi suoi punti; la traccia attiva si rilegge dalla Carta all'apertura
  e al rientro nella pagina. Inversa e cambio automatico valgono solo per la
  rotta su cui erano stati scelti.
- **Piatto sui token della suite**: collegato `raffyca.css`, niente sfere,
  gradienti né ombre; i colori delle zone restano fissi nei tre temi.

Il calcolo dello scarto (`crossTrack`), le soglie, l'audio e il cambio
automatico non sono stati toccati.

Service worker: **`xte-v19`** (la v18 è già uscita con la voce (3)), con
`../raffyca.css` nel precache.

### Verificato

Nel browser, dal worktree, con GPS finto e una traccia a S di 61 punti:
- **localStorage vuoto**: «Nessuna rotta», nessun numero, nessuna barca;
- **traccia attiva**: caricata da sola; senza fix, la rotta intera col verso;
- **barca 15 m a destra** del tratto 20, al primo fix: segmento 21/60,
  «15 m, ◀ correggi a sinistra», triangolo destro acceso in arancio (a 30 m: magenta), traccia
  a sinistra della barca con la punta in alto;
- **8 m a sinistra**: triangolo sinistro acceso, «correggi a destra ▶»;
  **1 m**: «in rotta», triangoli spenti;
- **memoria** (primo giro): set, soglie, Audio e un GPX restano dopo la
  riapertura, il GPX anche con una traccia attiva nella Carta;
- larghezze 375, 600 e 1000 px (primo giro); sintassi con `jsc`; ogni `id`
  riferito esiste.

APK costruito dal worktree e installato sul tablet via adb, senza toccare lo
schermo.

### Non verificato

- **In barca**: con un GPS che salta di 4-5 m, nel set Stretto (cerchio da
  10 m) il pallino può ballare molto.
- **Il cambio di tratto** con la vista che ruota di colpo sulle curve strette.
- **L'audio**: codice non toccato, non ascoltato.
- Il nuovo indicatore nei temi giorno e notte e a 1000 px in orizzontale.

---

## 01/10/2026 — Revisione di Sergio: il giro delle correzioni piccole

Dopo la chiusura del programma Sergio ha fatto un giro su tutta l'app e ha
mandato dodici note. Qui le piccole; le tre grosse (Partenza su tablet, stile
di Impostazioni, pagina info del Meteo) vanno con lo schizzo, in quest'ordine;
la Traversata con punto intermedio e andata/ritorno è una funzione nuova, per
dopo.

### Il vento a barca ferma (hub, Cruscotto, Carta, Ancoraggio)

Domanda di Sergio: «non si può mettere il vento previsto se quello da
strumenti non c'è? A barca ferma mancherebbe sempre la direzione».

Il ripiego sulla previsione c'era già. Il buco era più sottile: **senza
bussola sul bus**, `rf-nmea.js` ricava il TWD dal COG, e sotto 1,5 kn tiene
l'**ultimo TWD buono**, anche per ore all'ancora (scelta del 22/09, giusta
per il pozzetto: «fermo da 20 s» si sa usare). `rf-strumenti.js` lo prendeva
per buono e non passava mai alla previsione. E se la barca non si era mossa da
quando era acceso il gateway, il TWD mancava del tutto e si saltava alla
previsione intera, perdendo l'intensità misurata.

Ora (scelta di Sergio fra due):
- direzione **fresca** = aggiornata negli ultimi 2 minuti;
- con intensità dagli strumenti e direzione non fresca: **vento misto**
  (`ventoDa: "misto"`), intensità misurata e direzione della previsione;
- senza rete, si resta all'ultima direzione buona con la sua età, come prima.

Scartato: tutto dalla previsione quando manca la direzione, più semplice ma
butta via una misura.

**Scritte per intero**: «prev.» → «previsto», «man.» → «manuale» (Sergio non
ricordava più cosa volesse dire «prev.»). Nel misto l'intensità non porta
scritte e la direzione dice «previsto» (Carta), «dir. prevista» sui
riquadri derivati del Cruscotto (TWD, TWA, VMG, % polare), «· direzione
prevista» in Ancoraggio, «Intensità dagli strumenti, direzione prevista»
nell'hub. Nel Cruscotto in modalità solo strumenti il misto è accettato:
la direzione dichiara da dove viene.

### Le altre

- **Sole & Luna**: il grafico «Altezza sull'orizzonte» non si trascina più;
  il tempo si sposta solo col cursore, e il dito sul grafico scorre la pagina.
- **Carta, Disegna traccia**: punti da 3 a 7 px con bordo bianco spesso,
  l'ultimo da 10 px in ambra (da lì riparte il tocco successivo); linea da 3
  a 4 px.
- **XTE**: cerchio e triangoli più spessi (3,5 e 4 px); le punte dei
  triangoli si fermano 10 px prima del cerchio (erano sovrapposte).
- **Percorso, scheda Regata**: nel riquadro del vento il campo del valore
  viene prima del cursore ed è largo 72 px (era 56): i valori a tre cifre
  uscivano dal campo e spaginavano la riga.
- **Impostazioni, Guida**: tolto il capitolo «Gli strumenti» (ripeteva la
  barra in basso, con nomi superati); le **Abbreviazioni** passano nel
  Prontuario come sezione «Sigle degli strumenti». Restano «Sole, Luna e
  maree» e «Come sono fatti i dati».
- **Impostazioni, box Info**: il pallino giallo è la decorazione del titolo
  (ogni riquadro ha il suo colore). Resta «Versione v1.0», che è quella
  dell'uscita; aggiunte **«Build»**, la versione vera del service worker
  dell'hub letta da `sw.js` (funziona anche senza rete), e **«Gira come»**:
  app Android, app installata o browser. Utile quando si riferisce un difetto.

Service worker: **`dritta-hub-v36`** (index, `rf-strumenti.js`, Sole & Luna,
Prontuario), **`anchor-v27`** (`rf-strumenti.js`, pagina), **`xte-v20`**.
Carta, Cruscotto, Percorso e Impostazioni non sono in nessun precache.

### Verificato

Nel browser, dal worktree:
- **vento** con `rfNmea.dati` sostituita: TWD fermo da 900 s → «9 kt, da E ·
  094°, Intensità dagli strumenti, direzione prevista»; TWD assente → idem;
  TWD fresco da bussola → «da SSW · 200°, Dagli strumenti di bordo»; senza
  strumenti → la previsione. In `rfStrumenti.calcola` nel misto: nota
  dell'intensità vuota, della direzione «previsto»;
- **Sole & Luna**: `mousedown` e `touchstart` sul grafico non spostano l'ora;
- **Carta**: cinque punti disegnati, visibili, l'ultimo in ambra;
- **Percorso**: 359 e 25,5 stanno nei campi, la riga non sborda a 600 px;
- **Prontuario**: «Sigle degli strumenti», 16 righe, tutte visibili;
- **Impostazioni**: Build «dritta-hub-v36», Gira come «browser», Guida con
  due capitoli;
- **XTE**: barca 15 m a destra, triangolo destro arancio staccato dal cerchio;
- sintassi con `jsc` di tutti gli script toccati.

APK costruito dal worktree e installato sul tablet via adb, senza toccare lo
schermo.

### Non verificato

- Il gateway vero all'ancora, che è il caso per cui nasce il vento misto.
- «Gira come: app Android» dentro l'APK.
- Il Cruscotto a schermo con le scritte nuove (controllato il codice).

---

## 01/10/2026 (2) — Partenza sul tablet in verticale: una griglia sola

Nota di Sergio: «su tablet avendo parecchio spazio rivedrei il layout; la
sensazione è che siano un po' ammassati».

### Cosa c'era

Da 600 px la riorganizzazione del 29/09 metteva due colonne. Sul tablet in
verticale (600 px CSS) sono due colonne da circa 290 px:
- a sinistra tutto stretto: le note sotto Dist/TTL/TTK tagliate («alla l…»,
  «non av…», «time t…»), il distintivo «MANUALE» fuori dal riquadro del
  vento, «INFO» sovrapposto all'etichetta;
- a destra la carta della linea larga 290 px e, sotto, circa **500 px
  vuoti**.

### Fatto (schizzo approvato)

Solo CSS, solo da 560 a 899 px; nessun elemento nuovo, nessun `id` toccato.
- Le due `.col` diventano `display:contents` e la pagina una griglia a
  quattro colonne, alta esattamente lo spazio fra le due barre
  (`100dvh - --rf-barra - --rf-sotto`).
- **Conto alla rovescia** su tutta la larghezza: cifre a sinistra, − + Avvia
  Sync suoni a destra.
- **Dist / TTL / TTK** larghi un terzo ciascuno: note intere.
- **PIN qui, RC qui, Vento da, Intensità** su una riga; nel vento etichetta e
  sorgente vanno una sotto l'altra.
- **Carta della linea** su tutta la larghezza, nella riga che prende
  l'altezza rimasta.
- **SOG/VMG/COG** e **Linea › / Archivio ›** su una riga in fondo, poi il
  piede (non nascosto: è uno dei quattro allineati).

Telefono (sotto 560) e orizzontale (da 900) restano come prima.

Service worker: nessuno da alzare, `partenza/` non è nel precache.

### Verificato

Nel browser, con una linea d'esempio poi cancellata:
- **600 × 960**: tutto in una schermata (pagina 960 = finestra), carta della
  linea 522–719, «favorito» e Archivio sopra la barra in basso, le tre note
  intere;
- **800 × 1280**: una schermata, carta alta 478 px;
- **375** e **1000 px**: come prima (una colonna che scorre; due colonne);
- niente sborda in larghezza.

### Non verificato

- Sul tablet vero, con il conto alla rovescia in corso e il GPS che si muove.
- PIN e RC sono ora alti quanto la riga del vento (circa 150 px): grandi per
  i guanti, forse troppo. Da vedere in acqua.

### Dopo: «PIN/RC invertiti?» che compariva e spariva

Domanda di Sergio, guardando la Partenza: quando compare «PIN/RC
invertiti»? Sembrava casuale.

Il controllo (`computeNav`) assume il percorso **sopravvento** alla linea e
avvisa quando il vento arriva dal lato di partenza. Ma il confine era il vento
**esattamente parallelo** alla linea: con il vento quasi parallelo bastavano
pochi gradi di oscillazione (strumenti, o direzione stimata dal COG) per
accenderlo e spegnerlo; e un vento manuale scritto per prova lo accendeva
subito.

Ora:
- serve un sospetto **netto**: vento dal lato di partenza di almeno 30°
  oltre il parallelo (`n·wu < -0,5`);
- e che **duri 20 s** di fila (`SWAP_DA`); una rilettura ogni 5 s, solo
  mentre il sospetto è in corso, lo fa comparire anche senza GPS né altri
  eventi;
- l'avviso ha una riga sua sotto «favorito», con il perché: «Vento dal lato
  di partenza: PIN e RC invertiti?» (prima stava in fondo all'intestazione,
  «PIN/RC invertiti?»).

Verificato (orologio fatto avanzare a mano), linea a 76°: vento da 346°
nessun avviso; da 86° (quasi parallelo) nessun avviso nemmeno dopo 25 s; da
166° nessun avviso subito né a 10 s, avviso a 22 s; tornando a 346° sparisce.

Resta vero un limite noto: nelle partenze in poppa (percorso sottovento)
l'avviso compare comunque, perché la pagina non sa che tipo di partenza è.
