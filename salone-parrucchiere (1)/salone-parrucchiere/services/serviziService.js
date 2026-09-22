const { Servizio, Cliente, Prenotazione } = require('../models');
const { fn, col, literal } = require('sequelize');

/*
 * Service dei servizi: query Sequelize per gli endpoint 4 e 5.
 */

// Tutti i servizi, con durataFormattata (FLOOR/MOD) e prezzoFormattato (FORMAT/CONCAT).
exports.elencaTutti = async () => {
  return Servizio.findAll({
    attributes: [
      'id', 'nome', 'descrizione',
      [literal("CONCAT(FLOOR(durataMinuti/60), 'h ', MOD(durataMinuti,60), 'min')"), 'durataFormattata'],
      [literal("CONCAT(FORMAT(prezzo, 2), ' \u20AC')"), 'prezzoFormattato']
    ]
  });
};

// Dettaglio servizio con numeroPrenotazioni (COUNT), valutazioneMedia (AVG+ROUND)
// e l'elenco dei clienti. Stats e lista clienti hanno esigenze opposte
// (aggregazione vs tutte le righe): due query separate, unite in un oggetto.
// Restituisce null se il servizio non esiste.
exports.trovaPerId = async (id) => {
  const servizio = await Servizio.findByPk(id, {
    include: [{
      model: Cliente,
      through: { attributes: ['dataAppuntamento', 'valutazione'] }
    }]
  });
  if (!servizio) return null;

  const statistiche = await Prenotazione.findOne({
    attributes: [
      [fn('COUNT', col('ClienteId')), 'numeroPrenotazioni'],
      [fn('ROUND', fn('AVG', col('valutazione')), 1), 'valutazioneMedia']
    ],
    where: { ServizioId: id },
    raw: true
  });

  return {
    ...servizio.toJSON(),
    numeroPrenotazioni: Number(statistiche.numeroPrenotazioni) || 0,
    valutazioneMedia: statistiche.valutazioneMedia // null se nessuna valutazione
  };
};
