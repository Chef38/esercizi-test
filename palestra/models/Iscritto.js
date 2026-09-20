/**
 * models/Iscritto.js - Modello Sequelize della tabella "Iscritti".
 *
 * Rappresenta una persona iscritta alla palestra. La relazione con Corso
 * e' MOLTI-A-MOLTI: un iscritto puo' frequentare piu' corsi, un corso puo'
 * avere molti iscritti. La relazione e' materializzata da una tabella
 * associativa chiamata CorsoIscritto (vedi models/index.js).
 *
 * Perche' non abbiamo qui la relazione "hasMany Corso"?
 *   Perche' i due lati della M:N non condividono direttamente colonne: c'e'
 *   sempre in mezzo la tabella associativa. Sequelize offre l'astrazione
 *   `belongsToMany` che nasconde la pivot al chiamante: viene definita in
 *   models/index.js perche' li' abbiamo TUTTI i modelli e possiamo dichiarare
 *   la relazione da entrambi i lati senza dipendenze circolari.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Iscritto = sequelize.define('Iscritto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cognome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    /*
     * unique: true =>
     *   1) impedisce due iscritti con la stessa email;
     *   2) il DB crea un indice UNIQUE su email, quindi anche le SELECT
     *      per email sono veloci (utile in un futuro endpoint di login).
     * Il controllo di formato "e' davvero un'email?" NON e' qui: quello
     * spetta al validator (validators/iscrittiValidator.js), perche' e' una
     * validazione di INPUT, non un vincolo di integrita' del DB.
     */
    unique: true
  },
  dataNascita: {
    /*
     * DATEONLY vs DATE:
     *   - DATEONLY = DATE in SQL: solo giorno (YYYY-MM-DD), senza orario.
     *   - DATE     = DATETIME in SQL: giorno + ora.
     * Per una data di nascita l'ora e' irrilevante e anzi crea problemi di
     * fuso orario. DATEONLY e' la scelta corretta.
     */
    type: DataTypes.DATEONLY,
    allowNull: false
  }
}, {
  // Forziamo il nome tabella: la pluralizzazione automatica di 'Iscritto'
  // sarebbe 'Iscrittos', che non e' l'italiano corretto ne' l'inglese.
  tableName: 'Iscritti',
  timestamps: false
});

module.exports = Iscritto;
