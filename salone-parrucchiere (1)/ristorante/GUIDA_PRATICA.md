# Guida PRATICA — come FARE l'esercizio all'esame

File di studio operativo. Ti dice cosa scrivere e in che ordine.
Per la parte "spiega il codice a voce" vedi `GUIDA_ORALE.md`.

Indice:

1. Prima di scrivere una riga di codice
2. Workflow completo in ~2 ore
3. Mappa "cosa cambia" tra un esercizio e l'altro
4. Trappole tecniche (le piu' costose)
5. Cheat-sheet SQL / Sequelize
6. Errori tipici da schivare
7. Gestione del tempo durante l'esame
8. Trucchi che valgono punti
9. Se ti blocchi — check list di debug
10. Endpoint bonus (per il voto pieno)
11. Postman — trucchi che salvano tempo
12. Cosa deve contenere la consegna

---

## 1. Prima di scrivere una riga di codice

- Leggi **tutta** la traccia due volte.
- Sottolinea:
  - Numero esatto di endpoint richiesti.
  - Nomi tabelle e campi (attenzione ai tipi: FLOAT vs DECIMAL, DATE vs DATETIME,
    BOOLEAN vs INT).
  - Funzioni SQL obbligatorie (CONCAT, DATE_FORMAT, TIMESTAMPDIFF, FLOOR, MOD,
    FORMAT, COUNT, SUM, AVG, ROUND, LIKE...).
  - **Messaggi di errore letterali** (es. "Categoria non trovata.",
    "Parametro di ricerca 'q' obbligatorio.") — vanno copiati carattere per
    carattere, punto e maiuscole comprese.
  - Codici HTTP richiesti (200 / 201 / 204 / 400 / 404).
  - Se la tabella pivot ha attributi propri o e' pivot pura.
- Disegna il diagramma ER su carta con FK e cardinalita'.

---

## 2. Workflow completo in ~2 ore

### Passo 0 — Preparazione (10 min)
Lettura traccia + diagramma ER (vedi sezione 1).

### Passo 1 — Copia e rinomina (2 min)
1. Copia la cartella `salone-parrucchiere - Copia` in `<nuovo-dominio>`.
2. Rinomina i file dei modelli/services/controller/routes con i nomi nuovi:
   - `Piatto.js` -> `<Entita1>.js` (tabella principale)
   - `Categoria.js` -> `<Entita2>.js` (lato "1" della N:1)
   - `Ingrediente.js` -> `<Entita3>.js` (lato N:N)
   - `PiattoIngrediente.js` -> `<Entita1><Entita3>.js` (pivot)

### Passo 2 — Configurazione (3 min)
- Modifica `.env`: `DB_NAME=<nuovo_nome_db>`.
- Crea il DB vuoto in HeidiSQL/DBeaver.

### Passo 3 — SQL (15 min) — testa SUBITO
1. Riscrivi `sql/create_tables.sql`:
   - Cambia solo nomi tabelle e colonne, mantieni la struttura.
   - **Ordine tabelle**: prima quelle senza FK, poi la principale, infine la pivot.
   - Ricorda ON DELETE CASCADE **solo** sulla pivot.
2. Riscrivi `sql/seed_data.sql`:
   - Almeno 5-6 righe per la tabella "lato 1".
   - Almeno 12-15 righe per la principale, con MIX di flag booleani
     (indispensabile per gli endpoint di filtro).
   - Righe di associazione nella pivot: ogni riga principale ha almeno una
     associazione, alcune condivise.
3. **Esegui i due script su HeidiSQL. Se falliscono qui, sistemi qui, non dopo.**

### Passo 4 — Modelli (15 min)
Per ogni modello:
- Cambia solo `sequelize.define('NomeNuovo', {...})`, `tableName`, i nomi dei campi.
- Mantieni la logica di `id/autoIncrement/allowNull/unique/defaultValue`.

In `models/index.js`:
- Sostituisci i nomi.
- **Non toccare** la struttura di `hasMany/belongsTo/belongsToMany`.
- Cambia gli `as: 'piatti'` con l'alias italiano corretto per il nuovo dominio.

**Test intermedio**: `npm start`. Deve stampare "Connessione al database
riuscita.". Se non parte, il bug e' qui, non nelle rotte.

### Passo 5 — Services (30 min)
Ricopia i tre file, cambia:
- I `require('../models')` per importare i nuovi nomi.
- I nomi dei metodi generati da Sequelize: `piatto.setIngredienti(...)` diventa
  `<entita1>.set<Entita3>(...)`.
- Le `where` clause con i nomi delle nuove FK.

Se la pivot ha attributi propri (es. `quantita`), aggiungili al modello E al
`through: { attributes: ['quantita'] }` negli include.

### Passo 6 — Controllers (20 min)
Ricopia, cambia solo:
- Nome del service richiesto in cima.
- Messaggi di errore (usa quelli letterali della traccia).
- Campi validati nei POST/PUT.

**Attenzione**: se un campo obbligatorio e' numerico o booleano usa
`campo === undefined`, **non** `!campo` (0 e false sono valori validi).

### Passo 7 — Routes (10 min)
Ricopia, cambia solo:
- Nome del controller richiesto in cima.
- Rotte statiche personalizzate.
- **VERIFICA**: rotte statiche PRIMA di `/:id`. Sempre.

Se usi `routes/index.js` come aggregatore, aggiorna li' i mount.

### Passo 8 — Test con Postman (20 min)
Ricopia la collection, cambia URL e body. Testa **uno alla volta**, in ordine:
1. GET lista (deve tornare i dati del seed).
2. GET dettaglio con id esistente e id inesistente (200 vs 404).
3. POST con body valido e body senza campi obbligatori (201 vs 400).
4. POST con FK inesistente (404).
5. PUT partial update.
6. DELETE (204) e DELETE su id inesistente (404).
7. GET ricerca senza `?q=` (400) e con match/no-match.

### Passo 9 — Prima di consegnare (5 min)
- Rileggi ogni messaggio d'errore: deve corrispondere ESATTAMENTE alla traccia.
- Verifica di aver esposto **il numero esatto** di endpoint richiesti.
- `npm start` un'ultima volta.
- Consegna: sorgente + `sql/` + collection Postman.

---

## 3. Mappa "cosa cambia" tra un esercizio e l'altro

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
| `sql/create_tables.sql` | Nomi tabelle, colonne     | Ordine di CREATE, IF NOT EXISTS   |
| `sql/seed_data.sql`     | Tutto il contenuto        | Ordine INSERT (rispetta FK)       |
| `postman/*.json`        | URL e body                | Struttura JSON di Postman         |

---

## 4. Trappole tecniche (le piu' costose)

### Ordine delle rotte
Rotte statiche (`/ricerca`, `/search`, `/vegetariani`) **sempre prima** di `/:id`,
altrimenti Express intercetta il segmento statico come valore del parametro.
```js
router.get('/search', ...);   // OK, prima
router.get('/:id',    ...);   // OK, per ultimo
```

### Tabella pivot con attributi propri
DEVE essere un modello Sequelize a parte, passato come `through: NomeModello`
esplicito. Se la lasci implicita non puoi leggere i campi extra.

### `bigIntAsNumber: true` nel config
`COUNT`/`SUM` in MariaDB tornano come `BIGINT` -> il driver li restituisce come
`BigInt` JS -> `JSON.stringify` **crasha**. Con questa opzione tornano come
numeri normali.

### Ordine in `server.js`
`require('dotenv').config()` DEVE essere la **prima riga**, altrimenti
`config/database.js` legge `process.env` vuoti.

### `Op.like`
MariaDB con collation `utf8mb4_unicode_ci` (o `utf8_general_ci`) e' gia'
case-insensitive di default. Se il DB e' configurato diversamente (es. `_bin`),
usa `LOWER()` su entrambi i lati.

### 404 vs 400
- **404** = risorsa cercata non esiste (id inesistente).
- **400** = parametro obbligatorio mancante (es. `?q=` non fornito).

### LEFT JOIN vs INNER JOIN
Nelle classifiche/statistiche: **LEFT JOIN** dalla tabella principale alla pivot,
cosi' compaiono anche le righe con **0 associati**. In Sequelize: `required: false`
(default se metti un `where` fuori dall'include).

---

## 5. Cheat-sheet SQL / Sequelize

### Funzioni SQL che potrebbero comparire
| Funzione | Uso | Esempio |
|----------|-----|---------|
| `CONCAT(a, ' ', b)` | Unire stringhe | Nome completo |
| `DATE_FORMAT(data, '%d/%m/%Y')` | Formattare data | Data leggibile |
| `TIMESTAMPDIFF(YEAR, dataNascita, NOW())` | Differenza in anni | Eta' |
| `FLOOR(minuti/60)` + `MOD(minuti, 60)` | Divisione intera + resto | Ore/minuti |
| `FORMAT(numero, 2)` | 2 decimali | Prezzo |
| `COUNT(col)` | Conteggio (ignora NULL) | Numero righe |
| `SUM(col)` | Somma | Incasso totale |
| `AVG(col)` | Media | Valutazione media |
| `ROUND(valore, 1)` | Arrotonda a N decimali | Media a 1 decimale |
| `LIKE '%q%'` | Ricerca testuale | Case-insensitive con collation _ci |

### Sequelize — pattern ricorrenti
```js
// Order by
{ order: [['colonna', 'ASC']] }

// Include con JOIN + nasconde pivot
{ include: [{ model: X, through: { attributes: [] } }] }

// LEFT JOIN esplicito
{ include: [{ model: X, required: false }] }

// LIKE case-insensitive
{ where: { nome: { [Op.like]: `%${q}%` } } }

// IN (...)
{ where: { id: [1, 2, 3] } }

// AND multiplo
{ where: { veg: true, disp: true } }

// OR multiplo
{ where: { [Op.or]: [{ nome: 'X' }, { nome: 'Y' }] } }

// Count
Model.count({ where: {...} })

// Partial update
istanza.update(dati)   // aggiorna solo i campi presenti in `dati`

// Rimpiazza tutte le associazioni della pivot
piatto.setIngredienti([1,2,3])
```

---

## 6. Errori tipici da schivare

1. **Ordine rotte**: `/:id` prima di rotte statiche -> chi vince e' `:id` sempre.
2. **`!prezzo` per validare un numero**: 0 e' falsy -> passa come "mancante".
3. **Dimenticare `express.json()`**: `req.body` sara' `undefined` in ogni POST/PUT.
4. **`dotenv.config()` non in prima riga di server.js**: connessione DB con
   `process.env.DB_USER === undefined`.
5. **Pivot senza `through: { attributes: [] }`** nell'include: il JSON di
   risposta include i campi tecnici della pivot su ogni riga.
6. **ON DELETE CASCADE sulla FK verso la tabella "lato 1"**: se la traccia
   chiede di bloccare la DELETE, il CASCADE la fa comunque passare.
7. **Sequelize `sync()` in produzione**: sovrascrive/genera schemi diversi dal
   SQL richiesto -> la traccia specifica di non usarlo.
8. **Aggiornare la pivot manualmente**: usa `set<Entita>(...)`, evita bug.
9. **`through: 'NomeStringa'`** invece del modello importato: crea pivot
   implicita e perdi il controllo sulle sue colonne.
10. **Committare `.env`**: contiene le password. Verifica `.gitignore`.

---

## 7. Gestione del tempo durante l'esame

- **Non partire dai modelli, parti dal SQL**. Se le tabelle non si creano, tutto
  il resto crolla.
- **Testa dopo OGNI endpoint, non alla fine**. Un endpoint rotto trovato subito
  costa 2 minuti; trovato alla fine costa 30.
- **Non abbellire**: niente librerie di validazione extra, niente async wrapper
  fancy, niente logger custom. Ogni minuto abbellendo e' un minuto tolto ai bug.
- **Se un endpoint non funziona dopo 15 minuti**, saltalo, fai gli altri, torna
  alla fine. Meglio 14/15 che 15 quasi-funzionanti.

---

## 8. Trucchi che valgono punti

- **Copia i messaggi d'errore ESATTAMENTE dalla traccia** (punti, apostrofi,
  maiuscole comprese). Vale/perde 1 punto senza scrivere codice.
- **`through: { attributes: [] }`** su ogni include con belongsToMany. E' la
  cosa piu' dimenticata, il prof la cerca.
- **Order by esplicito** sulle liste. La traccia spesso dice "ordinate per X".
- **`ON DELETE CASCADE` SOLO sulla pivot**. Sull'altra FK MAI.

---

## 9. Se ti blocchi — check list di debug

1. **Health check**: apri `http://localhost:3000/` nel browser. Se non risponde,
   il problema e' nel server (probabilmente connessione DB).
2. **`SELECT * FROM tabella`** in HeidiSQL. Se i dati non ci sono li', non c'e'
   bug in Node che tenga: il problema e' nel seed.
3. **Attiva `logging: console.log`** in `config/database.js` per vedere le query
   SQL generate da Sequelize. Il 90% dei bug si trova qui.
4. **Errori piu' comuni**:
   - `Unknown column 'X' in field list` -> nome sbagliato nel modello o nell'include.
   - `errno 150` / `foreign key constraint fails` -> ordine di CREATE/INSERT sbagliato.
   - `Cannot set headers after they are sent` -> manca un `return` prima di `res.send()`.

---

## 10. Endpoint bonus (per il voto pieno)

### GET /api/piatti/senza-allergeni
Piatti che NON contengono nessun ingrediente `allergene = true`.
```js
Piatto.findAll({
  include: [{
    model: Ingrediente,
    where: { allergene: true },
    required: false          // LEFT JOIN
  }],
  where: { '$Ingredientes.id$': null }
});
```

### Paginazione `?page=1&limit=10`
```js
const { rows, count } = await Piatto.findAndCountAll({
  limit,
  offset: (page - 1) * limit
});
return { data: rows, totale: count, pagina: page, pagine: Math.ceil(count / limit) };
```

### `express-validator`
```js
const { body, validationResult } = require('express-validator');
router.post('/', [
  body('nome').notEmpty(),
  body('prezzo').isFloat({ min: 0 }),
  body('CategoriaId').isInt()
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errori: errors.array() });
  next();
}, piattiController.crea);
```

### Test Jest + Supertest
Qui torna utile la separazione app.js / server.js: nei test importi `app` senza
aprire porte.
```js
const request = require('supertest');
const app = require('../app');
test('GET /api/piatti torna 200', async () => {
  const res = await request(app).get('/api/piatti');
  expect(res.status).toBe(200);
});
```

---

## 11. Postman — trucchi che salvano tempo

### Environment variables
Crea un environment "Locale" con `baseUrl=http://localhost:3000`. Se domani il
server gira su 4000, cambi in un posto solo.

### Test scripts per catturare valori
Nella tab "Tests":
```js
const body = pm.response.json();
pm.environment.set('lastPiattoId', body.id);
```
Poi in una richiesta successiva usi `{{lastPiattoId}}` nell'URL. Utile per fare
POST -> GET -> DELETE in sequenza sullo stesso id.

### Runner
Esegue tutta la collection in ordine. Ultimo check prima di consegnare:
importi la collection su una macchina pulita, `npm start`, Runner, verifichi
che tutti gli endpoint tornino gli status attesi.

---

## 12. Cosa deve contenere la consegna

1. **Codice sorgente** senza `node_modules/` e senza `.env`.
2. **Script SQL** (`sql/create_tables.sql` + `sql/seed_data.sql`) eseguibili su
   DB pulito, in questo esatto ordine.
3. **Collection Postman** (`postman/*.json`) con tutti gli endpoint richiesti
   e body di esempio per POST/PUT.
4. **README.md** con: come installare (`npm install`), come creare il DB, come
   avviare (`npm start`), quali variabili d'ambiente servire.

Zip finale: `NomeCognome_Ristorante.zip`.

**Test di consegna**: estrai lo zip in una cartella nuova, `npm install`,
esegui gli script SQL, `npm start`. Deve funzionare senza modifiche manuali.
