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
