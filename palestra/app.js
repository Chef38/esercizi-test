/**
 * app.js - Costruzione e configurazione dell'applicazione Express.
 *
 * Questo file NON avvia il server (quello lo fa server.js): si limita a
 * creare l'istanza `app`, montare i middleware globali e i router, e a
 * esportarla. Cosi' la stessa `app` puo' essere importata dai test senza
 * effetti collaterali (nessuna porta aperta, nessuna connessione al DB
 * inaspettata).
 *
 * Pipeline di una richiesta HTTP nel nostro progetto:
 *
 *   client --> Express
 *              |
 *              +-- middleware globali (express.json())
 *              |
 *              +-- router giusto in base all'URL:
 *              |     /api/sale     -> routes/sale.js
 *              |     /api/iscritti -> routes/iscritti.js
 *              |     /api/corsi    -> routes/corsi.js
 *              |
 *              +-- dentro il router: [validator...] -> controller
 *              |
 *              +-- controller chiama service -> repository -> Sequelize
 *              |
 *              +-- eventuale gestore 404 se nessuna rotta ha risposto.
 */
const express = require('express');

// I router sono oggetti Express creati con express.Router(): ognuno gestisce
// una "risorsa" del dominio (sale, iscritti, corsi). Sono importati come
// funzioni middleware e montati su un prefisso URL con app.use().
const saleRouter = require('./routes/sale');
const iscrittiRouter = require('./routes/iscritti');
const corsiRouter = require('./routes/corsi');

const app = express();

/*
 * express.json() e' il body parser JSON integrato: legge il body delle
 * richieste POST/PUT con Content-Type: application/json, lo interpreta e
 * lo mette in req.body come oggetto JavaScript.
 *
 * Senza questo middleware, req.body sarebbe undefined e i controller non
 * potrebbero leggere i dati inviati dal client.
 */
app.use(express.json());

/*
 * Montaggio dei router.
 *
 * app.use(prefisso, router):
 *   tutte le rotte definite DENTRO il router saranno raggiungibili
 *   con il prefisso davanti. Es.: dentro sale.js c'e' router.get('/'),
 *   qui lo montiamo su '/api/sale' => l'URL finale e' GET /api/sale.
 *
 * Tag della specifica: Sala, Iscritto, Corso, Ricerca.
 * "Ricerca" non ha un router dedicato: l'endpoint 15 (/api/sale/:id/corsi)
 * sta sotto il router delle sale, e gli endpoint 13/14 sotto quello dei
 * corsi. Nella collection Postman li abbiamo raggruppati per tag.
 */
app.use('/api/sale', saleRouter);
app.use('/api/iscritti', iscrittiRouter);
app.use('/api/corsi', corsiRouter);

/*
 * Rotta di cortesia (health check).
 * Utile per verificare al volo che il server e' su. Un GET al root
 * dovrebbe sempre rispondere qualcosa di leggibile; risponde JSON per
 * uniformita' con il resto delle API.
 */
app.get('/', (req, res) => {
  res.json({ messaggio: 'API Palestra attiva' });
});

/*
 * Gestore 404 "catch-all".
 * Questo middleware ha 3 argomenti (req, res, next); in Express, un
 * middleware senza gestione errori intercetta le richieste che nessuna
 * rotta precedente ha gestito. Sta in fondo perche' Express valuta i
 * middleware nell'ordine di dichiarazione.
 *
 * Perche' non res.sendStatus(404)?
 *   Perche' vogliamo mantenere la coerenza con il resto delle API:
 *   tutte le risposte di errore hanno forma { errore: "..." } in JSON.
 */
app.use((req, res) => {
  res.status(404).json({ errore: 'Risorsa non trovata.' });
});

module.exports = app;
