require('dotenv').config();
const { Sequelize } = require('sequelize');

/*
 * Istanza Sequelize condivisa da tutti i modelli.
 * Le tabelle vengono create dagli script SQL in /sql, quindi qui ci limitiamo
 * a configurare la connessione: non usiamo sequelize.sync().
 */
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mariadb',
    logging: false, // metti console.log per vedere le query SQL generate
    dialectOptions: {
      // Le funzioni COUNT/SUM restituiscono BIGINT: senza questa opzione il
      // driver mariadb le ritorna come BigInt, che JSON.stringify non sa serializzare.
      bigIntAsNumber: true,
      // AVG/ROUND e i FLOAT tornano come numeri invece che come stringhe.
      decimalAsNumber: true,
      insertIdAsNumber: true
    },
    define: {
      // Le nostre tabelle non hanno le colonne createdAt/updatedAt.
      timestamps: false
    }
  }
);

module.exports = sequelize;
