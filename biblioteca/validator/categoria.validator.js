/**
 * validator/categoriaValidator.js
 * Restituisce un array di errori. Se vuoto → dati validi.
 */

const categoriaValidator = {

  validaCreazione: ({ nome } = {}) => {
    const errori = [];
    if (!nome || nome.trim() === '') errori.push('Il campo "nome" è obbligatorio.');
    if (nome && nome.length > 300)   errori.push('Il campo "nome" non può superare 300 caratteri.');
    return errori;
  },

  validaAggiornamento: ({ nome } = {}) => {
    const errori = [];
    if (nome !== undefined && nome.trim() === '') errori.push('Il campo "nome" non può essere vuoto.');
    if (nome && nome.length > 300)               errori.push('Il campo "nome" non può superare 300 caratteri.');
    return errori;
  },

};

module.exports = categoriaValidator;