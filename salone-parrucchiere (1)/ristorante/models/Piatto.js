const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/*
 * Modello Piatto: tabella principale.
 * - FK verso Categoria (relazione N:1, definita in models/index.js).
 * - Relazione N:N con Ingrediente tramite la pivot PiattoIngrediente.
 *
 * tableName esplicito: Sequelize di default pluralizza in inglese ("Piattos"),
 * qui vogliamo il nome italiano "Piatto".
 * timestamps: false -> la nostra tabella non ha createdAt/updatedAt.
 */
const Piatto = sequelize.define('Piatto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING,   // = VARCHAR(255)
    allowNull: false
  },
  descrizione: {
    type: DataTypes.TEXT,     // testo lungo, opzionale
    allowNull: true
  },
  prezzo: {
    type: DataTypes.FLOAT,    // la traccia richiede FLOAT
    allowNull: false
  },
  vegetariano: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  disponibile: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  CategoriaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    // references qui e' la FK LOGICA lato Sequelize; la FK "vera" (con nome del
    // vincolo) e' definita nello script SQL.
    references: { model: 'Categoria', key: 'id' }
  }
}, {
  tableName: 'Piatto',
  timestamps: false
});

module.exports = Piatto;
