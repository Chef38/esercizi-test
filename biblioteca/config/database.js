/**
 * config/database.js — Connessione al database MariaDB
 *
 * Legge tutte le credenziali dal file .env tramite process.env.
 * Il file .env viene caricato in server.js (prima di tutto il resto)
 * con require('dotenv').config()
 *
 * Sequelize è un ORM: permette di lavorare con oggetti JS invece
 * di scrivere SQL a mano. Qui si crea l'istanza CONDIVISA che
 * verrà usata da tutti i modelli.
 */

// Importa la classe Sequelize dal pacchetto sequelize
const { Sequelize } = require('sequelize');

// Costruttore: (nomeDB, utente, password, opzioni)
const sequelize = new Sequelize(
  process.env.DB_NAME,      // nome del database (es. esameifts)
  process.env.DB_USER,      // utente con permessi sul DB
  process.env.DB_PASSWORD,  // password dell'utente

  {
    // host: dove gira il DB. || 'localhost' è un fallback se .env non lo specifica
    host:    process.env.DB_HOST    || 'localhost',
    // porta di ascolto del DB (3306 è la porta standard MySQL/MariaDB)
    port:    process.env.DB_PORT    || 3306,
    // dialect: tipo di DB. 'mysql' funziona anche con MariaDB
    dialect: process.env.DB_DIALECT || 'mysql',
    // DB_LOGGING=false → niente query SQL in console
    // DB_LOGGING=true  → stampa ogni query (utile per debug)
    // Nota: === 'true' confronta con la STRINGA perché .env restituisce sempre stringhe
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,

    // Opzioni applicate a TUTTI i modelli definiti su questa istanza
    define: {
      timestamps: false, // disabilita createdAt/updatedAt globalmente
                         // (le tabelle esistenti nel DB non hanno queste colonne)
    },
  }
);

// Esporta l'istanza singola: chi la importa userà la STESSA connessione
module.exports = sequelize;