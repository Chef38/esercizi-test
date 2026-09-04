/**
 * service/autoreService.js — Logica di business per Autore
 */

const repo = require('../repository/autore.repository');

const autoreService = {

  getAll: async () => repo.findAll(),

  getById: async (id) => {
    const autore = await repo.findById(id);
    if (!autore) throw { status: 404, message: 'Autore non trovato.' };
    return autore;
  },

  create: async ({ nome, cognome, nazionalita, annoNascita }) => {
    return repo.create({ nome, cognome, nazionalita, annoNascita });
  },

  update: async (id, datiNuovi) => {
    const autore = await repo.findByIdSemplice(id);
    if (!autore) throw { status: 404, message: 'Autore non trovato.' };

    const campiAmmessi = ['nome', 'cognome', 'nazionalita', 'annoNascita'];
    campiAmmessi.forEach(campo => {
      if (datiNuovi[campo] !== undefined) autore[campo] = datiNuovi[campo];
    });

    await repo.save(autore);
    return repo.findById(id); // ricarica con i libri
  },

  delete: async (id) => {
    const autore = await repo.findByIdSemplice(id);
    if (!autore) throw { status: 404, message: 'Autore non trovato.' };
    return repo.delete(autore);
  },

};

module.exports = autoreService;