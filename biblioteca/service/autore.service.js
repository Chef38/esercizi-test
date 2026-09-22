/**
 * service/autore.service.js
 * Logica di business + query Sequelize (repository "inline").
 */

const { Op } = require('sequelize');
const { Autore, Libro, Categoria } = require('../models');

// Include standard: autore → libri (many-to-many) → categoria
// `through: { attributes: [] }` = non includere le colonne della pivot
// nella risposta JSON.
const INCLUDE_LIBRI = [{
  model:   Libro,
  as:      'libri',
  through: { attributes: [] },
  include: [{ model: Categoria, as: 'categoria' }],
}];

const autoreService = {

  // Lista con i libri di ciascuno
  getAll: async () => Autore.findAll({ include: INCLUDE_LIBRI }),

  // Dettaglio (con libri)
  getById: async (id) => {
    const autore = await Autore.findByPk(id, { include: INCLUDE_LIBRI });
    if (!autore) throw { status: 404, message: 'Autore non trovato.' };
    return autore;
  },

  // Utility usata dal service Libro per verificare che tutti gli id
  // in autori_ids esistano davvero (SELECT ... WHERE id IN (...))
  findByIds: (ids) => Autore.findAll({ where: { id: { [Op.in]: ids } } }),

  // Crea nuovo autore
  create: async ({ nome, cognome, nazionalita, annoNascita }) => {
    return Autore.create({ nome, cognome, nazionalita, annoNascita });
  },

  // Aggiornamento parziale
  update: async (id, datiNuovi) => {
    const autore = await Autore.findByPk(id);
    if (!autore) throw { status: 404, message: 'Autore non trovato.' };

    const campiAmmessi = ['nome', 'cognome', 'nazionalita', 'annoNascita'];
    campiAmmessi.forEach(c => {
      if (datiNuovi[c] !== undefined) autore[c] = datiNuovi[c];
    });

    await autore.save();
    // Ricarica con i libri per restituire l'oggetto completo
    return Autore.findByPk(id, { include: INCLUDE_LIBRI });
  },

  // Cancella
  delete: async (id) => {
    const autore = await Autore.findByPk(id);
    if (!autore) throw { status: 404, message: 'Autore non trovato.' };
    return autore.destroy();
  },

};

module.exports = autoreService;
