/**
 * services/corsiService.js
 *
 * Layer di business per i corsi. E' il service piu' articolato perche':
 *   - la creazione/aggiornamento coinvolge PIU' tabelle (Corso + pivot);
 *   - prima di scrivere dobbiamo verificare l'esistenza di sala e iscritti;
 *   - l'endpoint 14 ("corsi disponibili") ha una logica di filtro sui posti.
 *
 * Convenzione di ritorno per operazioni con esiti multipli:
 *   { esito: '<codice>', ...datiEventuali }
 * Il controller usa esito come "discriminator" per scegliere lo status HTTP.
 */
const corsoRepository = require('../repositories/corsoRepository');
const salaRepository = require('../repositories/salaRepository');
const iscrittoRepository = require('../repositories/iscrittoRepository');

/**
 * Campi ammessi in update (whitelist di sicurezza: vedi iscrittiService).
 * Notare che `id` non e' aggiornabile (chiave immutabile) e nemmeno
 * `iscrittiIds` compare qui, perche' non e' una colonna della tabella Corsi:
 * viene gestita a parte con setIscritti() sulla pivot.
 */
const CAMPI_AGGIORNABILI = ['nome', 'descrizione', 'livello', 'prezzoMensile', 'postiMax', 'SalaId'];

/**
 * Helper: dato un array di id iscritti richiesti, ritorna quelli MANCANTI
 * nel DB. Usiamo un Set per la ricerca in tempo costante O(1); su un array
 * normale sarebbe O(n) per ogni lookup, che moltiplicato per gli n elementi
 * darebbe O(n^2).
 *
 * Attenzione ai tipi: i valori nel Set vengono da instanze Sequelize
 * (numeri interi), gli id in input potrebbero essere stringhe o numeri
 * (a seconda di come li manda il client). Convertiamo con Number(id) nel
 * filter finale per garantire il confronto corretto.
 */
async function trovaIscrittiMancanti(ids) {
  const trovati = await iscrittoRepository.findByIds(ids);
  const idTrovati = new Set(trovati.map((i) => i.id));
  return ids.filter((id) => !idTrovati.has(Number(id)));
}

// Endpoint 8 - Lista corsi con sala e iscritti (pass-through).
exports.elencaTutti = () => corsoRepository.findAll();

// Endpoint 10 - Dettaglio corso (pass-through).
exports.trovaPerId = (id) => corsoRepository.findByIdConRelazioni(id);

// Endpoint 13 - Ricerca per nome (pass-through al repository).
exports.cerca = (q) => corsoRepository.search(q);

/**
 * Endpoint 9 - Crea un corso e (opzionalmente) associa iscritti.
 *
 * Sequenza:
 *   1) La sala deve esistere -> se no, 'sala-non-trovata'.
 *   2) Se il client ha passato iscrittiIds, verifico che TUTTI esistano
 *      PRIMA di creare il corso. Se anche uno solo manca, rispondo
 *      'iscritti-non-trovati' con l'elenco dei mancanti, e non creo nulla.
 *      Questo evita di creare record orfani (un corso senza gli iscritti
 *      che il client si aspettava) che poi il client non saprebbe di avere.
 *   3) Creo il corso.
 *   4) Se ci sono iscritti da collegare, li collego con setIscritti().
 *   5) Rileggo il corso con le relazioni per rispondere una "forma completa".
 *
 * Perche' il passo 2 non e' racchiuso nel passo 4? Sarebbe piu' compatto,
 * ma perderei il "controllo prima di scrivere". Con questa sequenza NON
 * lascio mai il DB in uno stato inconsistente.
 *
 * NB atomicita': in un progetto "vero" i passi 3-4 andrebbero in una
 * transazione (sequelize.transaction()). Per semplicita' didattica e coerenza
 * con la specifica (che non lo richiede) non usiamo transazioni qui.
 */
exports.crea = async ({ nome, descrizione, livello, prezzoMensile, postiMax, SalaId, iscrittiIds }) => {
  const sala = await salaRepository.findById(SalaId);
  if (!sala) return { esito: 'sala-non-trovata' };

  if (Array.isArray(iscrittiIds) && iscrittiIds.length > 0) {
    const mancanti = await trovaIscrittiMancanti(iscrittiIds);
    if (mancanti.length > 0) return { esito: 'iscritti-non-trovati', mancanti };
  }

  const corso = await corsoRepository.create({ nome, descrizione, livello, prezzoMensile, postiMax, SalaId });
  if (Array.isArray(iscrittiIds) && iscrittiIds.length > 0) {
    await corsoRepository.setIscritti(corso, iscrittiIds);
  }

  const corsoCompleto = await corsoRepository.findByIdConRelazioni(corso.id);
  return { esito: 'ok', corso: corsoCompleto };
};

/**
 * Endpoint 11 - Aggiorna un corso (update parziale) e, se il client passa
 * iscrittiIds, SOSTITUISCE l'insieme di iscritti (setIscritti).
 *
 * Precondizioni verificate qui:
 *   - Il corso deve esistere.
 *   - Se cambia SalaId, la nuova sala deve esistere.
 *   - Se cambiano gli iscritti, TUTTI gli id devono esistere.
 *
 * Comportamento setIscritti:
 *   iscrittiIds = [1,2] -> pivot avra' esattamente {(id,1),(id,2)}.
 *   iscrittiIds = []    -> pivot svuotata (tutti gli iscritti rimossi).
 *   iscrittiIds assente -> pivot NON toccata (solo campi anagrafici aggiornati).
 */
exports.aggiorna = async (id, dati) => {
  const corso = await corsoRepository.findById(id);
  if (!corso) return { esito: 'non-trovato' };

  if (dati.SalaId !== undefined) {
    const sala = await salaRepository.findById(dati.SalaId);
    if (!sala) return { esito: 'sala-non-trovata' };
  }

  if (Array.isArray(dati.iscrittiIds) && dati.iscrittiIds.length > 0) {
    const mancanti = await trovaIscrittiMancanti(dati.iscrittiIds);
    if (mancanti.length > 0) return { esito: 'iscritti-non-trovati', mancanti };
  }

  // Costruisco la patch con la sola whitelist (safe by default).
  const patch = {};
  for (const campo of CAMPI_AGGIORNABILI) {
    if (dati[campo] !== undefined) patch[campo] = dati[campo];
  }
  await corsoRepository.save(corso, patch);

  // Attenzione: `Array.isArray(dati.iscrittiIds)` (senza il check length>0)
  // permette di passare [] per svuotare esplicitamente la pivot.
  if (Array.isArray(dati.iscrittiIds)) {
    await corsoRepository.setIscritti(corso, dati.iscrittiIds);
  }

  const corsoCompleto = await corsoRepository.findByIdConRelazioni(id);
  return { esito: 'ok', corso: corsoCompleto };
};

/**
 * Endpoint 12 - Elimina un corso.
 * Ritorna true se ok, false se non trovato.
 *
 * setIscritti([]) prima di destroy() e' RIDONDANTE (ON DELETE CASCADE nel
 * DB fa la stessa cosa), ma lasciarlo esplicito rende l'intenzione del
 * codice leggibile: "prima svuoto la pivot, poi cancello il corso".
 * In caso qualcuno domani togliesse il CASCADE dal DB, il codice resta
 * corretto.
 */
exports.elimina = async (id) => {
  const corso = await corsoRepository.findById(id);
  if (!corso) return false;
  await corsoRepository.setIscritti(corso, []);
  await corsoRepository.destroy(corso);
  return true;
};

/**
 * Endpoint 14 - Corsi con posti ancora disponibili (iscritti attuali < postiMax).
 *
 * Alternative valutate:
 *   A) Sub-query SQL con COUNT e HAVING:
 *      SELECT * FROM Corsi c
 *      WHERE (SELECT COUNT(*) FROM CorsoIscritto WHERE CorsoId = c.id) < c.postiMax
 *      -> piu' efficiente su dataset grandi, meno leggibile in Sequelize.
 *   B) Include Iscritto + filtro in JavaScript (scelta attuale):
 *      -> piu' leggibile, i volumi di una palestra sono contenuti (decine
 *         di corsi, centinaia di iscritti), quindi la differenza pratica
 *         di prestazioni e' trascurabile.
 *
 * Aggiungiamo alla risposta due campi calcolati per comodita' del client:
 *   - postiOccupati    = numero iscritti collegati
 *   - postiDisponibili = postiMax - postiOccupati
 * Il metodo toJSON() serializza l'istanza Sequelize in un oggetto piano:
 * senza di esso avremmo problemi ad aggiungere proprieta' (Sequelize usa
 * getter/setter e non e' un oggetto "puro").
 */
exports.disponibili = async () => {
  const corsi = await corsoRepository.findAll();

  return corsi
    // c.Iscritti perche' l'associazione ha `as: { plural: 'Iscritti' }`;
    // senza l'alias italiano sarebbe stato c.Iscrittos.
    .filter((c) => c.Iscritti.length < c.postiMax)
    .map((c) => {
      const json = c.toJSON();
      json.postiOccupati = json.Iscritti.length;
      json.postiDisponibili = json.postiMax - json.postiOccupati;
      return json;
    });
};
