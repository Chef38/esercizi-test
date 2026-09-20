/**
 * routes/categorie.routes.js
 * Montato su '/categorie' in app.js
 *
 * Router = mini-app Express che gestisce un gruppo di rotte con
 * un prefisso comune (qui: /api/categorie).
 */

const express    = require('express');
// Crea un router isolato: si comporta come una mini-app
const router     = express.Router();
// Importa il controller che contiene le funzioni handler
const controller = require('../controllers/categoria.controller');

// Mappa metodo HTTP + path → funzione del controller.
// Il ":id" è un parametro dinamico: il valore finisce in req.params.id
router.get('/',           controller.getAll);    // GET    /categorie
router.get('/:id',        controller.getById);   // GET    /categorie/:id
router.post('/',          controller.create);    // POST   /categorie
router.put('/:id',        controller.update);    // PUT    /categorie/:id
router.delete('/:id',     controller.delete);    // DELETE /categorie/:id
router.get('/:id/libri',  controller.getLibri);  // GET    /categorie/:id/libri

// Esporta il router per essere montato in routes/index.js
module.exports = router;