/**
 * controllers/autoreController.js
 *
 * Handler HTTP per la risorsa Autore.
 * Segue lo stesso pattern del controller Categoria:
 * valida input → chiama service → risponde con status corretto.
 */

const service   = require('../service/autore.service');
const validator = require('../validator/autore.validator');

const autoreController = {

  // GET /autori — lista di tutti gli autori (con i loro libri joinati)
  getAll: async (req, res) => {
    try {
      res.json(await service.getAll());
    } catch (err) {
      // Se il service ha lanciato { status, message } uso quello, altrimenti 500
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

  // GET /autori/:id — singolo autore
  getById: async (req, res) => {
    try {
      // parseInt converte l'id dalla URL (stringa) in numero
      res.json(await service.getById(parseInt(req.params.id)));
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

  // POST /autori — crea nuovo autore
  create: async (req, res) => {
    // Valida il body: se ci sono errori risponde 422 senza chiamare il service
    const errori = validator.validaCreazione(req.body);
    if (errori.length > 0) return res.status(422).json({ errori });
    try {
      // 201 = Created, status HTTP standard dopo una POST riuscita
      res.status(201).json(await service.create(req.body));
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

  // PUT /autori/:id — aggiorna autore esistente
  update: async (req, res) => {
    const errori = validator.validaAggiornamento(req.body);
    if (errori.length > 0) return res.status(422).json({ errori });
    try {
      res.json(await service.update(parseInt(req.params.id), req.body));
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

  // DELETE /autori/:id — cancella un autore
  delete: async (req, res) => {
    try {
      await service.delete(parseInt(req.params.id));
      // 204 No Content: operazione riuscita, nessun body nella risposta
      res.status(204).send();
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

};

module.exports = autoreController;