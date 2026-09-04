/**
 * server.js — Avvio server
 *
 * Avvio:
 *   node server.js
 *   npx nodemon server.js
 */

require('dotenv').config();

const app           = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 3000;

async function avvia() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connessione al database riuscita.');

    // sync({ force: false }) → crea le tabelle solo se non esistono
    // NON cancella i dati esistenti
    await sequelize.sync({ force: false });


    app.listen(PORT, () => {
      console.log(`🚀 Server avviato su http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error('❌ Errore avvio:', err.message);
    process.exit(1);
  }
}

avvia();