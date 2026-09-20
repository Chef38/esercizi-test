/**
 * models/Corso.js - Modello Sequelize della tabella "Corsi".
 *
 * E' la tabella "principale" del progetto: intorno ad essa girano tutte le
 * altre. Ha DUE relazioni:
 *   - Molti-a-uno con Sala: ogni corso ha UNA sala (SalaId e' la FK).
 *   - Molti-a-molti con Iscritto: gestita dalla pivot CorsoIscritto.
 *
 * Convenzioni Sequelize sui nomi delle FK:
 *   Se dichiaro `Corso.belongsTo(Sala)` senza options, Sequelize aggiunge
 *   automaticamente a Corso una colonna "SalaId" (NomeModello + "Id").
 *   Dato che la specifica dell'esercizio richiede proprio "SalaId", questa
 *   convenzione ci va bene e la sfruttiamo esplicitandola qui sotto.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Corso = sequelize.define('Corso', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
    // NB: qui il nome NON e' unique (a differenza di Sala.nome): due corsi
    // possono chiamarsi "Yoga" ma svolgersi in orari o sale diverse.
  },
  descrizione: {
    // TEXT (vs STRING): puo' contenere testi lunghi (fino a 64 KB su MariaDB).
    // Per una "descrizione degli obiettivi del corso" e' la scelta corretta.
    type: DataTypes.TEXT,
    // allowNull: true => campo opzionale. Se non lo passo, il DB memorizza NULL.
    allowNull: true
  },
  livello: {
    /*
     * STRING con validazione applicativa dei valori ammessi.
     * Alternativa "piu' stretta" sarebbe DataTypes.ENUM('base','intermedio','avanzato'),
     * che pero' rende scomodo aggiungere nuovi livelli in futuro (richiede
     * ALTER TABLE). Il livello e' validato lato validator; qui teniamo la
     * struttura flessibile.
     */
    type: DataTypes.STRING,
    allowNull: false
  },
  prezzoMensile: {
    /*
     * FLOAT: la specifica dell'esercizio lo richiede espressamente.
     * In un progetto "vero" si userebbe DECIMAL(10,2) per evitare i tipici
     * errori di virgola mobile con il denaro (es. 0.1 + 0.2 !== 0.3).
     */
    type: DataTypes.FLOAT,
    allowNull: false
  },
  postiMax: {
    /*
     * Numero massimo di iscritti ammessi. Deve essere <= capienza della
     * sala, ma questo vincolo NON e' modellato nel DB: sarebbe un CHECK
     * inter-tabella molto scomodo da mantenere. La regola "il corso non
     * puo' avere piu' iscritti di postiMax" viene fatta valere:
     *   - lato validator: postiMax deve essere > 0;
     *   - lato service (endpoint 14): "corsi disponibili" filtra su
     *     iscritti.length < postiMax.
     */
    type: DataTypes.INTEGER,
    allowNull: false
  },
  SalaId: {
    /*
     * Chiave esterna verso Sale.id. La dichiariamo ESPLICITAMENTE qui
     * (invece di lasciarla generare a Sequelize) per due motivi didattici:
     *   1) Rende visibile la relazione anche solo guardando il modello.
     *   2) Ci permette di dichiarare allowNull:false (un corso DEVE avere
     *      una sala) e la reference verso la tabella Sale.
     */
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Sale', key: 'id' }
  }
}, {
  tableName: 'Corsi',
  timestamps: false
});

module.exports = Corso;
