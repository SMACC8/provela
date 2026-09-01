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

**Il resto dei punti aperti sta nella sezione "Aperti" di `SITUAZIONE.md`, ed è
lì che va letto — non qui.** Quel file è cronologico: una voce che segnala un
problema può essere superata da una voce successiva che lo chiude. Va letto
**fino in fondo** prima di dare per aperto qualcosa. Elencare qui i punti aperti
è già stato provato ed è andato male: due voci ("tacca `ZONE_BOX` a
Vasto/Abruzzo", "isobate incomplete") erano state copiate da note del 21/07
senza vedere il `[FATTO]` che le chiudeva poche righe dopo. Nel codice
`Medio Adriatico` ha `latS:41.50` e le isobate coprono tutte e 9 le zone.
