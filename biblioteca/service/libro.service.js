/**
 * service/libroService.js — Logica di business per Libro
 */

const libroRepo    = require('../repository/libro.repository');
const autoreRepo   = require('../repository/autore.repository');
const categoriaRepo = require('../repository/categoria.repository');

const libroService = {

  getAll: async () => libroRepo.findAll(),

  getById: async (id) => {
    const libro = await libroRepo.findById(id);
    if (!libro) throw { status: 404, message: 'Libro non trovato.' };
    return libro;
  },

  getDisponibili: async () => libroRepo.findDisponibili(),

  search: async (q) => libroRepo.search(q),

  getByCategoria: async (categoriaId) => {
    const categoria = await categoriaRepo.findById(categoriaId);
    if (!categoria) throw { status: 404, message: 'Categoria non trovata.' };
    return libroRepo.findByCategoria(categoriaId);
  },

  getByAutore: async (autoreId) => {
    const autore = await autoreRepo.findByIdSemplice(autoreId);
    if (!autore) throw { status: 404, message: 'Autore non trovato.' };
    return libroRepo.findByAutore(autoreId);
  },

  create: async ({ titolo, isbn, annoPubblicazione, prezzo, disponibile, categoriaId, autoreId }) => {
    // Verifica che autore e categoria esistano se forniti
    if (autoreId) {
      const autore = await autoreRepo.findByIdSemplice(autoreId);
      if (!autore) throw { status: 404, message: `Autore con id=${autoreId} non trovato.` };
    }
    if (categoriaId) {
      const categoria = await categoriaRepo.findById(categoriaId);
      if (!categoria) throw { status: 404, message: `Categoria con id=${categoriaId} non trovata.` };
    }

    const libro = await libroRepo.create({
      titolo, isbn, annoPubblicazione, prezzo,
      disponibile: disponibile !== undefined ? disponibile : true,
      categoriaId,
      autoreId,
    });

    return libroRepo.reload(libro);
  },

  update: async (id, datiNuovi) => {
    const libro = await libroRepo.findByIdSemplice(id);
    if (!libro) throw { status: 404, message: 'Libro non trovato.' };

    // Verifica autore e categoria se vengono aggiornati
    if (datiNuovi.autoreId) {
      const autore = await autoreRepo.findByIdSemplice(datiNuovi.autoreId);
      if (!autore) throw { status: 404, message: `Autore con id=${datiNuovi.autoreId} non trovato.` };
    }
    if (datiNuovi.categoriaId) {
      const categoria = await categoriaRepo.findById(datiNuovi.categoriaId);
      if (!categoria) throw { status: 404, message: `Categoria con id=${datiNuovi.categoriaId} non trovata.` };
    }

    const campiAmmessi = ['titolo', 'isbn', 'annoPubblicazione', 'prezzo', 'disponibile', 'categoriaId', 'autoreId'];
    campiAmmessi.forEach(campo => {
      if (datiNuovi[campo] !== undefined) libro[campo] = datiNuovi[campo];
    });

    await libroRepo.save(libro);
    return libroRepo.reload(libro);
  },

  delete: async (id) => {
    const libro = await libroRepo.findByIdSemplice(id);
    if (!libro) throw { status: 404, message: 'Libro non trovato.' };
    return libroRepo.delete(libro);
  },

};

module.exports = libroService;