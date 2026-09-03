/* rf-fari.js — motore delle caratteristiche di luce, condiviso dalla suite.
   Lo usano il Prontuario (simulatore con confronto a due luci) e la Carta
   Nautica (riquadro "Come si vede" sul faro toccato).

   Sta qui e non dentro un modulo per la ragione di sempre in questo repo: due
   copie dello stesso disegno divergono, e a divergere sarebbe la risposta alla
   domanda "che luce sto vedendo". Una sorgente sola, come rf-astro.js.

   Convenzione: la caratteristica da' il RITMO (quanti lampi, ogni quanti
   secondi), non la durata del singolo lampo. Le durate sono quelle
   convenzionali IALA e servono a riconoscere una luce, non a misurarla.

   API:
     rfFari.parse(str)        -> {type,groups,tail,tailN,letter,color,period,range,src} | null
     rfFari.phases(parsed)    -> {seq:[[acceso,durata], ...], period}
     rfFari.stateAt(ph, t)    -> 0|1
     rfFari.describe(parsed)  -> HTML
     rfFari.cardinale(parsed) -> "" | "cardinale SUD — ..."
     rfFari.COL               -> colori-luce (fissi nei tre temi)
     rfFari.lampada(host, ch, opt) -> disegna e anima un riquadro; .stop() per fermarlo
*/
(function (glob) {
"use strict";

var COL = {W:"#FFF3D0", R:"#FF4B4B", G:"#35E07A", Y:"#FFD23B", Or:"#FF9A3C", Bu:"#5AA9FF"};
/* [masch. sing., masch. plur., femm. sing., femm. plur.] — l'accordo va fatto:
   "2 lampi bianco" si legge come un errore di traduzione */
var COLNAME = {
  W:["bianco","bianchi","bianca","bianche"], R:["rosso","rossi","rossa","rosse"],
  G:["verde","verdi","verde","verdi"],       Y:["giallo","gialli","gialla","gialle"],
  Or:["arancione","arancioni","arancione","arancioni"], Bu:["blu","blu","blu","blu"]
};
function colName(c, femm, plur){
  var f = COLNAME[c] || COLNAME.W;
  return f[(femm ? 2 : 0) + (plur ? 1 : 0)];
}
/* durate convenzionali IALA: la caratteristica da' il ritmo, non la durata */
var DUR = { Fl:{on:0.5,gap:1.0}, LFl:{on:2.0,gap:1.5}, Q:{on:0.3,gap:0.7}, VQ:{on:0.15,gap:0.35},
            Oc:{dark:1.0,mid:1.5} };
var MORSE = {A:".-",U:"..-",N:"-.",K:"-.-",D:"-..",S:"...",O:"---",B:"-...",T:"-"};

var TMAP = {lfl:"LFl", vq:"VQ", uq:"VQ", iq:"Q", fl:"Fl", iso:"Iso", oc:"Oc", mo:"Mo", q:"Q", f:"F"};

function parseCh(str){
  var s = String(str || "").trim();
  if (!s) return null;
  /* Il secondo tipo dopo il "+" e' la composta delle cardinali sud.
     Le due notazioni in giro sono Q(6)+LFl (carta) e Q+LFl(6) (dato OSM):
     il numero puo' stare da una parte o dall'altra e vale comunque per il primo tipo. */
  var m = s.match(/^(LFl|VQ|UQ|IQ|Fl|Iso|Oc|Mo|Q|F)\s*(?:\(([^)]*)\))?(?:\s*\+\s*(LFl|VQ|UQ|Fl|Q)\s*(?:\(([^)]*)\))?)?/i);
  if (!m) return null;
  var type = TMAP[m[1].toLowerCase()];
  var tail = m[3] ? TMAP[m[3].toLowerCase()] : null;
  var raw = m[2] || m[4] || "", groups = [1], letter = "";
  if (type === "Mo") letter = (raw || "U").toUpperCase().replace(/[^A-Z]/g, "") || "U";
  else if (raw) groups = raw.split("+").map(function(x){ return parseInt(x, 10) || 1; });
  var tailN = 1;
  if (tail) {                       /* con la coda, il 2o numero e' quante volte lampeggia la coda */
    tailN = groups.length > 1 ? groups[1] : 1;
    groups = [groups[0]];
  }
  var after = s.slice(m[0].length);
  var cm = after.match(/\b(Or|Bu|W|R|G|Y)\b/);
  var color = (cm && COL[cm[1]]) ? cm[1] : "W";
  var pm = s.match(/(\d+(?:[.,]\d+)?)\s*s\b/);
  var rg = s.match(/(\d+(?:[.,]\d+)?)\s*M\b/);
  return { type:type, groups:groups, tail:tail, tailN:tailN, letter:letter, color:color,
           period: pm ? parseFloat(pm[1].replace(",", ".")) : null,
           range:  rg ? parseFloat(rg[1].replace(",", ".")) : null, src:s };
}

/* Le cardinali sono sempre bianche e hanno ritmi fissi: riconoscerle e dirlo
   e' meta' del motivo per cui uno guarda una luce di notte. */
function cardinale(p){
  if (!p || p.color !== "W" || (p.type !== "Q" && p.type !== "VQ")) return "";
  var n = p.groups[0];
  if (p.tail === "LFl" && n === 6) return "cardinale SUD — il pericolo è a nord della boa";
  if (!p.tail && n === 3) return "cardinale EST — il pericolo è a ovest della boa";
  if (!p.tail && n === 9) return "cardinale OVEST — il pericolo è a est della boa";
  if (!p.tail && n === 1 && !p.period) return "cardinale NORD — il pericolo è a sud della boa";
  return "";
}

/* costruisce [[acceso 0|1, durata s], ...] che copre esattamente un periodo */
function buildPhases(p){
  if (!p) return {seq:[[0,4]], period:4};
  var seq = [], t = p.type, T = p.period;

  if (t === "F")   return {seq:[[1, T || 4]], period:T || 4};
  if (t === "Iso") { var h = (T || 4) / 2; return {seq:[[1,h],[0,h]], period:T || 4}; }

  if (t === "Oc") {
    var n = p.groups[0] || 1, d = DUR.Oc;
    var used = n * d.dark + (n - 1) * d.mid;
    var lead = Math.max(0.6, (T || (used + 3)) - used);
    seq.push([1, lead]);
    for (var i = 0; i < n; i++) { if (i) seq.push([1, d.mid]); seq.push([0, d.dark]); }
    return {seq:seq, period:lead + used};
  }

  if (t === "Mo") {
    var code = MORSE[p.letter] || MORSE.U, u = 0.3;
    for (var c = 0; c < code.length; c++) {
      if (c) seq.push([0, u]);
      seq.push([1, code.charAt(c) === "-" ? u * 3 : u]);
    }
    var uM = seq.reduce(function(a,x){ return a + x[1]; }, 0);
    var pM = T || (uM + 4);
    if (pM > uM) seq.push([0, pM - uM]);
    return {seq:seq, period:Math.max(pM, uM)};
  }

  /* Fl · LFl · Q · VQ — famiglia a lampi */
  var d2 = DUR[t] || DUR.Fl;
  p.groups.forEach(function(n, gi){
    if (gi) seq.push([0, 2.0]);                       /* stacco fra i gruppi di un composto */
    for (var i = 0; i < n; i++) { if (i) seq.push([0, d2.gap]); seq.push([1, d2.on]); }
  });
  if (p.tail) {                    /* la coda della cardinale sud: Q(6) + un lampo lungo */
    var dt = DUR[p.tail] || DUR.LFl;
    for (var k = 0; k < (p.tailN || 1); k++) { seq.push([0, dt.gap]); seq.push([1, dt.on]); }
  }
  var used2 = seq.reduce(function(a,x){ return a + x[1]; }, 0);
  var per2 = T || (used2 + ((t === "Q" || t === "VQ") ? d2.gap : 2.0));
  if (per2 > used2 + 0.05) seq.push([0, per2 - used2]); else per2 = used2;
  return {seq:seq, period:per2};
}

function describe(p){
  if (!p) return "Caratteristica non riconosciuta.";
  var tot = p.groups.reduce(function(a,b){ return a + b; }, 0), out;

  if (p.type === "F") {                       /* una fissa non ha periodo: dirlo sarebbe falso */
    out = "Luce fissa " + colName(p.color, true, false);
    if (p.range) out += " &middot; portata " + String(p.range).replace(".", ",") + " M";
    return out;
  }
  if (p.type === "Iso") out = "Isofase " + colName(p.color, true, false) + " &#8212; luce e buio di uguale durata";
  else if (p.type === "Mo") out = "Morse lettera " + p.letter + " (" +
      (MORSE[p.letter] || "..-").replace(/\./g, "&middot;").replace(/-/g, "&#8212;") +
      "), luce " + colName(p.color, true, false);
  else if (p.type === "Oc") out = tot > 1
      ? "Gruppo di " + tot + " occultazioni " + colName(p.color, true, true)
      : "Occultazione " + colName(p.color, true, false);
  else {
    var S = {LFl:"lampo lungo", Q:"scintillio", VQ:"scintillio rapido", Fl:"lampo"}[p.type];
    var P = {LFl:"lampi lunghi", Q:"scintillii", VQ:"scintillii rapidi", Fl:"lampi"}[p.type];
    if (p.groups.length > 1) out = "Gruppi di " + p.groups.join(" + ") + " " + P + " " + colName(p.color, false, true);
    else if (tot > 1) out = tot + " " + P + " " + colName(p.color, false, true);
    else if (!p.period && (p.type === "Q" || p.type === "VQ") && !p.tail)
      out = S.charAt(0).toUpperCase() + S.slice(1) + " continuo " + colName(p.color, false, false);
    else out = "1 " + S + " " + colName(p.color, false, false);
    if (p.tail) {
      var TS = {LFl:"lampo lungo", Q:"scintillio", VQ:"scintillio rapido", Fl:"lampo"}[p.tail];
      var TP = {LFl:"lampi lunghi", Q:"scintillii", VQ:"scintillii rapidi", Fl:"lampi"}[p.tail];
      var n = p.tailN || 1;
      out += " seguiti da " + (n > 1 ? n + " " + TP : "1 " + TS);
    }
  }
  if (p.period) out += ", ogni <b>" + String(p.period).replace(".", ",") + " s</b>";
  if (p.range)  out += " &middot; portata " + String(p.range).replace(".", ",") + " M";
  return out;
}
function stateAt(ph, t){
  var x = t % ph.period, acc = 0;
  for (var i = 0; i < ph.seq.length; i++) { acc += ph.seq[i][1]; if (x < acc) return ph.seq[i][0]; }
  return 0;
}

/* ---- riquadro autonomo: una luce sola che lampeggia, con la sua barra dei
   tempi. Lo usa la Carta nel popup del faro; il Prontuario ha la sua interfaccia
   a due luci e usa solo le funzioni di calcolo qui sopra. ---- */
function lampada(host, ch, opt){
  opt = opt || {};
  var p = parseCh(ch), ph = buildPhases(p);
  var rm = glob.matchMedia && glob.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var col = COL[p ? p.color : "W"];

  var segs = "";
  if (p) ph.seq.forEach(function(f){
    segs += '<i style="flex:' + f[1] + ' 0 0' + (f[0] ? ";background:" + col : "") + '"></i>';
  });

  /* Due tagli, e la differenza e' a cosa serve il riquadro.
     solaLuce: in Carta Nautica, dove la caratteristica e il nome sono gia'
     scritti nel popup subito sotto. Ripeterli in forma discorsiva dentro una
     colonna larga sei caratteri non aiuta nessuno: li' serve solo VEDERE il
     ritmo. Chi vuole approfondire apre il simulatore.
     Completo: nel Prontuario, dove il punto e' proprio imparare a leggerla. */
  if (opt.solaLuce) {
    host.innerHTML = '<div class="rff rff-sola"><div class="rff-l"><b></b></div></div>';
  } else {
    host.innerHTML =
      '<div class="rff">' +
        '<div class="rff-l"><b></b></div>' +
        '<div class="rff-r">' +
          '<div class="rff-nm"></div>' +
          '<div class="rff-ch"></div>' +
          '<div class="rff-tl">' + segs + '<u></u></div>' +
          '<div class="rff-tx"></div>' +
        '</div>' +
      '</div>';
  }
  var lamp = host.querySelector(".rff-l b"),
      head = host.querySelector(".rff-tl u");
  lamp.style.setProperty("--lc", col);
  if (!opt.solaLuce) {
    host.querySelector(".rff-nm").textContent = opt.nome || "";
    host.querySelector(".rff-ch").textContent = (p ? p.src : String(ch || "—"));
    var card = p ? cardinale(p) : "";
    host.querySelector(".rff-tx").innerHTML = p
      ? (describe(p) + (card ? '<em>▲ ' + card + "</em>" : ""))
      : "Caratteristica non riconoscibile.";
  }

  var vivo = true, t0 = (glob.performance || Date).now();
  function giro(now){
    if (!vivo) return;
    if (p && host.isConnected !== false) {
      var t = (now - t0) / 1000;
      lamp.className = (rm || stateAt(ph, t)) ? "on" : "";
      if (head) head.style.left = (rm ? 0 : ((t % ph.period) / ph.period * 100)) + "%";
    }
    glob.requestAnimationFrame(giro);
  }
  glob.requestAnimationFrame(giro);
  return { stop: function(){ vivo = false; }, parsed: p, phases: ph };
}

/* ---- geometria: chi si vede da qui ----
   Portata dalla Carta Nautica, dove girava gia'. I settori sono dati "from
   seaward", quindi il rilevamento da confrontare e' quello barca -> faro.
   Regola prudente e voluta: senza portata nota NON si afferma la visibilita'. */
var _rad = Math.PI / 180, _R = 6371000;
function brg(la1, lo1, la2, lo2){
  var f1 = la1*_rad, f2 = la2*_rad, dl = (lo2-lo1)*_rad;
  var y = Math.sin(dl)*Math.cos(f2), x = Math.cos(f1)*Math.sin(f2)-Math.sin(f1)*Math.cos(f2)*Math.cos(dl);
  return (Math.atan2(y,x)/_rad + 360) % 360;
}
function distM(la1, lo1, la2, lo2){
  var f1 = la1*_rad, f2 = la2*_rad, df = (la2-la1)*_rad, dl = (lo2-lo1)*_rad;
  var a = Math.sin(df/2)*Math.sin(df/2)+Math.cos(f1)*Math.cos(f2)*Math.sin(dl/2)*Math.sin(dl/2);
  return _R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function inSector(b, s, e){
  var delta = ((e-s)%360+360)%360, off = ((b-s)%360+360)%360;
  return off <= delta;
}
/* features GeoJSON + [lat,lon] -> luci visibili, dalla piu' vicina */
function visibili(features, pos){
  if (!features || !pos) return [];
  var out = [];
  features.forEach(function(f){
    var p = f.properties, c = f.geometry && f.geometry.coordinates;
    if (!p || !c) return;
    var lat = c[1], lon = c[0];
    var d = distM(pos[0], pos[1], lat, lon)/1852, b = brg(pos[0], pos[1], lat, lon);
    var col = null, rng = null, i, s;
    if (p.ss) { for (i=0;i<p.ss.length;i++){ s=p.ss[i]; if (inSector(b, s[1], s[2])) { col=s[0]; rng=s[3]; break; } } }
    else if (p.ar) { col = p.ar[0][0] || "W"; rng = p.ar[0][1]; }
    else return;
    if (col === null) return;              /* fuori dai settori luminosi */
    if (!rng || d > rng) return;           /* portata ignota o fuori portata */
    out.push({ f:f, nome:p.nm || p.ref || "Faro", ch:p.ch || "", colore:col,
               portata:rng, brg:b, dist:d });
  });
  out.sort(function(a,b2){ return a.dist - b2.dist; });
  return out;
}

glob.rfFari = {
  brg: brg, distM: distM, inSector: inSector, visibili: visibili,
  parse: parseCh, phases: buildPhases, stateAt: stateAt,
  describe: describe, cardinale: cardinale, COL: COL, lampada: lampada
};
})(typeof window !== "undefined" ? window : this);
