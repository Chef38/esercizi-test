const service = require('../service/servizio.service');

const servizioController = {

    getAll: async (req, res, next) => {
        try {
            const servizi = await service.getAll();
            res.status(200).json(servizi);
        } catch (err) {
            next(err);
        }
    },

    getById: async (req, res, next) => {
        try {
            const servizio = await service.getById(req.params.id);
            res.status(200).json(servizio);
        } catch (err) {
            if (err.status) return res.status(err.status).json({ errore: err.message });
            next(err);
        }
    },

};

module.exports = servizioController;
