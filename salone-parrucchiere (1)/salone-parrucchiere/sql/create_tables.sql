-- =====================================================================
-- create_tables.sql
-- Creazione delle tabelle per il Salone di Parrucchiere (MariaDB)
-- Eseguibile su un database pulito. Usa IF NOT EXISTS per essere ripetibile.
-- =====================================================================

-- Se vuoi creare anche il database, decommenta le due righe seguenti:
-- CREATE DATABASE IF NOT EXISTS salone_parrucchiere CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE salone_parrucchiere;

-- ---------------------------------------------------------------------
-- Tabella principale: Clienti
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Clienti (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  nome           VARCHAR(255) NOT NULL,
  cognome        VARCHAR(255) NOT NULL,
  email          VARCHAR(255) NOT NULL UNIQUE,
  telefono       VARCHAR(255),
  dataNascita    DATE NOT NULL,
  dataIscrizione DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- Tabella secondaria: Servizi
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Servizi (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  nome         VARCHAR(255) NOT NULL UNIQUE,
  descrizione  TEXT,
  prezzo       FLOAT NOT NULL,
  durataMinuti INT NOT NULL
);

-- ---------------------------------------------------------------------
-- Tabella associativa: Prenotazioni
-- Chiave primaria COMPOSTA (ClienteId, ServizioId) + attributi propri.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Prenotazioni (
  ClienteId        INT NOT NULL,
  ServizioId       INT NOT NULL,
  dataAppuntamento DATETIME NOT NULL,
  valutazione      INT,
  PRIMARY KEY (ClienteId, ServizioId),
  CONSTRAINT fk_prenotazione_cliente
    FOREIGN KEY (ClienteId)  REFERENCES Clienti(id)  ON DELETE CASCADE,
  CONSTRAINT fk_prenotazione_servizio
    FOREIGN KEY (ServizioId) REFERENCES Servizi(id)  ON DELETE CASCADE,
  CONSTRAINT chk_valutazione CHECK (valutazione BETWEEN 1 AND 5)
);
