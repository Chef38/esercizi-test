/**
 * validators/corsiValidator.js
 *
 * Validator degli endpoint dei Corsi. E' il file "piu' ricco" perche' un
 * corso ha piu' campi di una sala/iscritto, comprese due tipologie particolari:
 *   - `livello`: enum di stringhe ammesse.
 *   - `iscrittiIds`: array di id interi (relazione M:N).
 *
 * Come sempre: qui si controlla FORMATO e OBBLIGATORIETA', non l'esistenza
 * delle risorse referenziate. Es. NON controlliamo che SalaId punti a una
 * sala reale (lo fa il service).
 */
const { vuoto, isIntPositivo, isNumeroPositivo, middleware } = require('./_helpers');

/**
 * Livelli ammessi. Estratti come costante per due motivi:
 *   1) Se un giorno aggiungiamo "principiante-assoluto" lo modifichiamo qui;
 *   2) Il messaggio di errore puo' elencarli automaticamente con .join(', ').
 * NB: alternativa "piu' rigorosa" sarebbe DataTypes.ENUM nel modello Sequelize
 * (impone il vincolo anche a livello DB), ma richiederebbe ALTER TABLE per
 * ogni cambio -> preferiamo la validazione applicativa.
 */
const LIVELLI = ['base', 'intermedio', 'avanzato'];

/**
 * Helper LOCALE (non nei _helpers globali perche' usato solo qui):
 * true se v e' un array di id interi > 0.
 * Uso di Array.every() = tutti gli elementi devono soddisfare la condizione.
 * Su array vuoto every() ritorna true, quindi [] passa: e' voluto, perche'
 * un array vuoto di iscritti significa "nessun iscritto da collegare", che
 * e' un input legittimo.
 */
const isArrayDiIdPositivi = (v) => Array.isArray(v) && v.every((x) => isIntPositivo(x) && Number(x) > 0);

/**
 * POST /api/corsi - creazione corso.
 *
 * Campi obbligatori (dalla specifica): nome, livello, prezzoMensile,
 * postiMax, SalaId. Opzionali: descrizione, iscrittiIds.
 *
 * Il campo `livello` ha un ENUM chiuso: controlliamo che sia esattamente
 * uno dei valori ammessi. Il messaggio riporta l'elenco cosi' il client
 * sa esattamente cosa deve inviare.
 */
exports.crea = middleware((req) => {
  const errori = [];
  const { nome, livello, prezzoMensile, postiMax, SalaId, iscrittiIds } = req.body || {};

  if (vuoto(nome))    errori.push('Il campo "nome" e\' obbligatorio.');

  if (vuoto(livello)) errori.push('Il campo "livello" e\' obbligatorio.');
  else if (!LIVELLI.includes(livello)) {
    errori.push(`Il campo "livello" deve essere uno di: ${LIVELLI.join(', ')}.`);
  }

  if (prezzoMensile === undefined) errori.push('Il campo "prezzoMensile" e\' obbligatorio.');
  else if (!isNumeroPositivo(prezzoMensile)) errori.push('Il campo "prezzoMensile" deve essere un numero >= 0.');

  if (postiMax === undefined) errori.push('Il campo "postiMax" e\' obbligatorio.');
  else if (!isIntPositivo(postiMax) || Number(postiMax) === 0) {
    errori.push('Il campo "postiMax" deve essere un intero > 0.');
  }

  if (SalaId === undefined) errori.push('Il campo "SalaId" e\' obbligatorio.');
  else if (!isIntPositivo(SalaId) || Number(SalaId) === 0) {
    errori.push('Il campo "SalaId" deve essere un intero positivo.');
  }

  // iscrittiIds e' OPZIONALE: controlliamo solo se e' presente.
  if (iscrittiIds !== undefined && !isArrayDiIdPositivi(iscrittiIds)) {
    errori.push('Il campo "iscrittiIds" deve essere un array di interi positivi.');
  }
  return errori;
});

/**
 * PUT /api/corsi/:id - update PARZIALE.
 *
 * Come per gli iscritti: nessun campo obbligatorio, ma se un campo e'
 * presente deve essere valido. La differenza importante rispetto alla POST
 * e' l'uso di `!== undefined` come guardia iniziale su ogni campo.
 */
exports.aggiorna = middleware((req) => {
  const errori = [];
  const { nome, livello, prezzoMensile, postiMax, SalaId, iscrittiIds } = req.body || {};

  if (nome !== undefined && vuoto(nome)) errori.push('Il campo "nome" non puo\' essere vuoto.');
  if (livello !== undefined && !LIVELLI.includes(livello)) {
    errori.push(`Il campo "livello" deve essere uno di: ${LIVELLI.join(', ')}.`);
  }
  if (prezzoMensile !== undefined && !isNumeroPositivo(prezzoMensile)) {
    errori.push('Il campo "prezzoMensile" deve essere un numero >= 0.');
  }
  if (postiMax !== undefined && (!isIntPositivo(postiMax) || Number(postiMax) === 0)) {
    errori.push('Il campo "postiMax" deve essere un intero > 0.');
  }
  if (SalaId !== undefined && (!isIntPositivo(SalaId) || Number(SalaId) === 0)) {
    errori.push('Il campo "SalaId" deve essere un intero positivo.');
  }
  if (iscrittiIds !== undefined && !isArrayDiIdPositivi(iscrittiIds)) {
    errori.push('Il campo "iscrittiIds" deve essere un array di interi positivi.');
  }
  return errori;
});

/**
 * GET /api/corsi/search?q=...
 *
 * L'unico parametro atteso e' `q` in query string. Deve essere non-vuoto.
 * Il messaggio d'errore ricalca esattamente quello richiesto dalla
 * specifica (sezione 5, endpoint 13):
 *   "Parametro di ricerca 'q' obbligatorio."
 */
exports.search = middleware((req) => {
  if (vuoto(req.query.q)) return ["Parametro di ricerca 'q' obbligatorio."];
  return [];
});

/**
 * Validator :id di URL.
 * Identico agli altri validator; centralizzarlo in un helper condiviso
 * sarebbe possibile ma renderebbe meno chiaro l'accoppiamento risorsa-validator.
 */
exports.paramId = middleware((req) => {
  if (!isIntPositivo(req.params.id) || Number(req.params.id) === 0) {
    return ['Il parametro "id" deve essere un intero positivo.'];
  }
  return [];
});
