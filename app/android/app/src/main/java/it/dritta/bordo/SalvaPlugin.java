package it.dritta.bordo;

import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.widget.Toast;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

/*
 * Salva — l'esportazione dei file dentro l'APK.
 *
 * PERCHE' SERVE. Dritta esporta tracce, waypoint, polari e backup nel modo
 * del web: si costruisce un Blob, se ne fa un URL e si finge il clic su un
 * <a download>. Nel browser il file finisce nei Download; in una WebView
 * non succede NIENTE — nessun errore, nessun avviso, nessun file. La
 * WebView non ha un gestore di scaricamenti, e un URL `blob:` per giunta
 * vive solo dentro la pagina: nemmeno il DownloadManager di Android
 * saprebbe cosa farsene, perche' quei byte non stanno su nessun server.
 *
 * Quindi i byte li passa la pagina: il guardiano iniettato da
 * prepara-sito.js intercetta il clic, legge il Blob e lo consegna qui in
 * base64. Qui si scrive, e basta: nessun formato e' noto a questo file.
 *
 * Segnalato da Sergio alla prima prova dell'APK, 21/09/2026: "tutto
 * l'import/export non funzionava".
 */
@CapacitorPlugin(name = "Salva")
public class SalvaPlugin extends Plugin {

    @PluginMethod
    public void salva(PluginCall call) {
        String nome = call.getString("nome", "dritta.txt");
        String mime = call.getString("mime", "application/octet-stream");
        String base64 = call.getString("base64", "");

        nome = ripulisci(nome);

        byte[] dati;
        try {
            dati = android.util.Base64.decode(base64, android.util.Base64.DEFAULT);
        } catch (IllegalArgumentException e) {
            call.reject("dati illeggibili: " + e.getMessage());
            return;
        }

        try {
            String dove = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q)
                    ? scriviNeiDownload(nome, mime, dati)
                    : scriviNellaCartellaDellApp(nome, dati);
            avvisa(dove);
            JSObject r = new JSObject();
            r.put("dove", dove);
            call.resolve(r);
        } catch (Exception e) {
            call.reject("non si e' potuto salvare: " + e.getMessage(), e);
        }
    }

    /* Da Android 10 in poi la cartella Download pubblica si scrive
     * attraverso MediaStore e senza chiedere nessun permesso: l'app
     * deposita, il sistema e' padrone del file. Se il nome c'e' gia',
     * MediaStore aggiunge da solo un "(1)". */
    private String scriviNeiDownload(String nome, String mime, byte[] dati) throws Exception {
        ContentValues v = new ContentValues();
        v.put(MediaStore.Downloads.DISPLAY_NAME, nome);
        v.put(MediaStore.Downloads.MIME_TYPE, mime);
        v.put(MediaStore.Downloads.IS_PENDING, 1);
        Uri dest = getContext().getContentResolver()
                .insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
        if (dest == null) throw new Exception("la cartella Download ha rifiutato il file");
        OutputStream out = getContext().getContentResolver().openOutputStream(dest);
        try {
            out.write(dati);
            out.flush();
        } finally {
            if (out != null) out.close();
        }
        v.clear();
        v.put(MediaStore.Downloads.IS_PENDING, 0);
        getContext().getContentResolver().update(dest, v, null, null);
        return "Download/" + nome;
    }

    /* Prima di Android 10 scrivere nei Download pubblici vorrebbe
     * WRITE_EXTERNAL_STORAGE, un permesso da chiedere a video per una
     * cartella che oggi non esiste piu' cosi'. Su quei dispositivi il file
     * va nella cartella dell'app — raggiungibile da un gestore di file,
     * anche se meno comoda — e il messaggio dice dove. Scelta deliberata:
     * il minimo Android di Dritta e' il 7, ma il tablet di bordo e' molto
     * piu' nuovo, e non vale un permesso in piu' per tutti. */
    private String scriviNellaCartellaDellApp(String nome, byte[] dati) throws Exception {
        File cartella = getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
        if (cartella == null) throw new Exception("nessuna memoria esterna");
        cartella.mkdirs();
        File f = new File(cartella, nome);
        FileOutputStream out = new FileOutputStream(f);
        try {
            out.write(dati);
            out.flush();
        } finally {
            out.close();
        }
        return f.getAbsolutePath();
    }

    /* Un nome di file non puo' contenere separatori di percorso: senza
     * questo, un nome costruito male scriverebbe fuori dalla cartella. */
    private String ripulisci(String nome) {
        String n = nome.replace('/', '-').replace('\\', '-').trim();
        if (n.startsWith(".")) n = "dritta" + n;
        return n.isEmpty() ? "dritta.txt" : n;
    }

    private void avvisa(final String dove) {
        final String testo = "Salvato in " + dove;
        getActivity().runOnUiThread(new Runnable() {
            @Override public void run() {
                Toast.makeText(getContext(), testo, Toast.LENGTH_LONG).show();
            }
        });
    }
}
