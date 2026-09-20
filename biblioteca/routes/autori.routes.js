/**
 * routes/autori.routes.js
 * Montato su '/autori' in app.js
 *
 * CRUD completo per la risorsa "autore".
 */

const express    = require('express');
// Router = mini-app Express che raggruppa rotte con prefisso comune
const router     = express.Router();
// Importa il controller autore
const controller = require('../controllers/autore.controller');

// Mappa metodo HTTP + path → funzione del controller
router.get('/',       controller.getAll);   // GET    /autori         → lista completa
router.get('/:id',    controller.getById);  // GET    /autori/:id     → dettaglio
router.post('/',      controller.create);   // POST   /autori         → crea nuovo
router.put('/:id',    controller.update);   // PUT    /autori/:id     → modifica
router.delete('/:id', controller.delete);   // DELETE /autori/:id     → elimina

module.exports = router;