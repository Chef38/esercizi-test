const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Prenotazione = sequelize.define('Prenotazione', {


  ClienteId: {
    type:      DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },

  ServizioId: {
    type:      DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },

  dataAppuntamento: {
    type:      DataTypes.DATE,
    allowNull: false,
  },

  valutazione: {
    type:      DataTypes.INTEGER,
    allowNull: true,
    validate:  { min: 1, max: 5 },
  },

}, {
  tableName:   'prenotazione',       
  timestamps:  false,
  underscored: false,        
});

module.exports = Prenotazione;