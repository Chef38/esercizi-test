/**
 * app.js — Configurazione Express
 *
 * NOTA: tutte le route sono precedute da /api
 * es: /api/libri, /api/autori, /api/categorie
 *
 * Qui si configurano SOLO middleware, route ed error handler.
 * L'avvio del server (listen) è invece in server.js: così si può
 * importare `app` nei test senza avviare la porta.
 */

// Importa il framework Express e crea un'istanza dell'applicazione
const express = require('express');
const app     = express();

// Middleware: parsing JSON
// Legge il body delle richieste con Content-Type: application/json
// e lo trasforma in oggetto JS accessibile via req.body
app.use(express.json());

// Middleware: logging richieste
// Viene eseguito per OGNI richiesta in arrivo.
// Stampa timestamp + metodo HTTP + URL, poi chiama next() per
// passare al middleware successivo (senza next() la richiesta si blocca).
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes — tutte sotto il prefisso /api
// routes/index.js esporta una funzione che riceve `app` e monta
// i router (categorie, autori, libri) con app.use('/api/...', router)
require('./routes')(app);

// Root — endpoint di benvenuto, utile per verificare che il server risponde
app.get('/', (req, res) => {
  res.json({ messaggio: 'Biblioteca API', endpoints: ['/api/categorie', '/api/autori', '/api/libri'] });
});

// Error handler globale
// Ha 4 parametri (err, req, res, next): Express riconosce dal numero
// di parametri che è un error handler e lo chiama SOLO quando
// un middleware/route lancia un errore o chiama next(err).
// Funge da "rete di sicurezza" per errori non gestiti nei controller.
app.use((err, req, res, next) => {
  console.error('Errore non gestito:', err);
  res.status(500).json({ errore: 'Errore interno del server.' });
});

// Esporta l'app in modo che server.js possa importarla e avviarla
module.exports = app;