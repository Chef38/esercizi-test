/**
 * service/libroService.js — Logica di business per Libro
 *
 * Il libro dipende da autore e categoria (FK), quindi questo service
 * importa TRE repository per verificare che le entità collegate esistano
 * prima di creare/aggiornare (evitando FK violation lato DB).
 */

// Importa i tre repository necessari
const libroRepo    = require('../repository/libro.repository');
const autoreRepo   = require('../repository/autore.repository');
const categoriaRepo = require('../repository/categoria.repository');

const libroService = {

  // Restituisce tutti i libri (già joinati con autore e categoria)
  getAll: async () => libroRepo.findAll(),

  // Singolo libro con relazioni. 404 se non esiste.
  getById: async (id) => {
    const libro = await libroRepo.findById(id);
    if (!libro) throw { status: 404, message: 'Libro non trovato.' };
    return libro;
  },

  // Filtra solo libri con disponibile = true
  getDisponibili: async () => libroRepo.findDisponibili(),

  // Ricerca per titolo (LIKE %q%)
  search: async (q) => libroRepo.search(q),

  // Libri di una specifica categoria (verifica prima che la categoria esista)
  getByCategoria: async (categoriaId) => {
    const categoria = await categoriaRepo.findById(categoriaId);
    if (!categoria) throw { status: 404, message: 'Categoria non trovata.' };
    return libroRepo.findByCategoria(categoriaId);
  },

  // Libri di uno specifico autore (verifica prima che l'autore esista)
  getByAutore: async (autoreId) => {
    const autore = await autoreRepo.findByIdSemplice(autoreId);
    if (!autore) throw { status: 404, message: 'Autore non trovato.' };
    return libroRepo.findByAutore(autoreId);
  },

  // Crea un nuovo libro
  create: async ({ titolo, isbn, annoPubblicazione, prezzo, disponibile, categoriaId, autoreId }) => {
    // Verifica che autore e categoria esistano SE forniti (sono opzionali)
    // Meglio dare un 404 chiaro che aspettare la FK violation del DB
    if (autoreId) {
      const autore = await autoreRepo.findByIdSemplice(autoreId);
      if (!autore) throw { status: 404, message: `Autore con id=${autoreId} non trovato.` };
    }
    if (categoriaId) {
      const categoria = await categoriaRepo.findById(categoriaId);
      if (!categoria) throw { status: 404, message: `Categoria con id=${categoriaId} non trovata.` };
    }

    // Crea il libro (INSERT)
    const libro = await libroRepo.create({
      titolo, isbn, annoPubblicazione, prezzo,
      // Ternario: se disponibile è stato passato uso quello, altrimenti true
      disponibile: disponibile !== undefined ? disponibile : true,
      categoriaId,
      autoreId,
    });

    // Ricarica il libro con le relazioni (autore + categoria) per restituirlo completo
    return libroRepo.reload(libro);
  },

  // Aggiorna un libro esistente
  update: async (id, datiNuovi) => {
    // Uso findByIdSemplice (senza JOIN) → serve solo per l'update, più veloce
    const libro = await libroRepo.findByIdSemplice(id);
    if (!libro) throw { status: 404, message: 'Libro non trovato.' };

    // Se sto cambiando autore/categoria, verifico che le nuove FK esistano
    if (datiNuovi.autoreId) {
      const autore = await autoreRepo.findByIdSemplice(datiNuovi.autoreId);
      if (!autore) throw { status: 404, message: `Autore con id=${datiNuovi.autoreId} non trovato.` };
    }
    if (datiNuovi.categoriaId) {
      const categoria = await categoriaRepo.findById(datiNuovi.categoriaId);
      if (!categoria) throw { status: 404, message: `Categoria con id=${datiNuovi.categoriaId} non trovata.` };
    }

    // Whitelist dei campi modificabili (mass-assignment protection)
    const campiAmmessi = ['titolo', 'isbn', 'annoPubblicazione', 'prezzo', 'disponibile', 'categoriaId', 'autoreId'];
    campiAmmessi.forEach(campo => {
      if (datiNuovi[campo] !== undefined) libro[campo] = datiNuovi[campo];
    });

    await libroRepo.save(libro);
    // Ricarica con relazioni per la risposta
    return libroRepo.reload(libro);
  },

  // Cancella un libro
  delete: async (id) => {
    const libro = await libroRepo.findByIdSemplice(id);
    if (!libro) throw { status: 404, message: 'Libro non trovato.' };
    return libroRepo.delete(libro);
  },

};

module.exports = libroService;