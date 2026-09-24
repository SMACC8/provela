package it.dritta.bordo;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.media.ToneGenerator;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;
import androidx.core.content.ContextCompat;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;

/*
 * VegliaService — la veglia d'ancora quando lo schermo e' spento.
 *
 * PERCHE' ESISTE. anchor/ fa la veglia nella pagina: watchPosition, un fit del
 * cerchio di borneggio, l'allarme con WebAudio. Funziona finche' la pagina e'
 * davanti. Col tablet in tasca o lo schermo spento Android sospende il
 * JavaScript, la posizione smette di arrivare e l'allarme non puo' suonare:
 * la veglia sembra sveglia ed e' cieca. Era dichiarato fin dal 21/07 come
 * limite ("allarme foreground-only") ed e' l'altra meta' del motivo per cui
 * Dritta ha un guscio Android.
 *
 * COSA FA. Un servizio in primo piano di tipo "location": tiene il GPS acceso
 * a schermo spento, controlla la distanza dal centro che la pagina gli passa,
 * e se si esce dal raggio SUONA LUI — stream sveglia, vibrazione, notifica a
 * tutto schermo. Tiene anche i fix che la pagina non ha potuto vedere, cosi'
 * al ritorno il fit del cerchio li riceve e non ha un buco.
 *
 * CHI SUONA, E QUANDO. Il modello ricco resta nella pagina: centro stimato
 * col fit di Kasa, deriva del centro, grazia al rientro. Il servizio ne
 * replica solo le due regole che non hanno bisogno di storia:
 *   - fuori area: distanza dal centro > raggio (il centro e' quello che la
 *     pagina ha stimato per ultimo, oppure il punto di calata);
 *   - GPS fermo: nessun fix da tre minuti (lo stesso FIX_CIECO della pagina).
 * NELL'APP IL SUONO LO FA SEMPRE IL SERVIZIO. Cambia solo chi decide:
 *   - finche' la pagina anchor/ guarda, decide LEI, col modello completo
 *     (anche la deriva del centro, e il silenzio di cinque minuti): a ogni
 *     battito dice "allarme si'/no";
 *   - quando smette di guardare, decide il servizio con le due regole qui
 *     sopra.
 * Una prima versione faceva suonare la pagina col suo WebAudio finche' era
 * davanti. Provata sull'emulatore il 24/09/2026 era un buco: il WebAudio si
 * arma solo con un tocco, e riaprendo la pagina — per esempio dalla
 * notifica d'allarme — restava muto. La pagina diceva "guardo io", il
 * servizio taceva, e non suonava nessuno. Adesso nell'app la pagina non
 * suona mai: il suono e' uno solo, sullo stream sveglia, che si sente anche
 * col telefono in silenzioso.
 *
 * "La pagina guarda" non vuol dire "l'app e' davanti": con l'ancora calata
 * si puo' passare a un'altra pagina di Dritta, e l'app resta in primo piano
 * mentre anchor/ non esiste piu'. Percio' la pagina manda un battito ogni
 * secondo (presente()), e il servizio la considera sveglia solo se l'app e'
 * davanti E il battito e' fresco. Schermo spento, app dietro, altra pagina,
 * pagina bloccata: in tutti i casi il battito si ferma e il servizio prende
 * il turno entro tre secondi.
 *
 * UNA DIFFERENZA VOLUTA dalla pagina: qui servono TRE fix consecutivi fuori
 * dal raggio, non uno. Nella pagina un falso allarme costa un'occhiata; qui
 * sveglia qualcuno alle tre di notte. A un nodo di deriva tre secondi sono un
 * metro e mezzo: il prezzo in sicurezza e' niente.
 *
 * NIENTE ACCESS_BACKGROUND_LOCATION. Un servizio di tipo location avviato
 * con l'app in uso conserva il permesso "mentre usi l'app" anche a schermo
 * spento: e' esattamente il caso della veglia, che parte da un tocco su
 * "Cala ancora". Il permesso "sempre" (da concedere a mano nelle
 * impostazioni di sistema) servirebbe solo per partire dal background.
 */
public class VegliaService extends Service {

    private static final String TAG = "DrittaVeglia";

    static final String ACTION_AVVIA = "it.dritta.bordo.veglia.AVVIA";
    static final String ACTION_AGGIORNA = "it.dritta.bordo.veglia.AGGIORNA";
    static final String ACTION_TACITA = "it.dritta.bordo.veglia.TACITA";
    static final String ACTION_FERMA = "it.dritta.bordo.veglia.FERMA";

    private static final String CANALE_VEGLIA = "veglia";
    private static final String CANALE_ALLARME = "allarme-ancora";
    private static final int NOTIFICA_VEGLIA = 41;
    private static final int NOTIFICA_ALLARME = 42;

    /* Le stesse soglie della pagina, dove esistono. */
    private static final long FIX_CIECO_MS = 180_000L;      /* anchor: FIX_CIECO */
    private static final long SILENZIO_MS = 5 * 60_000L;    /* anchor: "Tacita 5 min" */
    private static final int FUORI_CONSECUTIVI = 3;         /* vedi sopra: voluto */
    private static final int CODA_MAX = 4000;               /* ~1 h di fix a 1 Hz */

    /* ---- stato condiviso col plugin (stesso processo) ---- */
    static volatile boolean attiva = false;
    static volatile boolean primoPiano = true;
    static volatile long paginaT = 0L;                  /* ultimo battito di anchor/ */
    static volatile boolean paginaAllarme = false;      /* cosa dice il modello della pagina */
    private static final long BATTITO_MAX_MS = 3000L;
    static volatile double centroLat, centroLon;
    static volatile float raggio = 40f;
    static volatile long silenzioFino = 0L;
    static volatile long ultimoFixT = 0L;
    static volatile long avvioT = 0L;
    static volatile float ultimaDistanza = -1f;
    static volatile String motivo = null;             /* null, "fuori", "cieco" */
    static volatile boolean suona = false;
    private static final ArrayDeque<double[]> coda = new ArrayDeque<>();

    private LocationManager lm;
    private PowerManager.WakeLock wakeLock;
    private MediaPlayer player;
    private ToneGenerator tono;
    private Vibrator vibratore;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private int fuoriDiFila = 0;
    private long ultimaNotificaT = 0L;

    /* ─────────────────────────── ciclo di vita ─────────────────────────── */

    @Override
    public void onCreate() {
        super.onCreate();
        filoAudio = new HandlerThread("dritta-allarme");
        filoAudio.start();
        audio = new Handler(filoAudio.getLooper());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String azione = intent == null ? null : intent.getAction();

        if (azione == null) {
            /* Riavvio del sistema dopo averci chiusi (START_STICKY): si riprende
             * solo se la veglia era accesa, e solo se Android ce lo lascia fare.
             * Dal background spesso non lo concede: allora ci si ferma, e la
             * pagina la riaccende alla prossima apertura. */
            if (!caricaStato()) { stopSelf(); return START_NOT_STICKY; }
            azione = ACTION_AVVIA;
        }

        switch (azione) {
            case ACTION_AVVIA:
                if (intent != null && intent.hasExtra("lat")) leggiCentro(intent);
                if (!entraInPrimoPiano()) { stopSelf(); return START_NOT_STICKY; }
                if (!attiva) {
                    attiva = true;
                    avvioT = System.currentTimeMillis();
                    ultimoFixT = 0L;
                    fuoriDiFila = 0;
                    motivo = null;
                    /* Una calata nuova parte SEMPRE sveglia. Il silenzio e'
                     * statico e sopravviveva: tacitare, salpare e ricalare
                     * entro cinque minuti dava una veglia muta (emulatore,
                     * 24/09/2026: fuori raggio, "suona: false"). */
                    silenzioFino = 0L;
                    paginaAllarme = false;
                    synchronized (coda) { coda.clear(); }
                    prendiWakeLock();
                    ascoltaGps();
                    handler.post(battito);
                }
                salvaStato();
                aggiornaNotificaVeglia(true);
                break;
            case ACTION_AGGIORNA:
                if (intent != null && intent.hasExtra("lat")) leggiCentro(intent);
                salvaStato();
                aggiornaNotificaVeglia(true);
                break;
            case ACTION_TACITA:
                silenzioFino = System.currentTimeMillis() + SILENZIO_MS;
                valuta();
                break;
            case ACTION_FERMA:
                ferma();
                return START_NOT_STICKY;
        }
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        fermaAllarme();
        if (filoAudio != null) filoAudio.quitSafely();   /* dopo audioFerma, che e' gia' in fila */
        if (lm != null) try { lm.removeUpdates(ascoltatore); } catch (Exception e) { /* gia' tolto */ }
        rilasciaWakeLock();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    private void ferma() {
        attiva = false;
        motivo = null;
        silenzioFino = 0L;
        paginaAllarme = false;
        handler.removeCallbacksAndMessages(null);
        fermaAllarme();
        if (lm != null) try { lm.removeUpdates(ascoltatore); } catch (Exception e) { /* gia' tolto */ }
        rilasciaWakeLock();
        getSharedPreferences("veglia", MODE_PRIVATE).edit().clear().apply();
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
        stopSelf();
    }

    private void leggiCentro(Intent i) {
        centroLat = i.getDoubleExtra("lat", centroLat);
        centroLon = i.getDoubleExtra("lon", centroLon);
        raggio = i.getFloatExtra("raggio", raggio);
    }

    /* ─────────────────────────────── GPS ─────────────────────────────── */

    private void ascoltaGps() {
        lm = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        if (lm == null) return;
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED) {
            Log.w(TAG, "posizione non concessa: la veglia restera' cieca e suonera' per GPS fermo");
            return;
        }
        try {
            lm.requestLocationUpdates(LocationManager.GPS_PROVIDER, 1000L, 0f, ascoltatore, Looper.getMainLooper());
        } catch (Exception e) {
            Log.w(TAG, "GPS non disponibile", e);
        }
    }

    /* I quattro metodi esplicitamente: fino ad Android 10 l'interfaccia non ha
     * i default, e un metodo mancante e' un AbstractMethodError a runtime. */
    private final LocationListener ascoltatore = new LocationListener() {
        @Override public void onLocationChanged(Location l) { suFix(l); }
        @Override public void onProviderEnabled(String p) { }
        @Override public void onProviderDisabled(String p) { }
        @Override public void onStatusChanged(String p, int s, Bundle b) { }
    };

    private void suFix(Location l) {
        /* L'ora di ricezione, non l'ora GPS del fix: la pagina lavora con
         * Date.now() (finestra di trenta minuti del fit, deriva su dieci), e
         * a bordo senza rete l'orologio del tablet puo' scostarsi da quello
         * dei satelliti. Una base sola, quella della pagina. */
        long t = System.currentTimeMillis();
        ultimoFixT = t;
        synchronized (coda) {
            coda.addLast(new double[]{ l.getLatitude(), l.getLongitude(),
                    l.hasAccuracy() ? l.getAccuracy() : -1, t, l.hasSpeed() ? l.getSpeed() : -1 });
            while (coda.size() > CODA_MAX) coda.removeFirst();
        }
        float[] d = new float[1];
        Location.distanceBetween(centroLat, centroLon, l.getLatitude(), l.getLongitude(), d);
        ultimaDistanza = d[0];
        fuoriDiFila = (d[0] > raggio) ? fuoriDiFila + 1 : 0;
        valuta();
        aggiornaNotificaVeglia(false);
    }

    /* Consegna alla pagina i fix accumulati, e li toglie dalla coda. */
    static List<double[]> svuotaCoda() {
        synchronized (coda) {
            List<double[]> fuori = new ArrayList<>(coda);
            coda.clear();
            return fuori;
        }
    }

    /* ───────────────────────────── allarme ───────────────────────────── */

    /* Una volta al secondo: serve a tre cose che un fix non porta — accorgersi
     * che il GPS tace, passare il testimone quando la pagina smette di battere,
     * e far finire il silenzio di cinque minuti. */
    private final Runnable battito = new Runnable() {
        @Override public void run() {
            if (!attiva) return;
            valuta();
            if (suona && audio != null) audio.post(audioBip);
            handler.postDelayed(this, 1000L);
        }
    };

    private void valuta() {
        long ora = System.currentTimeMillis();
        long riferimento = Math.max(ultimoFixT, avvioT);
        boolean fuori = fuoriDiFila >= FUORI_CONSECUTIVI;
        boolean cieco = attiva && (ora - riferimento) >= FIX_CIECO_MS;
        motivo = fuori ? "fuori" : (cieco ? "cieco" : null);
        boolean deve = attiva && (paginaGuarda()
                ? paginaAllarme                                  /* decide la pagina */
                : (motivo != null && ora > silenzioFino));       /* decide il servizio */
        if (deve && !suona) avviaAllarme();
        else if (!deve && suona) fermaAllarme();
        else if (deve) aggiornaNotificaAllarme();
    }

    static boolean paginaGuarda() {
        return primoPiano && (System.currentTimeMillis() - paginaT) < BATTITO_MAX_MS;
    }

    /* ── L'AUDIO NON STA SUL THREAD PRINCIPALE ─────────────────────────────
     * Due misure sull'emulatore, a schermo spento, il 24/09/2026:
     *  1) prepare() sincrono della suoneria: lettore creato alle 09:33:05,
     *     partito alle 09:33:16 — undici secondi muti — e la notifica a tutto
     *     schermo, pubblicata dopo, ha acceso lo schermo con lo stesso ritardo;
     *  2) spostata la notifica in testa, lo schermo si e' acceso in 0,4 s, ma
     *     la sola creazione del ToneGenerator ha fermato il processo per otto
     *     secondi (09:37:31,65 -> 09:37:39,7): l'audio del dispositivo
     *     assopito si sveglia con calma.
     * Sul thread principale passano i fix, il battito e il controllo del GPS
     * fermo: bloccarlo vuol dire rendere cieca la veglia proprio mentre suona.
     * Quindi: notifica e vibrazione subito, qui; tutto l'audio su un thread
     * suo, in fila, che puo' metterci quello che vuole senza fermare niente.
     * `player` e `tono` si toccano SOLO da quel thread. */
    private HandlerThread filoAudio;
    private Handler audio;

    private void avviaAllarme() {
        suona = true;
        Log.i(TAG, "ALLARME: " + motivo + " distanza=" + Math.round(ultimaDistanza) + " raggio=" + Math.round(raggio));
        aggiornaNotificaAllarme();     /* per prima: e' lei ad accendere lo schermo */
        vibra();
        if (audio != null) audio.post(audioAvvia);
    }

    private void fermaAllarme() {
        suona = false;
        if (vibratore != null) { try { vibratore.cancel(); } catch (Exception e) { } }
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (nm != null) nm.cancel(NOTIFICA_ALLARME);
        if (audio != null) audio.post(audioFerma);
    }

    /* Sul thread audio. Un bip subito (il ToneGenerator non legge file), poi
     * la suoneria sveglia di sistema in loop sullo stream sveglia — si sente
     * anche col telefono in silenzioso, come una sveglia vera. Finche' la
     * suoneria non suona, o se non c'e', vanno avanti i bip del battito. */
    private final Runnable audioAvvia = new Runnable() {
        @Override public void run() {
            if (!suona) return;
            Log.i(TAG, "audio: primo bip");
            audioBip.run();
            /* Un lettore solo. Se l'allarme si e' fermato e ripreso in fretta,
             * audioFerma l'ha trovato di nuovo acceso e ha lasciato vivo il
             * lettore: qui NON se ne crea un altro. La prima versione lo
             * creava, e sull'emulatore sono rimaste due suonerie insieme, di
             * cui la prima non piu' raggiungibile — cioe' non piu' tacitabile. */
            if (player != null) return;
            try {
                Uri u = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
                if (u == null) u = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
                if (u == null || !suona) return;
                final MediaPlayer mp = new MediaPlayer();   /* callback sul looper di questo thread */
                mp.setAudioAttributes(new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
                mp.setDataSource(VegliaService.this, u);
                mp.setLooping(true);
                mp.setOnPreparedListener(new MediaPlayer.OnPreparedListener() {
                    @Override public void onPrepared(MediaPlayer m) {
                        if (!suona || player != m) { m.release(); return; }   /* tacitato nel frattempo */
                        m.start();
                        Log.i(TAG, "audio: suoneria partita");
                        if (tono != null) { try { tono.release(); } catch (Exception e) { } tono = null; }
                    }
                });
                mp.setOnErrorListener(new MediaPlayer.OnErrorListener() {
                    @Override public boolean onError(MediaPlayer m, int what, int extra) {
                        if (player == m) player = null;               /* restano i bip */
                        m.release();
                        return true;
                    }
                });
                player = mp;
                mp.prepareAsync();
            } catch (Exception e) {
                if (player != null) { try { player.release(); } catch (Exception x) { } }
                player = null;
            }
        }
    };

    private final Runnable audioBip = new Runnable() {
        @Override public void run() {
            if (!suona) return;
            try { if (player != null && player.isPlaying()) return; } catch (Exception e) { }
            if (tono == null) {
                try { tono = new ToneGenerator(AudioManager.STREAM_ALARM, 100); } catch (Exception x) { return; }
            }
            tono.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 600);
        }
    };

    private final Runnable audioFerma = new Runnable() {
        @Override public void run() {
            if (suona) return;                  /* e' ripartito nel frattempo */
            if (player != null) {
                /* stop() su un lettore ancora in preparazione lancia: si rilascia e basta */
                try { if (player.isPlaying()) player.stop(); } catch (Exception e) { }
                try { player.release(); } catch (Exception e) { }
                player = null;
            }
            if (tono != null) { try { tono.release(); } catch (Exception e) { } tono = null; }
        }
    };

    @SuppressWarnings("deprecation")
    private void vibra() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                VibratorManager vm = (VibratorManager) getSystemService(VIBRATOR_MANAGER_SERVICE);
                vibratore = vm != null ? vm.getDefaultVibrator() : null;
            } else {
                vibratore = (Vibrator) getSystemService(VIBRATOR_SERVICE);
            }
            if (vibratore == null || !vibratore.hasVibrator()) return;
            long[] schema = { 0, 500, 500 };
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                vibratore.vibrate(VibrationEffect.createWaveform(schema, 0));
            else vibratore.vibrate(schema, 0);
        } catch (Exception e) { /* senza vibrazione si va avanti */ }
    }

    /* ─────────────────────────── notifiche ─────────────────────────── */

    private boolean entraInPrimoPiano() {
        try {
            creaCanali();
            int tipo = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
                    ? ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION : 0;
            ServiceCompat.startForeground(this, NOTIFICA_VEGLIA, notificaVeglia(), tipo);
            return true;
        } catch (RuntimeException e) {
            /* ForegroundServiceStartNotAllowedException o SecurityException:
             * l'app non era in uso, oppure manca il permesso di posizione. */
            Log.w(TAG, "servizio in primo piano non concesso", e);
            return false;
        }
    }

    private void creaCanali() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (nm == null) return;
        NotificationChannel v = new NotificationChannel(CANALE_VEGLIA, "Veglia d'ancora",
                NotificationManager.IMPORTANCE_LOW);
        v.setDescription("Resta visibile finche' la veglia e' accesa");
        nm.createNotificationChannel(v);
        /* Il canale dell'allarme non ha suono ne' vibrazione suoi: li fa il
         * servizio, in loop, finche' non si tacita. Il suono di un canale
         * suonerebbe una volta sola. */
        NotificationChannel a = new NotificationChannel(CANALE_ALLARME, "Allarme d'ancora",
                NotificationManager.IMPORTANCE_HIGH);
        a.setDescription("Fuori dal raggio, oppure GPS fermo");
        a.setSound(null, null);
        a.enableVibration(false);
        a.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(a);
    }

    /* Toccando la notifica — o quando l'allarme accende lo schermo da solo —
     * si apre Ancoraggio, non la pagina dove si era: con l'ancora calata si
     * puo' essere sull'hub o nel Meteo, e da un allarme d'ancora si vuole
     * vedere l'ancora. */
    private PendingIntent apriApp() {
        Intent i = new Intent(this, MainActivity.class)
                .putExtra(MainActivity.APRI, "anchor/index.html")
                .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
        return PendingIntent.getActivity(this, 0, i,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    private String testoStato() {
        if (ultimoFixT == 0L) return "In attesa del GPS · raggio " + Math.round(raggio) + " m";
        return Math.round(ultimaDistanza) + " m dall'ancora · raggio " + Math.round(raggio) + " m";
    }

    private Notification notificaVeglia() {
        return new NotificationCompat.Builder(this, CANALE_VEGLIA)
                .setSmallIcon(R.drawable.ic_stat_dritta)
                .setContentTitle("Veglia d'ancora accesa")
                .setContentText(testoStato())
                .setContentIntent(apriApp())
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setCategory(NotificationCompat.CATEGORY_SERVICE)
                .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
                .build();
    }

    private void aggiornaNotificaVeglia(boolean subito) {
        long ora = System.currentTimeMillis();
        if (!subito && ora - ultimaNotificaT < 5000L) return;
        ultimaNotificaT = ora;
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (nm != null && attiva) nm.notify(NOTIFICA_VEGLIA, notificaVeglia());
    }

    private void aggiornaNotificaAllarme() {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (nm == null) return;
        /* Con la pagina davanti l'allarme e' gia' scritto a tutto schermo li':
         * una notifica sopra sarebbe solo un rettangolo che copre i numeri. */
        if (paginaGuarda()) { nm.cancel(NOTIFICA_ALLARME); return; }
        boolean cieco = "cieco".equals(motivo);
        String titolo = cieco ? "⚠ GPS FERMO" : "⚠ ARANDO";
        String testo = cieco
                ? "Nessuna posizione da piu' di tre minuti: la veglia non puo' accorgersi se ari"
                : "Fuori area: " + Math.round(ultimaDistanza) + " m > " + Math.round(raggio) + " m";
        PendingIntent tacita = PendingIntent.getService(this, 1,
                new Intent(this, VegliaService.class).setAction(ACTION_TACITA),
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Notification n = new NotificationCompat.Builder(this, CANALE_ALLARME)
                .setSmallIcon(R.drawable.ic_stat_dritta)
                .setContentTitle(titolo)
                .setContentText(testo)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(testo))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setContentIntent(apriApp())
                /* A schermo spento accende lo schermo sull'app: e' una sveglia. */
                .setFullScreenIntent(apriApp(), true)
                .addAction(0, "Tacita 5 min", tacita)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .build();
        nm.notify(NOTIFICA_ALLARME, n);
    }

    /* ─────────────────────── wakelock e persistenza ─────────────────────── */

    /* A schermo spento la CPU dorme fra un fix e l'altro: senza questo blocco
     * il battito si ferma e il GPS fermo non verrebbe mai notato. */
    private void prendiWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) return;
        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        if (pm == null) return;
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "dritta:veglia");
        wakeLock.setReferenceCounted(false);
        wakeLock.acquire();
    }

    private void rilasciaWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        wakeLock = null;
    }

    private void salvaStato() {
        getSharedPreferences("veglia", MODE_PRIVATE).edit()
                .putBoolean("attiva", true)
                .putString("lat", Double.toString(centroLat))
                .putString("lon", Double.toString(centroLon))
                .putFloat("raggio", raggio)
                .apply();
    }

    private boolean caricaStato() {
        SharedPreferences p = getSharedPreferences("veglia", MODE_PRIVATE);
        if (!p.getBoolean("attiva", false)) return false;
        try {
            centroLat = Double.parseDouble(p.getString("lat", "0"));
            centroLon = Double.parseDouble(p.getString("lon", "0"));
        } catch (NumberFormatException e) { return false; }
        raggio = p.getFloat("raggio", 40f);
        return true;
    }
}
