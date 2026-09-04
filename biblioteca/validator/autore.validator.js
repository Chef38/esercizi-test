/**
 * validator/autore.validator.js
 */

const autoreValidator = {

  validaCreazione: ({ nome, cognome, annoNascita } = {}) => {
    const errori = [];
    if (!nome   || nome.trim()   === '') errori.push('Il campo "nome" è obbligatorio.');
    if (!cognome || cognome.trim() === '') errori.push('Il campo "cognome" è obbligatorio.');
    if (annoNascita !== undefined && isNaN(Number(annoNascita))) {
      errori.push('Il campo "annoNascita" deve essere un numero intero.');
    }
    return errori;
  },

  validaAggiornamento: ({ nome, cognome, annoNascita } = {}) => {
    const errori = [];
    if (nome    !== undefined && nome.trim()    === '') errori.push('Il campo "nome" non può essere vuoto.');
    if (cognome !== undefined && cognome.trim() === '') errori.push('Il campo "cognome" non può essere vuoto.');
    if (annoNascita !== undefined && isNaN(Number(annoNascita))) {
      errori.push('Il campo "annoNascita" deve essere un numero intero.');
    }
    return errori;
  },

};

module.exports = autoreValidator;