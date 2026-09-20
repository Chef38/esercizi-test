/**
 * repositories/corsoRepository.js
 *
 * Accesso ai dati per la risorsa Corso. E' il repository "piu' ricco"
 * perche' quasi tutti gli endpoint dei corsi vogliono anche la sala e gli
 * iscritti collegati: definiamo una costante INCLUDE_STANDARD per non
 * ripetere lo stesso `include` in tante funzioni.
 *
 * Alias usati (definiti in models/index.js):
 *   - Sala.hasMany(Corso, { as: 'Corsi' })
 *   - Corso.belongsToMany(Iscritto, { as: 'Iscritti' })
 * Per includere queste associazioni bisogna ripetere l'`as` esattamente
 * uguale (altrimenti Sequelize non riconosce l'associazione).
 */
const { Corso, Sala, Iscritto } = require('../models');
const { Op } = require('sequelize');

/*
 * "Forma standard" di risposta di un corso: dati del corso + sala + iscritti.
 * Estratta come costante per due motivi:
 *   1) DRY (Don't Repeat Yourself): la include compare in 4 funzioni.
 *   2) Se in futuro cambia la forma (es. aggiungiamo la capienza della sala
 *      calcolata), la cambiamo in un solo posto.
 */
const INCLUDE_STANDARD = [
  { model: Sala },
  { model: Iscritto, as: 'Iscritti', through: { attributes: [] } }
];

/**
 * Endpoint 8: elenco di tutti i corsi con sala e iscritti.
 * findAll con include produce una query con JOIN. Per la parte M:N,
 * Sequelize genera 2 JOIN (Corsi -> CorsoIscritto -> Iscritti).
 */
exports.findAll = () => Corso.findAll({
  include: INCLUDE_STANDARD,
  order: [['id', 'ASC']]
});

/**
 * findById "leggero": solo il record del corso, senza relazioni. Usato dal
 * service quando ci basta capire se il corso esiste (delete, update).
 */
exports.findById = (id) => Corso.findByPk(id);

/**
 * findByIdConRelazioni: usato dall'endpoint 10 (dettaglio) e da tutte le
 * risposte di creazione/aggiornamento, dove vogliamo restituire al client
 * il corso completo di sala e iscritti.
 */
exports.findByIdConRelazioni = (id) => Corso.findByPk(id, { include: INCLUDE_STANDARD });

/**
 * Crea un corso. Restituisce l'istanza appena creata (senza include: la
 * rileggiamo poi con findByIdConRelazioni per ottenere sala + iscritti).
 */
exports.create = (dati) => Corso.create(dati);

/**
 * setIscritti(): SOSTITUISCE l'intero insieme di iscritti collegati al corso.
 * E' il metodo generato automaticamente da belongsToMany con l'alias
 * `{ plural: 'Iscritti' }`; internamente Sequelize:
 *   1) legge le righe attuali nella pivot CorsoIscritto per questo corso;
 *   2) calcola diff con l'array passato;
 *   3) esegue INSERT sulle nuove e DELETE su quelle rimosse.
 * Comportamento chiave:
 *   - setIscritti([1,2,3])   => alla fine il corso ha esattamente 1,2,3.
 *   - setIscritti([])        => rimuove TUTTI gli iscritti (0 righe pivot).
 */
exports.setIscritti = (corso, iscrittiIds) => corso.setIscritti(iscrittiIds);

/**
 * save: come per Iscritto, il service ha gia' preparato la patch (whitelist
 * dei campi consentiti). Qui Object.assign sposta i valori sull'istanza e
 * save() genera l'UPDATE.
 */
exports.save = (corso, patch) => {
  Object.assign(corso, patch);
  return corso.save();
};

/**
 * Elimina il corso. Le righe della pivot CorsoIscritto vengono comunque
 * eliminate a cascata (vedi ON DELETE CASCADE in create_tables.sql), ma il
 * service preferisce chiamare esplicitamente setIscritti([]) prima di
 * destroy per rendere l'intento visibile nel codice.
 */
exports.destroy = (corso) => corso.destroy();

/**
 * Endpoint 13: ricerca per nome. Op.like traduce in "LIKE" SQL, con i due
 * '%' che significano "qualsiasi cosa prima/dopo". Su MariaDB, con la
 * collation di default (utf8_general_ci / utf8mb4_unicode_ci), il LIKE e'
 * gia' case-insensitive: quindi 'yoga', 'YOGA' e 'YoGa' matchano lo stesso
 * "Yoga Mattina".
 *
 * Nota sulla sicurezza: `q` viene messa nella stringa `%${q}%`, ma il valore
 * viene comunque parametrizzato (Sequelize usa placeholder ? o :binding),
 * quindi NON c'e' SQL injection. La ricerca massima e' "brute force" sulla
 * colonna nome: per una palestra con qualche decina di corsi va benissimo,
 * per volumi maggiori si aggiungerebbe un indice FULLTEXT.
 */
exports.search = (q) => Corso.findAll({
  where: { nome: { [Op.like]: `%${q}%` } },
  include: INCLUDE_STANDARD,
  order: [['nome', 'ASC']]
});
