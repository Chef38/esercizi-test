/**
 * routes/index.js — Punto centrale di tutte le routes
 *
 * Tutte le route sono montate sotto il prefisso /api
 * es: /api/categorie, /api/autori, /api/libri
 *
 * Questo file "raggruppa" tutti i router in un unico punto,
 * così app.js chiama una sola cosa: require('./routes')(app)
 */

// Importa i tre router (uno per risorsa)
const categorieRouter = require('./categorie.routes');
const autoriRouter    = require('./autori.routes');
const libriRouter     = require('./libri.routes');

// Esporta una funzione che prende `app` e monta i router.
// Ogni app.use associa un PREFISSO URL a un router.
// Esempio: GET /api/categorie/5 → categorieRouter riceve /5
module.exports = (app) => {
  app.use('/api/categorie', categorieRouter);
  app.use('/api/autori',    autoriRouter);
  app.use('/api/libri',     libriRouter);
};