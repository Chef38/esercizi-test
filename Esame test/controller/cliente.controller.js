const service = require('../service/cliente.service');

const clienteController = {

    getAll: async (req, res, next) => {
        try {
            const clienti = await service.getAll();
            res.status(200).json(clienti);
        } catch (err) {
            next(err);
        }
    },

    getById: async (req, res, next) => {
        try {
            const cliente = await service.getById(req.params.id);
            res.status(200).json(cliente);
        } catch (err) {
            if (err.status) return res.status(err.status).json({ errore: err.message });
            next(err);
        }
    },

    search: async (req, res, next) => {
        try {
            const clienti = await service.search(req.query.q);
            res.status(200).json(clienti);
        } catch (err) {
            next(err);
        }
    },

};

module.exports = clienteController;
