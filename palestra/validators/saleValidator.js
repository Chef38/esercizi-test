/**
 * validators/saleValidator.js
 *
 * Middleware Express che validano l'input degli endpoint delle Sale.
 *
 * Come si compone un validator:
 *   1) Definisco una funzione (req) => string[] che raccoglie gli errori.
 *   2) La incarto con middleware(...) di _helpers.js, che si occupa di
 *      rispondere 400 quando la lista non e' vuota o di chiamare next()
 *      altrimenti.
 *
 * Distinzione importante: qui si controlla il FORMATO dell'input (esiste?
 * e' del tipo giusto?), NON la logica di business (es. "la sala esiste
 * gia'?"). Questo permette al controller/service di ricevere dati "puliti"
 * e concentrarsi solo sulle regole di dominio.
 */
const { vuoto, isIntPositivo, middleware } = require('./_helpers');

/**
 * POST /api/sale - creazione sala.
 * Campi obbligatori: nome, piano, capienza. Note:
 *   - `piano` puo' valere 0 (piano terra), quindi controlliamo isIntPositivo
 *     senza escludere lo zero.
 *   - `capienza` invece deve essere > 0: una sala con capienza 0 non ha senso.
 *
 * Uso della sequenza "if (undefined) ... else if (!valido)" per dare
 * messaggi di errore differenziati fra "campo mancante" e "campo con
 * formato sbagliato". Aiuta lato client a capire cosa correggere.
 */
exports.crea = middleware((req) => {
  const errori = [];
  const { nome, piano, capienza } = req.body || {};

  if (vuoto(nome))            errori.push('Il campo "nome" e\' obbligatorio.');
  if (piano === undefined)    errori.push('Il campo "piano" e\' obbligatorio.');
  else if (!isIntPositivo(piano)) errori.push('Il campo "piano" deve essere un intero >= 0.');

  if (capienza === undefined) errori.push('Il campo "capienza" e\' obbligatorio.');
  else if (!isIntPositivo(capienza) || Number(capienza) === 0) {
    errori.push('Il campo "capienza" deve essere un intero > 0.');
  }
  return errori;
});

/**
 * Validator dei parametri di URL (:id).
 * Usato da DELETE /api/sale/:id e da GET /api/sale/:id/corsi.
 *
 * req.params.id arriva SEMPRE come stringa (Express estrae la parte URL
 * cosi' com'e'). isIntPositivo accetta anche stringhe di soli digit, quindi
 * funziona; escludiamo esplicitamente "0" perche' un id 0 non e' valido
 * in un DB con AUTO_INCREMENT (che parte da 1).
 *
 * Se questo controllo fallisce, evitiamo di chiamare il DB con id assurdi
 * (es. /api/sale/pippo -> Sequelize genererebbe un errore poco leggibile).
 */
exports.paramId = middleware((req) => {
  if (!isIntPositivo(req.params.id) || Number(req.params.id) === 0) {
    return ['Il parametro "id" deve essere un intero positivo.'];
  }
  return [];
});
