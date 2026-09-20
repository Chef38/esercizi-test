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

// DataTypes contiene i tipi di colonna (INTEGER, STRING, BOOLEAN, ecc.)
const { DataTypes } = require('sequelize');
// Importa l'istanza sequelize (connessione DB)
const sequelize = require('../config/database');

// sequelize.define('Categoria', { colonne }, { opzioni })
// Definisce un modello, ovvero la mappatura tabella ↔ classe JS
const Categoria = sequelize.define('Categoria', {

  // Chiave primaria: intera, auto-incrementata dal DB
  id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },

  // Nome della categoria: obbligatorio (NOT NULL) e UNIVOCO
  nome: {
    type:      DataTypes.STRING(100), // VARCHAR(100)
    allowNull: false,                 // NOT NULL nel DB
    unique:    true,                  // vincolo UNIQUE
  },

  // Descrizione opzionale
  descrizione: {
    type:      DataTypes.STRING(500),
    allowNull: true,                  // può essere NULL
  },

}, {
  // Nome reale della tabella nel DB.
  // Senza questo, Sequelize userebbe il PLURALE ("categorias") sbagliato
  tableName:  'categoria',
  // Non aggiungere colonne createdAt/updatedAt (non esistono nel DB)
  timestamps: false,
});

// Esporta il modello per l'uso nei repository
module.exports = Categoria;