const { Cliente, Servizio } = require('../models');
const { fn, col, literal, Op } = require('sequelize');

/*
 * Service dei clienti: qui vive la LOGICA DI ACCESSO AI DATI (le query Sequelize).
 * Non conosce req/res: riceve dati semplici e restituisce dati (o null).
 * A chiamarlo sono i controller.
 */

// Tutti i clienti, con nomeCompleto (CONCAT) e data iscrizione formattata (DATE_FORMAT).
exports.elencaTutti = async () => {
  return Cliente.findAll({
    attributes: [
      'id', 'email', 'telefono',
      [fn('CONCAT', col('nome'), ' ', col('cognome')), 'nomeCompleto'],
      [fn('DATE_FORMAT', col('dataIscrizione'), '%d/%m/%Y'), 'dataIscrizioneFormattata']
    ]
  });
};

// Ricerca case-insensitive su nome O cognome (LIKE con %...%).
exports.cerca = async (q) => {
  return Cliente.findAll({
    attributes: [
      'id', 'email', 'telefono',
      [fn('CONCAT', col('nome'), ' ', col('cognome')), 'nomeCompleto']
    ],
    where: {
      [Op.or]: [
        { nome: { [Op.like]: `%${q}%` } },
        { cognome: { [Op.like]: `%${q}%` } }
      ]
    }
  });
};

// Dettaglio cliente con eta (TIMESTAMPDIFF) e servizi svolti.
// Restituisce null se il cliente non esiste (la risposta 404 la decide il controller).
exports.trovaPerId = async (id) => {
  return Cliente.findByPk(id, {
    attributes: {
      include: [
        [fn('TIMESTAMPDIFF', literal('YEAR'), col('dataNascita'), fn('NOW')), 'eta']
      ]
    },
    include: [{
      model: Servizio,
      through: { attributes: ['dataAppuntamento', 'valutazione'] }
    }]
  });
};
