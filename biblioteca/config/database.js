/**
 * config/database.js — Connessione al database MariaDB
 *
 * Legge tutte le credenziali dal file .env tramite process.env.
 * Il file .env viene caricato in server.js (prima di tutto il resto)
 * con require('dotenv').config()
 */

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,      // esameifts
  process.env.DB_USER,      // giovannisechi
  process.env.DB_PASSWORD,  // 150906

  {
    host:    process.env.DB_HOST    || 'localhost',
    port:    process.env.DB_PORT    || 3306,
    dialect: process.env.DB_DIALECT || 'mysql',  
    // DB_LOGGING=false → niente query SQL in console
    // DB_LOGGING=true  → stampa ogni query (utile per debug)
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,

    define: {
      timestamps: false, // disabilita createdAt/updatedAt globalmente
    },
  }
);

module.exports = sequelize;