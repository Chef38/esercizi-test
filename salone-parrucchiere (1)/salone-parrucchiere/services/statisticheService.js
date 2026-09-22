const { Servizio, Prenotazione } = require('../models');
const { fn, col, literal } = require('sequelize');

/*
 * Service delle statistiche: query di aggregazione dell'endpoint 6.
 */

// Classifica dei servizi per numero di prenotazioni (decrescente).
// LEFT JOIN Servizio <-> Prenotazione + GROUP BY sull'id: compaiono anche i
// servizi con 0 prenotazioni. Normalizza i valori nulli in JS.
exports.serviziPopolari = async () => {
  const classifica = await Servizio.findAll({
    attributes: [
      'nome',
      [fn('COUNT', col('prenotazioni.ServizioId')), 'numeroPrenotazioni'],
      [fn('SUM', col('prezzo')), 'incassoTotale'],
      [fn('ROUND', fn('AVG', col('prenotazioni.valutazione')), 1), 'valutazioneMedia']
    ],
    include: [{
      model: Prenotazione,
      as: 'prenotazioni',
      attributes: []
    }],
    group: ['Servizio.id'],
    order: [[literal('numeroPrenotazioni'), 'DESC']],
    raw: true
  });

  return classifica.map((r) => ({
    nome: r.nome,
    numeroPrenotazioni: Number(r.numeroPrenotazioni) || 0,
    incassoTotale: r.incassoTotale !== null ? Number(r.incassoTotale) : 0,
    valutazioneMedia: r.valutazioneMedia // null se nessuna valutazione
  }));
};
