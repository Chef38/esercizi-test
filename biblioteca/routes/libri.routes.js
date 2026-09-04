/**
 * routes/libri.js
 * Montato su '/libri' in app.js
 *
 * ⚠️ ORDINE CRITICO: le route statiche (/search, /disponibili)
 * DEVONO stare PRIMA di /:id, altrimenti Express le intercetta
 * come valori del parametro id.
 */

const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/libro.controller');

// ⚠️ Prima le route statiche
router.get('/search',      controller.search);        // GET /libri/search?q=...
router.get('/disponibili', controller.getDisponibili); // GET /libri/disponibili

// Poi le route con parametri
router.get('/',       controller.getAll);   // GET    /libri
router.get('/:id',    controller.getById);  // GET    /libri/:id
router.post('/',      controller.create);   // POST   /libri
router.put('/:id',    controller.update);   // PUT    /libri/:id
router.delete('/:id', controller.delete);   // DELETE /libri/:id

module.exports = router;