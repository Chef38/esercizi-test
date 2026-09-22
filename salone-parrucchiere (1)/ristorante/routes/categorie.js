const express = require('express');
const router = express.Router();
const categorieController = require('../controllers/categorieController');

/*
 * Rotte delle categorie: mapping URL -> funzione del controller.
 *
 * '/:id/piatti' e' piu' SPECIFICA di '/:id' quindi va prima.
 * (Qui i metodi HTTP sono diversi, GET vs DELETE, quindi in pratica non
 * ci sarebbe collisione, ma teniamo l'ordine per coerenza con la regola
 * "specifica prima di generica".)
 */
router.get('/',           categorieController.lista);   // Endpoint 1
router.post('/',          categorieController.crea);    // Endpoint 2
router.get('/:id/piatti', categorieController.piatti);  // Endpoint 15
router.delete('/:id',     categorieController.elimina); // Endpoint 3

module.exports = router;
