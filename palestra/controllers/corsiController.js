/**
 * controllers/corsiController.js
 *
 * HTTP layer per la risorsa Corso. E' il controller piu' articolato perche'
 * gli esiti del service sono piu' ricchi (creazione con validazioni multiple).
 *
 * Ricordarsi: qui NON si valida input (fa il validator) e NON si scrive SQL
 * (fa il repository via service). Il controller e' un puro adattatore fra
 * "linguaggio del dominio" (esiti del service) e "linguaggio HTTP" (status codes).
 */
const corsiService = require('../services/corsiService');

/**
 * GET /api/corsi (Endpoint 8) - Lista di tutti i corsi con sala e iscritti.
 */
exports.lista = async (req, res) => {
  try {
    const corsi = await corsiService.elencaTutti();
    res.status(200).json(corsi);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};

/**
 * POST /api/corsi (Endpoint 9) - Crea un nuovo corso.
 *
 * Il service puo' rispondere con 3 diversi codici-esito:
 *   'sala-non-trovata'      -> 404 (la SalaId indicata non esiste)
 *   'iscritti-non-trovati'  -> 404 (uno o piu' id iscritto non esistono)
 *                              includiamo l'array `mancanti` nel messaggio
 *                              per aiutare il client a capire quali id sono sbagliati.
 *   'ok'                    -> 201 (Created) con il corso completo
 *                              di sala e iscritti.
 *
 * Uso di 404 anche per "iscritti non trovati": interpretazione stretta di
 * "una risorsa referenziata dalla tua richiesta non esiste". Altra
 * interpretazione valida sarebbe 400 (Bad Request); la specifica dice
 * "HTTP 404 con messaggio descrittivo" e restiamo su 404.
 */
exports.crea = async (req, res) => {
  try {
    const risultato = await corsiService.crea(req.body);
    if (risultato.esito === 'sala-non-trovata') {
      return res.status(404).json({ errore: 'Sala non trovata.' });
    }
    if (risultato.esito === 'iscritti-non-trovati') {
      return res.status(404).json({
        errore: `Iscritti non trovati: [${risultato.mancanti.join(', ')}].`
      });
    }
    res.status(201).json(risultato.corso);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};

/**
 * GET /api/corsi/search?q=... (Endpoint 13)
 *
 * IMPORTANTE: nel router questa rotta e' definita PRIMA di '/:id',
 * altrimenti Express confonderebbe "search" con un id (regola generale
 * dell'ordering delle rotte in Express: le piu' specifiche prima).
 *
 * Il validator garantisce che req.query.q sia presente e non vuoto:
 * non serve ripetere il check qui.
 */
exports.cerca = async (req, res) => {
  try {
    const corsi = await corsiService.cerca(req.query.q);
    res.status(200).json(corsi);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};

/**
 * GET /api/corsi/disponibili (Endpoint 14)
 *
 * Anche questa PRIMA di '/:id' nel router (stesso motivo: 'disponibili'
 * verrebbe altrimenti letto come parametro id).
 * Non ci sono validazioni particolari: nessun input dal client.
 */
exports.disponibili = async (req, res) => {
  try {
    const corsi = await corsiService.disponibili();
    res.status(200).json(corsi);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};

/**
 * GET /api/corsi/:id (Endpoint 10) - Dettaglio completo del corso.
 * Se il service ritorna null (corso inesistente) rispondiamo 404.
 */
exports.dettaglio = async (req, res) => {
  try {
    const corso = await corsiService.trovaPerId(req.params.id);
    if (!corso) {
      return res.status(404).json({ errore: 'Corso non trovato.' });
    }
    res.status(200).json(corso);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};

/**
 * PUT /api/corsi/:id (Endpoint 11) - Aggiorna un corso.
 *
 * Gli esiti "non-trovato / sala-non-trovata / iscritti-non-trovati" sono
 * mutuamente esclusivi: il service li restituisce nell'ordine e appena ne
 * incontra uno interrompe. Qui li mappiamo tutti su 404 con messaggi
 * differenziati per aiutare il debug lato client.
 */
exports.aggiorna = async (req, res) => {
  try {
    const risultato = await corsiService.aggiorna(req.params.id, req.body);
    if (risultato.esito === 'non-trovato') {
      return res.status(404).json({ errore: 'Corso non trovato.' });
    }
    if (risultato.esito === 'sala-non-trovata') {
      return res.status(404).json({ errore: 'Sala non trovata.' });
    }
    if (risultato.esito === 'iscritti-non-trovati') {
      return res.status(404).json({
        errore: `Iscritti non trovati: [${risultato.mancanti.join(', ')}].`
      });
    }
    res.status(200).json(risultato.corso);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};

/**
 * DELETE /api/corsi/:id (Endpoint 12)
 *
 * Se il service ritorna false (corso non esistente) -> 404.
 * Altrimenti 204 senza corpo (convenzione REST).
 * Le righe della pivot CorsoIscritto vengono eliminate a cascata
 * dal vincolo ON DELETE CASCADE nel DB.
 */
exports.elimina = async (req, res) => {
  try {
    const ok = await corsiService.elimina(req.params.id);
    if (!ok) {
      return res.status(404).json({ errore: 'Corso non trovato.' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};
