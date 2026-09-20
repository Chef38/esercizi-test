/**
 * controllers/categoriaController.js
 * Legge req → chiama Validator → chiama Service → risponde con res.
 *
 * Il Controller è "sottile": non contiene logica di business,
 * fa solo da ponte tra la richiesta HTTP e il service.
 */

// Import del service (logica di business) e del validator (controllo dati)
const service   = require('../service/categoria.service');
const validator = require('../validator/categoria.validator');

// Oggetto che contiene tutte le funzioni handler
const categoriaController = {

  // GET /categorie — restituisce tutte le categorie
  getAll: async (req, res) => {
    try {
      // await aspetta la risposta del service, poi la manda come JSON
      res.json(await service.getAll());
    } catch (err) {
      // Se il service lancia { status, message } uso quello status,
      // altrimenti 500 (errore generico del server)
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

  // GET /categorie/:id — restituisce una singola categoria
  getById: async (req, res) => {
    try {
      // parseInt trasforma la stringa dell'URL ("5") in numero (5)
      res.json(await service.getById(parseInt(req.params.id)));
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

  // POST /categorie — crea una nuova categoria
  create: async (req, res) => {
    // Prima valida i dati: se ci sono errori → 422 (Unprocessable Entity)
    const errori = validator.validaCreazione(req.body);
    if (errori.length > 0) return res.status(422).json({ errori });
    try {
      // 201 Created è lo status corretto per una risorsa appena creata
      res.status(201).json(await service.create(req.body));
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

  // PUT /categorie/:id — aggiorna una categoria esistente
  update: async (req, res) => {
    // Il validator per l'update ha regole diverse (campi opzionali)
    const errori = validator.validaAggiornamento(req.body);
    if (errori.length > 0) return res.status(422).json({ errori });
    try {
      res.json(await service.update(parseInt(req.params.id), req.body));
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

  // DELETE /categorie/:id — cancella una categoria
  delete: async (req, res) => {
    try {
      await service.delete(parseInt(req.params.id));
      // 204 No Content: cancellazione riuscita, nessun body da restituire
      res.status(204).send();
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

  // GET /categorie/:id/libri — restituisce i libri di una categoria
  getLibri: async (req, res) => {
    try {
      res.json(await service.getLibri(parseInt(req.params.id)));
    } catch (err) {
      res.status(err.status || 500).json({ errore: err.message });
    }
  },

};

module.exports = categoriaController;