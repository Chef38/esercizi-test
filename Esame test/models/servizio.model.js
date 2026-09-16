const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Servizio = sequelize.define('Servizio', {

  id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },

  nome: {
    type:      DataTypes.STRING(100),
    allowNull: false,
    unique:    true,
  },

  descrizione: {
    type:      DataTypes.TEXT,
    allowNull: true,
  },

  prezzo: {
    type:      DataTypes.FLOAT,
    allowNull: false,
  },

  durataMinuti: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },

}, {
  tableName:  'servizio',  
  timestamps: false,
});

module.exports = Servizio;