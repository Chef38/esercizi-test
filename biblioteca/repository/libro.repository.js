/**
 * repository/libroRepository.js
 * Solo query Sequelize — nessuna logica di business.
 */

const { Op } = require('sequelize');
const { Libro, Autore, Categoria } = require('../models');

// Include standard: per ogni libro carica autore e categoria
const INCLUDE_COMPLETO = [
  { model: Categoria, as: 'categoria' },
  { model: Autore,    as: 'autore'    },
];

const libroRepository = {

  /** SELECT * FROM libro + JOIN autore + JOIN categoria */
  findAll: () => Libro.findAll({ include: INCLUDE_COMPLETO }),

  /** SELECT * FROM libro WHERE id = ? + JOIN */
  findById: (id) => Libro.findByPk(id, { include: INCLUDE_COMPLETO }),

  /** SELECT * FROM libro WHERE id = ? (senza JOIN, per aggiornamenti) */
  findByIdSemplice: (id) => Libro.findByPk(id),

  /** SELECT * FROM libro WHERE disponibile = 1 + JOIN */
  findDisponibili: () => Libro.findAll({
    where:   { disponibile: true },
    include: INCLUDE_COMPLETO,
  }),

  /** SELECT * FROM libro WHERE titolo LIKE '%q%' + JOIN */
  search: (q) => Libro.findAll({
    where:   { titolo: { [Op.like]: `%${q}%` } },
    include: INCLUDE_COMPLETO,
  }),

  /** SELECT * FROM libro WHERE categoriaId = ? + JOIN */
  findByCategoria: (categoriaId) => Libro.findAll({
    where:   { categoriaId },
    include: INCLUDE_COMPLETO,
  }),

  /** SELECT * FROM libro WHERE autoreId = ? + JOIN */
  findByAutore: (autoreId) => Libro.findAll({
    where:   { autoreId },
    include: INCLUDE_COMPLETO,
  }),

  /** INSERT INTO libro ... */
  create: (dati) => Libro.create(dati),

  /** UPDATE libro SET ... WHERE id = ? */
  save: (libro) => libro.save(),

  /** DELETE FROM libro WHERE id = ? */
  delete: (libro) => libro.destroy(),

  /** Ricarica il libro con tutte le relazioni dopo un aggiornamento */
  reload: (libro) => libro.reload({ include: INCLUDE_COMPLETO }),

};

module.exports = libroRepository;