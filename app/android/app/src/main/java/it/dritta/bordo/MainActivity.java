package it.dritta.bordo;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        /* I plugin scritti dentro l'app vanno registrati a mano, prima che
           il bridge si avvii: quelli di terze parti li trova da solo
           leggendo le dipendenze, questo no perche' vive qui. */
        registerPlugin(NmeaPlugin.class);
        registerPlugin(SalvaPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
