/**
 * service/libroService.js — Logica di business per Libro
 *
 * Il libro dipende da autore e categoria (FK), quindi questo service
 * importa TRE repository per verificare che le entità collegate esistano
 * prima di creare/aggiornare (evitando FK violation lato DB).
 *
 * ═══════════════════════════════════════════════════════════════
 *  ✅ TODO ESAME — SERVICE (logica di business):
 *   [ ] Import dei repository necessari
 *   [ ] Errori: throw { status, message }
 *        - 404 → non trovato
 *        - 400 → violazione regola business
 *        - 422 lo gestisce il validator/controller
 *   [ ] Whitelist campi: const campiAmmessi = [...]
 *   [ ] Verifica FK: se datiNuovi.xxxId → controlla che esista
 *   [ ] Dopo create/update → reload per restituire con JOIN
 *   [ ] NON tocca req/res: parla solo di dati
 * ═══════════════════════════════════════════════════════════════
 */

// Importa i tre repository necessari
const libroRepo    = require('../repository/libro.repository');
const autoreRepo   = require('../repository/autore.repository');
const categoriaRepo = require('../repository/categoria.repository');

const libroService = {

  // Restituisce tutti i libri (con categoria e array di autori)
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

  // Crea un nuovo libro con relazione MOLTI-A-MOLTI verso gli autori.
  // Il body deve contenere `autori_ids: [1,2,3]` (array di id).
  create: async ({ titolo, isbn, annoPubblicazione, prezzo, disponibile, categoriaId, autori_ids = [] }) => {
    // Verifica esistenza categoria (se fornita)
    if (categoriaId) {
      const categoria = await categoriaRepo.findById(categoriaId);
      if (!categoria) throw { status: 404, message: `Categoria con id=${categoriaId} non trovata.` };
    }

    // Verifica che TUTTI gli autori esistano.
    // Se anche uno solo manca → 404 (come richiesto dalla traccia).
    if (autori_ids.length > 0) {
      const autori = await autoreRepo.findByIds(autori_ids);
      if (autori.length !== autori_ids.length) {
        throw { status: 404, message: 'Uno o più autori non esistono.' };
      }
    }

    // INSERT nella tabella libro (SENZA autoreId, ora è many-to-many)
    const libro = await libroRepo.create({
      titolo, isbn, annoPubblicazione, prezzo,
      disponibile: disponibile !== undefined ? disponibile : true,
      categoriaId,
    });

    // Popola la tabella pivot libro_autore con le associazioni.
    // setAutori è un metodo generato automaticamente da belongsToMany.
    if (autori_ids.length > 0) {
      await libro.setAutori(autori_ids);
    }

    // Ricarica il libro con categoria + array autori popolato
    return libroRepo.reload(libro);
  },

  // Aggiorna un libro esistente (aggiornamento parziale)
  update: async (id, datiNuovi) => {
    // findByIdSemplice: senza JOIN, più veloce (basta per l'update)
    const libro = await libroRepo.findByIdSemplice(id);
    if (!libro) throw { status: 404, message: 'Libro non trovato.' };

    // Se sto cambiando la categoria, verifico che esista
    if (datiNuovi.categoriaId) {
      const categoria = await categoriaRepo.findById(datiNuovi.categoriaId);
      if (!categoria) throw { status: 404, message: `Categoria con id=${datiNuovi.categoriaId} non trovata.` };
    }

    // Se sono passati autori_ids, verifico che TUTTI esistano
    if (datiNuovi.autori_ids) {
      const autori = await autoreRepo.findByIds(datiNuovi.autori_ids);
      if (autori.length !== datiNuovi.autori_ids.length) {
        throw { status: 404, message: 'Uno o più autori non esistono.' };
      }
    }

    // Whitelist dei campi diretti (autori_ids è gestito a parte)
    const campiAmmessi = ['titolo', 'isbn', 'annoPubblicazione', 'prezzo', 'disponibile', 'categoriaId'];
    campiAmmessi.forEach(campo => {
      if (datiNuovi[campo] !== undefined) libro[campo] = datiNuovi[campo];
    });

    await libroRepo.save(libro);

    // Se sono stati passati autori_ids, sovrascrivo la pivot.
    // setAutori riscrive completamente le associazioni (elimina le vecchie
    // che non sono più nella lista, aggiunge quelle nuove).
    if (datiNuovi.autori_ids) {
      await libro.setAutori(datiNuovi.autori_ids);
    }

    return libroRepo.reload(libro);
  },

  // Cancella un libro (Sequelize elimina automaticamente anche le righe
  // corrispondenti nella pivot libro_autore, grazie a CASCADE)
  delete: async (id) => {
    const libro = await libroRepo.findByIdSemplice(id);
    if (!libro) throw { status: 404, message: 'Libro non trovato.' };
    return libroRepo.delete(libro);
  },

};

module.exports = libroService;