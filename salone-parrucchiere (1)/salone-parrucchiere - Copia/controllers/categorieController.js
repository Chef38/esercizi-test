const categorieService = require('../services/categorieService');

/*
 * Controller delle categorie: SOLO gestione HTTP.
 * - Legge req.body / req.params / req.query
 * - Valida input obbligatori
 * - Chiama il service
 * - Traduce il risultato in status + JSON
 *
 * try/catch di sicurezza per errori TECNICI (DB down, sintassi SQL, ecc.)
 * -> 500. Gli errori di BUSINESS (categoria mancante, piatti associati) si
 * gestiscono con if/return e status appropriato.
 */

// GET /api/categorie — Endpoint 1
exports.lista = async (req, res) => {
  try {
    const categorie = await categorieService.elencaTutte();
    res.status(200).json(categorie);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};

// POST /api/categorie — Endpoint 2
exports.crea = async (req, res) => {
  const { nome, descrizione, ordineMenu } = req.body;
  // ATTENZIONE: ordineMenu === undefined/null e non !ordineMenu, altrimenti
  // il valore 0 (semanticamente valido) verrebbe scartato come falsy.
  if (!nome || ordineMenu === undefined || ordineMenu === null) {
    return res.status(400).json({ errore: "Campi obbligatori mancanti: 'nome', 'ordineMenu'." });
  }
  try {
    const categoria = await categorieService.crea({ nome, descrizione, ordineMenu });
    res.status(201).json(categoria);   // 201 Created (POST riuscita)
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};

// DELETE /api/categorie/:id — Endpoint 3
// Ordine dei check: prima ESISTENZA (404), poi VINCOLO BUSINESS (400).
exports.elimina = async (req, res) => {
  try {
    const categoria = await categorieService.trovaPerId(req.params.id);
    if (!categoria) {
      return res.status(404).json({ errore: 'Categoria non trovata.' });
    }
    const numPiatti = await categorieService.contaPiatti(req.params.id);
    if (numPiatti > 0) {
      // Messaggio letterale dalla traccia — copiato carattere per carattere.
      return res.status(400).json({
        errore: 'Impossibile eliminare: esistono piatti associati a questa categoria.'
      });
    }
    await categorieService.elimina(req.params.id);
    res.status(204).send();  // 204 = No Content (DELETE riuscita, niente body)
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};

// GET /api/categorie/:id/piatti — Endpoint 15
exports.piatti = async (req, res) => {
  try {
    const categoria = await categorieService.trovaPerId(req.params.id);
    if (!categoria) {
      return res.status(404).json({ errore: 'Categoria non trovata.' });
    }
    const piatti = await categorieService.piattiDellaCategoria(req.params.id);
    res.status(200).json(piatti);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};
