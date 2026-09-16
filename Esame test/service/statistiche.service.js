const repo = require('../repository/servizio.repository');

const statisticheService = {

    serviziPopolari: async () => repo.serviziPopolari(),

};

module.exports = statisticheService;
