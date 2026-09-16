const repo = require('../repository/servizio.repository');

const servizioService = {

    getAll: async () => repo.findAll(),

    getById: async (id) => {
        const servizio = await repo.findById(id);
        if (!servizio || servizio.id === null) {
            throw { status: 404, message: 'Servizio non trovato.' };
        }
        return servizio;
    },

};

module.exports = servizioService;
