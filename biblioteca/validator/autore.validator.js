/**
 * validator/autore.validator.js
 *
 * Controlla i dati in ingresso per la creazione/modifica di un Autore.
 * Restituisce un array di stringhe di errore (vuoto se tutto ok).
 */

const autoreValidator = {

  // Creazione: nome e cognome SONO obbligatori
  validaCreazione: ({ nome, cognome, annoNascita } = {}) => {
    const errori = [];
    // Nome: deve esistere e non essere solo spazi
    if (!nome   || nome.trim()   === '') errori.push('Il campo "nome" è obbligatorio.');
    // Cognome: idem
    if (!cognome || cognome.trim() === '') errori.push('Il campo "cognome" è obbligatorio.');
    // Anno nascita: se fornito deve essere un numero
    // Number("abc") → NaN → isNaN() true → errore
    if (annoNascita !== undefined && isNaN(Number(annoNascita))) {
      errori.push('Il campo "annoNascita" deve essere un numero intero.');
    }
    return errori;
  },

  // Aggiornamento: campi opzionali (si aggiorna solo ciò che viene passato)
  // ma se presenti devono essere valorizzati correttamente
  validaAggiornamento: ({ nome, cognome, annoNascita } = {}) => {
    const errori = [];
    // Se nome è stato passato non può essere stringa vuota
    if (nome    !== undefined && nome.trim()    === '') errori.push('Il campo "nome" non può essere vuoto.');
    if (cognome !== undefined && cognome.trim() === '') errori.push('Il campo "cognome" non può essere vuoto.');
    if (annoNascita !== undefined && isNaN(Number(annoNascita))) {
      errori.push('Il campo "annoNascita" deve essere un numero intero.');
    }
    return errori;
  },

};

module.exports = autoreValidator;