/**
 * validator/libroValidator.js
 *
 * Controlla i dati in ingresso per la creazione/modifica di un Libro.
 * Restituisce un array di stringhe di errore (vuoto se tutto ok).
 *
 * ═══════════════════════════════════════════════════════════════
 *  ✅ TODO ESAME — VALIDATOR:
 *   [ ] Due funzioni: validaCreazione + validaAggiornamento
 *   [ ] Creazione: campi obbligatori (!campo || campo.trim() === '')
 *   [ ] Aggiornamento: campi opzionali ma se presenti non vuoti
 *        (campo !== undefined && campo.trim() === '')
 *   [ ] Ritorna ARRAY di stringhe, MAI throw
 *   [ ] Controlli extra: lunghezza max, isNaN, formato email/isbn ecc.
 * ═══════════════════════════════════════════════════════════════
 */

const libroValidator = {

  // Creazione: titolo e isbn OBBLIGATORI.
  // autori_ids è opzionale, ma se presente deve essere un array di interi.
  // L'esistenza degli id nel DB è invece delegata al service.
  validaCreazione: ({ titolo, isbn, autori_ids } = {}) => {
    const errori = [];
    if (!titolo || titolo.trim() === '') errori.push('Il campo "titolo" è obbligatorio.');
    if (!isbn   || isbn.trim()   === '') errori.push('Il campo "isbn" è obbligatorio.');
    if (autori_ids !== undefined) {
      if (!Array.isArray(autori_ids)) {
        errori.push('Il campo "autori_ids" deve essere un array di ID.');
      } else if (autori_ids.some(x => !Number.isInteger(x))) {
        errori.push('"autori_ids" deve contenere solo numeri interi.');
      }
    }
    return errori;
  },

  // Aggiornamento: campi opzionali ma se presenti non vuoti / validi
  validaAggiornamento: ({ titolo, isbn, autori_ids } = {}) => {
    const errori = [];
    if (titolo !== undefined && titolo.trim() === '') errori.push('Il campo "titolo" non può essere vuoto.');
    if (isbn   !== undefined && isbn.trim()   === '') errori.push('Il campo "isbn" non può essere vuoto.');
    if (autori_ids !== undefined) {
      if (!Array.isArray(autori_ids)) {
        errori.push('Il campo "autori_ids" deve essere un array di ID.');
      } else if (autori_ids.some(x => !Number.isInteger(x))) {
        errori.push('"autori_ids" deve contenere solo numeri interi.');
      }
    }
    return errori;
  },

};

module.exports = libroValidator;