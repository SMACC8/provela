# Maree — pacchetto dati e motore

Modulo di marea della suite Dritta. Vive dentro **Sole, Luna e maree**
(`sole-luna/`), ma il motore e i dati stanno in radice perché sono condivisi:
qualunque altro modulo può chiamarli.

| File | Cos'è |
|---|---|
| `rf-maree.js` (radice) | il motore: ES5, nessuna dipendenza, nessuna rete |
| `maree/eot20-italia.bin` | il pacchetto dati, 388 kB |
| `maree/eot20-italia.json` | l'intestazione che lo descrive |
| `build_maree.py` (radice) | rigenera il pacchetto da EOT20 |
| `valida_maree.py` (radice) | le due prove di validazione |

## A cosa serve

**Non** a sapere quanta acqua c'è sotto la chiglia. Per quello servono lo zero
idrografico della carta e il sovralzo meteorologico, e nessuno dei due è qui
dentro.

Serve a sapere **se la marea monta o cala, e quando si ferma**: è quello che
decide il verso della corrente in una bocca di porto, in un canale, in una
laguna. La grandezza utile non è il livello ma la sua **derivata**, ed è
attorno alla derivata che è costruito tutto il modulo — compresa la ricerca
della stanca, che si fa sullo zero di `dh/dt` e non sul colmo del livello.

## La fonte, e la citazione che la licenza richiede

> **EOT20** — Hart-Davis M. G., Piccioni G., Dettmering D., Schwatke C.,
> Passaro M., Seitz F. (2021). *EOT20 - A global Ocean Tide model from
> multi-mission satellite altimetry.* SEANOE.
> [doi:10.17882/79489](https://doi.org/10.17882/79489)
> Licenza **CC BY 4.0**.

La citazione va riportata **nei crediti dell'app**, non solo qui: è la
condizione della licenza. DGFI-TUM, modello empirico da altimetria
multimissione, griglia 1/8 di grado, 17 costituenti, ampiezze e fasi riferite
al **livello medio del mare**.

## Rigenerare il pacchetto

I NetCDF sorgente **non stanno nel repository** (1,3 GB), come lo shapefile
delle isobate e le land polygons: si riscaricano.

1. Da <https://www.seanoe.org/data/00683/79489/> scaricare l'archivio dati
   (~2,2 GB). Dentro ci sono due zip: serve solo **`ocean_tides.zip`**
   (`load_tides.zip` è il carico mareale sul fondo, che qui non interessa).
2. Scompattarlo: una cartella `ocean_tides/` con 17 file
   `<COSTITUENTE>_ocean_eot20.nc`.
3. `pip install netCDF4 numpy` (sono le sole dipendenze).
4. Dalla radice del repo:

       python3 build_maree.py percorso/ocean_tides

Lo script ritaglia, controlla, quantizza e riscrive `maree/eot20-italia.bin` e
`maree/eot20-italia.json`, stampando la dimensione finale. Se una costituente
manca si ferma invece di costruire un pacchetto a metà.

### Cosa fa il ritaglio, e perché

- **Riquadro** 6,0–19,5 E, 35,0–46,0 N, passo 1/8: 109 × 89 = 9701 celle, di
  cui 5829 di mare. Non è uno `ZONE_BOX` di `routing/`: quelli sono nove
  riquadri di zona vento, questo è uno solo e li contiene tutti.
- **Dieci costituenti su diciassette**: M2, S2, N2, K2, K1, O1, P1, Q1, M4, S1.
  Fuori le lunghe periodo (SA, SSA, MM, MF), che muovono il livello medio
  nell'arco di mesi e sulla derivata oraria non incidono; fuori 2N2, J1, T2,
  correzioni fini all'ampiezza. **Dentro M4**, che sul livello è un centimetro
  ma sulla derivata pesa il doppio di quanto pesi sul livello (ogni
  costituente entra nella derivata moltiplicata per la propria pulsazione) ed
  è lei a rendere diversa la durata del riempimento da quella dello
  svuotamento. Toglierla per far spazio sarebbe togliere proprio il dato che
  si sta cercando.
- **Componenti reale e immaginaria, mai ampiezza e fase.** A bordo si
  interpola fra quattro nodi, e le fasi non si interpolano: sono angoli (fra
  350 e 10 gradi la media non è 180) e vicino a un punto anfidromico ruotano
  di 360 gradi in poche celle. EOT20 contiene già `real` e `imag`, e sono
  quelle che finiscono nel pacchetto.
- **La terra ha un flag suo.** Nei file EOT20 la terra è scritta come zero.
  Zero però è anche un'ampiezza legittima — nei punti anfidromici la marea si
  annulla davvero — quindi qui la terra sta in una maschera a parte, un byte
  per cella. Una cella è terra se è zero in **tutte** le costituenti: usare
  solo M2 marcherebbe come terra dei punti di mare aperto.

### Formato del pacchetto

`eot20-italia.json` descrive tutto; il binario è:

    [ maschera : uint8 * nx*ny ]          1 = mare, 0 = terra, da sud-ovest
    [ dati     : int16 LE ]               per cella, e dentro la cella per
                                          costituente: re, im

Per cella e non per costituente perché il runtime legge quattro celle vicine
con tutte le costituenti: così sono quattro letture contigue invece di
quaranta. Il fattore di scala è nell'header (`scala_mm`, oggi 0,1 mm per
unità: il valore più grande del riquadro è 2543 su 32767 disponibili, quindi
la precisione in più non costa un byte).

## Il motore, in breve

    rfMaree.carica('../maree/', function (err) { ... });
    var m = rfMaree.tide(lat, lon, dateUTC, opts);

`opts`: `basin` (bool), `soglia_cm_h` (default 2), `datumOffset_m` (default 0).

Risposta:

| campo | |
|---|---|
| `rate_cm_h` | derivata del livello; positiva = montante |
| `trend` | `montante` / `calante` / `stanca` |
| `minutes_to_slack` | minuti al prossimo annullamento di `dh/dt` |
| `next_slack` | `{ timeUTC, type: 'AM' | 'BM' }` |
| `flow` | `entrante` / `uscente` / `stanca` — **solo** con `basin: true` |
| `height_m` | livello sul medio mare, informativo |
| `confidence` | `alta` / `media` / `bassa` |
| `confidence_perche` | perché, in parole |
| `meteo_warning` | stato di `setMeteoWarning()` |

Un punto a terra, o fuori dal riquadro, **solleva un'eccezione** con un
messaggio in italiano: è un'informazione, non un guasto, e va mostrata.

Altre funzioni: `rfMaree.serie(lat, lon, da, ore, passoMin)` per i grafici,
`rfMaree.setMeteoWarning(bool)`, `rfMaree.soglia(cm_h)`,
`rfMaree.calibrazioni` (la tabella del punto seguente).

### Modalità bacino

Per un bacino alimentato da bocche — laguna, valle da pesca, darsena — la
portata in bocca serve a far cambiare il livello di tutto lo specchio d'acqua:
`Q = A · dh/dt`. Quindi la corrente è **massima a metà marea** e **nulla ai
colmi**, in alta e in bassa. Sembra sbagliato e non lo è: livello e corrente
sono in quadratura, non in fase.

**Non vale per un canale fra due bacini comunicanti.** Nello Stretto di
Messina la corrente segue il dislivello fra Tirreno e Ionio, che gira quando
i due mari sono in fase, e non ha nulla a che vedere con la stanca locale. Per
questo `flow` esiste solo se chi chiama dichiara `basin`: senza quella
dichiarazione il campo non c'è, invece di esserci e mentire. (Nel pacchetto lo
Stretto è per giunta terra: è più stretto di una cella.)

### Calibrazione di fase

`rfMaree.calibrazioni` è una tabella `{ nome, lat, lon, raggio_km, delta_min }`
applicata come **spostamento nel tempo** prima del calcolo, dove `delta_min` è
quanto la marea vera arriva in ritardo rispetto alla griglia (il modello viene
quindi valutato a `t − delta_min`). Nessuna correzione di ampiezza: sul segno
della tendenza e sull'istante della stanca incide la fase, non l'ampiezza.

È **vuota**, e i numeri qui sotto dicono perché: sulle quattro stazioni
misurate lo sfasamento sta fra −15 e +5 minuti, cioè dentro il rumore. Serve
dove la griglia da 1/8 non può funzionare — dentro le lagune, non sulla costa
aperta — e lì mancano ancora gli osservati.

### Datum

`height_m` è riferito al **medio mare**. Le carte nautiche italiane usano uno
zero idrografico locale, più basso: `datumOffset_m` serve a riportarcisi. Non
tocca né tendenza né stanca, che sono derivate e quindi cieche a qualunque
costante additiva.

## Validazione

Due prove, indipendenti. Si confrontano le **derivate**, non i livelli: un
RMSE basso sul livello convive benissimo con mezz'ora di errore
sull'inversione, che è esattamente ciò che qui interessa sapere.

    python3 valida_maree.py --modello percorso/ocean_tides
    python3 valida_maree.py --ispra --giorni 60 --fine 2026-09-18

Entrambe fanno girare il **codice vero**, `rf-maree.js`, dentro
JavaScriptCore (su macOS è di serie): una riscrittura in Python proverebbe la
riscrittura.

**`--modello`** confronta il pacchetto con EOT20 a piena precisione e con gli
argomenti astronomici di `pyTMD` (riferimento indipendente). Misura cosa hanno
tolto la quantizzazione, l'interpolazione e le formule nodali di Schureman.
Richiede `netCDF4` e `pyTMD`.

**`--ispra`** confronta con i livelli osservati dai mareografi della Rete
Mareografica Nazionale. **Sulla fonte**: `mareografico.it` pubblica i dati
attraverso un'applicazione che non è interrogabile da uno script; gli stessi
sensori RMN sono però ritrasmessi dal servizio IOC Sea Level Monitoring
(`ioc-sealevelmonitoring.org`), ed è da lì che lo script scarica — codici
TR22 Trieste, VE19 Venezia, AN15 Ancona, CA02 Cagliari. Serve rete.

La serie osservata viene portata al minuto, filtrata passa-basso a 30 minuti
con una finestra di Hann **simmetrica** (fase nulla: un filtro che sfasa
sposterebbe proprio i minuti che si stanno misurando) e derivata con una retta
ai minimi quadrati su mezz'ora.

### Risultati, 20/09/2026

**Contro EOT20** (`--modello`, 30 giorni a passo di 10 minuti, 8 punti):
livello entro **0,03 cm**, derivata entro **0,014 cm/h**, istante di stanca
entro **3,6 minuti** nel caso peggiore (un punto del medio Adriatico dove la
derivata sfiora lo zero quasi tangente; negli altri sotto il minuto e mezzo).
Il pacchetto dice quello che dice EOT20.

**Contro gli osservati RMN** (`--ispra`, 60 giorni, 19/07–18/09/2026):

| stazione | segno | segno, fuori banda morta | segno contro la sola marea | quanta varianza è marea | stanca contro la marea |
|---|---|---|---|---|---|
| Trieste | 91,8 % | 94,2 % | **97,7 %** | 94 % | 6,8 min (max 30) |
| Venezia (Lido) | 88,4 % | 90,8 % | **97,8 %** | 93 % | 6,7 min (max 46) |
| Ancona | 80,3 % | 87,5 % | **94,0 %** | 87 % | 14,3 min (max 51) |
| Cagliari | 68,9 % | 72,7 % | **98,6 %** | 77 % | 4,6 min (max 16) |

La colonna che misura il **modello** è la terza: il confronto con la sola
marea estratta dall'osservato per analisi armonica. Lì si sta fra il 94 e il
98,6 %, con l'istante di stanca entro i 20 minuti chiesti (media 4,6–14,3).

Le prime due colonne misurano un'altra cosa: il modello contro il **mare
vero**, sovralzo compreso. La differenza non è imprecisione correggibile, è
meteorologia — e si vede bene a Cagliari, dove la marea astronomica vale pochi
centimetri e spiega solo il 77 % di quello che fa il livello: il modello
azzecca la marea al 98,6 % e il livello osservato al 69 %, perché a Cagliari
il livello lo fa soprattutto il vento. **È esattamente il motivo per cui
esiste `setMeteoWarning()`**: senza quell'avviso l'app darebbe
un'indicazione sbagliata con l'aria di essere precisa.

Controprova che il modello ci prende: le ampiezze e le fasi di EOT20
interpolate nei quattro punti, confrontate con quelle ricavate dagli
osservati, coincidono entro **1 cm e pochi gradi** su M2, S2, N2, O1 (a
Trieste M2 26,7 contro 26,8 cm e 0,6 gradi, cioè un minuto e mezzo).

Due cose che lo script fa e che è bene sapere perché sono state imparate
sbagliando:

- **Le stanche osservate non si cercano sulla derivata filtrata a 30 minuti.**
  A quella scala il mare vero ha sesse e onde lunghe che attraversano lo zero
  decine di volte al giorno — a Cagliari quaranta. Per trovarle serve un
  secondo filtro, a 3 ore; il confronto dei segni resta invece sui 30 minuti.
- **Gli orari del servizio sono UTC.** Leggerli con `mktime` (ora locale, per
  giunta legale d'estate) produce un'ora tonda di ritardo apparente che
  somiglia in tutto a un ritardo idraulico di stazione — e per un giro di
  misure è stato preso per tale.

`delta_min` resta quindi **vuoto**: gli sfasamenti misurati stanno fra −15 e
+5 minuti e attivarli sposta la concordanza di meno di mezzo punto. I valori
sono comunque annotati, commentati, in `rf-maree.js`.

## Limiti dichiarati

- **Datum.** Medio mare, non zero idrografico. Vedi `datumOffset_m`.
- **Niente meteorologia.** Nessun sovralzo da vento o pressione: vedi sopra.
- **Griglia da 1/8 di grado**, cioè una cella di ~14 km: lagune, bocche e
  canali stretti non ci stanno dentro. Lo Stretto di Messina, nel pacchetto,
  è terra.
- **Nessuna rete a runtime**, e nessuna libreria: il pacchetto è nel precache
  del service worker dell'hub (`dritta-hub-v18`), quindi a bordo c'è anche
  senza campo.
