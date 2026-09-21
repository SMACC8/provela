#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ponte TCP -> WebSocket per provare gli strumenti nel browser.

    python3 ponte_nmea.py [--gateway IP:PORTA] [--ws PORTA]

    predefiniti: --gateway 127.0.0.1:1456   (il finto YDWG)
                 --ws 1460

A cosa serve. Il gateway NMEA pubblica una socket TCP, e una pagina web non
sa aprirla: e' il motivo per cui serve l'app nativa. Questo ponte legge la
TCP e rigira le righe su WebSocket, che il browser sa leggere — cosi' tutto
il resto di Dritta (parser, moduli, interfaccia) si puo' scrivere e provare
oggi, con il browser, e l'app nativa resta l'ULTIMO passo invece del primo.

A bordo non serve: nell'APK la socket la apre il lato nativo.
Sul gateway vero:  python3 ponte_nmea.py --gateway 192.168.4.1:1456

Solo libreria standard: l'handshake WebSocket e' una ventina di righe, e
aggiungere una dipendenza a un attrezzo da banco non vale la pena.
"""
import base64, hashlib, socket, struct, sys, threading, time

MAGIA = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"   # da RFC 6455

def arg(nome, dflt):
    if nome in sys.argv:
        i = sys.argv.index(nome)
        if i + 1 < len(sys.argv): return sys.argv[i + 1]
    return dflt

GATEWAY = arg("--gateway", "127.0.0.1:1456")
WSPORTA = int(arg("--ws", "1460"))
GHOST, GPORTA = GATEWAY.split(":")[0], int(GATEWAY.split(":")[1])

clienti, lucchetto = [], threading.Lock()

def stretta(conn):
    """Handshake HTTP -> WebSocket. Ritorna True se andata a buon fine."""
    dati = b""
    conn.settimeout(5)
    while b"\r\n\r\n" not in dati:
        p = conn.recv(1024)
        if not p: return False
        dati += p
        if len(dati) > 8192: return False
    righe = dati.decode("latin-1").split("\r\n")
    chiave = None
    for r in righe:
        if r.lower().startswith("sec-websocket-key:"):
            chiave = r.split(":", 1)[1].strip()
    if not chiave: return False
    acc = base64.b64encode(hashlib.sha1((chiave + MAGIA).encode()).digest()).decode()
    conn.sendall(("HTTP/1.1 101 Switching Protocols\r\n"
                  "Upgrade: websocket\r\nConnection: Upgrade\r\n"
                  "Sec-WebSocket-Accept: %s\r\n\r\n" % acc).encode())
    conn.settimeout(None)
    return True

def telaio(testo):
    """Un frame di testo, non mascherato (server -> client)."""
    b = testo.encode("utf-8")
    n = len(b)
    if n < 126:   testa = struct.pack("!BB", 0x81, n)
    elif n < 65536: testa = struct.pack("!BBH", 0x81, 126, n)
    else:         testa = struct.pack("!BBQ", 0x81, 127, n)
    return testa + b

def accetta(srv):
    while True:
        conn, addr = srv.accept()
        try:
            if not stretta(conn):
                conn.close(); continue
        except Exception:
            try: conn.close()
            except Exception: pass
            continue
        with lucchetto: clienti.append(conn)
        print("  browser collegato: %s:%s  (totale %d)" % (addr[0], addr[1], len(clienti)), flush=True)

def manda(testo):
    fuori = telaio(testo)
    morti = []
    with lucchetto:
        for c in clienti:
            try: c.sendall(fuori)
            except Exception: morti.append(c)
        for c in morti:
            clienti.remove(c)
            try: c.close()
            except Exception: pass
    if morti: print("  browser scollegato (restano %d)" % len(clienti), flush=True)

def main():
    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind(("0.0.0.0", WSPORTA)); srv.listen(5)
    threading.Thread(target=accetta, args=(srv,), daemon=True).start()
    print("Ponte NMEA: %s:%d  ->  ws://127.0.0.1:%d" % (GHOST, GPORTA, WSPORTA), flush=True)

    while True:
        try:
            print("  collegamento al gateway...", flush=True)
            g = socket.create_connection((GHOST, GPORTA), 10)
            print("  gateway collegato", flush=True)
            resto = b""
            while True:
                p = g.recv(4096)
                if not p: raise ConnectionError("il gateway ha chiuso")
                resto += p
                righe = resto.split(b"\n")
                resto = righe.pop()
                if righe:
                    manda("\n".join(r.decode("ascii", "replace").strip() for r in righe) + "\n")
        except Exception as e:
            print("  gateway non raggiungibile (%s), riprovo fra 3 s" % e, flush=True)
            time.sleep(3)

if __name__ == "__main__":
    main()
