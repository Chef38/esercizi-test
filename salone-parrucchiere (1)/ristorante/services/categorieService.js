const { Categoria, Piatto, Ingrediente } = require('../models');

/*
 * Service delle categorie: query Sequelize.
 * NESSUN riferimento a req/res: il layer HTTP e' nel controller.
 */

// Lista ordinata per ordineMenu ASC (come richiesto dalla traccia).
// order accetta array di array: [['colonna', 'ASC'|'DESC'], ['altra', ...]]
exports.elencaTutte = async () => {
  return Categoria.findAll({ order: [['ordineMenu', 'ASC']] });
};

// Crea + restituisce l'istanza con l'id assegnato.
// Il destructuring del parametro protegge da campi non voluti: se il client
// invia { id: 999, ... } il nostro id resta autogenerato.
exports.crea = async ({ nome, descrizione, ordineMenu }) => {
  return Categoria.create({ nome, descrizione, ordineMenu });
};

// findByPk = "find by primary key". Piu' leggibile di findOne({where:{id}}).
exports.trovaPerId = async (id) => Categoria.findByPk(id);

// SELECT COUNT(*): usato prima della DELETE per bloccarla se ci sono piatti.
exports.contaPiatti = async (id) => Piatto.count({ where: { CategoriaId: id } });

// DELETE. Restituisce il numero di righe eliminate (0 o 1).
exports.elimina = async (id) => Categoria.destroy({ where: { id } });

// Tutti i piatti di una categoria (con ingredienti nascondendo la pivot).
exports.piattiDellaCategoria = async (id) => {
  return Piatto.findAll({
    where: { CategoriaId: id },
    include: [{ model: Ingrediente, through: { attributes: [] } }]
  });
};
