const express = require('express');

const clientiRouter = require('./routes/clienti');
const serviziRouter = require('./routes/servizi');
const statisticheRouter = require('./routes/statistiche');

/*
 * app.js crea e CONFIGURA l'applicazione Express (middleware + rotte) e la
 * esporta. Non avvia il server: questo lo fa server.js. Separare i due permette,
 * per esempio, di importare "app" nei test senza aprire una porta.
 */
const app = express();
app.use(express.json());

// Montaggio dei router
app.use('/api/clienti', clientiRouter);
app.use('/api/servizi', serviziRouter);
app.use('/api/statistiche', statisticheRouter);

// Rotta di cortesia (health check)
app.get('/', (req, res) => {
  res.json({ messaggio: 'API Salone di Parrucchiere attiva' });
});

// Gestore 404 per qualsiasi altra rotta
app.use((req, res) => {
  res.status(404).json({ errore: 'Risorsa non trovata.' });
});

module.exports = app;
