const { Op, fn, col, literal } = require('sequelize');
const { Cliente, Servizio } = require('../models');

const clienteRepository = {

    // Endpoint 1: CONCAT nome+cognome + DATE_FORMAT su dataIscrizione
    findAll: () => Cliente.findAll({
        attributes: [
            'id',
            'email',
            'telefono',
            [fn('CONCAT', col('nome'), ' ', col('cognome')), 'nomeCompleto'],
            [fn('DATE_FORMAT', col('dataIscrizione'), '%d/%m/%Y'), 'dataIscrizioneFormattata'],
        ],
    }),

    // Endpoint 2: TIMESTAMPDIFF per età + include Servizi con attributi pivot
    findById: (id) => Cliente.findByPk(id, {
        attributes: [
            'id', 'nome', 'cognome', 'email', 'telefono', 'dataNascita',
            [fn('CONCAT', col('Cliente.nome'), ' ', col('Cliente.cognome')), 'nomeCompleto'],
            [fn('TIMESTAMPDIFF', literal('YEAR'), col('Cliente.dataNascita'), fn('NOW')), 'eta'],
        ],
        include: [{
            model:   Servizio,
            through: { attributes: ['dataAppuntamento', 'valutazione'] },
        }],
    }),

    // Endpoint 3: ricerca case-insensitive LIKE su nome OR cognome
    search: (q) => Cliente.findAll({
        attributes: [
            'id',
            'email',
            [fn('CONCAT', col('nome'), ' ', col('cognome')), 'nomeCompleto'],
        ],
        where: {
            [Op.or]: [
                { nome:    { [Op.like]: `%${q}%` } },
                { cognome: { [Op.like]: `%${q}%` } },
            ],
        },
    }),

};

module.exports = clienteRepository;
