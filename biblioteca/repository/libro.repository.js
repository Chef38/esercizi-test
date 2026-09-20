/**
 * repository/libroRepository.js
 * Solo query Sequelize — nessuna logica di business.
 */

// Op contiene gli operatori Sequelize (like, gt, in, ecc.)
const { Op } = require('sequelize');
const { Libro, Autore, Categoria } = require('../models');

// Include standard: per ogni libro carica autore e categoria
// Riutilizzato in quasi tutte le query per non ripetere l'oggetto include
const INCLUDE_COMPLETO = [
  { model: Categoria, as: 'categoria' }, // JOIN con la categoria
  { model: Autore,    as: 'autore'    }, // JOIN con l'autore
];

const libroRepository = {

  /** SELECT * FROM libro + JOIN autore + JOIN categoria */
  findAll: () => Libro.findAll({ include: INCLUDE_COMPLETO }),

  /** SELECT * FROM libro WHERE id = ? + JOIN */
  findById: (id) => Libro.findByPk(id, { include: INCLUDE_COMPLETO }),

  /** SELECT * FROM libro WHERE id = ? (senza JOIN, per aggiornamenti) */
  // Versione senza JOIN: più veloce, usata quando serve solo aggiornare/cancellare
  findByIdSemplice: (id) => Libro.findByPk(id),

  /** SELECT * FROM libro WHERE disponibile = 1 + JOIN */
  findDisponibili: () => Libro.findAll({
    where:   { disponibile: true }, // filtro
    include: INCLUDE_COMPLETO,
  }),

  /** SELECT * FROM libro WHERE titolo LIKE '%q%' + JOIN */
  // [Op.like] è la sintassi Sequelize per l'operatore SQL LIKE
  // Il pattern %q% cerca la stringa in qualsiasi posizione del titolo
  search: (q) => Libro.findAll({
    where:   { titolo: { [Op.like]: `%${q}%` } },
    include: INCLUDE_COMPLETO,
  }),

  /** SELECT * FROM libro WHERE categoriaId = ? + JOIN */
  // Shorthand: { categoriaId } equivale a { categoriaId: categoriaId }
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
  // reload() rifà una SELECT sull'istanza e la aggiorna in memoria.
  // Utile dopo create/update per restituire l'oggetto CON i JOIN.
  reload: (libro) => libro.reload({ include: INCLUDE_COMPLETO }),

};

module.exports = libroRepository;