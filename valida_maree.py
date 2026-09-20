#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Validazione del modulo maree. Non prova il livello: prova la DERIVATA.

    python3 valida_maree.py --modello [percorso/ocean_tides]
    python3 valida_maree.py --ispra [--giorni 60] [--fine 2026-09-18]

Perche' la derivata e non il livello. Un RMSE di pochi centimetri sul livello
sembra un buon risultato e puo' convivere con mezz'ora di errore sull'istante
in cui la marea gira — che e' l'unico numero per cui questo modulo esiste.
Vicino alla stanca il livello e' piatto: sbagliare di un centimetro li' vuol
dire sbagliare di venti minuti. Quindi si confrontano le pendenze e gli
istanti di inversione, e si accetta che il livello sia solo informativo.

Due prove, indipendenti fra loro.

--modello  Il motore JS contro EOT20 a piena precisione, con gli argomenti
           astronomici di pyTMD. Misura cosa hanno tolto la quantizzazione in
           int16, l'interpolazione bilineare e le formule nodali di Schureman
           rispetto alla sorgente. Non serve rete ne' osservazioni: e' la
           prova che il pacchetto a bordo dice quello che dice EOT20.
           Richiede netCDF4 e pyTMD, e i NetCDF di EOT20.

--ispra    Il motore JS contro il mare vero: livelli osservati dai mareografi
           della Rete Mareografica Nazionale (ISPRA). Misura cosa resta
           quando ci si mette anche la meteorologia. Richiede rete.

In entrambi i casi gira il codice VERO, rf-maree.js, dentro JavaScriptCore:
una riscrittura in Python proverebbe la riscrittura, non cio' che va a bordo.
"""
import calendar, json, math, os, subprocess, sys, tempfile, time
import urllib.request

QUI = os.path.dirname(os.path.abspath(__file__))
JSC = ("/System/Library/Frameworks/JavaScriptCore.framework/Versions/"
       "Current/Helpers/jsc")

# Le quattro stazioni chieste, piu' due di controllo in mare aperto.
# I codici sono quelli con cui la RMN pubblica i propri mareografi sul
# servizio IOC (vedi maree/LEGGIMI.md per la questione della fonte).
# Velocita' angolari in gradi/ora, le stesse di rf-maree.js.
VEL = {"M2": 28.9841042, "S2": 30.0, "N2": 28.4397295, "K2": 30.0821373,
       "K1": 15.0410686, "O1": 13.9430356, "P1": 14.9589314, "Q1": 13.3986609,
       "M4": 57.9682084, "S1": 15.0}

# Giorni di osservazione che servono a separare ogni costituente dalla sua
# vicina piu' stretta (criterio di Rayleigh: un giro intero del battimento).
BATTIMENTO = {"M2": 14.8, "S2": 14.8, "N2": 27.6, "O1": 13.7, "Q1": 27.6,
              "M4": 14.8, "K1": 182.6, "P1": 182.6, "K2": 182.6, "S1": 365.2}

STAZIONI = [
    {"nome": "Trieste",  "code": "TR22", "lat": 45.6544, "lon": 13.7561},
    {"nome": "Venezia",  "code": "VE19", "lat": 45.4182, "lon": 12.4265},
    {"nome": "Ancona",   "code": "AN15", "lat": 43.6248, "lon": 13.5065},
    {"nome": "Cagliari", "code": "CA02", "lat": 39.2101, "lon": 9.1142},
]

# ------------------------------------------------------------------ motore JS

HARNESS = r"""
var window = {}, XMLHttpRequest = function () {};
load(BASE + '/rf-maree.js');
var M = window.rfMaree;
var hdr = JSON.parse(readFile(BASE + '/maree/eot20-italia.json'));
var raw = readFile(BASE + '/maree/eot20-italia.bin', 'binary');
M._installa(hdr, raw.buffer);
var job = JSON.parse(readFile(JOB));
var out = [];
for (var i = 0; i < job.punti.length; i++) {
  var p = job.punti[i], s = [];
  for (var k = 0; k < job.tempi.length; k++) {
    var v = M._valuta(M._interpola(p.lat, p.lon), job.tempi[k]);
    s.push([v.h, v.d * 100]);
  }
  var t = null;
  if (job.stanche) {
    t = [];
    for (var k2 = 0; k2 < job.stanche.length; k2++) {
      var r = M.tide(p.lat, p.lon, new Date(job.stanche[k2]), {});
      t.push(r.next_slack ? [r.next_slack.timeUTC.getTime(), r.next_slack.type,
                             r.confidence] : null);
    }
  }
  var c = null;
  if (job.componenti) { var q = M._interpola(p.lat, p.lon); c = { re: q.re, im: q.im }; }
  out.push({ nome: p.nome, serie: s, stanche: t, comp: c });
}
var arg = null;
if (job.argomenti) {
  arg = { v: [], f: [], vel: [] };
  var nomi = M._nomi();
  for (var z = 0; z < nomi.length; z++) arg.vel.push(M._COST[nomi[z]].vel);
  arg.nomi = nomi;
  for (var k3 = 0; k3 < job.tempi.length; k3++) {
    var a3 = M._argomenti(job.tempi[k3]);
    arg.v.push(a3.v); arg.f.push(a3.f);
  }
}
print(JSON.stringify({ punti: out, arg: arg }));
"""


def motore_js(punti, tempi_ms, stanche_ms=None, componenti=False, argomenti=False):
    """Esegue rf-maree.js su una lista di punti e istanti. Ritorna, per punto,
    la serie [livello_m, derivata_cm_h], e su richiesta le componenti
    interpolate e gli argomenti astronomici (che servono allo script per
    costruire la matrice dell'analisi armonica con le STESSE fasi del
    motore: e' l'unico modo perche' il confronto sia fra le stesse cose)."""
    if not os.path.exists(JSC):
        sys.exit("JavaScriptCore non trovato in %s.\nSu macOS c'e' di serie; "
                 "altrove si puo' usare node con lo stesso harness." % JSC)
    job = {"punti": punti, "tempi": tempi_ms,
           "stanche": stanche_ms if stanche_ms else None,
           "componenti": componenti, "argomenti": argomenti}
    d = tempfile.mkdtemp()
    jp = os.path.join(d, "job.json")
    hp = os.path.join(d, "harness.js")
    open(jp, "w").write(json.dumps(job))
    open(hp, "w").write("var BASE=%s, JOB=%s;\n%s" % (json.dumps(QUI), json.dumps(jp), HARNESS))
    r = subprocess.run([JSC, hp], capture_output=True)
    if r.returncode != 0:
        sys.exit("jsc ha fallito:\n" + r.stderr.decode() + r.stdout.decode()[:2000])
    fuori = json.loads(r.stdout.decode())
    return fuori if (componenti or argomenti) else fuori["punti"]


# --------------------------------------------------------- prova 1: modello

def prova_modello(sorgente):
    try:
        import numpy as np
        from netCDF4 import Dataset
        import pyTMD.arguments as PA
    except ImportError as e:
        sys.exit("Questa prova vuole numpy, netCDF4 e pyTMD: %s" % e)

    cost = ["M2", "S2", "N2", "K2", "K1", "O1", "P1", "Q1", "M4", "S1"]
    punti = [dict(p) for p in STAZIONI] + [
        {"nome": "medio Adriatico", "lat": 43.00, "lon": 14.50},
        {"nome": "Tirreno centrale", "lat": 40.50, "lon": 12.50},
        {"nome": "Canale di Sicilia", "lat": 36.50, "lon": 12.50},
        {"nome": "Golfo di Genova", "lat": 44.10, "lon": 8.90},
    ]

    # --- riferimento: EOT20 a piena precisione, bilineare sulle componenti
    print("Lettura EOT20 a piena precisione...")
    comp = {p["nome"]: {"re": [], "im": []} for p in punti}
    for c in cost:
        d = Dataset(os.path.join(sorgente, "%s_ocean_eot20.nc" % c))
        d.set_auto_mask(False)
        lat = d["lat"][:]; lon = d["lon"][:]
        re = d["real"]; im = d["imag"]
        for p in punti:
            fx = (p["lon"] - lon[0]) / 0.125; fy = (p["lat"] - lat[0]) / 0.125
            ix = int(math.floor(fx)); iy = int(math.floor(fy))
            tx = fx - ix; ty = fy - iy
            R = re[iy:iy + 2, ix:ix + 2]; I = im[iy:iy + 2, ix:ix + 2]
            w = np.array([[(1 - tx) * (1 - ty), tx * (1 - ty)],
                          [(1 - tx) * ty, tx * ty]])
            if not (np.abs(R) + np.abs(I) == 0).any():
                comp[p["nome"]]["re"].append(float((R * w).sum()))
                comp[p["nome"]]["im"].append(float((I * w).sum()))
            else:
                # Un nodo e' terra: si rifa' qui la stessa regola di ripiego
                # del runtime (media 1/distanza sui nodi d'acqua entro 2
                # celle). Attenzione a cosa prova questo confronto: non che
                # la regola sia quella giusta — e' la stessa da tutte e due
                # le parti — ma che il pacchetto quantizzato e impacchettato
                # la applichi agli stessi numeri di EOT20. Che la regola sia
                # buona lo dice solo il confronto con gli osservati.
                num_r = num_i = peso = 0.0
                for dy in range(-2, 3):
                    for dx in range(-2, 3):
                        jy, jx = iy + dy, ix + dx
                        rr = float(re[jy, jx]); ii = float(im[jy, jx])
                        if rr == 0.0 and ii == 0.0:
                            continue
                        dd = math.hypot(jx - fx, jy - fy)
                        ww = 1.0 / max(dd, 1e-6)
                        num_r += ww * rr; num_i += ww * ii; peso += ww
                if peso == 0:
                    comp[p["nome"]]["re"].append(None)
                    comp[p["nome"]]["im"].append(None)
                else:
                    comp[p["nome"]]["re"].append(num_r / peso)
                    comp[p["nome"]]["im"].append(num_i / peso)
        d.close()

    # 30 giorni a passo di 10 minuti: copre il ciclo sinodico (sizigie e
    # quadrature) e il giro di M2 contro S2.
    t0 = 1772323200000   # 2026-03-01 00:00 UTC, fisso: la prova dev'essere ripetibile
    n = 30 * 24 * 6
    tempi = [t0 + k * 600000 for k in range(n + 1)]

    print("Calcolo con rf-maree.js (pacchetto quantizzato)...")
    js = {r["nome"]: r for r in motore_js(punti, tempi)}

    mjd = np.array([t / 86400000.0 + 40587.0 for t in tempi])
    # corrections='FES': EOT20 e' un modello di famiglia FES/GOT, e le due
    # famiglie non usano la stessa convenzione su S1 (180 gradi contro 90).
    # Con la convenzione sbagliata l'errore e' un centimetro sul livello e
    # oltre un'ora sulla stanca dove la marea e' piccola: e' esattamente il
    # tipo di errore che questa prova esiste per prendere.
    pu, pf, G = PA.arguments(mjd, [c.lower() for c in cost],
                             deltat=0.0, corrections="FES")
    th = np.radians(G) + pu                    # V0 + u, radianti

    print("\n%-18s  %8s  %9s  %9s  %8s" %
          ("punto", "dh max", "drate max", "rate rms", "stanca"))
    print("%-18s  %8s  %9s  %9s  %8s" % ("", "(cm)", "(cm/h)", "(cm/h)", "(min)"))
    peggio_st = 0.0
    for p in punti:
        nome = p["nome"]
        if comp[nome]["re"][0] is None:
            print("%-18s  nessun nodo d'acqua entro 2 celle" % nome)
            continue
        re = np.array(comp[nome]["re"]); im = np.array(comp[nome]["im"])
        h_ref = ((pf * (re * np.cos(th) + im * np.sin(th))).sum(axis=1)) / 100.0   # m
        w = np.radians([VEL[c] for c in cost])
        d_ref = ((pf * w * (-re * np.sin(th) + im * np.cos(th))).sum(axis=1))      # cm/h

        s = np.array(js[nome]["serie"])
        dh = np.abs(s[:, 0] * 100 - h_ref * 100).max()
        dr = np.abs(s[:, 1] - d_ref).max()
        rms = float(np.sqrt(((s[:, 1] - d_ref) ** 2).mean()))

        # istanti di inversione: zeri della derivata, interpolati linearmente
        def zeri(y, t):
            z = []
            for i in range(len(y) - 1):
                if y[i] == 0 or (y[i] < 0) != (y[i + 1] < 0):
                    f = abs(y[i]) / (abs(y[i]) + abs(y[i + 1]))
                    z.append(t[i] + f * (t[i + 1] - t[i]))
            return z
        za = zeri(s[:, 1], tempi); zb = zeri(d_ref, tempi)
        dz = 0.0
        if za and zb:
            for x in zb:
                dz = max(dz, min(abs(x - y) for y in za) / 60000.0)
        peggio_st = max(peggio_st, dz)
        print("%-18s  %8.3f  %9.3f  %9.3f  %8.2f" % (nome, dh, dr, rms, dz))

    print("\nScarto massimo sull'istante di stanca: %.2f minuti." % peggio_st)
    print("Qualche minuto e' normale e non e' un errore del pacchetto: dove la\n"
          "marea e' piccola la derivata sfiora lo zero quasi tangente, e uno\n"
          "scarto di un centesimo di cm/h sposta l'attraversamento di parecchio.\n"
          "Se invece salta a mezz'ora e oltre su TUTTI i punti, la convenzione\n"
          "di fase di qualche costituente non corrisponde piu' (vedi S1).")


# ----------------------------------------------------------- prova 2: ISPRA

def scarica_ispra(code, t_da, t_a):
    """Livelli osservati, a pezzi di 7 giorni. Il servizio taglia le
    richieste lunghe senza dirlo, quindi non se ne fanno di lunghe."""
    fuori = []
    t = t_da
    while t < t_a:
        t2 = min(t + 7 * 86400, t_a)
        url = ("https://www.ioc-sealevelmonitoring.org/service.php?query=data"
               "&code=%s&timestart=%s&timestop=%s&format=json"
               % (code, time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime(t)),
                  time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime(t2))))
        for tentativo in range(4):
            try:
                with urllib.request.urlopen(url, timeout=120) as r:
                    d = json.loads(r.read().decode())
                break
            except Exception as e:
                if tentativo == 3:
                    raise
                time.sleep(3)
        if isinstance(d, dict):
            d = []
        for riga in d:
            if "slevel" not in riga or "stime" not in riga:
                continue
            ts = time.strptime(riga["stime"][:19], "%Y-%m-%d %H:%M:%S")
            # timegm e non mktime: il servizio pubblica in UTC, e mktime
            # leggerebbe l'ora come locale applicando anche l'ora legale.
            # Sbagliare qui costa un'ora tonda di sfasamento e la si
            # scambia per un ritardo idraulico della stazione.
            fuori.append((calendar.timegm(ts), float(riga["slevel"])))
        t = t2
    fuori.sort()
    return fuori


def prova_ispra(giorni, fine):
    try:
        import numpy as np
    except ImportError:
        sys.exit("Questa prova vuole numpy.")

    t_a = calendar.timegm(time.strptime(fine, "%Y-%m-%d"))
    t_da = t_a - giorni * 86400
    print("Finestra: %s -> %s (%d giorni)\n"
          % (time.strftime("%Y-%m-%d", time.gmtime(t_da)), fine, giorni))

    SOGLIA = 2.0        # cm/h, la stessa banda morta del modulo
    PASSO = 5           # minuti fra un confronto e l'altro
    MAXSH = 120         # minuti di sfasamento esplorati, in piu' e in meno
    righe = []

    for st in STAZIONI:
        print("== %s (%s)" % (st["nome"], st["code"]))
        oss = scarica_ispra(st["code"], t_da, t_a)
        if len(oss) < 1000:
            print("   dati insufficienti (%d campioni), saltata\n" % len(oss))
            continue

        # --- al minuto, media dei campioni caduti nello stesso minuto
        m0, m1 = oss[0][0] // 60, oss[-1][0] // 60
        n = m1 - m0 + 1
        somma = np.zeros(n); conta = np.zeros(n)
        for t, v in oss:
            somma[t // 60 - m0] += v; conta[t // 60 - m0] += 1
        buono = conta > 0
        y = np.zeros(n); y[buono] = somma[buono] / conta[buono]
        idx = np.arange(n)
        y = np.interp(idx, idx[buono], y[buono])
        print("   %d campioni -> %d minuti, %.1f%% con dato vero"
              % (len(oss), n, 100.0 * buono.mean()))

        # minuti troppo lontani da un dato vero: non si usano. Interpolare un
        # buco lungo e poi derivarlo vuol dire misurare la propria retta.
        dist_prima = np.zeros(n); u = -10 ** 9
        for i in range(n):
            if buono[i]: u = i
            dist_prima[i] = i - u
        dist_dopo = np.zeros(n); u = 10 ** 9
        for i in range(n - 1, -1, -1):
            if buono[i]: u = i
            dist_dopo[i] = u - i
        usabile = np.minimum(dist_prima, dist_dopo) <= 15

        # --- passa-basso a 30 minuti, a FASE NULLA
        # Finestra di Hann simmetrica: non sposta gli istanti. Un filtro
        # ricorsivo applicato una volta sola li sposterebbe di minuti, e sono
        # proprio i minuti che questa prova deve misurare.
        L = 31
        w = np.hanning(L + 2)[1:-1]; w /= w.sum()
        f = np.convolve(y, w, mode="same")

        # --- derivata osservata: retta ai minimi quadrati su +/-15 minuti.
        # Sul livello filtrato una differenza centrale stretta lascia passare
        # il respiro delle sesse (a Trieste e Venezia ci sono, e hanno periodi
        # di ore): la pendenza di una retta su mezz'ora e' la stessa cosa in
        # piu' robusto, e resta a fase nulla perche' la finestra e' simmetrica.
        K = 15
        tt = np.arange(-K, K + 1, dtype=float)
        coef = tt / (tt ** 2).sum()                 # pendenza per minuto
        d_oss = np.convolve(f, coef[::-1], mode="same") * 60.0 * 100.0   # cm/h
        bordo = max(L, 2 * K + 1)
        usabile[:bordo] = False; usabile[-bordo:] = False

        # --- modello sugli stessi minuti, allargato per poter sfasare
        sel = np.arange(bordo, n - bordo, PASSO)
        tempi = [int((m0 + int(i)) * 60) * 1000 for i in sel]
        estesi = [t - MAXSH * 60000 for t in tempi] + tempi + [t + MAXSH * 60000 for t in tempi]
        js_tutto = motore_js([{"nome": st["nome"], "lat": st["lat"], "lon": st["lon"]}],
                             sorted(set(estesi)), componenti=True, argomenti=True)
        js = js_tutto["punti"]
        t_mod = np.array(sorted(set(estesi)), dtype=float)
        d_mod = np.array(js[0]["serie"])[:, 1]
        t_cmp = np.array(tempi, dtype=float)

        def modello_a(shift_min):
            """derivata del modello negli istanti t - shift (cm/h). Gli
            sfasamenti sono multipli del passo della griglia, quindi
            l'interpolazione cade sui nodi e non aggiunge errore."""
            return np.interp(t_cmp - shift_min * 60000.0, t_mod, d_mod)

        d_o = d_oss[sel]
        vivo = usabile[sel]

        # --- stanche osservate: solo quelle VERE.
        # Uno zero della derivata conta come stanca se prima e dopo la marea
        # esce dalla banda morta: altrimenti e' il mare che respira attorno
        # allo zero, e a Cagliari, dove l'escursione e' di pochi centimetri,
        # di zeri finti ce ne sono dieci volte piu' che di stanche.
        def stanche(t_ms, d, vivi):
            """Zeri della derivata con marea viva prima e dopo: uno zero
            dentro la banda morta da entrambi i lati non e' una stanca, e'
            una marea che non c'e'."""
            fuori = []
            finestra = max(1, 120 // PASSO)
            for i in range(len(d) - 1):
                if not (vivi[i] and vivi[i + 1]): continue
                if (d[i] < 0) == (d[i + 1] < 0): continue
                a0 = max(0, i - finestra); b0 = min(len(d), i + finestra + 2)
                prima, dopo = d[a0:i + 1], d[i + 1:b0]
                if len(prima) == 0 or len(dopo) == 0: continue
                if np.abs(prima).max() < SOGLIA or np.abs(dopo).max() < SOGLIA: continue
                fr = abs(d[i]) / (abs(d[i]) + abs(d[i + 1]))
                fuori.append((t_ms[i] + fr * (t_ms[i + 1] - t_ms[i]),
                              "AM" if d[i] > 0 else "BM"))
            return fuori

        def stanche_marea(t_ms, liv, d, vivi):
            """Come sopra, ma su serie al minuto e con due vincoli in piu':
            almeno 3 ore fra una stanca e l'altra, e almeno 5 cm di
            escursione dal colmo precedente. Sotto quella soglia la marea
            non ha un verso riconoscibile e chiedersi quando gira non ha
            senso."""
            grezze = []
            for i in range(len(d) - 1):
                if not (vivi[i] and vivi[i + 1]): continue
                if (d[i] < 0) == (d[i + 1] < 0): continue
                fr = abs(d[i]) / (abs(d[i]) + abs(d[i + 1]))
                grezze.append((t_ms[i] + fr * (t_ms[i + 1] - t_ms[i]),
                               "AM" if d[i] > 0 else "BM", liv[i]))
            fuori = []
            for (t, tipo, lv) in grezze:
                if fuori:
                    tp, tipop, lvp = fuori[-1]
                    if t - tp < 3 * 3600 * 1000: continue
                    if abs(lv - lvp) < 0.05: continue
                fuori.append((t, tipo, lv))
            return [(t, tipo) for (t, tipo, lv) in fuori]

        # Le stanche OSSERVATE non si cercano sulla derivata filtrata a 30
        # minuti: a quella scala il mare vero ha sesse e onde lunghe che
        # attraversano lo zero decine di volte al giorno (a Cagliari, dove
        # l'escursione astronomica e' di pochi centimetri, quaranta volte).
        # Non sono stanche di marea, e appaiarle a quelle calcolate vuol
        # dire misurare il rumore. Per trovarle si usa un secondo filtro, a
        # 3 ore, che lascia passare solo la marea. Il confronto dei SEGNI
        # resta invece sulla serie filtrata a 30 minuti, come da specifica.
        L2 = 181
        w2 = np.hanning(L2 + 2)[1:-1]; w2 /= w2.sum()
        f2 = np.convolve(y, w2, mode="same")
        d2 = np.convolve(f2, coef[::-1], mode="same") * 60.0 * 100.0
        usab2 = usabile.copy(); usab2[:L2] = False; usab2[-L2:] = False
        st_oss = stanche_marea(np.array([(m0 + int(i)) * 60000 for i in range(n)]),
                               f2, d2, usab2)

        # --- concordanza di segno al variare dello sfasamento
        lontano = vivo.copy()
        for (tz, _t) in st_oss:
            lontano &= np.abs(np.array(tempi) - tz) > 30 * 60 * 1000
        def concordanza(shift, solo_deciso=False):
            dm = modello_a(shift)
            m = lontano & (np.abs(dm) >= SOGLIA) if solo_deciso else lontano
            if m.sum() == 0: return float("nan")
            return float((np.sign(dm[m]) == np.sign(d_o[m])).mean() * 100)

        prove = [(concordanza(sh), sh) for sh in range(-MAXSH, MAXSH + 1, PASSO)]
        c0 = concordanza(0)
        cdec = concordanza(0, True)     # solo dove il modulo dichiara una tendenza
        cbest, shbest = max(prove)

        def errori_stanca(shift, rif=None):
            dm = modello_a(shift)
            st_mod = stanche(tempi, dm, vivo)
            e = []
            for (tz, tipo) in (rif if rif is not None else st_oss):
                vic = [(tm - tz) / 60000.0 for (tm, t2) in st_mod
                       if t2 == tipo and abs(tm - tz) < 90 * 60 * 1000]
                if vic: e.append(min(vic, key=abs))
            return np.array(e)

        # ---------------------------------------------------------------
        # Quanto di cio' che resta e' errore del modello, e quanto e' mare
        # che il modello non puo' conoscere? Si separa cosi': si analizza
        # armonicamente l'OSSERVATO sulle stesse dieci costituenti e con le
        # stesse fasi astronomiche del motore, e si ottiene "la marea che
        # c'e' davvero qui". Poi si confronta il motore con quella, invece
        # che con il livello grezzo.
        #   - motore contro marea osservata: errore del modello (griglia,
        #     interpolazione, fase). E' cio' che delta_min puo' correggere.
        #   - marea osservata contro livello osservato: sovralzo, sesse,
        #     onde lunghe. Nessuna tabella lo corregge.
        tarr = np.array(sorted(set(estesi)), dtype=float)
        V = np.array(js_tutto["arg"]["v"])          # radianti, V0+u
        F = np.array(js_tutto["arg"]["f"])
        W = np.radians(np.array(js_tutto["arg"]["vel"]))
        nomi_c = js_tutto["arg"]["nomi"]
        # righe della matrice solo dove c'e' osservato buono
        ifit = np.searchsorted(tarr, t_cmp[vivo])
        A = np.zeros((len(ifit), 2 * len(nomi_c) + 1))
        A[:, -1] = 1.0
        for k in range(len(nomi_c)):
            A[:, 2 * k] = F[ifit, k] * np.cos(V[ifit, k])
            A[:, 2 * k + 1] = F[ifit, k] * np.sin(V[ifit, k])
        yfit = f[sel][vivo]                          # livello filtrato, metri
        sol, *_ = np.linalg.lstsq(A, yfit, rcond=None)
        re_oss = sol[0:-1:2]; im_oss = sol[1:-1:2]
        re_mod = np.array(js[0]["comp"]["re"]); im_mod = np.array(js[0]["comp"]["im"])

        # derivata della marea osservata, in forma chiusa come nel motore
        icmp = np.searchsorted(tarr, t_cmp)
        d_arm = ((F[icmp] * W * (-re_oss * np.sin(V[icmp]) + im_oss * np.cos(V[icmp])))
                 .sum(axis=1)) * 100.0
        conc_arm = float((np.sign(modello_a(0)[vivo]) == np.sign(d_arm[vivo])).mean() * 100)
        # quanto della varianza osservata e' marea
        h_arm = ((F[icmp] * (re_oss * np.cos(V[icmp]) + im_oss * np.sin(V[icmp])))
                 .sum(axis=1)) + sol[-1]
        res = f[sel][vivo] - h_arm[vivo]
        quota = 100.0 * (1 - res.var() / f[sel][vivo].var())

        # Si stampano solo le costituenti che una finestra di questa
        # lunghezza puo' davvero separare. M2 e S2 vogliono 15 giorni, N2
        # ventotto: con 60 giorni ci siamo. K1 e P1 ne vogliono 183, K2 e S2
        # altrettanti: in 60 giorni la stima di K1 si prende addosso P1 e S1
        # e ne esce un'ampiezza che non esiste in mare. Non e' un errore del
        # modello e non va letta come tale.
        # Secondo filtro, sul rapporto segnale/rumore: una costituente da
        # mezzo centimetro sta sotto il respiro del mare, e la sua fase
        # stimata e' un numero a caso (a Venezia M4 esce sfasata di un'ora e
        # tre quarti su un'ampiezza di 3 mm). Si stampano solo quelle che si
        # vedono davvero.
        risolvibili = [c for c in nomi_c if BATTIMENTO[c] <= giorni]
        print("   marea osservata (analisi armonica dell'osservato, %d giorni;"
              "\n   separabili in questa finestra: %s):"
              % (giorni, ", ".join(risolvibili)))
        saltate = []
        for k, c in enumerate(nomi_c):
            if c not in risolvibili: continue
            a_o = math.hypot(re_oss[k], im_oss[k]) * 100
            a_m = math.hypot(re_mod[k], im_mod[k]) * 100
            if max(a_o, a_m) < 1.5:
                saltate.append(c); continue
            g_o = math.degrees(math.atan2(im_oss[k], re_oss[k]))
            g_m = math.degrees(math.atan2(im_mod[k], re_mod[k]))
            dg = (g_o - g_m + 180) % 360 - 180
            print("     %-3s ampiezza %5.1f cm osservata contro %5.1f cm EOT20, "
                  "fase %+6.1f gradi = %+5.1f min"
                  % (c, a_o, a_m, dg, dg / VEL[c] * 60))
        if saltate:
            print("     (%s sotto 1,5 cm: la fase stimata sarebbe rumore, non "
                  "stampata)" % ", ".join(saltate))
        print("   la marea spiega il %.0f%% della varianza del livello osservato"
              % quota)
        print("   motore contro marea osservata: segno %.2f%% "
              "(qui il mare non astronomico e' gia' tolto)" % conc_arm)

        e0 = errori_stanca(0)
        eb = errori_stanca(shbest)
        # stanche della sola marea estratta dall'osservato: e' l'errore del
        # modello, senza il sovralzo che sposta i colmi veri
        st_arm = stanche(tempi, d_arm, vivo)
        ea = errori_stanca(0, st_arm)
        print("   stanche osservate: %d in %d giorni (%.1f al giorno)"
              % (len(st_oss), giorni, len(st_oss) / float(giorni)))
        print("   confronti utili: %d (esclusi i +/-30 min attorno alle stanche)"
              % int(lontano.sum()))
        print("   fuori dalla banda morta (dove il modulo si sbilancia): "
              "segno %.2f%%" % cdec)
        print("   senza calibrazione: segno %.2f%%   stanca: media %.1f min, "
              "massimo %.1f min, appaiate %d/%d"
              % (c0, float(np.mean(np.abs(e0))) if len(e0) else float("nan"),
                 float(np.max(np.abs(e0))) if len(e0) else float("nan"),
                 len(e0), len(st_oss)))
        print("   contro la sola marea osservata: stanca media %.1f min, "
              "massimo %.1f min, appaiate %d/%d"
              % (float(np.mean(np.abs(ea))) if len(ea) else float("nan"),
                 float(np.max(np.abs(ea))) if len(ea) else float("nan"),
                 len(ea), len(st_arm)))
        print("   sfasamento migliore: %+d min -> segno %.2f%%   stanca: "
              "media %.1f min, massimo %.1f min"
              % (shbest, cbest,
                 float(np.mean(np.abs(eb))) if len(eb) else float("nan"),
                 float(np.max(np.abs(eb))) if len(eb) else float("nan")))
        # delta_min = ritardo della marea vera rispetto alla griglia.
        # Il modello va valutato a t - delta_min, e lo sfasamento che qui
        # massimizza la concordanza e' proprio quello.
        print("   riga per la tabella di rf-maree.js:")
        print("     { nome: '%s', lat: %.4f, lon: %.4f, raggio_km: 15, delta_min: %d },"
              % (st["nome"], st["lat"], st["lon"], shbest))
        righe.append((st["nome"], c0, cdec, conc_arm, quota, shbest,
                      float(np.mean(np.abs(e0))) if len(e0) else float("nan"),
                      float(np.mean(np.abs(ea))) if len(ea) else float("nan"),
                      float(np.max(np.abs(ea))) if len(ea) else float("nan")))
        print()

    if righe:
        print("%-10s %7s %7s %8s %6s %6s %8s %8s %8s"
              % ("stazione", "segno", "deciso", "vs marea", "marea", "delta",
                 "st.oss", "st.marea", "st.max"))
        for r in righe:
            print("%-10s %6.1f%% %6.1f%% %7.1f%% %5.0f%% %+5d %6.1f m %6.1f m %6.1f m" % r)
        print("""
Come si leggono le colonne.
  segno      motore contro livello osservato, tutti i confronti utili
  deciso     solo dove il motore dichiara una tendenza (fuori dalla banda
             morta di 2 cm/h): dentro la banda il modulo dice \"stanca\" e
             non si sbilancia, contarlo come errore sarebbe scorretto
  vs marea   motore contro la sola MAREA estratta dall'osservato per analisi
             armonica: e' la misura dell'errore del MODELLO
  marea      quanta varianza del livello osservato e' marea; il resto e'
             sovralzo da vento, sesse, onde lunghe
  delta      sfasamento che massimizza la concordanza, da mettere in
             delta_min se e' grande e stabile
  st.oss     scarto sull'istante di inversione contro il livello osservato
  st.marea   lo stesso contro la sola marea estratta dall'osservato: qui il
             sovralzo non sposta piu' i colmi, e resta l'errore del modello
  st.max     il caso peggiore di st.marea

Obiettivo: concordanza sopra il 95%, errore sulla stanca sotto i 20 minuti.
La colonna che misura il modello e' \"vs marea\": la differenza fra quella e
\"segno\" e' mare che nessun calcolo astronomico puo' conoscere, ed e' il
motivo per cui esiste setMeteoWarning().""")


def main():
    a = sys.argv[1:]
    if "--modello" in a:
        i = a.index("--modello")
        sorgente = a[i + 1] if len(a) > i + 1 and not a[i + 1].startswith("--") else "ocean_tides"
        prova_modello(sorgente)
    if "--ispra" in a or not a:
        giorni = int(a[a.index("--giorni") + 1]) if "--giorni" in a else 60
        fine = a[a.index("--fine") + 1] if "--fine" in a else time.strftime("%Y-%m-%d", time.gmtime(time.time() - 86400))
        prova_ispra(giorni, fine)


if __name__ == "__main__":
    main()
