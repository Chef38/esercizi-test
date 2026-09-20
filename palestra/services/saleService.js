/**
 * services/saleService.js
 *
 * Il service e' il layer di ORCHESTRAZIONE / logica di business:
 *   - riceve dati "puliti" dal controller (la validazione l'ha fatta il validator);
 *   - decide COSA fare (verifica prerequisiti, coordina piu' repository);
 *   - restituisce dati o codici-esito, MAI oggetti req/res.
 *
 * Il service NON contiene SELECT/INSERT/UPDATE espliciti: quelli sono nel
 * repository. Cosi' se domani cambiamo ORM, il service resta invariato.
 */
const salaRepository = require('../repositories/salaRepository');

// Endpoint 1 - Lista sale (nessuna logica: pass-through al repository).
// Volutamente "banale": il layer service esiste comunque per uniformita';
// il giorno in cui aggiungeremo (ad esempio) un filtro per piano, il
// controller resta identico e cambia solo qui.
exports.elencaTutte = () => salaRepository.findAll();

// Endpoint 2 - Crea sala. Il controller ha gia' verificato la presenza
// dei campi (validator); qui ci limitiamo a passare l'oggetto al repository.
exports.crea = ({ nome, piano, capienza }) => salaRepository.create({ nome, piano, capienza });

/**
 * Endpoint 3 - Elimina una sala.
 *
 * Regola di business (dalla specifica): "si puo' eliminare solo se non ha
 * corsi associati". La regola vive QUI perche' non e' un vincolo di formato
 * dell'input (non tocca al validator) ne' un dettaglio di persistenza (non
 * tocca al repository).
 *
 * Restituiamo un CODICE-ESITO come stringa invece di un oggetto/exception:
 *   - 'not-found' : la sala non esiste                 -> il controller fa 404
 *   - 'has-corsi' : ha corsi collegati, non cancellabile -> il controller fa 400
 *   - 'ok'        : cancellata con successo             -> il controller fa 204
 *
 * Perche' non usare eccezioni? Perche' "sala non trovata" e "sala con corsi"
 * NON sono errori tecnici: sono esiti previsti del dominio. Le eccezioni
 * andrebbero riservate a fallimenti realmente inattesi (DB giu', ecc.).
 */
exports.elimina = async (id) => {
  const sala = await salaRepository.findById(id);
  if (!sala) return 'not-found';

  // count(...) e' molto piu' economico di findAll + length: il DB conta senza
  // materializzare le righe. Con solo poche righe la differenza e' minima,
  // ma su tabelle grandi cambia tutto.
  const corsiAssociati = await salaRepository.countCorsiPerSala(id);
  if (corsiAssociati > 0) return 'has-corsi';

  await salaRepository.destroy(sala);
  return 'ok';
};

/**
 * Endpoint 15 - Corsi di una specifica sala.
 * Delego direttamente al repository; il controller decidera' se e' 404
 * (sala inesistente => il repository restituisce null) o 200 con la lista.
 */
exports.corsiDellaSala = (id) => salaRepository.findByIdConCorsi(id);
