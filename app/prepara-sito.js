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

/* ── I FILTRI DEI SELETTORI DI FILE VANNO ALLARGATI ──────────────────────
   `<input type="file" accept=".gpx">` nel browser mostra i .gpx e basta.
   Dentro l'app non mostra NIENTE, e a volte non apre nemmeno il selettore:
   Capacitor traduce ogni estensione in un tipo MIME con la tabella di
   Android, che `.gpx` non ce l'ha. Con una sola estensione nell'accept la
   traduzione restituisce una lista vuota e il selettore parte a mani vuote;
   con `accept=".gpx,application/gpx+xml"` parte filtrato su un tipo che
   nessun gestore di file assegna ai .gpx — che di solito arrivano come
   `application/octet-stream` — e la cartella appare piena di file spenti.
   Lo stesso vale per i .csv delle polari e per il .json del backup: e' il
   motivo per cui l'app non si lasciava nemmeno riempire con un backup.

   Qui il filtro diventa "qualsiasi tipo" ovunque tranne dove funziona
   davvero, cioe' immagini, video e PDF: quelli Android li conosce, e su
   `image/*` si appoggia anche la scorciatoia della fotocamera in
   manutenzione/.
   Si sceglie l'un contro l'altro: filtro giusto e file invisibili, oppure
   tutti i file e l'utente che sa qual e' il suo. */
function allargaFiltri(html) {
  return html.replace(/accept\s*=\s*"([^"]*)"/gi, (tutto, lista) => {
    const tipi = lista.split(",").map((t) => t.trim()).filter(Boolean);
    const conosciuto = (t) => /^image\//i.test(t) || /^video\//i.test(t) ||
                              t.toLowerCase() === "application/pdf";
    if (tipi.length && tipi.every(conosciuto)) return tutto;
    return 'accept="*/*"';
  });
}

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
const GUARDIANO = `<script>(function(){if(!window.Capacitor||!navigator.serviceWorker)return;
try{navigator.serviceWorker.register=function(){return Promise.resolve(null);};
navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister();});}).catch(function(){});
if(window.caches&&caches.keys)caches.keys().then(function(k){k.forEach(function(n){caches.delete(n);});}).catch(function(){});
}catch(e){}})();</scr` + `ipt>`;

/* ── LO SCARICAMENTO NON ESISTE, DENTRO UNA WEBVIEW ──────────────────────
   Dritta esporta come esporta il web: Blob, URL temporaneo, clic finto su
   un <a download>. Nel browser il file finisce nei Download; qui non
   succede niente — nessun file, nessun errore, nessun messaggio, ed e'
   esattamente quello che Sergio ha visto il 21/09/2026. La WebView non ha
   un gestore di scaricamenti, e un URL `blob:` non lo potrebbe scaricare
   comunque: quei byte stanno dentro la pagina, non su un server.

   Si intercetta quindi il clic sui link con `download`, si rilegge il Blob
   e lo si consegna al plugin Salva, che scrive nei Download veri del
   dispositivo. Si intercettano DUE strade perche' il codice usa entrambe:
   `a.click()` su un elemento mai attaccato al documento (che un ascoltatore
   sul documento non vedrebbe mai) e il tocco vero su un link in pagina. */
const SCARICAMENTI = `<script>(function(){if(!window.Capacitor)return;
function plug(){return (window.Capacitor.Plugins&&window.Capacitor.Plugins.Salva)||null;}
function b64(blob,poi){var fr=new FileReader();
fr.onload=function(){var s=String(fr.result||""),i=s.indexOf(",");poi(i<0?null:s.slice(i+1));};
fr.onerror=function(){poi(null);};fr.readAsDataURL(blob);}
function porta(a){var url=a.getAttribute("href")||"";
if(!/^(blob:|data:)/i.test(url))return false;var P=plug();if(!P)return false;
var nome=a.getAttribute("download")||"dritta";
fetch(url).then(function(r){return r.blob();}).then(function(b){
b64(b,function(d){if(d===null){alert("Non si e' potuto leggere il file da salvare.");return;}
P.salva({nome:nome,mime:b.type||"application/octet-stream",base64:d})
.catch(function(e){alert("Non si e' potuto salvare: "+((e&&e.message)||e));});});})
.catch(function(e){alert("Non si e' potuto salvare: "+((e&&e.message)||e));});
return true;}
var clic=HTMLAnchorElement.prototype.click;
HTMLAnchorElement.prototype.click=function(){
if(this.hasAttribute&&this.hasAttribute("download")&&porta(this))return;
return clic.apply(this,arguments);};
document.addEventListener("click",function(ev){
var t=ev.target,a=(t&&t.closest)?t.closest("a[download]"):null;
if(a&&porta(a)){ev.preventDefault();ev.stopPropagation();}},true);
})();</scr` + `ipt>`;

/* ── LA VOCE, NELLA WEBVIEW, NON ESISTE ───────────────────────
   Android non implementa la Web Speech API dentro la WebView:
   `window.speechSynthesis` e' proprio assente. Le pagine se ne accorgono e
   si spengono con garbo — il Cruscotto dice "voce non supportata dal
   browser", il Prontuario disabilita il tasto "Leggilo" — quindi non
   sembra un guasto, sembra una funzione che non c'e'. Segnalato da Sergio
   il 22/09/2026: "la lettura vocale di cruscotto e di vhf non funziona".

   Qui si mette al suo posto un finto `speechSynthesis` che parla con il
   plugin Voce, cioe' col TextToSpeech nativo. Si e' scelto di imitare
   l'oggetto standard invece di cambiare le due pagine: quelle continuano a
   funzionare nel browser senza saperne niente, e non nascono due versioni
   della stessa logica. La coda la tiene Android, perche' il Prontuario
   accoda piu' frasi in un colpo e mette `onend` solo sull'ultima. */
const VOCE = `<script>(function(){
if(!window.Capacitor||("speechSynthesis" in window))return;
var n=0, coda={}, agganciato=false;
function P(){return (window.Capacitor.Plugins&&window.Capacitor.Plugins.Voce)||null;}
function aggancia(p){if(agganciato)return;agganciato=true;
try{p.addListener("fine",function(e){chiudi(e&&e.id,"onend");});
p.addListener("errore",function(e){chiudi(e&&e.id,"onerror");});
p.addListener("inizio",function(e){chiudi(e&&e.id,"onstart",true);});}catch(e){}}
function chiudi(id,quale,resta){var u=coda[id];if(!u)return;if(!resta)delete coda[id];
try{if(typeof u[quale]==="function")u[quale]({type:quale});}catch(e){}}
function Utt(t){this.text=(t==null?"":String(t));this.lang="it-IT";this.rate=1;this.pitch=1;
this.volume=1;this.voice=null;this.onstart=null;this.onend=null;this.onerror=null;}
window.SpeechSynthesisUtterance=Utt;
window.speechSynthesis={
speak:function(u){var p=P();if(!p||!u)return;aggancia(p);
var id="v"+(++n);coda[id]=u;
p.parla({id:id,testo:String(u.text||""),lingua:u.lang||"it-IT",
velocita:(+u.rate||1),tono:(+u.pitch||1)})
.catch(function(){chiudi(id,"onerror");});},
cancel:function(){var p=P();coda={};if(p)p.ferma();},
pause:function(){},resume:function(){},
getVoices:function(){return [{name:"Voce di sistema",lang:"it-IT",
default:true,localService:true,voiceURI:"sistema"}];},
speaking:false,pending:false,paused:false};
})();</scr` + `ipt>`;



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
      html = html.replace(/<head([^>]*)>/i,
        (m) => m + "\n" + GUARDIANO + "\n" + SCARICAMENTI + "\n" + VOCE);
      html = esplicita(html);
      html = allargaFiltri(html);
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
