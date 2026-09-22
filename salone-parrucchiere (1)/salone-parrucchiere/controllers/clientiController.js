/**
 * controllers/clientiController.js
 * Gestione HTTP + query Sequelize per gli endpoint dei clienti.
 */

const { Cliente, Servizio } = require('../models');
const { fn, col, literal, Op } = require('sequelize');

const clientiController = {

  // GET /api/clienti  (Endpoint 1)
  // Lista clienti con nomeCompleto (CONCAT) e dataIscrizione formattata (DATE_FORMAT).
  lista: async (req, res) => {
    try {
      const clienti = await Cliente.findAll({
        attributes: [
          'id', 'email', 'telefono',
          [fn('CONCAT', col('nome'), ' ', col('cognome')), 'nomeCompleto'],
          [fn('DATE_FORMAT', col('dataIscrizione'), '%d/%m/%Y'), 'dataIscrizioneFormattata']
        ]
      });
      res.status(200).json(clienti);
    } catch (err) {
      res.status(500).json({ errore: err.message });
    }
  },

  // GET /api/clienti/ricerca?q=...  (Endpoint 3)
  // Ricerca case-insensitive su nome O cognome (LIKE '%...%').
  ricerca: async (req, res) => {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ errore: "Parametro di ricerca 'q' obbligatorio." });
    }
    try {
      const clienti = await Cliente.findAll({
        attributes: [
          'id', 'email', 'telefono',
          [fn('CONCAT', col('nome'), ' ', col('cognome')), 'nomeCompleto']
        ],
        where: {
          [Op.or]: [
            { nome:    { [Op.like]: `%${q}%` } },
            { cognome: { [Op.like]: `%${q}%` } }
          ]
        }
      });
      res.status(200).json(clienti);
    } catch (err) {
      res.status(500).json({ errore: err.message });
    }
  },

  // GET /api/clienti/:id  (Endpoint 2)
  // Dettaglio con eta (TIMESTAMPDIFF) e servizi svolti (Prenotazione come pivot).
  dettaglio: async (req, res) => {
    try {
      const cliente = await Cliente.findByPk(req.params.id, {
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
      if (!cliente) {
        return res.status(404).json({ errore: 'Cliente non trovato.' });
      }
      res.status(200).json(cliente);
    } catch (err) {
      res.status(500).json({ errore: err.message });
    }
  }

};

module.exports = clientiController;
