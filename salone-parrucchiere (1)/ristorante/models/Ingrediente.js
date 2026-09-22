const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/*
 * Modello Ingrediente.
 * Lato "N" della relazione N:N con Piatto (via pivot PiattoIngrediente).
 */
const Ingrediente = sequelize.define('Ingrediente', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true               // niente doppioni ("Pomodoro" una sola volta)
  },
  allergene: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false        // richiesto dalla traccia per allergie comuni
  },
  unitaMisura: {
    type: DataTypes.STRING,    // "g", "ml", "pz"
    allowNull: true
  }
}, {
  tableName: 'Ingrediente',
  timestamps: false
});

module.exports = Ingrediente;
