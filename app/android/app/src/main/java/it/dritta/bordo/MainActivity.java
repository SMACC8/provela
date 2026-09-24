package it.dritta.bordo;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String PAGINA = "dritta.pagina";
    /* Extra per aprire una pagina precisa (lo usa la notifica della veglia). */
    static final String APRI = "dritta.apri";
    private boolean richiestaAperta = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        /* I plugin scritti dentro l'app vanno registrati a mano, prima che
           il bridge si avvii: quelli di terze parti Capacitor li trova da
           solo leggendo le dipendenze, questi no perche' vivono qui.
           Nmea: la socket verso il gateway di bordo.
           Salva: l'esportazione dei file, che in una WebView non esiste.
           Voce: la lettura vocale, che nella WebView non esiste nemmeno.
           Veglia: l'ancora a schermo spento, col GPS in un servizio. */
        registerPlugin(NmeaPlugin.class);
        registerPlugin(SalvaPlugin.class);
        registerPlugin(VocePlugin.class);
        registerPlugin(VegliaPlugin.class);
        /* super.onCreate() chiama gia' onNewIntent(getIntent()): una pagina
           chiesta da fuori viene aperta li' dentro, e il ripristino che segue
           non la deve scavalcare (richiestaAperta). */
        super.onCreate(savedInstanceState);
        riapriPagina(savedInstanceState);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        apriRichiesta(intent);
    }

    /* Una pagina chiesta da fuori — per ora solo la notifica d'allarme della
     * veglia, che vuole Ancoraggio. Solo percorsi relativi del sito: niente
     * indirizzi esterni, niente "..". Se si e' gia' li', non si ricarica. */
    private void apriRichiesta(Intent intent) {
        if (intent == null || getBridge() == null) return;
        String p = intent.getStringExtra(APRI);
        if (p == null || p.contains("..") || p.contains(":") || p.startsWith("/")) return;
        intent.removeExtra(APRI);                /* una volta sola, non a ogni ricreazione */
        richiestaAperta = true;
        String u = "https://localhost/" + p;
        WebView w = getBridge().getWebView();
        String ora = w.getUrl();
        if (ora != null && ora.startsWith(u)) return;
        w.loadUrl(u);
    }

    /* ── SI TORNA SULLA PAGINA DOVE SI ERA ────────────────────────────────
       Android a volte distrugge e ricrea l'attivita' senza chiudere l'app:
       per un cambio di configurazione non dichiarato nel manifesto, oppure
       dopo aver chiuso il processo mentre l'app era dietro. Capacitor, a
       ogni creazione, carica la pagina iniziale — quindi l'app ricompariva
       sull'hub, e la pagina che si stava usando spariva.

       Visto sull'emulatore il 24/09/2026 a veglia d'ancora appena calata:
       `configuration_changed 0x80000000` (gli "asset path", cioe' un
       cambio degli overlay di tema o un aggiornamento della WebView) e la
       Veglia d'ancora si e' trasformata nel menu. Quel cambio non si puo'
       dichiarare in configChanges: non esiste un nome per dirlo. E' lo
       stesso sintomo gia' visto al ritorno dal selettore di file, allora
       dato per memoria scarsa dell'emulatore.

       Si salva l'indirizzo della pagina quando Android lo chiede, e alla
       ricreazione la si riapre. I dati non c'entrano: stanno in
       localStorage e la pagina li rilegge da se'. */
    @Override
    public void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        try {
            WebView w = getBridge() != null ? getBridge().getWebView() : null;
            String u = w != null ? w.getUrl() : null;
            if (u != null) out.putString(PAGINA, u);
        } catch (Exception e) { /* senza indirizzo si riparte dall'hub, come prima */ }
    }

    private void riapriPagina(Bundle stato) {
        if (stato == null || getBridge() == null || richiestaAperta) return;
        String u = stato.getString(PAGINA);
        /* Solo pagine di Dritta: mai un indirizzo esterno, ne' la radice,
           che Capacitor sta gia' caricando da se'. */
        if (u == null || !u.startsWith("https://localhost/") || u.equals("https://localhost/")) return;
        getBridge().getWebView().loadUrl(u);
    }
}
