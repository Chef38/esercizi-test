const express = require('express');
const app = express();
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

require('./routes')(app);

app.get('/', (req, res) => {
    res.json({ messaggio: 'Parrucchiere API', endpoints: ['/api/servizi', '/api/clienti', '/api/prenotazioni'] });
}); 

app.use((err, req, res, next) => {
    console.error('Errore non gestito:', err);
  res.status(500).json({ errore: 'Errore interno del server.' });
});

module.exports = app;