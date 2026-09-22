const sequelize = require('../config/database');
const Cliente = require('./Cliente');
const Servizio = require('./Servizio');
const Prenotazione = require('./Prenotazione');

/*
 * 1) Relazione MOLTI-A-MOLTI tramite tabella associativa esplicita.
 *    Grazie al "through: Prenotazione" possiamo leggere anche dataAppuntamento
 *    e valutazione includendo Servizio (o Cliente) nelle query.
 */
Cliente.belongsToMany(Servizio, {
  through: Prenotazione,
  foreignKey: 'ClienteId',
  otherKey: 'ServizioId'
});
Servizio.belongsToMany(Cliente, {
  through: Prenotazione,
  foreignKey: 'ServizioId',
  otherKey: 'ClienteId'
});

/*
 * 2) Relazioni dirette 1-a-molti verso la tabella associativa.
 *    Non sono obbligatorie per la M:N, ma rendono molto più pulite le query
 *    di aggregazione (endpoint 6): possiamo fare JOIN diretto Servizio <-> Prenotazione
 *    con un alias chiaro ("prenotazioni") invece del nome pluralizzato di default.
 */
Servizio.hasMany(Prenotazione, { foreignKey: 'ServizioId', as: 'prenotazioni' });
Prenotazione.belongsTo(Servizio, { foreignKey: 'ServizioId' });
Cliente.hasMany(Prenotazione, { foreignKey: 'ClienteId', as: 'prenotazioni' });
Prenotazione.belongsTo(Cliente, { foreignKey: 'ClienteId' });

module.exports = { sequelize, Cliente, Servizio, Prenotazione };
