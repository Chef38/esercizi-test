-- =====================================================================
-- seed_data.sql
-- Dati di test per il Salone di Parrucchiere.
-- Requisiti: >=10 clienti, 6 servizi, >=20 prenotazioni con date/voti vari.
-- NB: la coppia (ClienteId, ServizioId) e' chiave primaria => niente duplicati.
-- =====================================================================

-- ------------------------- CLIENTI (10) -------------------------------
INSERT INTO Clienti (nome, cognome, email, telefono, dataNascita, dataIscrizione) VALUES
('Mario',     'Rossi',    'mario.rossi@email.it',      '3401112233', '1985-04-12', '2024-01-15 09:00:00'),
('Laura',     'Bianchi',  'laura.bianchi@email.it',    '3402223344', '1990-07-22', '2024-02-10 10:30:00'),
('Giulia',    'Rossetti', 'giulia.rossetti@email.it',  '3403334455', '1978-11-03', '2024-01-20 14:00:00'),
('Marco',     'Verdi',    'marco.verdi@email.it',      '3404445566', '1995-02-28', '2024-03-05 11:15:00'),
('Anna',      'Ferrari',  'anna.ferrari@email.it',     '3405556677', '1988-09-15', '2024-02-25 16:45:00'),
('Luca',      'Esposito', 'luca.esposito@email.it',    NULL,         '1992-05-30', '2024-04-01 09:30:00'),
('Sara',      'Romano',   'sara.romano@email.it',      '3407778899', '1983-12-08', '2024-03-18 13:20:00'),
('Davide',    'Colombo',  'davide.colombo@email.it',   '3408889900', '2000-03-17', '2024-05-10 10:00:00'),
('Chiara',    'Ricci',    'chiara.ricci@email.it',     '3409990011', '1975-06-25', '2024-04-22 15:30:00'),
('Francesco', 'Marino',   'francesco.marino@email.it', '3401234567', '1998-10-11', '2024-06-01 11:45:00');

-- ------------------------- SERVIZI (6) --------------------------------
INSERT INTO Servizi (nome, descrizione, prezzo, durataMinuti) VALUES
('Taglio Donna', 'Taglio e styling per donna',            25.00,  30),
('Taglio Uomo',  'Taglio classico o moderno per uomo',    15.00,  20),
('Colore',       'Colorazione completa',                  55.00,  90),
('Piega',        'Piega e messa in piega',                20.00,  25),
('Shampoo',      'Lavaggio e trattamento',                 8.00,  15),
('Meches',       'Schiariture e colpi di sole',           75.00, 120);

-- --------------------- PRENOTAZIONI (24) ------------------------------
-- Ogni coppia (ClienteId, ServizioId) e' unica. Alcune valutazioni sono NULL.
INSERT INTO Prenotazioni (ClienteId, ServizioId, dataAppuntamento, valutazione) VALUES
(1, 1, '2025-01-10 10:00:00', 5),
(1, 3, '2025-02-15 14:30:00', 4),
(1, 5, '2025-03-01 09:00:00', 5),
(2, 2, '2025-01-12 11:00:00', 4),
(2, 4, '2025-02-20 16:00:00', 3),
(3, 1, '2025-01-15 10:30:00', 5),
(3, 3, '2025-02-10 15:00:00', 4),
(3, 6, '2025-03-05 13:00:00', 5),
(4, 2, '2025-01-20 09:30:00', 2),
(4, 5, '2025-02-25 10:00:00', 4),
(5, 1, '2025-02-05 10:00:00', 3),
(5, 3, '2025-01-25 14:00:00', 5),
(5, 4, '2025-03-10 11:30:00', 4),
(6, 2, '2025-03-12 09:00:00', 4),
(6, 6, '2025-01-30 13:30:00', 5),
(7, 1, '2025-02-01 10:00:00', 5),
(7, 4, '2025-03-15 16:30:00', NULL),
(8, 3, '2025-02-08 14:00:00', 4),
(8, 5, '2025-03-18 09:30:00', 5),
(9, 2, '2025-02-12 11:00:00', 3),
(9, 6, '2025-03-20 13:00:00', 5),
(10, 1, '2025-02-18 10:30:00', 4),
(10, 3, '2025-03-25 14:30:00', NULL),
(10, 4, '2025-03-22 15:00:00', 4);
