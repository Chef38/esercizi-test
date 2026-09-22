const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/*
 * Tabella associativa Cliente <-> Servizio.
 * A differenza di una semplice pivot, ha attributi propri (dataAppuntamento,
 * valutazione), quindi va definita come MODELLO a sé stante e passata come
 * "through" esplicito nelle associazioni belongsToMany.
 * La chiave primaria è COMPOSTA: (ClienteId, ServizioId).
 */
const Prenotazione = sequelize.define('Prenotazione', {
  ClienteId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: { model: 'Clienti', key: 'id' }
  },
  ServizioId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: { model: 'Servizi', key: 'id' }
  },
  dataAppuntamento: {
    type: DataTypes.DATE,
    allowNull: false
  },
  valutazione: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 5 } // valutazione da 1 a 5
  }
}, {
  tableName: 'Prenotazioni',
  timestamps: false
});

module.exports = Prenotazione;
