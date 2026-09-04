/**
 * validator/libroValidator.js
 */

const libroValidator = {

  validaCreazione: ({ titolo, isbn } = {}) => {
    const errori = [];
    if (!titolo || titolo.trim() === '') errori.push('Il campo "titolo" è obbligatorio.');
    if (!isbn   || isbn.trim()   === '') errori.push('Il campo "isbn" è obbligatorio.');
    return errori;
  },

  validaAggiornamento: ({ titolo, isbn } = {}) => {
    const errori = [];
    if (titolo !== undefined && titolo.trim() === '') errori.push('Il campo "titolo" non può essere vuoto.');
    if (isbn   !== undefined && isbn.trim()   === '') errori.push('Il campo "isbn" non può essere vuoto.');
    return errori;
  },

};

module.exports = libroValidator;