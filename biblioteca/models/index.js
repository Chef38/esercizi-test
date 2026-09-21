/**
 * models/index.js — Associazioni tra modelli
 *
 * ═══════════════════════════════════════════════════════════════
 *  ✅ TODO ESAME — file CRUCIALE, il più dimenticato:
 *   [ ] Import di tutti i modelli
 *   [ ] Per OGNI relazione 1-a-molti scrivi DUE dichiarazioni:
 *        Padre.hasMany(Figlio,   { foreignKey, as })
 *        Figlio.belongsTo(Padre, { foreignKey, as })
 *   [ ] Gli `as` DEVONO essere coerenti con gli include nei repository
 *   [ ] Molti-a-molti: belongsToMany + through: 'tabella_pivot'
 *   [ ] Export di sequelize + tutti i modelli
 *   [ ] Attenzione: SENZA questo file gli include: [{ as: '...' }]
 *       lanciano "association not found"
 * ═══════════════════════════════════════════════════════════════
 *
 * ─────────────────────────────────────────────────────────────
 *  SCHEMA RELAZIONI (aggiornato per traccia esame)
 * ─────────────────────────────────────────────────────────────
 *
 *  categoria (1) ──< (molti) libro
 *    FK: libro.categoria → categoria.id   (NO ACTION)
 *
 *  libro (molti) ──── (molti) autore
 *    Tabella pivot: libro_autore (id_libro, id_autore)
 *
 *  Un libro può avere PIÙ autori e un autore PIÙ libri
 *  (relazione many-to-many gestita da libro_autore).
 *
 * ─────────────────────────────────────────────────────────────
 *  METODI GENERATI DA SEQUELIZE
 * ─────────────────────────────────────────────────────────────
 *
 *  libro.getCategoria()      → carica la categoria del libro
 *  libro.getAutori()         → array degli autori del libro
 *  libro.setAutori([1,2,3])  → sostituisce completamente gli autori
 *  libro.addAutore(id)       → aggiunge un autore
 *  categoria.getLibri()      → carica tutti i libri di una categoria
 *  autore.getLibri()         → array dei libri di un autore
 *  autore.setLibri([...])    → sostituisce i libri di un autore
 */

// Importa l'istanza sequelize (connessione DB) e tutti i modelli,
// compresa la tabella pivot per la relazione many-to-many.
const sequelize   = require('../config/database');
const Categoria   = require('./categoria.model');
const Autore      = require('./autore.model');
const Libro       = require('./libri.model');
const LibroAutore = require('./libro_autore.model');

// ── 1-a-molti: Categoria → Libro ─────────────────────────────
//
// foreignKey: nome del campo JS sul modello Libro (categoriaId)
// che Sequelize mappa alla colonna "categoria" nel DB (tramite `field`)

// hasMany: "una categoria HA MOLTI libri"
// Genera il metodo categoria.getLibri() sul modello Categoria
Categoria.hasMany(Libro, {
  foreignKey: 'categoriaId', // il campo che collega i due modelli
  as:         'libri',        // alias usato in include: [{ as: 'libri' }]
});

// belongsTo: "un libro APPARTIENE A una categoria"
// Genera il metodo libro.getCategoria() sul modello Libro
// Le due associazioni (hasMany + belongsTo) sono la stessa relazione
// vista dai due lati: vanno SEMPRE dichiarate entrambe.
Libro.belongsTo(Categoria, {
  foreignKey: 'categoriaId',
  as:         'categoria',
});

// ── MOLTI-A-MOLTI: Libro ↔ Autore tramite libro_autore ────────
//
// Un libro può avere più autori e viceversa. La relazione è
// gestita da una TABELLA PIVOT ("libro_autore") con due FK:
//   - id_libro  → libro.id
//   - id_autore → autore.id
//
// belongsToMany genera automaticamente i metodi utili sull'istanza:
//   libro.setAutori([1, 2, 3])   → sostituisce completamente gli autori
//   libro.addAutore(id)          → aggiunge un autore
//   libro.removeAutore(id)       → rimuove un autore
//   libro.getAutori()            → array degli autori
// (idem per autore.setLibri, autore.addLibro, ecc.)

Libro.belongsToMany(Autore, {
  through:    LibroAutore, // il modello della tabella pivot
  foreignKey: 'id_libro',  // colonna della pivot che punta a libro
  otherKey:   'id_autore', // colonna della pivot che punta a autore
  as:         'autori',    // include: [{ as: 'autori' }] → array di autori
});

Autore.belongsToMany(Libro, {
  through:    LibroAutore,
  foreignKey: 'id_autore',
  otherKey:   'id_libro',
  as:         'libri',     // autore.libri → array di libri
});

// Esporta tutto in un unico oggetto: chi importa può fare
// const { Libro, Autore, LibroAutore } = require('./models')
module.exports = {
  sequelize,
  Categoria,
  Autore,
  Libro,
  LibroAutore,
};