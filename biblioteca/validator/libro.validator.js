/**
 * validator/libroValidator.js
 *
 * Controlla i dati in ingresso per la creazione/modifica di un Libro.
 * Restituisce un array di stringhe di errore (vuoto se tutto ok).
 */

const libroValidator = {

  // Creazione: titolo e isbn OBBLIGATORI
  // Nota: la verifica di esistenza di autoreId/categoriaId è delegata
  // al service, che deve interrogare il DB.
  validaCreazione: ({ titolo, isbn } = {}) => {
    const errori = [];
    // Titolo obbligatorio (né mancante né stringa vuota/spazi)
    if (!titolo || titolo.trim() === '') errori.push('Il campo "titolo" è obbligatorio.');
    // ISBN obbligatorio (l'unicità è controllata dal DB con UNIQUE)
    if (!isbn   || isbn.trim()   === '') errori.push('Il campo "isbn" è obbligatorio.');
    return errori;
  },

  // Aggiornamento: campi opzionali ma se presenti non vuoti
  validaAggiornamento: ({ titolo, isbn } = {}) => {
    const errori = [];
    // Solo se il campo è stato passato lo controllo (undefined = "non toccare")
    if (titolo !== undefined && titolo.trim() === '') errori.push('Il campo "titolo" non può essere vuoto.');
    if (isbn   !== undefined && isbn.trim()   === '') errori.push('Il campo "isbn" non può essere vuoto.');
    return errori;
  },

};

module.exports = libroValidator;