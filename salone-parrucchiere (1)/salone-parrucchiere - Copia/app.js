const express = require('express');
const apiRouter = require('./routes');   // legge routes/index.js

/*
 * app.js CONFIGURA l'applicazione Express (middleware + rotte) e la esporta.
 * L'avvio (listen sulla porta) sta in server.js: cosi' "app" e' importabile
 * dai test senza aprire una porta reale.
 *
 * Architettura a strati:
 *   HTTP request -> routes/ -> controllers/ -> services/ -> models/ -> DB
 * Ogni layer parla SOLO con quello subito sotto.
 *
 * Il file routes/index.js aggrega i 3 router (categorie, ingredienti, piatti)
 * -> qui montiamo un unico apiRouter sotto '/api'.
 */
const app = express();

// Middleware: parsa il body JSON delle richieste e lo mette in req.body.
// Senza questo, req.body sarebbe undefined su POST/PUT.
app.use(express.json());

// Un solo mount: /api + tutto quello che routes/index.js espone.
app.use('/api', apiRouter);

// Health check: aprendo http://localhost:3000 verifichi che il server sia vivo.
app.get('/', (req, res) => {
  res.json({ messaggio: 'API Ristorante attiva' });
});

// 404 catch-all: se nessuna rotta precedente ha risposto, siamo qui.
// DEVE stare per ultimo, altrimenti intercetta tutto.
app.use((req, res) => {
  res.status(404).json({ errore: 'Risorsa non trovata.' });
});

module.exports = app;
