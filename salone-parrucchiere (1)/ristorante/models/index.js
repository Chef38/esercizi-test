const sequelize = require('../config/database');
const Piatto = require('./Piatto');
const Ingrediente = require('./Ingrediente');
const Categoria = require('./Categoria');
const PiattoIngrediente = require('./PiattoIngrediente');

/*
 * models/index.js: file CENTRALE dei modelli.
 * - Carica tutti i modelli (una tabella = un file).
 * - Definisce le ASSOCIAZIONI in un unico posto.
 * - Esporta l'istanza sequelize + i modelli gia' associati.
 *
 * Chi importa da qui riceve i modelli con TUTTI i metodi generati dalle
 * associazioni (setIngredienti, getPiatti, ecc.).
 *
 * REGOLA D'ORO: le associazioni vanno definite QUI, mai dentro i singoli
 * file dei modelli, altrimenti si rischia il "circular require" e i metodi
 * non vengono generati in modo affidabile.
 */

// -----------------------------------------------------------------------------
// 1) Relazione MOLTI-A-UNO: Categoria (1) <-> (N) Piatto
// -----------------------------------------------------------------------------
// hasMany     -> "una Categoria ha molti Piatti"     (categoria.getPiatti())
// belongsTo   -> "un Piatto appartiene a una Categoria" (piatto.getCategoria())
// foreignKey  -> nome esplicito della colonna FK (default: CategoriaId).
// as: 'piatti'-> alias italiano invece del brutto "Piattos" del default inglese.
Categoria.hasMany(Piatto, { foreignKey: 'CategoriaId', as: 'piatti' });
Piatto.belongsTo(Categoria, { foreignKey: 'CategoriaId' });

// -----------------------------------------------------------------------------
// 2) Relazione MOLTI-A-MOLTI: Piatto (N) <-> (N) Ingrediente
// -----------------------------------------------------------------------------
// belongsToMany va dichiarata SU ENTRAMBI I LATI.
// through: PiattoIngrediente -> pivot ESPLICITA (un modello nostro).
//   Se passassimo una stringa 'PiattoIngrediente' Sequelize creerebbe una
//   pivot implicita e non avremmo il controllo sulle sue colonne.
// foreignKey -> FK verso il modello CORRENTE.
// otherKey   -> FK verso il modello OPPOSTO.
//
// Metodi generati (che usiamo nei service):
//   piatto.setIngredienti([1,2,3])  -> DELETE + INSERT sulla pivot.
//   piatto.getIngredienti()         -> SELECT con JOIN.
//   piatto.addIngrediente(x), removeIngrediente(x)
Piatto.belongsToMany(Ingrediente, {
  through: PiattoIngrediente,
  foreignKey: 'PiattoId',
  otherKey: 'IngredienteId'
});
Ingrediente.belongsToMany(Piatto, {
  through: PiattoIngrediente,
  foreignKey: 'IngredienteId',
  otherKey: 'PiattoId'
});

module.exports = { sequelize, Piatto, Ingrediente, PiattoIngrediente, Categoria };
