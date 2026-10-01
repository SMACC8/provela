package it.dritta.bordo;

import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/*
 * Stampa — i documenti di Dritta come PDF dentro l'APK (01/10/2026).
 *
 * PERCHE' SERVE. Il diario di Traversata e il dossier di Manutenzione sono
 * pagine HTML (rf-report.js) che nel browser si stampano con la finestra
 * di stampa, e da li' «Salva come PDF». Nella WebView di Android
 * window.print() non fa niente: nessun errore, nessuna finestra. Il dossier
 * dall'app non usciva proprio.
 *
 * Qui la pagina arriva come testo, si carica in una WebView fuori schermo
 * e, quando e' pronta, la si passa al servizio di stampa di Android, che
 * offre «Salva come PDF» come qualunque app. Nessun permesso in piu':
 * dove salvare lo sceglie l'utente nella finestra di sistema.
 *
 * La WebView resta in un campo finche' la stampa non e' partita: se la
 * raccogliesse il garbage collector, il documento uscirebbe bianco.
 */
@CapacitorPlugin(name = "Stampa")
public class StampaPlugin extends Plugin {

    private WebView foglio;

    @PluginMethod
    public void stampa(final PluginCall call) {
        final String html = call.getString("html", "");
        final String nome = call.getString("nome", "Dritta");
        if (html.isEmpty()) { call.reject("documento vuoto"); return; }

        getActivity().runOnUiThread(new Runnable() {
            @Override public void run() {
                try {
                    final WebView w = new WebView(getContext());
                    foglio = w;
                    w.getSettings().setJavaScriptEnabled(false);
                    w.setWebViewClient(new WebViewClient() {
                        private boolean partito = false;
                        @Override public void onPageFinished(WebView view, String url) {
                            if (partito) return;
                            partito = true;
                            try {
                                PrintManager pm = (PrintManager) getActivity().getSystemService(Context.PRINT_SERVICE);
                                PrintDocumentAdapter ad = view.createPrintDocumentAdapter(nome);
                                PrintAttributes attr = new PrintAttributes.Builder()
                                        .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                                        .build();
                                pm.print(nome, ad, attr);
                                call.resolve();
                            } catch (Exception e) {
                                call.reject("stampa non riuscita: " + e.getMessage());
                            }
                        }
                    });
                    w.loadDataWithBaseURL("https://localhost/", html, "text/html", "UTF-8", null);
                } catch (Exception e) {
                    call.reject("stampa non riuscita: " + e.getMessage());
                }
            }
        });
    }
}
