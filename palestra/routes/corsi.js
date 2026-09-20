/**
 * routes/corsi.js - Router Express per la risorsa Corso.
 *
 * Montato su /api/corsi (vedi app.js).
 *
 * ATTENZIONE ALL'ORDINE DELLE ROTTE (regola CRITICA di Express)
 * ================================================================
 * Express valuta le rotte in ordine di dichiarazione. Se scrivessimo:
 *
 *     router.get('/:id', ...);         <- prima (SBAGLIATO)
 *     router.get('/search', ...);      <- dopo
 *
 * una GET a /api/corsi/search verrebbe intercettata dalla prima riga,
 * interpretando la stringa "search" come valore del parametro :id. Il
 * controller di /:id chiamerebbe il DB con id="search" -> errore criptico.
 *
 * Regola generale: le rotte con path FISSI (/search, /disponibili) devono
 * venire PRIMA di quelle con parametri dinamici (/:id). L'esercizio lo
 * ricorda esplicitamente nella sezione 5 della specifica.
 * ================================================================
 */
const express = require('express');
const router = express.Router();
const corsiController = require('../controllers/corsiController');
const v = require('../validators/corsiValidator');

router.get('/', corsiController.lista);                                       // Endpoint 8
router.post('/', v.crea, corsiController.crea);                               // Endpoint 9

// === rotte "specifiche" - PRIMA di /:id ===
router.get('/search', v.search, corsiController.cerca);                       // Endpoint 13
router.get('/disponibili', corsiController.disponibili);                      // Endpoint 14

// === rotte "generiche" con :id - DOPO ===
router.get('/:id', v.paramId, corsiController.dettaglio);                     // Endpoint 10
router.put('/:id', v.paramId, v.aggiorna, corsiController.aggiorna);          // Endpoint 11
router.delete('/:id', v.paramId, corsiController.elimina);                    // Endpoint 12

module.exports = router;
