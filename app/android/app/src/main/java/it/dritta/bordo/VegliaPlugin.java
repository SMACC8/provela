package it.dritta.bordo;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.List;

/*
 * Veglia — il ponte fra anchor/ e VegliaService.
 *
 * La pagina resta padrona del modello: decide quando si cala e si salpa,
 * stima il centro, fissa il raggio. Il plugin passa queste tre cose al
 * servizio, gli dice se l'app e' davanti e se la pagina batte ancora — col
 * battito la pagina dice anche se l'allarme va dato: il suono lo fa sempre
 * il servizio, ma finche' la pagina guarda decide lei — e al rientro
 * restituisce alla pagina i fix che non ha visto.
 *
 * Il permesso di notifica (Android 13+) si chiede, ma la veglia parte anche
 * senza: suono e vibrazione non ne hanno bisogno. Senza, pero', la notifica
 * dell'allarme non si vede e lo schermo non si accende da solo — la pagina
 * lo sa da stato().
 */
@CapacitorPlugin(
    name = "Veglia",
    permissions = {
        @Permission(alias = "notifiche", strings = { Manifest.permission.POST_NOTIFICATIONS })
    }
)
public class VegliaPlugin extends Plugin {

    @Override
    public void load() { VegliaService.primoPiano = true; }

    @Override
    protected void handleOnResume() { VegliaService.primoPiano = true; }

    @Override
    protected void handleOnPause() { VegliaService.primoPiano = false; }

    @PluginMethod
    public void avvia(PluginCall call) {
        if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED) {
            call.reject("la posizione non e' concessa: senza, la veglia non puo' funzionare");
            return;
        }
        if (Build.VERSION.SDK_INT >= 33 && getPermissionState("notifiche") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifiche", call, "dopoNotifiche");
            return;
        }
        parti(call);
    }

    @PermissionCallback
    private void dopoNotifiche(PluginCall call) { parti(call); }   /* parte comunque */

    private void parti(PluginCall call) {
        Intent i = intento(VegliaService.ACTION_AVVIA, call);
        try {
            ContextCompat.startForegroundService(getContext(), i);
            call.resolve(stato());
        } catch (Exception e) {
            call.reject("il servizio di veglia non e' partito: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void aggiorna(PluginCall call) {
        if (!VegliaService.attiva) { call.resolve(stato()); return; }
        try {
            getContext().startService(intento(VegliaService.ACTION_AGGIORNA, call));
            call.resolve(stato());
        } catch (Exception e) {
            call.reject("aggiornamento non consegnato: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void tacita(PluginCall call) {
        VegliaService.silenzioFino = System.currentTimeMillis() + 5 * 60_000L;
        call.resolve(stato());
    }

    @PluginMethod
    public void ferma(PluginCall call) {
        if (VegliaService.attiva) {
            try {
                getContext().startService(new Intent(getContext(), VegliaService.class)
                        .setAction(VegliaService.ACTION_FERMA));
            } catch (Exception e) { /* il servizio non c'e' gia' piu' */ }
        }
        call.resolve();
    }

    /* Il battito di anchor/: "sto guardando io, e l'allarme e' si'/no".
     * Finche' batte decide la pagina; quando smette, decide il servizio. */
    @PluginMethod
    public void presente(PluginCall call) {
        VegliaService.paginaAllarme = Boolean.TRUE.equals(call.getBoolean("allarme", false));
        VegliaService.paginaT = System.currentTimeMillis();
        call.resolve();
    }

    @PluginMethod
    public void stato(PluginCall call) { call.resolve(stato()); }

    /* I fix raccolti mentre la pagina non guardava, dal piu' vecchio. */
    @PluginMethod
    public void leggi(PluginCall call) {
        List<double[]> fix = VegliaService.svuotaCoda();
        JSArray a = new JSArray();
        for (double[] f : fix) {
            JSObject o = new JSObject();
            o.put("lat", f[0]);
            o.put("lon", f[1]);
            if (f[2] >= 0) o.put("acc", f[2]);
            o.put("t", (long) f[3]);
            if (f[4] >= 0) o.put("sog", f[4]);
            a.put(o);
        }
        JSObject r = new JSObject();
        r.put("fix", a);
        call.resolve(r);
    }

    private Intent intento(String azione, PluginCall call) {
        Intent i = new Intent(getContext(), VegliaService.class).setAction(azione);
        Double lat = call.getDouble("lat"), lon = call.getDouble("lon");
        Float r = call.getFloat("raggio");
        if (lat != null && lon != null) {
            i.putExtra("lat", lat.doubleValue());
            i.putExtra("lon", lon.doubleValue());
        }
        if (r != null) i.putExtra("raggio", r.floatValue());
        return i;
    }

    private JSObject stato() {
        JSObject o = new JSObject();
        o.put("attiva", VegliaService.attiva);
        o.put("motivo", VegliaService.motivo);
        o.put("suona", VegliaService.suona);
        o.put("distanza", VegliaService.ultimaDistanza);
        o.put("raggio", VegliaService.raggio);
        long t = VegliaService.ultimoFixT;
        o.put("etaFix", t == 0 ? -1 : System.currentTimeMillis() - t);
        boolean notifiche = Build.VERSION.SDK_INT < 33
                || getPermissionState("notifiche") == PermissionState.GRANTED;
        o.put("notifiche", notifiche);
        return o;
    }
}
