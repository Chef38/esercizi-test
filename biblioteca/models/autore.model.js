/**
 * models/Autore.js — Modello per la tabella "autore"
 *
 * Struttura reale (da HeidiSQL):
 *   id           INT(10)      PK AUTO_INCREMENT
 *   nome         VARCHAR(255) NOT NULL
 *   cognome      VARCHAR(255) NOT NULL
 *   nazionalità  VARCHAR(255) NULL        ← con accento!
 *   annoNascita  INT(10)      NULL        ← camelCase nel DB
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Autore = sequelize.define('Autore', {

  id: {
    type:          DataTypes.INTEGER(10),
    primaryKey:    true,
    autoIncrement: true,
  },

  nome: {
    type:      DataTypes.STRING(255),
    allowNull: false,
  },

  cognome: {
    type:      DataTypes.STRING(255),
    allowNull: false,
  },

  // In JS usiamo "nazionalita" (senza accento) per evitare problemi,
  // ma nel DB la colonna si chiama "nazionalità" (con accento)
  // → mappiamo con field
  nazionalita: {
    type:      DataTypes.STRING(255),
    allowNull: true,
    field:     'nazionalità',  // nome REALE della colonna nel DB
  },

  // Nel DB si chiama già annoNascita (camelCase) → nessun mapping necessario
  annoNascita: {
    type:      DataTypes.INTEGER(10),
    allowNull: true,
  },

}, {
  tableName:  'autore',  // nome REALE della tabella
  timestamps: false,
});

module.exports = Autore;