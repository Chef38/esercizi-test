/**
 * routes/iscritti.js - Router Express per la risorsa Iscritto.
 *
 * Montato su /api/iscritti (vedi app.js).
 *
 * Struttura tipica di ogni riga:
 *   router.<metodo>(<path>, [<validator>, <validator>, ...], <handler>)
 *
 * L'ordine dei middleware DENTRO la stessa rotta e' importante:
 *   1) prima i validator "dei parametri di URL" (v.paramId): se :id non e'
 *      un intero, e' inutile validare anche il body.
 *   2) poi i validator "del body" (v.aggiorna): se il body ha campi con
 *      formato sbagliato, restituisco 400 senza scomodare il DB.
 *   3) infine il controller: riceve dati completamente puliti e si occupa
 *      solo di orchestrare service + risposta HTTP.
 */
const express = require('express');
const router = express.Router();
const iscrittiController = require('../controllers/iscrittiController');
const v = require('../validators/iscrittiValidator');

router.get('/', iscrittiController.lista);                                 // Endpoint 4
router.post('/', v.crea, iscrittiController.crea);                         // Endpoint 5
router.get('/:id', v.paramId, iscrittiController.dettaglio);               // Endpoint 6
router.put('/:id', v.paramId, v.aggiorna, iscrittiController.aggiorna);    // Endpoint 7

module.exports = router;
