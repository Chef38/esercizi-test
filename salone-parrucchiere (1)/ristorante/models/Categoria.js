const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/*
 * Modello Categoria (Antipasti, Primi, Secondi, ...).
 * Lato "1" della relazione N:1 con Piatto.
 */
const Categoria = sequelize.define('Categoria', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true              // non ha senso avere due categorie "Primi"
  },
  descrizione: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ordineMenu: {
    type: DataTypes.INTEGER,
    allowNull: false          // usato per ORDER BY nell'endpoint di lista
  }
}, {
  tableName: 'Categoria',
  timestamps: false
});

module.exports = Categoria;
