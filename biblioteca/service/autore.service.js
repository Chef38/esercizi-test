/**
 * service/autoreService.js — Logica di business per Autore
 *
 * A differenza di Categoria non impone unicità (esistono autori omonimi).
 * Regola principale: verificare che l'autore esista prima di update/delete.
 */

const repo = require('../repository/autore.repository');

const autoreService = {

  // Restituisce tutti gli autori (con i loro libri joinati dal repo)
  getAll: async () => repo.findAll(),

  // Cerca un autore per id (con i suoi libri). 404 se non trovato.
  getById: async (id) => {
    const autore = await repo.findById(id);
    if (!autore) throw { status: 404, message: 'Autore non trovato.' };
    return autore;
  },

  // Crea un nuovo autore: solo INSERT, nessun controllo particolare
  create: async ({ nome, cognome, nazionalita, annoNascita }) => {
    // Destrutturazione: passa al repo solo i campi previsti
    return repo.create({ nome, cognome, nazionalita, annoNascita });
  },

  // Aggiorna un autore esistente
  update: async (id, datiNuovi) => {
    // Uso findByIdSemplice (senza JOIN libri) → più leggero, non serve
    const autore = await repo.findByIdSemplice(id);
    if (!autore) throw { status: 404, message: 'Autore non trovato.' };

    // Whitelist dei campi modificabili
    const campiAmmessi = ['nome', 'cognome', 'nazionalita', 'annoNascita'];
    campiAmmessi.forEach(campo => {
      if (datiNuovi[campo] !== undefined) autore[campo] = datiNuovi[campo];
    });

    await repo.save(autore);
    // Ricarica con i libri joinati per restituire l'oggetto completo
    return repo.findById(id);
  },

  // Cancella un autore. Non blocca la delete se ha libri (a differenza di Categoria)
  delete: async (id) => {
    const autore = await repo.findByIdSemplice(id);
    if (!autore) throw { status: 404, message: 'Autore non trovato.' };
    return repo.delete(autore);
  },

};

module.exports = autoreService;