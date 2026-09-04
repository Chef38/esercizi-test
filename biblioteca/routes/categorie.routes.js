/**
 * routes/categorie.routes.js
 * Montato su '/categorie' in app.js
 */

const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/categoria.controller');

router.get('/',           controller.getAll);    // GET    /categorie
router.get('/:id',        controller.getById);   // GET    /categorie/:id
router.post('/',          controller.create);    // POST   /categorie
router.put('/:id',        controller.update);    // PUT    /categorie/:id
router.delete('/:id',     controller.delete);    // DELETE /categorie/:id
router.get('/:id/libri',  controller.getLibri);  // GET    /categorie/:id/libri

module.exports = router;