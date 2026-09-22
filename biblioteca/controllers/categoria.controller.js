/**
 * controllers/categoria.controller.js
 * Handler HTTP + validazione input.
 *
 * Pattern per ogni handler:
 *   1. valida req.body        → se errori 422
 *   2. chiama il service      → dentro try
 *   3. risponde con status + json (catch: err.status || 500)
 */

const service = require('../service/categoria.service');

// ─── Validator (era in un file separato, ora inline) ───────────
// Restituisce un array di stringhe: vuoto = dati validi.
const validaCreazione = ({ nome } = {}) => {
  const errori = [];
  if (!nome || nome.trim() === '') errori.push('Il campo "nome" è obbligatorio.');
  if (nome && nome.length > 300)   errori.push('Il campo "nome" non può superare 300 caratteri.');
  return errori;
};

const validaAggiornamento = ({ nome } = {}) => {
  const errori = [];
  if (nome !== undefined && nome.trim() === '') errori.push('Il campo "nome" non può essere vuoto.');
  if (nome && nome.length > 300)               errori.push('Il campo "nome" non può superare 300 caratteri.');
  return errori;
};

// ─── Handler ────────────────────────────────────────────────────
const categoriaController = {

  // GET /categorie
  getAll: async (req, res) => {
    try {
      res.json(await service.getAll());
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

  // GET /categorie/:id
  getById: async (req, res) => {
    try {
      res.json(await service.getById(parseInt(req.params.id)));
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

  // POST /categorie
  create: async (req, res) => {
    const errori = validaCreazione(req.body);
    if (errori.length > 0) return res.status(422).json({ errori });
    try {
      res.status(201).json(await service.create(req.body));
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

  // PUT /categorie/:id
  update: async (req, res) => {
    const errori = validaAggiornamento(req.body);
    if (errori.length > 0) return res.status(422).json({ errori });
    try {
      res.json(await service.update(parseInt(req.params.id), req.body));
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

  // DELETE /categorie/:id
  delete: async (req, res) => {
    try {
      await service.delete(parseInt(req.params.id));
      res.status(204).send();
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

  // GET /categorie/:id/libri
  getLibri: async (req, res) => {
    try {
      res.json(await service.getLibri(parseInt(req.params.id)));
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

};

module.exports = categoriaController;
