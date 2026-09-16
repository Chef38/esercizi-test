const router = require('express').Router();
const ctrl = require('../controller/cliente.controller');
const val  = require('../validator/cliente.validator');

// Ordine IMPORTANTE: /ricerca prima di /:id, altrimenti "ricerca" viene interpretata come id
router.get('/ricerca', val.validateSearchQuery, ctrl.search);
router.get('/:id',    val.validateId,           ctrl.getById);
router.get('/',                                 ctrl.getAll);

module.exports = router;
