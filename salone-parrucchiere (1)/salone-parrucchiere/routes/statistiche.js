const express = require('express');
const router = express.Router();
const statisticheController = require('../controllers/statisticheController');

// Rotte delle statistiche: solo mapping URL -> funzione del controller.
router.get('/servizi-popolari', statisticheController.serviziPopolari); // Endpoint 6

module.exports = router;
