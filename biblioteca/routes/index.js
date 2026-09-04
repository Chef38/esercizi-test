/**
 * routes/index.js — Punto centrale di tutte le routes
 *
 * Tutte le route sono montate sotto il prefisso /api
 * es: /api/categorie, /api/autori, /api/libri
 */

const categorieRouter = require('./categorie.routes');
const autoriRouter    = require('./autori.routes');
const libriRouter     = require('./libri.routes');

module.exports = (app) => {
  app.use('/api/categorie', categorieRouter);
  app.use('/api/autori',    autoriRouter);
  app.use('/api/libri',     libriRouter);
};