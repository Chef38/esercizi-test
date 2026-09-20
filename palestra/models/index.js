/**
 * models/index.js - Il "barrel" dei modelli + definizione delle ASSOCIAZIONI.
 *
 * Perche' un file dedicato per le associazioni?
 *   Le associazioni Sequelize devono essere dichiarate DOPO che tutti i
 *   modelli sono stati importati. Se le mettessimo dentro Corso.js e Sala.js
 *   si creerebbero dipendenze circolari (Corso importa Sala, Sala importa
 *   Corso), che portano a runtime error del tipo "Cannot read property
 *   'hasMany' of undefined". Un unico file "orchestratore" risolve il
 *   problema: importa tutti i modelli e li collega qui.
 *
 * Cosa esporta questo file:
 *   { sequelize, Sala, Corso, Iscritto }
 * In tutti i controller/service/repository importiamo da qui, MAI
 * direttamente dal file del singolo modello: cosi' siamo certi che le
 * associazioni siano gia' state stabilite quando arriva la prima query.
 */
const sequelize = require('../config/database');
const Sala = require('./Sala');
const Corso = require('./Corso');
const Iscritto = require('./Iscritto');

/* =====================================================================
 * 1) RELAZIONE MOLTI-A-UNO fra Corso e Sala.
 *
 *    Logica di dominio: "un corso appartiene a UNA sala, una sala ospita
 *    MOLTI corsi". In SQL si realizza con una FK dalla parte "molti":
 *    Corsi.SalaId -> Sale.id.
 *
 *    In Sequelize la relazione va dichiarata su ENTRAMBI i lati, altrimenti
 *    i metodi generati (corso.getSala(), sala.getCorsi()) e le opzioni
 *    `include` nelle query funzionano solo in una direzione.
 *
 *    Opzioni usate:
 *      foreignKey: 'SalaId'  -> nome della colonna nella tabella Corsi
 *                               che punta a Sale.id. Combacia con quello
 *                               dichiarato nel modello Corso.
 *      as: 'Corsi'           -> ALIAS del lato "molti". Senza questa opzione
 *                               Sequelize userebbe la pluralizzazione inglese
 *                               'Corsos' e i metodi/proprieta' generati
 *                               diventerebbero: sala.getCorsos(), sala.Corsos.
 *                               Preferiamo il plurale italiano corretto:
 *                               sala.getCorsi(), sala.Corsi.
 *
 *    Metodi generati (usati dai repository):
 *      sala.getCorsi()       -> SELECT dei corsi della sala
 *      sala.setCorsi([ids])  -> aggiorna in blocco la SalaId dei corsi
 *      corso.getSala()       -> SELECT della sala del corso
 *      corso.setSala(sala)   -> aggiorna corso.SalaId
 * ===================================================================== */
Sala.hasMany(Corso, { foreignKey: 'SalaId', as: 'Corsi' });
Corso.belongsTo(Sala, { foreignKey: 'SalaId' }); // lato "uno": singular = 'Sala' (gia' corretto)

/* =====================================================================
 * 2) RELAZIONE MOLTI-A-MOLTI fra Corso e Iscritto.
 *
 *    Un iscritto puo' frequentare piu' corsi; un corso puo' avere molti
 *    iscritti. In SQL una N:N si realizza SEMPRE con una tabella
 *    associativa (pivot) che contiene le coppie di FK.
 *
 *    through: 'CorsoIscritto'
 *      Passiamo il NOME della tabella pivot come STRINGA (non un modello),
 *      perche' la nostra pivot NON ha attributi propri: e' composta solo
 *      da CorsoId e IscrittoId. Sequelize creera' internamente un modello
 *      "leggero" per la pivot e ne gestira' il ciclo di vita.
 *      (Se domani volessimo aggiungere un campo come `dataIscrizioneCorso`
 *       la pivot dovrebbe diventare un modello a se' stante, come nel
 *       progetto salone-parrucchiere.)
 *
 *    foreignKey / otherKey:
 *      Espliciti anche se prevedibili. `foreignKey` identifica il lato
 *      "dichiarante" (in Corso.belongsToMany(Iscritto,...) il lato Corso),
 *      `otherKey` l'altro. Renderli espliciti evita ambiguita' quando in
 *      futuro qualcuno rinomina un modello.
 *
 *    as: { singular, plural }
 *      Forziamo i nomi generati a essere in italiano corretto. Senza
 *      questa opzione avremmo: corso.setIscrittos(), corso.Iscrittos, che
 *      e' un mix di italiano e inglese poco leggibile. Con l'alias:
 *          corso.getIscritti()       property: corso.Iscritti
 *          corso.setIscritti([ids])  (SOSTITUISCE l'insieme di iscritti)
 *          corso.addIscritto(id)     (aggiunge una singola riga pivot)
 *          corso.addIscritti([ids])  (aggiunge piu' righe)
 *          corso.removeIscritto(id)
 *          corso.hasIscritto(id)
 *          corso.countIscritti()
 *      Simmetrico dall'altro lato: iscritto.getCorsi(), iscritto.Corsi, ecc.
 *
 *    Uso pratico nel progetto:
 *      - Nelle query con `include: [{ model: Iscritto, as: 'Iscritti', ... }]`
 *        (l'`as` va SEMPRE ripetuto quando l'associazione ha un alias,
 *         altrimenti Sequelize solleva l'errore "You must use the 'as' keyword").
 *      - Nel service endpoint 14 accediamo a `c.Iscritti.length`.
 *      - Nel repository chiamiamo `corso.setIscritti(iscrittiIds)`.
 * ===================================================================== */
Corso.belongsToMany(Iscritto, {
  through: 'CorsoIscritto',
  foreignKey: 'CorsoId',
  otherKey: 'IscrittoId',
  as: { singular: 'Iscritto', plural: 'Iscritti' }
});
Iscritto.belongsToMany(Corso, {
  through: 'CorsoIscritto',
  foreignKey: 'IscrittoId',
  otherKey: 'CorsoId',
  as: { singular: 'Corso', plural: 'Corsi' }
});

/*
 * Esportazione centralizzata: chi scrive
 *   const { Corso, Sala, Iscritto } = require('./models');
 * riceve i modelli GIA' collegati fra loro.
 */
module.exports = { sequelize, Sala, Corso, Iscritto };
