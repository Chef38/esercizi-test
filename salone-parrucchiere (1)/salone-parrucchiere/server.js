require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

/*
 * server.js e' l'ENTRY POINT dell'applicazione: verifica la connessione al
 * database e mette l'app Express in ascolto sulla porta configurata.
 * Le tabelle sono create dagli script SQL, quindi NON usiamo sequelize.sync().
 */
const PORT = process.env.PORT || 3000;

async function avvia() {
  try {
    await sequelize.authenticate();
    console.log('Connessione al database riuscita.');

    app.listen(PORT, () => {
      console.log(`Server in ascolto su http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Impossibile connettersi al database:', err.message);
    process.exit(1);
  }
}

avvia();
