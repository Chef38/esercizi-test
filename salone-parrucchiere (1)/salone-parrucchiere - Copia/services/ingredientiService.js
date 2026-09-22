const { Ingrediente, Piatto, Categoria } = require('../models');

/*
 * Service degli ingredienti: query Sequelize.
 */

exports.elencaTutti = async () => Ingrediente.findAll({ order: [['nome', 'ASC']] });

exports.crea = async ({ nome, allergene, unitaMisura }) => {
  return Ingrediente.create({ nome, allergene, unitaMisura });
};

// Dettaglio ingrediente CON i piatti che lo usano E la categoria di ogni piatto.
// Include ANNIDATO: Ingrediente -> Piatto -> Categoria.
// through: { attributes: [] } nasconde le colonne della pivot dal JSON.
exports.trovaPerId = async (id) => {
  return Ingrediente.findByPk(id, {
    include: [{
      model: Piatto,
      through: { attributes: [] },
      include: [{ model: Categoria }]
    }]
  });
};

// PUT: partial update. Se manca l'ingrediente ritorna null (il controller -> 404).
// instance.update(dati) modifica SOLO i campi presenti in dati.
exports.aggiorna = async (id, dati) => {
  const ingrediente = await Ingrediente.findByPk(id);
  if (!ingrediente) return null;
  await ingrediente.update(dati);
  return ingrediente;
};
