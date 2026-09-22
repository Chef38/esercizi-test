const express = require('express');
const router = express.Router();
const serviziController = require('../controllers/serviziController');

// Rotte dei servizi: solo mapping URL -> funzione del controller.
router.get('/', serviziController.lista);        // Endpoint 4
router.get('/:id', serviziController.dettaglio); // Endpoint 5

module.exports = router;
