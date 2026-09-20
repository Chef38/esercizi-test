/**
 * service/categoriaService.js — Logica di business per Categoria
 *
 * Il Service contiene le REGOLE DI BUSINESS.
 * Comunica gli errori con: throw { status, message }
 * Il Controller li cattura e risponde con il codice HTTP corretto.
 *
 * Non conosce req/res: parla solo di categorie, libri e regole.
 */

// Importa il repository (accesso al DB)
const repo = require('../repository/categoria.repository');

const categoriaService = {

  // Lista di tutte le categorie: nessuna logica, passa la palla al repo
  getAll: async () => {
    return repo.findAll();
  },

  // Cerca una categoria per id. Se non esiste, lancia 404.
  getById: async (id) => {
    const categoria = await repo.findById(id);
    // throw di un oggetto {status, message}: il controller userà lo status
    if (!categoria) throw { status: 404, message: 'Categoria non trovata.' };
    return categoria;
  },

  // Crea una categoria: prima controlla l'unicità del nome (regola di business)
  create: async ({ nome, descrizione }) => {
    // Regola: nome univoco
    const esistente = await repo.findByNome(nome);
    if (esistente) throw { status: 400, message: 'Categoria con questo nome già esistente.' };
    return repo.create({ nome, descrizione });
  },

  // Aggiorna: verifica esistenza, poi eventuale duplicato nome, poi salva
  update: async (id, datiNuovi) => {
    const categoria = await repo.findById(id);
    if (!categoria) throw { status: 404, message: 'Categoria non trovata.' };

    // Controlla duplicato nome solo se il nome è cambiato
    // (altrimenti si "beccherebbe" da sola come duplicata)
    if (datiNuovi.nome && datiNuovi.nome !== categoria.nome) {
      const esistente = await repo.findByNome(datiNuovi.nome);
      if (esistente) throw { status: 400, message: 'Categoria con questo nome già esistente.' };
    }

    // "Whitelist" dei campi aggiornabili: previene mass-assignment
    // (nessuno può iniettare campi extra tipo "id" o "createdAt")
    const campiAmmessi = ['nome', 'descrizione'];
    campiAmmessi.forEach(campo => {
      // Aggiorna solo i campi effettivamente presenti in datiNuovi
      if (datiNuovi[campo] !== undefined) categoria[campo] = datiNuovi[campo];
    });

    // save() genera UPDATE sulla riga esistente
    return repo.save(categoria);
  },

  // Cancella: recupera la categoria CON i libri per verificarne l'assenza
  delete: async (id) => {
    const categoria = await repo.findByIdConLibri(id);
    if (!categoria) throw { status: 404, message: 'Categoria non trovata.' };

    // Regola: non eliminare se ha libri collegati (integrità applicativa)
    if (categoria.libri.length > 0) {
      throw { status: 400, message: 'Impossibile eliminare: esistono libri associati a questa categoria.' };
    }

    return repo.delete(categoria);
  },

  // Restituisce solo l'array dei libri della categoria
  getLibri: async (id) => {
    const categoria = await repo.findByIdConLibri(id);
    if (!categoria) throw { status: 404, message: 'Categoria non trovata.' };
    return categoria.libri;
  },

};

module.exports = categoriaService;