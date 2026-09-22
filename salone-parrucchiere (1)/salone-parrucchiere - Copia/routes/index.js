const express = require('express');
const router = express.Router();

const categorieRouter   = require('./categorie');
const ingredientiRouter = require('./ingredienti');
const piattiRouter      = require('./piatti');

/*
 * routes/index.js — AGGREGATORE dei router.
 *
 * Vantaggio: app.js resta pulito. Se aggiungi una nuova risorsa, la registri
 * qui in un posto solo, senza toccare app.js.
 *
 * Ogni router viene "montato" sotto il proprio prefisso: le rotte dentro
 * routes/categorie.js scritte come '/' diventeranno /api/categorie in app.js.
 */
router.use('/categorie',   categorieRouter);
router.use('/ingredienti', ingredientiRouter);
router.use('/piatti',      piattiRouter);

module.exports = router;
