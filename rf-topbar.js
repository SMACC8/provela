/* ═══════════════════════════════════════════════════════════════════════
   ProVela · rf-topbar.js — barra trasversale condivisa
   ───────────────────────────────────────────────────────────────────────
   Caricato da OGNI modulo con una riga sola, subito dopo il markup della
   barra: un tag script con src "../rf-topbar.js" (moduli) oppure
   "./rf-topbar.js" (hub), con l'attributo defer.

   Il MARKUP resta inline in ogni pagina — in particolare il link alla home,
   che è l'unico modo per uscire da un modulo e non deve dipendere da nulla.
   Qui stanno CSS e logica: da ora un ritocco alla barra costa UN file.

   Contiene anche il REGISTRATORE GPX condiviso: prima i punti vivevano
   nella memoria del Cruscotto e lasciando la pagina si perdevano, mentre
   il contatore in barra restava congelato. Ora campiona qualunque schermata
   sia aperta, perché questo file è aperto in tutte.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ─────────────────────────── stile ─────────────────────────── */
  var CSS = '' +
'.rf-topbar{position:fixed;top:0;left:0;right:0;height:40px;z-index:9000;display:flex;align-items:center;gap:9px;' +
'  padding:0 10px;background:linear-gradient(#0c1c2e,#081521);border-bottom:1px solid #1a3248;' +
'  font-family:ui-monospace,"SF Mono","Roboto Mono",Menlo,Consolas,monospace;color:var(--sub,#5a7a94);font-size:11.5px;' +
'  letter-spacing:.02em;-webkit-user-select:none;user-select:none;box-shadow:0 2px 10px -6px rgba(0,0,0,.8);}' +
/* I token vengono ridefiniti sullo scope della barra: in Impostazioni e Percorso
   sono triplette HSL e var(--ink,#hex) risulterebbe invalido (barra sbiadita). */
'.rf-topbar{--ink:#deedf5;--sub:#5a7a94;--teal:#2BD9C4;--amber:#FFC24B;--coral:#FF6B6B;}' +
'html.day .rf-topbar{--ink:#0a1420;--sub:#3b4e60;--teal:#067d70;--amber:#8f5600;--coral:#c62020;}' +
'html.night .rf-topbar{--ink:#ff5b5b;--sub:#b04040;--teal:#ff4d4d;--amber:#ff7a45;--coral:#ff3b3b;}' +
'html.day .rf-topbar{background:linear-gradient(#ffffff,#e7ecf1);border-bottom-color:#a7b5c2;}' +
'html.night .rf-topbar{background:linear-gradient(#150404,#0e0303);border-bottom-color:#3a1010;}' +
'.rf-topbar a.rf-home{display:flex;align-items:center;justify-content:center;width:30px;height:30px;flex:none;' +
'  border-radius:8px;background:rgba(43,217,196,.1);border:1px solid rgba(43,217,196,.35);text-decoration:none;}' +
'html.night .rf-topbar a.rf-home{background:rgba(255,77,77,.12);border-color:rgba(255,77,77,.4);}' +
'.rf-topbar a.rf-home:active{transform:scale(.92);}' +
'.rf-topbar .rf-boat{display:flex;align-items:center;gap:5px;flex:none;color:var(--ink,#deedf5);font-weight:600;white-space:nowrap;}' +
'.rf-topbar .rf-boat svg{flex:none;}' +
'.rf-topbar .rf-gps{flex:none;display:flex;align-items:center;}' +
'.rf-topbar .rf-gps .gdot{width:8px;height:8px;border-radius:50%;background:#3c556b;display:block;}' +
'.rf-topbar .rf-gps.ok .gdot{background:#2BD9C4;box-shadow:0 0 6px rgba(43,217,196,.7);}' +
'.rf-topbar .rf-gps.old .gdot{background:#FFC24B;}' +
'.rf-topbar .rf-pol{flex:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:38%;}' +
'.rf-topbar .rf-pol.gen{color:var(--amber,#FFC24B);}' +
'.rf-topbar .rf-pol.int{color:var(--coral,#FF6B6B);}' +
'.rf-topbar .rf-spacer{flex:1;}' +
'.rf-topbar .rf-status{white-space:nowrap;overflow:hidden;max-width:44%;flex:none;color:var(--sub,#5a7a94);}' +
'.rf-topbar .rf-status.rec{color:var(--coral,#FF6B6B);}' +
'.rf-topbar .rf-status .dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:currentColor;' +
'  margin-right:5px;animation:rfblink 1.4s infinite;}' +
'@keyframes rfblink{0%,45%{opacity:1}50%,95%{opacity:.25}100%{opacity:1}}' +
'body{padding-top:40px!important;}' +

/* ── zona di stato: da etichetta muta a bottone ──────────────────────────
   Nessun tasto nuovo in barra: si preme quello che gia' mostra REC, WP o
   traccia. Il chevron resta anche a zona vuota, altrimenti nessuno
   scoprirebbe che li' sotto si apre qualcosa. */
'.rf-topbar .rf-status{display:flex;align-items:center;gap:6px;background:none;border:0;font:inherit;' +
'  cursor:pointer;padding:4px 2px 4px 6px;border-radius:7px;letter-spacing:.02em;}' +
'.rf-topbar .rf-status:active{background:hsl(172 70% 51% / .14);}' +
'.rf-topbar .rf-status .rf-txt{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:0 1 auto;}' +
/* Su schermi stretti il testo spingeva il chevron oltre il bordo del bottone,
   che con overflow:hidden lo tagliava via: su telefono il tasto sembrava
   non esserci (segnalato 22/08). Ora a restringersi e' il testo, non il chevron. */

'.rf-topbar .rf-status.rec .rf-txt{color:var(--coral,#FF6B6B);}' +
'.rf-topbar .rf-status.mob .rf-txt{color:#FF3B24;font-weight:700;}' +
'html.day .rf-topbar .rf-status.mob .rf-txt{color:#C41800;}' +
'.rf-topbar .rf-status .rf-chev{flex:0 0 auto;opacity:.75;transition:transform .2s;}' +
'.rf-topbar .rf-status.open .rf-chev{transform:rotate(180deg);}' +

/* ── pannello: tendina sotto la barra ── */
'.rf-scrim{position:fixed;inset:0;z-index:8990;background:rgba(2,8,14,.55);opacity:0;' +
'  pointer-events:none;transition:opacity .2s;}' +
'.rf-scrim.on{opacity:1;pointer-events:auto;}' +
'.rf-panel{position:fixed;top:40px;left:0;right:0;z-index:9010;max-height:calc(100vh - 52px);' +
'  max-height:calc(100dvh - 52px);overflow-y:auto;-webkit-overflow-scrolling:touch;' +
'  background:var(--panel,#0e2036);border:1px solid var(--line,#1a3248);border-top:0;' +
'  border-radius:0 0 16px 16px;box-shadow:0 12px 34px -10px rgba(0,0,0,.7);' +
'  transform:translateY(-115%);transition:transform .24s cubic-bezier(.32,.72,.3,1);' +
'  font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--ink,#deedf5);' +
'  max-width:560px;margin:0 auto;}' +
'.rf-panel.on{transform:translateY(0);}' +
'.rf-panel .rf-hd{display:flex;align-items:center;padding:12px 14px 10px;}' +
'.rf-panel .rf-hd b{flex:1;font-size:13.5px;font-weight:700;letter-spacing:.2px;}' +
'.rf-panel .rf-hd button{background:none;border:0;color:var(--sub,#5a7a94);font-size:19px;' +
'  cursor:pointer;padding:0 3px;line-height:1;}' +
'.rf-panel .rf-sez{padding:0 14px 14px;}' +
'.rf-panel .rf-sez+.rf-sez{border-top:1px solid var(--line,#1a3248);padding-top:13px;}' +
'.rf-panel .rf-lab{font-size:10px;letter-spacing:1px;text-transform:uppercase;' +
'  color:var(--sub,#5a7a94);margin-bottom:8px;}' +
'.rf-panel .rf-recbox{display:flex;align-items:center;gap:11px;}' +
'.rf-panel .rf-recbox .info{flex:1;min-width:0;}' +
'.rf-panel .rf-big{font-family:ui-monospace,monospace;font-size:19px;font-weight:600;' +
'  color:var(--coral,#FF6B6B);}' +
'.rf-panel .rf-sm{font-size:11.5px;color:var(--sub,#5a7a94);margin-top:1px;line-height:1.4;}' +
'.rf-panel .rf-btn{font:inherit;font-size:13.5px;font-weight:600;padding:10px 15px;border-radius:9px;' +
'  cursor:pointer;border:1px solid transparent;white-space:nowrap;}' +
'.rf-panel .rf-btn.go{background:var(--teal,#2BD9C4);color:var(--dp,#040c14);}' +
'html.day .rf-panel .rf-btn.go{color:#fff;}' +
'.rf-panel .rf-btn.stop{background:hsl(0 100% 71% / .14);color:var(--coral,#FF6B6B);' +
'  border-color:var(--coral,#FF6B6B);}' +
'.rf-panel .rf-btn.gh{background:var(--panel2,#0b1a2c);color:var(--ink,#deedf5);' +
'  border-color:var(--line,#1a3248);font-weight:400;width:100%;}' +
'.rf-panel .rf-att{display:flex;align-items:center;gap:10px;padding:10px 11px;border-radius:10px;' +
'  background:hsl(172 70% 51% / .10);border:1px solid hsl(172 70% 51% / .32);margin-bottom:10px;}' +
'.rf-panel .rf-att.trk{background:hsl(41 100% 65% / .10);border-color:hsl(41 100% 65% / .32);}' +
'.rf-panel .rf-att .ic{font-size:15px;flex:none;color:var(--teal,#2BD9C4);}' +
'.rf-panel .rf-att.trk .ic{color:var(--amber,#FFC24B);}' +
'.rf-panel .rf-att .nm{flex:1;min-width:0;}' +
'.rf-panel .rf-att .nm b{display:block;font-size:13.5px;font-weight:600;white-space:nowrap;' +
'  overflow:hidden;text-overflow:ellipsis;}' +
'.rf-panel .rf-att .nm span{font-size:11.5px;color:var(--sub,#5a7a94);font-family:ui-monospace,monospace;}' +
'.rf-panel .rf-att button{font:inherit;font-size:12px;padding:6px 11px;border-radius:7px;cursor:pointer;' +
'  background:none;border:1px solid var(--line,#1a3248);color:var(--sub,#5a7a94);flex:none;}' +
'.rf-panel .rf-ign{font-size:11.5px;color:var(--sub,#5a7a94);padding:7px 11px;border-radius:9px;' +
'  background:var(--panel2,#0b1a2c);border:1px dashed var(--line,#1a3248);margin-bottom:10px;line-height:1.4;}' +
'.rf-panel .rf-wplist{display:flex;flex-direction:column;gap:1px;border-radius:10px;overflow:hidden;' +
'  border:1px solid var(--line,#1a3248);}' +
'.rf-panel .rf-wp{display:flex;align-items:center;gap:10px;padding:9px 11px;' +
'  background:var(--panel2,#0b1a2c);border:0;font:inherit;color:var(--ink,#deedf5);text-align:left;' +
'  cursor:pointer;width:100%;}' +
'.rf-panel .rf-wp:active{background:hsl(172 70% 51% / .14);}' +
'.rf-panel .rf-wp .n{flex:1;min-width:0;font-size:13.5px;white-space:nowrap;overflow:hidden;' +
'  text-overflow:ellipsis;}' +
'.rf-panel .rf-wp.sel .n{color:var(--teal,#2BD9C4);font-weight:600;}' +
'.rf-panel .rf-wp .d{font-family:ui-monospace,monospace;font-size:12px;color:var(--teal,#2BD9C4);' +
'  flex:none;font-variant-numeric:tabular-nums;}' +
'.rf-panel .rf-wp .b{font-family:ui-monospace,monospace;font-size:11px;color:var(--sub,#5a7a94);' +
'  flex:none;min-width:34px;text-align:right;}' +
'.rf-panel .rf-nota{font-size:11px;color:var(--sub,#5a7a94);margin-top:9px;line-height:1.45;}' +
/* ── MOB: colore invariante nei tre temi, come dentro il modulo ── */
'.rf-panel .rf-mob{display:flex;align-items:center;gap:11px;width:100%;padding:13px 14px;' +
'  border-radius:11px;background:#D01A00;border:0;color:#fff;font:inherit;font-size:15px;' +
'  font-weight:700;letter-spacing:.03em;cursor:pointer;text-align:left;}' +
'.rf-panel .rf-mob:active{transform:scale(.985);}' +
'.rf-panel .rf-mob .sig{font-family:ui-monospace,monospace;font-size:17px;font-weight:700;flex:none;}' +
'.rf-panel .rf-mob .sub{display:block;font-size:11.5px;font-weight:400;opacity:.9;' +
'  letter-spacing:0;margin-top:2px;}' +
'.rf-panel .rf-mob.viva{background:#0B1116;border:1.5px solid #D01A00;color:#fff;}' +
'html.day .rf-panel .rf-mob.viva{background:#fff;color:#080D12;}' +
'.rf-panel .rf-mob.viva .sig{color:#D01A00;}' +
'.rf-panel .rf-piede{margin-top:10px;}' +
'.rf-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(10px);z-index:9100;' +
'  background:var(--panel2,#0b1a2c);border:1px solid var(--line,#1a3248);color:var(--ink,#deedf5);' +
'  border-radius:9px;padding:9px 14px;font-size:12.5px;opacity:0;transition:.2s;pointer-events:none;' +
'  max-width:88vw;font-family:system-ui,-apple-system,sans-serif;}' +
'.rf-toast.on{opacity:1;transform:translateX(-50%) translateY(0);}' +
'@media (prefers-reduced-motion:reduce){.rf-panel,.rf-scrim,.rf-status .rf-chev{transition:none;}}' +
/* In stampa la barra non c'entra nulla, e il padding-top che riserva lo spazio
   lascerebbe una fascia vuota in cima al foglio. Sta qui e non nei moduli
   perche' e' la barra a introdurre quel padding. */
'@media print{.rf-topbar,.rf-panel,.rf-scrim,.rf-toast{display:none!important;}body{padding-top:0!important;}}';

  function iniettaCss() {
    if (document.getElementById("rf-topbar-css")) return;
    var st = document.createElement("style");
    st.id = "rf-topbar-css";
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }
  iniettaCss();

  /* ─────────────────────── utilità comuni ─────────────────────── */
  function leggi(k, def) {
    try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? def : v; }
    catch (e) { return def; }
  }
  function scrivi(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(x) {
    return String(x).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ═══════════════════ registratore GPX condiviso ═══════════════════
     raffyca-rec = {on, since, iv, pts:[[lat,lon,t],…], name?}
     I punti stanno QUI, non nella memoria di una pagina: chi apre una
     qualsiasi schermata continua a campionare. Chiave retrocompatibile:
     una vecchia {on,pts:<numero>} viene riconosciuta e ripulita.
     ══════════════════════════════════════════════════════════════════ */
  var K_REC = "raffyca-rec", K_POS = "raffyca-pos";

  var REC = {
    stato: null,      // oggetto in memoria, riletto da localStorage
    watch: null,      // id di watchPosition
    timer: null,      // scrittura periodica
    lock: null,       // Wake Lock
    ultimo: 0
  };

  function statoRec() {
    var r = leggi(K_REC, null);
    if (!r || !r.on) return null;
    if (!Array.isArray(r.pts)) r.pts = [];      // formato vecchio: contatore numerico
    return r;
  }
  function intervallo() {
    var s = leggi("raffyca-settings", {}) || {};
    var v = parseInt(s.trackInterval, 10);
    if (!isFinite(v) || v < 1) v = 5;
    return Math.min(v, 120);
  }

  function campiona(lat, lon, t) {
    var r = statoRec(); if (!r) return;
    var iv = (r.iv || intervallo()) * 1000;
    if (t - REC.ultimo < iv - 250) return;      // tolleranza: il GPS non è puntuale
    REC.ultimo = t;
    var u = r.pts[r.pts.length - 1];
    if (u && Math.abs(u[0] - lat) < 1e-7 && Math.abs(u[1] - lon) < 1e-7 && t - u[2] < iv * 3) return;
    r.pts.push([+lat.toFixed(6), +lon.toFixed(6), t]);
    scrivi(K_REC, r);
    dipingi();
  }

  function onPos(p) {
    var lat = p.coords.latitude, lon = p.coords.longitude, t = Date.now();
    scrivi(K_POS, { lat: lat, lon: lon, ts: t,
      sog: (p.coords.speed != null && isFinite(p.coords.speed)) ? p.coords.speed * 1.94384 : undefined,
      cog: (p.coords.heading != null && isFinite(p.coords.heading)) ? p.coords.heading : undefined });
    campiona(lat, lon, t);
  }

  function wakeLock(on) {
    try {
      if (on && !REC.lock && navigator.wakeLock && document.visibilityState === "visible") {
        navigator.wakeLock.request("screen").then(function (l) {
          REC.lock = l;
          l.addEventListener("release", function () { REC.lock = null; });
        }).catch(function () {});
      } else if (!on && REC.lock) { REC.lock.release().catch(function () {}); REC.lock = null; }
    } catch (e) {}
  }

  function sincronizza() {
    var r = statoRec();
    if (r && REC.watch == null && navigator.geolocation) {
      REC.ultimo = 0;
      REC.watch = navigator.geolocation.watchPosition(onPos, function () {},
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 30000 });
      wakeLock(true);
    } else if (!r && REC.watch != null) {
      navigator.geolocation.clearWatch(REC.watch);
      REC.watch = null;
      wakeLock(false);
    }
    dipingi();
  }

  /* API pubblica: i moduli avviano e fermano da qui, non gestiscono i punti. */
  window.rfRec = {
    attiva: function () { return !!statoRec(); },
    stato: statoRec,
    avvia: function (nome) {
      var iv = intervallo();
      scrivi(K_REC, { on: true, since: Date.now(), iv: iv, pts: [], name: nome || "" });
      sincronizza();
      return iv;
    },
    /* Chiude la registrazione e restituisce la traccia salvata, o null se
       troppo corta. Il salvataggio su raffyca-tracks lo fa qui, così è
       identico da qualunque modulo la si fermi. */
    ferma: function (nome) {
      var r = statoRec();
      try { localStorage.removeItem(K_REC); } catch (e) {}
      sincronizza();
      if (!r || r.pts.length < 2) return null;
      var pts = r.pts, dist = 0;
      for (var i = 1; i < pts.length; i++) dist += hav(pts[i - 1], pts[i]);
      var d = new Date();
      var def = "Traccia " + d.toLocaleDateString("it", { day: "2-digit", month: "2-digit" }) +
                " " + d.toLocaleTimeString("it", { hour: "2-digit", minute: "2-digit" });
      var t = leggi("raffyca-tracks", []) || [];
      var trk = { id: "t" + Date.now(), name: (nome || r.name || def).trim() || def,
                  ts: Date.now(), dist: dist, dur: pts[pts.length - 1][2] - pts[0][2],
                  pts: pts.map(function (p) { return [p[0], p[1]]; }) };
      t.push(trk); scrivi("raffyca-tracks", t);
      return trk;
    },
    /* punti della registrazione in corso, per chi vuole disegnarli (Carta) */
    punti: function () { var r = statoRec(); return r ? r.pts : []; },
    durata: function () { var r = statoRec(); return r ? Date.now() - r.since : 0; }
  };
  function hav(a, b) {
    var R = 3440.065, r = Math.PI / 180;
    var dLat = (b[0] - a[0]) * r, dLon = (b[1] - a[1]) * r;
    var s = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
  }

  /* ────────────────────── disegno della barra ────────────────────── */
  var elBoat, elGps, elPol, elSt;

  var elTxt, elPanel, elScrim, elToast;

  /* Il markup inline nei moduli ha uno <span id="rfStatus">. Qui lo promuovo
     a <button> con testo + chevron: la struttura della barra si evolve da un
     file solo, senza riaprire i 14 moduli. */
  function aggancia() {
    elBoat = document.getElementById("rfBoat");
    elGps  = document.getElementById("rfGps");
    elPol  = document.getElementById("rfPol");
    var vecchio = document.getElementById("rfStatus");
    if (!elBoat || !vecchio) return false;
    if (vecchio.tagName === "BUTTON") { elSt = vecchio; elTxt = elSt.querySelector(".rf-txt"); return true; }
    var b = document.createElement("button");
    b.id = "rfStatus"; b.className = "rf-status"; b.type = "button";
    b.setAttribute("aria-haspopup", "dialog");
    b.setAttribute("aria-expanded", "false");
    b.setAttribute("aria-label", "Stato di bordo");
    b.innerHTML = '<span class="rf-txt"></span>' +
      '<svg class="rf-chev" viewBox="0 0 12 12" width="11" height="11" aria-hidden="true">' +
      '<path d="M2.5 4.5 L6 8 L9.5 4.5" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round"/></svg>';
    vecchio.parentNode.replaceChild(b, vecchio);
    elSt = b; elTxt = b.querySelector(".rf-txt");
    b.addEventListener("click", function (e) { e.stopPropagation(); togglePanel(); });
    return true;
  }

  /* Niente icona accanto al nome barca: il logo e' gia' nel tasto home
     due caselle piu' a sinistra, ripeterlo e' rumore (tolto 22/08). */
  function dipBoat() {
    if (!elBoat) return;
    var p = leggi("raffyca-profile", {}) || {};
    elBoat.textContent = p.boat || "";
  }
  function dipGps() {
    if (!elGps) return;
    var p = leggi("raffyca-pos", null);
    var cls = "rf-gps", ttl = "Nessuna posizione";
    if (p && isFinite(p.lat)) {
      if (p.ts && Date.now() - p.ts < 25000) { cls += " ok"; ttl = "GPS attivo"; }
      else { cls += " old"; ttl = "Posizione non recente"; }
    }
    elGps.className = cls; elGps.title = ttl;
  }
  function dipPol() {
    if (!elPol) return;
    var p = leggi("raffyca-polar", null), pr = leggi("raffyca-profile", {}) || {};
    if (!p || !p.data) { elPol.textContent = ""; elPol.className = "rf-pol"; return; }
    var m = p.meta || {};
    var nome = m.boat || pr.model || "";
    var tipo = m.source || m.kind || "";
    var cls = "rf-pol";
    if (/gener/i.test(tipo)) cls += " gen";
    else if (/interp|integr/i.test(tipo)) cls += " int";
    elPol.className = cls;
    elPol.textContent = (nome ? esc(nome) + " · " : "") + "pol" + (tipo ? " " + esc(tipo) : "");
    elPol.title = nome ? ("Polare: " + nome) : "Polare caricata";
  }
  function dipStato() {
    if (!elSt) return;
    /* L'emergenza scavalca tutto il resto: se e' viva, la zona di stato
       mostra MOB e il tempo trascorso, da qualunque modulo. */
    var mb = statoMob();
    if (mb) {
      elSt.className = "rf-status rec mob" + (aperto ? " open" : "");
      elTxt.innerHTML = '<span class="dot"></span>MOB \u00b7 ' + durataBreve(Date.now() - mb.ts);
      return;
    }
    var r = statoRec();
    if (r) {
      var s = Math.round((Date.now() - r.since) / 1000);
      elSt.className = "rf-status rec" + (aperto ? " open" : "");
      elTxt.innerHTML = '<span class="dot"></span>REC · ' +
        Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2) + " · " + r.pts.length + " pt";
      return;
    }
    elSt.className = "rf-status" + (aperto ? " open" : "");
    var at = localStorage.getItem("raffyca-active-track");
    if (at) {
      var tr = (leggi("raffyca-tracks", []) || []).filter(function (x) { return x.id === at; })[0];
      if (tr) { elTxt.textContent = "traccia · " + tr.name; return; }
    }
    var aw = localStorage.getItem("raffyca-active-wp");
    if (aw) {
      var w = (leggi("raffyca-waypoints", []) || []).filter(function (x) { return x.id === aw; })[0];
      if (w) { elTxt.textContent = "WP · " + w.name; return; }
    }
    elTxt.textContent = "";
  }
  function dipingi() { dipBoat(); dipGps(); dipPol(); dipStato(); if (aperto) dipPanel(); }

  /* ═══════════════════ pannello "Stato di bordo" ═══════════════════
     Aperto dalla zona di stato. Fa due cose e basta: avvia/ferma la
     registrazione, e sceglie il waypoint o toglie cio' che e' attivo —
     le tre cose che prima costringevano a tornare in un modulo preciso.
     NON gestisce i waypoint: per crearli e modificarli si va nella Carta,
     altrimenti fra sei mesi ci sono due gestori che si contraddicono.
     ═══════════════════════════════════════════════════════════════════ */
  var aperto = false;

  function toast(msg) {
    if (!elToast) {
      elToast = document.createElement("div");
      elToast.className = "rf-toast";
      elToast.setAttribute("role", "status");
      document.body.appendChild(elToast);
    }
    elToast.textContent = msg;
    elToast.classList.add("on");
    clearTimeout(elToast._t);
    elToast._t = setTimeout(function () { elToast.classList.remove("on"); }, 2400);
  }

  /* distanza e rilevamento dalla posizione corrente */
  function brg(a, b) {
    var r = Math.PI / 180;
    var y = Math.sin((b[1] - a[1]) * r) * Math.cos(b[0] * r);
    var x = Math.cos(a[0] * r) * Math.sin(b[0] * r) -
            Math.sin(a[0] * r) * Math.cos(b[0] * r) * Math.cos((b[1] - a[1]) * r);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }
  function p3(v) { v = Math.round(v) % 360; if (v < 0) v += 360; return ("00" + v).slice(-3); }

  function statoMob() {
    var m = leggi("raffyca-mob", null);
    return (m && m.on && isFinite(m.lat)) ? m : null;
  }
  function durataBreve(ms) {
    var s = Math.max(0, Math.round(ms / 1000));
    if (s < 60) return s + " s";
    var m = Math.floor(s / 60);
    return m < 60 ? (m + " min") : (Math.floor(m / 60) + " h " + (m % 60) + " min");
  }
  function urlMob() {
    var a = document.querySelector(".rf-topbar a.rf-home");
    var base = a ? a.getAttribute("href") : "../";
    if (base === "#" || !base) base = "./";
    return base + "mob/";
  }
  /* Segna il punto con l'ultima posizione nota e lo salva subito fra i
     waypoint: se il telefono si riavvia, il punto resta comunque. Senza
     nessun fix disponibile non si inventa niente, si apre il modulo e
     tocchera' a lui acquisire. */
  function segnaMob() {
    var pos = leggi(K_POS, null), ora = Date.now();
    if (!pos || !isFinite(pos.lat)) { location.href = urlMob(); return; }
    var wps = leggi("raffyca-waypoints", []) || [];
    var d = new Date(ora);
    var nome = "MOB " + ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2) +
               " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
    var id = "w" + ora + Math.random().toString(36).slice(2, 5);
    wps.push({ id: id, name: nome, lat: +pos.lat.toFixed(6), lon: +pos.lon.toFixed(6),
               ts: ora, tag: "#FF6B6B", note: "Punto uomo in mare", icon: null, folder: null });
    scrivi("raffyca-waypoints", wps);
    scrivi("raffyca-mob", { on: true, lat: pos.lat, lon: pos.lon, ts: ora,
                            fixTs: pos.ts || ora, wpId: id });
    location.href = urlMob();
  }

  function creaPanel() {
    if (elPanel) return;
    elScrim = document.createElement("div");
    elScrim.className = "rf-scrim";
    elScrim.addEventListener("click", chiudiPanel);
    elPanel = document.createElement("div");
    elPanel.className = "rf-panel";
    elPanel.setAttribute("role", "dialog");
    elPanel.setAttribute("aria-label", "Stato di bordo");
    elPanel.innerHTML =
      '<div class="rf-hd"><b>Stato di bordo</b>' +
      '<button type="button" aria-label="Chiudi">\u00d7</button></div>' +
      '<div class="rf-sez" id="rfSezMob"></div>' +
      '<div class="rf-sez" id="rfSezRec"></div>' +
      '<div class="rf-sez" id="rfSezNav"></div>';
    elPanel.querySelector(".rf-hd button").addEventListener("click", chiudiPanel);
    elPanel.addEventListener("click", onPanelClick);
    document.body.appendChild(elScrim);
    document.body.appendChild(elPanel);
  }

  function togglePanel() { aperto ? chiudiPanel() : apriPanel(); }
  function apriPanel() {
    creaPanel(); dipPanel();
    aperto = true;
    elPanel.classList.add("on"); elScrim.classList.add("on");
    elSt.classList.add("open"); elSt.setAttribute("aria-expanded", "true");
  }
  function chiudiPanel() {
    aperto = false;
    if (elPanel) { elPanel.classList.remove("on"); elScrim.classList.remove("on"); }
    if (elSt) { elSt.classList.remove("open"); elSt.setAttribute("aria-expanded", "false"); }
  }

  function dipPanel() {
    if (!elPanel) return;
    var r = statoRec();

    /* ── uomo in mare ──
       Sta in cima al pannello perche' e' l'unica cosa qui dentro che non
       puo' aspettare. Il punto viene scritto QUI, al tocco, e solo dopo
       si naviga: aspettare il caricamento della pagina costerebbe secondi,
       e a sei nodi un secondo vale tre metri. */
    var mb = statoMob();
    var hm;
    if (mb) {
      hm = '<button type="button" class="rf-mob viva" data-act="mobapri">' +
           '<span class="sig">\u2691</span><span>Emergenza in corso' +
           '<span class="sub">segnata da ' + durataBreve(Date.now() - mb.ts) +
           ' \u00b7 tocca per tornare alla schermata</span></span></button>';
    } else {
      hm = '<button type="button" class="rf-mob" data-act="mob">' +
           '<span class="sig">MOB</span><span>Uomo in mare' +
           '<span class="sub">segna il punto adesso \u00b7 dieci secondi per annullare</span>' +
           '</span></button>';
    }
    document.getElementById("rfSezMob").innerHTML = hm;

    /* ── registrazione ── */
    var h = '<div class="rf-lab">Registrazione traccia</div><div class="rf-recbox"><div class="info">';
    if (r) {
      var sec = Math.round((Date.now() - r.since) / 1000), d = 0;
      for (var i = 1; i < r.pts.length; i++) d += hav(r.pts[i - 1], r.pts[i]);
      h += '<div class="rf-big">' + Math.floor(sec / 60) + ":" + ("0" + (sec % 60)).slice(-2) +
           " \u00b7 " + r.pts.length + ' punti</div>' +
           '<div class="rf-sm">1 punto ogni ' + (r.iv || intervallo()) + " s \u00b7 " +
           d.toFixed(1) + ' NM percorse</div></div>' +
           '<button type="button" class="rf-btn stop" data-act="stop">Ferma e salva</button></div>';
    } else {
      h += '<div class="rf-sm">Registra la rotta come traccia GPX.<br>' +
           'Continua mentre usi gli altri moduli.</div></div>' +
           '<button type="button" class="rf-btn go" data-act="start">Avvia</button></div>';
    }
    document.getElementById("rfSezRec").innerHTML = h;

    /* ── navigazione ── */
    var pos = leggi(K_POS, null);
    var here = (pos && isFinite(pos.lat)) ? [pos.lat, pos.lon] : null;
    var wps = leggi("raffyca-waypoints", []) || [];
    var awp = localStorage.getItem("raffyca-active-wp");
    var atk = localStorage.getItem("raffyca-active-track");
    var trk = atk ? (leggi("raffyca-tracks", []) || []).filter(function (x) { return x.id === atk; })[0] : null;

    var n = '<div class="rf-lab">Navigazione</div>';
    if (trk) {
      n += '<div class="rf-att trk"><span class="ic">\u301c</span><div class="nm">' +
           '<b>' + esc(trk.name) + '</b><span>traccia' +
           (trk.dist ? " \u00b7 " + trk.dist.toFixed(1) + " NM" : "") + '</span></div>' +
           '<button type="button" data-act="offtrk">togli</button></div>' +
           '<div class="rf-ign">Il waypoint \u00e8 ignorato mentre segui una traccia. ' +
           'Togli la traccia per tornare a navigare sul waypoint.</div>';
    } else if (awp) {
      var w = wps.filter(function (x) { return x.id === awp; })[0];
      if (w) {
        var sub = here ? (hav(here, [w.lat, w.lon]).toFixed(1) + " NM \u00b7 " +
                          p3(brg(here, [w.lat, w.lon])) + "\u00b0")
                       : (w.lat.toFixed(4) + ", " + w.lon.toFixed(4));
        n += '<div class="rf-att"><span class="ic">\u25c8</span><div class="nm">' +
             '<b>' + esc(w.name) + '</b><span>' + sub + '</span></div>' +
             '<button type="button" data-act="offwp">togli</button></div>';
      }
    }

    if (!wps.length) {
      n += '<div class="rf-sm">Nessun waypoint salvato. Creane uno nella Carta Nautica.</div>';
    } else {
      var lista = wps.map(function (w) {
        return { w: w, d: here ? hav(here, [w.lat, w.lon]) : null,
                 b: here ? brg(here, [w.lat, w.lon]) : null };
      });
      if (here) lista.sort(function (a, b2) { return a.d - b2.d; });
      else lista.sort(function (a, b2) { return String(a.w.name).localeCompare(String(b2.w.name)); });
      var mostra = lista.slice(0, 7);
      n += '<div class="rf-wplist">';
      mostra.forEach(function (x) {
        n += '<button type="button" class="rf-wp' + (x.w.id === awp ? " sel" : "") +
             '" data-wp="' + esc(x.w.id) + '"><span class="n">' + esc(x.w.name) + '</span>' +
             (x.d != null ? '<span class="d">' + x.d.toFixed(1) + ' NM</span>' +
                            '<span class="b">' + p3(x.b) + '\u00b0</span>' : "") + '</button>';
      });
      n += '</div>';
      if (lista.length > mostra.length)
        n += '<div class="rf-nota">Altri ' + (lista.length - mostra.length) +
             ' waypoint nella Carta.</div>';
    }
    n += '<div class="rf-piede"><button type="button" class="rf-btn gh" data-act="carta">' +
         'Apri nella Carta</button></div>';
    n += '<div class="rf-nota">' + (here ? "I pi\u00f9 vicini per primi. " : "") +
         'Qui si sceglie soltanto: per crearli o modificarli si va nella Carta.</div>';
    document.getElementById("rfSezNav").innerHTML = n;
  }

  /* percorso della Carta ricavato dal link home, che e' gia' giusto per ogni modulo */
  function urlCarta() {
    var a = document.querySelector(".rf-topbar a.rf-home");
    var base = a ? a.getAttribute("href") : "../";
    if (base === "#" || !base) base = "./";
    return base + "carta/";
  }

  function onPanelClick(e) {
    var b = e.target.closest("[data-act]");
    if (b) {
      var k = b.getAttribute("data-act");
      if (k === "start") {
        var iv = window.rfRec.avvia();
        dipingi();
        toast("Registrazione avviata \u00b7 1 punto ogni " + iv + " s");
      } else if (k === "stop") {
        var n = window.rfRec.punti().length;
        if (n < 2) { window.rfRec.ferma(); dipingi(); toast("Traccia troppo corta, scartata"); return; }
        var d = new Date();
        var def = "Traccia " + d.toLocaleDateString("it", { day: "2-digit", month: "2-digit" }) +
                  " " + d.toLocaleTimeString("it", { hour: "2-digit", minute: "2-digit" });
        var nome = (prompt("Nome traccia:", def) || def).trim();
        var t = window.rfRec.ferma(nome);
        dipingi(); chiudiPanel();
        toast(t ? ("Traccia salvata \u00b7 " + t.pts.length + " punti") : "Traccia scartata");
      } else if (k === "offwp") {
        try { localStorage.removeItem("raffyca-active-wp"); } catch (err) {}
        dipingi(); toast("Waypoint disattivato");
      } else if (k === "offtrk") {
        try { localStorage.removeItem("raffyca-active-track"); } catch (err) {}
        dipingi(); toast("Traccia disattivata");
      } else if (k === "carta") {
        location.href = urlCarta();
      } else if (k === "mob") {
        segnaMob();
      } else if (k === "mobapri") {
        location.href = urlMob();
      }
      return;
    }
    var w = e.target.closest("[data-wp]");
    if (w) {
      var id = w.getAttribute("data-wp");
      try {
        localStorage.setItem("raffyca-active-wp", id);
        localStorage.removeItem("raffyca-active-track");   /* la traccia scavalcherebbe il WP */
      } catch (err) {}
      var wp = (leggi("raffyca-waypoints", []) || []).filter(function (x) { return x.id === id; })[0];
      dipingi(); chiudiPanel();
      toast(wp ? ("Navighi verso " + wp.name) : "Waypoint attivato");
    }
  }

  /* ──────────────────────────── avvio ──────────────────────────── */
  function avvia() {
    if (!aggancia()) return;      // pagina senza barra: resta solo il registratore
    dipingi();
    setInterval(dipingi, 1000);
    window.addEventListener("storage", function (e) {
      if (!e.key || e.key.indexOf("raffyca-") === 0) { dipingi(); sincronizza(); }
    });
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") { sincronizza(); dipingi(); }
      else wakeLock(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && aperto) chiudiPanel();
    });
    sincronizza();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", avvia);
  else avvia();
})();
