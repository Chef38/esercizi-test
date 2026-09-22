const express = require('express');
const router = express.Router();
const clientiController = require('../controllers/clientiController');

/*
 * Rotte dei clienti: solo mapping URL -> funzione del controller.
 *
 * ATTENZIONE ALL'ORDINE: '/ricerca' DEVE stare PRIMA di '/:id', altrimenti
 * Express intercetta "ricerca" come valore del parametro :id.
 */
router.get('/', clientiController.lista);          // Endpoint 1
router.get('/ricerca', clientiController.ricerca); // Endpoint 3
router.get('/:id', clientiController.dettaglio);   // Endpoint 2

module.exports = router;
