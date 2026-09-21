/**
 * server.js — Avvio server
 *
 * Avvio:
 *   node server.js
 *   npx nodemon server.js
 *
 * Questo è il PUNTO DI INGRESSO dell'applicazione.
 * Si occupa di: caricare le variabili d'ambiente, testare la connessione
 * al database, sincronizzare i modelli e avviare il server HTTP.
 *
 * ═══════════════════════════════════════════════════════════════
 *  ✅ TODO ESAME — cosa NON dimenticare in questo file:
 *   [ ] require('dotenv').config()  DEVE stare in cima
 *   [ ] Import di app e di sequelize (da ./models, NON da ./config)
 *   [ ] await sequelize.authenticate()  → verifica connessione
 *   [ ] await sequelize.sync({ force: false })  → mai true!
 *   [ ] app.listen(PORT, callback)
 *   [ ] try/catch con process.exit(1) su errore
 * ═══════════════════════════════════════════════════════════════
 */

// Carica le variabili definite in .env dentro process.env.
// DEVE stare in cima, prima di qualunque require che usi process.env
// (es. config/database.js legge DB_NAME, DB_USER, ecc.)
require('dotenv').config();

// Importa l'app Express già configurata (middleware + routes)
const app           = require('./app');
// Importa l'istanza sequelize (connessione al DB) dall'index dei modelli
const { sequelize } = require('./models');

// Porta su cui gira il server: prende PORT da .env, altrimenti default 3000
const PORT = process.env.PORT || 3000;

// Funzione asincrona che orchestra l'avvio (async per usare await sequelize)
async function avvia() {
  try {
    // authenticate() prova a connettersi al DB e lancia errore se fallisce
    await sequelize.authenticate();
    console.log('✅ Connessione al database riuscita.');

    // sync({ force: false }) → crea le tabelle solo se non esistono
    // NON cancella i dati esistenti (force: true invece cancellerebbe tutto!)
    await sequelize.sync({ force: false });


    // Avvia il server HTTP in ascolto sulla porta scelta
    app.listen(PORT, () => {
      console.log(`🚀 Server avviato su http://localhost:${PORT}`);
    });

  } catch (err) {
    // Se qualcosa va storto (DB down, credenziali errate, ecc.)
    // stampa l'errore e termina il processo con codice 1 (errore)
    console.error('❌ Errore avvio:', err.message);
    process.exit(1);
  }
}

// Chiama la funzione: senza questa riga il server non parte
avvia();