/**
 * repository/categoriaRepository.js
 * Solo query Sequelize — nessuna logica di business.
 *
 * PATTERN Repository: isola le query DB dal service.
 * Se domani cambia l'ORM, si modifica solo questo file.
 */

// Importa i modelli dall'index (che ha anche definito le associazioni)
const { Categoria, Libro } = require('../models');

const categoriaRepository = {

  /** SELECT * FROM categoria */
  // findAll senza opzioni → prende tutte le righe della tabella
  findAll: () => Categoria.findAll(),

  /** SELECT * FROM categoria WHERE id = ? */
  // findByPk = "find by primary key", equivalente a WHERE id = ?
  findById: (id) => Categoria.findByPk(id),

  /** SELECT * FROM categoria WHERE id = ? (con i libri collegati) */
  // include: [{ model, as }] genera un JOIN con i libri della categoria
  findByIdConLibri: (id) => Categoria.findByPk(id, {
    include: [{ model: Libro, as: 'libri' }],
  }),

  /** SELECT * FROM categoria WHERE nome = ? LIMIT 1 */
  // findOne restituisce la prima riga che soddisfa la clausola where
  findByNome: (nome) => Categoria.findOne({ where: { nome } }),

  /** INSERT INTO categoria ... */
  // create fa in un colpo solo: new Model(dati) + save()
  create: (dati) => Categoria.create(dati),

  /** DELETE FROM categoria WHERE id = ? */
  // destroy() sull'istanza cancella la riga corrispondente
  delete: (categoria) => categoria.destroy(),

};

module.exports = categoriaRepository;