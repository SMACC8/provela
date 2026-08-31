/* ═══════════════════════════════════════════════════════════════════════
   ProVela · rf-live.js — trasmettitore della Posizione Live, condiviso
   ───────────────────────────────────────────────────────────────────────
   Caricato da OGNI modulo con una riga sola, come rf-topbar.js.

   PERCHE' ESISTE. ProVela e' multipagina: ogni modulo e' un documento a
   se'. Finche' la trasmissione viveva dentro posizione/index.html, andare
   in Meteo scaricava la pagina e con essa watchPosition, il timer e la
   variabile txOn — la trasmissione si fermava senza che nulla lo dicesse,
   e nulla in localStorage ricordava che era accesa (segnalato 22/08).
   Ora lo stato sta in "raffyca-live" e ogni pagina che si apre riprende
   da sola. Resta un buco di 1-3 secondi durante il cambio pagina:
   irrilevante con intervalli da 30 s in su, ma e' un buco vero.

   Il Service Worker NON era un'alternativa: l'API di geolocalizzazione
   non e' esposta ai worker, quindi un SW non puo' leggere il GPS.

   IL TOKEN non sta piu' nel sorgente. Vive in "raffyca-live-token", si
   inserisce una volta da Posizione e sopravvive agli aggiornamenti; prima
   era una costante da riscrivere a mano a ogni consegna. Resta comunque
   un segreto in chiaro sul dispositivo: da' accesso in scrittura al solo
   database delle posizioni, non e' una credenziale di sistema.

   Espone window.rfLive. Non tocca il DOM: chi vuole mostrare qualcosa si
   iscrive con rfLive.onChange().
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var K_STATO = "raffyca-live";          /* {on, freq} */
  var K_TOKEN = "raffyca-live-token";
  var K_SESS  = "raffyca-live-session";
  var URL_BASE = "https://united-dingo-121489.upstash.io";

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
  function token() { try { return localStorage.getItem(K_TOKEN) || ""; } catch (e) { return ""; } }
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
      on: s.on, freq: s.freq, haToken: !!token(), sessione: sessione(),
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
    return p.boat || p.model || "ProVela";
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
    var tk = token();
    if (!tk) { ultimoEsito = "token non inserito"; avvisa(); return; }
    var s = stato();
    var key = "raffyca:pos:" + sessione();
    var ttl = Math.max(3 * s.freq, 3600);
    fetch(URL_BASE + "/set/" + encodeURIComponent(key) + "?EX=" + ttl, {
      method: "POST", headers: { Authorization: "Bearer " + tk }, body: JSON.stringify(pl)
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (j && j.result === "OK") { ultimoInvio = Date.now(); ultimoEsito = "ok"; }
      else { ultimoEsito = "risposta inattesa"; }
      avvisa();
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
  function impostaToken(t) {
    try {
      if (t) localStorage.setItem(K_TOKEN, String(t).trim());
      else localStorage.removeItem(K_TOKEN);
    } catch (e) {}
    avvisa();
  }

  window.rfLive = {
    stato: istantanea,
    avvia: avvia, ferma: ferma, frequenza: frequenza,
    impostaToken: impostaToken, haToken: function () { return !!token(); },
    sessione: sessione, urlBase: URL_BASE,
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
