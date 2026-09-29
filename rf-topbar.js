/* ═══════════════════════════════════════════════════════════════════════
   Dritta · rf-topbar.js — barra trasversale condivisa
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

  /* ───────────────── preferenza GPS, condivisa da tutta la suite ─────────────

     Sta qui perche' questo file e' l'unico caricato da OGNI modulo: cosi' la
     preferenza si legge ovunque senza aggiungere un file e senza toccare
     cinque service worker.

     COSA SI PUO' SCEGLIERE DAVVERO. Una pagina web non puo' dire al telefono
     «usa il servizio di Google» o «usa il chip»: l'unica leva che l'API di
     geolocalizzazione espone e' `enableHighAccuracy`, e il resto lo decide il
     sistema operativo.

       true  -> il sistema accende il ricevitore GNSS. Qualche secondo per il
                primo aggancio, metri di errore, batteria che si sente.
       false -> il sistema puo' rispondere dalla sua stima di rete (celle e
                wi-fi noti). Su Android quella stima la fornisce Google, su
                iPhone Apple: e' questo che in Impostazioni si chiama
                «servizio del sistema». Immediata, decine o centinaia di
                metri di errore, quasi zero batteria. Al largo, dove di celle
                e wi-fi non ce ne sono, non risponde affatto.

     Il default e' il GPS diretto: e' quello che serve in barca, ed e' il
     comportamento che la suite ha sempre avuto.

     Due moduli NON la leggono di proposito — anchor/ e mob/. La veglia
     d'ancora deve accorgersi di un'arata di dieci metri e l'uomo a mare va
     cercato al metro: una posizione di rete li renderebbe inutili senza
     dirlo. Se in futuro qualcuno li ricollega a questa preferenza, sappia
     che e' una scelta tolta, non una dimenticanza. */
  var K_GPS = "raffyca-gps";
  function gpsAlta() {
    try {
      var c = JSON.parse(localStorage.getItem(K_GPS) || "null");
      return !c || c.alta !== false;          /* assente = GPS diretto */
    } catch (e) { return true; }
  }
  /* Si chiama rfGeo e non rfGps di proposito: nel markup della barra c'e'
     gia' <span id="rfGps">, e un id nel DOM diventa una variabile globale
     omonima. Con quel nome `window.rfGps` era lo SPAN finche' la barra (che
     e' defer) non veniva eseguita, quindi il controllo di ripiego passava e
     poi esplodeva su .opzioni: errore a tempo di esecuzione, in una riga che
     a rileggerla sembra corretta. */
  window.rfGeo = {
    alta: gpsAlta,
    imposta: function (v) {
      try { localStorage.setItem(K_GPS, JSON.stringify({ alta: !!v })); } catch (e) {}
    },
    /* Prende le opzioni del chiamante e ci mette dentro la sola
       enableHighAccuracy: maximumAge e timeout restano di chi chiama, che sa
       se sta disegnando una rotta o tenendo una veglia. */
    opzioni: function (base) {
      var o = {}, k;
      if (base) for (k in base) if (Object.prototype.hasOwnProperty.call(base, k)) o[k] = base[k];
      o.enableHighAccuracy = gpsAlta();
      return o;
    }
  };

  /* ─────────────────────────── stile ─────────────────────────── */
  /* ── LA BARRA DEVE STARE SOTTO LA BARRA DI STATO ───────────────────────
     Nel browser la pagina comincia dove finisce la barra di stato del
     telefono, e una barra fissa a `top:0` si vede tutta. Dentro l'APK no:
     da Android 15 la WebView e' a tutto schermo e la barra di stato ci sta
     SOPRA. Risultato visto sull'emulatore il 22/09/2026: orologio e icone
     di sistema stampati addosso al tasto home, che diventa intoccabile —
     ed e' il «manca l'icona in alto a sinistra» segnalato da Sergio.

     Il sistema dichiara quanto spazio si prende con env(safe-area-inset-*),
     che vale 0 dove non serve (browser, desktop) e 55px sul tablet. Quindi
     --rf-barra e' l'altezza VERA della barra, ed e' anche quello che le
     pagine devono togliersi dall'altezza utile: mob/ la usa al posto dei
     suoi 40px fissi. Perche' env() non torni 0 serve `viewport-fit=cover`
     nel meta viewport della pagina. */
  var CSS = '' +
':root{--rf-sicuro:env(safe-area-inset-top,0px);--rf-barra:calc(40px + var(--rf-sicuro));}' +
'.rf-topbar{position:fixed;top:0;left:0;right:0;height:var(--rf-barra);box-sizing:border-box;' +
'  z-index:9000;display:flex;align-items:center;gap:9px;' +
'  padding:var(--rf-sicuro) 10px 0;background:linear-gradient(#0c1c2e,#081521);border-bottom:1px solid #1a3248;' +
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
'body{padding-top:var(--rf-barra,40px)!important;}' +

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
'.rf-panel{position:fixed;top:var(--rf-barra,40px);left:0;right:0;z-index:9010;' +
'  max-height:calc(100vh - 12px - var(--rf-barra,40px));' +
'  max-height:calc(100dvh - 12px - var(--rf-barra,40px));overflow-y:auto;-webkit-overflow-scrolling:touch;' +
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
/* ── ingranaggio delle Impostazioni, in fondo alla barra in alto ── */
'.rf-topbar a.rf-imp{display:flex;align-items:center;justify-content:center;width:30px;height:30px;flex:none;' +
'  border-radius:8px;color:var(--sub,#5a7a94);text-decoration:none;}' +
'.rf-topbar a.rf-imp:active{transform:scale(.92);}' +
/* L'ingranaggio sta in fondo: sono stato e polare a doversi stringere,
   non lui a uscire dalla barra. Con REC attivo, su 375 px, la barra era
   larga 410 e l'ingranaggio finiva fuori schermo (28/09/2026). */
'.rf-topbar .rf-status{flex:0 1 auto;min-width:0;}' +
'.rf-topbar .rf-pol{flex:0 1 auto;min-width:0;}' +
'.rf-topbar a.rf-imp[aria-current]{color:var(--teal,#2BD9C4);background:hsl(172 70% 51% / .12);}' +
'html.night .rf-topbar a.rf-imp[aria-current]{background:rgba(255,77,77,.12);}' +

/* ── BARRA IN BASSO: le quattro sezioni ────────────────────────────────
   Grande di proposito (Sergio, 28/09/2026: col sole, e col tablet montato
   in basso, i testi piccoli non si leggono): 66px su telefono, 74 da 600px
   in su, etichette da 12,5px e grigi schiariti per il contrasto.
   --rf-sotto e' la sua altezza VERA, margine di sistema compreso, ed e'
   quello che le pagine devono lasciare libero in fondo. Da chiusa sta a
   z-index 19, SOTTO ogni finestra dei moduli (la piu' bassa e' il foglio
   del Cruscotto, a 20): una finestra aperta deve coprirla, altrimenti i
   suoi bottoni in fondo finiscono sotto la barra. Aperto il foglio delle
   sezioni, barra e foglio salgono sopra la pagina (.su). */
':root{--rf-sotto-sicuro:env(safe-area-inset-bottom,0px);--rf-sotto:calc(66px + var(--rf-sotto-sicuro));}' +
'@media (min-width:600px){:root{--rf-sotto:calc(74px + var(--rf-sotto-sicuro));}}' +
'html.rf-con-sotto body{padding-bottom:var(--rf-sotto)!important;}' +
/* --tinta: il fondo delle evidenziazioni. Di notte deve restare rosso come
   tutto il resto: un riquadro verdino al buio e' proprio quello che il
   tema Notte esiste per evitare. */
'.rf-sotto{--confine:#4f7390;}' +
'html.day .rf-sotto{--confine:#6b7f92;}' +
'html.night .rf-sotto{--confine:#7a2424;}' +
'.rf-sotto,.rf-sheet{--ink:#deedf5;--sub:#a3b8ca;--teal:#2BD9C4;--line:#1a3248;--fondo:#0a1826;--tinta:43,217,196;}' +
'html.day .rf-sotto,html.day .rf-sheet{--ink:#0a1420;--sub:#2c3e50;--teal:#067d70;--line:#a7b5c2;--fondo:#ffffff;--tinta:6,125,112;}' +
'html.night .rf-sotto,html.night .rf-sheet{--ink:#ff5b5b;--sub:#c85050;--teal:#ff4d4d;--line:#3a1010;--fondo:#120404;--tinta:255,77,77;}' +
'.rf-sotto{position:fixed;left:0;right:0;bottom:0;z-index:19;height:var(--rf-sotto);box-sizing:border-box;' +
'  padding:0 4px var(--rf-sotto-sicuro);display:flex;background:var(--fondo);border-top:2px solid var(--confine);' +
'  box-shadow:0 -6px 16px -4px rgba(0,0,0,.55);-webkit-user-select:none;user-select:none;' +
'  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;}' +
'.rf-sotto.su{z-index:8985;}' +
'.rf-sotto button{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;' +
'  gap:3px;background:none;border:0;padding:0 2px;margin:0;color:var(--sub);font-family:inherit;' +
'  font-size:12.5px;font-weight:650;line-height:1.1;letter-spacing:0;cursor:pointer;position:relative;}' +
'.rf-sotto button svg{width:27px;height:27px;flex:none;}' +
'@media (max-width:360px){.rf-sotto{padding-left:0;padding-right:0;}.rf-sotto button{font-size:11.5px;padding:0;}}' +
'@media (min-width:600px){.rf-sotto button{font-size:15px;gap:4px;}.rf-sotto button svg{width:31px;height:31px;}}' +
'.rf-sotto button span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;}' +
'.rf-sotto button.qui{color:var(--teal);}' +
'.rf-sotto button.qui::before{content:"";position:absolute;top:0;left:22%;right:22%;height:3px;' +
'  border-radius:0 0 3px 3px;background:var(--teal);}' +
'.rf-sotto button[aria-expanded="true"]{color:var(--ink);background:rgba(var(--tinta),.10);}' +
'.rf-sotto button:active{background:rgba(var(--tinta),.18);}' +
'.rf-sotto button:focus-visible{outline:2px solid var(--teal);outline-offset:-3px;border-radius:8px;}' +
'.rf-sheet-scrim{position:fixed;left:0;right:0;top:0;bottom:var(--rf-sotto);z-index:8980;' +
'  background:rgba(2,8,14,.5);opacity:0;pointer-events:none;transition:opacity .18s;}' +
'.rf-sheet-scrim.on{opacity:1;pointer-events:auto;}' +
'.rf-sheet{position:fixed;left:0;right:0;bottom:var(--rf-sotto);z-index:8984;max-width:560px;margin:0 auto;' +
'  box-sizing:border-box;padding:8px 10px 10px;background:var(--fondo);border:1px solid var(--line);border-bottom:0;' +
'  border-radius:16px 16px 0 0;box-shadow:0 -12px 30px -12px rgba(0,0,0,.7);color:var(--ink);' +
'  max-height:calc(100dvh - var(--rf-sotto) - var(--rf-barra,40px) - 12px);overflow-y:auto;' +
'  transform:translateY(calc(100% + var(--rf-sotto)));visibility:hidden;' +
'  transition:transform .22s cubic-bezier(.32,.72,.3,1),visibility 0s .22s;' +
'  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;}' +
'.rf-sheet.on{transform:none;visibility:visible;transition:transform .22s cubic-bezier(.32,.72,.3,1);}' +
'.rf-sheet h2{margin:4px 6px 8px;font:700 12.5px/1.2 ui-monospace,"SF Mono","Roboto Mono",Menlo,monospace;' +
'  letter-spacing:.14em;text-transform:uppercase;color:var(--sub);}' +
'.rf-sheet a{display:flex;align-items:center;gap:12px;min-height:64px;box-sizing:border-box;padding:9px 14px;' +
'  border-radius:11px;text-decoration:none;color:var(--ink);}' +
'.rf-sheet a+a{margin-top:2px;}' +
'.rf-sheet a:active{background:rgba(var(--tinta),.16);}' +
'.rf-sheet a:focus-visible{outline:2px solid var(--teal);outline-offset:-2px;}' +
'.rf-sheet a .t{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;}' +
'.rf-sheet a b{font-size:17.5px;font-weight:650;}' +
'.rf-sheet a small{font-size:14.5px;color:var(--sub);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
'.rf-sheet a .fr{flex:none;color:var(--sub);font-size:22px;}' +
'@media (min-width:600px){.rf-sheet{max-width:640px;}.rf-sheet a{min-height:72px;}.rf-sheet a b{font-size:20px;}.rf-sheet a small{font-size:16px;}}' +
'.rf-sheet a[aria-current]{background:rgba(var(--tinta),.10);box-shadow:inset 0 0 0 1px rgba(var(--tinta),.35);}' +
'.rf-sheet a[aria-current] b{color:var(--teal);}' +
'.rf-sheet a[aria-current] .fr{font:700 13px ui-monospace,monospace;letter-spacing:.06em;color:var(--teal);}' +
/* Quello che nei moduli sta fisso in fondo allo schermo sale sopra la
   barra. Si tocca solo `bottom`, e solo dove la barra c'e'. Elenco fatto
   leggendo le pagine il 28/09/2026: chi aggiunge un elemento fisso in
   basso lo aggiunga qui, altrimenti finisce sotto la barra. */
'html.rf-con-sotto .rf-toast{bottom:calc(24px + var(--rf-sotto));}' +
'html.rf-con-sotto .toast,html.rf-con-sotto #toast{bottom:calc(22px + var(--rf-sotto))!important;}' +
'html.rf-con-sotto .fab{bottom:calc(20px + var(--rf-sotto))!important;}' +
/* Manutenzione lascia 92px in fondo per il suo bottone «+ Intervento», e
   il suo avviso stava sopra quel bottone: le due distanze restano. */
'html.rf-con-sotto[data-rf-modulo="manutenzione"] body{padding-bottom:calc(92px + var(--rf-sotto))!important;}' +
'html.rf-con-sotto[data-rf-modulo="manutenzione"] .toast{bottom:calc(96px + var(--rf-sotto))!important;}' +
'html.rf-con-sotto[data-rf-modulo="impostazioni"] body{padding-bottom:calc(28px + var(--rf-sotto))!important;}' +
/* Leaflet mette i suoi strati a z-index 400-1000 senza chiuderli nel
   contenitore: scorrendo la pagina la mappa passerebbe SOPRA la barra, e
   la barra smetterebbe di rispondere dove la mappa la copre. */
'html.rf-con-sotto .leaflet-container{isolation:isolate;}' +
'@media (prefers-reduced-motion:reduce){.rf-panel,.rf-scrim,.rf-status .rf-chev,.rf-sheet,.rf-sheet-scrim{transition:none;}}' +
/* In stampa la barra non c'entra nulla, e il padding-top che riserva lo spazio
   lascerebbe una fascia vuota in cima al foglio. Sta qui e non nei moduli
   perche' e' la barra a introdurre quel padding. */
'@media print{.rf-topbar,.rf-panel,.rf-scrim,.rf-toast,.rf-sotto,.rf-sheet,.rf-sheet-scrim{display:none!important;}' +
'body{padding-top:0!important;}html.rf-con-sotto body{padding-bottom:0!important;}}';

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
        window.rfGeo.opzioni({ maximumAge: 2000, timeout: 30000 }));
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
  /* Radice del sito vista da questa pagina, ricavata dal link home che ogni
     modulo porta gia' giusto: "#" nell'hub, "../" nei moduli. Nell'APK
     prepara-sito.js lo riscrive in "../index.html", e prima di questa
     funzione urlMob() e urlCarta() ci attaccavano la cartella dietro:
     "../index.htmlmob/", cioe' il MOB della barra che nell'app non apriva
     la sua schermata (trovato il 28/09/2026 rileggendo, mai visto a bordo).
     I link che nascono qui portano sempre index.html esplicito: il server
     di Capacitor non risolve le cartelle. */
  function radice() {
    var a = document.querySelector(".rf-topbar a.rf-home");
    var base = a ? (a.getAttribute("href") || "") : "../";
    if (base === "#" || base === "" || /^(\.\/)?index\.html$/.test(base)) return "./";
    return base.replace(/index\.html$/, "");
  }
  function urlMob() { return radice() + "mob/index.html"; }
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
    chiudiSez();                 /* un foglio alla volta: quello delle sezioni scende */
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
  function urlCarta() { return radice() + "carta/index.html"; }

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

  /* La scorciatoia Cruscotto <-> Carta (pulsante «⇄» e scorrimento sulla
     barra, 28/09/2026) e' stata tolta il 29/09: ci sono la barra in basso e
     la striscia degli strumenti in Carta, e Sergio l'ha chiesto. */

  /* ═══════════════════════ barra in basso ═══════════════════════
     Decisa il 28/09/2026 (vedi SITUAZIONE.md): quattro sezioni per momento
     d'uso al posto del giro obbligato dal menu. Un tocco apre il foglio
     con i moduli della sezione, un secondo tocco ci entra: da qualunque
     schermo a qualunque altro in due tocchi, senza scorrere.
     XTE e Strumenti stanno ancora qui come voci proprie: diventeranno una
     modalita' della Carta e una parte del Cruscotto, e allora escono.
     Non compare in mob/: quella schermata e' tutta per l'emergenza.
     ══════════════════════════════════════════════════════════════ */
  var ICONE = {
    prep: '<path d="M3 8h10.5a3 3 0 1 0-3-3M3 12.5h15a3 3 0 1 1-3 3M3 17h7"/>',
    nav:  '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    reg:  '<path d="M5.5 21V3.5M5.5 4.5h12l-2.5 4 2.5 4h-12"/>',
    barca:'<path d="M12 3v12M12 4.5L6 14h6M3 17h18l-2.6 3.5H5.6z"/>'
  };
  var SEZIONI = [
    { id: "prep", nome: "Preparazione", voci: [
      { nome: "Meteo", sub: "Tattico multi-modello", url: "meteo/index.html" },
      { nome: "Traversata", sub: "Routing A→B · isocrone", url: "routing/raffyca-traversata-map.html" },
      { nome: "Sole & Luna", sub: "Luce, crepuscoli, volta celeste, marea", url: "sole-luna/index.html" } ] },
    { id: "nav", nome: "Navigazione", voci: [
      { nome: "Carta", sub: "Waypoint e tracce su carta", url: "carta/index.html" },
      { nome: "Cruscotto", sub: "Strumenti di bordo", url: "cruscotto/index.html" },
      { nome: "Ancoraggio", sub: "Veglia d'ancora · arare", url: "anchor/index.html" },
      { nome: "Posizione live", sub: "Chi è a terra ti segue", url: "posizione/index.html" },
      { nome: "XTE", sub: "Canale stretto", url: "xte/index.html" },
      { nome: "Strumenti", sub: "Vento, profondità, log dal gateway", url: "strumenti.html" } ] },
    { id: "reg", nome: "Regata", voci: [
      { nome: "Partenza", sub: "Linea · countdown", url: "partenza/index.html" },
      { nome: "Percorso", sub: "Boe · giri · laylines", url: "percorso/index.html" },
      { nome: "Performance", sub: "Velocità vs polare", url: "performance/index.html" } ] },
    { id: "barca", nome: "Barca", voci: [
      { nome: "Manutenzione", sub: "Registro di bordo dei lavori", url: "manutenzione/index.html" },
      { nome: "Prontuario", sub: "Bandiere, fari, fonetico, VHF", url: "prontuario/index.html" },
      { nome: "Calcoli", sub: "Carichi, carteggio, maree, turni", url: "calcoli/index.html" } ] }
  ];
  /* pagine che non stanno in nessuna sezione ma che la barra deve riconoscere */
  var ALTRE = ["impostazioni/index.html", "mob/index.html"];

  function combacia(url) {
    var p = location.pathname;
    if (/\/index\.html$/.test(url)) {
      var dir = url.slice(0, -"index.html".length);
      return new RegExp("/" + dir.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(index\\.html)?$").test(p);
    }
    return p.slice(-(url.length + 1)) === "/" + url;
  }
  function chiave(url) { return url.split("/")[0].replace(/\.html$/, ""); }

  /* dove sono: {mod, sez}. mod vale "" nell'hub. */
  var QUI = (function () {
    for (var i = 0; i < SEZIONI.length; i++)
      for (var j = 0; j < SEZIONI[i].voci.length; j++)
        if (combacia(SEZIONI[i].voci[j].url)) return { mod: chiave(SEZIONI[i].voci[j].url), sez: SEZIONI[i].id, url: SEZIONI[i].voci[j].url };
    for (var k = 0; k < ALTRE.length; k++)
      if (combacia(ALTRE[k])) return { mod: chiave(ALTRE[k]), sez: "", url: ALTRE[k] };
    return { mod: "", sez: "", url: "" };
  })();

  var elSotto, elSheet, elSheetScrim, sezAperta = null;

  function barraSotto() {
    if (QUI.mod === "mob" || document.querySelector(".rf-sotto")) return;
    var root = document.documentElement;
    if (QUI.mod) root.setAttribute("data-rf-modulo", QUI.mod);
    elSotto = document.createElement("nav");
    elSotto.className = "rf-sotto";
    elSotto.setAttribute("aria-label", "Sezioni di Dritta");
    elSotto.innerHTML = SEZIONI.map(function (s) {
      return '<button type="button" data-sez="' + s.id + '" aria-haspopup="dialog" aria-expanded="false"' +
        (s.id === QUI.sez ? ' class="qui"' : '') + '>' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONE[s.id] + '</svg>' +
        '<span>' + s.nome + '</span></button>';
    }).join("");
    elSheetScrim = document.createElement("div");
    elSheetScrim.className = "rf-sheet-scrim";
    elSheet = document.createElement("div");
    elSheet.className = "rf-sheet";
    elSheet.setAttribute("role", "dialog");
    elSotto.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-sez]");
      if (!b) return;
      var id = b.getAttribute("data-sez");
      if (sezAperta === id) chiudiSez(); else apriSez(id);
    });
    elSheetScrim.addEventListener("click", chiudiSez);
    elSheet.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (a && a.hasAttribute("aria-current")) { e.preventDefault(); chiudiSez(); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && sezAperta) chiudiSez();
    });
    /* tornando indietro, il browser puo' restituire la pagina com'era: col foglio aperto */
    window.addEventListener("pageshow", chiudiSez);
    document.body.appendChild(elSheetScrim);
    document.body.appendChild(elSheet);
    document.body.appendChild(elSotto);
    root.classList.add("rf-con-sotto");
  }

  function apriSez(id) {
    var s = SEZIONI.filter(function (x) { return x.id === id; })[0];
    if (!s) return;
    if (aperto) chiudiPanel();
    var base = radice();
    elSheet.setAttribute("aria-label", s.nome);
    elSheet.innerHTML = '<h2>' + s.nome + '</h2>' + s.voci.map(function (v) {
      var qui = v.url === QUI.url;
      return '<a href="' + base + v.url + '"' + (qui ? ' aria-current="page"' : '') + '>' +
        '<span class="t"><b>' + esc(v.nome) + '</b><small>' + esc(v.sub) + '</small></span>' +
        '<span class="fr" aria-hidden="true">' + (qui ? "QUI" : "›") + '</span></a>';
    }).join("");
    sezAperta = id;
    elSheet.classList.add("on"); elSheetScrim.classList.add("on"); elSotto.classList.add("su");
    Array.prototype.forEach.call(elSotto.querySelectorAll("button[data-sez]"), function (b) {
      b.setAttribute("aria-expanded", b.getAttribute("data-sez") === id ? "true" : "false");
    });
  }
  function chiudiSez() {
    if (!elSheet) return;
    sezAperta = null;
    elSheet.classList.remove("on"); elSheetScrim.classList.remove("on"); elSotto.classList.remove("su");
    Array.prototype.forEach.call(elSotto.querySelectorAll("button[data-sez]"), function (b) {
      b.setAttribute("aria-expanded", "false");
    });
  }

  /* Impostazioni: un'icona in fondo alla barra in alto, non una voce della
     barra in basso — si apre di rado, e li' sotto ogni posto vale coi guanti. */
  function ingranaggio() {
    var barra = document.querySelector(".rf-topbar");
    if (!barra || barra.querySelector(".rf-imp")) return;
    var a = document.createElement("a");
    a.className = "rf-imp";
    a.href = radice() + "impostazioni/index.html";
    a.setAttribute("aria-label", "Impostazioni");
    a.title = "Impostazioni";
    if (QUI.mod === "impostazioni") a.setAttribute("aria-current", "page");
    var raggi = "";
    for (var i = 0; i < 8; i++) {
      var r = i * Math.PI / 4, c = Math.cos(r), s = Math.sin(r);
      raggi += "M" + (12 + 6.4 * c).toFixed(2) + " " + (12 + 6.4 * s).toFixed(2) +
               "L" + (12 + 9.2 * c).toFixed(2) + " " + (12 + 9.2 * s).toFixed(2);
    }
    a.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" ' +
      'stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="6.2" stroke-width="1.8"/>' +
      '<circle cx="12" cy="12" r="2.4" stroke-width="1.8"/><path d="' + raggi + '" stroke-width="2.6"/></svg>';
    barra.appendChild(a);
  }

  /* ──────────────────────────── avvio ──────────────────────────── */
  function avvia() {
    if (!aggancia()) return;      // pagina senza barra: resta solo il registratore
    ingranaggio();
    barraSotto();
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
