/**
 * service/categoria.service.js
 * Logica di business + query Sequelize (repository "inline").
 *
 * Il controller chiama qui. Errori comunicati con:
 *   throw { status, message }
 *
 * ═══════════════════════════════════════════════════════════════
 *  ✅ TODO ESAME — SERVICE (business + query):
 *   [ ] Import diretti dei modelli da ../models
 *   [ ] throw { status, message } per gli errori (404, 400, ...)
 *   [ ] Whitelist campi negli update
 *   [ ] NON tocca req/res
 * ═══════════════════════════════════════════════════════════════
 */

const { Categoria, Libro } = require('../models');

const categoriaService = {

  // Lista completa
  getAll: async () => Categoria.findAll(),

  // Dettaglio per id
  getById: async (id) => {
    const categoria = await Categoria.findByPk(id);
    if (!categoria) throw { status: 404, message: 'Categoria non trovata.' };
    return categoria;
  },

  // Crea nuova categoria (regola: nome UNIVOCO)
  create: async ({ nome, descrizione }) => {
    const esistente = await Categoria.findOne({ where: { nome } });
    if (esistente) throw { status: 400, message: 'Categoria con questo nome già esistente.' };
    return Categoria.create({ nome, descrizione });
  },

  // Aggiorna (parziale) — se cambio nome verifico unicità
  update: async (id, datiNuovi) => {
    const categoria = await Categoria.findByPk(id);
    if (!categoria) throw { status: 404, message: 'Categoria non trovata.' };

    if (datiNuovi.nome && datiNuovi.nome !== categoria.nome) {
      const esistente = await Categoria.findOne({ where: { nome: datiNuovi.nome } });
      if (esistente) throw { status: 400, message: 'Categoria con questo nome già esistente.' };
    }

    // Whitelist: previene mass-assignment (nessuno può cambiare l'id)
    const campiAmmessi = ['nome', 'descrizione'];
    campiAmmessi.forEach(c => {
      if (datiNuovi[c] !== undefined) categoria[c] = datiNuovi[c];
    });

    return categoria.save();
  },

  // Cancella (regola: NO se ha libri collegati → 400 col messaggio esatto)
  delete: async (id) => {
    const categoria = await Categoria.findByPk(id, {
      include: [{ model: Libro, as: 'libri' }],
    });
    if (!categoria) throw { status: 404, message: 'Categoria non trovata.' };
    if (categoria.libri.length > 0) {
      throw { status: 400, message: 'Impossibile eliminare: esistono libri associati a questa categoria.' };
    }
    return categoria.destroy();
  },

  // Endpoint /categorie/:id/libri
  getLibri: async (id) => {
    const categoria = await Categoria.findByPk(id, {
      include: [{ model: Libro, as: 'libri' }],
    });
    if (!categoria) throw { status: 404, message: 'Categoria non trovata.' };
    return categoria.libri;
  },

};

module.exports = categoriaService;
