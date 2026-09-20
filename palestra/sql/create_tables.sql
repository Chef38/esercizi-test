-- =====================================================================
-- create_tables.sql
-- Creazione delle tabelle per la Palestra (MariaDB).
--
-- COSA FA QUESTO FILE
--   Crea 4 tabelle: Sale, Iscritti, Corsi, CorsoIscritto (pivot M:N).
--   E' progettato per essere:
--     - eseguibile su un DB PULITO senza modifiche manuali;
--     - IDEMPOTENTE (usa IF NOT EXISTS): rieseguirlo non da' errori.
--
-- ORDINE DI CREAZIONE
--   Le tabelle che sono BERSAGLIO di chiavi esterne devono esistere PRIMA
--   di quelle che le referenziano, altrimenti il DB rifiuta la CREATE per
--   "referenced table does not exist". Ordine corretto:
--     1) Sale       (referenziata da Corsi)
--     2) Iscritti   (referenziata da CorsoIscritto)
--     3) Corsi      (referenzia Sale; referenziata da CorsoIscritto)
--     4) CorsoIscritto (referenzia Corsi e Iscritti)
-- =====================================================================

-- Se si vuole creare anche il database stesso, decommentare le due righe:
-- CREATE DATABASE IF NOT EXISTS palestra CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE palestra;
--
-- L'esercizio non lo richiede espressamente: presume che il DB esista
-- gia' e che ci si connetta a esso (mysql -u root -p palestra < create_tables.sql).

-- ---------------------------------------------------------------------
-- Tabella "Sale" - referenziata dalla FK di Corsi.
-- ---------------------------------------------------------------------
--   id          INT AUTO_INCREMENT PK: il DB assegna un id crescente
--                a ogni INSERT (in Sequelize corrisponde a
--                DataTypes.INTEGER + primaryKey + autoIncrement).
--   nome        VARCHAR(255) UNIQUE NOT NULL: due sale non possono
--                avere lo stesso nome. UNIQUE crea implicitamente un
--                indice sul campo, quindi anche le SELECT per nome
--                sono veloci.
--   piano       INT NOT NULL: 0 = piano terra, 1 = primo, ecc. Non
--                usiamo un CHECK per rifiutare piani negativi perche'
--                puo' esistere il piano interrato (-1); la validazione
--                "sensata" e' delegata al validator applicativo.
--   capienza    INT NOT NULL: numero massimo di persone che la sala
--                ospita fisicamente. Ancora una volta senza CHECK: il
--                validator applicativo garantisce > 0.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Sale (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  nome     VARCHAR(255) NOT NULL UNIQUE,
  piano    INT NOT NULL,
  capienza INT NOT NULL
);

-- ---------------------------------------------------------------------
-- Tabella "Iscritti" - referenziata dalla FK di CorsoIscritto.
-- ---------------------------------------------------------------------
--   email UNIQUE:  garantisce l'unicita' a livello DB. Se un client
--                  prova a inserire un'email duplicata, MariaDB rifiuta
--                  con codice ER_DUP_ENTRY (1062) e Sequelize rilancia
--                  SequelizeUniqueConstraintError, che il nostro
--                  controller intercetta per rispondere 400.
--   dataNascita DATE (non DATETIME): salviamo solo giorno/mese/anno,
--                  senza orario ne' fuso orario. Riduce ambiguita' quando
--                  serializziamo in JSON.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Iscritti (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nome        VARCHAR(255) NOT NULL,
  cognome     VARCHAR(255) NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  dataNascita DATE NOT NULL
);

-- ---------------------------------------------------------------------
-- Tabella "Corsi" - tabella principale del progetto.
-- ---------------------------------------------------------------------
--   descrizione TEXT: fino a 64KB. TEXT (invece di VARCHAR lungo)
--                       e' idiomatico quando il testo puo' variare molto.
--   livello VARCHAR(50): potremmo usare ENUM('base','intermedio','avanzato')
--                       per bloccare valori diversi anche a livello DB, ma
--                       ENUM rende scomodo aggiungere nuovi valori in
--                       futuro (richiede ALTER TABLE). Preferiamo la
--                       validazione applicativa nel validator.
--   prezzoMensile FLOAT: la specifica lo richiede espressamente.
--                       (In un progetto "real world" con calcoli di denaro
--                        useremmo DECIMAL(10,2) per evitare imprecisioni
--                        della virgola mobile IEEE 754.)
--
--   FK SalaId -> Sale(id):
--     ON DELETE RESTRICT: se qualcuno prova a cancellare una sala che
--                         ha corsi collegati, il DB rifiuta l'operazione.
--                         E' la "cintura di sicurezza": anche se il check
--                         applicativo in saleService saltasse per un bug,
--                         il DB non lascerebbe corsi orfani (con SalaId
--                         che punta a un nulla).
--     ON UPDATE CASCADE:  se cambiassimo l'id di una sala (raro con
--                         AUTO_INCREMENT ma teoricamente possibile), i
--                         corsi correlati aggiornerebbero SalaId in
--                         automatico. Utile in operazioni di manutenzione.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Corsi (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nome          VARCHAR(255) NOT NULL,
  descrizione   TEXT,
  livello       VARCHAR(50)  NOT NULL,
  prezzoMensile FLOAT        NOT NULL,
  postiMax      INT          NOT NULL,
  SalaId        INT          NOT NULL,
  CONSTRAINT fk_corso_sala
    FOREIGN KEY (SalaId) REFERENCES Sale(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ---------------------------------------------------------------------
-- Tabella "CorsoIscritto" - pivot per la relazione M:N Corso <-> Iscritto.
-- ---------------------------------------------------------------------
--   PRIMARY KEY COMPOSTA (CorsoId, IscrittoId):
--     garantisce che uno stesso iscritto NON possa essere associato piu'
--     volte allo stesso corso (nessun duplicato nella pivot).
--
--   FK ON DELETE CASCADE su ENTRAMBE le colonne:
--     se cancello un corso, spariscono le righe pivot che lo referenziano;
--     se cancello un iscritto, idem. Cosi' non restano "iscrizioni orfane"
--     che puntano a corsi/iscritti non piu' esistenti.
--     Contrasto con la FK di Corsi.SalaId, che invece e' RESTRICT: la
--     regola di dominio per le sale e' "non puoi cancellare se ha corsi";
--     per la pivot invece "cancella tutto in cascata" e' la scelta
--     corretta (nessuna informazione di valore si perde).
--
--   Perche' NON abbiamo id AUTO_INCREMENT sulla pivot?
--     Perche' la coppia (CorsoId, IscrittoId) e' gia' un'identificazione
--     univoca del legame: un id sintetico sarebbe ridondante e non
--     aggiungerebbe nulla al modello.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS CorsoIscritto (
  CorsoId    INT NOT NULL,
  IscrittoId INT NOT NULL,
  PRIMARY KEY (CorsoId, IscrittoId),
  CONSTRAINT fk_corsoiscritto_corso
    FOREIGN KEY (CorsoId)    REFERENCES Corsi(id)    ON DELETE CASCADE,
  CONSTRAINT fk_corsoiscritto_iscritto
    FOREIGN KEY (IscrittoId) REFERENCES Iscritti(id) ON DELETE CASCADE
);
