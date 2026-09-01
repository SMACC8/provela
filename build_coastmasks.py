#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Rigenera le 9 maschere terra/mare di routing/coastmasks/ dalle land polygons
di OpenStreetMap.

    python3 build_coastmasks.py [percorso/land_polygons]   # senza estensione

Perche' questa sorgente e non Overpass. Overpass restituisce i tratti grezzi di
`natural=coastline`: pezzi di linea, non una costa. Vanno cuciti, chiusi e
controllati, ed e' li' che il giro del 21/07 ha lasciato dei buchi - in Basso
Adriatico mancava piu' terra di quanta ne fosse riconosciuta (Dalmazia sud,
Curzola, Montenegro, Albania), e per il router quella era mare aperto. Le land
polygons sono lo STESSO dato OSM gia' cucito, chiuso e validato da OSMCoastline,
rigenerato ogni giorno: https://osmdata.openstreetmap.de/data/land-polygons.html

Due uscite per zona, come prima:
  bits  = griglia terra/mare, 200 colonne, celle quadrate in gradi. La usa il
          router (isLand, coastDistField).
  rings = la linea di costa, semplificata, che la carta disegna come "costa
          modello". NON sono piu' poligoni chiusi: dove la costa esce dal
          riquadro il ritaglio produce catene aperte. Prima erano chiuse dal
          ritaglio poligonale, che pero' correva lungo i bordi del riquadro e
          quelle righe dritte finivano disegnate come se fossero costa.
"""
import base64, json, math, os, struct, sys

ZONE = {   # unione dei ZONE_BOX di routing/ e carta/ (Alto Tirreno: lonW 7.50)
    "alto-adriatico":  {"latN": 45.85, "latS": 44.35, "lonW": 12.15, "lonE": 15.95},
    "medio-adriatico": {"latN": 44.95, "latS": 41.50, "lonW": 12.15, "lonE": 16.70},
    "basso-adriatico": {"latN": 43.40, "latS": 40.00, "lonW": 15.10, "lonE": 20.30},
    "mar-ionio":       {"latN": 40.55, "latS": 36.60, "lonW": 14.60, "lonE": 19.60},
    "basso-tirreno":   {"latN": 41.80, "latS": 37.70, "lonW": 11.80, "lonE": 16.70},
    "alto-tirreno":    {"latN": 44.20, "latS": 40.80, "lonW":  7.50, "lonE": 11.95},
    "mar-ligure":      {"latN": 44.60, "latS": 43.10, "lonW":  7.40, "lonE": 10.20},
    "sardegna":        {"latN": 41.50, "latS": 38.70, "lonW":  7.90, "lonE": 12.00},
    "sicilia":         {"latN": 38.70, "latS": 36.30, "lonW": 11.80, "lonE": 15.80},
}
# Lato della cella in gradi, uguale per tutte le zone (prima erano 200 colonne
# fisse, quindi la cella cambiava da 0.014 a 0.026 gradi a seconda della zona).
# Il tetto utile lo detta il router, non la carta: hitsLand() campiona la terra
# ogni 0.4 M = 741 m, quindi una maschera piu' fine di cosi' descrive isolotti
# che il passo di campionamento salta. A 0.010 gradi la cella misura 815 x 1113 m
# a 43N e 889 x 1113 m a 37N: sempre sopra i 741 m, quindi qualunque singola
# cella di terra attraversata viene per forza colpita da un campione.
CELL_DEG = 0.010
DP_TOL  = 0.00036      # semplificazione degli anelli, ~40 m: come prima
MIN_LEN = 0.00020      # catene piu' corte di ~22 m: scarti del ritaglio, non costa
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "routing", "coastmasks")
DEFAULT_SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                           "land-polygons-complete-4326", "land_polygons")

# ---------------------------------------------------------------- lettura .shp
def read_polygons(base, box):
    """Anelli dei poligoni (shapeType 5) il cui riquadro tocca `box`.

    Il riquadro sta nell'intestazione di ogni record, quindi i poligoni che non
    servono si saltano senza leggerne i punti. Il test su ENTRAMBI gli assi e'
    lecito anche per il conteggio di parita' piu' sotto: un poligono chiuso
    tutto a ovest del riquadro attraversa una data latitudine un numero PARI di
    volte, quindi non cambia la parita' di nessuna colonna dentro il riquadro.
    """
    import numpy as np
    f = open(base + ".shp", "rb")
    f.seek(24); total = struct.unpack(">i", f.read(4))[0] * 2
    f.seek(100)
    rings, kept, seen = [], 0, 0
    while f.tell() < total:
        head = f.read(8)
        if len(head) < 8: break
        _num, clen = struct.unpack(">ii", head)
        body = f.read(clen * 2); seen += 1
        if struct.unpack("<i", body[0:4])[0] != 5: continue
        xmin, ymin, xmax, ymax = struct.unpack("<4d", body[4:36])
        if xmax < box["lonW"] or xmin > box["lonE"] or ymax < box["latS"] or ymin > box["latN"]:
            continue
        nparts, npts = struct.unpack("<ii", body[36:44])
        parts = struct.unpack("<%di" % nparts, body[44:44 + 4 * nparts])
        off = 44 + 4 * nparts
        pts = np.frombuffer(body, dtype="<f8", count=2 * npts, offset=off).reshape(-1, 2)
        for i in range(nparts):
            a = parts[i]; b = parts[i + 1] if i + 1 < nparts else npts
            if b - a < 4: continue
            r = pts[a:b]
            rings.append((r, (r[:, 0].min(), r[:, 0].max(), r[:, 1].min(), r[:, 1].max())))
        kept += 1
    f.close()
    print("  record letti %d, poligoni tenuti %d, anelli %d" % (seen, kept, len(rings)))
    return rings

# ------------------------------------------------------------------- griglia
def rasterize(rings, z, w, h):
    """Riempimento even-odd per scanline: identico a rasterMask() nel modulo,
    cosi' la maschera nuova si comporta come quella che sostituisce.

    Due scarti leciti, che tolgono di mezzo quasi tutto il mondo:
    - un anello CHIUSO tutto a ovest (o tutto a est) del riquadro taglia una data
      latitudine un numero PARI di volte, quindi non cambia la parita' dentro;
    - un singolo segmento tutto a est di lonE produce un attraversamento che
      nessuna colonna del riquadro conta mai (si contano solo quelli a sinistra).
    Restano solo i segmenti che tagliano la fascia di latitudine della zona.
    """
    import bisect
    import numpy as np
    latN, latS, lonW, lonE = z["latN"], z["latS"], z["lonW"], z["lonE"]
    rows = [[] for _ in range(h)]
    for r, bb in rings:
        if bb[1] < lonW or bb[0] > lonE or bb[3] < latS or bb[2] > latN: continue
        y1 = r[:-1, 1]; y2 = r[1:, 1]; x1 = r[:-1, 0]; x2 = r[1:, 0]
        sel = ((np.maximum(y1, y2) > latS) & (np.minimum(y1, y2) < latN) &
               (y1 != y2) & (np.minimum(x1, x2) <= lonE))
        if not sel.any(): continue
        y1 = y1[sel]; y2 = y2[sel]; x1 = x1[sel]; x2 = x2[sel]
        r0 = np.clip(np.floor((latN - np.maximum(y1, y2)) / (latN - latS) * h).astype(np.int64), 0, h - 1)
        r1 = np.clip(np.floor((latN - np.minimum(y1, y2)) / (latN - latS) * h).astype(np.int64), 0, h - 1)
        for k in range(len(y1)):
            e = (y1[k], y2[k], x1[k], x2[k])
            for row in range(r0[k], r1[k] + 1): rows[row].append(e)
    bits = bytearray((w * h + 7) // 8)
    for row in range(h):
        if not rows[row]: continue
        lat = latN - (row + 0.5) / h * (latN - latS)
        xs = []
        for ya, yb, xa, xb in rows[row]:
            if (ya <= lat < yb) or (yb <= lat < ya):
                xs.append(xa + (lat - ya) / (yb - ya) * (xb - xa))
        if not xs: continue
        xs.sort()
        base = row * w
        for c in range(w):
            lon = lonW + (c + 0.5) / w * (lonE - lonW)
            if bisect.bisect_left(xs, lon) & 1:
                i = base + c; bits[i >> 3] |= 1 << (i & 7)
    return bits

# --------------------------------------------------------------- linea di costa
def clip_chains(ring, z):
    """Ritaglia un anello sul riquadro e restituisce le catene interne, APERTE.
    Solo i segmenti candidati (riquadro che tocca la zona) passano dal ciclo
    Python: su un poligono continentale sono qualche migliaio su milioni."""
    import numpy as np
    latN, latS, lonW, lonE = z["latN"], z["latS"], z["lonW"], z["lonE"]
    x1 = ring[:-1, 0]; y1 = ring[:-1, 1]; x2 = ring[1:, 0]; y2 = ring[1:, 1]
    cand = ((np.maximum(x1, x2) >= lonW) & (np.minimum(x1, x2) <= lonE) &
            (np.maximum(y1, y2) >= latS) & (np.minimum(y1, y2) <= latN))
    idx = np.nonzero(cand)[0]
    if not len(idx): return []
    out, cur, prev = [], [], -2
    for k in idx:
        seg = _clip_seg((x1[k], y1[k]), (x2[k], y2[k]), lonW, lonE, latS, latN)
        if seg is None:
            if len(cur) > 1: out.append(cur)
            cur = []; prev = -2; continue
        a, b = seg
        if cur and k == prev + 1 and _near(cur[-1], a): cur.append(b)
        else:
            if len(cur) > 1: out.append(cur)
            cur = [a, b]
        prev = k
    if len(cur) > 1: out.append(cur)
    return out

def _clip_seg(p, q, x0, x1, y0, y1):
    dx, dy = q[0] - p[0], q[1] - p[1]
    t0, t1 = 0.0, 1.0
    for pp, qq in ((-dx, p[0] - x0), (dx, x1 - p[0]), (-dy, p[1] - y0), (dy, y1 - p[1])):
        if pp == 0:
            if qq < 0: return None
        else:
            r = qq / pp
            if pp < 0:
                if r > t1: return None
                if r > t0: t0 = r
            else:
                if r < t0: return None
                if r < t1: t1 = r
    return ((p[0] + t0 * dx, p[1] + t0 * dy), (p[0] + t1 * dx, p[1] + t1 * dy))

def _near(a, b, eps=1e-12):
    return abs(a[0] - b[0]) < eps and abs(a[1] - b[1]) < eps

def dp(line, tol):
    """Douglas-Peucker iterativo: ricorsivo sfonda lo stack sulle coste lunghe."""
    n = len(line)
    if n < 3: return line[:]
    keep = [False] * n; keep[0] = keep[n - 1] = True
    stack = [(0, n - 1)]
    while stack:
        a, b = stack.pop()
        if b <= a + 1: continue
        ax, ay = line[a]; bx, by = line[b]
        dx, dy = bx - ax, by - ay
        den = dx * dx + dy * dy
        worst, wi = -1.0, -1
        for i in range(a + 1, b):
            px, py = line[i]
            if den == 0: d = math.hypot(px - ax, py - ay)
            else:
                t = ((px - ax) * dx + (py - ay) * dy) / den
                t = 0.0 if t < 0 else (1.0 if t > 1 else t)
                d = math.hypot(px - ax - t * dx, py - ay - t * dy)
            if d > worst: worst, wi = d, i
        if worst > tol:
            keep[wi] = True; stack.append((a, wi)); stack.append((wi, b))
    return [line[i] for i in range(n) if keep[i]]

def length_deg(l):
    return sum(math.hypot(l[i + 1][0] - l[i][0], l[i + 1][1] - l[i][1]) for i in range(len(l) - 1))

def main():
    src = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SRC
    if src.lower().endswith(".shp"): src = src[:-4]
    union = {"latN": max(z["latN"] for z in ZONE.values()),
             "latS": min(z["latS"] for z in ZONE.values()),
             "lonW": min(z["lonW"] for z in ZONE.values()),
             "lonE": max(z["lonE"] for z in ZONE.values())}
    print("sorgente: %s" % src)
    print("riquadro unione: lon %.2f..%.2f lat %.2f..%.2f" % (union["lonW"], union["lonE"], union["latS"], union["latN"]))
    rings = read_polygons(src, union)
    for slug, z in ZONE.items():
        w = int(round((z["lonE"] - z["lonW"]) / CELL_DEG))
        h = int(round((z["latN"] - z["latS"]) / CELL_DEG))
        bits = rasterize(rings, z, w, h)
        land = sum(bin(b).count("1") for b in bits)
        chains = []
        for r, bb in rings:
            if bb[1] < z["lonW"] or bb[0] > z["lonE"] or bb[3] < z["latS"] or bb[2] > z["latN"]: continue
            for ch in clip_chains(r, z):
                s = dp(ch, DP_TOL)
                if len(s) >= 2 and length_deg(s) >= MIN_LEN:
                    chains.append([[round(p[0], 4), round(p[1], 4)] for p in s])
        out = {"w": w, "h": h, "latN": z["latN"], "latS": z["latS"],
               "lonW": z["lonW"], "lonE": z["lonE"],
               "bits": base64.b64encode(bytes(bits)).decode(),
               "rings": chains}
        path = os.path.join(OUT_DIR, slug + ".json")
        with open(path, "w") as f: json.dump(out, f, separators=(",", ":"))
        print("  %-16s %4dx%-4d terra %6d/%-6d catene %5d  punti %7d  %6.1f KB" % (
            slug, w, h, land, w * h, len(chains),
            sum(len(c) for c in chains), os.path.getsize(path) / 1024))

if __name__ == "__main__":
    main()
