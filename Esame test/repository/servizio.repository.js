const { fn, col, literal } = require('sequelize');
const { Servizio, Cliente, Prenotazione } = require('../models');

const servizioRepository = {

    // Endpoint 4: durata "Xh Ymin" + prezzo "X.XX €"
    findAll: () => Servizio.findAll({
        attributes: [
            'id',
            'nome',
            'descrizione',
            [literal("CONCAT(FLOOR(durataMinuti/60), 'h ', MOD(durataMinuti,60), 'min')"), 'durataFormattata'],
            [literal("CONCAT(FORMAT(prezzo, 2), ' €')"),                                   'prezzoFormattato'],
        ],
    }),

    // Endpoint 5: COUNT prenotazioni + AVG valutazione arrotondata + clienti che l'hanno prenotato
    findById: (id) => Servizio.findByPk(id, {
        attributes: [
            'id', 'nome', 'descrizione', 'prezzo', 'durataMinuti',
            [fn('COUNT', col('Clientes.Prenotazione.ClienteId')),                'numeroPrenotazioni'],
            [fn('ROUND', fn('AVG', col('Clientes.Prenotazione.valutazione')), 1), 'valutazioneMedia'],
        ],
        include: [{
            model:      Cliente,
            attributes: ['id', 'nome', 'cognome', 'email'],
            through:    { attributes: ['dataAppuntamento', 'valutazione'] },
        }],
        group: ['Servizio.id', 'Clientes.id', 'Clientes->Prenotazione.ClienteId', 'Clientes->Prenotazione.ServizioId'],
    }),

    // Endpoint 6: classifica servizi per prenotazioni (COUNT) + incasso (SUM) + AVG
    serviziPopolari: () => Servizio.findAll({
        attributes: [
            'id',
            'nome',
            [fn('COUNT', col('prenotazioni.ServizioId')),                'numeroPrenotazioni'],
            [fn('SUM',   col('Servizio.prezzo')),                        'incassoTotale'],
            [fn('ROUND', fn('AVG', col('prenotazioni.valutazione')), 1), 'valutazioneMedia'],
        ],
        include: [{
            model:      Prenotazione,
            as:         'prenotazioni',
            attributes: [],
        }],
        group: ['Servizio.id'],
        order: [[literal('numeroPrenotazioni'), 'DESC']],
    }),

};

module.exports = servizioRepository;
