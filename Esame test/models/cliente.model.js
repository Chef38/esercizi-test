const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cliente = sequelize.define('Cliente', {

  id: {
    type:          DataTypes.INTEGER(10),
    primaryKey:    true,
    autoIncrement: true,
  },

  nome: {
    type:      DataTypes.STRING(255),
    allowNull: false,
  },

  cognome: {
    type:      DataTypes.STRING(255),
    allowNull: false,
  },

    email: {
    type:      DataTypes.STRING(255),
    allowNull: false,
    unique:    true,
  },


  telefono: {
    type:      DataTypes.STRING(255),
    allowNull: true,
  },


  dataNascita: {
    type:      DataTypes.DATEONLY,
    allowNull: false,
  },
  dataIscrizione: {
    type:      DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName:  'cliente',  
  timestamps: false,
});

module.exports = Cliente;