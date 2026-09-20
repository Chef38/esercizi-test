/**
 * models/Sala.js - Modello Sequelize della tabella "Sale".
 *
 * Rappresenta una sala fisica della palestra in cui si svolgono i corsi.
 * Relazione con Corso: 1 a N ("una sala ospita molti corsi").
 * Vedi models/index.js per la definizione delle associazioni.
 *
 * Distinzione importante:
 *   - Il MODELLO Sequelize (questo file) definisce come JavaScript vede la
 *     tabella: nomi, tipi, vincoli, opzioni ORM.
 *   - Lo SCHEMA SQL (sql/create_tables.sql) definisce come il DB crea la
 *     tabella. I due devono essere coerenti fra loro: se cambio il tipo
 *     di un campo qui, devo aggiornare anche l'SQL (e viceversa).
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/*
 * sequelize.define(nomeModello, attributi, opzioniTabella):
 *   1) nomeModello ('Sala'): Sequelize lo usa per costruire i "getter"
 *      generati dalle associazioni (Corso.getSala(), Sala.getCorsos(), ecc.).
 *      NB: la pluralizzazione automatica di 'Sala' e' 'Salas' -> per questo
 *      forziamo `tableName: 'Sale'` in fondo, cosi' Sequelize non cerca
 *      una tabella con nome sbagliato.
 *   2) attributi: le colonne della tabella con tipi e vincoli.
 *   3) opzioniTabella: metadati (nome tabella reale, timestamps, ecc.).
 */
const Sala = sequelize.define('Sala', {
  id: {
    // INTEGER: intero a 32 bit. Per una palestra sono piu' che sufficienti.
    type: DataTypes.INTEGER,
    // primaryKey: dichiara la PK del record.
    primaryKey: true,
    // autoIncrement: il DB assegna automaticamente un id crescente a ogni
    // INSERT. In MariaDB corrisponde a AUTO_INCREMENT.
    autoIncrement: true
  },
  nome: {
    // STRING = VARCHAR(255) di default. Ok per un nome di sala.
    type: DataTypes.STRING,
    // allowNull: false => NOT NULL in SQL: la colonna deve avere sempre
    // un valore. Se qualcuno tenta di inserire null, Sequelize solleva
    // ValidationError e non manda nemmeno la query al DB.
    allowNull: false,
    // unique: impone il vincolo UNIQUE. Se si tenta di inserire un nome
    // gia' presente, il DB rifiuta con codice ER_DUP_ENTRY e Sequelize
    // rilancia SequelizeUniqueConstraintError. Il controller lo intercetta
    // per rispondere 400 invece di 500.
    unique: true
  },
  piano: {
    // Piano dell'edificio (0 = piano terra, 1 = primo, ...).
    type: DataTypes.INTEGER,
    allowNull: false
  },
  capienza: {
    // Numero massimo di persone che la sala puo' contenere fisicamente.
    // NB: non e' la stessa cosa di postiMax del corso: postiMax puo' essere
    // <= capienza (a discrezione dell'istruttore).
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  /*
   * tableName: forziamo il nome della tabella nel DB. Senza questa opzione,
   * Sequelize pluralizzerebbe 'Sala' in 'Salas' (regola inglese di default).
   * Con tableName: 'Sale' garantiamo l'allineamento con lo script SQL.
   */
  tableName: 'Sale',

  /*
   * timestamps: false lo abbiamo gia' come default in config/database.js
   * ma ribadiamo qui per chiarezza: nessuna colonna createdAt/updatedAt.
   */
  timestamps: false
});

module.exports = Sala;
