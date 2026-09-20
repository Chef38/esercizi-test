/**
 * controllers/iscrittiController.js
 *
 * HTTP layer per la risorsa Iscritto. Come per gli altri controller:
 *   - la validazione formale e' fatta dai middleware in validators/iscrittiValidator.js;
 *   - la logica di business e' nel service;
 *   - qui traduciamo l'esito in status HTTP e serializziamo in JSON.
 */
const iscrittiService = require('../services/iscrittiService');

/**
 * GET /api/iscritti (Endpoint 4) - Lista di tutti gli iscritti.
 */
exports.lista = async (req, res) => {
  try {
    const iscritti = await iscrittiService.elencaTutti();
    res.status(200).json(iscritti);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};

/**
 * POST /api/iscritti (Endpoint 5) - Crea un nuovo iscritto.
 *
 * Il body arriva gia' validato (campi obbligatori + formato email +
 * formato data). L'unica eccezione da intercettare qui e' la violazione
 * del vincolo UNIQUE su email: e' un errore di INPUT (l'utente ha mandato
 * un'email gia' registrata), non un guasto tecnico, quindi rispondiamo 400.
 *
 * Nota: il messaggio evita l'apostrofo tipografico per non complicare la
 * codifica in stringhe SQL/JSON. E' una scelta di leggibilita', non tecnica.
 */
exports.crea = async (req, res) => {
  try {
    const { nome, cognome, email, dataNascita } = req.body;
    const iscritto = await iscrittiService.crea({ nome, cognome, email, dataNascita });
    res.status(201).json(iscritto);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ errore: 'Email gia registrata.' });
    }
    res.status(500).json({ errore: err.message });
  }
};

/**
 * GET /api/iscritti/:id (Endpoint 6) - Dettaglio con i corsi frequentati.
 *
 * Se il service restituisce null significa che l'id non esiste => 404.
 * Il validator ha gia' garantito che :id sia un intero positivo, quindi
 * non dobbiamo controllare formati numerici qui.
 */
exports.dettaglio = async (req, res) => {
  try {
    const iscritto = await iscrittiService.trovaPerId(req.params.id);
    if (!iscritto) {
      return res.status(404).json({ errore: 'Iscritto non trovato.' });
    }
    res.status(200).json(iscritto);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};

/**
 * PUT /api/iscritti/:id (Endpoint 7) - Aggiorna un iscritto esistente.
 *
 * Il service applica la whitelist dei campi consentiti; qui gestiamo solo:
 *   - null      -> 404 (id inesistente)
 *   - istanza   -> 200 con il record aggiornato
 *   - UNIQUE ex -> 400 (email che finirebbe duplicata)
 *
 * NB: aggiornare l'email con un valore gia' in uso da un altro iscritto
 * scatena esattamente il vincolo UNIQUE, quindi lo stesso catch della POST
 * copre anche questo caso.
 */
exports.aggiorna = async (req, res) => {
  try {
    const iscritto = await iscrittiService.aggiorna(req.params.id, req.body);
    if (!iscritto) {
      return res.status(404).json({ errore: 'Iscritto non trovato.' });
    }
    res.status(200).json(iscritto);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ errore: 'Email gia registrata.' });
    }
    res.status(500).json({ errore: err.message });
  }
};
