/**
 * controllers/categoriaController.js
 * Legge req → chiama Validator → chiama Service → risponde con res.
 */

const service   = require('../service/categoria.service');
const validator = require('../validator/categoria.validator');

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
    const errori = validator.validaCreazione(req.body);
    if (errori.length > 0) return res.status(422).json({ errori });
    try {
      res.status(201).json(await service.create(req.body));
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

  // PUT /categorie/:id
  update: async (req, res) => {
    const errori = validator.validaAggiornamento(req.body);
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