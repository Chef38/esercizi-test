const { Piatto, Ingrediente, Categoria } = require('../models');
const { Op } = require('sequelize');

/*
 * Service dei piatti: qui vivono le query Sequelize.
 * REGOLA: nessun riferimento a req/res. Riceve dati semplici, ritorna dati.
 * Il controller HTTP tradurra' i risultati in status code.
 *
 * Convenzione di ritorno per i metodi che possono fallire per BUSINESS
 * (categoria inesistente, ingrediente mancante): oggetto
 *   { ok: true,  piatto } | { ok: false, code, messaggio }
 * cosi' il controller resta lineare (no try/catch per ogni caso).
 */

// Include riutilizzabile: categoria + ingredienti, senza colonne della pivot.
// through: { attributes: [] } NASCONDE le colonne di PiattoIngrediente dal
// JSON, altrimenti ogni ingrediente porterebbe con se' PiattoIngrediente:{...}.
const INCLUDE_STANDARD = [
  { model: Categoria },
  { model: Ingrediente, through: { attributes: [] } }
];

// GET /api/piatti — lista di tutti i piatti con categoria e ingredienti.
exports.elencaTutti = async () => {
  return Piatto.findAll({ include: INCLUDE_STANDARD, order: [['id', 'ASC']] });
};

// GET /api/piatti/:id — dettaglio (null se non esiste -> il controller risponde 404).
exports.trovaPerId = async (id) => {
  return Piatto.findByPk(id, { include: INCLUDE_STANDARD });
};

/*
 * POST /api/piatti — crea un piatto e (opzionalmente) associa gli ingredienti.
 * Flusso:
 *   1) verifica esistenza Categoria       -> altrimenti 404
 *   2) verifica esistenza degli Ingredienti-> altrimenti 404 con lista mancanti
 *   3) INSERT piatto (Piatto.create)
 *   4) piatto.setIngredienti(...) -> Sequelize scrive nella pivot per noi
 *   5) reload con include per rispondere completo di JOIN
 */
exports.crea = async ({ nome, descrizione, prezzo, vegetariano, disponibile, CategoriaId, ingredientiIds }) => {
  const categoria = await Categoria.findByPk(CategoriaId);
  if (!categoria) return { ok: false, code: 404, messaggio: 'Categoria non trovata.' };

  if (Array.isArray(ingredientiIds) && ingredientiIds.length > 0) {
    // where: { id: [1,2,3] } -> Sequelize traduce in WHERE id IN (1,2,3)
    const trovati = await Ingrediente.findAll({ where: { id: ingredientiIds } });
    if (trovati.length !== ingredientiIds.length) {
      const trovatiIds = trovati.map((i) => i.id);
      const mancanti = ingredientiIds.filter((x) => !trovatiIds.includes(x));
      return { ok: false, code: 404, messaggio: `Ingredienti non trovati: ${mancanti.join(', ')}.` };
    }
  }

  const piatto = await Piatto.create({ nome, descrizione, prezzo, vegetariano, disponibile, CategoriaId });

  if (Array.isArray(ingredientiIds) && ingredientiIds.length > 0) {
    // Metodo generato da belongsToMany: INSERT nella pivot per ogni id.
    await piatto.setIngredienti(ingredientiIds);
  }

  const completo = await Piatto.findByPk(piatto.id, { include: INCLUDE_STANDARD });
  return { ok: true, piatto: completo };
};

/*
 * PUT /api/piatti/:id — aggiorna un piatto e (opzionalmente) gli ingredienti.
 * setIngredienti(...) RIMPIAZZA completamente la lista: passando [1,2] resta
 * solo quella coppia, gli altri vengono staccati.
 */
exports.aggiorna = async (id, dati) => {
  const piatto = await Piatto.findByPk(id);
  if (!piatto) return { ok: false, code: 404, messaggio: 'Piatto non trovato.' };

  if (dati.CategoriaId !== undefined) {
    const categoria = await Categoria.findByPk(dati.CategoriaId);
    if (!categoria) return { ok: false, code: 404, messaggio: 'Categoria non trovata.' };
  }

  if (Array.isArray(dati.ingredientiIds)) {
    const trovati = await Ingrediente.findAll({ where: { id: dati.ingredientiIds } });
    if (trovati.length !== dati.ingredientiIds.length) {
      const trovatiIds = trovati.map((i) => i.id);
      const mancanti = dati.ingredientiIds.filter((x) => !trovatiIds.includes(x));
      return { ok: false, code: 404, messaggio: `Ingredienti non trovati: ${mancanti.join(', ')}.` };
    }
  }

  // Separo ingredientiIds dagli altri campi: NON e' una colonna del modello
  // Piatto, quindi non deve finire dentro update().
  const { ingredientiIds, ...campi } = dati;
  await piatto.update(campi);   // UPDATE solo dei campi passati (partial update)
  if (Array.isArray(ingredientiIds)) {
    await piatto.setIngredienti(ingredientiIds);
  }

  const completo = await Piatto.findByPk(id, { include: INCLUDE_STANDARD });
  return { ok: true, piatto: completo };
};

// DELETE /api/piatti/:id — grazie all'ON DELETE CASCADE della pivot, le
// righe di PiattoIngrediente relative al piatto spariscono in automatico.
exports.elimina = async (id) => Piatto.destroy({ where: { id } });

/*
 * GET /api/piatti/search?q=... — ricerca case-insensitive per nome.
 * Op.like con %...% -> LIKE '%pasta%'.
 * MariaDB con collation utf8_general_ci e' case-insensitive di default;
 * se il DB fosse configurato con collation _bin, servirebbe LOWER() sui due lati.
 */
exports.cerca = async (q) => {
  return Piatto.findAll({
    where: { nome: { [Op.like]: `%${q}%` } },
    include: INCLUDE_STANDARD
  });
};

// GET /api/piatti/vegetariani — SOLO piatti vegetariani E disponibili.
// Le chiavi di where sono in AND: WHERE vegetariano=TRUE AND disponibile=TRUE.
exports.vegetariani = async () => {
  return Piatto.findAll({
    where: { vegetariano: true, disponibile: true },
    include: [{ model: Categoria }]
  });
};
