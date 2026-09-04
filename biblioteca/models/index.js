/**
 * models/index.js — Associazioni tra modelli
 *
 * ─────────────────────────────────────────────────────────────
 *  SCHEMA RELAZIONI (da HeidiSQL)
 * ─────────────────────────────────────────────────────────────
 *
 *  categoria (1) ──< (molti) libro
 *    FK: libro.categoria → categoria.id   (NO ACTION)
 *
 *  autore (1) ──< (molti) libro
 *    FK: libro.autore → autore.id         (NO ACTION)
 *
 *  NON esiste una tabella associativa: ogni libro ha
 *  UN solo autore e UNA sola categoria (colonne FK dirette).
 *
 * ─────────────────────────────────────────────────────────────
 *  METODI GENERATI DA SEQUELIZE
 * ─────────────────────────────────────────────────────────────
 *
 *  libro.getCategoria()      → carica la categoria del libro
 *  libro.getAutore()         → carica l'autore del libro
 *  categoria.getLibri()      → carica tutti i libri di una categoria
 *  autore.getLibri()         → carica tutti i libri di un autore
 */

const sequelize = require('../config/database');
const Categoria = require('./categoria.model');
const Autore    = require('./autore.model');
const Libro     = require('./libri.model');

// ── 1-a-molti: Categoria → Libro ─────────────────────────────
//
// foreignKey: nome del campo JS sul modello Libro (categoriaId)
// che Sequelize mappa alla colonna "categoria" nel DB (tramite `field`)

Categoria.hasMany(Libro, {
  foreignKey: 'categoriaId',
  as:         'libri',
});

Libro.belongsTo(Categoria, {
  foreignKey: 'categoriaId',
  as:         'categoria',
});

// ── 1-a-molti: Autore → Libro ─────────────────────────────────
//
// Stessa logica: foreignKey riferisce il campo JS `autoreId`
// che nel DB è la colonna "autore"

Autore.hasMany(Libro, {
  foreignKey: 'autoreId',
  as:         'libri',
});

Libro.belongsTo(Autore, {
  foreignKey: 'autoreId',
  as:         'autore',
});

module.exports = {
  sequelize,
  Categoria,
  Autore,
  Libro,
};