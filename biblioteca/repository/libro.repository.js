/**
 * repository/libroRepository.js
 * Solo query Sequelize — nessuna logica di business.
 *
 * ═══════════════════════════════════════════════════════════════
 *  ✅ TODO ESAME — REPOSITORY (query pure):
 *   [ ] Import { Op } se ti serve LIKE, gt, lt, in, ecc.
 *   [ ] Import modelli da ../models (mai da ./nome.model direttamente!)
 *   [ ] Definisci INCLUDE_XXX come costante per riuso
 *   [ ] Metodi minimi: findAll, findById, findByIdSemplice,
 *       create, save, delete
 *   [ ] Se serve dopo update: reload(istanza, { include })
 *   [ ] NIENTE if/throw qui: solo query!
 * ═══════════════════════════════════════════════════════════════
 */

// Op contiene gli operatori Sequelize (like, gt, in, ecc.)
const { Op } = require('sequelize');
const { Libro, Autore, Categoria } = require('../models');

// Include standard: per ogni libro carica categoria e ARRAY di autori
// (many-to-many tramite libro_autore).
// `through: { attributes: [] }` = non includere le colonne della pivot
// nella risposta JSON (id_libro, id_autore) → output più pulito.
const INCLUDE_COMPLETO = [
  { model: Categoria, as: 'categoria' },
  {
    model: Autore,
    as:    'autori',
    through: { attributes: [] },
  },
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

  /** Libri di uno specifico autore (many-to-many via libro_autore) */
  // Con belongsToMany serve un include filtrato sull'autore: required:true
  // forza l'INNER JOIN, così esce solo il sottoinsieme di libri legati
  // a quell'autoreId nella tabella pivot.
  findByAutore: (autoreId) => Libro.findAll({
    include: [
      { model: Categoria, as: 'categoria' },
      {
        model:    Autore,
        as:       'autori',
        through:  { attributes: [] },
        where:    { id: autoreId },
        required: true, // INNER JOIN
      },
    ],
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