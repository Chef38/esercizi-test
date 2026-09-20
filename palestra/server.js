/**
 * server.js - ENTRY POINT dell'applicazione.
 *
 * Perche' server.js e app.js sono due file separati?
 *   In progetti Express e' una convenzione molto diffusa dividere in due la
 *   fase di "configurazione dell'app" (routing, middleware) dalla fase di
 *   "avvio del processo" (aprire la porta di rete, verificare il DB). I
 *   vantaggi principali sono due:
 *   1) Testabilita': un file di test puo' fare `require('./app')` senza mai
 *      aprire una porta, chiamando l'app come una funzione (supertest).
 *   2) Chiarezza: se il DB e' irraggiungibile, l'errore compare qui (dove
 *      si esce con exit code 1), non nella configurazione delle rotte.
 *
 * Cosa fa questo file:
 *   1) Carica le variabili d'ambiente da .env (DB_HOST, DB_USER, ecc.).
 *   2) Importa l'oggetto `app` gia' configurato.
 *   3) Importa `sequelize` (l'istanza di connessione al DB).
 *   4) Chiama sequelize.authenticate() per VERIFICARE che il DB risponda.
 *   5) Se il DB risponde, apre la porta HTTP; altrimenti termina il processo.
 */

// dotenv legge il file .env e riversa le chiavi in process.env.
// Va chiamato prima di qualsiasi altro require che legga process.env
// (es. config/database.js), altrimenti quei moduli vedrebbero variabili
// undefined al momento della loro inizializzazione.
require('dotenv').config();

const app = require('./app');
const { sequelize } = require('./models');

// Porta HTTP di ascolto. Preferiamo la variabile d'ambiente per poter
// cambiare porta in produzione senza toccare il codice; se non e' definita
// usiamo 3000 come default di sviluppo.
const PORT = process.env.PORT || 3000;

/**
 * avvia(): funzione async perche' vogliamo usare `await` su
 * sequelize.authenticate(). In Node.js "top-level" (fuori da una funzione)
 * l'await non e' sempre disponibile a seconda della versione: incapsularla
 * in una funzione async e' la strategia piu' portabile.
 */
async function avvia() {
  try {
    // authenticate() apre una connessione al DB e la chiude subito.
    // E' un modo economico per capire, all'avvio, se le credenziali sono
    // corrette e il server MariaDB e' raggiungibile. NON crea tabelle:
    // le tabelle sono create dagli script SQL in /sql.
    await sequelize.authenticate();
    console.log('Connessione al database riuscita.');

    // app.listen(...) apre la porta e mette Express in ascolto.
    // La callback viene invocata SOLO quando il server e' pronto a ricevere
    // richieste, quindi il messaggio compare al momento giusto.
    app.listen(PORT, () => {
      console.log(`Server in ascolto su http://localhost:${PORT}`);
    });
  } catch (err) {
    // Se authenticate() fallisce vogliamo che l'avvio non prosegua: aprire
    // la porta con un DB rotto significherebbe che TUTTI gli endpoint
    // risponderebbero 500. Meglio fallire subito, in modo rumoroso.
    console.error('Impossibile connettersi al database:', err.message);
    process.exit(1); // exit code diverso da 0 => process manager (pm2, systemd) lo riavvia.
  }
}

avvia();
