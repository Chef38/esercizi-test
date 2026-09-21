/**
 * repository/autoreRepository.js
 * Solo query Sequelize — nessuna logica di business.
 */

// Importa i modelli necessari per le query e i JOIN
const { Op } = require('sequelize');
const { Autore, Libro, Categoria } = require('../models');

// Include standard: per ogni autore carica anche i suoi libri con la categoria.
// Ora è many-to-many, quindi bisogna nascondere le colonne della pivot
// con `through: { attributes: [] }` per un output più pulito.
const INCLUDE_LIBRI = [{
  model:   Libro,
  as:      'libri',
  through: { attributes: [] },
  include: [{ model: Categoria, as: 'categoria' }],
}];

const autoreRepository = {

  /** SELECT * FROM autore + JOIN libri (many-to-many) */
  findAll: () => Autore.findAll({ include: INCLUDE_LIBRI }),

  /** SELECT * FROM autore WHERE id = ? + JOIN libri */
  findById: (id) => Autore.findByPk(id, { include: INCLUDE_LIBRI }),

  /** SELECT * FROM autore WHERE id = ? (senza JOIN, per aggiornamenti) */
  // Versione LEGGERA: senza JOIN, più veloce. Usata quando serve solo
  // controllare l'esistenza o modificare i campi dell'autore.
  findByIdSemplice: (id) => Autore.findByPk(id),

  /** SELECT * FROM autore WHERE id IN (...)
   *  Utile per verificare in un colpo solo che TUTTI gli id passati
   *  in autori_ids esistano davvero (POST/PUT /libri). */
  findByIds: (ids) => Autore.findAll({ where: { id: { [Op.in]: ids } } }),

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