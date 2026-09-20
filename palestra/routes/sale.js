/**
 * routes/sale.js - Router Express per la risorsa Sala.
 *
 * Un router e' un "mini-app" Express, riutilizzabile e montabile a un URL
 * base con app.use(). Il montaggio avviene in app.js:
 *   app.use('/api/sale', saleRouter);
 * quindi un router.get('/') qui equivale a GET /api/sale.
 *
 * FILOSOFIA DEL FILE:
 *   Un router deve essere il "sommario" dell'API: leggendo questo file da
 *   capo a fondo un lettore deve capire, in 10 secondi, quali URL espone
 *   la risorsa e quali funzioni li gestiscono. Non contiene logica: solo
 *   composizione di middleware.
 *
 * COMPOSIZIONE MIDDLEWARE:
 *   La firma di router.metodo() e': (path, ...middleware, handler).
 *   Express esegue i middleware in ORDINE: se uno di essi risponde (con
 *   res.status()...json()) e NON chiama next(), la catena si interrompe li'.
 *   Sfruttiamo questo comportamento per la validazione:
 *     - il validator risponde 400 e blocca la catena se l'input non e' valido;
 *     - se tutto va bene chiama next() e il controller viene invocato.
 */
const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const v = require('../validators/saleValidator');

/*
 * ORDINE DELLE ROTTE - importante!
 *
 * Express valuta le rotte NELL'ORDINE in cui sono definite. Quando arriva
 * una richiesta, cerca il primo pattern che combacia. Questo significa che
 * le rotte "specifiche" devono venire PRIMA di quelle "generiche".
 *
 * Nel nostro caso:
 *   GET /api/sale/:id/corsi  <- specifica: ha ':id' + '/corsi' in coda
 *   DELETE /api/sale/:id     <- generica: solo ':id'
 *
 * Se scrivessimo prima DELETE /:id, una GET a /api/sale/5/corsi non
 * matcherebbe (metodo diverso), ma se il pattern fosse anche in GET,
 * verrebbe interpretato come "GET su :id = '5/corsi'". L'ordine attuale
 * evita ambiguita' future se aggiungessimo altre rotte GET.
 */
router.get('/', saleController.lista);                                     // Endpoint 1
router.post('/', v.crea, saleController.crea);                             // Endpoint 2
router.get('/:id/corsi', v.paramId, saleController.corsiDellaSala);        // Endpoint 15
router.delete('/:id', v.paramId, saleController.elimina);                  // Endpoint 3

module.exports = router;
