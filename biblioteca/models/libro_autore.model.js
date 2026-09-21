/**
 * models/LibroAutore.js — Tabella associativa (pivot) per la relazione
 * MOLTI-A-MOLTI tra Libro e Autore.
 *
 * Struttura tabella:
 *   id_libro  INT NOT NULL   FK → libro.id
 *   id_autore INT NOT NULL   FK → autore.id
 *   PRIMARY KEY (id_libro, id_autore)
 *
 * La tabella non ha campi aggiuntivi: contiene SOLO le due FK
 * che rappresentano il legame libro↔autore.
 *
 * ═══════════════════════════════════════════════════════════════
 *  ✅ TODO ESAME — TABELLA PIVOT per many-to-many:
 *   [ ] Nome tabella: libro_autore
 *   [ ] Chiavi: id_libro + id_autore (composta)
 *   [ ] Nessun campo extra (a meno che serva "data_assegnazione" ecc.)
 *   [ ] La relazione vera si dichiara in models/index.js con
 *       belongsToMany + through: LibroAutore
 * ═══════════════════════════════════════════════════════════════
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LibroAutore = sequelize.define('LibroAutore', {
  // FK verso libro.id
  id_libro: {
    type:       DataTypes.INTEGER,
    primaryKey: true,
  },
  // FK verso autore.id
  id_autore: {
    type:       DataTypes.INTEGER,
    primaryKey: true,
  },
}, {
  tableName:  'libro_autore', // nome REALE della tabella nel DB
  timestamps: false,
});

module.exports = LibroAutore;
