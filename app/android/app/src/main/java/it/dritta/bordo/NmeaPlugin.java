package it.dritta.bordo;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.InetSocketAddress;
import java.net.Socket;

/*
 * Nmea — la socket TCP verso il gateway di bordo.
 *
 * E' L'UNICA RAGIONE per cui Dritta ha un guscio nativo. Il gateway
 * (Yacht Devices YDWG-02, di fabbrica 192.168.4.1:1456) pubblica le frasi
 * NMEA 0183 su una socket TCP grezza, e una pagina web una socket TCP non
 * la sa aprire: non esiste nel web, punto. Tutto il resto di Dritta —
 * sedici moduli, offline, service worker — continua a girare nella
 * WebView esattamente com'e'.
 *
 * Il plugin non interpreta niente: legge righe e le passa a JavaScript,
 * dove rf-nmea.js fa il lavoro vero. Cosi' il parser resta uno solo,
 * provato nel browser, e qui non si duplica logica che poi diverge.
 */
@CapacitorPlugin(name = "Nmea")
public class NmeaPlugin extends Plugin {

    private Thread filo;
    private volatile boolean acceso = false;
    private volatile Socket presa;
    /* Numero di giro. Ogni collega() lo incrementa, e il ciclo vecchio —
     * che puo' essere fermo su una readLine() e morire qualche secondo dopo
     * — smette di parlare appena si accorge di non essere piu' il corrente.
     * Senza, il suo "fermo" di commiato arrivava DOPO il "collegato" del
     * giro nuovo e spegneva la spia a collegamento riuscito. */
    private volatile int giroCorrente = 0;

    @PluginMethod
    public void collega(PluginCall call) {
        final String host = call.getString("host", "192.168.4.1");
        final int porta = call.getInt("porta", 1456);
        fermaFilo();
        acceso = true;
        final int mio = ++giroCorrente;
        filo = new Thread(new Runnable() {
            @Override public void run() { giro(host, porta, mio); }
        }, "nmea");
        filo.setDaemon(true);
        filo.start();
        call.resolve();
    }

    @PluginMethod
    public void scollega(PluginCall call) {
        fermaFilo();
        call.resolve();
    }

    /* Ciclo di lettura. Riconnette da solo: in barca il gateway si spegne
     * col quadro, il telefono cambia rete, e l'utente non deve sapere che
     * esiste un bottone da premere. */
    private void giro(String host, int porta, int mio) {
        while (acceso && mio == giroCorrente) {
            BufferedReader in = null;
            try {
                        stato("collegamento", host + ":" + porta);
                Socket s = new Socket();
                s.connect(new InetSocketAddress(host, porta), 8000);
                /* Se per venti secondi non arriva nulla il gateway non c'e'
                 * piu', anche se la socket sembra aperta: si chiude e si
                 * riprova, invece di restare appesi a una linea morta. */
                s.setSoTimeout(20000);
                s.setKeepAlive(true);
                presa = s;
                stato("collegato", host + ":" + porta);
                in = new BufferedReader(new InputStreamReader(s.getInputStream(), "US-ASCII"), 4096);
                String riga;
                while (acceso && mio == giroCorrente && (riga = in.readLine()) != null) {
                    if (riga.length() == 0) continue;
                    JSObject d = new JSObject();
                    d.put("riga", riga);
                    notifyListeners("riga", d);
                }
                if (acceso && mio == giroCorrente) stato("caduto", "il gateway ha chiuso");
            } catch (Exception e) {
                if (acceso && mio == giroCorrente) stato("errore", e.getMessage() == null ? "rete" : e.getMessage());
            } finally {
                chiudi(in);
            }
            if (acceso && mio == giroCorrente) {
                try { Thread.sleep(3000); } catch (InterruptedException ignored) { }
            }
        }
        if (mio == giroCorrente) stato("fermo", "");
    }

    private void stato(String quale, String dettaglio) {
        JSObject d = new JSObject();
        d.put("stato", quale);
        d.put("dettaglio", dettaglio);
        notifyListeners("stato", d);
    }

    private void chiudi(BufferedReader in) {
        try { if (in != null) in.close(); } catch (Exception ignored) { }
        Socket s = presa;
        presa = null;
        try { if (s != null) s.close(); } catch (Exception ignored) { }
    }

    private void fermaFilo() {
        acceso = false;
        chiudi(null);
        Thread t = filo;
        filo = null;
        if (t != null) t.interrupt();
    }

    @Override
    protected void handleOnDestroy() {
        fermaFilo();
        super.handleOnDestroy();
    }
}
