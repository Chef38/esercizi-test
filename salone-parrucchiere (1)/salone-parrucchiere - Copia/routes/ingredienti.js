const express = require('express');
const router = express.Router();
const ingredientiController = require('../controllers/ingredientiController');

/*
 * Rotte degli ingredienti.
 * Nessuna rotta statica sotto /:id -> nessun rischio di collisione.
 */
router.get('/',     ingredientiController.lista);     // Endpoint 4
router.post('/',    ingredientiController.crea);      // Endpoint 5
router.get('/:id',  ingredientiController.dettaglio); // Endpoint 6
router.put('/:id',  ingredientiController.aggiorna);  // Endpoint 7

module.exports = router;
