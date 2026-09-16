const router = require('express').Router();
const ctrl = require('../controller/servizio.controller');
const val  = require('../validator/servizio.validator');

router.get('/:id', val.validateId, ctrl.getById);
router.get('/',                    ctrl.getAll);

module.exports = router;
