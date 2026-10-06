/* ═══════════════════════════════════════════════════════════════════════
   Dritta · rf-coord.js — come si scrivono le coordinate (06/10/2026)
   ───────────────────────────────────────────────────────────────────────
   Richiesta di Sergio: la scelta del formato in Impostazioni. Prima ogni
   modulo aveva la sua funzione, ognuna diversa: virgola o punto, primi con
   2 o 3 decimali, ' o ′, la longitudine con o senza lo zero davanti, e il
   Cruscotto in gradi decimali con la scritta «gradi decimali».

   Il formato sta in raffyca-settings.coordFmt:
     "dd"  gradi decimali          45,6300° N   013,7500° E
     "ddm" gradi e primi (pred.)   45°37,800′ N 013°45,000′ E
     "dms" gradi, primi, secondi   45°37′48,0″ N 013°45′00,0″ E
   La longitudine ha sempre tre cifre di gradi, come sulle carte nautiche.

   Restano fuori di proposito: il messaggio MOB/VHF (sempre gradi e primi:
   e' quello che si legge alla radio), il convertitore del Prontuario (mostra
   tutti e tre), la pagina pubblica di chi segue (non ha le Impostazioni), e
   i campi dove le coordinate si scrivono.

   ES5, nessuna dipendenza, nessun DOM. Si carica SENZA defer: chi lo usa
   lo trova gia' pronto alla prima pittura.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var NOMI = { dd: "gradi decimali", ddm: "gradi e primi", dms: "gradi, primi e secondi" };

  function formato() {
    try {
      var s = JSON.parse(localStorage.getItem("raffyca-settings") || "{}") || {};
      return NOMI[s.coordFmt] ? s.coordFmt : "ddm";
    } catch (e) { return "ddm"; }
  }
  function virgola(x) { return String(x).replace(".", ","); }
  function pad(n, w) { n = String(n); while (n.length < w) n = "0" + n; return n; }

  /* un valore: lat=true per la latitudine */
  function uno(v, lat, f) {
    if (v == null || !isFinite(v)) return "—";
    f = f || formato();
    var h = lat ? (v >= 0 ? "N" : "S") : (v >= 0 ? "E" : "W"), a = Math.abs(v), w = lat ? 2 : 3;
    if (f === "dd") {
      var s = a.toFixed(4).split(".");
      return pad(s[0], w) + "," + s[1] + "° " + h;
    }
    var d = Math.floor(a), m = (a - d) * 60;
    if (f === "dms") {
      var mi = Math.floor(m), se = (m - mi) * 60;
      if (+se.toFixed(1) >= 60) { se = 0; mi++; }
      if (mi >= 60) { mi = 0; d++; }
      return pad(d, w) + "°" + pad(mi, 2) + "′" + pad(virgola(se.toFixed(1)), 4) + "″ " + h;
    }
    if (+m.toFixed(3) >= 60) { m = 0; d++; }
    return pad(d, w) + "°" + pad(virgola(m.toFixed(3)), 6) + "′ " + h;
  }
  function ll(lat, lon, sep) { var f = formato(); return uno(lat, true, f) + (sep == null ? "  " : sep) + uno(lon, false, f); }

  window.rfCoord = { formato: formato, nome: function () { return NOMI[formato()]; }, uno: uno, ll: ll, NOMI: NOMI };
})();
