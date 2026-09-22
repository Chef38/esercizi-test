/**
 * controllers/autore.controller.js
 * Handler HTTP + validazione input.
 */

const service = require('../service/autore.service');

// ─── Validator inline ───────────────────────────────────────────
const validaCreazione = ({ nome, cognome, annoNascita } = {}) => {
  const errori = [];
  if (!nome    || nome.trim()    === '') errori.push('Il campo "nome" è obbligatorio.');
  if (!cognome || cognome.trim() === '') errori.push('Il campo "cognome" è obbligatorio.');
  if (annoNascita !== undefined && isNaN(Number(annoNascita))) {
    errori.push('Il campo "annoNascita" deve essere un numero intero.');
  }
  return errori;
};

const validaAggiornamento = ({ nome, cognome, annoNascita } = {}) => {
  const errori = [];
  if (nome    !== undefined && nome.trim()    === '') errori.push('Il campo "nome" non può essere vuoto.');
  if (cognome !== undefined && cognome.trim() === '') errori.push('Il campo "cognome" non può essere vuoto.');
  if (annoNascita !== undefined && isNaN(Number(annoNascita))) {
    errori.push('Il campo "annoNascita" deve essere un numero intero.');
  }
  return errori;
};

// ─── Handler ────────────────────────────────────────────────────
const autoreController = {

  // GET /autori
  getAll: async (req, res) => {
    try {
      res.json(await service.getAll());
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

  // GET /autori/:id
  getById: async (req, res) => {
    try {
      res.json(await service.getById(parseInt(req.params.id)));
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

  // POST /autori
  create: async (req, res) => {
    const errori = validaCreazione(req.body);
    if (errori.length > 0) return res.status(422).json({ errori });
    try {
      res.status(201).json(await service.create(req.body));
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

  // PUT /autori/:id
  update: async (req, res) => {
    const errori = validaAggiornamento(req.body);
    if (errori.length > 0) return res.status(422).json({ errori });
    try {
      res.json(await service.update(parseInt(req.params.id), req.body));
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

  // DELETE /autori/:id
  delete: async (req, res) => {
    try {
      await service.delete(parseInt(req.params.id));
      res.status(204).send();
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

};

module.exports = autoreController;
