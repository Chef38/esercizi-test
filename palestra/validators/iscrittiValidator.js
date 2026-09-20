/**
 * validators/iscrittiValidator.js
 *
 * Middleware Express per la validazione degli endpoint degli Iscritti.
 *
 * Il file espone TRE middleware:
 *   crea      -> POST /api/iscritti      (tutti i campi obbligatori)
 *   aggiorna  -> PUT  /api/iscritti/:id  (nessun campo obbligatorio, ma
 *                                          se presente deve essere valido)
 *   paramId   -> :id nell'URL            (formato del path parameter)
 *
 * La distinzione crea/aggiorna e' importante: la POST richiede TUTTI i
 * campi (record nuovo, il DB non tollera NULL su nome/cognome/email/
 * dataNascita), mentre la PUT accetta patch parziali (voglio aggiornare
 * solo la mail? mando solo la mail).
 */
const { vuoto, isEmail, isDateOnly, isIntPositivo, middleware } = require('./_helpers');

/**
 * POST /api/iscritti - tutti i campi obbligatori.
 *
 * Doppio controllo su email/dataNascita:
 *   1) "obbligatorio se vuoto"    -> messaggio "e' obbligatorio."
 *   2) "formato valido se presente" -> messaggio "non ha formato valido."
 * Cosi' il client sa se ha dimenticato il campo o l'ha compilato male.
 *
 * Volutamente NON controlliamo che email sia unica: quello e' un vincolo
 * di INTEGRITA' del DB (UNIQUE), non un vincolo di FORMATO. Il DB lo
 * verifica e Sequelize solleva SequelizeUniqueConstraintError, che il
 * controller intercetta per rispondere 400 con "Email gia registrata.".
 */
exports.crea = middleware((req) => {
  const errori = [];
  const { nome, cognome, email, dataNascita } = req.body || {};

  if (vuoto(nome))    errori.push('Il campo "nome" e\' obbligatorio.');
  if (vuoto(cognome)) errori.push('Il campo "cognome" e\' obbligatorio.');

  if (vuoto(email))       errori.push('Il campo "email" e\' obbligatorio.');
  else if (!isEmail(email)) errori.push('Il campo "email" non ha un formato valido.');

  if (vuoto(dataNascita))       errori.push('Il campo "dataNascita" e\' obbligatorio.');
  else if (!isDateOnly(dataNascita)) errori.push('Il campo "dataNascita" deve essere nel formato YYYY-MM-DD.');

  return errori;
});

/**
 * PUT /api/iscritti/:id - update PARZIALE.
 *
 * La regola qui e' invertita: NESSUN campo e' obbligatorio (posso mandare
 * anche solo un campo per volta), ma SE un campo e' presente deve essere
 * valido. Questo permette al client di correggere solo l'informazione
 * sbagliata senza dover re-inviare tutto il record.
 *
 * Il check `!== undefined` distingue "campo assente" (chiave non nel body)
 * da "campo esplicitamente null/stringa vuota" (che considereremmo un
 * tentativo di svuotare un campo NOT NULL -> errore di formato).
 */
exports.aggiorna = middleware((req) => {
  const errori = [];
  const { nome, cognome, email, dataNascita } = req.body || {};

  if (nome !== undefined && vuoto(nome))       errori.push('Il campo "nome" non puo\' essere vuoto.');
  if (cognome !== undefined && vuoto(cognome)) errori.push('Il campo "cognome" non puo\' essere vuoto.');
  if (email !== undefined && !isEmail(email))  errori.push('Il campo "email" non ha un formato valido.');
  if (dataNascita !== undefined && !isDateOnly(dataNascita)) {
    errori.push('Il campo "dataNascita" deve essere nel formato YYYY-MM-DD.');
  }
  return errori;
});

/**
 * Validator del path parameter :id.
 * Identico a quello delle sale: :id deve essere un intero positivo.
 * Bloccare qui i valori insensati evita query al DB con id "abc" o "-5".
 */
exports.paramId = middleware((req) => {
  if (!isIntPositivo(req.params.id) || Number(req.params.id) === 0) {
    return ['Il parametro "id" deve essere un intero positivo.'];
  }
  return [];
});
