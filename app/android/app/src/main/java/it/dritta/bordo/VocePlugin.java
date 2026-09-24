package it.dritta.bordo;

import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Locale;

/*
 * Voce — la lettura vocale dentro l'APK.
 *
 * PERCHE' SERVE. La WebView di Android **non implementa la Web Speech API**:
 * `window.speechSynthesis` non esiste proprio, e le pagine che la usano si
 * spengono da sole con garbo — il Cruscotto dice «voce non supportata dal
 * browser», il Prontuario disabilita il tasto «Leggilo». Nel browser del
 * telefono funzionano tutte e due; nell'app no. Verificato sul tablet il
 * 22/09/2026: `typeof window.speechSynthesis` = "undefined".
 *
 * Qui si espone il TextToSpeech nativo, e un guardiano iniettato da
 * prepara-sito.js lo traveste da `speechSynthesis` standard. Cosi' le pagine
 * NON cambiano: continuano a costruire SpeechSynthesisUtterance come nel
 * browser, e non esistono due versioni della stessa logica.
 *
 * Il plugin non decide cosa dire: riceve righe gia' pronte. La coda la tiene
 * Android (QUEUE_ADD), perche' il Prontuario accoda piu' frasi in una volta e
 * si aspetta che vengano lette in fila, con `onend` solo sull'ultima.
 */
@CapacitorPlugin(name = "Voce")
public class VocePlugin extends Plugin {

    private TextToSpeech motore;
    private volatile boolean pronto = false;
    private volatile String linguaCorrente = "";

    /* L'inizializzazione del motore e' ASINCRONA, e il suo "pronto" puo'
     * arrivare quando questo plugin e' gia' stato distrutto: succede a ogni
     * ricreazione dell'attivita' (cambio di tema, di carattere, di overlay).
     * La prima versione in onInit usava il campo `motore`, che
     * handleOnDestroy() aveva gia' messo a null: NullPointerException, e
     * l'app intera moriva. Visto sull'emulatore il 24/09/2026 cambiando la
     * dimensione del carattere.
     * Ora l'ascoltatore si aggancia subito (non serve aspettare l'init), e il
     * resto si fa DOPO, sul thread principale, solo se il motore e' ancora il
     * nostro. Il post serve anche al caso in cui onInit arrivasse dentro il
     * costruttore, prima che `motore` sia assegnato. */
    @Override
    public void load() {
        final TextToSpeech t = new TextToSpeech(getContext(), new TextToSpeech.OnInitListener() {
            @Override public void onInit(final int stato) {
                new Handler(Looper.getMainLooper()).post(new Runnable() {
                    @Override public void run() {
                        if (stato != TextToSpeech.SUCCESS || motore == null) return;
                        lingua("it-IT");
                        pronto = true;
                    }
                });
            }
        });
        t.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override public void onStart(String id) { avvisa("inizio", id); }
            @Override public void onDone(String id)  { avvisa("fine", id); }
            @Override public void onError(String id) { avvisa("errore", id); }
        });
        motore = t;
    }

    @PluginMethod
    public void parla(PluginCall call) {
        if (!pronto || motore == null) { call.reject("motore vocale non pronto"); return; }
        String testo = call.getString("testo", "");
        if (testo == null || testo.trim().isEmpty()) { call.resolve(); return; }
        String id = call.getString("id", "voce");
        lingua(call.getString("lingua", "it-IT"));
        motore.setSpeechRate(limite(call.getFloat("velocita", 1f), 0.1f, 3f));
        motore.setPitch(limite(call.getFloat("tono", 1f), 0.5f, 2f));
        /* QUEUE_ADD: chi vuole interrompere chiama ferma(), come fa
         * speechSynthesis.cancel() nel browser. */
        int esito = motore.speak(testo, TextToSpeech.QUEUE_ADD, null, id);
        if (esito == TextToSpeech.ERROR) call.reject("il motore vocale ha rifiutato la frase");
        else call.resolve();
    }

    @PluginMethod
    public void ferma(PluginCall call) {
        if (motore != null) motore.stop();
        call.resolve();
    }

    /* Quanto e' in grado di fare questo dispositivo: serve a dirlo a video
     * invece di restare muti senza spiegazione. */
    @PluginMethod
    public void stato(PluginCall call) {
        JSObject r = new JSObject();
        r.put("pronto", pronto);
        r.put("lingua", linguaCorrente);
        boolean italiano = false;
        if (pronto && motore != null) {
            int d = motore.isLanguageAvailable(Locale.ITALIAN);
            italiano = (d == TextToSpeech.LANG_AVAILABLE
                     || d == TextToSpeech.LANG_COUNTRY_AVAILABLE
                     || d == TextToSpeech.LANG_COUNTRY_VAR_AVAILABLE);
        }
        r.put("italiano", italiano);
        call.resolve(r);
    }

    private void lingua(String tag) {
        if (motore == null || tag == null || tag.equals(linguaCorrente)) return;
        try {
            motore.setLanguage(Locale.forLanguageTag(tag));
            linguaCorrente = tag;
        } catch (Exception e) { /* resta quella di prima */ }
    }

    private static float limite(Float v, float min, float max) {
        float f = (v == null) ? 1f : v;
        return f < min ? min : (f > max ? max : f);
    }

    private void avvisa(String evento, String id) {
        JSObject d = new JSObject();
        d.put("id", id == null ? "" : id);
        notifyListeners(evento, d);
    }

    @Override
    protected void handleOnDestroy() {
        if (motore != null) { motore.stop(); motore.shutdown(); motore = null; }
        pronto = false;
    }
}
