#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ritaglia le isobate master (shapefile EMODnet v2) nei 9 pacchetti per zona vento
che routing/ e carta/ caricano a richiesta.

    python3 build_isobate.py [percorso/isobate_ITALIA_v2]   # senza estensione

Due cose che il ritaglio precedente non faceva, e per cui esiste questo script:

1. I riquadri. I ZONE_BOX di quattro zone erano stati allargati il 21/07 (Alto
   Tirreno, Medio Adriatico, Basso Tirreno, Sardegna) ma le isobate no: restavano
   ritagliate sui riquadri vecchi, quindi Vasto, il Gargano, Anzio e il canale di
   Sardegna erano dentro la zona e senza fondali. Qui i riquadri sono UNO solo,
   l'unione di quelli di routing/ e di carta/ (differiscono su Alto Tirreno:
   lonW 7.50 contro 9.00), piu' un MARGINE di sovrapposizione: le zone si
   accavallano e passando un confine i fondali non spariscono per un istante.

2. Le lagune. EMODnet e' un dato scientifico interpolato: dentro Marano, Grado e
   Venezia produce contorni che non sono fondali navigabili ma rumore, e che a
   video sembrano isobate vere in mezzo alla terra. I tratti che cadono dentro i
   poligoni LAGUNE vengono tolti (non i contorni interi: un solo contorno -5
   corre da Venezia a Grado passando dentro e fuori le lagune).

I poligoni delle lagune sono disegnati a mano: il lato di mare segue la linea dei
lidi - Lido/Pellestrina/Sottomarina a Venezia, Bibione/Lignano/Grado in Friuli -
e il lato di terra sta largo, molto oltre la costa, dove isobate non ce ne sono
comunque. La precisione serve solo sul lato di mare, ed e' li' che va verificata
guardandoli sulla carta.
"""
import json, math, os, struct, sys

# ---------------------------------------------------------------- lettura .shp
def read_shp(base):
    """Polilinee (shapeType 3) + campo depth dal .dbf. Solo cio' che serve qui."""
    shp = open(base + ".shp", "rb").read()
    dbf = open(base + ".dbf", "rb").read()
    nrec, hlen, rlen = (struct.unpack("<i", dbf[4:8])[0],
                        struct.unpack("<h", dbf[8:10])[0],
                        struct.unpack("<h", dbf[10:12])[0])
    p, flds = 32, []
    while dbf[p] != 0x0D:
        flds.append((dbf[p:p + 11].split(b"\0")[0].decode(), chr(dbf[p + 11]), dbf[p + 16]))
        p += 32
    attrs = []
    for i in range(nrec):
        row, q, rec = dbf[hlen + i * rlen: hlen + (i + 1) * rlen], 1, {}
        for name, typ, ln in flds:
            v = row[q:q + ln].decode("latin-1").strip(); q += ln
            if typ == "N":
                try: v = int(v)
                except ValueError:
                    try: v = float(v)
                    except ValueError: v = None
            rec[name] = v
        attrs.append(rec)
    out, pos, k = [], 100, 0
    while pos < len(shp):
        _num, clen = struct.unpack(">ii", shp[pos:pos + 8]); pos += 8
        body = shp[pos:pos + clen * 2]; pos += clen * 2
        if struct.unpack("<i", body[0:4])[0] != 3:      # null shape: consuma l'attributo
            k += 1; continue
        nparts, npts = struct.unpack("<ii", body[36:44])
        parts = struct.unpack("<%di" % nparts, body[44:44 + 4 * nparts])
        pts = struct.unpack("<%dd" % (2 * npts), body[44 + 4 * nparts: 44 + 4 * nparts + 16 * npts])
        for pi in range(nparts):
            a = parts[pi]; b = parts[pi + 1] if pi + 1 < nparts else npts
            out.append((attrs[k], [(pts[2 * j], pts[2 * j + 1]) for j in range(a, b)]))
        k += 1
    return out

# ------------------------------------------------------------------- geometria
def clip_rect(line, box):
    """Spezza una polilinea sui bordi del riquadro (Liang-Barsky per segmento).
    Restituisce la lista dei tratti interni, ricuciti dove si toccano."""
    x0, x1, y0, y1 = box["lonW"], box["lonE"], box["latS"], box["latN"]
    def clip_seg(p, q):
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
    pieces, cur = [], []
    for i in range(len(line) - 1):
        s = clip_seg(line[i], line[i + 1])
        if s is None:
            if len(cur) > 1: pieces.append(cur)
            cur = []; continue
        a, b = s
        if cur and _near(cur[-1], a): cur.append(b)
        else:
            if len(cur) > 1: pieces.append(cur)
            cur = [a, b]
    if len(cur) > 1: pieces.append(cur)
    return pieces

def _near(a, b, eps=1e-9):
    return abs(a[0] - b[0]) < eps and abs(a[1] - b[1]) < eps

def inside(pt, poly):
    """Ray casting. poly = lista di (lon,lat), chiusura implicita."""
    x, y, c, n = pt[0], pt[1], False, len(poly)
    j = n - 1
    for i in range(n):
        xi, yi = poly[i]; xj, yj = poly[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            c = not c
        j = i
    return c

def subtract_poly(line, poly):
    """Toglie da una polilinea le parti che cadono dentro il poligono.
    Ogni segmento e' spezzato sulle intersezioni col bordo, poi ogni pezzo e'
    tenuto o buttato in base al suo punto medio: niente casi limite sui vertici."""
    out, cur, n = [], [], len(poly)
    for i in range(len(line) - 1):
        p, q = line[i], line[i + 1]
        dx, dy = q[0] - p[0], q[1] - p[1]
        ts = [0.0, 1.0]
        j = n - 1
        for k in range(n):
            a, b = poly[k], poly[j]; j = k
            ex, ey = b[0] - a[0], b[1] - a[1]
            den = dx * ey - dy * ex
            if den == 0: continue
            t = ((a[0] - p[0]) * ey - (a[1] - p[1]) * ex) / den
            u = ((a[0] - p[0]) * dy - (a[1] - p[1]) * dx) / den
            if 0.0 < t < 1.0 and 0.0 <= u <= 1.0: ts.append(t)
        ts = sorted(set(ts))
        for k in range(len(ts) - 1):
            t0, t1 = ts[k], ts[k + 1]
            if t1 - t0 < 1e-12: continue
            aa = (p[0] + t0 * dx, p[1] + t0 * dy)
            bb = (p[0] + t1 * dx, p[1] + t1 * dy)
            mid = ((aa[0] + bb[0]) / 2, (aa[1] + bb[1]) / 2)
            if inside(mid, poly):
                if len(cur) > 1: out.append(cur)
                cur = []
            else:
                if cur and _near(cur[-1], aa): cur.append(bb)
                else:
                    if len(cur) > 1: out.append(cur)
                    cur = [aa, bb]
    if len(cur) > 1: out.append(cur)
    return out

def length_deg(line):
    return sum(math.hypot(line[i + 1][0] - line[i][0], line[i + 1][1] - line[i][1])
               for i in range(len(line) - 1))

def bbox_hit(line, box, m):
    xs = [p[0] for p in line]; ys = [p[1] for p in line]
    return not (max(xs) < box["lonW"] - m or min(xs) > box["lonE"] + m or
                max(ys) < box["latS"] - m or min(ys) > box["latN"] + m)

def poly_bbox(poly):
    xs = [p[0] for p in poly]; ys = [p[1] for p in poly]
    return min(xs), max(xs), min(ys), max(ys)

# ----------------------------------------------------------------------- dati
# Unione dei ZONE_BOX di routing/raffyca-traversata-map.html e carta/index.html.
# Differiscono solo su Alto Tirreno (lonW 7.50 in routing, 9.00 in carta): vale
# il piu' largo, cosi' un unico pacchetto serve tutti e due i moduli.
ZONE_BOX = {
    "alto_adriatico":  {"latN": 45.85, "latS": 44.35, "lonW": 12.15, "lonE": 15.95},
    "medio_adriatico": {"latN": 44.95, "latS": 41.50, "lonW": 12.15, "lonE": 16.70},
    "basso_adriatico": {"latN": 43.40, "latS": 40.00, "lonW": 15.10, "lonE": 20.30},
    "mar_ionio":       {"latN": 40.55, "latS": 36.60, "lonW": 14.60, "lonE": 19.60},
    "basso_tirreno":   {"latN": 41.80, "latS": 37.70, "lonW": 11.80, "lonE": 16.70},
    "alto_tirreno":    {"latN": 44.20, "latS": 40.80, "lonW":  7.50, "lonE": 11.95},
    "mar_ligure":      {"latN": 44.60, "latS": 43.10, "lonW":  7.40, "lonE": 10.20},
    "sardegna":        {"latN": 41.50, "latS": 38.70, "lonW":  7.90, "lonE": 12.00},
    "sicilia":         {"latN": 38.70, "latS": 36.30, "lonW": 11.80, "lonE": 15.80},
}

# Sovrapposizione fra zone confinanti, in gradi (~17 km in latitudine).
MARGIN = 0.15

# Lato di mare disegnato sulla linea dei lidi, lato di terra volutamente largo.
LAGUNE = {
    "Laguna di Venezia": [
        (12.3300, 45.1750), (12.3080, 45.2000), (12.2950, 45.2250), (12.2930, 45.2420),
        (12.2980, 45.2600), (12.3080, 45.2900), (12.3230, 45.3250), (12.3300, 45.3420),
        (12.3550, 45.3620), (12.3900, 45.3900), (12.4230, 45.4180), (12.4290, 45.4400),
        (12.4800, 45.4620), (12.5400, 45.4780), (12.6200, 45.4920),
        (12.6400, 45.5600), (12.4000, 45.5900), (12.2000, 45.5000),
        (12.1000, 45.4000), (12.1000, 45.2500), (12.2500, 45.1500),
    ],
    "Laguna di Marano e Grado": [
        (12.9800, 45.6450), (13.0400, 45.6330), (13.0900, 45.6420), (13.1400, 45.6720),
        (13.1550, 45.6870), (13.2000, 45.6930), (13.2450, 45.6980), (13.3000, 45.6900),
        (13.3600, 45.6800), (13.4200, 45.6900), (13.4800, 45.7050), (13.5300, 45.7150),
        (13.5400, 45.8200), (13.3000, 45.8400), (13.0000, 45.8200), (12.9400, 45.7000),
    ],
}

# Sotto questa lunghezza un tratto e' un ritaglio di scarto, non un'isobata (~200 m).
MIN_LEN = 0.002
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "routing", "isobate")
DEFAULT_SRC = os.path.expanduser(
    "~/Documents/Sergio/Varie/Nautica/Cartografia/Batimetria/"
    "isobate_ITALIA_v2_shapefile/isobate_ITALIA_v2")

def main():
    src = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SRC
    if src.lower().endswith(".shp"): src = src[:-4]
    feats = read_shp(src)
    print("sorgente: %s  (%d contorni)" % (src, len(feats)))
    lag = [(name, poly, poly_bbox(poly)) for name, poly in LAGUNE.items()]
    tot_removed = 0
    for slug, box in ZONE_BOX.items():
        big = {"latN": box["latN"] + MARGIN, "latS": box["latS"] - MARGIN,
               "lonW": box["lonW"] - MARGIN, "lonE": box["lonE"] + MARGIN}
        out, removed = [], 0
        for attr, line in feats:
            if len(line) < 2 or not bbox_hit(line, box, MARGIN): continue
            parts = clip_rect(line, big)
            kept = []
            for pc in parts:
                chunks = [pc]
                for _name, poly, pb in lag:
                    nxt = []
                    for ch in chunks:
                        cx = [p[0] for p in ch]; cy = [p[1] for p in ch]
                        if max(cx) < pb[0] or min(cx) > pb[1] or max(cy) < pb[2] or min(cy) > pb[3]:
                            nxt.append(ch); continue          # fuori dal riquadro della laguna
                        res = subtract_poly(ch, poly)
                        if len(res) != 1 or len(res[0]) != len(ch): removed += 1
                        nxt.extend(res)
                    chunks = nxt
                for ch in chunks:
                    if len(ch) >= 2 and length_deg(ch) >= MIN_LEN:
                        kept.append([[round(p[0], 4), round(p[1], 4)] for p in ch])
            if kept:
                out.append({"type": "Feature", "properties": {"depth": attr["depth"]},
                            "geometry": {"type": "MultiLineString", "coordinates": kept}})
        path = os.path.join(OUT_DIR, "isobate_%s.geojson" % slug)
        with open(path, "w") as f:
            json.dump({"type": "FeatureCollection", "features": out}, f, separators=(",", ":"))
        tot_removed += removed
        print("  %-16s %4d contorni  %4d tratti  %7.1f KB  (%d tagli laguna)" % (
            slug, len(out), sum(len(f["geometry"]["coordinates"]) for f in out),
            os.path.getsize(path) / 1024, removed))
    print("tagli laguna totali: %d" % tot_removed)

if __name__ == "__main__":
    main()
