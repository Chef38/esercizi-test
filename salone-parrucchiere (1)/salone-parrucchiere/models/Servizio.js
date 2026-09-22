const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tabella secondaria: un servizio offerto dal salone (Taglio, Colore, ...).
const Servizio = sequelize.define('Servizio', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  descrizione: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  prezzo: {
    type: DataTypes.FLOAT, // in euro (da specifica; per denaro reale meglio DECIMAL)
    allowNull: false
  },
  durataMinuti: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'Servizi',
  timestamps: false
});

module.exports = Servizio;
