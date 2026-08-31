/* ============================================================
   rf-astro.js — motore astronomico condiviso della suite ProVela.
   Stessa idea di rf-topbar.js: un file solo, caricato dove serve
   con <script src="../rf-astro.js">.

   Origine: prototipo Sole e Luna (React), motore validato contro
   la libreria astronomy-engine (< 5 s di errore sul sole, < 9 s
   sulla luna; altezze < 0.02 gradi). Qui e' la stessa matematica,
   tradotta in ES5 puro, senza DOM: la usano sia il modulo Sole e
   Luna sia — quando arriverà — Traversata/Cruscotto per la luce
   all'ETA.

   Nessuna dipendenza esterna. Espone tutto su window.rfAstro.
   ============================================================ */
(function () {
  'use strict';

  var RAD = Math.PI / 180, DEG = 180 / Math.PI;
  var sin = Math.sin, cos = Math.cos, tan = Math.tan,
      asin = Math.asin, atan = Math.atan2, acos = Math.acos;
  var DAY_MS = 86400000, J1970 = 2440588, J2000 = 2451545;

  function toDays(d) { return d.valueOf() / DAY_MS - 0.5 + J1970 - J2000; }
  function cent(d) { return toDays(d) / 36525; }
  function norm360(x) { x = x % 360; return x < 0 ? x + 360 : x; }
  function obliquity(T) {
    return (23.43929111 - (46.815 * T + 0.00059 * T * T - 0.001813 * T * T * T) / 3600) * RAD;
  }

  function gmst(date) {
    var d = toDays(date), T = d / 36525;
    return norm360(280.46061837 + 360.98564736629 * d + 0.000387933 * T * T - T * T * T / 38710000);
  }

  function sunEquatorial(date) {
    var T = cent(date);
    var L0 = norm360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
    var M = norm360(357.52911 + 35999.05029 * T - 0.0001537 * T * T), Mr = M * RAD;
    var C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * sin(Mr)
      + (0.019993 - 0.000101 * T) * sin(2 * Mr) + 0.000289 * sin(3 * Mr);
    var omega = 125.04 - 1934.136 * T;
    var lambda = (L0 + C - 0.00569 - 0.00478 * sin(omega * RAD)) * RAD;
    var eps = obliquity(T) + 0.00256 * RAD * cos(omega * RAD);
    var R = 1.000001018 * (1 - 0.016708634 * 0.016708634) / (1 + (0.016708634 - 0.000042037 * T) * cos(Mr + C * RAD));
    return { ra: atan(cos(eps) * sin(lambda), cos(lambda)), dec: asin(sin(eps) * sin(lambda)), dist: R * 149597870.7 };
  }

  /* Meeus cap.47 troncato — [D, M, M', F, dLon(1e-6 deg), dDist(1e-3 km)] */
  var LR = [[0,0,1,0,6288774,-20905355],[2,0,-1,0,1274027,-3699111],[2,0,0,0,658314,-2955968],[0,0,2,0,213618,-569925],[0,1,0,0,-185116,48888],[0,0,0,2,-114332,-3149],[2,0,-2,0,58793,246158],[2,-1,-1,0,57066,-152138],[2,0,1,0,53322,-170733],[2,-1,0,0,45758,-204586],[0,1,-1,0,-40923,-129620],[1,0,0,0,-34720,108743],[0,1,1,0,-30383,104755],[2,0,0,-2,15327,10321],[0,0,1,2,-12528,0],[0,0,1,-2,10980,79661],[4,0,-1,0,10675,-34782],[0,0,3,0,10034,-23210],[4,0,-2,0,8548,-21636],[2,1,-1,0,-7888,24208],[2,1,0,0,-6766,30824],[1,0,-1,0,-5163,-8379],[1,1,0,0,4987,-16675],[2,-1,1,0,4036,-12831],[2,0,2,0,3994,-10445],[4,0,0,0,3861,-11650],[2,0,-3,0,3665,14403],[0,1,-2,0,-2689,-7003],[2,0,-1,2,-2602,0],[2,-1,-2,0,2390,10056],[1,0,1,0,-2348,6322],[2,-2,0,0,2236,-9884],[0,1,2,0,-2120,5751],[0,2,0,0,-2069,0],[2,-2,-1,0,2048,-4950],[2,0,1,-2,-1773,4130],[2,0,0,2,-1595,0],[4,-1,-1,0,1215,-3958],[0,0,2,2,-1110,0],[3,0,-1,0,-892,3258],[2,1,1,0,-810,2616],[4,-1,-2,0,759,-1897],[0,2,-1,0,-713,-2117],[2,2,-1,0,-700,2354],[2,1,-2,0,691,0],[2,-1,0,-2,596,0],[4,0,1,0,549,-1423],[0,0,4,0,537,-1117],[4,-1,0,0,520,-1571],[1,0,-2,0,-487,-1739],[2,1,0,-2,-399,0],[0,0,2,-2,-381,-4421],[1,1,1,0,351,0],[3,0,-2,0,-340,0],[4,0,-3,0,330,0],[2,-1,2,0,327,0],[0,2,1,0,-323,1165],[1,1,-1,0,299,0],[2,0,3,0,294,0],[2,0,-1,-2,0,8752]];
  var LB = [[0,0,0,1,5128122],[0,0,1,1,280602],[0,0,1,-1,277693],[2,0,0,-1,173237],[2,0,-1,1,55413],[2,0,-1,-1,46271],[2,0,0,1,32573],[0,0,2,1,17198],[2,0,1,-1,9266],[0,0,2,-1,8822],[2,-1,0,-1,8216],[2,0,-2,-1,4324],[2,0,1,1,4200],[2,1,0,-1,-3359],[2,-1,-1,1,2463],[2,-1,0,1,2211],[2,-1,-1,-1,2065],[0,1,-1,-1,-1870],[4,0,-1,-1,1828],[0,1,0,1,-1794],[0,0,0,3,-1749],[0,1,-1,1,-1565],[1,0,0,1,-1491],[0,1,1,1,-1475],[0,1,1,-1,-1410],[0,1,0,-1,-1344],[1,0,0,-1,-1335],[0,0,3,1,1107],[4,0,0,-1,1021],[4,0,-1,1,833],[0,0,1,-3,777],[4,0,-2,1,671],[2,0,0,-3,607],[2,0,2,-1,596],[2,-1,1,-1,491],[2,0,-2,1,-451],[0,0,3,-1,439],[2,0,2,1,422],[2,0,-3,-1,421],[2,1,-1,1,-366],[2,1,0,1,-351],[4,0,0,1,331],[2,-1,1,1,315],[2,-2,0,-1,302],[0,0,1,3,-283],[2,1,1,-1,-229],[1,1,0,-1,223],[1,1,0,1,223],[0,1,-2,-1,-220],[2,1,-1,-1,-220],[1,0,1,1,-185],[2,-1,-2,-1,181],[0,1,2,1,-177],[4,0,-2,-1,176],[4,-1,-1,-1,166],[1,0,1,-1,-164],[4,0,1,-1,132],[1,0,-1,-1,-119],[4,-1,0,-1,115],[2,-2,0,1,107]];

  function moonEquatorial(date) {
    var T = cent(date);
    var Lp = norm360(218.3164477 + 481267.88123421 * T - 0.0015786 * T * T + T * T * T / 538841 - T * T * T * T / 65194000);
    var D = norm360(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T + T * T * T / 545868 - T * T * T * T / 113065000);
    var M = norm360(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T + T * T * T / 24490000);
    var Mp = norm360(134.9633964 + 477198.8675055 * T + 0.0087414 * T * T + T * T * T / 69699 - T * T * T * T / 14712000);
    var F = norm360(93.272095 + 483202.0175233 * T - 0.0036539 * T * T - T * T * T / 3526000 + T * T * T * T / 863310000);
    var A1 = norm360(119.75 + 131.849 * T), A2 = norm360(53.09 + 479264.29 * T), A3 = norm360(313.45 + 481266.484 * T);
    var E = 1 - 0.002516 * T - 0.0000074 * T * T;
    var sl = 0, sr = 0, sb = 0, i, t, arg, e;
    for (i = 0; i < LR.length; i++) {
      t = LR[i];
      arg = (t[0] * D + t[1] * M + t[2] * Mp + t[3] * F) * RAD;
      e = t[1] === 0 ? 1 : (Math.abs(t[1]) === 1 ? E : E * E);
      sl += t[4] * e * sin(arg); sr += t[5] * e * cos(arg);
    }
    for (i = 0; i < LB.length; i++) {
      t = LB[i];
      arg = (t[0] * D + t[1] * M + t[2] * Mp + t[3] * F) * RAD;
      e = t[1] === 0 ? 1 : (Math.abs(t[1]) === 1 ? E : E * E);
      sb += t[4] * e * sin(arg);
    }
    sl += 3958 * sin(A1 * RAD) + 1962 * sin((Lp - F) * RAD) + 318 * sin(A2 * RAD);
    sb += -2235 * sin(Lp * RAD) + 382 * sin(A3 * RAD) + 175 * sin((A1 - F) * RAD)
        + 175 * sin((A1 + F) * RAD) + 127 * sin((Lp - Mp) * RAD) - 115 * sin((Lp + Mp) * RAD);
    var lambda = (Lp + sl / 1e6) * RAD, beta = (sb / 1e6) * RAD;
    var dist = 385000.56 + sr / 1000, eps = obliquity(T);
    return {
      ra: atan(sin(lambda) * cos(eps) - tan(beta) * sin(eps), cos(lambda)),
      dec: asin(sin(beta) * cos(eps) + cos(beta) * sin(eps) * sin(lambda)),
      dist: dist, parallax: asin(6378.14 / dist) * DEG
    };
  }

  function horizontal(date, lat, lon, eq) {
    var H = (gmst(date) + lon) * RAD - eq.ra, phi = lat * RAD;
    return {
      alt: asin(sin(phi) * sin(eq.dec) + cos(phi) * cos(eq.dec) * cos(H)) * DEG,
      az: norm360(atan(sin(H), cos(H) * sin(phi) - tan(eq.dec) * cos(phi)) * DEG + 180)
    };
  }
  /* sotto -0.575 resta costante, non salta a zero */
  function refract(a) { var h = Math.max(a, -0.575); return 1.02 / tan((h + 10.3 / (h + 5.11)) * RAD) / 60; }

  function sunPosition(date, lat, lon) {
    var eq = sunEquatorial(date), h = horizontal(date, lat, lon, eq);
    return { alt: h.alt, altApp: h.alt + refract(h.alt), az: h.az };
  }
  function moonPosition(date, lat, lon) {
    var eq = moonEquatorial(date), h = horizontal(date, lat, lon, eq);
    var alt = h.alt - eq.parallax * cos(h.alt * RAD);
    return { alt: alt, altApp: alt + refract(alt), az: h.az, dist: eq.dist, parallax: eq.parallax };
  }
  function moonIllumination(date) {
    var s = sunEquatorial(date), m = moonEquatorial(date);
    var phi = acos(sin(s.dec) * sin(m.dec) + cos(s.dec) * cos(m.dec) * cos(s.ra - m.ra));
    var inc = atan(s.dist * sin(phi), m.dist - s.dist * cos(phi));
    var angle = atan(cos(s.dec) * sin(s.ra - m.ra), sin(s.dec) * cos(m.dec) - cos(s.dec) * sin(m.dec) * cos(s.ra - m.ra));
    return { fraction: (1 + cos(inc)) / 2, phase: 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / Math.PI };
  }

  function refine(ta, tb, f, h0) {
    var fa = f(new Date(ta)) - h0, i, tm, fm;
    for (i = 0; i < 40 && tb - ta > 500; i++) {
      tm = (ta + tb) / 2; fm = f(new Date(tm)) - h0;
      if ((fa <= 0) === (fm <= 0)) { ta = tm; fa = fm; } else tb = tm;
    }
    return new Date((ta + tb) / 2);
  }
  function crossings(t0, hours, stepMin, f, h0) {
    var res = [], step = stepMin * 60000, n = Math.ceil(hours * 60 / stepMin);
    var tp = t0, ap = f(new Date(t0)) - h0, i, t, a;
    for (i = 1; i <= n; i++) {
      t = t0 + i * step; a = f(new Date(t)) - h0;
      if (ap <= 0 && a > 0) res.push({ type: 'rise', t: refine(tp, t, f, h0) });
      else if (ap >= 0 && a < 0) res.push({ type: 'set', t: refine(tp, t, f, h0) });
      tp = t; ap = a;
    }
    return res;
  }
  function culmination(t0, hours, f) {
    var best = null, step = 600000, n = Math.ceil(hours * 3600000 / step), i, t, a;
    for (i = 0; i <= n; i++) { t = t0 + i * step; a = f(new Date(t)); if (!best || a > best.alt) best = { t: t, alt: a }; }
    var lo = best.t - step, hi = best.t + step, m1, m2;
    for (i = 0; i < 50 && hi - lo > 500; i++) {
      m1 = lo + (hi - lo) / 3; m2 = hi - (hi - lo) / 3;
      if (f(new Date(m1)) < f(new Date(m2))) lo = m1; else hi = m2;
    }
    var tt = (lo + hi) / 2;
    return { time: new Date(tt), alt: f(new Date(tt)) };
  }
  function dayStart(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); }
  /* nei giorni di cambio ora il giorno civile dura 23 o 25 ore: scandire
     sempre 1440 minuti dalla mezzanotte locale sborda nel giorno dopo a
     marzo e perde l'ultima ora a ottobre. */
  function dayBounds(d) {
    var t0 = dayStart(d);
    var x = new Date(t0); x.setDate(x.getDate() + 1); x.setHours(0, 0, 0, 0);
    var t1 = x.getTime();
    return { t0: t0, t1: t1, minutes: Math.round((t1 - t0) / 60000) };
  }
  var SUN_ANGLES = { official: -0.833, civil: -6, nautical: -12, astronomical: -18 };

  function sunTimes(date, lat, lon) {
    var b = dayBounds(date), t0 = b.t0, H = b.minutes / 60;
    var f = function (d) { return sunPosition(d, lat, lon).alt; };
    var out = {}, k, c, i, rise, setT;
    for (k in SUN_ANGLES) {
      if (!SUN_ANGLES.hasOwnProperty(k)) continue;
      c = crossings(t0, H, 4, f, SUN_ANGLES[k]);
      rise = null; setT = null;
      for (i = 0; i < c.length; i++) { if (c[i].type === 'rise') { rise = c[i].t; break; } }
      for (i = 0; i < c.length; i++) { if (c[i].type === 'set') { setT = c[i].t; } } /* l'ULTIMO set del giorno */
      out[k] = { rise: rise, set: setT };
    }
    var cul = culmination(t0, H, f);
    out.transit = cul.time; out.maxAlt = cul.alt;
    var r = out.official.rise, s = out.official.set;
    out.dayLength = (r && s) ? (s - r) / 3600000 : (out.maxAlt > -0.833 ? 24 : 0);
    return out;
  }
  function moonTimes(date, lat, lon) {
    var b = dayBounds(date), t0 = b.t0, H = b.minutes / 60;
    var f = function (d) { var p = moonPosition(d, lat, lon); return p.altApp + 0.2725 * p.parallax; };
    var c = crossings(t0, H, 4, f, 0);
    var cul = culmination(t0, H, function (d) { return moonPosition(d, lat, lon).altApp; });
    var rise = null, set = null, i;
    for (i = 0; i < c.length; i++) { if (c[i].type === 'rise') { rise = c[i].t; break; } } /* il PRIMO rise del giorno */
    for (i = 0; i < c.length; i++) { if (c[i].type === 'set') { set = c[i].t; break; } }   /* il PRIMO set del giorno */
    return { rise: rise, set: set, transit: cul.time, maxAlt: cul.alt, alwaysUp: !rise && !set && cul.alt > 0 };
  }
  function track(date, lat, lon, body, stepMin, minutes) {
    if (stepMin == null) stepMin = 8;
    var b = dayBounds(date), t0 = b.t0;
    if (minutes == null) minutes = b.minutes;
    var pts = [], n = Math.ceil(minutes / stepMin);
    var f = body === 'moon' ? moonPosition : sunPosition;
    var i, t, p;
    for (i = 0; i <= n; i++) {
      t = t0 + i * stepMin * 60000;
      p = f(new Date(t), lat, lon);
      pts.push({ t: t, alt: p.alt, az: p.az });
    }
    return pts;
  }

  /* ---- scala della condizione di luce: sei stati, codifica un fatto
     astronomico (l'altezza del sole), non e' decorazione — resta
     identica nei tre temi (come le zone XTE). colDay: eccezione per il
     solo tema chiaro, bianco e giallo su fondo chiaro hanno contrasto
     1.2 (spariscono), non e' una scelta di gusto. */
  var LUCE = [
    { label: 'Pieno giorno',           col: '#ffffff', colDay: '#2b3840' },
    { label: 'Sole basso',             col: '#ffd21e', colDay: '#b58100' },
    { label: 'Crepuscolo civile',      col: '#3aa0f0' },
    { label: 'Crepuscolo nautico',     col: '#1fae63' },
    { label: 'Crepuscolo astronomico', col: '#cf3020' },
    { label: 'Notte piena',            col: '#4668e8' }
  ];
  function lightLevel(alt) {
    return alt > 6 ? 0 : alt > -0.833 ? 1 : alt > -6 ? 2 : alt > -12 ? 3 : alt > -18 ? 4 : 5;
  }
  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function lightAt(date, lat, lon) {
    var s = sunPosition(date, lat, lon), m = moonPosition(date, lat, lon);
    var il = moonIllumination(date);
    var level = lightLevel(s.alt);
    var label = LUCE[level].label, col = LUCE[level].col;
    var moonUp = m.alt > 0;
    var lunar = moonUp ? Math.pow(il.fraction, 1.4) * sin(Math.max(m.alt, 0) * RAD) : 0;
    var moonLabel = !moonUp ? "luna sotto l'orizzonte"
      : lunar < 0.03 ? 'luce lunare trascurabile'
      : lunar < 0.12 ? 'luce lunare scarsa'
      : lunar < 0.3 ? 'luce lunare discreta' : 'luce lunare buona';
    return { sun: s, moon: m, il: il, level: level, label: label, col: col, moonUp: moonUp, lunar: lunar, moonLabel: moonLabel };
  }

  /* ---- passaggio di luce piu' vicino, per la riga "arrivi X min
     prima/dopo ...". E' il dato che trasforma l'informazione in una
     scelta: non "in che fascia arrivi" ma quanto ti separa dal cambio.

     Il confine da guardare dipende dal VERSO del sole, non solo dalla
     fascia: la stessa altezza di -6 gradi la sera e' la FINE del
     crepuscolo civile, la mattina ne e' l'INIZIO. Trattarle allo stesso
     modo produceva frasi false all'alba (corretto 22/08).

     sera (sole che scende, ETA dopo il transito) -> confine verso il buio
     mattina (sole che sale, ETA prima del transito) -> confine verso la luce
     In pieno giorno si guarda sempre al tramonto: e' il passaggio che
     interessa a chi naviga, anche se mancano ore.
     Oltre il crepuscolo nautico nessun conto alla rovescia: non aiuta. */
  var SOGLIA = {
    tramonto:    { prima: 'del tramonto',                         dopo: 'il tramonto' },
    alba:        { prima: "dell'alba",                            dopo: "l'alba" },
    fineCivile:  { prima: 'della fine del crepuscolo civile',     dopo: 'la fine del crepuscolo civile' },
    fineNautico: { prima: 'della fine del crepuscolo nautico',    dopo: 'la fine del crepuscolo nautico' },
    inizioCivile:{ prima: "dell'inizio del crepuscolo civile",    dopo: "l'inizio del crepuscolo civile" },
    fineAstro:   { prima: 'della fine del crepuscolo astronomico', dopo: 'la fine del crepuscolo astronomico' },
    inizioNautico:{prima: "dell'inizio del crepuscolo nautico",   dopo: "l'inizio del crepuscolo nautico" }
  };
  function nextThreshold(sTimes, level, etaMs) {
    /* livello 5 = notte piena: non c'e' nessun confine successivo prima
       dell'alba astronomica del giorno dopo, il conto non aiuta. Il
       livello 4 invece un confine ce l'ha, e al mattino e' molto utile
       (esteso su richiesta 27/08: prima si fermava al nautico e il
       ripiego testuale dei moduli affermava "sole sotto i -18" anche a
       -13, contraddicendo la fascia dichiarata). */
    if (level >= 5) return null;
    var transitMs = sTimes.transit ? sTimes.transit.getTime() : null;
    var evening = transitMs == null ? true : etaMs >= transitMs;
    var key, target;
    if (level === 0) { key = 'tramonto'; target = sTimes.official.set; }
    else if (evening) {
      if (level === 1) { key = 'tramonto'; target = sTimes.official.set; }
      else if (level === 2) { key = 'fineCivile'; target = sTimes.civil.set; }
      else if (level === 3) { key = 'fineNautico'; target = sTimes.nautical.set; }
      else { key = 'fineAstro'; target = sTimes.astronomical.set; }
    } else {
      if (level === 1 || level === 2) { key = 'alba'; target = sTimes.official.rise; }
      else if (level === 3) { key = 'inizioCivile'; target = sTimes.civil.rise; }
      else { key = 'inizioNautico'; target = sTimes.nautical.rise; }
    }
    if (!target) return null;
    var deltaMin = (etaMs - target.getTime()) / 60000;
    return { prima: SOGLIA[key].prima, dopo: SOGLIA[key].dopo,
             time: target, deltaMin: deltaMin, before: deltaMin < 0 };
  }
  /* "185 min prima del tramonto" non si legge: oltre l'ora e mezza si passa a ore. */
  function durata(min) {
    min = Math.round(Math.abs(min));
    if (min < 90) return min + ' min';
    var h = Math.floor(min / 60), m = min % 60;
    return m ? (h + 'h ' + m + 'm') : (h + 'h');
  }
  /* alert fattuale, non un voto travestito: sole sotto -12 gradi e
     contributo lunare trascurabile (stessa soglia di lightAt). */
  function arrivoAlBuio(eta) { return eta.sun.alt < -12 && eta.lunar < 0.03; }

  var CARD_NAMES = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  function cardDir(az) { return CARD_NAMES[Math.round(norm360(az) / 22.5) % 16]; }
  function phaseName(p) {
    if (p < 0.03 || p > 0.97) return 'Luna nuova';
    if (p < 0.22) return 'Falce crescente';
    if (p < 0.28) return 'Primo quarto';
    if (p < 0.47) return 'Gibbosa crescente';
    if (p < 0.53) return 'Luna piena';
    if (p < 0.72) return 'Gibbosa calante';
    if (p < 0.78) return 'Ultimo quarto';
    return 'Falce calante';
  }
  function distNm(a, b) {
    var dLat = (b.lat - a.lat) * RAD, dLon = (b.lon - a.lon) * RAD;
    var x = Math.pow(sin(dLat / 2), 2) + cos(a.lat * RAD) * cos(b.lat * RAD) * Math.pow(sin(dLon / 2), 2);
    return 2 * asin(Math.min(1, Math.sqrt(x))) * 6371 / 1.852;
  }

  window.rfAstro = {
    RAD: RAD, DEG: DEG, SUN_ANGLES: SUN_ANGLES, LUCE: LUCE,
    dayStart: dayStart, dayBounds: dayBounds,
    sunPosition: sunPosition, moonPosition: moonPosition, moonIllumination: moonIllumination,
    sunTimes: sunTimes, moonTimes: moonTimes, track: track,
    lightLevel: lightLevel, lightAt: lightAt, rgba: rgba,
    nextThreshold: nextThreshold, arrivoAlBuio: arrivoAlBuio, durata: durata,
    cardDir: cardDir, phaseName: phaseName, distNm: distNm
  };
})();
