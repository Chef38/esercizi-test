/**
 * repository/autoreRepository.js
 * Solo query Sequelize — nessuna logica di business.
 */

// Importa i modelli necessari per le query e i JOIN
const { Autore, Libro, Categoria } = require('../models');

// Include standard: per ogni autore carica anche i suoi libri con la categoria
// Definito come costante per RIUSO: evita di ripeterlo in ogni query.
// È un JOIN annidato: Autore → Libri → Categoria (2 livelli di include).
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
  // Versione LEGGERA: senza JOIN, più veloce. Usato quando serve solo
  // controllare l'esistenza o modificare i campi dell'autore.
  findByIdSemplice: (id) => Autore.findByPk(id),

  /** INSERT INTO autore ... */
  create: (dati) => Autore.create(dati),

  /** UPDATE autore SET ... WHERE id = ? */
  // save() su un'istanza Sequelize genera INSERT o UPDATE a seconda
  // che l'oggetto sia nuovo o già esistente nel DB
  save: (autore) => autore.save(),

  /** DELETE FROM autore WHERE id = ? */
  delete: (autore) => autore.destroy(),

};

module.exports = autoreRepository;