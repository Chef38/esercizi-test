# Note per l'esame — memo pratico

File di studio personale, **non fa parte della consegna**.
Rileggerlo prima della prova e tenerlo aperto durante lo svolgimento.

---

## 1. Prima di scrivere una riga di codice

- Leggere **tutta** la traccia due volte.
- Sottolineare/segnare:
  - Numero esatto di endpoint richiesti.
  - Funzioni SQL obbligatorie (CONCAT, DATE_FORMAT, TIMESTAMPDIFF, FLOOR, MOD, FORMAT, COUNT, SUM, AVG, ROUND, LIKE...).
  - **Messaggi di errore letterali** (es. "Cliente non trovato.", "Parametro di ricerca 'q' obbligatorio.") — vanno copiati carattere per carattere, punto e maiuscole comprese.
  - Codici HTTP richiesti (200 / 400 / 404).
  - Se la tabella pivot ha attributi propri o è pivot pura.
  - Tipi dei campi (DATE vs DATETIME, INTEGER vs FLOAT).

---

## 2. Workflow: come riusare i vecchi esercizi

1. **Copiare** una cartella di esercizio già funzionante (es. `salone-parrucchiere` o `biblioteca`) e rinominarla — mai partire da zero.
2. Modificare **un livello per volta**, testando dopo ognuno:
   1. `.env` → nome DB nuovo.
   2. `sql/create_tables.sql` + `sql/seed_data.sql` → eseguirli **subito** su HeidiSQL/DBeaver, verificare che le tabelle e i dati ci siano.
   3. `models/` (una tabella = un file) + `models/index.js` per le associazioni.
   4. `server.js` → `npm start`. Deve stampare "Connessione al database riuscita.". Se non parte qui, il problema è nei modelli o nella connessione, **non nelle rotte**.
   5. `routes/` + `controllers/` **uno alla volta**, testando ogni endpoint su Postman **prima** di passare al successivo.
3. **Collection Postman**: modificare quella vecchia, non farla da zero. Cambiare solo URL e query string.

---

## 3. Trappole classiche (le più costose)

### Ordine delle rotte
Rotte statiche (`/ricerca`, `/search`, `/disponibili`) **sempre prima** di `/:id`, altrimenti Express intercetta il segmento statico come valore del parametro.

```js
router.get('/', ...);         // OK
router.get('/ricerca', ...);  // OK, prima di /:id
router.get('/:id', ...);      // OK, per ultimo
```

### Tabella pivot con attributi propri (es. Prenotazione)
DEVE essere un modello Sequelize a parte, passato come `through: Prenotazione` esplicito. Se la si lascia implicita non si possono leggere `dataAppuntamento`/`valutazione`.

```js
Cliente.belongsToMany(Servizio, { through: Prenotazione });
Servizio.belongsToMany(Cliente, { through: Prenotazione });
```

### fn vs col vs literal
- `fn('CONCAT', col('x'), ' ', col('y'))` → funzione SQL semplice con colonne (Sequelize fa l'escape).
- `col('nome')` → riferimento sicuro a una colonna.
- `literal("CONCAT(FLOOR(x/60), 'h ', MOD(x,60), 'min')")` → SQL grezzo per espressioni libere (FLOOR/MOD/FORMAT/CASE). **Solo con stringhe che scrivi tu, mai con input utente**.
- `literal('YEAR')` obbligatorio dentro `TIMESTAMPDIFF`: YEAR è una keyword, non una stringa.

### `bigIntAsNumber: true` nel config
`COUNT`/`SUM` in MariaDB tornano come `BIGINT` → il driver li restituisce come `BigInt` JS → `JSON.stringify` **crasha**. Con questa opzione tornano numeri normali.
**Domanda tipica dell'orale**: perché serve? → risposta sopra.

### Ordine in `server.js`
`require('dotenv').config()` DEVE essere la **prima riga**, altrimenti il file `config/database.js` legge `process.env` vuoti e la connessione fallisce.

### `Op.like`
MariaDB con collation `utf8mb4_unicode_ci` è già case-insensitive di default. Se il DB è configurato diversamente (es. `utf8mb4_bin`), usare `LOWER()` su entrambi i lati.

### 404 vs 400
- **404** = risorsa cercata non esiste (id inesistente).
- **400** = parametro obbligatorio mancante (es. `?q=` non fornito).
Non confonderli.

### LEFT JOIN vs INNER JOIN
Nelle classifiche/statistiche: **LEFT JOIN** dalla tabella principale (Servizio) alla pivot (Prenotazione), così compaiono anche i servizi con **0 prenotazioni**.

---

## 4. Cheat-sheet delle funzioni SQL più chieste

| Funzione | Uso | Esempio |
|----------|-----|---------|
| `CONCAT(a, ' ', b)` | Unire stringhe | Nome completo |
| `DATE_FORMAT(data, '%d/%m/%Y')` | Formattare data | Data leggibile |
| `TIMESTAMPDIFF(YEAR, dataNascita, NOW())` | Differenza in anni | Età |
| `FLOOR(minuti/60)` + `MOD(minuti, 60)` | Divisione intera + resto | Ore/minuti |
| `FORMAT(numero, 2)` | 2 decimali | Prezzo |
| `COUNT(col)` | Conteggio (ignora NULL) | Numero prenotazioni |
| `SUM(col)` | Somma | Incasso totale |
| `AVG(col)` | Media | Valutazione media |
| `ROUND(valore, 1)` | Arrotonda a N decimali | Media a 1 decimale |
| `LIKE '%q%'` | Ricerca testuale | Case-insensitive con `utf8mb4_unicode_ci` |

---

## 5. Domande tipiche dell'orale (preparare risposte a voce)

1. **Perché `Prenotazione` è un modello e non una pivot implicita?**
   → Perché ha attributi propri (`dataAppuntamento`, `valutazione`) oltre alle due FK. Con la pivot implicita Sequelize creerebbe la tabella con solo le due chiavi e non potremmo leggere quei campi tramite `through: { attributes: [...] }`.

2. **Differenza tra `fn`, `col` e `literal`?**
   → `fn` chiama una funzione SQL con argomenti gestiti da Sequelize; `col` è un riferimento sicuro a una colonna; `literal` è SQL grezzo, usato quando servono espressioni non esprimibili con `fn` (FLOOR, MOD, CASE...). `literal` non va mai usato con input utente perché non fa escape.

3. **Perché `/ricerca` prima di `/:id`?**
   → Express valuta le rotte nell'ordine di dichiarazione. Se `/:id` è prima, una richiesta a `/api/clienti/ricerca` matcha `/:id` con `id = "ricerca"` e la rotta di ricerca non viene mai raggiunta.

4. **Cos'è `bigIntAsNumber: true`?**
   → Opzione del driver `mariadb`. Le funzioni di aggregazione (COUNT/SUM) restituiscono BIGINT, che il driver di default converte in `BigInt` JavaScript. `BigInt` non è serializzabile con `JSON.stringify`, quindi la risposta HTTP crasherebbe. Con questa opzione tornano come normali `Number`.

5. **Perché `app.js` è separato da `server.js`?**
   → `app.js` costruisce ed esporta l'app Express senza aprire alcuna porta. `server.js` importa `app`, verifica la connessione al DB e chiama `app.listen`. Il vantaggio: `app` può essere importato nei test senza avviare il server.

6. **Perché LEFT JOIN nell'endpoint statistiche?**
   → Per includere nella classifica anche i servizi con 0 prenotazioni. Con INNER JOIN sarebbero esclusi.

7. **Cosa restituisce `TIMESTAMPDIFF(YEAR, dataNascita, NOW())`?**
   → La differenza in anni interi tra due date. Restituisce l'età anagrafica (gestisce correttamente il caso in cui il compleanno di quest'anno non sia ancora passato).

8. **Perché niente `sequelize.sync()`?**
   → Le tabelle sono create dagli script SQL come richiesto dalla traccia. `sync()` genererebbe uno schema alternativo che potrebbe non combaciare (nomi tabelle, vincoli CHECK, PK composta). Ci limitiamo ad `authenticate()`.

---

## 6. Regola d'oro

Se copi codice da un vecchio esercizio, **rileggi ogni riga e chiediti "perché è così"**.
Il prof sa che riusi materiale — quello che valuta è se capisci cosa hai copiato.
La nota nella traccia lo dice esplicitamente: *"Il docente si riserva di richiedere la spiegazione di qualsiasi parte del materiale consegnato."*
