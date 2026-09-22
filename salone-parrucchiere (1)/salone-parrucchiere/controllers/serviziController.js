const serviziService = require('../services/serviziService');

/*
 * Controller dei servizi: solo gestione HTTP, la logica sta nel service.
 */

// GET /api/servizi  (Endpoint 4)
exports.lista = async (req, res) => {
  try {
    const servizi = await serviziService.elencaTutti();
    res.status(200).json(servizi);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};

// GET /api/servizi/:id  (Endpoint 5)
exports.dettaglio = async (req, res) => {
  try {
    const servizio = await serviziService.trovaPerId(req.params.id);
    if (!servizio) {
      return res.status(404).json({ errore: 'Servizio non trovato.' });
    }
    res.status(200).json(servizio);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};
