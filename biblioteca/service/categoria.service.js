/**
 * service/categoriaService.js — Logica di business per Categoria
 *
 * Il Service contiene le REGOLE DI BUSINESS.
 * Comunica gli errori con: throw { status, message }
 * Il Controller li cattura e risponde con il codice HTTP corretto.
 */

const repo = require('../repository/categoria.repository');

const categoriaService = {

  getAll: async () => {
    return repo.findAll();
  },

  getById: async (id) => {
    const categoria = await repo.findById(id);
    if (!categoria) throw { status: 404, message: 'Categoria non trovata.' };
    return categoria;
  },

  create: async ({ nome, descrizione }) => {
    // Regola: nome univoco
    const esistente = await repo.findByNome(nome);
    if (esistente) throw { status: 400, message: 'Categoria con questo nome già esistente.' };
    return repo.create({ nome, descrizione });
  },

  update: async (id, datiNuovi) => {
    const categoria = await repo.findById(id);
    if (!categoria) throw { status: 404, message: 'Categoria non trovata.' };

    // Controlla duplicato nome solo se il nome è cambiato
    if (datiNuovi.nome && datiNuovi.nome !== categoria.nome) {
      const esistente = await repo.findByNome(datiNuovi.nome);
      if (esistente) throw { status: 400, message: 'Categoria con questo nome già esistente.' };
    }

    const campiAmmessi = ['nome', 'descrizione'];
    campiAmmessi.forEach(campo => {
      if (datiNuovi[campo] !== undefined) categoria[campo] = datiNuovi[campo];
    });

    return repo.save(categoria);
  },

  delete: async (id) => {
    const categoria = await repo.findByIdConLibri(id);
    if (!categoria) throw { status: 404, message: 'Categoria non trovata.' };

    // Regola: non eliminare se ha libri collegati
    if (categoria.libri.length > 0) {
      throw { status: 400, message: 'Impossibile eliminare: esistono libri associati a questa categoria.' };
    }

    return repo.delete(categoria);
  },

  getLibri: async (id) => {
    const categoria = await repo.findByIdConLibri(id);
    if (!categoria) throw { status: 404, message: 'Categoria non trovata.' };
    return categoria.libri;
  },

};

module.exports = categoriaService;