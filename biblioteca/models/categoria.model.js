/**
 * models/Categoria.js — Modello per la tabella "categoria"
 *
 * Struttura tabella (da HeidiSQL, FK esterna verso libro):
 *   id          INT  PK AUTO_INCREMENT
 *   nome        VARCHAR(100) NOT NULL UNIQUE
 *   descrizione VARCHAR(500) NULL
 *
 * RELAZIONE: una Categoria ha MOLTI Libri (1-a-molti)
 * La FK sta in libro.categoria → categoria.id
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Categoria = sequelize.define('Categoria', {

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
    type:      DataTypes.STRING(500),
    allowNull: true,
  },

}, {
  tableName:  'categoria',   // nome REALE della tabella nel DB
  timestamps: false,
});

module.exports = Categoria;