/**
 * controllers/libroController.js
 *
 * Handler HTTP per la risorsa Libro.
 * Rispetto agli altri controller ha DUE endpoint aggiuntivi:
 *   - search       (ricerca per titolo)
 *   - getDisponibili (filtro sui libri con disponibile=true)
 */

const service   = require('../service/libro.service');
const validator = require('../validator/libro.validator');

const libroController = {

  // GET /libri — lista completa dei libri con autore e categoria
  getAll: async (req, res) => {
    try {
      res.json(await service.getAll());
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

  // GET /libri/search?q=... — ricerca libri per titolo (LIKE %q%)
  search: async (req, res) => {
    // Query string parameters stanno in req.query
    // Se manca "q" non ha senso cercare → 422 subito
    if (!req.query.q) return res.status(422).json({ errore: 'Il parametro "q" è obbligatorio.' });
    try {
      res.json(await service.search(req.query.q));
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

  // GET /libri/disponibili — solo i libri con disponibile=true
  getDisponibili: async (req, res) => {
    try {
      res.json(await service.getDisponibili());
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

  // GET /libri/:id — singolo libro con autore e categoria
  getById: async (req, res) => {
    try {
      res.json(await service.getById(parseInt(req.params.id)));
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

  // POST /libri — crea nuovo libro
  create: async (req, res) => {
    // Validazione: titolo e isbn obbligatori
    const errori = validator.validaCreazione(req.body);
    if (errori.length > 0) return res.status(422).json({ errori });
    try {
      // 201 Created + il libro appena creato (con relazioni caricate dal service)
      res.status(201).json(await service.create(req.body));
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

  // PUT /libri/:id — modifica libro esistente
  update: async (req, res) => {
    const errori = validator.validaAggiornamento(req.body);
    if (errori.length > 0) return res.status(422).json({ errori });
    try {
      res.json(await service.update(parseInt(req.params.id), req.body));
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

  // DELETE /libri/:id — cancella libro
  delete: async (req, res) => {
    try {
      await service.delete(parseInt(req.params.id));
      res.status(204).send(); // 204 No Content
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

};

module.exports = libroController;