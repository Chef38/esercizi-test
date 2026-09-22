const statisticheService = require('../services/statisticheService');

/*
 * Controller delle statistiche: solo gestione HTTP.
 */

// GET /api/statistiche/servizi-popolari  (Endpoint 6)
exports.serviziPopolari = async (req, res) => {
  try {
    const risultato = await statisticheService.serviziPopolari();
    res.status(200).json(risultato);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};
