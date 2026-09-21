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
 *
 * ═══════════════════════════════════════════════════════════════
 *  ✅ TODO ESAME — MODELLO (schema di riferimento):
 *   [ ] PK: id INTEGER, primaryKey: true, autoIncrement: true
 *   [ ] Per ogni colonna: type, allowNull, unique, defaultValue
 *   [ ] Se nome DB ≠ nome JS: usa `field: 'nome_reale'`
 *   [ ] FK: solo type + allowNull + eventuale field
 *          (la relazione vera si dichiara in models/index.js)
 *   [ ] tableName: 'nome_reale_tabella' (Sequelize pluralizza sennò)
 *   [ ] timestamps: false (a meno che la traccia lo richieda)
 * ═══════════════════════════════════════════════════════════════
 */

// Import dei tipi Sequelize e della connessione condivisa
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Definizione del modello Libro
const Libro = sequelize.define('Libro', {

  // Chiave primaria auto-incrementata
  id: {
    type:          DataTypes.INTEGER(10),
    primaryKey:    true,
    autoIncrement: true,
  },

  // Titolo del libro, obbligatorio
  titolo: {
    type:      DataTypes.STRING(300),
    allowNull: false,
  },

  // ISBN: codice fisso di 13 caratteri, deve essere UNIVOCO
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
    defaultValue: 0,                     // se non specificato, va 0
    field:        'annoPubblicazione',   // nome esatto della colonna nel DB
  },

  // Prezzo in decimale, opzionale
  prezzo: {
    type:      DataTypes.FLOAT,
    allowNull: true,
  },

  // Disponibilità: true/false in JS, salvato come TINYINT(1) nel DB
  disponibile: {
    type:         DataTypes.BOOLEAN, // Sequelize mappa BOOLEAN ↔ TINYINT(1)
    allowNull:    false,
    defaultValue: true,              // per default un libro è disponibile
  },

  // FK verso categoria — nome colonna nel DB: "categoria"
  // In JS uso categoriaId (convenzione), nel DB la colonna si chiama "categoria"
  categoriaId: {
    type:      DataTypes.INTEGER(11),
    allowNull: true,
    field:     'categoria',  // nome REALE della colonna nel DB
  },

  // ★★★ La FK "autore" è stata RIMOSSA ★★★
  // Ora la relazione Libro↔Autore è MOLTI-A-MOLTI e viene gestita
  // dalla tabella associativa "libro_autore" (vedi models/libro_autore.model.js).
  // Un libro può avere più autori e un autore più libri.

}, {
  tableName:   'libro',      // nome tabella
  timestamps:  false,        // niente createdAt/updatedAt
  underscored: false,        // NON convertire camelCase → snake_case
                             // (i nomi delle colonne nel DB non sono snake_case)
});

module.exports = Libro;