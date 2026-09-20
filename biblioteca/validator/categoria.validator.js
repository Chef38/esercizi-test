/**
 * validator/categoriaValidator.js
 * Restituisce un array di errori. Se vuoto → dati validi.
 *
 * PATTERN: i validator NON lanciano eccezioni; restituiscono
 * un array di messaggi che il controller usa per rispondere 422.
 */

const categoriaValidator = {

  // Validazione per la creazione: nome OBBLIGATORIO
  // La destrutturazione { nome } = {} evita errori se req.body è undefined
  validaCreazione: ({ nome } = {}) => {
    const errori = [];
    // Controllo che il nome esista e non sia solo spazi bianchi
    if (!nome || nome.trim() === '') errori.push('Il campo "nome" è obbligatorio.');
    // Se il nome è presente, controllo che non ecceda la lunghezza max
    if (nome && nome.length > 300)   errori.push('Il campo "nome" non può superare 300 caratteri.');
    return errori;
  },

  // Validazione per l'update: nome OPZIONALE ma se presente valido
  validaAggiornamento: ({ nome } = {}) => {
    const errori = [];
    // In update accetto che nome sia assente (non lo cambio),
    // ma se è stato passato non deve essere una stringa vuota
    if (nome !== undefined && nome.trim() === '') errori.push('Il campo "nome" non può essere vuoto.');
    if (nome && nome.length > 300)               errori.push('Il campo "nome" non può superare 300 caratteri.');
    return errori;
  },

};

module.exports = categoriaValidator;