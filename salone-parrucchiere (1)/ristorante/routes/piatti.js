const express = require('express');
const router = express.Router();
const piattiController = require('../controllers/piattiController');

/*
 * Rotte dei piatti.
 *
 * !!!! ATTENZIONE ALL'ORDINE — TRAPPOLA CLASSICA D'ESAME !!!!
 * '/search' e '/vegetariani' DEVONO stare PRIMA di '/:id'.
 * Express valuta le rotte nell'ordine in cui sono dichiarate: se '/:id' fosse
 * prima, una richiesta a /api/piatti/search matcherebbe /:id con id="search"
 * e le rotte statiche non verrebbero mai raggiunte.
 *
 * Regola generale: rotte STATICHE (/search, /vegetariani, /disponibili)
 *                  sempre PRIMA delle rotte DINAMICHE (/:id).
 */

// --- Rotte statiche (piu' specifiche) ---
router.get('/search',       piattiController.cerca);       // Endpoint 13
router.get('/vegetariani',  piattiController.vegetariani); // Endpoint 14

// --- Rotte principali e dinamiche ---
router.get('/',       piattiController.lista);     // Endpoint 8
router.post('/',      piattiController.crea);      // Endpoint 9
router.get('/:id',    piattiController.dettaglio); // Endpoint 10
router.put('/:id',    piattiController.aggiorna);  // Endpoint 11
router.delete('/:id', piattiController.elimina);   // Endpoint 12

module.exports = router;
