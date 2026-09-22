// dotenv DEVE stare per PRIMO: se stesse dopo require('./app'), i moduli
// caricati transitivamente (compreso config/database.js) leggerebbero
// process.env ancora vuoto e la connessione al DB fallirebbe.
require('dotenv').config();

const app = require('./app');
const { sequelize } = require('./models');

/*
 * server.js = ENTRY POINT.
 * app.js e' separato: costruisce solo l'app Express, senza aprire porte.
 * La separazione permette di importare "app" nei test (Jest+Supertest)
 * senza far partire davvero il server.
 *
 * Le tabelle NON vengono create qui: le crea sql/create_tables.sql.
 * Ci limitiamo ad authenticate() come health check della connessione.
 */
const PORT = process.env.PORT || 3000;

async function avvia() {
  try {
    // Verifica che il DB sia raggiungibile PRIMA di aprire la porta HTTP:
    // se il DB e' giu', non ha senso avere un server che risponde a vuoto.
    await sequelize.authenticate();
    console.log('Connessione al database riuscita.');

    app.listen(PORT, () => {
      console.log(`Server in ascolto su http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Impossibile connettersi al database:', err.message);
    // exit code != 0 -> Docker/CI marcano il processo come fallito
    process.exit(1);
  }
}

avvia();
