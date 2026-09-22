package it.dritta.bordo;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        /* I plugin scritti dentro l'app vanno registrati a mano, prima che
           il bridge si avvii: quelli di terze parti Capacitor li trova da
           solo leggendo le dipendenze, questi no perche' vivono qui.
           Nmea: la socket verso il gateway di bordo.
           Salva: l'esportazione dei file, che in una WebView non esiste.
           Voce: la lettura vocale, che nella WebView non esiste nemmeno. */
        registerPlugin(NmeaPlugin.class);
        registerPlugin(SalvaPlugin.class);
        registerPlugin(VocePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
