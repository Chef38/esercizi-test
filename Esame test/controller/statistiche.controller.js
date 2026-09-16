const service = require('../service/statistiche.service');

const statisticheController = {

    serviziPopolari: async (req, res, next) => {
        try {
            const classifica = await service.serviziPopolari();
            res.status(200).json(classifica);
        } catch (err) {
            next(err);
        }
    },

};

module.exports = statisticheController;
