/* Copia il sito di Dritta in app/www, che e' quello che finisce dentro
   l'APK. Si esclude tutto cio' che e' impalcatura e non sito: il progetto
   dell'app, il git, gli script Python, lo schema SQL, i workflow.

   Perche' una copia e non webDir che punta alla radice: Capacitor copia
   l'INTERO webDir dentro l'APK, e la radice contiene anche node_modules e
   .git. Una riga di esclusioni e' meglio di 300 MB di app. */
const fs = require("fs"), path = require("path");
const RADICE = path.resolve(__dirname, "..");
const USCITA = path.join(__dirname, "www");

const FUORI = new Set([".git", ".github", "app", "node_modules", "supabase",
                       ".DS_Store", "www", ".gitignore"]);
/* .apk compreso: la prima volta l'APK finito stava nella radice e lo script
   se l'e' copiato dentro il sito, quindi dentro l'APK stesso — 8 MB di app
   che conteneva 7,6 MB di se' stessa. Ora il prodotto finito esce in app/,
   che e' gia' escluso, e l'estensione e' bandita comunque. */
const ESTENSIONI_FUORI = [".py", ".sql", ".md", ".apk"];

/* ── I SERVICE WORKER VANNO SPENTI DENTRO L'APP ──────────────────────────
   Nel sito servono a far funzionare Dritta senza rete. Nell'app non
   servono a niente — i file sono gia' dentro l'APK — e fanno danno: si
   registrano sull'origine https://localhost del server locale di
   Capacitor, e dopo un aggiornamento dell'APK continuano a servire la
   copia vecchia dalla loro cache. Risultato visto sul tablet il 21/09:
   schermata nera, nessun errore, nessun log — la pagina non partiva
   proprio, perche' a rispondere era un service worker rimasto indietro.

   Si inietta quindi in ogni pagina, PRIMA di ogni altro script, un
   guardiano che dentro l'app annulla la registrazione e cancella quelli
   gia' registrati. Nel sito il guardiano non fa niente, perche' li'
   window.Capacitor non esiste. */
/* ── I LINK A CARTELLA VANNO ESPLICITATI ─────────────────────────────────
   Dritta e' piena di link come `href="../"` o `data-href="cruscotto/"`.
   Su un server web vero — python http.server, GitHub Pages — chiedere una
   cartella restituisce il suo index.html, e l'indirizzo resta quello della
   cartella: i link relativi successivi si risolvono giusti.

   Il server locale di Capacitor NON risolve le cartelle. Chiede il file
   `cruscotto/`, non lo trova, e ripiega sulla index.html della radice: a
   video ricompare il menu, ma l'indirizzo e' diventato
   `https://localhost/cruscotto/`. Il tocco successivo aggiunge un altro
   pezzo, e si finisce con
   `/performance/performance/cruscotto/cruscotto/cruscotto/...` e infine un
   errore. Segnalato da Sergio alla prima prova vera dell'APK, 21/09/2026.

   Qui i link a cartella diventano espliciti (`../` -> `../index.html`).
   Si tocca solo la copia che entra nell'APK: il sito pubblicato resta
   com'e', perche' li' quei link funzionano e cambiarli sarebbe una
   modifica a quaranta file per un problema che li' non esiste. */
function esplicita(html) {
  /* href/data-href che finiscono con "/" e non sono assoluti */
  return html.replace(/((?:data-)?href\s*=\s*")([^"]*?\/)"/g, (tutto, testa, url) => {
    if (/^(https?:|\/\/|mailto:|tel:|data:)/i.test(url)) return tutto;
    return testa + url + 'index.html"';
  }).replace(/(location\.href\s*=\s*(["']))([^"']*?\/)\2/g, (tutto, testa, virg, url) => {
    if (/^(https?:|\/\/)/i.test(url)) return tutto;
    return testa + url + 'index.html' + virg;
  });
}

const GUARDIANO = `<script>(function(){if(!window.Capacitor||!navigator.serviceWorker)return;
try{navigator.serviceWorker.register=function(){return Promise.resolve(null);};
navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister();});}).catch(function(){});
if(window.caches&&caches.keys)caches.keys().then(function(k){k.forEach(function(n){caches.delete(n);});}).catch(function(){});
}catch(e){}})();</scr` + `ipt>`;

let file = 0, byte = 0;
function copia(da, a) {
  fs.mkdirSync(a, { recursive: true });
  for (const nome of fs.readdirSync(da)) {
    if (FUORI.has(nome)) continue;
    const sorgente = path.join(da, nome), destinazione = path.join(a, nome);
    const st = fs.statSync(sorgente);
    if (st.isDirectory()) { copia(sorgente, destinazione); continue; }
    if (ESTENSIONI_FUORI.includes(path.extname(nome))) continue;
    if (path.extname(nome) === ".html") {
      let html = fs.readFileSync(sorgente, "utf8");
      /* subito dopo <head>: deve girare prima di qualunque altro script */
      html = html.replace(/<head([^>]*)>/i, (m) => m + "\n" + GUARDIANO);
      html = esplicita(html);
      fs.writeFileSync(destinazione, html);
      file++; byte += Buffer.byteLength(html);
      continue;
    }
    fs.copyFileSync(sorgente, destinazione);
    file++; byte += st.size;
  }
}
fs.rmSync(USCITA, { recursive: true, force: true });
copia(RADICE, USCITA);
console.log("sito pronto in www: " + file + " file, " + (byte / 1048576).toFixed(1) + " MB");
