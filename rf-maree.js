/* ============================================================
   rf-maree.js — motore di marea della suite Dritta.

   Stessa forma di rf-astro.js e rf-fari.js: un file solo, ES5 puro,
   nessuna dipendenza, nessuna chiamata di rete a runtime (il pacchetto
   dati si carica una volta e sta in cache del service worker).

   A COSA SERVE, e a cosa NON serve.
   Non serve a sapere quanta acqua c'e' sotto la chiglia: per quello
   occorrono lo zero idrografico della carta e il sovralzo meteo, e il
   modello globale da cui vengono questi dati non li conosce. Serve a
   sapere se la marea sta MONTANDO o CALANDO e quando si ferma, perche'
   e' quello che decide il verso della corrente in una bocca di porto,
   in un canale lagunare, in una darsena. La grandezza utile qui non e'
   il livello ma la sua DERIVATA.

   Dati: modello globale EOT20 (Hart-Davis et al. 2021, SEANOE,
   doi:10.17882/79489, CC BY 4.0), griglia 1/8 di grado, ritagliato sui
   mari italiani da build_maree.py. Vedi maree/LEGGIMI.md.

   Uso:
     rfMaree.carica('../maree/', function (err) {
       if (err) { ... }
       var m = rfMaree.tide(45.43, 12.33, new Date(), { basin: true });
     });
   ============================================================ */
(function () {
  'use strict';

  var RAD = Math.PI / 180;
  var sin = Math.sin, cos = Math.cos;

  /* ---------------------------------------------------------- costituenti

     arg = coefficienti di [T, s, h, p, p1] nell'argomento di equilibrio,
     dove T e' l'angolo orario del sole medio a Greenwich e s, h, p, p1
     sono le longitudini medie di luna, sole, perigeo lunare e perigeo
     solare. off e' lo scarto costante in gradi (i +/-90 dei diurni).
     vel e' la velocita' angolare in gradi/ora: NON e' un di piu' rispetto
     ad arg, e' la sua derivata, e la usiamo per la derivata in forma
     chiusa (vedi sotto).

     nod dice quale famiglia di correzione nodale si applica: la stessa
     formula vale per piu' costituenti (N2 segue M2, Q1 segue O1).      */
  var COST = {
    M2: { vel: 28.9841042, arg: [2, -2,  2,  0, 0], off:   0, nod: 'M2' },
    S2: { vel: 30.0000000, arg: [2,  0,  0,  0, 0], off:   0, nod: '1'  },
    N2: { vel: 28.4397295, arg: [2, -3,  2,  1, 0], off:   0, nod: 'M2' },
    K2: { vel: 30.0821373, arg: [2,  0,  2,  0, 0], off:   0, nod: 'K2' },
    K1: { vel: 15.0410686, arg: [1,  0,  1,  0, 0], off: -90, nod: 'K1' },
    O1: { vel: 13.9430356, arg: [1, -2,  1,  0, 0], off:  90, nod: 'O1' },
    P1: { vel: 14.9589314, arg: [1,  0, -1,  0, 0], off:  90, nod: '1'  },
    Q1: { vel: 13.3986609, arg: [1, -3,  1,  1, 0], off:  90, nod: 'O1' },
    M4: { vel: 57.9682084, arg: [4, -4,  4,  0, 0], off:   0, nod: 'M4' },
    /* S1: l'unica su cui le convenzioni litigano. La famiglia OTIS/TPXO le
       da' uno scarto di -90 gradi, quella FES/GOT — a cui EOT20 appartiene —
       nessuno. Sbagliare famiglia qui costa un centimetro sul livello e,
       dove la marea e' piccola, un'ora sull'istante della stanca: e' il
       primo posto da guardare se la validazione peggiora di colpo. */
    S1: { vel: 15.0000000, arg: [1,  0,  0,  0, 0], off:   0, nod: '1'  }
  };

  /* ---------------------------------------------------- tempo e longitudini

     Epoca di riferimento: 1900 gennaio 0.5 GMT = 31/12/1899 12:00 UT,
     JD 2415020.0, che e' l'epoca a cui sono riferiti i coefficienti di
     Schureman usati qui sotto. Tutto in UTC: l'ora locale non entra mai
     nel calcolo, solo nella stampa a video.                            */
  var JD1970 = 2440587.5, JD1900 = 2415020.0, MS_GIORNO = 86400000;

  function secoli(ms) { return (ms / MS_GIORNO + JD1970 - JD1900) / 36525; }
  function g360(x) { x = x % 360; return x < 0 ? x + 360 : x; }

  /* Longitudini medie (gradi) all'istante dato. Sono le stesse quantita'
     che governano le fasi lunisolari: s luna, h sole, p perigeo lunare,
     N nodo ascendente (retrogrado, periodo 18.6 anni: e' lui a far
     respirare le ampiezze), p1 perigeo solare.                        */
  function astro(ms) {
    var T = secoli(ms), T2 = T * T, T3 = T2 * T;
    var giorni = ms / MS_GIORNO;                 /* giorni dal 1/1/1970 00:00 UTC */
    var frazione = giorni - Math.floor(giorni);  /* 0 = mezzanotte UTC            */
    return {
      /* angolo orario del sole medio: a mezzanotte il sole medio e' al
         culmine inferiore, quindi 180 gradi, non 0. */
      T:  g360(360 * frazione + 180),
      s:  g360(270.434164 + 481267.88314137 * T - 0.0013268 * T2 + T3 / 538841),
      h:  g360(279.696678 + 36000.768925 * T + 0.0003025 * T2),
      p:  g360(334.329556 + 4069.0340329575 * T - 0.010325 * T2 - 0.0000125 * T3),
      N:  g360(259.183275 - 1934.1420 * T + 0.0020778 * T2 + 0.0000022 * T3),
      p1: g360(281.220844 + 1.719175 * T + 0.0004528 * T2 + 0.0000033 * T3)
    };
  }

  /* ------------------------------------------------ correzioni nodali f, u

     Il nodo lunare compie un giro in 18.6 anni e modula ampiezze (f) e
     fasi (u) delle costituenti lunari: M2 respira del +/-4%, K1 del
     +/-12%, K2 del +/-29%. Sono calcolate qui dall'N dell'istante, non
     prese da una tabella e non poste uguali a 1: con f=1 l'errore sul
     livello e' piccolo, ma sull'ISTANTE della stanca si sposta di minuti,
     ed e' l'istante che ci interessa. Formule di Schureman (1958).

     S2, P1 e S1 sono solari: il nodo non le tocca, f=1 e u=0.          */
  function nodali(N) {
    var n = N * RAD, n2 = 2 * n, n3 = 3 * n;
    var fM2 = 1.0004 - 0.0373 * cos(n) + 0.0002 * cos(n2);
    var uM2 = -2.14 * sin(n);
    return {
      '1':  { f: 1, u: 0 },
      M2:   { f: fM2, u: uM2 },
      /* M4 e' l'armonica doppia di M2: nasce dalla distorsione di M2 in
         bassofondale, quindi eredita il quadrato del suo f e il doppio
         del suo u. */
      M4:   { f: fM2 * fM2, u: 2 * uM2 },
      K1:   { f: 1.0060 + 0.1150 * cos(n) - 0.0088 * cos(n2) + 0.0006 * cos(n3),
              u: -8.86 * sin(n) + 0.68 * sin(n2) - 0.07 * sin(n3) },
      O1:   { f: 1.0089 + 0.1871 * cos(n) - 0.0147 * cos(n2) + 0.0014 * cos(n3),
              u: 10.80 * sin(n) - 1.34 * sin(n2) + 0.19 * sin(n3) },
      K2:   { f: 1.0241 + 0.2863 * cos(n) + 0.0083 * cos(n2) - 0.0015 * cos(n3),
              u: -17.74 * sin(n) + 0.68 * sin(n2) - 0.04 * sin(n3) }
    };
  }

  /* Argomento di equilibrio V0+u e fattore f di ogni costituente, in un
     istante. Restituisce due array paralleli all'ordine di NOMI.       */
  var NOMI = [];   /* riempito da carica(), segue l'ordine del pacchetto */

  function argomenti(ms) {
    var a = astro(ms), nd = nodali(a.N), vv = [], ff = [];
    for (var i = 0; i < NOMI.length; i++) {
      var c = COST[NOMI[i]], k = c.arg, q = nd[c.nod];
      var V = k[0] * a.T + k[1] * a.s + k[2] * a.h + k[3] * a.p + k[4] * a.p1 + c.off;
      vv.push((V + q.u) * RAD);
      ff.push(q.f);
    }
    return { v: vv, f: ff };
  }

  /* ------------------------------------------------------------- pacchetto */
  var DATI = null;   /* {hdr, mask:Uint8Array, val:Int16Array} */

  function carica(base, cb) {
    base = base || './maree/';
    if (base.charAt(base.length - 1) !== '/') base += '/';
    var hdrU = base + 'eot20-italia.json';
    xhr(hdrU, 'json', function (e, hdr) {
      if (e) return cb(e);
      xhr(base + hdr.bin, 'arraybuffer', function (e2, buf) {
        if (e2) return cb(e2);
        try { installa(hdr, buf); cb(null, hdr); } catch (ex) { cb(ex); }
      });
    });
  }

  /* Monta il pacchetto in memoria. Separata da carica() perche' lo script di
     validazione carica lo stesso .bin da disco, senza rete. */
  function installa(hdr, buf) {
    var nc = hdr.costituenti.length, celle = hdr.nx * hdr.ny;
    for (var i = 0; i < nc; i++)
      if (!COST[hdr.costituenti[i]])
        throw new Error('costituente sconosciuta nel pacchetto: ' + hdr.costituenti[i]);
    /* Int16Array su un buffer non allineato a 2 byte farebbe eccezione: la
       maschera e' nx*ny byte e nulla garantisce che sia pari. */
    var dati = buf;
    if (hdr.offset_dati % 2 !== 0) {
      dati = buf.slice(hdr.offset_dati);
      DATI = { hdr: hdr, mask: new Uint8Array(buf, hdr.offset_mask, celle),
               val: new Int16Array(dati, 0, celle * nc * 2) };
    } else {
      DATI = { hdr: hdr, mask: new Uint8Array(buf, hdr.offset_mask, celle),
               val: new Int16Array(buf, hdr.offset_dati, celle * nc * 2) };
    }
    NOMI = hdr.costituenti.slice();
  }

  function xhr(url, tipo, cb) {
    var r = new XMLHttpRequest();
    r.open('GET', url, true);
    r.responseType = (tipo === 'json') ? 'text' : tipo;
    r.onload = function () {
      if (r.status >= 400) return cb(new Error('HTTP ' + r.status + ' su ' + url));
      if (tipo === 'json') { try { cb(null, JSON.parse(r.responseText)); } catch (e) { cb(e); } }
      else cb(null, r.response);
    };
    r.onerror = function () { cb(new Error('rete non disponibile per ' + url)); };
    r.send();
  }

  function pronto() { return !!DATI; }

  /* --------------------------------------------------- lettura di una cella
     Int16 in mm -> metri. La cella di terra non e' zero: e' segnata nella
     maschera, e zero sarebbe un'ampiezza legittima (nodo anfidromico).  */
  function acqua(ix, iy) {
    var h = DATI.hdr;
    if (ix < 0 || iy < 0 || ix >= h.nx || iy >= h.ny) return false;
    return DATI.mask[iy * h.nx + ix] === 1;
  }

  function componenti(ix, iy, re, im) {
    var h = DATI.hdr, nc = NOMI.length, base = (iy * h.nx + ix) * nc * 2, k = h.scala_mm / 1000;
    for (var i = 0; i < nc; i++) {
      re[i] = DATI.val[base + 2 * i] * k;
      im[i] = DATI.val[base + 2 * i + 1] * k;
    }
  }

  /* ------------------------------------------------ interpolazione spaziale

     Si interpolano le componenti REALE e IMMAGINARIA, mai ampiezza e fase.
     Interpolare le fasi e' sbagliato due volte: sono angoli (fra 350 e 10
     gradi la media non e' 180) e vicino a un punto anfidromico ruotano di
     360 gradi in poche celle, dove l'ampiezza va a zero e la fase non ha
     piu' significato fisico. In componenti il problema non esiste: sono
     due campi continui che si annullano insieme.                        */
  function interpola(lat, lon) {
    var h = DATI.hdr, nc = NOMI.length;
    var fx = (lon - h.bbox.lonW) / h.passo, fy = (lat - h.bbox.latS) / h.passo;
    var ix = Math.floor(fx), iy = Math.floor(fy);
    if (fx < 0 || fy < 0 || ix >= h.nx || iy >= h.ny)
      throw new Error('Posizione fuori dal pacchetto maree (' +
        h.bbox.lonW + '-' + h.bbox.lonE + ' E, ' + h.bbox.latS + '-' + h.bbox.latN + ' N).');
    var tx = fx - ix, ty = fy - iy;
    if (ix === h.nx - 1) { ix--; tx = 1; }
    if (iy === h.ny - 1) { iy--; ty = 1; }

    var re = [], im = [], r1 = [], i1 = [], i, j;
    for (i = 0; i < nc; i++) { re[i] = 0; im[i] = 0; }

    var nodi = [[ix, iy, (1 - tx) * (1 - ty)], [ix + 1, iy, tx * (1 - ty)],
                [ix, iy + 1, (1 - tx) * ty], [ix + 1, iy + 1, tx * ty]];
    var tuttoAcqua = true;
    for (j = 0; j < 4; j++) if (!acqua(nodi[j][0], nodi[j][1])) tuttoAcqua = false;

    if (tuttoAcqua) {
      for (j = 0; j < 4; j++) {
        componenti(nodi[j][0], nodi[j][1], r1, i1);
        for (i = 0; i < nc; i++) { re[i] += nodi[j][2] * r1[i]; im[i] += nodi[j][2] * i1[i]; }
      }
      return { re: re, im: im, terraVicina: !bordoLibero(ix, iy) };
    }

    /* Almeno un nodo e' terra: la bilineare tirerebbe dentro uno zero che
       non e' un'ampiezza nulla ma un'assenza di dato. Si ripiega su una
       media pesata 1/distanza sui soli nodi d'acqua entro 2 celle. */
    var pesoTot = 0;
    for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) {
      var nx2 = ix + dx, ny2 = iy + dy;
      if (!acqua(nx2, ny2)) continue;
      var ddx = nx2 - fx, ddy = ny2 - fy, d = Math.sqrt(ddx * ddx + ddy * ddy);
      var w = 1 / Math.max(d, 1e-6);
      componenti(nx2, ny2, r1, i1);
      for (i = 0; i < nc; i++) { re[i] += w * r1[i]; im[i] += w * i1[i]; }
      pesoTot += w;
    }
    if (pesoTot === 0)
      throw new Error('Nessuna cella di mare entro 2 celle dal punto: il punto e\' a terra ' +
                      'o in un bacino che la griglia da 1/8 di grado non vede.');
    for (i = 0; i < nc; i++) { re[i] /= pesoTot; im[i] /= pesoTot; }
    return { re: re, im: im, terraVicina: true };
  }

  /* Vero se le celle entro 2 di distanza sono tutte acqua. Serve solo per
     la confidenza: vicino a costa la griglia da 14 km e' una media fra
     mare aperto e fondale che non risolve, e va detto. */
  function bordoLibero(ix, iy) {
    for (var dy = -2; dy <= 3; dy++) for (var dx = -2; dx <= 3; dx++)
      if (!acqua(ix + dx, iy + dy)) return false;
    return true;
  }

  /* ---------------------------------------------- livello e derivata in t

     h(t)     = SOMMA f_i [ Re_i cos(th_i) + Im_i sin(th_i) ]
     dh/dt(t) = SOMMA f_i w_i [ -Re_i sin(th_i) + Im_i cos(th_i) ]

     con th_i = V0_i(t) + u_i(t) e Re = A cos(g), Im = A sin(g): e' la
     stessa cosa di f A cos(w t + V0+u - g), riscritta in componenti perche'
     sono quelle che si interpolano.

     La derivata e' IN FORMA CHIUSA, non alle differenze finite. Non e'
     pignoleria: le differenze finite su una funzione campionata al minuto
     danno un rumore che, proprio attorno alla stanca dove la derivata e'
     piccola, e' dello stesso ordine del segnale — cioe' rende incerto
     l'unico numero per cui esiste questo modulo.

     Da notare, nella derivata, il peso w_i: ogni costituente entra
     moltiplicata per la propria pulsazione. M4 ha il doppio della
     pulsazione di M2, quindi conta il doppio sulla derivata rispetto a
     quanto conta sul livello, ed e' lei a rendere asimmetrico il ciclo
     (riempimento e svuotamento di durata diversa) nelle lagune e negli
     estuari. Toglierla per alleggerire il pacchetto significa buttare via
     proprio l'informazione che si sta cercando.                        */
  function valuta(comp, ms) {
    var a = argomenti(ms), nc = NOMI.length, hh = 0, dd = 0;
    for (var i = 0; i < nc; i++) {
      var th = a.v[i], f = a.f[i], c = cos(th), s = sin(th);
      hh += f * (comp.re[i] * c + comp.im[i] * s);
      dd += f * (COST[NOMI[i]].vel * RAD) * (-comp.re[i] * s + comp.im[i] * c);
    }
    return { h: hh, d: dd };     /* m , m/h */
  }

  /* ------------------------------------------------------- calibrazione (g)

     Tabella di sfasamento per stazione, applicata come SPOSTAMENTO NEL
     TEMPO prima del calcolo. Serve dove la griglia da 1/8 di grado non
     puo' funzionare: alto Adriatico, lagune, bocche. Nessuna correzione di
     ampiezza, e non per pigrizia: sul SEGNO della tendenza e sull'istante
     della stanca l'ampiezza non incide, incide la fase.

     delta_min = quanto la marea vera arriva IN RITARDO rispetto a quella
     della griglia. Quindi per sapere cosa fa la stazione all'istante t si
     guarda la griglia a t - delta_min.

     Vuota di default: si popola con i numeri che stampa valida_maree.py,
     non a intuito.                                                     */
  var CALIBRA = [];
  /* Misure del 20/09/2026 su 60 giorni di osservato RMN (valida_maree.py).
     Restano commentate di proposito: lo sfasamento che massimizza la
     concordanza sta fra -15 e +5 minuti, e attivarlo cambia il risultato di
     meno di mezzo punto percentuale — cioe' e' rumore, non un ritardo
     idraulico. Quello che resta di scarto a quelle stazioni non e' fase
     sbagliata: e' sovralzo meteorologico, e nessuna tabella lo corregge.
     Qui servono le stazioni DENTRO le lagune, dove il ritardo e' vero e
     vale mezz'ora e piu'; per quelle mancano ancora gli osservati.

       { nome: 'Trieste',  lat: 45.6544, lon: 13.7561, raggio_km: 15, delta_min: -10 },
       { nome: 'Venezia',  lat: 45.4182, lon: 12.4265, raggio_km: 15, delta_min:  +5 },
       { nome: 'Ancona',   lat: 43.6248, lon: 13.5065, raggio_km: 15, delta_min: -15 },
       { nome: 'Cagliari', lat: 39.2101, lon:  9.1142, raggio_km: 15, delta_min: -10 }
  */

  function calibrazione(lat, lon) {
    var best = null, bd = 1e9;
    for (var i = 0; i < CALIBRA.length; i++) {
      var c = CALIBRA[i], d = distKm(lat, lon, c.lat, c.lon);
      if (d <= c.raggio_km && d < bd) { best = c; bd = d; }
    }
    return best;
  }

  function distKm(la1, lo1, la2, lo2) {
    var x = (lo2 - lo1) * cos((la1 + la2) / 2 * RAD), y = la2 - la1;
    return Math.sqrt(x * x + y * y) * 111.195;
  }

  /* -------------------------------------------------------------- confidenza

     Zone dove la griglia globale e' nota per essere inaffidabile: bacini
     chiusi che nel modello sono poche celle, o non ci sono affatto.     */
  var ZONE_CRITICHE = [
    { nome: 'Laguna di Venezia',      lonW: 12.15, lonE: 12.65, latS: 45.10, latN: 45.60 },
    { nome: 'Laguna di Marano-Grado', lonW: 13.00, lonE: 13.60, latS: 45.60, latN: 45.85 },
    { nome: 'Delta del Po e Comacchio', lonW: 12.10, lonE: 12.60, latS: 44.35, latN: 45.10 }
  ];
  function inZona(lat, lon, z) {
    return lon >= z.lonW && lon <= z.lonE && lat >= z.latS && lat <= z.latN;
  }
  /* Adriatico settentrionale: il bacino dove la marea italiana e' grande
     (fino a un metro) e dove quindi un errore di fase si paga. */
  function nordAdriatico(lat, lon) { return lat >= 43.5 && lon >= 12.0 && lon <= 16.0; }

  function confidenza(lat, lon, terraVicina, cal) {
    var i;
    for (i = 0; i < ZONE_CRITICHE.length; i++)
      if (inZona(lat, lon, ZONE_CRITICHE[i]) && !cal)
        return { liv: 'bassa', perche: ZONE_CRITICHE[i].nome +
          ': bacino che la griglia da 1/8 di grado non risolve, e nessuna ' +
          'calibrazione ancora misurata qui' };
    if (terraVicina)
      return { liv: 'bassa', perche: 'a meno di due celle dalla terra: la ' +
        'cella e\' larga una quindicina di chilometri e qui media fondali e ' +
        'costa' };
    if (nordAdriatico(lat, lon))
      return { liv: 'media', perche: 'Adriatico settentrionale: la marea e\' ' +
        'grande e il sovralzo da vento pure' };
    return { liv: 'alta', perche: null };
  }

  /* ------------------------------------------------------- avviso meteo (j)

     Predisposizione, nessuna chiamata di rete. Questo calcolo e' puramente
     astronomico: non sa nulla di vento e pressione. In alto Adriatico con
     scirocco o bora sostenuti il sovralzo meteorologico puo' valere quanto
     la marea astronomica e ROVESCIARE la tendenza vera — l'acqua continua a
     salire mentre l'astronomia dice che cala. Chi integra una previsione di
     vento chiami setMeteoWarning(true) e l'interfaccia lo dira'.        */
  var METEO = false;
  function setMeteoWarning(v) { METEO = !!v; }

  /* ---------------------------------------------------------------- soglia
     Banda morta attorno allo zero della derivata, in cm/h. Un solo posto:
     si cambia da opts.soglia_cm_h per chiamata, o qui per tutta la suite. */
  var SOGLIA_CM_H = 2;

  /* ============================================================ tide()

     tide(lat, lon, dateUTC, opts) -> oggetto descritto nel LEGGIMI.

     opts: { basin:bool, soglia_cm_h:num, datumOffset_m:num }           */
  function tide(lat, lon, quando, opts) {
    if (!DATI) throw new Error('Pacchetto maree non caricato: chiamare rfMaree.carica() prima.');
    opts = opts || {};
    var soglia = (typeof opts.soglia_cm_h === 'number') ? opts.soglia_cm_h : SOGLIA_CM_H;
    var datum = (typeof opts.datumOffset_m === 'number') ? opts.datumOffset_m : 0;
    var ms0 = (quando instanceof Date) ? quando.getTime() : new Date(quando).getTime();

    var cal = calibrazione(lat, lon);
    var dtms = cal ? -cal.delta_min * 60000 : 0;   /* t - delta_min, vedi sopra */
    var comp = interpola(lat, lon);

    var v = valuta(comp, ms0 + dtms);
    var rate = v.d * 100;                           /* m/h -> cm/h */

    var trend = (Math.abs(rate) < soglia) ? 'stanca' : (rate >= soglia ? 'montante' : 'calante');

    var st = prossimaStanca(comp, ms0 + dtms);
    var conf = confidenza(lat, lon, comp.terraVicina, cal);

    var out = {
      rate_cm_h: arrotonda(rate, 2),
      trend: trend,
      minutes_to_slack: st ? Math.round((st.ms - (ms0 + dtms)) / 60000) : null,
      next_slack: st ? { timeUTC: new Date(st.ms - dtms), type: st.tipo } : null,
      /* Livello sul MEDIO MARE, informativo. Il datum delle carte nautiche
         italiane non e' il medio mare ma uno zero idrografico locale, piu'
         basso: per confrontare questo numero con le quote della carta si
         passa datumOffset_m. Non tocca ne' tendenza ne' stanca, che sono
         derivate e quindi cieche a qualunque costante additiva. */
      height_m: arrotonda(v.h + datum, 3),
      confidence: conf.liv,
      confidence_perche: conf.perche,
      meteo_warning: METEO,
      calibrazione: cal ? cal.nome : null
    };
    if (METEO) out.avviso = 'Calcolo puramente astronomico: con vento sostenuto ' +
      'il sovralzo meteorologico puo\' invertire la tendenza reale.';

    /* ------------------------------------------------------ modalita' bacino

       Per un bacino alimentato da una o piu' bocche — laguna, valle da
       pesca, darsena — la portata in bocca e' quella che serve a far
       cambiare il livello di tutto lo specchio d'acqua: Q = A * dh/dt, con
       A l'area del bacino (prisma di marea). Quindi:

         dh/dt > 0  ->  il bacino si riempie  ->  corrente ENTRANTE
         dh/dt < 0  ->  il bacino si svuota   ->  corrente USCENTE

       E qui sta il punto che sembra sbagliato e non lo e': la corrente e'
       MASSIMA A META' MAREA, quando il livello passa per il medio e la
       derivata e' massima, ed e' NULLA AI COLMI, in alta e in bassa marea,
       quando il livello e' estremo e la derivata si annulla. Chi legge
       dopo e' tentato di "correggere" mettendo la stanca a meta' marea:
       non farlo. Livello e corrente sono in quadratura, non in fase.

       NON vale per un canale che mette in comunicazione due bacini diversi
       — lo Stretto di Messina e' l'esempio da manuale — dove la corrente
       segue il GRADIENTE fra i due estremi e non la derivata locale: nello
       Stretto la corrente gira quando i due mari sono in fase, che non ha
       nulla a che vedere con la stanca locale. Per questo flow esiste solo
       se il chiamante dichiara opts.basin: senza quella dichiarazione il
       campo non c'e', invece di esserci e mentire.                     */
    if (opts.basin) out.flow = (trend === 'stanca') ? 'stanca' :
                               (trend === 'montante' ? 'entrante' : 'uscente');
    return out;
  }

  /* ----------------------------------------------------- ricerca della stanca

     Si cerca lo zero di dh/dt, non il massimo del livello: e' la stessa
     cosa in teoria, ma numericamente no. Vicino a un massimo il livello e'
     piatto (varia come il quadrato dello scarto) e individuarne il vertice
     al minuto e' impossibile; la derivata invece attraversa lo zero con
     pendenza piena, ed e' li' che si puo' bisezionare con precisione.

     Campionamento a 1 minuto su 12 ore, poi bisezione SULLA DERIVATA.   */
  function prossimaStanca(comp, ms) {
    var passo = 60000, fine = 12 * 60;
    var d0 = valuta(comp, ms).d, s0 = d0 >= 0 ? 1 : -1, t = ms;
    for (var k = 1; k <= fine; k++) {
      var t1 = ms + k * passo, d1 = valuta(comp, t1).d;
      if (d0 === 0) { d0 = d1; s0 = d1 >= 0 ? 1 : -1; t = t1; continue; }
      if ((d1 >= 0 ? 1 : -1) !== s0) {
        var a = t, b = t1;
        for (var it = 0; it < 30 && b - a > 1000; it++) {
          var m = (a + b) / 2, dm = valuta(comp, m).d;
          if ((dm >= 0 ? 1 : -1) === s0) a = m; else b = m;
        }
        /* derivata che passa da + a -: il livello smette di salire, e'
           un'alta marea. Da - a +: bassa marea. */
        return { ms: Math.round((a + b) / 2), tipo: s0 > 0 ? 'AM' : 'BM' };
      }
      t = t1; d0 = d1;
    }
    return null;   /* 12 ore senza inversione: succede solo se il pacchetto e' rotto */
  }

  function arrotonda(x, n) { var k = Math.pow(10, n); return Math.round(x * k) / k; }

  /* ------------------------------------------------------------------ serie
     Comodita' per i grafici: livello e derivata su una finestra, calcolati
     una volta sola le componenti. Nessuna magia, e' tide() senza fronzoli. */
  function serie(lat, lon, daUTC, ore, passoMin) {
    if (!DATI) throw new Error('Pacchetto maree non caricato.');
    var comp = interpola(lat, lon), cal = calibrazione(lat, lon);
    var dtms = cal ? -cal.delta_min * 60000 : 0;
    var ms = (daUTC instanceof Date) ? daUTC.getTime() : new Date(daUTC).getTime();
    var n = Math.round(ore * 60 / passoMin), out = [];
    for (var i = 0; i <= n; i++) {
      var t = ms + i * passoMin * 60000, v = valuta(comp, t + dtms);
      out.push({ ms: t, h: v.h, rate: v.d * 100 });
    }
    return out;
  }

  window.rfMaree = {
    carica: carica,
    pronto: pronto,
    tide: tide,
    marea: tide,              /* alias italiano, stessa funzione */
    serie: serie,
    setMeteoWarning: setMeteoWarning,
    meteoWarning: function () { return METEO; },
    calibrazioni: CALIBRA,    /* si popola a valle dei test, vedi LEGGIMI */
    soglia: function (v) { if (typeof v === 'number') SOGLIA_CM_H = v; return SOGLIA_CM_H; },
    /* esposti per lo script di validazione, che confronta questo stesso
       codice con pyTMD e con gli osservati ISPRA */
    _argomenti: argomenti, _astro: astro, _COST: COST, _valuta: valuta,
    _nomi: function (l) { if (l) NOMI = l.slice(); return NOMI; },
    _installa: installa,
    _interpola: function (la, lo) { return interpola(la, lo); }
  };
})();
