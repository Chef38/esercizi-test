-- =====================================================================
-- seed_data.sql
-- Dati di test per la Palestra.
-- Requisiti da specifica:
--   >= 4 sale (piani/capienze diversi)
--   >= 10 corsi (livelli e prezzi variati, distribuiti fra le sale)
--   >= 15 iscritti
--   ogni corso ha almeno un iscritto, alcuni corsi al completo (per testare
--   l'endpoint 14 "disponibili") e alcuni iscritti in piu' corsi contemporaneamente.
-- La coppia (CorsoId, IscrittoId) e' chiave primaria => nessun duplicato.
-- =====================================================================

-- --------------------------- SALE (4) ---------------------------------
INSERT INTO Sale (nome, piano, capienza) VALUES
('Sala Grande',   0, 40),
('Sala Pesi',     0, 25),
('Sala Corsi 1',  1, 20),
('Sala Yoga',     2, 15);

-- --------------------------- CORSI (10) -------------------------------
-- postiMax scelto in modo che con le associazioni sotto:
--   Yoga Sera (id 3)  -> 10/10  (AL COMPLETO)
--   CrossFit  (id 5)  -> 12/12  (AL COMPLETO)
--   Boxe      (id 8)  -> 10/10  (AL COMPLETO)
-- gli altri 7 corsi hanno posti disponibili => endpoint 14 ne restituisce 7.
INSERT INTO Corsi (nome, descrizione, livello, prezzoMensile, postiMax, SalaId) VALUES
('Spinning',      'Cardio ad alta intensita su cyclette indoor.', 'base',       40.00, 15, 1),
('Yoga Mattina',  'Sequenze dolci per iniziare la giornata.',     'base',       30.00, 12, 4),
('Yoga Sera',     'Vinyasa flow con focus sulla respirazione.',   'intermedio', 35.00, 10, 4),
('Functional',    'Allenamento a corpo libero e piccoli attrezzi.', 'intermedio', 45.00, 20, 1),
('CrossFit',      'Circuiti WOD ad alta intensita.',              'avanzato',   60.00, 12, 2),
('Pilates',       'Postura, core stability e mobilita.',          'base',       35.00, 15, 3),
('Zumba',         'Fitness a ritmo di musica latino-americana.',  'base',       30.00, 25, 1),
('Boxe',          'Tecnica pugilistica e sparring leggero.',      'avanzato',   55.00, 10, 2),
('Total Body',    'Tonificazione muscolare a tutto il corpo.',    'intermedio', 40.00, 18, 3),
('Stretching',    'Allungamento muscolare e mobilita articolare.', 'base',      25.00, 12, 4);

-- ------------------------- ISCRITTI (15) ------------------------------
INSERT INTO Iscritti (nome, cognome, email, dataNascita) VALUES
('Mario',       'Rossi',     'mario.rossi@email.it',       '1985-04-12'),
('Laura',       'Bianchi',   'laura.bianchi@email.it',     '1990-07-22'),
('Giulia',      'Rossetti',  'giulia.rossetti@email.it',   '1978-11-03'),
('Marco',       'Verdi',     'marco.verdi@email.it',       '1995-02-28'),
('Anna',        'Ferrari',   'anna.ferrari@email.it',      '1988-09-15'),
('Luca',        'Esposito',  'luca.esposito@email.it',     '1992-05-30'),
('Sara',        'Romano',    'sara.romano@email.it',       '1983-12-08'),
('Davide',      'Colombo',   'davide.colombo@email.it',    '2000-03-17'),
('Chiara',      'Ricci',     'chiara.ricci@email.it',      '1975-06-25'),
('Francesco',   'Marino',    'francesco.marino@email.it',  '1998-10-11'),
('Elena',       'Greco',     'elena.greco@email.it',       '1993-08-04'),
('Alessandro',  'Rizzo',     'alessandro.rizzo@email.it',  '1987-01-19'),
('Silvia',      'Conti',     'silvia.conti@email.it',      '1996-11-27'),
('Matteo',      'Bruno',     'matteo.bruno@email.it',      '1991-04-06'),
('Federica',    'Costa',     'federica.costa@email.it',    '1999-07-13');

-- --------------------- CORSOISCRITTO (associazioni) -------------------
-- Layout (colonne = iscritti 1..15, righe = corsi 1..10). X = iscritto al corso.
--
-- Corso 1 (Spinning     postiMax 15): 1,2,3,4,5                          -> 5/15
-- Corso 2 (Yoga Mattina postiMax 12): 1,6,7,8                            -> 4/12
-- Corso 3 (Yoga Sera    postiMax 10): 1,2,3,4,5,6,7,8,9,10               -> 10/10 COMPLETO
-- Corso 4 (Functional   postiMax 20): 1,11,12,13,14,15                   -> 6/20
-- Corso 5 (CrossFit     postiMax 12): 1,2,3,4,5,6,7,8,9,10,11,12         -> 12/12 COMPLETO
-- Corso 6 (Pilates      postiMax 15): 13,14,15                           -> 3/15
-- Corso 7 (Zumba        postiMax 25): 1,6,11,15                          -> 4/25
-- Corso 8 (Boxe         postiMax 10): 1,2,3,4,5,11,12,13,14,15           -> 10/10 COMPLETO
-- Corso 9 (Total Body   postiMax 18): 2,3,7,8,12                         -> 5/18
-- Corso 10(Stretching   postiMax 12): 6,9,10,14                          -> 4/12
--
-- L'iscritto 1 (Mario Rossi) frequenta 7 corsi in parallelo -> caso "molti corsi per un iscritto".
INSERT INTO CorsoIscritto (CorsoId, IscrittoId) VALUES
-- Spinning
(1,1),(1,2),(1,3),(1,4),(1,5),
-- Yoga Mattina
(2,1),(2,6),(2,7),(2,8),
-- Yoga Sera (COMPLETO)
(3,1),(3,2),(3,3),(3,4),(3,5),(3,6),(3,7),(3,8),(3,9),(3,10),
-- Functional
(4,1),(4,11),(4,12),(4,13),(4,14),(4,15),
-- CrossFit (COMPLETO)
(5,1),(5,2),(5,3),(5,4),(5,5),(5,6),(5,7),(5,8),(5,9),(5,10),(5,11),(5,12),
-- Pilates
(6,13),(6,14),(6,15),
-- Zumba
(7,1),(7,6),(7,11),(7,15),
-- Boxe (COMPLETO)
(8,1),(8,2),(8,3),(8,4),(8,5),(8,11),(8,12),(8,13),(8,14),(8,15),
-- Total Body
(9,2),(9,3),(9,7),(9,8),(9,12),
-- Stretching
(10,6),(10,9),(10,10),(10,14);
