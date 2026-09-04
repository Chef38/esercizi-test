/**
 * repository/categoriaRepository.js
 * Solo query Sequelize — nessuna logica di business.
 */

const { Categoria, Libro } = require('../models');

const categoriaRepository = {

  /** SELECT * FROM categoria */
  findAll: () => Categoria.findAll(),

  /** SELECT * FROM categoria WHERE id = ? */
  findById: (id) => Categoria.findByPk(id),

  /** SELECT * FROM categoria WHERE id = ? (con i libri collegati) */
  findByIdConLibri: (id) => Categoria.findByPk(id, {
    include: [{ model: Libro, as: 'libri' }],
  }),

  /** SELECT * FROM categoria WHERE nome = ? LIMIT 1 */
  findByNome: (nome) => Categoria.findOne({ where: { nome } }),

  /** INSERT INTO categoria ... */
  create: (dati) => Categoria.create(dati),

  /** DELETE FROM categoria WHERE id = ? */
  delete: (categoria) => categoria.destroy(),

};

module.exports = categoriaRepository;