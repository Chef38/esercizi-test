/**
 * app.js — Configurazione Express
 *
 * NOTA: tutte le route sono precedute da /api
 * es: /api/libri, /api/autori, /api/categorie
 */

const express = require('express');
const app     = express();

// Middleware: parsing JSON
app.use(express.json());

// Middleware: logging richieste
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes — tutte sotto il prefisso /api
require('./routes')(app);

// Root
app.get('/', (req, res) => {
  res.json({ messaggio: 'Biblioteca API', endpoints: ['/api/categorie', '/api/autori', '/api/libri'] });
});

// Error handler globale
app.use((err, req, res, next) => {
  console.error('Errore non gestito:', err);
  res.status(500).json({ errore: 'Errore interno del server.' });
});

module.exports = app;