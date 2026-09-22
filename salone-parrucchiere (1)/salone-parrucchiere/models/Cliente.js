const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tabella principale: un cliente iscritto al salone.
const Cliente = sequelize.define('Cliente', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cognome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: true // campo opzionale
  },
  dataNascita: {
    type: DataTypes.DATEONLY, // solo data, serve per calcolare l'età
    allowNull: false
  },
  dataIscrizione: {
    type: DataTypes.DATE, // data + ora
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Clienti', // deve combaciare con create_tables.sql
  timestamps: false
});

module.exports = Cliente;
