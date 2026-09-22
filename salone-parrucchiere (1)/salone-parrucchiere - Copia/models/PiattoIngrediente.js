const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/*
 * Tabella pivot per la relazione N:N Piatto <-> Ingrediente.
 *
 * PIVOT PURA: contiene SOLO le due FK, nessun attributo extra.
 * Se in un altro esercizio la pivot dovesse avere campi propri (es.
 * quantita, note, dataAppuntamento...) andrebbero aggiunti QUI e poi
 * usati nell'include con through: { attributes: ['quantita', ...] }.
 *
 * CHIAVE PRIMARIA COMPOSTA: entrambe le colonne hanno primaryKey: true
 * -> PK = (PiattoId, IngredienteId). Questo IMPEDISCE automaticamente di
 * associare due volte lo stesso ingrediente allo stesso piatto.
 */
const PiattoIngrediente = sequelize.define('PiattoIngrediente', {
  PiattoId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: { model: 'Piatto', key: 'id' }
  },
  IngredienteId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: { model: 'Ingrediente', key: 'id' }
  }
}, {
  tableName: 'PiattoIngrediente',
  timestamps: false
});

module.exports = PiattoIngrediente;
