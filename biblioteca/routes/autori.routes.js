/**
 * routes/autori.routes.js
 * Montato su '/autori' in app.js
 */

const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/autore.controller');

router.get('/',       controller.getAll);   // GET    /autori
router.get('/:id',    controller.getById);  // GET    /autori/:id
router.post('/',      controller.create);   // POST   /autori
router.put('/:id',    controller.update);   // PUT    /autori/:id
router.delete('/:id', controller.delete);   // DELETE /autori/:id

module.exports = router;