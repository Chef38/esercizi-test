const sequelize = require('../config/database');
const Servizio = require('./servizio.model');
const Cliente = require('./cliente.model');
const Prenotazione = require('./prenotazione.model');


Cliente.belongsToMany(Servizio, {through: Prenotazione, foreignKey: 'ClienteId', otherKey: 'ServizioId'});
Servizio.belongsToMany(Cliente, {through: Prenotazione, foreignKey: 'ServizioId', otherKey: 'ClienteId'});

Servizio.hasMany(Prenotazione, {
  foreignKey: 'ServizioId',
  as:         'prenotazioni',
});

Prenotazione.belongsTo(Servizio, {
  foreignKey: 'ServizioId',
  as:         'servizio',
});

Cliente.hasMany(Prenotazione, {
  foreignKey: 'ClienteId',
  as:         'prenotazioni',
});

Prenotazione.belongsTo(Cliente, {
  foreignKey: 'ClienteId',
  as:         'cliente',
});




module.exports = {
  sequelize,
  Cliente,
  Servizio,
  Prenotazione,
};