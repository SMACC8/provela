/* ═══════════════════════════════════════════════════════════════════════
   Dritta · rf-report.js — i documenti da stampare (PDF)
   ───────────────────────────────────────────────────────────────────────
   Un modello solo per i documenti della suite: il diario di Traversata e il
   dossier di Manutenzione (01/10/2026, richiesta di Sergio: «i pdf sono
   proprio poveri: carattere moderno, tabelle, colore, abbellimenti»).

   Prima il diario era un PDF scritto a mano istruzione per istruzione, con
   i soli due caratteri di base del formato e colonne fatte di spazi; il
   dossier una pagina HTML in Georgia stampata con window.print(), che
   dentro l'APK non fa niente: la WebView di Android non ha la stampa.

   Ora: si costruisce una pagina HTML completa (carattere di sistema:
   Roboto su Android, San Francisco su Apple) e la si stampa.
   - nel browser: in un iframe nascosto, con la finestra di stampa, da cui
     «Salva come PDF»;
   - nell'APK: il plugin nativo Stampa (StampaPlugin.java) la passa al
     servizio di stampa di Android, che offre lo stesso «Salva come PDF».

   ES5, nessuna dipendenza. Tutto lo stile e' sotto .rr, cosi' la stessa
   pagina si puo' anche mostrare dentro un modulo come anteprima.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* toni delle etichette: il rosso e il verde solo dove vogliono dire
     sinistra e dritta (mure), o «scaduto»; mai per altro */
  var TONI = ["teal", "blu", "viola", "ambra", "arancio", "rosso", "verde", "grigio"];

  var CSS =
    ".rr{--rr-ink:#14202b;--rr-sub:#5b6b78;--rr-line:#dfe5ea;--rr-soft:#f3f6f8;--rr-acc:#0a9e90;" +
    "font-family:system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:var(--rr-ink);" +
    "font-size:10.5pt;line-height:1.4;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}" +
    ".rr *{box-sizing:border-box;}" +
    ".rr-testa{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;}" +
    ".rr-testa h1{font-size:20pt;font-weight:650;letter-spacing:-.01em;margin:0;line-height:1.1;}" +
    ".rr-testa .sot{color:var(--rr-sub);font-size:10.5pt;margin-top:3px;}" +
    ".rr-testa .dx{text-align:right;color:var(--rr-sub);font-size:9.5pt;white-space:nowrap;}" +
    ".rr-barra{height:4px;border-radius:2px;background:linear-gradient(90deg,#0a9e90,#0b6fb3);margin:10px 0 14px;}" +
    ".rr-kpi{display:grid;grid-template-columns:repeat(auto-fit,minmax(86px,1fr));gap:7px;margin:0 0 12px;}" +
    ".rr-kpi div{border:1px solid var(--rr-line);border-radius:8px;padding:7px 10px;break-inside:avoid;}" +
    ".rr-kpi span{display:block;font-size:8.5pt;color:var(--rr-sub);}" +
    ".rr-kpi b{display:block;font-size:15pt;font-weight:600;font-variant-numeric:tabular-nums;margin-top:1px;}" +
    ".rr-kpi .t-rosso b{color:#b42c26;} .rr-kpi .t-ambra b{color:#9a6400;} .rr-kpi .t-teal b{color:#077f74;}" +
    ".rr h2{font-size:11.5pt;font-weight:650;margin:18px 0 7px;padding-left:9px;border-left:4px solid var(--rr-acc);break-after:avoid;}" +
    ".rr h3{font-size:9.5pt;font-weight:650;color:var(--rr-sub);text-transform:uppercase;letter-spacing:.05em;margin:12px 0 5px;break-after:avoid;}" +
    ".rr p{margin:4px 0;}" +
    ".rr .rr-nota{color:var(--rr-sub);font-size:9pt;}" +
    ".rr table{width:100%;border-collapse:collapse;font-size:9.5pt;}" +
    ".rr thead th{background:#eef2f5;text-align:left;font-weight:600;font-size:8.5pt;color:#3d4b57;padding:5px 6px;}" +
    ".rr thead{display:table-header-group;}" +
    ".rr td{padding:5px 6px;border-bottom:1px solid #e6ebef;vertical-align:top;}" +
    ".rr tr{break-inside:avoid;}" +
    ".rr tbody tr:nth-child(even) td{background:#fafbfc;}" +
    ".rr .num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;}" +
    ".rr .sotto{color:var(--rr-sub);font-size:8.5pt;}" +
    ".rr tr.spento td{color:#8a99a6;}" +
    ".rr-chip{display:inline-block;border-radius:4px;padding:0 6px;font-size:8.5pt;font-weight:600;line-height:1.6;white-space:nowrap;}" +
    ".rr-chip.teal{background:#dff6f3;color:#06796f;} .rr-chip.blu{background:#e4f0fb;color:#0b5a99;}" +
    ".rr-chip.viola{background:#efe6fb;color:#6a3aa8;} .rr-chip.ambra{background:#fdf1d6;color:#8a5a00;}" +
    ".rr-chip.arancio{background:#fde9da;color:#a2501a;} .rr-chip.rosso{background:#fde5e3;color:#a32d28;}" +
    ".rr-chip.verde{background:#e2f5e6;color:#1d7a39;} .rr-chip.grigio{background:#eef2f5;color:#4d5b67;}" +
    ".rr-punti{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:10.5pt;margin:0 0 12px;}" +
    ".rr-punto{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;" +
    "color:#fff;font-size:8.5pt;font-weight:700;}" +
    ".rr-freccia{color:#8a99a6;}" +
    ".rr-due{display:grid;grid-template-columns:1fr 1.25fr;gap:10px;margin:0 0 4px;}" +
    ".rr-fig{background:var(--rr-soft);border-radius:8px;padding:6px;break-inside:avoid;}" +
    ".rr-fig svg{width:100%;height:auto;display:block;}" +
    ".rr-fig .cap{font-size:8pt;color:var(--rr-sub);text-align:center;margin-top:2px;}" +
    ".rr-luce{border:1px solid var(--rr-line);border-left:4px solid #0b6fb3;border-radius:6px;padding:6px 10px;margin:8px 0 2px;font-size:9.5pt;}" +
    ".rr-piede{margin-top:18px;padding-top:6px;border-top:1px solid #e6ebef;color:#8a99a6;font-size:8pt;display:flex;justify-content:space-between;gap:12px;}" +
    ".rr-piede b{color:#0a9e90;}";

  /* pagina A4; numero di pagina nel margine (dove la stampa lo sa fare) */
  var PAGINA = "@page{size:A4;margin:13mm 12mm 15mm;" +
    "@bottom-right{content:'pagina ' counter(page) ' di ' counter(pages);font:8pt system-ui,Roboto,sans-serif;color:#8a99a6;}}" +
    "html,body{margin:0;background:#fff;}";

  function testata(o) {
    return '<div class="rr-testa"><div><h1>' + esc(o.titolo) + '</h1>' +
      (o.sottotitolo ? '<div class="sot">' + esc(o.sottotitolo) + '</div>' : '') + '</div>' +
      '<div class="dx">' + (o.destra || []).map(esc).join("<br>") + '</div></div><div class="rr-barra"></div>';
  }
  function kpi(lista) {
    return '<div class="rr-kpi">' + lista.filter(Boolean).map(function (x) {
      return '<div' + (x.tono ? ' class="t-' + x.tono + '"' : '') + '><span>' + esc(x.k) + '</span><b>' + esc(x.v) + '</b></div>';
    }).join("") + '</div>';
  }
  function chip(testo, tono) {
    return '<span class="rr-chip ' + (TONI.indexOf(tono) >= 0 ? tono : "grigio") + '">' + esc(testo) + '</span>';
  }
  /* cols: [{t:'Data', num:true, w:'78px'}]; righe: [[html, ...], {cls:'spento', celle:[...]}] — le celle sono HTML gia' pronto */
  function tabella(cols, righe) {
    var h = '<table><thead><tr>' + cols.map(function (c) {
      return '<th' + (c.num ? ' class="num"' : '') + (c.w ? ' style="width:' + c.w + '"' : '') + '>' + esc(c.t) + '</th>';
    }).join("") + '</tr></thead><tbody>';
    righe.forEach(function (r) {
      var celle = r.celle || r, cls = r.cls ? ' class="' + r.cls + '"' : '';
      h += '<tr' + cls + '>' + celle.map(function (x, i) {
        return '<td' + (cols[i] && cols[i].num ? ' class="num"' : '') + '>' + (x == null || x === "" ? "—" : x) + '</td>';
      }).join("") + '</tr>';
    });
    return h + '</tbody></table>';
  }
  function piede(testo) {
    return '<div class="rr-piede"><span>' + esc(testo || "") + '</span><span>Dritta · Svilup<b>PPA</b>ta da Sergio Moro</span></div>';
  }
  function documento(titolo, corpo) {
    return '<!doctype html><html lang="it"><head><meta charset="utf-8"><title>' + esc(titolo) + '</title>' +
      '<style>' + PAGINA + CSS + '</style></head><body><div class="rr">' + corpo + '</div></body></html>';
  }

  /* lo stile, per mostrare un'anteprima dentro un modulo */
  function stileAnteprima() {
    if (document.getElementById("rrStile")) return;
    var s = document.createElement("style"); s.id = "rrStile"; s.textContent = CSS;
    document.head.appendChild(s);
  }

  function nativo() {
    var C = window.Capacitor;
    return C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins.Stampa ? C.Plugins.Stampa : null;
  }

  /* nome: diventa il nome proposto per il PDF */
  function stampa(html, nome) {
    nome = String(nome || "Dritta").replace(/[\\/:*?"<>|]+/g, "-");
    var N = nativo();
    if (N) { return N.stampa({ html: html, nome: nome }).catch(function (e) { alert("Stampa non riuscita: " + (e && e.message || e)); }); }
    /* browser: un iframe nascosto. Il nome del PDF lo prende dal titolo
       della pagina che stampa, quindi per la durata della stampa la pagina
       madre prende il titolo del documento. */
    var f = document.createElement("iframe");
    f.setAttribute("aria-hidden", "true");
    f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
    document.body.appendChild(f);
    var vecchio = document.title, fatto = false;
    function pulisci() { if (fatto) return; fatto = true; document.title = vecchio; setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 1000); }
    f.onload = function () {
      var w = f.contentWindow;
      try {
        document.title = nome;
        w.addEventListener("afterprint", pulisci);
        w.focus(); w.print();
      } catch (e) { pulisci(); alert("Stampa non riuscita"); }
      setTimeout(pulisci, 60000);
    };
    f.srcdoc = html;
    return Promise.resolve();
  }

  window.rfReport = {
    esc: esc, testata: testata, kpi: kpi, chip: chip, tabella: tabella, piede: piede,
    documento: documento, stampa: stampa, stileAnteprima: stileAnteprima, css: CSS
  };
})();
