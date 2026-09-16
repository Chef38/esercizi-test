const clienteValidator = {

    validateId: (req, res, next) => {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ errore: "Il parametro 'id' deve essere un intero positivo." });
        }
        req.params.id = id;
        next();
    },

    validateSearchQuery: (req, res, next) => {
        const q = req.query.q;
        if (!q || typeof q !== 'string' || q.trim().length === 0) {
            return res.status(400).json({ errore: "Parametro di ricerca 'q' obbligatorio." });
        }
        req.query.q = q.trim();
        next();
    },

};

module.exports = clienteValidator;
