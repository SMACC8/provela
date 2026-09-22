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

## I plugin

Due, tutti e due in `android/app/src/main/java/it/dritta/bordo/`, registrati
a mano in `MainActivity`.

**`NmeaPlugin`**, un centinaio di righe. Apre la socket, legge righe, le
passa a JavaScript. **Non interpreta niente**: il parser è `rf-nmea.js`, lo
stesso che gira nel browser, così non esistono due versioni della stessa
logica che col tempo divergono. Riconnette da solo ogni 3 secondi: in barca
il gateway si spegne col quadro.

**`SalvaPlugin`**, l'esportazione dei file. Dritta esporta come esporta il
web — Blob, URL temporaneo, clic finto su un `<a download>` — e in una
WebView quel clic non fa **niente**: nessun file, nessun errore. Il guardiano
iniettato da `prepara-sito.js` intercetta il clic, rilegge il Blob e lo passa
qui in base64; qui si scrive nella cartella Download e si avvisa. Il plugin
non sa niente dei formati.

## Le icone

`app/fai-icone.py` (serve Pillow) le ricava tutte da `pwa-maskable-512.png`,
l'icona della PWA: icona adattiva, icone piene, fondo vettoriale e le undici
schermate d'avvio. Si rilancia dalla radice del worktree e basta:

```bash
python3 app/fai-icone.py
```

Le uscite si committano, perché il progetto Android non si rigenera. Dentro
lo script c'è scritto come la barca viene separata dal fondo blu e perché
nell'icona adattiva è più piccola che nella PWA.

## Provare senza il tablet

C'è un emulatore (`Pixel_10`). Va avviato con più memoria del suo default,
altrimenti Android uccide l'app appena si apre il selettore di file:

```bash
$ANDROID_HOME/emulator/emulator -avd Pixel_10 -memory 4096
adb install -r app/Dritta-prova.apk
adb emu geo fix 14.7050 42.1050 3      # posizione finta, al largo di Vasto
```

La WebView si ispeziona da fuori: l'APK di debug espone DevTools su una
socket, e `adb forward tcp:9222 localabstract:webview_devtools_remote_<pid>`
la porta sul Mac. Da lì `http://127.0.0.1:9222/json/list` dice che pagina è
aperta, e con una connessione WebSocket si valuta JavaScript dentro l'app —
è così che si è verificato che la posizione arrivasse davvero.

**L'emulatore non sostituisce il tablet**: è Android 17 su x86, il tablet è
un Active 8 Pro con Android 13, e permessi, cartella Download e safe area
sono proprio le cose che cambiano fra una versione e l'altra.
