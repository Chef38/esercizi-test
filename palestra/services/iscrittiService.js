/**
 * services/iscrittiService.js
 *
 * Layer di business per gli iscritti. La logica qui e' minima (le API sono
 * quasi puro CRUD), ma il file esiste comunque per uniformita' architetturale:
 * il controller sa che deve chiamare il service e basta, senza chiedersi se
 * "questa risorsa e' abbastanza complessa da meritarne uno".
 */
const iscrittoRepository = require('../repositories/iscrittoRepository');

/**
 * Whitelist dei campi che l'endpoint PUT puo' aggiornare.
 * Perche' una whitelist e non "aggiorna tutto quello che arriva"?
 *   Per sicurezza. Se un attaccante inviasse { id: 999, nome: 'X' }, senza
 *   filtro potrebbe sovrascrivere anche colonne che non dovrebbe toccare
 *   (id, createdBy, isAdmin, ecc.). La whitelist e' l'idioma "safe by default":
 *   solo i campi elencati esplicitamente sono aggiornabili.
 */
const CAMPI_AGGIORNABILI = ['nome', 'cognome', 'email', 'dataNascita'];

// Endpoint 4 - Lista di tutti gli iscritti. Pass-through.
exports.elencaTutti = () => iscrittoRepository.findAll();

// Endpoint 5 - Crea un nuovo iscritto. Il vincolo UNIQUE su email e' gestito
// a livello di DB + controller (SequelizeUniqueConstraintError -> 400).
exports.crea = ({ nome, cognome, email, dataNascita }) => iscrittoRepository.create({
  nome, cognome, email, dataNascita
});

// Endpoint 6 - Dettaglio iscritto con corsi frequentati (e sala di ciascuno).
exports.trovaPerId = (id) => iscrittoRepository.findByIdConCorsi(id);

/**
 * Endpoint 7 - Aggiorna un iscritto esistente.
 *
 * Ritorna:
 *   - null              : iscritto non trovato -> controller risponde 404
 *   - istanza iscritto  : aggiornato con successo -> controller risponde 200
 *
 * Perche' NON restituiamo un codice-stringa qui?
 *   Perche' c'e' un solo esito "logico" (not-found) oltre al successo;
 *   restituire null e' idiomatico e chiama meno cerimonia. La convenzione
 *   della codebase e': stringa quando gli esiti sono 3+, null altrimenti.
 */
exports.aggiorna = async (id, dati) => {
  const iscritto = await iscrittoRepository.findById(id);
  if (!iscritto) return null;

  // Costruisco l'oggetto patch solo con i campi che sono effettivamente
  // presenti nel body. `undefined` (chiave assente) NON viene toccata:
  // questo rende il PUT "parziale" (chi manda solo { email } aggiorna
  // solo email). Alcuni preferiscono chiamare "PATCH" questo comportamento;
  // la specifica dell'esercizio parla di PUT, quindi restiamo su PUT.
  const patch = {};
  for (const campo of CAMPI_AGGIORNABILI) {
    if (dati[campo] !== undefined) patch[campo] = dati[campo];
  }
  return iscrittoRepository.save(iscritto, patch);
};
