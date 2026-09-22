-- =====================================================================
-- create_tables.sql — Schema del database Ristorante (MariaDB).
--
-- ORDINE DI CREAZIONE (obbligato dalle FK):
--   1) Categoria     (nessuna FK)
--   2) Ingrediente   (nessuna FK)
--   3) Piatto        (FK -> Categoria)
--   4) PiattoIngrediente (FK -> Piatto e Ingrediente)
-- Se inverti l'ordine, MariaDB da' errno 150 "referenced table does not exist".
--
-- IF NOT EXISTS -> lo script si puo' rieseguire senza errore.
-- Le tabelle NON vanno create con sequelize.sync(): la traccia richiede
-- questo script.
-- =====================================================================

CREATE TABLE IF NOT EXISTS Categoria (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  nome         VARCHAR(255) NOT NULL UNIQUE,   -- niente duplicati
  descrizione  TEXT,
  ordineMenu   INT NOT NULL                    -- per ORDER BY in lista
);

CREATE TABLE IF NOT EXISTS Ingrediente (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  nome         VARCHAR(255) NOT NULL UNIQUE,
  allergene    BOOLEAN NOT NULL DEFAULT FALSE, -- BOOLEAN = TINYINT(1) in MariaDB
  unitaMisura  VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS Piatto (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  nome         VARCHAR(255) NOT NULL,
  descrizione  TEXT,
  prezzo       FLOAT NOT NULL,
  vegetariano  BOOLEAN NOT NULL DEFAULT FALSE,
  disponibile  BOOLEAN NOT NULL DEFAULT TRUE,
  CategoriaId  INT NOT NULL,
  -- IMPORTANTE: niente ON DELETE CASCADE qui.
  -- La traccia (endpoint 3) chiede di BLOCCARE la DELETE della categoria se
  -- ci sono piatti associati. Il vincolo di default (RESTRICT) fa cio'.
  CONSTRAINT fk_piatto_categoria
    FOREIGN KEY (CategoriaId) REFERENCES Categoria(id)
);

CREATE TABLE IF NOT EXISTS PiattoIngrediente (
  PiattoId      INT NOT NULL,
  IngredienteId INT NOT NULL,
  -- PK COMPOSTA: impedisce di associare lo stesso ingrediente due volte
  -- allo stesso piatto (INSERT duplicato -> errore).
  PRIMARY KEY (PiattoId, IngredienteId),
  -- ON DELETE CASCADE OK qui: se elimini un piatto/ingrediente,
  -- le righe di associazione spariscono automaticamente. Nessun orfano.
  CONSTRAINT fk_pi_piatto
    FOREIGN KEY (PiattoId)      REFERENCES Piatto(id)      ON DELETE CASCADE,
  CONSTRAINT fk_pi_ingrediente
    FOREIGN KEY (IngredienteId) REFERENCES Ingrediente(id) ON DELETE CASCADE
);
