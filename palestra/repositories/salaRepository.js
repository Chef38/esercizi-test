/**
 * repositories/salaRepository.js
 *
 * Il repository e' l'UNICO layer che parla con Sequelize per la risorsa Sala.
 * Contiene chiamate all'ORM "grezze" (findAll, findByPk, count, destroy...)
 * e nient'altro:
 *   - non conosce req/res (quello e' compito del controller);
 *   - non applica regole di business (quello e' compito del service);
 *   - non decide cosa fare in caso di "non trovato" (restituisce null o un
 *     conteggio, chi lo chiama decide).
 *
 * Il vantaggio pratico e' che se domani cambiamo ORM (es. Prisma, TypeORM,
 * knex) o SQL "puro", i cambiamenti restano confinati qui.
 *
 * NB sugli alias: Sala.hasMany(Corso, { as: 'Corsi' }) e
 * Corso.belongsToMany(Iscritto, { as: 'Iscritti' }): quando includiamo
 * l'associazione dobbiamo SEMPRE passare la stessa proprieta' `as`,
 * altrimenti Sequelize lancia l'errore "You must use the 'as' keyword to
 * reference this association", perche' potrebbero esistere piu' associazioni
 * fra gli stessi due modelli e senza alias sarebbero ambigue.
 */
const { Sala, Corso, Iscritto } = require('../models');

/**
 * Elenca tutte le sale ordinate per id.
 * findAll() senza where => "SELECT * FROM Sale ORDER BY id ASC".
 */
exports.findAll = () => Sala.findAll({ order: [['id', 'ASC']] });

/**
 * Cerca una sala per PK. Restituisce l'istanza o null se non esiste.
 * findByPk usa direttamente la PK, quindi non serve where: e' la scelta
 * idiomatica quando abbiamo un id.
 */
exports.findById = (id) => Sala.findByPk(id);

/**
 * Endpoint 15: dettaglio della sala con TUTTI i suoi corsi, e per ogni
 * corso l'elenco degli iscritti.
 *
 *   include:
 *     - { model: Corso, as: 'Corsi', ... } => JOIN Sale x Corsi
 *       Include annidato per Iscritto: dentro `Corso` includiamo anche
 *       i suoi iscritti (Sequelize genera JOIN aggiuntivi con la pivot).
 *     - through: { attributes: [] } sull'iscritto: NON includere nella
 *       risposta le colonne interne della pivot (CorsoId, IscrittoId),
 *       che sono ridondanti dal punto di vista del client.
 */
exports.findByIdConCorsi = (id) => Sala.findByPk(id, {
  include: [{
    model: Corso,
    as: 'Corsi',
    include: [{ model: Iscritto, as: 'Iscritti', through: { attributes: [] } }]
  }]
});

/**
 * Crea una nuova sala. create() fa in un solo passo INSERT + rilettura del
 * record con l'id AUTO_INCREMENT valorizzato, e restituisce l'istanza.
 */
exports.create = (dati) => Sala.create(dati);

/**
 * Elimina la sala PASSATA come istanza (non l'id). Il service ci ha gia'
 * fatto findById prima di controllare i corsi associati: passare l'istanza
 * evita una seconda query "SELECT prima di DELETE".
 */
exports.destroy = (sala) => sala.destroy();

/**
 * Conta quanti corsi puntano a questa sala.
 * Usato dal service per decidere se la sala e' cancellabile: se il conteggio
 * e' > 0, la cancellazione va bloccata a livello applicativo (endpoint 3
 * risponde 400). Nota che la FK di Corsi.SalaId ha ON DELETE RESTRICT nel DB,
 * quindi anche saltando questo controllo il DB rifiuterebbe la DELETE: e'
 * una difesa "in profondita'".
 */
exports.countCorsiPerSala = (SalaId) => Corso.count({ where: { SalaId } });
