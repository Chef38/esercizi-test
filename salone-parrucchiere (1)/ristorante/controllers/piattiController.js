const piattiService = require('../services/piattiService');

/*
 * Controller dei piatti.
 * Il service ritorna oggetti { ok, code, messaggio } per gli errori di
 * business: qui li traduciamo in status HTTP con un semplice if.
 */

// GET /api/piatti — Endpoint 8
exports.lista = async (req, res) => {
  try {
    const piatti = await piattiService.elencaTutti();
    res.status(200).json(piatti);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};

// POST /api/piatti — Endpoint 9
// Obbligatori: nome, prezzo, CategoriaId. Opzionali: descrizione, vegetariano,
// disponibile, ingredientiIds (array di ID).
exports.crea = async (req, res) => {
  const { nome, prezzo, descrizione, vegetariano, disponibile, CategoriaId, ingredientiIds } = req.body;
  // prezzo === undefined (non !prezzo) perche' 0 e' un valore valido.
  if (!nome || prezzo === undefined || CategoriaId === undefined) {
    return res.status(400).json({
      errore: "Campi obbligatori mancanti: 'nome', 'prezzo', 'CategoriaId'."
    });
  }
  try {
    const risultato = await piattiService.crea({
      nome, prezzo, descrizione, vegetariano, disponibile, CategoriaId, ingredientiIds
    });
    // Il service ci dice se e' andato ok o se c'e' un errore di business.
    if (!risultato.ok) {
      return res.status(risultato.code).json({ errore: risultato.messaggio });
    }
    res.status(201).json(risultato.piatto);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};

// GET /api/piatti/:id — Endpoint 10
exports.dettaglio = async (req, res) => {
  try {
    const piatto = await piattiService.trovaPerId(req.params.id);
    if (!piatto) {
      return res.status(404).json({ errore: 'Piatto non trovato.' });
    }
    res.status(200).json(piatto);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};

// PUT /api/piatti/:id — Endpoint 11
exports.aggiorna = async (req, res) => {
  try {
    const risultato = await piattiService.aggiorna(req.params.id, req.body);
    if (!risultato.ok) {
      return res.status(risultato.code).json({ errore: risultato.messaggio });
    }
    res.status(200).json(risultato.piatto);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};

// DELETE /api/piatti/:id — Endpoint 12
// Le righe della pivot spariscono automaticamente grazie a ON DELETE CASCADE.
exports.elimina = async (req, res) => {
  try {
    const piatto = await piattiService.trovaPerId(req.params.id);
    if (!piatto) {
      return res.status(404).json({ errore: 'Piatto non trovato.' });
    }
    await piattiService.elimina(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};

// GET /api/piatti/search?q=... — Endpoint 13 (ricerca case-insensitive).
// req.query legge i parametri della query string. Se manca 'q' -> 400 con
// il MESSAGGIO LETTERALE della traccia.
exports.cerca = async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ errore: "Parametro di ricerca 'q' obbligatorio." });
  }
  try {
    const piatti = await piattiService.cerca(q);
    res.status(200).json(piatti);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};

// GET /api/piatti/vegetariani — Endpoint 14 (vegetariani AND disponibili).
exports.vegetariani = async (req, res) => {
  try {
    const piatti = await piattiService.vegetariani();
    res.status(200).json(piatti);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};
