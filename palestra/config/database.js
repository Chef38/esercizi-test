/**
 * config/database.js - Istanza Sequelize condivisa da tutta l'applicazione.
 *
 * L'obiettivo di questo file e' UNO SOLO: creare l'oggetto `sequelize` che
 * rappresenta la connessione al database MariaDB, e renderlo importabile
 * da qualsiasi modello. Non definisce tabelle (lo fanno i file in models/)
 * e non le crea nel DB (lo fa lo script sql/create_tables.sql).
 *
 * Perche' un unico oggetto Sequelize?
 *   Sequelize gestisce internamente un pool di connessioni. Se ogni modello
 *   creasse la sua istanza avremmo N pool distinti, con spreco di risorse e
 *   possibili race condition. La soluzione idiomatica e' un singleton:
 *   creare l'istanza qui e importarla dovunque serva.
 */
require('dotenv').config(); // ridondante rispetto a server.js, ma innocuo:
                            // rende `database.js` importabile anche in test
                            // che non passano da server.js.

const { Sequelize } = require('sequelize');

/**
 * Costruttore Sequelize: (database, user, password, options).
 * Le prime tre stringhe vengono dalle variabili d'ambiente in .env, mai
 * hardcoded: cosi' lo stesso codice funziona in sviluppo e in produzione.
 */
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,

    // dialect: dice a Sequelize quale driver usare. Con 'mariadb' viene
    // usato il pacchetto npm `mariadb` (dichiarato in package.json).
    dialect: 'mariadb',

    // logging: se true (o console.log), Sequelize stampa ogni query SQL.
    // Utilissimo in fase di sviluppo per capire cosa manda al DB; qui e'
    // disattivato per non intasare il log del server.
    logging: false,

    /*
     * dialectOptions: opzioni passate direttamente al driver mariadb.
     * Servono a evitare "sorprese" quando il DB restituisce tipi che
     * JavaScript rappresenta in modo scomodo.
     */
    dialectOptions: {
      // Le funzioni SQL COUNT()/SUM() restituiscono BIGINT. Senza questa
      // opzione il driver mariadb li ritorna come oggetti BigInt di JS,
      // che JSON.stringify() NON sa serializzare e genera un TypeError
      // rompendo la risposta HTTP. Con questa opzione tornano come Number.
      bigIntAsNumber: true,

      // AVG(), ROUND() e i tipi DECIMAL/FLOAT tornano di default come
      // stringhe (per non perdere precisione). A noi bastano i numeri.
      decimalAsNumber: true,

      // L'id restituito da INSERT ... AUTO_INCREMENT torna come Number
      // (non BigInt). Coerente con la nostra idea di "id come intero JS".
      insertIdAsNumber: true
    },

    /*
     * define: opzioni di default applicate a TUTTI i modelli. Le mettiamo
     * qui una volta sola per non ripeterle in ogni sequelize.define(...).
     */
    define: {
      // Le nostre tabelle NON hanno le colonne createdAt/updatedAt
      // (non richieste dalla specifica). Con timestamps:false Sequelize
      // smette di aggiungerle automaticamente alle SELECT e agli INSERT.
      timestamps: false
    }
  }
);

module.exports = sequelize;
