/**
 * service/libro.service.js
 * Logica di business + query Sequelize (repository "inline").
 *
 * Il libro ha:
 *   - relazione N:1 con Categoria (colonna FK diretta categoriaId)
 *   - relazione N:N con Autore    (tabella pivot libro_autore)
 */

const { Op } = require('sequelize');
const { Libro, Autore, Categoria } = require('../models');
const autoreService = require('./autore.service');
const categoriaService = require('./categoria.service');

// Include standard: categoria + array di autori
const INCLUDE_COMPLETO = [
  { model: Categoria, as: 'categoria' },
  {
    model:   Autore,
    as:      'autori',
    through: { attributes: [] },
  },
];

const libroService = {

  // Lista completa
  getAll: async () => Libro.findAll({ include: INCLUDE_COMPLETO }),

  // Dettaglio
  getById: async (id) => {
    const libro = await Libro.findByPk(id, { include: INCLUDE_COMPLETO });
    if (!libro) throw { status: 404, message: 'Libro non trovato.' };
    return libro;
  },

  // Solo libri con disponibile=true
  getDisponibili: async () => Libro.findAll({
    where:   { disponibile: true },
    include: INCLUDE_COMPLETO,
  }),

  // Ricerca titolo LIKE %q% (case-insensitive con collation _ci)
  search: async (q) => Libro.findAll({
    where:   { titolo: { [Op.like]: `%${q}%` } },
    include: INCLUDE_COMPLETO,
  }),

  // Crea libro con relazione many-to-many verso autori
  create: async ({ titolo, isbn, annoPubblicazione, prezzo, disponibile, categoriaId, autori_ids = [] }) => {
    // 1. Verifica categoria (se fornita)
    if (categoriaId) {
      const cat = await Categoria.findByPk(categoriaId);
      if (!cat) throw { status: 404, message: `Categoria con id=${categoriaId} non trovata.` };
    }

    // 2. Verifica che TUTTI gli autori esistano (traccia §5 endpoint 9)
    if (autori_ids.length > 0) {
      const autori = await autoreService.findByIds(autori_ids);
      if (autori.length !== autori_ids.length) {
        throw { status: 404, message: 'Uno o più autori non esistono.' };
      }
    }

    // 3. INSERT nella tabella libro
    const libro = await Libro.create({
      titolo, isbn, annoPubblicazione, prezzo,
      disponibile: disponibile !== undefined ? disponibile : true,
      categoriaId,
    });

    // 4. Popola la pivot libro_autore
    if (autori_ids.length > 0) {
      await libro.setAutori(autori_ids);
    }

    // 5. Ricarica con relazioni caricate
    return libro.reload({ include: INCLUDE_COMPLETO });
  },

  // Aggiornamento parziale
  update: async (id, datiNuovi) => {
    const libro = await Libro.findByPk(id);
    if (!libro) throw { status: 404, message: 'Libro non trovato.' };

    if (datiNuovi.categoriaId) {
      const cat = await Categoria.findByPk(datiNuovi.categoriaId);
      if (!cat) throw { status: 404, message: `Categoria con id=${datiNuovi.categoriaId} non trovata.` };
    }
    if (datiNuovi.autori_ids) {
      const autori = await autoreService.findByIds(datiNuovi.autori_ids);
      if (autori.length !== datiNuovi.autori_ids.length) {
        throw { status: 404, message: 'Uno o più autori non esistono.' };
      }
    }

    // Whitelist campi diretti (autori_ids è gestito a parte)
    const campiAmmessi = ['titolo', 'isbn', 'annoPubblicazione', 'prezzo', 'disponibile', 'categoriaId'];
    campiAmmessi.forEach(c => {
      if (datiNuovi[c] !== undefined) libro[c] = datiNuovi[c];
    });

    await libro.save();

    // setAutori riscrive completamente la pivot
    if (datiNuovi.autori_ids) {
      await libro.setAutori(datiNuovi.autori_ids);
    }

    return libro.reload({ include: INCLUDE_COMPLETO });
  },

  // Cancella (la pivot libro_autore viene ripulita in automatico via CASCADE)
  delete: async (id) => {
    const libro = await Libro.findByPk(id);
    if (!libro) throw { status: 404, message: 'Libro non trovato.' };
    return libro.destroy();
  },

};

module.exports = libroService;
