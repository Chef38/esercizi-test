/**
 * repository/autoreRepository.js
 * Solo query Sequelize — nessuna logica di business.
 */

const { Autore, Libro, Categoria } = require('../models');

// Include standard: per ogni autore carica anche i suoi libri con la categoria
const INCLUDE_LIBRI = [{
  model: Libro,
  as:    'libri',
  include: [{ model: Categoria, as: 'categoria' }],
}];

const autoreRepository = {

  /** SELECT * FROM autore + JOIN libri */
  findAll: () => Autore.findAll({ include: INCLUDE_LIBRI }),

  /** SELECT * FROM autore WHERE id = ? + JOIN libri */
  findById: (id) => Autore.findByPk(id, { include: INCLUDE_LIBRI }),

  /** SELECT * FROM autore WHERE id = ? (senza JOIN, per aggiornamenti) */
  findByIdSemplice: (id) => Autore.findByPk(id),

  /** INSERT INTO autore ... */
  create: (dati) => Autore.create(dati),

  /** UPDATE autore SET ... WHERE id = ? */
  save: (autore) => autore.save(),

  /** DELETE FROM autore WHERE id = ? */
  delete: (autore) => autore.destroy(),

};

module.exports = autoreRepository;