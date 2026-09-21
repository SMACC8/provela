/* ═══════════════════════════════════════════════════════════════════════
   Dritta · rf-nmea.js — strumenti di bordo, lettore condiviso
   ───────────────────────────────────────────────────────────────────────
   Stessa forma di rf-live.js: ES5 puro, nessuna dipendenza, nessun DOM.
   Legge le frasi NMEA 0183 che arrivano dagli strumenti e le mette nel
   contratto condiviso, cosi' ogni modulo se le trova senza sapere niente
   di socket, di checksum e di gateway.

   DA DOVE ARRIVANO. Da un gateway NMEA 2000 -> Wi-Fi (Yacht Devices
   YDWG-02 e simili), che pubblica una socket TCP — di fabbrica
   192.168.4.1 porta 1456. Il browser una socket TCP non la sa aprire, e
   qui sta tutta la faccenda dell'app nativa:

     - dentro l'APK: la socket la apre il lato nativo e passa le righe a
       rfNmea.alimenta();
     - nel browser, per prova: un ponte che rigira la TCP su WebSocket, e
       si usa rfNmea.collega("ws://...").

   Il parser non sa quale dei due sia, e non deve saperlo.

   QUALE FRASE DA QUALE STRUMENTO, sulla barca di Sergio (Raymarine
   SeaTalk NG, i50 profondita'/velocita', i60 vento):

     MWV  vento apparente (R) e reale relativo (T)   i60
     VHW  velocita' sull'acqua                        i50
     DBT  profondita' sotto il trasduttore            i50
     DPT  profondita' con offset dichiarato           i50 (se configurato)
     MTW  temperatura acqua                           i50
     HDG  prua bussola        NON la danno i50 e i60: serve un EV-1, un
     HDM  prua magnetica      i70 con bussola, o un autopilota
     RMC  posizione, COG, SOG dal GPS sul bus
     VTG  COG e SOG

   IL TWD E' IL PUNTO DELICATO. Il vento "vero" che gli strumenti mandano
   in MWV,T e' un ANGOLO RELATIVO ALLA PRUA (TWA), non una direzione
   bussola. Per avere il TWD — che e' quello su cui Partenza calcola il
   lato favorito — serve sapere dove punta la barca:

       TWD = TWA + prua

   Con la bussola sul bus e' un dato misurato. Senza, si ripiega sul COG
   del GPS, che e' un'altra cosa: coincide con la prua solo se non c'e'
   scarroccio ne' corrente, e a bassa velocita' — cioe' proprio nei minuti
   prima della partenza — balla parecchio. Per questo il TWD porta sempre
   con se' `twdDa`: "bussola" o "cog". Chi lo mostra all'utente dica
   quale dei due, invece di dare per misurato un numero stimato.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var K_DATI  = "raffyca-nmea";        /* istantanea condivisa, vedi in fondo */
  var K_PONTE = "raffyca-nmea-ponte";   /* ws://... del ponte, solo per le prove */
  var VECCHIO_MS = 15000;          /* oltre questo, un dato non e' piu' vivo */

  var D = {};                      /* campo -> {v: valore, t: quando} */
  var ascoltatori = [], spie = [];  /* spie = chi vuole le righe grezze */
  var ultimaScrittura = 0;

  function ora() { return Date.now(); }
  function poni(k, v) {
    if (v == null || !isFinite(v)) return;
    D[k] = { v: v, t: ora() };
  }
  function val(k, maxEta) {
    var d = D[k];
    if (!d) return null;
    if (ora() - d.t > (maxEta || VECCHIO_MS)) return null;
    return d.v;
  }

  /* ─────────────────────────────── checksum ───────────────────────────
     Una riga corrotta non si scarta per pignoleria: su una socket i
     pacchetti si spezzano e si incollano, e una frase mutilata darebbe un
     vento plausibile e sbagliato. Meglio perdere un secondo di dati. */
  function checksumOk(riga) {
    var st = riga.indexOf("*");
    if (st < 1) return false;
    var corpo = riga.substring(1, st), atteso = riga.substring(st + 1, st + 3);
    var c = 0, i;
    for (i = 0; i < corpo.length; i++) c ^= corpo.charCodeAt(i);
    var mio = c.toString(16).toUpperCase();
    if (mio.length < 2) mio = "0" + mio;
    return mio === atteso.toUpperCase();
  }

  function num(s) {
    if (s == null || s === "") return null;
    var v = parseFloat(s);
    return isFinite(v) ? v : null;
  }
  function g360(x) { x = x % 360; return x < 0 ? x + 360 : x; }
  function pm180(x) { return ((x + 540) % 360) - 180; }

  /* ─────────────────────────────── una frase ───────────────────────── */
  function frase(riga) {
    riga = riga.replace(/[\r\n]+$/, "");
    if (!riga || (riga.charAt(0) !== "$" && riga.charAt(0) !== "!")) return false;
    if (riga.indexOf("*") >= 0 && !checksumOk(riga)) return false;
    var corpo = riga.substring(1, riga.indexOf("*") >= 0 ? riga.indexOf("*") : riga.length);
    var c = corpo.split(",");
    /* i primi due caratteri sono il parlante (WI, SD, GP, HC...): quello
       che conta e' il tipo di frase, gli ultimi tre */
    var tipo = c[0].length >= 5 ? c[0].substring(2) : c[0];

    switch (tipo) {
      case "MWV":                                  /* vento */
        var ang = num(c[1]), vel = num(c[3]);
        if (c[5] && c[5].charAt(0) !== "A") return true;   /* dato non valido */
        if (vel != null && c[4]) vel = inNodi(vel, c[4]);
        if (ang == null || vel == null) return true;
        if (c[2] === "R") { poni("awa", pm180(ang)); poni("aws", vel); }
        else if (c[2] === "T") { poni("twa", pm180(ang)); poni("tws", vel); }
        return true;

      case "VHW":                                  /* velocita' sull'acqua */
        if (num(c[1]) != null) poni("hdgT", g360(num(c[1])));
        if (num(c[3]) != null) poni("hdgM", g360(num(c[3])));
        var st = num(c[5]);
        if (st == null && num(c[7]) != null) st = num(c[7]) / 1.852;
        poni("stw", st);
        return true;

      case "DBT":                                  /* profondita' sotto il trasduttore */
        var m = num(c[3]);
        if (m == null && num(c[1]) != null) m = num(c[1]) * 0.3048;
        poni("dbt", m);
        return true;

      case "DPT":                                  /* profondita' + offset */
        var p = num(c[1]), off = num(c[2]);
        if (p != null) { poni("dbt", p); if (off != null) poni("dpt", p + off); }
        return true;

      case "MTW": poni("mtw", num(c[1])); return true;

      case "HDG":                                  /* prua bussola */
        var hm = num(c[1]);
        if (hm == null) return true;
        poni("hdgM", g360(hm));
        var dev = num(c[2]), varz = num(c[4]);
        if (dev != null && c[3] === "W") dev = -dev;
        if (varz != null && c[5] === "W") varz = -varz;
        if (varz != null) poni("varz", varz);
        poni("hdg", g360(hm + (dev || 0) + (varz || 0)));
        return true;

      case "HDM": poni("hdgM", g360(num(c[1]))); return true;
      case "HDT": poni("hdg", g360(num(c[1]))); return true;

      case "VTG":
        if (num(c[1]) != null) poni("cog", g360(num(c[1])));
        if (num(c[5]) != null) poni("sog", num(c[5]));
        return true;

      case "RMC":
        if (c[2] !== "A") return true;
        var la = gradi(c[3], c[4]), lo = gradi(c[5], c[6]);
        if (la != null) poni("lat", la);
        if (lo != null) poni("lon", lo);
        if (num(c[7]) != null) poni("sog", num(c[7]));
        if (num(c[8]) != null) poni("cog", g360(num(c[8])));
        /* la variazione magnetica viaggia in coda a RMC: serve a portare
           una prua magnetica su quella vera senza indovinare */
        var vr = num(c[10]);
        if (vr != null) poni("varz", c[11] === "W" ? -vr : vr);
        return true;

      case "GGA":
        if (c[6] === "0") return true;
        var la2 = gradi(c[2], c[3]), lo2 = gradi(c[4], c[5]);
        if (la2 != null) poni("lat", la2);
        if (lo2 != null) poni("lon", lo2);
        return true;
    }
    return true;
  }

  function inNodi(v, unita) {
    if (unita === "N") return v;
    if (unita === "K") return v / 1.852;          /* km/h */
    if (unita === "M") return v * 1.94384;        /* m/s  */
    if (unita === "S") return v * 0.868976;       /* mph  */
    return v;
  }
  /* "4112.6013","N" -> 41.210022 */
  function gradi(campo, emi) {
    if (!campo) return null;
    var p = campo.indexOf(".");
    if (p < 3) return null;
    var g = parseFloat(campo.substring(0, p - 2)), m = parseFloat(campo.substring(p - 2));
    if (!isFinite(g) || !isFinite(m)) return null;
    var v = g + m / 60;
    if (emi === "S" || emi === "W") v = -v;
    return v;
  }

  /* ───────────────────────── flusso, a pezzi qualunque ─────────────────
     Il TCP non consegna righe: consegna byte. Una frase puo' arrivare
     spezzata in due pacchetti, e due frasi possono arrivare insieme. */
  var resto = "";
  function alimenta(testo) {
    if (!testo) return;
    resto += testo;
    if (resto.length > 8192) resto = resto.substring(resto.length - 4096);  /* niente memoria infinita */
    var righe = resto.split(/\r?\n/);
    resto = righe.pop();
    var i, j, qualcosa = false;
    for (i = 0; i < righe.length; i++) {
      var presa = frase(righe[i]);
      if (presa) qualcosa = true;
      /* le spie vedono ANCHE le righe rifiutate, con l'esito: una pagina di
         diagnostica serve soprattutto quando qualcosa non torna */
      for (j = 0; j < spie.length; j++) {
        try { spie[j](righe[i], presa); } catch (e) {}
      }
    }
    if (qualcosa) pubblica();
  }

  /* ─────────────────────────── la prua, in ordine ──────────────────────
     Vera se qualcuno la manda vera (HDT, o HDG gia' corretta, o VHW campo
     1). Altrimenti magnetica piu' variazione, se la variazione e' passata
     su RMC o su HDG. Altrimenti magnetica e basta, dicendolo. */
  function prua() {
    var h = val("hdg");
    if (h != null) return { v: h, da: "bussola" };
    h = val("hdgT");
    if (h != null) return { v: h, da: "bussola" };
    h = val("hdgM");
    if (h != null) {
      var vz = val("varz", 3600000);            /* la variazione non invecchia in un'ora */
      if (vz != null) return { v: g360(h + vz), da: "bussola" };
      return { v: h, da: "bussola magnetica" };
    }
    return null;
  }

  /* ───────────────────────────── il vento vero ─────────────────────────
     Se gli strumenti mandano MWV,T si usa quello. Se mandano solo
     l'apparente — capita quando il sensore non ha la velocita' barca — si
     ricava: il vento reale e' quello apparente meno il vento che la barca
     si fabbrica andando avanti. Serve la STW, e il risultato viene
     marcato come calcolato, perche' con corrente e scarroccio non e'
     esattamente la stessa cosa che misurarlo. */
  function ventoReale() {
    var twa = val("twa"), tws = val("tws");
    if (twa != null && tws != null) return { twa: twa, tws: tws, da: "strumenti" };
    var awa = val("awa"), aws = val("aws"), stw = val("stw");
    if (awa == null || aws == null || stw == null) return null;
    var x = aws * Math.sin(awa * Math.PI / 180);
    var y = aws * Math.cos(awa * Math.PI / 180) - stw;
    return { twa: pm180(Math.atan2(x, y) * 180 / Math.PI),
             tws: Math.sqrt(x * x + y * y), da: "calcolato" };
  }

  /* ─────────────── media circolare del TWD, e perche' serve ───────────
     Sulla barca di Sergio la bussola NON c'e' (i50 + i60, niente EV-1),
     quindi il TWD si ricava sempre dal COG. Il COG pero' contiene
     l'imbardata: su un'onda la prua oscilla di cinque gradi e il TWD
     istantaneo oscilla con lei. Se ci si disegna sopra il lato favorito
     della linea, quello sfarfalla e non si riesce a leggerlo.

     Si tiene quindi anche una MEDIA degli ultimi 60 secondi, fatta a
     vettori e non a numeri: mediare 350 e 10 gradi in aritmetica da' 180,
     cioe' il vento esattamente all'opposto. La media e' il numero da
     mostrare per decidere il lato; l'istantaneo serve ad accorgersi dei
     salti. */
  var STORIA = [], FINESTRA_MS = 60000;
  var ultimaMedia = null, ultimoCampione = 0;

  function segnaTwd(v) {
    var t = ora();
    STORIA.push({ t: t, x: Math.cos(v * Math.PI / 180), y: Math.sin(v * Math.PI / 180) });
    while (STORIA.length && t - STORIA[0].t > FINESTRA_MS) STORIA.shift();
    ultimoCampione = t;
    ultimaMedia = null;                 /* da ricalcolare: e' arrivato roba nuova */
  }
  function twdMedio() {
    /* Se non arriva piu' niente, la media si CONGELA. Continuare a
       ricalcolarla su una finestra che si svuota la fa scivolare da sola:
       il gateway e' morto, nessun dato entra, e il numero a schermo
       continua a muoversi di un grado ogni tanto. Sembra vivo e non lo e',
       ed e' il modo peggiore di rompersi. Visto succedere staccando il
       gateway durante il collaudo: 319 -> 321 a stream fermo. */
    if (ultimaMedia && ora() - ultimoCampione > 5000) return ultimaMedia;
    if (ultimaMedia) return ultimaMedia;

    var t = ora(), x = 0, y = 0, n = 0, i;
    for (i = 0; i < STORIA.length; i++) {
      if (t - STORIA[i].t > FINESTRA_MS) continue;
      x += STORIA[i].x; y += STORIA[i].y; n++;
    }
    if (!n) return null;
    /* la lunghezza del vettore medio dice quanto il vento e' stato stabile:
       1 = fermo come un chiodo, verso 0 = girava di qua e di la' */
    var r = Math.sqrt(x * x + y * y) / n;
    ultimaMedia = { twd: g360(Math.atan2(y / n, x / n) * 180 / Math.PI), n: n, stabilita: r };
    return ultimaMedia;
  }

  var ultimoTwdBuono = null;      /* {twd, t, da} — tiene il valore quando ci si ferma */

  function calcolaTwd() {
    var vr = ventoReale();
    if (!vr) return ultimoTwdBuono;
    var p = prua(), fuori = null;
    if (p) fuori = { twd: g360(p.v + vr.twa), da: p.da };
    else {
      var cog = val("cog"), sog = val("sog");
      /* Sotto il nodo e mezzo il COG e' rumore puro: il GPS "gira" anche
         stando fermi. Invece di inventare un TWD si tiene l'ULTIMO BUONO
         e si dice da quanto: e' fermo da venti secondi, non e' sbagliato,
         ed e' un'informazione che chi e' in pozzetto sa usare. */
      if (cog != null && sog != null && sog >= 1.5) fuori = { twd: g360(cog + vr.twa), da: "cog" };
    }
    if (!fuori) return ultimoTwdBuono;
    segnaTwd(fuori.twd);
    ultimoTwdBuono = { twd: fuori.twd, da: fuori.da, t: ora() };
    return ultimoTwdBuono;
  }

  function istantanea() {
    var t = calcolaTwd(), vr = ventoReale(), p = prua(), m = twdMedio();
    return {
      aws: val("aws"), awa: val("awa"),
      tws: vr ? vr.tws : null, twa: vr ? vr.twa : null, twDa: vr ? vr.da : null,
      twd: t ? t.twd : null, twdDa: t ? t.da : null,
      /* eta' del TWD in secondi: 0 e' vivo, 40 vuol dire che e' fermo da
         quaranta secondi perche' la barca non ha abbastanza abbrivio */
      twdEta: t ? Math.round((ora() - t.t) / 1000) : null,
      twdMed: m ? m.twd : null, twdStab: m ? Math.round(m.stabilita * 100) / 100 : null,
      stw: val("stw"),
      hdg: p ? p.v : null, hdgDa: p ? p.da : null, hdgM: val("hdgM"),
      dbt: val("dbt"), dpt: val("dpt"), mtw: val("mtw"),
      cog: val("cog"), sog: val("sog"),
      lat: val("lat"), lon: val("lon"),
      t: ora()
    };
  }

  /* Il contratto condiviso: una chiave sola, `raffyca-nmea`, con dentro
     l'istantanea. Una chiave per grandezza sarebbe stata piu' "pulita" e
     molto peggiore: cinque scritture al secondo su localStorage, e i
     moduli costretti a rileggerne cinque per sapere una cosa sola.
     Si scrive al massimo una volta al secondo. */
  function pubblica() {
    var s = istantanea(), i;
    if (ora() - ultimaScrittura >= 1000) {
      ultimaScrittura = ora();
      try { localStorage.setItem(K_DATI, JSON.stringify(s)); } catch (e) {}
    }
    for (i = 0; i < ascoltatori.length; i++) { try { ascoltatori[i](s); } catch (e) {} }
  }

  /* ─────────────────────── collegamento via WebSocket ──────────────────
     Serve solo nel browser, col ponte davanti. Dentro l'APK la socket la
     apre il nativo e chiama alimenta() direttamente. */
  var WS = null, urlWs = "", riprova = null, statoConn = "fermo";
  function collega(url) {
    urlWs = url || urlWs;
    if (!urlWs || typeof WebSocket === "undefined") return;
    scollega();
    statoConn = "in collegamento";
    try { WS = new WebSocket(urlWs); } catch (e) { statoConn = "errore"; pianificaRiprova(); return; }
    WS.onopen = function () { statoConn = "collegato"; };
    WS.onmessage = function (e) { alimenta(typeof e.data === "string" ? e.data : ""); };
    WS.onclose = function () { statoConn = "caduto"; pianificaRiprova(); };
    WS.onerror = function () { statoConn = "errore"; };
  }
  function pianificaRiprova() {
    if (riprova) return;
    riprova = setTimeout(function () { riprova = null; collega(); }, 3000);
  }
  function scollega() {
    if (riprova) { clearTimeout(riprova); riprova = null; }
    if (WS) { try { WS.onclose = null; WS.close(); } catch (e) {} WS = null; }
    statoConn = "fermo";
  }

  /* ─────────── chi ha la socket, e chi legge e basta ──────────────────
     A bordo, dentro l'APK, la socket la apre il lato nativo e chiama
     alimenta(): ogni pagina ha i dati di prima mano.

     Nel browser no: la socket non si puo' aprire. Allora chi vuole i dati
     ha due modi, e qui ci sono tutti e due.

     1. COLLEGARSI AL PONTE. Se in "raffyca-nmea-ponte" c'e' un indirizzo
        ws://, questo file si collega da solo al caricamento. Si imposta
        una volta e vale per tutti i moduli.
     2. LEGGERE L'ISTANTANEA che un'altra scheda ha gia' scritto in
        "raffyca-nmea". Serve quando il ponte e' occupato da un'altra
        pagina, o quando semplicemente non c'e' rete di strumenti e si
        vuole l'ultimo dato noto.

     dati() sceglie da solo: se questa pagina ha dati freschi usa i suoi,
     altrimenti ripiega sull'istantanea condivisa. Chi chiama non deve
     sapere quale dei due casi sia. */
  function datiCondivisi() {
    try {
      var s = JSON.parse(localStorage.getItem(K_DATI) || "null");
      if (!s || !s.t || ora() - s.t > VECCHIO_MS) return null;
      s.condivisa = true;
      return s;
    } catch (e) { return null; }
  }
  function dati() {
    var mia = istantanea();
    /* "questa pagina ha dati" = almeno una grandezza viva */
    if (mia.aws != null || mia.stw != null || mia.dbt != null || mia.twd != null) return mia;
    var c = datiCondivisi();
    return c || mia;
  }

  /* ─────────── la socket nativa, quando c'e' ──────────────────────────
     Dentro l'APK il plugin Nmea apre la TCP vera e consegna le righe qui:
     stesso parser, stessa istantanea, stesse pagine. Cambia solo il tubo.
     L'indirizzo del gateway sta in "raffyca-nmea-gateway" (host:porta),
     di fabbrica quello di YDWG-02. */
  var K_GATEWAY = "raffyca-nmea-gateway";
  var GATEWAY_DI_FABBRICA = "192.168.4.1:1456";   /* YDWG-02 come esce dalla scatola */

  function nativo() {
    return (window.Capacitor && window.Capacitor.Plugins &&
            window.Capacitor.Plugins.Nmea) ? window.Capacitor.Plugins.Nmea : null;
  }

  var ascoltoNativo = false;

  function collegaNativo() {
    var P = nativo();
    if (!P) return false;
    var dove = GATEWAY_DI_FABBRICA;
    try { dove = localStorage.getItem(K_GATEWAY) || dove; } catch (e) {}
    var pezzi = dove.split(":");
    /* Gli ascoltatori si registrano UNA volta sola. Registrarli a ogni
       collegamento sembrava innocuo e non lo era: cambiando l'indirizzo del
       gateway restavano attaccati anche i vecchi, e ogni frase veniva
       digerita due volte — visibile sul tablet, il 21/09, con l'elenco
       delle frasi tutto sdoppiato. I valori reggevano (rileggere la stessa
       frase da' lo stesso numero), ma al terzo cambio sarebbero state tre
       letture, e il conto delle frasi al secondo non vorrebbe dire piu'
       niente. */
    if (!ascoltoNativo) {
      P.addListener("riga", function (ev) { if (ev && ev.riga) alimenta(ev.riga + "\n"); });
      P.addListener("stato", function (ev) { if (ev && ev.stato) statoConn = ev.stato; });
      ascoltoNativo = true;
    }
    statoConn = "in collegamento";
    P.collega({ host: pezzi[0], porta: parseInt(pezzi[1] || "1456", 10) });
    return true;
  }

  function autoCollega() {
    /* prima il nativo: se siamo nell'app, il ponte non serve */
    if (collegaNativo()) return;
    var u = "";
    try { u = localStorage.getItem(K_PONTE) || ""; } catch (e) {}
    if (u) collega(u);
  }

  window.rfNmea = {
    alimenta: alimenta,
    frase: frase,
    dati: dati,
    miei: istantanea,
    stato: function () { return statoConn; },
    collega: collega, scollega: scollega,
    onChange: function (fn) { if (typeof fn === "function") ascoltatori.push(fn); },
    onFlusso: function (fn) { if (typeof fn === "function") spie.push(fn); },
    gateway: function (v) {
      if (v === undefined) { try { return localStorage.getItem(K_GATEWAY) || GATEWAY_DI_FABBRICA; } catch (e) { return GATEWAY_DI_FABBRICA; } }
      try { localStorage.setItem(K_GATEWAY, v); } catch (e) {}
      /* niente scollega() prima: collega() sul lato nativo chiude da solo
         il giro precedente, e la chiamata in piu' faceva arrivare un
         "fermo" in ritardo che spegneva la spia a collegamento riuscito */
      if (nativo()) collegaNativo();
      return v;
    },
    nativo: function () { return !!nativo(); },
    ponte: function (u) {
      if (u === undefined) { try { return localStorage.getItem(K_PONTE) || ""; } catch (e) { return ""; } }
      try { if (u) localStorage.setItem(K_PONTE, u); else localStorage.removeItem(K_PONTE); } catch (e) {}
      if (u) collega(u); else scollega();
      return u;
    },
    _reset: function () { D = {}; resto = ""; ultimaScrittura = 0; STORIA = []; ultimoTwdBuono = null; ultimaMedia = null; ultimoCampione = 0; }
  };

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", autoCollega);
    else autoCollega();
  }
})();
