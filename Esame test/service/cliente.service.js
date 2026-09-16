const repo = require('../repository/cliente.repository');

const clienteService = {

    getAll: async () => repo.findAll(),

    getById: async (id) => {
        const cliente = await repo.findById(id);
        if (!cliente) throw { status: 404, message: 'Cliente non trovato.' };
        return cliente;
    },

    search: async (q) => repo.search(q),

};

module.exports = clienteService;
