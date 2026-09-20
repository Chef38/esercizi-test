/**
 * controllers/saleController.js
 *
 * Il controller e' l'ULTIMO layer che tocca req/res. Il suo compito e':
 *   1) prelevare dati dall'oggetto req (params, body, query) - qui banale
 *      perche' la validazione formale l'ha fatta il validator a monte;
 *   2) invocare il service passandogli SOLO dati semplici;
 *   3) tradurre l'esito del service in status HTTP + JSON di risposta;
 *   4) intercettare eccezioni Sequelize "attese" (UNIQUE, FK) e mapparle
 *      a codici 400/404 comprensibili, invece di generici 500.
 *
 * Regola d'oro: MAI query Sequelize qui, MAI validazione input qui.
 */
const saleService = require('../services/saleService');

/**
 * GET /api/sale (Endpoint 1) - Elenco di tutte le sale.
 * try/catch protegge da errori tecnici del DB (connessione persa, ecc.);
 * per errori "logici" (nessun dato, filtri validi) il service risponde
 * con un array vuoto e il controller lo restituisce come 200 [].
 */
exports.lista = async (req, res) => {
  try {
    const sale = await saleService.elencaTutte();
    res.status(200).json(sale);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};

/**
 * POST /api/sale (Endpoint 2) - Crea una nuova sala.
 *
 * req.body arriva GIA' verificato dal middleware `saleValidator.crea`:
 * i campi obbligatori esistono e sono del tipo giusto. Non facciamo qui
 * altri controlli su undefined/null.
 *
 * Eccezione attesa: SequelizeUniqueConstraintError su `nome` (UNIQUE nel
 * DB). E' un errore di INPUT (utente ha mandato un nome duplicato), quindi
 * risposta 400 e non 500. Se non intercettato, cadrebbe nel catch generico
 * come 500, che sarebbe fuorviante.
 */
exports.crea = async (req, res) => {
  try {
    const { nome, piano, capienza } = req.body;
    const sala = await saleService.crea({ nome, piano, capienza });
    res.status(201).json(sala);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ errore: 'Esiste gia una sala con questo nome.' });
    }
    res.status(500).json({ errore: err.message });
  }
};

/**
 * DELETE /api/sale/:id (Endpoint 3) - Elimina una sala.
 *
 * Il service restituisce uno di tre codici-esito. Li mappiamo direttamente
 * su HTTP status:
 *   'not-found'  -> 404 (risorsa non esiste)
 *   'has-corsi'  -> 400 (richiesta rifiutata per regola di business)
 *   'ok'         -> 204 (No Content: successo senza corpo di risposta)
 *
 * Perche' 204 e non 200 { messaggio: 'ok' }? Convenzione REST: quando una
 * DELETE ha successo e non c'e' nulla di significativo da restituire, 204
 * e' lo status idiomatico. Il body vuoto e' obbligatorio con 204.
 */
exports.elimina = async (req, res) => {
  try {
    const esito = await saleService.elimina(req.params.id);
    if (esito === 'not-found') {
      return res.status(404).json({ errore: 'Sala non trovata.' });
    }
    if (esito === 'has-corsi') {
      return res.status(400).json({
        errore: 'Impossibile eliminare: esistono corsi associati a questa sala.'
      });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};

/**
 * GET /api/sale/:id/corsi (Endpoint 15) - Corsi di una specifica sala.
 *
 * Il service ci restituisce l'intera istanza Sala CON i corsi caricati
 * (via include). Ci interessa restituire al client SOLO la lista dei corsi
 * (i dati della sala li ha gia' saputi da GET /api/sale), quindi rispondiamo
 * con `sala.Corsi` (proprieta' definita dall'alias italiano nell'associazione
 * Sala.hasMany(Corso, { as: 'Corsi' })).
 */
exports.corsiDellaSala = async (req, res) => {
  try {
    const sala = await saleService.corsiDellaSala(req.params.id);
    if (!sala) {
      return res.status(404).json({ errore: 'Sala non trovata.' });
    }
    res.status(200).json(sala.Corsi);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};
