/* ═══════════════════════════════════════════════════════════════════════
   Dritta · rf-veglia.js — la veglia d'ancora a schermo spento
   ───────────────────────────────────────────────────────────────────────
   Il ponte fra anchor/ e il servizio Android che tiene il GPS acceso quando
   la pagina non puo' (plugin "Veglia", VegliaService.java).

   NEL BROWSER NON FA NIENTE. Tutti i metodi controllano che il plugin
   esista e altrimenti tornano senza effetto: la pagina resta com'era, con
   l'allarme dichiaratamente valido solo a schermo acceso.

   NELL'APP la pagina resta padrona del modello — cala, salpa, stima il
   centro, fissa il raggio — e qui si passano al servizio queste tre cose.
   Il suono lo fa sempre il servizio. Finche' la pagina batte (presente(),
   ogni secondo) e' lei a dire se suonare, col suo modello completo; quando
   smette — schermo spento, app dietro, altra pagina di Dritta — decide il
   servizio con le sue due regole (fuori raggio, GPS fermo).
   Al rientro, recupera() restituisce i fix raccolti nel frattempo, cosi' il
   fit del cerchio di borneggio non ha un buco lungo quanto il sonno.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  function P() {
    return (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Veglia) || null;
  }

  /* L'ultimo centro mandato: la pagina chiama aggiorna() a ogni giro di
     interfaccia (una volta al secondo), e non serve disturbare il servizio
     se il centro si e' mosso di meno di un metro e il raggio e' lo stesso. */
  var ultimo = null;
  function metri(a, b) {
    var k = Math.PI / 180, y = (b.lat - a.lat) * 110540,
        x = (b.lon - a.lon) * Math.cos(a.lat * k) * 111320;
    return Math.sqrt(x * x + y * y);
  }
  function uguale(a, b) {
    return a && b && a.raggio === b.raggio && metri(a, b) < 1;
  }
  function avvisa(msg) {
    try { console.warn("[veglia] " + msg); } catch (e) {}
  }

  window.rfVeglia = {
    /* true solo dentro l'APK */
    disponibile: function () { return !!P(); },

    avvia: function (lat, lon, raggio) {
      var p = P(); if (!p || !isFinite(lat) || !isFinite(lon)) return Promise.resolve(null);
      ultimo = { lat: lat, lon: lon, raggio: raggio };
      return p.avvia({ lat: lat, lon: lon, raggio: raggio })
        .catch(function (e) { avvisa((e && e.message) || e); return null; });
    },

    aggiorna: function (lat, lon, raggio) {
      var p = P(); if (!p || !ultimo || !isFinite(lat) || !isFinite(lon)) return;
      var nuovo = { lat: lat, lon: lon, raggio: raggio };
      if (uguale(ultimo, nuovo)) return;
      ultimo = nuovo;
      p.aggiorna(nuovo).catch(function (e) { avvisa((e && e.message) || e); });
    },

    /* Il battito: "la pagina anchor/ sta guardando, e l'allarme e' si'/no".
       Nell'app il suono lo fa sempre il servizio, sullo stream sveglia: la
       pagina non suona, dice soltanto se suonare. Va chiamato ogni secondo;
       se si ferma per piu' di tre, decide il servizio con le sue regole. */
    presente: function (allarme) {
      var p = P(); if (p) p.presente({ allarme: !!allarme }).catch(function () {});
    },

    tacita: function () { var p = P(); if (p) p.tacita().catch(function () {}); },

    ferma: function () {
      var p = P(); ultimo = null;
      if (p) p.ferma().catch(function () {});
    },

    stato: function () {
      var p = P(); return p ? p.stato().catch(function () { return null; }) : Promise.resolve(null);
    },

    /* Consegna, dal piu' vecchio, i fix raccolti dal servizio. Il servizio
       li toglie dalla sua coda: ognuno arriva una volta sola. */
    recupera: function (ciascuno, allaFine) {
      var p = P();
      if (!p) { if (allaFine) allaFine(0); return; }
      p.leggi().then(function (r) {
        var fix = (r && r.fix) || [];
        fix.forEach(function (f) { try { ciascuno(f); } catch (e) {} });
        if (allaFine) allaFine(fix.length);
      }).catch(function () { if (allaFine) allaFine(0); });
    }
  };
})();
