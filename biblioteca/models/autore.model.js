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

// DataTypes = tipi colonna; sequelize = connessione DB condivisa
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Definizione del modello Autore
const Autore = sequelize.define('Autore', {

  // Chiave primaria auto-incrementata
  id: {
    type:          DataTypes.INTEGER(10),
    primaryKey:    true,
    autoIncrement: true,
  },

  // Nome dell'autore, obbligatorio
  nome: {
    type:      DataTypes.STRING(255),
    allowNull: false,
  },

  // Cognome dell'autore, obbligatorio
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
    // `field` è la CHIAVE: dice a Sequelize il nome VERO della colonna.
    // In JS lavoro con autore.nazionalita (facile), nel DB legge/scrive
    // la colonna "nazionalità" (con l'accento) senza rischiare bug.
    field:     'nazionalità',
  },

  // Nel DB si chiama già annoNascita (camelCase) → nessun mapping necessario
  annoNascita: {
    type:      DataTypes.INTEGER(10),
    allowNull: true,
  },

}, {
  tableName:  'autore',  // nome REALE della tabella (senza plurale automatico)
  timestamps: false,     // niente createdAt/updatedAt
});

module.exports = Autore;