/* ═══════════════════════════════════════════════════════════════════════
   Dritta · rf-live.js — trasmettitore della Posizione Live, condiviso
   ───────────────────────────────────────────────────────────────────────
   Caricato da OGNI modulo con una riga sola, come rf-topbar.js.

   PERCHE' ESISTE. Dritta e' multipagina: ogni modulo e' un documento a
   se'. Finche' la trasmissione viveva dentro posizione/index.html, andare
   in Meteo scaricava la pagina e con essa watchPosition, il timer e la
   variabile txOn — la trasmissione si fermava senza che nulla lo dicesse,
   e nulla in localStorage ricordava che era accesa (segnalato 22/08).
   Ora lo stato sta in "raffyca-live" e ogni pagina che si apre riprende
   da sola. Resta un buco di 1-3 secondi durante il cambio pagina:
   irrilevante con intervalli da 30 s in su, ma e' un buco vero.

   Il Service Worker NON era un'alternativa: l'API di geolocalizzazione
   non e' esposta ai worker, quindi un SW non puo' leggere il GPS.

   DOVE FINISCE LA POSIZIONE. Su Supabase, nello stesso progetto di
   Manutenzione e Carta, dal 21/09/2026 (prima era Upstash Redis). La
   configurazione non e' duplicata qui: si legge da "raffyca-supabase",
   la chiave che scrive Impostazioni e che leggono gia' gli altri due
   moduli. Se manca, la trasmissione lo dice invece di fallire in
   silenzio.

   IL CODICE DI SCRITTURA ("raffyca-live-secret") lo genera questo file,
   da solo, alla prima trasmissione: non c'e' piu' niente da incollare a
   mano. Non viaggia nel link e non esce dal dispositivo. Serve perche' la
   anon key di Supabase e' pubblica per costruzione — sta nel sorgente di
   segui.html — e senza un codice a parte chiunque abbia il link potrebbe
   scrivere una posizione falsa nella sessione altrui. Vale la regola del
   primo arrivato: la prima scrittura registra il codice, le successive
   devono combaciare. Se il codice va perso (localStorage svuotato) la
   sessione resta chiusa finche' non scade: si riapre subito generando un
   nuovo codice sessione da Posizione.

   Espone window.rfLive. Non tocca il DOM: chi vuole mostrare qualcosa si
   iscrive con rfLive.onChange().
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var K_STATO   = "raffyca-live";          /* {on, freq} */
  var K_SESS    = "raffyca-live-session";
  var K_SEGRETO = "raffyca-live-secret";   /* codice di scrittura, generato qui */
  var K_SB      = "raffyca-supabase";      /* {url, key, bucket} — la scrive Impostazioni */
  var K_VECCHIO = "raffyca-live-token";    /* il token Upstash di prima: si cancella */

  var R = 6371000;
  function rad(d) { return d * Math.PI / 180; }
  function deg(r) { return r * 180 / Math.PI; }

  function leggi(k, dflt) {
    try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? dflt : v; }
    catch (e) { return dflt; }
  }
  function scrivi(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function stato() {
    var s = leggi(K_STATO, null);
    if (!s || typeof s !== "object") s = { on: false, freq: 60 };
    if (!isFinite(s.freq) || s.freq < 5) s.freq = 60;
    return { on: !!s.on, freq: s.freq };
  }
  /* Configurazione Supabase: la stessa di manutenzione/ e carta/, letta e
     non copiata. Si rilegge a ogni invio perche' l'utente puo' cambiarla
     in Impostazioni mentre questa pagina e' aperta. */
  function sbCfg() {
    try {
      var c = JSON.parse(localStorage.getItem(K_SB) || "null") || {};
      return { url: String(c.url || "").replace(/\/+$/, ""), key: c.key || "" };
    } catch (e) { return { url: "", key: "" }; }
  }
  function haConfig() { var c = sbCfg(); return !!(c.url && c.key); }

  function casuale(n) {
    var abc = "abcdefghijklmnopqrstuvwxyz0123456789", out = "", i;
    if (window.crypto && window.crypto.getRandomValues) {
      var b = new Uint8Array(n);
      window.crypto.getRandomValues(b);
      for (i = 0; i < n; i++) out += abc.charAt(b[i] % abc.length);
      return out;
    }
    for (i = 0; i < n; i++) out += abc.charAt(Math.floor(Math.random() * abc.length));
    return out;
  }

  /* Codice di scrittura: si crea da solo la prima volta e poi resta. Qui
     dentro si fa anche pulizia del token Upstash, che dal 21/09 non serve
     piu' a nessuno e non ha motivo di restare in chiaro sul telefono. */
  function segreto() {
    try {
      try { if (localStorage.getItem(K_VECCHIO) != null) localStorage.removeItem(K_VECCHIO); } catch (e0) {}
      var s = localStorage.getItem(K_SEGRETO);
      if (!s) { s = casuale(24); localStorage.setItem(K_SEGRETO, s); }
      return s;
    } catch (e) { return ""; }
  }
  function sessione() {
    try {
      var s = localStorage.getItem(K_SESS);
      if (!s) {
        s = Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);
        localStorage.setItem(K_SESS, s);
      }
      return s;
    } catch (e) { return "locale"; }
  }

  /* ─────────────────────────── stato vivo ─────────────────────────── */
  var cur = null, sog = null, cog = null;
  var watchId = null, timer = null, ultimoInvio = 0, ultimoEsito = "";
  var ascoltatori = [];

  function avvisa() {
    var i, snap = istantanea();
    for (i = 0; i < ascoltatori.length; i++) {
      try { ascoltatori[i](snap); } catch (e) {}
    }
  }
  function istantanea() {
    var s = stato();
    return {
      on: s.on, freq: s.freq, haConfig: haConfig(), sessione: sessione(),
      pos: cur ? { lat: cur.ll[0], lon: cur.ll[1], t: cur.t } : null,
      sog: sog, cog: cog, ultimoInvio: ultimoInvio, esito: ultimoEsito
    };
  }

  function hav(a, b) {
    var dLa = rad(b[0] - a[0]), dLo = rad(b[1] - a[1]);
    var x = Math.pow(Math.sin(dLa / 2), 2) +
            Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.pow(Math.sin(dLo / 2), 2);
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  function brng(a, b) {
    var y = Math.sin(rad(b[1] - a[1])) * Math.cos(rad(b[0]));
    var x = Math.cos(rad(a[0])) * Math.sin(rad(b[0])) -
            Math.sin(rad(a[0])) * Math.cos(rad(b[0])) * Math.cos(rad(b[1] - a[1]));
    return (deg(Math.atan2(y, x)) + 360) % 360;
  }

  function onFix(p) {
    var la = p.coords.latitude, lo = p.coords.longitude, t = p.timestamp;
    var nx = { ll: [la, lo], t: t };
    var s = p.coords.speed, h = p.coords.heading;
    if (cur) {
      var dt = (t - cur.t) / 1000, d = hav(cur.ll, nx.ll);
      if (dt > 0) {
        if (s == null || !isFinite(s)) s = d / dt;
        if ((h == null || !isFinite(h)) && d > 3) h = brng(cur.ll, nx.ll);
      }
    }
    if (s != null && isFinite(s)) sog = s * 1.94384;
    if (h != null && isFinite(h)) cog = h;
    cur = nx;
    /* raffyca-pos e' il contratto condiviso: lo aggiorna anche qui, cosi'
       il pallino GPS in barra resta vivo in qualunque modulo. */
    try { localStorage.setItem("raffyca-pos", JSON.stringify({ lat: la, lon: lo, ts: Date.now() })); } catch (e) {}
    /* Primo fix utile: si invia subito invece di aspettare il timer. Senza
       questo, con frequenza a 60 minuti e un fix che arriva qualche secondo
       dopo l'avvio, la prima posizione sarebbe partita un'ora dopo. */
    if (stato().on && !ultimoInvio) invia();
    avvisa();
  }
  function onErr(e) { ultimoEsito = "GPS: " + (e && e.message ? e.message : "errore"); avvisa(); }

  function wpAttivo() {
    try {
      var id = localStorage.getItem("raffyca-active-wp") || "";
      if (!id) return null;
      var ws = JSON.parse(localStorage.getItem("raffyca-waypoints") || "[]"), i;
      for (i = 0; i < ws.length; i++) if (ws[i].id === id) return ws[i];
      return null;
    } catch (e) { return null; }
  }
  function wpCalc() {
    var w = wpAttivo();
    if (!w || !cur || !isFinite(w.lat) || !isFinite(w.lon)) return { wp: w, rng: null, ttg: null, eta: null };
    var rngNm = hav(cur.ll, [w.lat, w.lon]) / 1852;
    var bTo = brng(cur.ll, [w.lat, w.lon]);
    var vmg = null, ttg = null, eta = null;
    if (sog != null && cog != null) {
      vmg = sog * Math.cos(rad(((bTo - cog + 540) % 360) - 180));
      if (vmg > 0.1) { ttg = (rngNm / vmg) * 3600; eta = Date.now() + ttg * 1000; }
    }
    return { wp: w, rng: rngNm, ttg: ttg, eta: eta };
  }
  function nomeBarca() {
    var p = leggi("raffyca-profile", {}) || {};
    return p.boat || p.model || "Dritta";
  }
  function payload() {
    if (!cur) return null;
    var c = wpCalc(), s = stato();
    return {
      b: nomeBarca(),
      lat: +cur.ll[0].toFixed(6), lon: +cur.ll[1].toFixed(6),
      cog: cog != null ? Math.round(cog) : null,
      sog: sog != null ? +sog.toFixed(1) : null,
      wp: c.wp ? { name: c.wp.name, lat: c.wp.lat, lon: c.wp.lon,
                   rng: c.rng != null ? +c.rng.toFixed(2) : null,
                   ttg: c.ttg != null ? Math.round(c.ttg) : null,
                   eta: c.eta || null } : null,
      iv: s.freq,
      t: cur.t
    };
  }

  function invia() {
    var pl = payload();
    if (!pl) { ultimoEsito = "in attesa del primo fix GPS"; avvisa(); return; }
    var c = sbCfg();
    if (!c.url || !c.key) {
      ultimoEsito = "database non configurato: apri Impostazioni";
      avvisa(); return;
    }
    var s = stato();
    /* ttl invariato rispetto a Upstash: tre intervalli, mai meno di un'ora.
       Lo interpreta put_pos, che lo somma a now() e scrive expires_at —
       Postgres il TTL non ce l'ha. */
    var ttl = Math.max(3 * s.freq, 3600);
    fetch(c.url + "/rest/v1/rpc/put_pos", {
      method: "POST",
      headers: {
        apikey: c.key,
        Authorization: "Bearer " + c.key,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        p_session: sessione(), p_payload: pl, p_ttl: ttl, p_secret: segreto()
      })
    }).then(function (r) {
      /* put_pos non restituisce nulla: la risposta e' 204 con corpo vuoto.
         Qui NON si chiama r.json(), che su un corpo vuoto solleva — ed e'
         il modo in cui una migrazione come questa fallisce in silenzio,
         perche' l'eccezione finisce nel .catch e sembra un problema di
         rete. Si guarda r.ok e basta. */
      if (r.ok) { ultimoInvio = Date.now(); ultimoEsito = "ok"; avvisa(); return; }
      return r.text().then(function (t) {
        var m = "";
        try { var j = JSON.parse(t); m = j.message || j.hint || j.error || ""; } catch (e) {}
        ultimoEsito = "invio rifiutato (" + r.status + ")" + (m ? ": " + m : "");
        avvisa();
      });
    }).catch(function (e) {
      ultimoEsito = "invio fallito: " + (e && e.message ? e.message : "rete");
      avvisa();
    });
  }

  function avviaMotore() {
    if (watchId != null) return;
    if (!navigator.geolocation) { ultimoEsito = "geolocalizzazione non disponibile"; avvisa(); return; }
    var s = stato();
    watchId = navigator.geolocation.watchPosition(onFix, onErr,
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
    invia();
    timer = setInterval(invia, s.freq * 1000);
    avvisa();
  }
  function fermaMotore() {
    if (watchId != null && navigator.geolocation) {
      try { navigator.geolocation.clearWatch(watchId); } catch (e) {}
    }
    watchId = null;
    if (timer) clearInterval(timer);
    timer = null;
    avvisa();
  }

  function avvia(freq) {
    var s = stato();
    scrivi(K_STATO, { on: true, freq: isFinite(freq) && freq >= 5 ? freq : s.freq });
    fermaMotore(); avviaMotore();
  }
  function ferma() {
    var s = stato();
    scrivi(K_STATO, { on: false, freq: s.freq });
    fermaMotore();
  }
  function frequenza(freq) {
    var s = stato();
    scrivi(K_STATO, { on: s.on, freq: isFinite(freq) && freq >= 5 ? freq : s.freq });
    if (s.on) { fermaMotore(); avviaMotore(); }
    else avvisa();
  }
  window.rfLive = {
    stato: istantanea,
    avvia: avvia, ferma: ferma, frequenza: frequenza,
    haConfig: haConfig,
    sessione: sessione,
    onChange: function (fn) { if (typeof fn === "function") ascoltatori.push(fn); }
  };

  /* Ripresa automatica: se la trasmissione risulta accesa, questa pagina
     la riprende senza che l'utente debba tornare in Posizione. */
  function parti() { if (stato().on) avviaMotore(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", parti);
  else parti();

  /* Se un'altra scheda la ferma o la avvia, questa si allinea. */
  window.addEventListener("storage", function (e) {
    if (e.key !== K_STATO) return;
    if (stato().on) { if (watchId == null) avviaMotore(); }
    else fermaMotore();
  });
})();
