-- =====================================================================
-- seed_data.sql
-- Dati di test per il Ristorante.
--
-- ORDINE DEGLI INSERT (coerente con le FK):
--   1) Categoria e Ingrediente  (nessuna FK)
--   2) Piatto                   (usa CategoriaId -> Categoria)
--   3) PiattoIngrediente        (usa PiattoId + IngredienteId)
--
-- Uso id ESPLICITI (INSERT ... (id, ...)) per poterli referenziare nelle FK
-- senza dover leggere gli id auto-generati.
--
-- Copertura per gli endpoint:
--  - endpoint 14 (vegetariani + disponibili): mix di flag; l'Ossobuco e'
--    disponibile=FALSE per verificare che venga escluso.
--  - endpoint 15 (piatti della categoria): ogni categoria ha almeno un piatto.
--  - endpoint 4 (ingredienti allergeni): alcuni sono TRUE (Mozzarella, Uovo,
--    Pecorino, Spaghetti, Salmone, Mascarpone, Farina).
-- =====================================================================

-- --------------------- CATEGORIE (6) ---------------------------------
INSERT INTO Categoria (id, nome, descrizione, ordineMenu) VALUES
(1, 'Antipasti', 'Piatti di apertura', 1),
(2, 'Primi',     'Pasta, riso e zuppe', 2),
(3, 'Secondi',   'Carni e pesci',        3),
(4, 'Contorni',  'Verdure e patate',     4),
(5, 'Dolci',     'Dessert e gelati',     5),
(6, 'Bevande',   'Bibite e vini',        6);

-- --------------------- INGREDIENTI (17) ------------------------------
-- Alcuni sono allergeni comuni (glutine, latte, uova, pesce, frutta secca).
INSERT INTO Ingrediente (id, nome, allergene, unitaMisura) VALUES
(1,  'Pomodoro',        FALSE, 'g'),
(2,  'Mozzarella',      TRUE,  'g'),
(3,  'Basilico',        FALSE, 'g'),
(4,  'Guanciale',       FALSE, 'g'),
(5,  'Uovo',            TRUE,  'pz'),
(6,  'Pecorino',        TRUE,  'g'),
(7,  'Spaghetti',       TRUE,  'g'),
(8,  'Riso',            FALSE, 'g'),
(9,  'Funghi porcini',  FALSE, 'g'),
(10, 'Pollo',           FALSE, 'g'),
(11, 'Salmone',         TRUE,  'g'),
(12, 'Patate',          FALSE, 'g'),
(13, 'Zucchine',        FALSE, 'g'),
(14, 'Mascarpone',      TRUE,  'g'),
(15, 'Caffe',           FALSE, 'ml'),
(16, 'Limone',          FALSE, 'pz'),
(17, 'Farina',          TRUE,  'g');

-- --------------------- PIATTI (13) -----------------------------------
-- Mix di vegetariani/non vegetariani, uno non disponibile per test.
INSERT INTO Piatto (id, nome, descrizione, prezzo, vegetariano, disponibile, CategoriaId) VALUES
(1,  'Bruschetta al pomodoro',   'Pane tostato con pomodoro e basilico',        4.50, TRUE,  TRUE,  1),
(2,  'Caprese',                  'Mozzarella, pomodoro e basilico',             7.00, TRUE,  TRUE,  1),
(3,  'Spaghetti alla Carbonara', 'Guanciale, uova e pecorino',                 11.00, FALSE, TRUE,  2),
(4,  'Spaghetti al pomodoro',    'Sugo di pomodoro fresco e basilico',          8.50, TRUE,  TRUE,  2),
(5,  'Risotto ai funghi',        'Riso arborio con funghi porcini',            12.00, TRUE,  TRUE,  2),
(6,  'Pollo alla griglia',       'Petto di pollo con patate al forno',         13.50, FALSE, TRUE,  3),
(7,  'Salmone al forno',         'Salmone con erbe aromatiche e limone',       16.00, FALSE, TRUE,  3),
(8,  'Patate al forno',          'Patate a spicchi con rosmarino',              4.00, TRUE,  TRUE,  4),
(9,  'Zucchine grigliate',       'Zucchine alla piastra con olio EVO',          4.50, TRUE,  TRUE,  4),
(10, 'Tiramisu',                 'Dolce al cucchiaio con caffe e mascarpone',   5.50, TRUE,  TRUE,  5),
(11, 'Sorbetto al limone',       'Sorbetto rinfrescante al limone',             4.00, TRUE,  TRUE,  5),
(12, 'Ossobuco alla milanese',   'Ossobuco di vitello con gremolada',          17.50, FALSE, FALSE, 3),
(13, 'Insalata di riso',         'Riso con verdure di stagione',                7.50, TRUE,  TRUE,  2);

-- --------------------- ASSOCIAZIONI PIATTO-INGREDIENTE ---------------
INSERT INTO PiattoIngrediente (PiattoId, IngredienteId) VALUES
-- 1 Bruschetta al pomodoro: pomodoro, basilico, farina
(1, 1), (1, 3), (1, 17),
-- 2 Caprese: pomodoro, mozzarella, basilico
(2, 1), (2, 2), (2, 3),
-- 3 Carbonara: spaghetti, guanciale, uovo, pecorino
(3, 7), (3, 4), (3, 5), (3, 6),
-- 4 Spaghetti al pomodoro: spaghetti, pomodoro, basilico
(4, 7), (4, 1), (4, 3),
-- 5 Risotto ai funghi: riso, funghi
(5, 8), (5, 9),
-- 6 Pollo alla griglia: pollo, patate
(6, 10), (6, 12),
-- 7 Salmone al forno: salmone, limone
(7, 11), (7, 16),
-- 8 Patate al forno: patate
(8, 12),
-- 9 Zucchine grigliate: zucchine
(9, 13),
-- 10 Tiramisu: mascarpone, caffe, uovo, farina
(10, 14), (10, 15), (10, 5), (10, 17),
-- 11 Sorbetto al limone: limone
(11, 16),
-- 12 Ossobuco alla milanese: (non disponibile) usa limone
(12, 16),
-- 13 Insalata di riso: riso, zucchine, pomodoro
(13, 8), (13, 13), (13, 1);
