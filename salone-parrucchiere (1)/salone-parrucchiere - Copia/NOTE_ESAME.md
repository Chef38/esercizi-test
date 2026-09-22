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

---

## 7. Workflow d'esame — adattare questo progetto in ~2 ore

Traccia tipica: 3 tabelle (1 principale + 2 correlate, di cui una 1:N e una N:N),
CRUD su tutte, ~15 endpoint con 2-3 endpoint di "ricerca". Questo progetto
(Ristorante: Categoria, Piatto, Ingrediente) è il template. Da adattare così:

### Passo 0 — Prima di toccare tastiera (10 min)
1. Leggi **due volte** la traccia. Sottolinea:
   - Nomi esatti delle 3 tabelle e dei campi (attenzione ai tipi: FLOAT vs
     DECIMAL, DATE vs DATETIME, BOOLEAN vs INT).
   - Numero di endpoint richiesti.
   - **Messaggi di errore letterali** (vanno copiati carattere per carattere).
   - Codici HTTP richiesti (200/201/204/400/404).
   - Se la pivot ha attributi propri o è pivot pura.
2. Disegna il diagramma ER su carta con FK e cardinalità.

### Passo 1 — Copia e rinomina (2 min)
1. Copia la cartella `salone-parrucchiere - Copia` in `<nuovo-dominio>`.
2. Rinomina i file dei modelli/servizi/controller/routes con i nomi nuovi:
   - `Piatto.js` → `<Entita1>.js` (tabella principale)
   - `Categoria.js` → `<Entita2>.js` (lato "1" della N:1)
   - `Ingrediente.js` → `<Entita3>.js` (lato N:N)
   - `PiattoIngrediente.js` → `<Entita1><Entita3>.js` (pivot)

### Passo 2 — Configurazione (3 min)
- Modifica `.env`: `DB_NAME=<nuovo_nome_db>`.
- Crea il DB vuoto in HeidiSQL/DBeaver.

### Passo 3 — SQL (15 min) — testa SUBITO
1. Riscrivi `sql/create_tables.sql`:
   - Cambia solo nomi tabelle e colonne, mantieni la struttura.
   - **Ordine tabelle**: prima quelle senza FK, poi la principale, infine la pivot.
   - Ricorda ON DELETE CASCADE **solo** sulla pivot.
2. Riscrivi `sql/seed_data.sql` con dati coerenti:
   - Almeno 5-6 righe per la tabella con lato "1".
   - Almeno 12-15 righe per la principale con MIX di flag booleani
     (indispensabile per gli endpoint di filtro).
   - Righe di associazione nella pivot: ogni riga principale ha almeno una
     associazione, alcune associazioni condivise.
3. **Esegui i due script su HeidiSQL. Se falliscono qui, sistemi qui, non
   dopo.**

### Passo 4 — Modelli (15 min)
Per ogni modello:
- Cambia solo `sequelize.define('NomeNuovo', {...})`, `tableName`, i nomi dei campi.
- Mantieni la logica di `id/autoIncrement/allowNull/unique/defaultValue`.

In `models/index.js`:
- Sostituisci `Categoria/Piatto/Ingrediente/PiattoIngrediente` con i nomi nuovi.
- **Non toccare** la struttura di `hasMany/belongsTo/belongsToMany`.
- Cambia gli `as: 'piatti'` con l'alias italiano che corrisponde al nuovo dominio.

**Test intermedio**: `npm start`. Deve stampare "Connessione al database
riuscita.". Se non parte, il bug è qui, non nelle rotte.

### Passo 5 — Services (30 min)
Ricopia i tre file, cambia:
- I `require('../models')` per importare i nuovi nomi.
- I nomi dei metodi generati da Sequelize: `piatto.setIngredienti(...)` diventa
  `<entita1>.set<Entita3>(...)` (Sequelize genera il metodo dal nome).
- Le `where` clause con i nomi delle nuove FK.

Se la pivot ha attributi propri (es. `quantita`), aggiungili al modello E al
`through: { attributes: ['quantita'] }` negli include.

### Passo 6 — Controllers (20 min)
Ricopia, cambia solo:
- Nome del service richiesto in cima.
- Messaggi di errore (usa quelli letterali della traccia).
- Campi validati nei POST/PUT.

**Attenzione**: se un campo obbligatorio è numerico o booleano usa
`campo === undefined`, **non** `!campo` (0 e false sono validi).

### Passo 7 — Routes (10 min)
Ricopia, cambia solo:
- Nome del controller richiesto in cima.
- Rotte statiche personalizzate (es. `/senza-allergeni`).
- **VERIFICA**: rotte statiche PRIMA di `/:id`. Sempre.

Aggiorna `app.js` con i tre `app.use('/api/...', router)` nuovi.

### Passo 8 — Test con Postman (20 min)
Ricopia la collection Postman, cambia solo:
- Il nome della collection.
- Gli URL delle richieste.
- I body JSON con dati coerenti col nuovo dominio.

Testa **uno alla volta**, in ordine:
1. GET lista (deve tornare i dati del seed).
2. GET dettaglio con id esistente e id inesistente (200 vs 404).
3. POST con body valido e body senza campi obbligatori (201 vs 400).
4. POST con FK inesistente (404).
5. PUT partial update.
6. DELETE (204) e DELETE su id inesistente (404).
7. GET ricerca senza `?q=` (400) e con match/no-match.

### Passo 9 — Prima di consegnare (5 min)
- **Rileggi ogni messaggio d'errore**: deve corrispondere ESATTAMENTE alla
  traccia (punti, apostrofi, maiuscole).
- Verifica di aver esposto **il numero esatto** di endpoint richiesti.
- `npm start` un'ultima volta.
- Consegna: sorgente + `sql/` + collection Postman.

---

## 8. Mappa "cosa cambia" tra un esercizio e l'altro

| Parte del progetto      | Cosa cambia sempre        | Cosa NON cambia (quasi) mai       |
|-------------------------|---------------------------|-----------------------------------|
| `.env`                  | `DB_NAME`                 | Tutto il resto                    |
| `config/database.js`    | Niente                    | Tutto (opzioni driver)            |
| `server.js` / `app.js`  | Prefissi `/api/...`       | Struttura                         |
| `models/*.js`           | Nome modello, campi       | Tipi Sequelize, opzioni tabella   |
| `models/index.js`       | Nomi modelli, alias `as`  | Tipo di associazione (has/belongsTo/belongsToMany) |
| `services/*.js`         | Nomi modelli, campi where | Struttura funzioni, gestione errori |
| `controllers/*.js`      | Nome service, messaggi    | try/catch, status HTTP            |
| `routes/*.js`           | Nome controller, rotte statiche extra | Ordine (statiche prima di :id) |
| `sql/create_tables.sql` | Nomi tabelle, colonne     | Ordine di CREATE, uso di IF NOT EXISTS |
| `sql/seed_data.sql`     | Tutto il contenuto        | Ordine INSERT (rispetta FK)       |
| `postman/*.json`        | URL e body                | Struttura JSON di Postman         |

---

## 9. Errori tipici da schivare

1. **Ordine rotte**: `/:id` prima di rotte statiche → chi vince è `:id` sempre.
2. **`!prezzo` per validare un numero**: 0 è falsy → passa come "mancante".
3. **Dimenticare `express.json()`**: `req.body` sarà `undefined` in ogni POST/PUT.
4. **`dotenv.config()` non in prima riga di server.js**: connessione DB con
   `process.env.DB_USER === undefined`.
5. **Pivot senza `through: { attributes: [] }`** nell'include: il JSON di
   risposta include i campi tecnici della pivot su ogni riga.
6. **ON DELETE CASCADE sulla FK verso la tabella "lato 1"**: se la traccia
   chiede di bloccare la DELETE, il CASCADE la fa comunque passare.
7. **Sequelize `sync()` in produzione**: sovrascrive/genera schemi diversi dal
   SQL richiesto → la traccia specifica di non usarlo.
8. **Aggiornare la pivot manualmente**: usa `set<Entita>(...)`, evita bug.
9. **`through: 'NomeStringa'`** invece del modello importato: crea pivot
   implicita e perdi il controllo sulle sue colonne.
10. **Committare `.env`**: contiene le password. Verifica `.gitignore`.

---

## 10. Consigli pratici — cosa fare all'esame

In ordine di impatto sul voto.

### Prima dell'esame

1. **Fai il progetto da zero almeno una volta senza copiare**. Anche se poi riparti
   da un template, aver scritto tu ogni riga almeno una volta ti fa distinguere
   subito cosa e' "boilerplate" da cosa devi personalizzare.
2. **Impara a leggere gli errori piu' comuni**. I 3 che vedrai sicuro:
   - `Unknown column 'X' in field list` -> nome sbagliato nel modello o nell'include.
   - `errno 150` / `foreign key constraint fails` -> ordine di CREATE o INSERT sbagliato.
   - `Cannot set headers after they are sent` -> manca un `return` prima di `res.send()`.
3. **Ripassa a voce le 8 domande orali della sezione 5**. Se le sai a occhi chiusi,
   l'orale dura 5 minuti.

### Durante l'esame — gestione del tempo

4. **Non partire dai modelli, parti dal SQL**. Se le tabelle non si creano, tutto
   il resto crolla. Il seed ti fa vedere subito se la struttura e' coerente.
5. **Testa dopo OGNI endpoint, non alla fine**. Un endpoint rotto trovato subito
   costa 2 minuti; trovato alla fine costa 30 minuti perche' non sai dove guardare.
6. **Non abbellire**: niente librerie di validazione extra, niente async wrapper
   fancy, niente logger custom. Il tempo speso ad abbellire e' tempo tolto ai bug.
7. **Se un endpoint non funziona dopo 15 minuti**, saltalo, fai gli altri, torna
   alla fine. Meglio 14/15 endpoint funzionanti che 15 quasi-funzionanti.

### Trucchi che valgono punti

8. **Copia i messaggi d'errore ESATTAMENTE dalla traccia** (punti, apostrofi,
   maiuscole comprese). E' il modo piu' veloce per vincere/perdere 1 punto.
9. **`through: { attributes: [] }`** su ogni include con belongsToMany. E' la cosa
   piu' dimenticata, il prof la cerca.
10. **Order by esplicito** sulle liste. La traccia spesso dice "ordinate per X"
    ed e' un check binario.
11. **`ON DELETE CASCADE` SOLO sulla pivot**. Sull'altra FK MAI, o le regole di
    business (blocco delete) diventano impossibili senza hack.

### Durante l'orale

12. **Quando il prof chiede "perche'"**, rispondi con la coppia problema → soluzione:
    "Se non lo facessi succederebbe X, per questo scrivo Y". Non elencare cosa fa
    il codice: il prof lo vede.
13. **Se non sai una cosa, dilla**. "Non ho testato quel caso, ma se dovessi farlo
    controllerei X." Vale molto piu' di improvvisare.
14. **Prepara 2-3 punti "avanzati" da tirare fuori tu**: perche' `bigIntAsNumber`,
    perche' il service ritorna `{ok,code,messaggio}` invece di lanciare, perche'
    la separazione routes/controller/service. Se li anticipi tu, il prof capisce
    che hai capito e non li chiede piu'.

### Cosa NON fare mai

15. **Non usare `sequelize.sync()`** anche se ti tenta. La traccia lo vieta e il
    prof lo controlla.
16. **Non mettere logica nei controller o nelle routes**. Se ti viene naturale
    scrivere una query dentro un controller, riscrivila nel service.
17. **Non usare `!variabile`** per validare numeri/booleani obbligatori. Sempre
    `variabile === undefined`.
18. **Non committare `.env`**. Se te ne accorgi tardi: `git rm --cached .env`,
    aggiungi al `.gitignore`, e **cambia le credenziali**.

### Se ti blocchi — check list di debug

19. **Health check**: apri `http://localhost:3000/` nel browser. Se non risponde,
    il problema e' nel server (probabilmente connessione DB).
20. **`SELECT * FROM tabella` in HeidiSQL**. Se i dati non ci sono li', non c'e'
    bug in Node che tenga: il problema e' nel seed.
21. **Attiva `logging: console.log`** in `config/database.js` per vedere le query
    SQL generate da Sequelize. Il 90% dei bug si trova qui.
