require('dotenv').config();
const { Sequelize } = require('sequelize');

/*
 * Istanza Sequelize CONDIVISA da tutti i modelli (pattern singleton).
 *
 * Le tabelle sono create dagli script SQL in /sql: NON chiamiamo mai
 * sequelize.sync() perche' genererebbe uno schema alternativo (nomi
 * pluralizzati, tipi diversi) che potrebbe non combaciare col nostro.
 *
 * SUL CONFIG:
 *  - dialect 'mariadb'  -> Sequelize genera SQL specifico per MariaDB.
 *  - logging: false     -> non stampa le query. Metti console.log per debug.
 *  - timestamps: false  -> nessun modello aggiunge createdAt/updatedAt.
 *
 * DIALECT OPTIONS (le tipiche domande orali):
 *  - bigIntAsNumber:   COUNT/SUM in MariaDB tornano come BIGINT; il driver di
 *                      default li converte in BigInt JS. JSON.stringify(BigInt)
 *                      CRASHA -> la risposta HTTP esploderebbe. Con true
 *                      tornano come Number normali.
 *  - decimalAsNumber:  idem per DECIMAL/AVG/ROUND (di default sono stringhe).
 *  - insertIdAsNumber: idem per l'id restituito dopo un INSERT.
 */
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mariadb',
    logging: false,
    dialectOptions: {
      bigIntAsNumber: true,
      decimalAsNumber: true,
      insertIdAsNumber: true
    },
    define: {
      timestamps: false
    }
  }
);

module.exports = sequelize;
