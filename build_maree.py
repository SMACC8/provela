#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ritaglia il modello globale di marea EOT20 nel pacchetto che rf-maree.js
carica a bordo.

    python3 build_maree.py [percorso/ocean_tides]

dove ocean_tides e' la cartella con i NetCDF di EOT20, uno per costituente
(M2_ocean_eot20.nc, S2_ocean_eot20.nc, ...). NON e' nel repository: sono
1,3 GB, si scaricano una volta da SEANOE. La procedura sta in maree/LEGGIMI.md.

    EOT20 - Hart-Davis M. G., Piccioni G., Dettmering D., Schwatke C.,
    Passaro M., Seitz F. (2021). EOT20 - A global Ocean Tide model from
    multi-mission satellite altimetry. SEANOE. doi:10.17882/79489 (CC BY 4.0)

Cosa fa, e perche' cosi':

1. RITAGLIA sul riquadro dei mari italiani. Il globo intero sono 1,3 GB e a
   bordo non serve: il riquadro sta in 400 kB.

2. TIENE 10 COSTITUENTI su 17. Via le lunghe periodo (SA, SSA, MM, MF): sono
   stagionali, muovono il livello medio di centimetri nell'arco di mesi e sulla
   DERIVATA oraria — che e' cio' per cui esiste questo modulo — non incidono.
   Via 2N2, J1, T2, che sono correzioni fini all'ampiezza. Resta M4, che e'
   piccola sul livello ma pesa il doppio sulla derivata (vedi rf-maree.js).

3. SALVA COMPONENTI, NON AMPIEZZA E FASE. A bordo si interpola fra quattro
   nodi: interpolare le fasi e' sbagliato (sono angoli, e vicino a un punto
   anfidromico ruotano di 360 gradi in poche celle). In componenti reale e
   immaginaria l'interpolazione e' lineare e corretta ovunque. EOT20 le
   contiene gia' (variabili 'real' e 'imag', in cm), quindi non si passa
   nemmeno da un seno e un coseno: si prende cio' che c'e'.

4. LA TERRA HA UN FLAG SUO. Nei file EOT20 la terra e' scritta come zero
   (_FillValue = 0.0). Zero pero' e' anche un'ampiezza legittima: nei punti
   anfidromici la marea si annulla davvero. Qui la terra finisce in una
   maschera a parte, un byte per cella, e il runtime la distingue senza
   dover indovinare.
"""
import json, os, struct, sys, time

COSTITUENTI = ["M2", "S2", "N2", "K2", "K1", "O1", "P1", "Q1", "M4", "S1"]

# Riquadro dei mari italiani. Non e' uno ZONE_BOX di routing/: quelli sono
# nove riquadri di zona vento, questo e' uno solo e li contiene tutti.
BBOX = {"lonW": 6.0, "lonE": 19.5, "latS": 35.0, "latN": 46.0}
PASSO = 0.125                     # griglia EOT20, 1/8 di grado
SCALA_MM = 0.1                   # una unita' int16 = 0,1 mm
USCITA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "maree")


def leggi(nc_path):
    """amplitude/real/imag di un file EOT20. netCDF4 e' l'unica dipendenza."""
    from netCDF4 import Dataset
    d = Dataset(nc_path)
    d.set_auto_mask(False)         # la terra e' 0.0, la vogliamo vedere come 0.0
    return d


def main():
    sorgente = sys.argv[1] if len(sys.argv) > 1 else "ocean_tides"
    if not os.path.isdir(sorgente):
        sys.exit("Cartella non trovata: %s\nPassa il percorso della cartella "
                 "ocean_tides di EOT20 (vedi maree/LEGGIMI.md)." % sorgente)

    # --- controllo di presenza, prima di leggere un solo byte
    attesi, mancanti = {}, []
    for c in COSTITUENTI:
        p = os.path.join(sorgente, "%s_ocean_eot20.nc" % c)
        if os.path.exists(p):
            attesi[c] = p
        else:
            mancanti.append(c)
    if mancanti:
        sys.exit("Costituenti mancanti in %s: %s\nEOT20 ne contiene 17; se il "
                 "pacchetto e' parziale il modulo non va costruito a meta'."
                 % (sorgente, ", ".join(mancanti)))
    print("Costituenti trovate: %s" % ", ".join(COSTITUENTI))

    # --- indici del ritaglio, presi dalla griglia del primo file
    d0 = leggi(attesi["M2"])
    lat = d0["lat"][:]
    lon = d0["lon"][:]
    passo = round(float(lat[1] - lat[0]), 6)
    if abs(passo - PASSO) > 1e-9:
        sys.exit("Passo della griglia inatteso: %s (atteso %s)" % (passo, PASSO))

    iy0 = int(round((BBOX["latS"] - float(lat[0])) / passo))
    iy1 = int(round((BBOX["latN"] - float(lat[0])) / passo))
    ix0 = int(round((BBOX["lonW"] - float(lon[0])) / passo))
    ix1 = int(round((BBOX["lonE"] - float(lon[0])) / passo))
    ny, nx = iy1 - iy0 + 1, ix1 - ix0 + 1
    print("Riquadro %.3f-%.3f E, %.3f-%.3f N -> %d x %d = %d celle"
          % (BBOX["lonW"], BBOX["lonE"], BBOX["latS"], BBOX["latN"], nx, ny, nx * ny))
    # il ritaglio deve cadere sui nodi della griglia, altrimenti l'interpolazione
    # a bordo userebbe un'origine sfasata di mezza cella e nessuno se ne
    # accorgerebbe rileggendo il codice
    assert abs(float(lon[ix0]) - BBOX["lonW"]) < 1e-9, "origine lon fuori griglia"
    assert abs(float(lat[iy0]) - BBOX["latS"]) < 1e-9, "origine lat fuori griglia"

    # --- lettura
    nc = len(COSTITUENTI)
    re = [None] * nc
    im = [None] * nc
    for k, c in enumerate(COSTITUENTI):
        d = d0 if c == "M2" else leggi(attesi[c])
        re[k] = d["real"][iy0:iy1 + 1, ix0:ix1 + 1].astype("float64")
        im[k] = d["imag"][iy0:iy1 + 1, ix0:ix1 + 1].astype("float64")
        amax = float(abs(re[k] + 1j * im[k]).max())
        print("  %-3s letta, ampiezza massima nel riquadro %6.1f cm" % (c, amax))
        if c != "M2":
            d.close()

    # --- maschera terra/mare
    # Una cella e' terra se e' zero in TUTTE le costituenti. Zero in una sola
    # e' possibile davvero (punto anfidromico di quella costituente): usare M2
    # da sola marcherebbe come terra dei punti di mare aperto.
    import numpy as np
    somma = np.zeros((ny, nx))
    for k in range(nc):
        somma += np.abs(re[k]) + np.abs(im[k])
    mask = (somma > 0).astype("uint8")
    acqua = int(mask.sum())
    print("Mare: %d celle su %d (%.1f%%)" % (acqua, nx * ny, 100.0 * acqua / (nx * ny)))
    if acqua < nx * ny * 0.30:
        sys.exit("Meno del 30%% di mare nel riquadro dei mari italiani: il "
                 "ritaglio e' sbagliato, non si scrive un pacchetto cosi'.")

    # --- quantizzazione in mm
    # cm -> unita' da SCALA_MM millimetri. Con passo da 1 mm il valore piu'
    # grande del riquadro sarebbe 271 su 32767 disponibili: si buttano via
    # cinque bit su sedici, e l'errore di quantizzazione (mezzo millimetro per
    # componente, su dieci costituenti) diventa il termine dominante nello
    # scarto da EOT20. Con passo da 0,1 mm il valore massimo e' 2710, sempre
    # comodo, e l'errore scende di dieci volte a parita' di byte. Il fattore
    # sta nell'header: il runtime non lo sa e non deve saperlo.
    q = np.zeros((ny, nx, nc, 2), dtype="int32")
    for k in range(nc):
        q[:, :, k, 0] = np.rint(re[k] * 10.0 / SCALA_MM)
        q[:, :, k, 1] = np.rint(im[k] * 10.0 / SCALA_MM)
    picco = int(np.abs(q).max())
    print("Valore quantizzato massimo: %d (limite int16 32767)" % picco)
    if picco > 32767:
        sys.exit("Overflow int16: alzare SCALA_MM.")
    # errore introdotto dalla quantizzazione, misurato e non dichiarato
    err = 0.0
    for k in range(nc):
        err = max(err, float(np.abs(q[:, :, k, 0] * SCALA_MM / 10.0 - re[k]).max()),
                       float(np.abs(q[:, :, k, 1] * SCALA_MM / 10.0 - im[k]).max()))
    print("Errore massimo di quantizzazione: %.4f cm per componente" % err)

    # --- scrittura
    # Ordine: maschera (uint8, riga per riga da sud a nord), poi i dati, per
    # cella e dentro la cella per costituente (re, im). Per cella e non per
    # costituente perche' a bordo si leggono quattro celle vicine con TUTTE le
    # costituenti: cosi' sono quattro letture contigue invece di quaranta.
    if not os.path.isdir(USCITA):
        os.makedirs(USCITA)
    bin_path = os.path.join(USCITA, "eot20-italia.bin")
    with open(bin_path, "wb") as f:
        f.write(mask.tobytes(order="C"))
        f.write(q.astype("<i2").tobytes(order="C"))
    dimensione = os.path.getsize(bin_path)

    hdr = {
        "formato": "dritta-maree-1",
        "fonte": "EOT20 (Hart-Davis et al. 2021, SEANOE doi:10.17882/79489, CC BY 4.0)",
        "generato": time.strftime("%Y-%m-%d"),
        "generato_da": "build_maree.py",
        "bbox": BBOX,
        "passo": passo,
        "nx": nx, "ny": ny,
        "origine": "sud-ovest: la cella 0 e' (latS, lonW), x cresce verso est, y verso nord",
        "costituenti": COSTITUENTI,
        "componenti": "reale e immaginaria, int16 little endian, re = A cos(g), im = A sin(g)",
        "scala_mm": SCALA_MM,
        "unita": "millimetri sul livello medio del mare",
        "offset_mask": 0,
        "offset_dati": nx * ny,
        "bin": "eot20-italia.bin",
        "byte": dimensione
    }
    with open(os.path.join(USCITA, "eot20-italia.json"), "w") as f:
        json.dump(hdr, f, indent=1)

    print("\nScritto %s" % bin_path)
    print("Payload: %d byte (%.1f kB) = maschera %d kB + dati %d kB"
          % (dimensione, dimensione / 1024.0, nx * ny // 1024, nx * ny * nc * 4 // 1024))


if __name__ == "__main__":
    main()
