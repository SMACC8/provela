#!/usr/bin/env python3
"""Icone e schermata d'avvio dell'APK, ricavate dall'icona della PWA.

    python3 app/fai-icone.py            (dalla radice del worktree)

PERCHE' ESISTE. Il progetto Android che genera Capacitor arriva con le sue
icone di esempio: il lanciatore mostrava il robottino, e all'avvio compariva
il logo di Capacitor su fondo bianco. Dritta ha gia' la sua icona — la barca
su fondo blu di `pwa-maskable-512.png`, quella della PWA — e non ha senso
disegnarne un'altra: si riusa quella.

COSA PRODUCE (tutto sotto app/android/app/src/main/res/):
  mipmap-*/ic_launcher_foreground.png   la barca sola, con trasparenza
  mipmap-*/ic_launcher.png              icona piena, angoli arrotondati
  mipmap-*/ic_launcher_round.png        icona piena, ritaglio tondo
  drawable/ic_launcher_background.xml   il fondo blu, come sfumatura vettoriale
  drawable*/splash.png                  schermata d'avvio, 11 formati

COME SI SEPARA LA BARCA DAL FONDO. L'icona e' un PNG senza trasparenza: la
barca e' dipinta sopra la sfumatura. Il fondo pero' e' regolare e si descrive
con tre numeri — sfumatura radiale centrata a un quarto del lato, lineare
dal blu chiaro (26,55,90) al blu scuro (8,21,37) — quindi si ricostruisce e
si confronta. Dove il pixel e' piu' chiaro del fondo previsto, li' c'e'
disegno: la soglia produce il canale alfa, i colori restano quelli originali.
Errore massimo del modello di fondo, misurato sui pixel senza disegno: 8,6
su 255, ben sotto la soglia da cui l'alfa comincia a salire (12).

PERCHE' L'ICONA ADATTIVA VUOLE LA BARCA PIU' PICCOLA. Android disegna i due
strati su una tela di 108dp ma ne mostra solo i 72dp centrali, e il ritaglio
puo' essere tondo: quello che sta negli angoli sparisce. Nell'icona della PWA
la barca arriva a 0,348 del lato dal centro; qui viene rimpicciolita finche'
il suo raggio non sta dentro il cerchio sicuro (33dp su 108, cioe' 0,306).
Senza, le creste delle onde restavano fuori dal tondo.
"""
import math, os, sys
from PIL import Image, ImageDraw

RADICE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(RADICE, "app", "android", "app", "src", "main", "res")
SORGENTE = os.path.join(RADICE, "pwa-maskable-512.png")
QUADRATA = os.path.join(RADICE, "pwa-512.png")   # ha gia' gli angoli tondi

CHIARO, SCURO = (26, 55, 90), (8, 21, 37)
SOGLIA, RAMPA = 12.0, 22.0          # luminanza sopra il fondo: 12 -> 0, 34 -> 1


def luminanza(c):
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


def sfumatura(larg, alt, cx_f=0.25, cy_f=0.25):
    """Il fondo blu, ricostruito. cx_f/cy_f: dov'e' il punto piu' chiaro."""
    im = Image.new("RGB", (larg, alt))
    px = im.load()
    cx, cy = cx_f * larg, cy_f * alt
    raggio = max(math.hypot(x - cx, y - cy)
                 for x in (0, larg - 1) for y in (0, alt - 1))
    for y in range(alt):
        for x in range(larg):
            t = min(1.0, math.hypot(x - cx, y - cy) / raggio)
            px[x, y] = tuple(round(CHIARO[i] + (SCURO[i] - CHIARO[i]) * t)
                             for i in range(3))
    return im


def ritaglia_barca():
    """La barca sola, RGBA, ritagliata al suo riquadro. Torna anche il raggio
    del cerchio che la contiene, misurato dal centro del riquadro."""
    orig = Image.open(SORGENTE).convert("RGB")
    W, H = orig.size
    fondo = sfumatura(W, H)
    po, pf = orig.load(), fondo.load()
    fuori = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    pu = fuori.load()
    for y in range(H):
        for x in range(W):
            d = luminanza(po[x, y]) - luminanza(pf[x, y])
            a = 0.0 if d <= SOGLIA else min(1.0, (d - SOGLIA) / RAMPA)
            if a > 0:
                pu[x, y] = po[x, y] + (round(a * 255),)
    riq = fuori.getbbox()
    barca = fuori.crop(riq)
    bw, bh = barca.size
    pb = barca.load()
    cxb, cyb = bw / 2.0, bh / 2.0
    raggio = max(math.hypot(x + .5 - cxb, y + .5 - cyb)
                 for y in range(bh) for x in range(bw) if pb[x, y][3] > 96)
    return barca, raggio


def posa(tela, barca, raggio_barca, raggio_voluto, cx=None, cy=None):
    """Incolla la barca al centro della tela, scalata perche' il cerchio che
    la contiene misuri raggio_voluto."""
    k = raggio_voluto / raggio_barca
    b = barca.resize((max(1, round(barca.width * k)),
                      max(1, round(barca.height * k))), Image.LANCZOS)
    cx = tela.width / 2 if cx is None else cx
    cy = tela.height / 2 if cy is None else cy
    tela.alpha_composite(b, (round(cx - b.width / 2), round(cy - b.height / 2)))
    return tela


def scrivi(im, cartella, nome):
    d = os.path.join(RES, cartella)
    os.makedirs(d, exist_ok=True)
    im.save(os.path.join(d, nome))
    print("  " + cartella + "/" + nome + "  " + "x".join(map(str, im.size)))


FONDO_XML = """<?xml version="1.0" encoding="utf-8"?>
<!-- Il fondo dell'icona adattiva: la stessa sfumatura dell'icona della PWA,
     qui come vettore perche' un fondo liscio non ha bisogno di pixel e
     resta netto a ogni densita'. Generato da app/fai-icone.py. -->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:aapt="http://schemas.android.com/aapt"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path android:pathData="M0,0h108v108h-108z">
        <aapt:attr name="android:fillColor">
            <gradient
                android:type="radial"
                android:centerX="27"
                android:centerY="27"
                android:gradientRadius="114.55"
                android:startColor="#1A375A"
                android:endColor="#081525" />
        </aapt:attr>
    </path>
</vector>
"""

ADATTIVA_XML = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
"""

DENSITA = [("mdpi", 1), ("hdpi", 1.5), ("xhdpi", 2), ("xxhdpi", 3), ("xxxhdpi", 4)]
SPLASH = [("drawable", 480, 320), ("drawable-port-mdpi", 320, 480),
          ("drawable-port-hdpi", 480, 800), ("drawable-port-xhdpi", 720, 1280),
          ("drawable-port-xxhdpi", 960, 1600), ("drawable-port-xxxhdpi", 1280, 1920),
          ("drawable-land-mdpi", 480, 320), ("drawable-land-hdpi", 800, 480),
          ("drawable-land-xhdpi", 1280, 720), ("drawable-land-xxhdpi", 1600, 960),
          ("drawable-land-xxxhdpi", 1920, 1280)]


def main():
    if not os.path.exists(SORGENTE):
        sys.exit("manca " + SORGENTE)
    barca, raggio = ritaglia_barca()
    print("barca ritagliata: %dx%d, raggio %.1f" % (barca.width, barca.height, raggio))

    print("icona adattiva (lo strato davanti):")
    for nome, k in DENSITA:
        lato = round(108 * k)
        tela = Image.new("RGBA", (lato, lato), (0, 0, 0, 0))
        posa(tela, barca, raggio, lato * 33.0 / 108.0)   # cerchio sicuro
        scrivi(tela, "mipmap-" + nome, "ic_launcher_foreground.png")

    print("icone piene (Android 7 e precedenti, e le anteprime):")
    # la quadrata e' l'icona della PWA senza ritocchi: gli angoli tondi ce li
    # ha gia'. La tonda invece si ricompone, perche' ritagliando un cerchio
    # dall'originale le creste delle onde restano fuori.
    quadrata = Image.open(QUADRATA).convert("RGBA")
    tonda512 = sfumatura(512, 512).convert("RGBA")
    posa(tonda512, barca, raggio, 512 * 0.38)
    maschera = Image.new("L", tonda512.size, 0)
    ImageDraw.Draw(maschera).ellipse([0, 0, 511, 511], fill=255)
    tonda512.putalpha(maschera)
    for nome, k in DENSITA:
        lato = round(48 * k)
        scrivi(quadrata.resize((lato, lato), Image.LANCZOS), "mipmap-" + nome, "ic_launcher.png")
        scrivi(tonda512.resize((lato, lato), Image.LANCZOS), "mipmap-" + nome, "ic_launcher_round.png")

    print("schermata d'avvio:")
    for cartella, larg, alt in SPLASH:
        tela = sfumatura(larg, alt, 0.5, 0.42).convert("RGBA")
        posa(tela, barca, raggio, min(larg, alt) * 0.21, cy=alt * 0.42)
        scrivi(tela.convert("RGB"), cartella, "splash.png")

    print("file XML:")
    open(os.path.join(RES, "drawable", "ic_launcher_background.xml"), "w").write(FONDO_XML)
    for n in ("ic_launcher.xml", "ic_launcher_round.xml"):
        open(os.path.join(RES, "mipmap-anydpi-v26", n), "w").write(ADATTIVA_XML)
    print("  drawable/ic_launcher_background.xml, mipmap-anydpi-v26/*.xml")


if __name__ == "__main__":
    main()
