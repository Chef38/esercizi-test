const ingredientiService = require('../services/ingredientiService');

/*
 * Controller degli ingredienti: solo HTTP, la logica sta nel service.
 * Codici HTTP usati:
 *   200 OK        - lettura riuscita
 *   201 Created   - POST riuscita
 *   400 Bad Req.  - input mancante/invalido
 *   404 Not Found - risorsa inesistente
 *   500 Server    - errore tecnico
 */

// GET /api/ingredienti — Endpoint 4
exports.lista = async (req, res) => {
  try {
    const ingredienti = await ingredientiService.elencaTutti();
    res.status(200).json(ingredienti);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};

// POST /api/ingredienti — Endpoint 5
exports.crea = async (req, res) => {
  const { nome, allergene, unitaMisura } = req.body;
  if (!nome) {
    return res.status(400).json({ errore: "Campo obbligatorio mancante: 'nome'." });
  }
  try {
    const ingrediente = await ingredientiService.crea({ nome, allergene, unitaMisura });
    res.status(201).json(ingrediente);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};

// GET /api/ingredienti/:id — Endpoint 6 (con i piatti che lo utilizzano)
exports.dettaglio = async (req, res) => {
  try {
    const ingrediente = await ingredientiService.trovaPerId(req.params.id);
    if (!ingrediente) {
      return res.status(404).json({ errore: 'Ingrediente non trovato.' });
    }
    res.status(200).json(ingrediente);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};

// PUT /api/ingredienti/:id — Endpoint 7 (partial update)
exports.aggiorna = async (req, res) => {
  try {
    const ingrediente = await ingredientiService.aggiorna(req.params.id, req.body);
    if (!ingrediente) {
      return res.status(404).json({ errore: 'Ingrediente non trovato.' });
    }
    res.status(200).json(ingrediente);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};
