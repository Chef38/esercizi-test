const servizioValidator = {

    validateId: (req, res, next) => {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ errore: "Il parametro 'id' deve essere un intero positivo." });
        }
        req.params.id = id;
        next();
    },

};

module.exports = servizioValidator;
