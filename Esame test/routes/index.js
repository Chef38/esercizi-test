const clienti     = require('./clienti.routes');
const servizi     = require('./servizi.routes');
const statistiche = require('./statistiche.routes');

module.exports = (app) => {
    app.use('/api/clienti',     clienti);
    app.use('/api/servizi',     servizi);
    app.use('/api/statistiche', statistiche);
};
