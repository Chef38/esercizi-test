/**
 * repositories/iscrittoRepository.js
 *
 * Accesso ai dati per la risorsa Iscritto. Come sempre nel layer repository:
 * qui si scrivono le query Sequelize, e basta.
 *
 * Le associazioni utilizzate:
 *   Iscritto.belongsToMany(Corso, { as: { plural: 'Corsi' } })  => iscritto.Corsi
 *   Corso.belongsTo(Sala)                                        => corso.Sala
 * Grazie agli alias italiani (definiti in models/index.js) le proprieta'
 * di risposta si leggono correttamente: `iscritto.Corsi`, `corso.Sala`.
 */
const { Iscritto, Corso, Sala } = require('../models');

/**
 * Elenca tutti gli iscritti, ordinati per cognome e a parita' per nome.
 * L'ordine multi-colonna e' espresso come array di array: il primo elemento
 * ha priorita' maggiore. Corrisponde a "ORDER BY cognome ASC, nome ASC".
 */
exports.findAll = () => Iscritto.findAll({
  order: [['cognome', 'ASC'], ['nome', 'ASC']]
});

/**
 * findById "leggero": restituisce solo il record iscritto, senza JOIN.
 * Lo usa il service in modo mirato: es. verificare l'esistenza prima di
 * un update, senza pagare il costo di caricare anche i corsi.
 */
exports.findById = (id) => Iscritto.findByPk(id);

/**
 * findByIdConCorsi: usato dall'endpoint 6 (dettaglio con corsi frequentati).
 *   include Corso: relazione M:N, quindi Sequelize fa 2 JOIN (via pivot).
 *   include annidato Sala: per ogni corso vogliamo anche la sala in cui
 *     si svolge (relazione M:1 -> un solo JOIN in piu').
 *   through: { attributes: [] } -> nasconde le colonne della pivot che
 *     non aggiungono valore alla risposta JSON.
 */
exports.findByIdConCorsi = (id) => Iscritto.findByPk(id, {
  include: [{
    model: Corso,
    as: 'Corsi',
    through: { attributes: [] },
    include: [{ model: Sala }]
  }]
});

/**
 * Data una lista di id, restituisce solo gli iscritti effettivamente
 * presenti nel DB. Usato dal corsoService per capire quali id non esistono
 * PRIMA di creare/aggiornare un corso, cosi' non creiamo record "orfani"
 * nel caso in cui almeno un id sia sbagliato.
 *
 * where: { id: ids } con `ids` array -> Sequelize genera "id IN (...)".
 */
exports.findByIds = (ids) => Iscritto.findAll({ where: { id: ids } });

/**
 * Crea un nuovo iscritto. Il vincolo UNIQUE su email e' nel modello e nel
 * DB: se qualcuno reinvia la stessa email, questa promise viene rejected
 * con SequelizeUniqueConstraintError. Il controller lo cattura per
 * rispondere 400 invece che 500.
 */
exports.create = (dati) => Iscritto.create(dati);

/**
 * save(): il service ha gia' caricato l'istanza `iscritto` e ha filtrato i
 * campi consentiti in `patch`. Qui li applichiamo con Object.assign (fusione
 * superficiale) e chiamiamo save(). Sequelize genera "UPDATE ... SET
 * campo=valore, ... WHERE id=?" mandando SOLO le colonne effettivamente
 * cambiate, quindi e' efficiente anche per patch parziali.
 */
exports.save = (iscritto, patch) => {
  Object.assign(iscritto, patch);
  return iscritto.save();
};
