# Guscio Android di Dritta

Dritta resta una PWA. Questo è **in più**, e serve a una cosa che il browser
non può fare: **aprire una socket TCP verso il gateway NMEA di bordo**.

Tutto il resto — sedici moduli, offline, temi — è lo stesso sito, dentro una
WebView.

## Cosa si committa e cosa no

Si committa quello che è **scritto a mano**: `capacitor.config.json`,
`package.json`, `prepara-sito.js`, il plugin Java, i file di Gradle.

Non si committa quello che si **rigenera**: `node_modules/`, `www/`, le uscite
di Gradle, e `android/local.properties` (contiene il percorso dell'SDK, che è
diverso su ogni macchina).

## Ricostruirlo da zero

Servono **node** e un **JDK 21** — non 25: il Gradle che Capacitor genera non
lo digerisce e si ferma con `Unsupported class file major version 69`. Serve
anche l'SDK Android (Android Studio va bene).

```bash
cd app
npm install
echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties

export JAVA_HOME="$HOME/.local/jdk21/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"

npm run sync                 # prepara www/ e la copia nel progetto Android
cd android && ./gradlew assembleDebug
```

L'APK esce in `android/app/build/outputs/apk/debug/app-debug.apk`. È firmato
con la chiave di debug: si installa di lato, non dal Play Store.

`npm run sito` da solo rifà `www/` senza toccare il progetto Android.

## Provarlo senza il gateway vero

Il gateway parla TCP con righe di testo, quindi si può fingere. Dalla radice
del worktree:

```bash
python3 ../scratchpad/nmea/finto_ydwg.py     # oppure la copia che hai
```

Poi, nell'app, **Strumenti → Gateway**: l'indirizzo del Mac sulla rete di
casa, per esempio `192.168.1.20:1456`. Il telefono deve stare sulla stessa
WiFi. Con il gateway vero l'indirizzo è `192.168.4.1:1456`.

Nel browser il ponte fa la stessa cosa in WebSocket:

```bash
python3 ../ponte_nmea.py --gateway 192.168.4.1:1456
```

## Cose che sembrano difetti e non lo sono

**Schermata nera, nessun errore.** Se Android aggiorna la System WebView
mentre l'app gira, il processo renderer resta incastrato:
`ActivityManager: … SandboxedProcessService0: process is bad`. Il bridge
parte, la pagina viene servita, ma non c'è nessuno a eseguirla. **Si risolve
riavviando il dispositivo.** Successo il 21/09/2026, e per mezz'ora è
sembrata una regressione del codice.

**L'app parte vuota.** Ha il suo localStorage, separato da quello della PWA:
profilo, waypoint e polari non arrivano da soli. Si porta un backup da
`impostazioni/`.

**I service worker sono spenti dentro l'app**, di proposito:
`prepara-sito.js` inietta in ogni pagina un guardiano che li annulla. Nel
sito servono, qui no — i file sono già nell'APK — e uno rimasto indietro
continuerebbe a servire la copia vecchia dopo un aggiornamento.

## Il plugin

`android/app/src/main/java/it/dritta/bordo/NmeaPlugin.java`, un centinaio di
righe. Apre la socket, legge righe, le passa a JavaScript. **Non interpreta
niente**: il parser è `rf-nmea.js`, lo stesso che gira nel browser, così non
esistono due versioni della stessa logica che col tempo divergono.

Riconnette da solo ogni 3 secondi: in barca il gateway si spegne col quadro.
