/* ═══════════════════════════════════════════════════════════════════════
   Dritta · rf-strumenti.js — i numeri di bordo, calcolati una volta sola
   ───────────────────────────────────────────────────────────────────────
   Stessa forma di rf-nmea.js e rf-live.js: ES5, nessuna dipendenza, nessun
   DOM. Lo usano il Cruscotto e la striscia della Carta, perche' mostrino
   sempre gli stessi numeri.

   PERCHE' ESISTE (29/09/2026). Il vento «Stima» del Cruscotto non veniva da
   nessuna previsione: era un valore d'esempio (14,2 kt da 158°) fatto
   oscillare a caso ogni 1,2 s da drift(). TWA, VMG, % polare e vento
   apparente, calcolati da quello, erano inventati. E il Cruscotto non
   caricava rf-nmea.js: anche con il gateway collegato, vento, STW e
   profondita' restavano simulati.

   IL VENTO, in quest'ordine:
     1. MANUALE, se l'utente l'ha scelto nel Cruscotto
        (raffyca-dash: wind === "manual", mw = {tws, twd});
     2. STRUMENTI di bordo, se rf-nmea.js ha TWS e TWD vivi;
     3. PREVISIONE del modello (Open-Meteo) per la posizione e l'ora
        correnti, scaricata al massimo ogni 10 minuti o dopo 5 NM.
   Ogni valore porta con se' `ventoDa`: chi lo mostra dica quale dei tre
   e', perche' una previsione non e' una misura.
   Senza rete e senza strumenti il vento e' null, e i campi che ne
   dipendono mostrano «—»: meglio un trattino di un numero inventato.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  function leggi(k, d) {
    try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; }
    catch (e) { return d; }
  }
  var RAD = Math.PI / 180;
  function norm(a) { a = a % 360; return a < 0 ? a + 360 : a; }
  function pad3(v) { return ("00" + Math.round(norm(v)) % 360).slice(-3); }
  /* isFinite(null) e' true (null diventa 0): un fix assente passava per valido,
     e poi null.toFixed() spezzava la richiesta del vento a meta'. */
  function num(v) { return typeof v === "number" && isFinite(v); }
  function nm(a, b) {
    var dLa = (b.lat - a.lat) * RAD, dLo = (b.lon - a.lon) * RAD;
    var x = Math.pow(Math.sin(dLa / 2), 2) + Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.pow(Math.sin(dLo / 2), 2);
    return 2 * Math.asin(Math.min(1, Math.sqrt(x))) * 3440.065;
  }
  function rilev(a, b) {
    var y = Math.sin((b.lon - a.lon) * RAD) * Math.cos(b.lat * RAD);
    var x = Math.cos(a.lat * RAD) * Math.sin(b.lat * RAD) - Math.sin(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.cos((b.lon - a.lon) * RAD);
    return norm(Math.atan2(y, x) / RAD);
  }

  /* ─────────────── polare condivisa (raffyca-polar) ─────────────── */
  var POL = null, polTs = -1;
  function polare() {
    var p = leggi("raffyca-polar", null);
    var ts = p && p.ts || 0;
    if (ts !== polTs) { polTs = ts; POL = (p && p.twa && p.tws && p.data && p.twa.length && p.tws.length) ? p : null; }
    return POL;
  }
  function span(arr, x) {
    if (x <= arr[0]) return [0, 0];
    if (x >= arr[arr.length - 1]) return [arr.length - 1, 0];
    for (var i = 0; i < arr.length - 1; i++) if (x < arr[i + 1]) return [i, (x - arr[i]) / (arr[i + 1] - arr[i])];
    return [arr.length - 1, 0];
  }
  function obiettivo(twa, tws) {
    var p = polare(); if (!p || twa == null || tws == null) return null;
    var a = span(p.twa, Math.abs(twa)), s = span(p.tws, tws);
    function v(i, j) { var r = p.data[i] || []; var x = r[j]; return isFinite(x) ? x : 0; }
    var i1 = Math.min(a[0] + 1, p.twa.length - 1), j1 = Math.min(s[0] + 1, p.tws.length - 1);
    var top = v(a[0], s[0]) * (1 - s[1]) + v(a[0], j1) * s[1];
    var bot = v(i1, s[0]) * (1 - s[1]) + v(i1, j1) * s[1];
    return top * (1 - a[1]) + bot * a[1];
  }

  /* ─────────────── previsione del vento ─────────────── */
  var PREV = null, prevIn = false, prevTent = 0;
  function aggiornaPrevisione(pos) {
    if (!pos || prevIn || typeof fetch !== "function") return;
    var ora = Date.now();
    if (PREV && ora - PREV.scaricato < 600000 && nm(PREV, pos) < 5) return;
    if (ora - prevTent < 20000) return;          /* dopo un errore: nuovo tentativo dopo 20 s */
    if (!num(pos.lat) || !num(pos.lon)) return;
    var u = "https://api.open-meteo.com/v1/forecast?latitude=" + pos.lat.toFixed(3) + "&longitude=" + pos.lon.toFixed(3) +
            "&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m&wind_speed_unit=kn&timezone=auto";
    prevIn = true; prevTent = ora;   /* solo ora: prima di qui un errore lo lasciava acceso per sempre */
    fetch(u).then(function (r) { return r.json(); }).then(function (j) {
      var c = j && j.current;
      if (c && isFinite(c.wind_speed_10m) && isFinite(c.wind_direction_10m))
        PREV = { lat: pos.lat, lon: pos.lon, scaricato: Date.now(), tws: c.wind_speed_10m, twd: c.wind_direction_10m,
                 raff: c.wind_gusts_10m, ora: c.time || "" };
    }).catch(function () {}).then(function () { prevIn = false; });
  }

  function nmea() {
    try { return (window.rfNmea && window.rfNmea.dati) ? window.rfNmea.dati() : null; } catch (e) { return null; }
  }

  function vento(pos) {
    var dash = leggi("raffyca-dash", {}) || {};
    if (dash.wind === "manual" && dash.mw && num(+dash.mw.tws) && num(+dash.mw.twd) && dash.mw.tws !== null && dash.mw.twd !== null)
      return { tws: +dash.mw.tws, twd: +dash.mw.twd, da: "manuale" };
    var n = nmea();
    if (n && n.tws != null && n.twd != null) return { tws: n.tws, twd: n.twd, da: "strumenti", twdDa: n.twdDa };
    aggiornaPrevisione(pos);
    if (PREV) return { tws: PREV.tws, twd: PREV.twd, da: "previsione", raff: PREV.raff, ora: PREV.ora };
    return { tws: null, twd: null, da: null };
  }

  function waypoint() {
    var id = null; try { id = localStorage.getItem("raffyca-active-wp"); } catch (e) {}
    if (!id) return null;
    var l = leggi("raffyca-waypoints", []) || [];
    for (var i = 0; i < l.length; i++) if (l[i].id === id && num(l[i].lat) && num(l[i].lon)) return l[i];
    return null;
  }

  /* g = {lat, lon, sog, cog, ts}: il fix di chi chiama (ognuno ha il suo watch) */
  function calcola(g) {
    g = g || {};
    var pos = (num(g.lat) && num(g.lon)) ? { lat: g.lat, lon: g.lon } : null;
    var E = { sog: num(g.sog) ? g.sog : null, cog: num(g.cog) ? g.cog : null, ts: g.ts || null };
    var n = nmea();
    E.stw = n && n.stw != null ? n.stw : null;
    E.dep = n ? (n.dpt != null ? n.dpt : n.dbt) : null;
    E.tmp = n && n.mtw != null ? n.mtw : null;
    if (n && n.aws != null) { E.aws = n.aws; E.awa = n.awa; }
    var V = vento(pos);
    E.tws = V.tws; E.twd = V.twd; E.ventoDa = V.da; E.raff = V.raff != null ? V.raff : null;
    var spd = E.stw != null ? E.stw : E.sog;
    if (E.cog != null && E.twd != null) {
      var d = ((E.twd - E.cog + 540) % 360) - 180;       /* >0 dritta, <0 sinistra */
      E.twa = d;
      E.vmg = spd != null ? Math.abs(spd * Math.cos(d * RAD)) : null;
      if (E.aws == null && spd != null && E.tws != null) {
        var r = d * RAD;
        E.aws = Math.sqrt(E.tws * E.tws + spd * spd + 2 * E.tws * spd * Math.cos(r));
        E.awa = E.aws > 0.05 ? Math.atan2(E.tws * Math.sin(r), E.tws * Math.cos(r) + spd) / RAD : 0;
      }
      var o = obiettivo(d, E.tws);
      E.pol = (o && o > 0.3 && spd != null) ? Math.max(0, Math.min(150, 100 * spd / o)) : null;
    } else { E.twa = null; E.vmg = null; E.pol = null; }
    var wp = waypoint();
    E.wp = wp ? wp.name : null;
    if (wp && pos) {
      E.dtw = nm(pos, wp); E.brg = rilev(pos, wp);
      E.ttg = (E.sog != null && E.sog > 0.2) ? E.dtw / E.sog : null;
    } else { E.dtw = null; E.brg = null; E.ttg = null; }
    return E;
  }

  /* ─────────────── catalogo dei campi ─────────────── */
  function kmh() { var s = leggi("raffyca-settings", {}) || {}; return s.units === "kmh"; }
  function vel(v) { return v == null ? "—" : (kmh() ? v * 1.852 : v).toFixed(1); }
  function uVel() { return kmh() ? "km/h" : "kt"; }
  function hm(h) { if (h == null || !isFinite(h)) return "—"; var t = Math.round(h * 60); return Math.floor(t / 60) + ":" + ("0" + (t % 60)).slice(-2); }
  function clk(d) { return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }
  function lato(a) { return a == null ? "" : (a < 0 ? "sx" : "dx"); }
  function daVento(E) { return E.ventoDa === "previsione" ? "prev." : E.ventoDa === "manuale" ? "man." : E.ventoDa === "strumenti" ? "" : ""; }

  var CAMPI = [
    { id: "sog", nome: "SOG", unita: uVel, val: function (E) { return vel(E.sog); } },
    { id: "cog", nome: "COG", unita: "°", val: function (E) { return E.cog == null ? "—" : pad3(E.cog); } },
    { id: "stw", nome: "STW", unita: uVel, val: function (E) { return vel(E.stw); } },
    { id: "tws", nome: "Vento", unita: uVel, val: function (E) { return vel(E.tws); }, nota: daVento },
    { id: "twd", nome: "Da", unita: "°", val: function (E) { return E.twd == null ? "—" : pad3(E.twd); }, nota: daVento },
    { id: "twa", nome: "TWA", unita: "°", val: function (E) { return E.twa == null ? "—" : String(Math.round(Math.abs(E.twa))); },
      nota: function (E) { return lato(E.twa); } },
    { id: "aws", nome: "AWS", unita: uVel, val: function (E) { return vel(E.aws); } },
    { id: "awa", nome: "AWA", unita: "°", val: function (E) { return E.awa == null ? "—" : String(Math.round(Math.abs(E.awa))); },
      nota: function (E) { return lato(E.awa); } },
    { id: "vmg", nome: "VMG", unita: uVel, val: function (E) { return vel(E.vmg); } },
    { id: "pol", nome: "Polare", unita: "%", val: function (E) { return E.pol == null ? "—" : String(Math.round(E.pol)); } },
    { id: "dtw", nome: "WP", unita: function (E) { return (E && E.dtw != null && E.dtw < 0.5) ? "m" : "NM"; },
      val: function (E) { return E.dtw == null ? "—" : (E.dtw < 0.5 ? String(Math.round(E.dtw * 1852)) : E.dtw.toFixed(E.dtw < 10 ? 2 : 1)); } },
    { id: "brg", nome: "Rlv. WP", unita: "°", val: function (E) { return E.brg == null ? "—" : pad3(E.brg); } },
    { id: "ttg", nome: "Tempo WP", unita: "", val: function (E) { return hm(E.ttg); } },
    { id: "eta", nome: "ETA WP", unita: "", val: function (E) { return E.ttg == null ? "—" : clk(new Date(Date.now() + E.ttg * 3600000)); } },
    { id: "dep", nome: "Fondo", unita: "m", val: function (E) { return E.dep == null ? "—" : E.dep.toFixed(1); } },
    { id: "tmp", nome: "Acqua", unita: "°C", val: function (E) { return E.tmp == null ? "—" : E.tmp.toFixed(1); } },
    { id: "clk", nome: "Ora", unita: "", val: function () { return clk(new Date()); } }
  ];
  var PER_ID = {};
  for (var i = 0; i < CAMPI.length; i++) PER_ID[CAMPI[i].id] = CAMPI[i];

  window.rfStrumenti = {
    calcola: calcola,
    vento: vento,
    obiettivo: obiettivo,
    campi: CAMPI,
    campo: function (id) { return PER_ID[id] || null; },
    unita: function (c, E) { return typeof c.unita === "function" ? c.unita(E) : c.unita; },
    /* solo lettura, per capire da fuori perche' il vento previsto manca */
    _previsione: function () { return { prev: PREV, inCorso: prevIn, ultimoTentativo: prevTent }; }
  };
})();
