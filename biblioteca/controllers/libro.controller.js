/**
 * controllers/libro.controller.js
 * Handler HTTP + validazione input.
 *
 * Endpoint extra rispetto a un CRUD standard:
 *   - search        (ricerca titolo case-insensitive)
 *   - getDisponibili
 */

const service = require('../service/libro.service');

// ─── Validator inline ───────────────────────────────────────────
const validaCreazione = ({ titolo, isbn, autori_ids } = {}) => {
  const errori = [];
  if (!titolo || titolo.trim() === '') errori.push('Il campo "titolo" è obbligatorio.');
  if (!isbn   || isbn.trim()   === '') errori.push('Il campo "isbn" è obbligatorio.');
  if (autori_ids !== undefined) {
    if (!Array.isArray(autori_ids)) {
      errori.push('Il campo "autori_ids" deve essere un array di ID.');
    } else if (autori_ids.some(x => !Number.isInteger(x))) {
      errori.push('"autori_ids" deve contenere solo numeri interi.');
    }
  }
  return errori;
};

const validaAggiornamento = ({ titolo, isbn, autori_ids } = {}) => {
  const errori = [];
  if (titolo !== undefined && titolo.trim() === '') errori.push('Il campo "titolo" non può essere vuoto.');
  if (isbn   !== undefined && isbn.trim()   === '') errori.push('Il campo "isbn" non può essere vuoto.');
  if (autori_ids !== undefined) {
    if (!Array.isArray(autori_ids)) {
      errori.push('Il campo "autori_ids" deve essere un array di ID.');
    } else if (autori_ids.some(x => !Number.isInteger(x))) {
      errori.push('"autori_ids" deve contenere solo numeri interi.');
    }
  }
  return errori;
};

// ─── Handler ────────────────────────────────────────────────────
const libroController = {

  // GET /libri
  getAll: async (req, res) => {
    try {
      res.json(await service.getAll());
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

  // GET /libri/search?q=...
  search: async (req, res) => {
    if (!req.query.q) return res.status(422).json({ errore: 'Il parametro "q" è obbligatorio.' });
    try {
      res.json(await service.search(req.query.q));
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

  // GET /libri/disponibili
  getDisponibili: async (req, res) => {
    try {
      res.json(await service.getDisponibili());
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

  // GET /libri/:id
  getById: async (req, res) => {
    try {
      res.json(await service.getById(parseInt(req.params.id)));
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

  // POST /libri
  create: async (req, res) => {
    const errori = validaCreazione(req.body);
    if (errori.length > 0) return res.status(422).json({ errori });
    try {
      res.status(201).json(await service.create(req.body));
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

  // PUT /libri/:id
  update: async (req, res) => {
    const errori = validaAggiornamento(req.body);
    if (errori.length > 0) return res.status(422).json({ errori });
    try {
      res.json(await service.update(parseInt(req.params.id), req.body));
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

  // DELETE /libri/:id
  delete: async (req, res) => {
    try {
      await service.delete(parseInt(req.params.id));
      res.status(204).send();
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

};

module.exports = libroController;
