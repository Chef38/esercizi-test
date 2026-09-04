/**
 * models/Libro.js — Modello per la tabella "libro"
 *
 * Struttura reale della tabella (da HeidiSQL):
 *   id              INT(10)      PK AUTO_INCREMENT
 *   titolo          VARCHAR(300) NOT NULL
 *   isbn            CHAR(13)     NOT NULL UNIQUE
 *   annoPublica...  INT(10)      NULL     DEFAULT '0'
 *   prezzo          FLOAT        NULL
 *   disponibile     TINYINT(1)   NOT NULL DEFAULT '1'
 *   categoria       INT(11)      NULL     FK → categoria.id
 *   autore          INT(11)      NULL     FK → autore.id
 *
 * RELAZIONI:
 *   - molti-a-uno con Categoria (un libro ha UNA categoria)
 *   - molti-a-uno con Autore    (un libro ha UN autore)
 *
 * NON c'è tabella associativa: autore e categoria sono
 * colonne FK dirette nella tabella libro.
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Libro = sequelize.define('Libro', {

  id: {
    type:          DataTypes.INTEGER(10),
    primaryKey:    true,
    autoIncrement: true,
  },

  titolo: {
    type:      DataTypes.STRING(300),
    allowNull: false,
  },

  isbn: {
    type:      DataTypes.CHAR(13),
    allowNull: false,
    unique:    true,
  },

  // annoPubblicazione → colonna "annoPublica..." nel DB
  // underscored: true NON serve qui perché il nome nel DB non è snake_case
  // lo mappiamo esplicitamente con `field`
  annoPubblicazione: {
    type:         DataTypes.INTEGER(10),
    allowNull:    true,
    defaultValue: 0,
    field:        'annoPubblicazione', // nome esatto della colonna nel DB
  },

  prezzo: {
    type:      DataTypes.FLOAT,
    allowNull: true,
  },

  disponibile: {
    type:         DataTypes.BOOLEAN, // Sequelize mappa BOOLEAN ↔ TINYINT(1)
    allowNull:    false,
    defaultValue: true,
  },

  // FK verso categoria — nome colonna nel DB: "categoria"
  categoriaId: {
    type:      DataTypes.INTEGER(11),
    allowNull: true,
    field:     'categoria',  // nome REALE della colonna nel DB
  },

  // FK verso autore — nome colonna nel DB: "autore"
  autoreId: {
    type:      DataTypes.INTEGER(11),
    allowNull: true,
    field:     'autore',     // nome REALE della colonna nel DB
  },

}, {
  tableName:   'libro',       
  timestamps:  false,
  underscored: false,        
});

module.exports = Libro;