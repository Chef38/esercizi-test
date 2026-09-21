/**
 * routes/libri.js
 * Montato su '/libri' in app.js
 *
 * ⚠️ ORDINE CRITICO: le route statiche (/search, /disponibili)
 * DEVONO stare PRIMA di /:id, altrimenti Express le intercetta
 * come valori del parametro id.
 *
 * Esempio: se /:id fosse prima, la richiesta /libri/search
 * finirebbe in getById con req.params.id === "search" → errore.
 *
 * ═══════════════════════════════════════════════════════════════
 *  ✅ TODO ESAME — ROUTES:
 *   [ ] express.Router()
 *   [ ] Route STATICHE (/search, /disponibili) PRIMA di /:id
 *   [ ] router.get/post/put/delete(path, controller.metodo)
 *   [ ] module.exports = router
 *   [ ] Montare in routes/index.js con app.use('/api/xxx', router)
 * ═══════════════════════════════════════════════════════════════
 */

const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/libro.controller');

// ⚠️ Prima le route STATICHE (con path fissi)
// Vengono valutate nell'ordine in cui sono dichiarate
router.get('/search',      controller.search);        // GET /libri/search?q=titolo
router.get('/disponibili', controller.getDisponibili); // GET /libri/disponibili

// Poi le route con parametri DINAMICI (:id)
router.get('/',       controller.getAll);   // GET    /libri
router.get('/:id',    controller.getById);  // GET    /libri/:id
router.post('/',      controller.create);   // POST   /libri
router.put('/:id',    controller.update);   // PUT    /libri/:id
router.delete('/:id', controller.delete);   // DELETE /libri/:id

module.exports = router;