# Spiegazione COMPLETA del progetto — riga per riga

Documento di studio: per ogni file del progetto viene commentata **ogni riga di
codice significativa**, spiegando *cosa* fa e *perché* è scritta così.

Indice:

1. File di configurazione (`.env`, `.gitignore`, `package.json`)
2. `config/database.js`
3. Entry point (`server.js`, `app.js`)
4. Modelli (`models/*.js`)
5. Services (`services/*.js`)
6. Controllers (`controllers/*.js`)
7. Routes (`routes/*.js`)
8. Script SQL (`sql/*.sql`)
9. Collection Postman (`postman/ristorante.json`)

---

## 1. File di configurazione

### `.env`

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=Corsoutente
DB_PASSWORD=1234
DB_NAME=risto
DB_DIALECT=mysql
DB_LOGGING=false

JWT_SECRET=...
JWT_REFRESH=...
JWT_ISSUER=http://localhost:3000

PORT=3000
```

- **DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME**: dati per connettersi a
  MariaDB. Sono in `.env` e non nel codice perche' credenziali e configurazioni
  d'ambiente **non vanno hardcodate** ne' committate.
- **DB_DIALECT**: qui non lo leggiamo (in `config/database.js` scriviamo direttamente
  `dialect: 'mariadb'`). Il valore `mysql` e' un residuo, MariaDB e MySQL parlano
  lo stesso protocollo quindi in pratica funzionerebbe comunque.
- **JWT_\***: non usati dal progetto attuale (l'esercizio non richiede autenticazione),
  lasciati per non modificare il file.
- **PORT**: porta HTTP del server Express. Se non fosse presente, in `server.js`
  facciamo fallback a `3000`.

Il file `.env` viene caricato in `process.env` da `dotenv` (chiamato in
`server.js` e in `config/database.js`).

### `.gitignore`

```
node_modules
.env
```

- **node_modules**: cartella gigantesca (centinaia di MB), ricreata da `npm install`
  a partire da `package.json`. Non ha senso committarla.
- **.env**: contiene credenziali. **Mai** su Git.

### `package.json`

```json
{
  "name": "salone-parrucchiere",
  "version": "1.0.0",
  "description": "...",
  "main": "server.js",
```

- **name / version / description**: metadati del pacchetto.
- **main**: entry point convenzionale del pacchetto (usato se qualcuno facesse
  `require('salone-parrucchiere')`). Non e' letto da `npm start`.

```json
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
```

- **`npm start`**: avvia il server in produzione con Node.
- **`npm run dev`**: avvia con `nodemon`, che riavvia in automatico quando cambi
  un file. Serve solo in sviluppo, per questo `nodemon` sta in `devDependencies`.

```json
  "dependencies": {
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "mariadb": "^3.3.1",
    "sequelize": "^6.37.3"
  },
  "devDependencies": {
    "nodemon": "^3.1.4"
  }
}
```

- **dotenv**: legge il `.env` e popola `process.env`.
- **express**: framework HTTP (routing, middleware, req/res).
- **mariadb**: driver nativo per il DB. Sequelize lo invoca sotto il cofano.
- **sequelize**: ORM (Object-Relational Mapper). Ti fa scrivere `Piatto.findAll()`
  invece di `SELECT * FROM Piatto`.
- **`^` davanti alla versione**: accetta patch e minor updates (16.4.5 → 16.9.99
  ok, 17.0.0 no).

---

## 2. `config/database.js`

```js
require('dotenv').config();
```
Popola `process.env` leggendo il file `.env`. **Deve stare qui in alto**, altrimenti
le righe successive leggerebbero variabili vuote.

```js
const { Sequelize } = require('sequelize');
```
Importa la classe `Sequelize` dal pacchetto.

```js
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  { ... }
);
```
Crea l'istanza Sequelize passando nome DB, utente, password e le opzioni.
Questa istanza e' **una sola** in tutta l'app (pattern singleton), condivisa da
tutti i modelli tramite `require('../config/database')`.

Dentro le opzioni:

- **`host: process.env.DB_HOST`** e **`port: process.env.DB_PORT`**: dove si trova
  il DB.
- **`dialect: 'mariadb'`**: Sequelize genera SQL specifico per MariaDB.
- **`logging: false`**: non stampa le query SQL. Se vuoi debuggare, metti
  `console.log` (le vedrai a console ogni volta che il codice fa una query).
- **`dialectOptions`**:
  - **`bigIntAsNumber: true`**: MariaDB restituisce `COUNT`, `SUM` e altri
    BIGINT come `BigInt` JS. `JSON.stringify(BigInt)` **crasha**. Con questa
    opzione tornano come `Number` normali.
  - **`decimalAsNumber: true`**: idem per DECIMAL/AVG/ROUND (di default tornano
    come stringhe).
  - **`insertIdAsNumber: true`**: idem per l'id restituito dopo un INSERT.
- **`define: { timestamps: false }`**: default globale: nessun modello aggiunge
  automaticamente `createdAt`/`updatedAt`. Le nostre tabelle non li hanno.

```js
module.exports = sequelize;
```
Esporta l'istanza. Chi la importa la usa cosi': `const sequelize = require('../config/database');`.

---

## 3. Entry point

### `server.js`

```js
require('dotenv').config();
```
Prima riga. Se stesse dopo `require('./app')`, i moduli caricati transitivamente
(compresa la connessione DB) leggerebbero variabili vuote.

```js
const app = require('./app');
const { sequelize } = require('./models');
```
- **`app`**: l'app Express gia' configurata (middleware + rotte).
- **`sequelize`**: l'istanza per parlare al DB, esportata da `models/index.js`.

```js
const PORT = process.env.PORT || 3000;
```
Legge la porta dal `.env`, fallback 3000.

```js
async function avvia() {
  try {
    await sequelize.authenticate();
    console.log('Connessione al database riuscita.');

    app.listen(PORT, () => {
      console.log(`Server in ascolto su http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Impossibile connettersi al database:', err.message);
    process.exit(1);
  }
}
avvia();
```
Perche' una funzione async:
- **`sequelize.authenticate()`** apre una connessione di test al DB e restituisce
  una Promise. Se il DB non e' raggiungibile, questa fallisce **prima** che
  Express apra la porta → evita di avere un server che risponde ma non ha DB.
- **`app.listen(PORT, cb)`**: apre effettivamente la porta HTTP.
- **`process.exit(1)`**: chiude il processo con codice di uscita 1 (errore).
  Utile in ambienti come Docker/CI: un processo che esce con !=0 viene marcato
  come fallito.

Perche' NON usiamo `sequelize.sync()`? Perche' le tabelle le crea lo script
`sql/create_tables.sql` (richiesto dalla traccia). `sync()` genererebbe uno
schema alternativo (nomi pluralizzati, tipi diversi, senza vincoli CHECK) che
potrebbe non combaciare col nostro.

### `app.js`

```js
const express = require('express');
```
Importa Express.

```js
const categorieRouter   = require('./routes/categorie');
const ingredientiRouter = require('./routes/ingredienti');
const piattiRouter      = require('./routes/piatti');
```
I tre router. Ogni file esporta un `express.Router()` con le sue rotte.

```js
const app = express();
app.use(express.json());
```
- **`express()`**: crea l'app Express.
- **`app.use(express.json())`**: middleware che parsa il body JSON in ingresso e
  lo mette in `req.body`. Senza questo, `req.body` sarebbe `undefined` sulle POST/PUT.

```js
app.use('/api/categorie',   categorieRouter);
app.use('/api/ingredienti', ingredientiRouter);
app.use('/api/piatti',      piattiRouter);
```
Monta i router sui rispettivi prefissi. Dentro `piatti.js` scriverai
`router.get('/')` e il match effettivo sara' `GET /api/piatti`.

```js
app.get('/', (req, res) => {
  res.json({ messaggio: 'API Ristorante attiva' });
});
```
Health check: apri il browser su http://localhost:3000 e vedi che il server
risponde.

```js
app.use((req, res) => {
  res.status(404).json({ errore: 'Risorsa non trovata.' });
});
```
Middleware finale: se **nessuna** rotta precedente ha risposto, siamo qui. Il
client ha chiesto un URL che non esiste → 404.

```js
module.exports = app;
```
Esporta l'app (non la avvia).

---

## 4. Modelli

### `models/Categoria.js`

```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
```
- **`DataTypes`**: catalogo dei tipi Sequelize (`DataTypes.STRING`, `INTEGER`,
  `BOOLEAN`, `TEXT`, `FLOAT`, ...).
- **`sequelize`**: l'istanza condivisa; serve per chiamare `sequelize.define(...)`.

```js
const Categoria = sequelize.define('Categoria', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
```
Definisce il modello `Categoria` con la colonna `id` INTEGER, chiave primaria,
autoincrementale.

```js
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
```
`nome` VARCHAR (Sequelize traduce `STRING` → `VARCHAR(255)`), obbligatorio,
UNIQUE. Sequelize genera un vincolo UNIQUE a livello DB e valida anche lato JS.

```js
  descrizione: {
    type: DataTypes.TEXT,
    allowNull: true
  },
```
`descrizione` TEXT (blob di testo lungo), opzionale (`allowNull: true`).

```js
  ordineMenu: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }
```
Intero obbligatorio: indica l'ordine di visualizzazione (Antipasti=1, Primi=2, ...).

```js
}, {
  tableName: 'Categoria',
  timestamps: false
});
```
- **`tableName: 'Categoria'`**: esplicito, perche' Sequelize di default pluralizza
  in inglese ("Categorias").
- **`timestamps: false`**: no `createdAt`/`updatedAt` (le nostre tabelle non li
  hanno).

```js
module.exports = Categoria;
```

### `models/Ingrediente.js`

Struttura identica a Categoria. Note:
- **`nome`** UNIQUE (non ha senso avere due ingredienti chiamati "Pomodoro").
- **`allergene`** BOOLEAN default `false`: la traccia lo richiede per marcare gli
  ingredienti allergenici (glutine, lattosio, ...).
- **`unitaMisura`** STRING opzionale ("g", "ml", "pz").

### `models/Piatto.js`

Campi:
- `id`, `nome` (obbligatorio), `descrizione` TEXT opzionale.
- **`prezzo: DataTypes.FLOAT`**: la traccia specifica FLOAT per il prezzo.
- **`vegetariano`** BOOLEAN default `false`.
- **`disponibile`** BOOLEAN default `true`.
- **`CategoriaId`** INTEGER NOT NULL con `references: { model: 'Categoria', key: 'id' }`
  → dichiara la FK anche a livello Sequelize (la FK "vera" viene dal SQL).

`tableName: 'Piatto'`, `timestamps: false`.

### `models/PiattoIngrediente.js`

Tabella pivot pura per il molti-a-molti.

```js
const PiattoIngrediente = sequelize.define('PiattoIngrediente', {
  PiattoId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: { model: 'Piatto', key: 'id' }
  },
  IngredienteId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: { model: 'Ingrediente', key: 'id' }
  }
}, {
  tableName: 'PiattoIngrediente',
  timestamps: false
});
```

Dettagli chiave:
- **Nessuna colonna `id`**: la chiave primaria e' **composta**. Entrambe le
  colonne hanno `primaryKey: true` → PK = (PiattoId, IngredienteId).
- La PK composta impedisce automaticamente di associare due volte lo stesso
  ingrediente allo stesso piatto (INSERT duplicato → errore).
- **`references`**: la FK "logica"; la FK effettiva con `ON DELETE CASCADE` la
  definiamo nello script SQL.
- **Nessun campo extra**: come da traccia. Se avessimo `quantita` o `note` la
  tabella diventerebbe "pivot arricchita" e il codice per gestirla cambierebbe.

### `models/index.js` — il file piu' importante dei modelli

```js
const sequelize = require('../config/database');
const Piatto = require('./Piatto');
const Ingrediente = require('./Ingrediente');
const Categoria = require('./Categoria');
const PiattoIngrediente = require('./PiattoIngrediente');
```
Importa istanza Sequelize e tutti i modelli.

```js
// Relazione molti-a-uno: Categoria 1 <-> N Piatto
Categoria.hasMany(Piatto, { foreignKey: 'CategoriaId', as: 'piatti' });
Piatto.belongsTo(Categoria, { foreignKey: 'CategoriaId' });
```
- **`Categoria.hasMany(Piatto)`**: da Categoria ottengo tanti Piatti.
- **`Piatto.belongsTo(Categoria)`**: ogni Piatto appartiene a una Categoria.
- **`foreignKey: 'CategoriaId'`**: nome esplicito della colonna FK (Sequelize lo
  dedurrebbe comunque, ma meglio esplicitare).
- **`as: 'piatti'`**: alias, permette `categoria.piatti` invece del default
  `categoria.Piattos`. Utile perche' l'italiano non pluralizza come l'inglese.

Cosa ottieni **gratis**:
- `categoria.getPiatti()`, `categoria.setPiatti([...])`, `addPiatto()`, `removePiatto()`.
- `piatto.getCategoria()`, `piatto.setCategoria(cat)`.
- `Piatto.findAll({ include: [Categoria] })` → JOIN automatico.

```js
// Relazione molti-a-molti: Piatto <-> Ingrediente
Piatto.belongsToMany(Ingrediente, {
  through: PiattoIngrediente,
  foreignKey: 'PiattoId',
  otherKey: 'IngredienteId'
});
Ingrediente.belongsToMany(Piatto, {
  through: PiattoIngrediente,
  foreignKey: 'IngredienteId',
  otherKey: 'PiattoId'
});
```
- **`belongsToMany`** su entrambi i lati (serve dichiararla in entrambe le direzioni).
- **`through: PiattoIngrediente`**: pivot esplicita. Se passassimo una stringa
  (`through: 'PiattoIngrediente'`) Sequelize creerebbe una pivot implicita.
- **`foreignKey`**: FK verso il modello **corrente**.
- **`otherKey`**: FK verso il modello **opposto**.

Metodi generati:
- Su `Piatto`: `piatto.getIngredienti()`, `piatto.setIngredienti([1,2,3])`,
  `piatto.addIngrediente(x)`, `piatto.removeIngrediente(x)`.
- Su `Ingrediente`: `ingrediente.getPiatti()`, `setPiatti(...)`, ecc.

`setIngredienti([1,2,3])` sotto il cofano fa:
```sql
DELETE FROM PiattoIngrediente WHERE PiattoId = ?;
INSERT INTO PiattoIngrediente (PiattoId, IngredienteId) VALUES (?, 1), (?, 2), (?, 3);
```
Un solo metodo, tutta la logica gestita da Sequelize. Piu' pulito, meno bug.

```js
module.exports = { sequelize, Piatto, Ingrediente, PiattoIngrediente, Categoria };
```
Esporta tutto: il resto del codice fa `const { Piatto, Categoria } = require('../models');`
e ottiene i modelli **gia' associati**.

---

## 5. Services

Ricordati: **niente `req`/`res` qui**. Solo query Sequelize.

### `services/categorieService.js`

```js
const { Categoria, Piatto, Ingrediente } = require('../models');
```
Importa i modelli necessari.

```js
exports.elencaTutte = async () => {
  return Categoria.findAll({ order: [['ordineMenu', 'ASC']] });
};
```
- **`findAll()`**: SELECT.
- **`order: [['ordineMenu', 'ASC']]`**: ORDER BY ordineMenu ASC. Array di array
  perche' puoi passarne piu' di uno.

```js
exports.crea = async ({ nome, descrizione, ordineMenu }) => {
  return Categoria.create({ nome, descrizione, ordineMenu });
};
```
`Categoria.create(...)` → INSERT + restituisce l'istanza con l'id assegnato.

Nota il destructuring del parametro: il chiamante passa un oggetto, noi
prendiamo solo i campi che ci interessano (evita di passare per sbaglio un `id`
dal client).

```js
exports.trovaPerId = async (id) => Categoria.findByPk(id);
```
`findByPk(id)` = "find by primary key". Piu' leggibile di
`findOne({ where: { id } })`.

```js
exports.contaPiatti = async (id) => Piatto.count({ where: { CategoriaId: id } });
```
`count(...)` → SELECT COUNT(*). Usata prima della DELETE della categoria per
sapere se ci sono piatti che la referenziano.

```js
exports.elimina = async (id) => Categoria.destroy({ where: { id } });
```
`destroy(...)` → DELETE. Restituisce il numero di righe eliminate.

```js
exports.piattiDellaCategoria = async (id) => {
  return Piatto.findAll({
    where: { CategoriaId: id },
    include: [{ model: Ingrediente, through: { attributes: [] } }]
  });
};
```
- **`where`**: filtra i piatti di quella categoria.
- **`include: [{ model: Ingrediente, ... }]`**: JOIN sulla pivot per ottenere gli
  ingredienti di ogni piatto.
- **`through: { attributes: [] }`**: nasconde le colonne della pivot dal JSON di
  risposta (altrimenti ogni ingrediente porterebbe con se' `PiattoIngrediente: {...}`).

### `services/ingredientiService.js`

```js
exports.elencaTutti = async () => Ingrediente.findAll({ order: [['nome', 'ASC']] });
exports.crea = async ({ nome, allergene, unitaMisura }) => {
  return Ingrediente.create({ nome, allergene, unitaMisura });
};
```
Analoghe a categorie.

```js
exports.trovaPerId = async (id) => {
  return Ingrediente.findByPk(id, {
    include: [{
      model: Piatto,
      through: { attributes: [] },
      include: [{ model: Categoria }]
    }]
  });
};
```
Include annidato:
- Dall'ingrediente vado ai piatti (attraverso la pivot).
- Da ogni piatto vado alla sua categoria.

Il JSON risultante e' del tipo:
```json
{
  "id": 1, "nome": "Pomodoro", "allergene": false, ...,
  "Piattos": [
    { "id": 2, "nome": "Caprese", ..., "Categoria": {...} },
    { "id": 4, "nome": "Spaghetti al pomodoro", ..., "Categoria": {...} }
  ]
}
```

```js
exports.aggiorna = async (id, dati) => {
  const ingrediente = await Ingrediente.findByPk(id);
  if (!ingrediente) return null;
  await ingrediente.update(dati);
  return ingrediente;
};
```
- Prima **cerca**: serve per rispondere 404 se l'ingrediente non esiste (il
  controller usa `null` come segnale).
- **`.update(dati)`**: UPDATE dell'istanza. Solo i campi presenti in `dati`
  vengono modificati (partial update).
- Restituisce l'istanza aggiornata.

### `services/piattiService.js`

```js
const { Piatto, Ingrediente, Categoria } = require('../models');
const { Op } = require('sequelize');
```
Importa `Op` per gli operatori come `Op.like`, `Op.or`, `Op.in`, ecc.

```js
const INCLUDE_STANDARD = [
  { model: Categoria },
  { model: Ingrediente, through: { attributes: [] } }
];
```
Include riutilizzabile: categoria + ingredienti (con pivot nascosta). Definito
una sola volta per evitare duplicazione.

```js
exports.elencaTutti = async () => {
  return Piatto.findAll({ include: INCLUDE_STANDARD, order: [['id', 'ASC']] });
};
exports.trovaPerId = async (id) => {
  return Piatto.findByPk(id, { include: INCLUDE_STANDARD });
};
```
Lista e dettaglio: stesse query, cambia solo se filtri per id.

#### `crea` — l'endpoint piu' complesso

```js
exports.crea = async ({ nome, descrizione, prezzo, vegetariano, disponibile, CategoriaId, ingredientiIds }) => {
```
Firma con destructuring: solo i campi che accettiamo. Un client malintenzionato
non puo' inserire un `id` a piacere.

```js
  const categoria = await Categoria.findByPk(CategoriaId);
  if (!categoria) return { ok: false, code: 404, messaggio: 'Categoria non trovata.' };
```
Verifica esistenza categoria PRIMA di creare il piatto. Se manca → non
prosegue e ritorna un oggetto risultato "not ok". Il controller lo tradurra' in
HTTP 404.

Perche' ritorna un oggetto invece di lanciare? Cosi' il controller resta
lineare: non deve avvolgere in try/catch specifici per gli errori di business.
Le eccezioni tecniche (DB down) sono un'altra cosa e sono gestite dal try/catch
del controller.

```js
  if (Array.isArray(ingredientiIds) && ingredientiIds.length > 0) {
    const trovati = await Ingrediente.findAll({ where: { id: ingredientiIds } });
    if (trovati.length !== ingredientiIds.length) {
      const trovatiIds = trovati.map((i) => i.id);
      const mancanti = ingredientiIds.filter((x) => !trovatiIds.includes(x));
      return { ok: false, code: 404, messaggio: `Ingredienti non trovati: ${mancanti.join(', ')}.` };
    }
  }
```
- **`Array.isArray(...)`**: `ingredientiIds` e' opzionale, il client potrebbe
  non passarlo.
- **`where: { id: ingredientiIds }`**: Sequelize traduce array → `WHERE id IN (...)`.
- Se il numero di ingredienti trovati e' minore di quelli richiesti, alcuni
  id non esistono → calcolo la lista dei mancanti e la metto nel messaggio.

```js
  const piatto = await Piatto.create({ nome, descrizione, prezzo, vegetariano, disponibile, CategoriaId });
```
INSERT. `piatto.id` e' ora disponibile.

```js
  if (Array.isArray(ingredientiIds) && ingredientiIds.length > 0) {
    await piatto.setIngredienti(ingredientiIds);
  }
```
Metodo generato da `belongsToMany`: crea le righe nella pivot.
Sequelize esegue:
```sql
INSERT INTO PiattoIngrediente (PiattoId, IngredienteId) VALUES (?, ?), (?, ?), ...;
```

```js
  const completo = await Piatto.findByPk(piatto.id, { include: INCLUDE_STANDARD });
  return { ok: true, piatto: completo };
```
Ricarica il piatto con tutti i JOIN, cosi' la risposta HTTP contiene il piatto
completo di categoria e ingredienti.

#### `aggiorna`

```js
exports.aggiorna = async (id, dati) => {
  const piatto = await Piatto.findByPk(id);
  if (!piatto) return { ok: false, code: 404, messaggio: 'Piatto non trovato.' };
```
Cerca. Se non esiste → 404.

```js
  if (dati.CategoriaId !== undefined) {
    const categoria = await Categoria.findByPk(dati.CategoriaId);
    if (!categoria) return { ok: false, code: 404, messaggio: 'Categoria non trovata.' };
  }
```
Se il client vuole cambiare la categoria, verifichiamo che esista.

```js
  if (Array.isArray(dati.ingredientiIds)) {
    // ...stesso controllo di crea()...
  }
```
Se il client vuole aggiornare gli ingredienti, verifichiamo che esistano tutti.

```js
  const { ingredientiIds, ...campi } = dati;
  await piatto.update(campi);
  if (Array.isArray(ingredientiIds)) {
    await piatto.setIngredienti(ingredientiIds);
  }
```
- **Destructuring**: separa `ingredientiIds` dagli altri campi (non e' una
  colonna del modello Piatto, la pivot e' un altra tabella).
- **`piatto.update(campi)`**: UPDATE solo dei campi passati (partial update).
- **`setIngredienti(...)`**: **rimpiazza** completamente la lista di ingredienti.
  Se il client passa `[1,2]`, tutti gli altri vengono staccati.

```js
  const completo = await Piatto.findByPk(id, { include: INCLUDE_STANDARD });
  return { ok: true, piatto: completo };
};
```
Come `crea`.

#### `elimina`, `cerca`, `vegetariani`

```js
exports.elimina = async (id) => Piatto.destroy({ where: { id } });
```
DELETE. Grazie a `ON DELETE CASCADE` sulla pivot, le righe di `PiattoIngrediente`
per questo piatto vengono cancellate automaticamente dal DB.

```js
exports.cerca = async (q) => {
  return Piatto.findAll({
    where: { nome: { [Op.like]: `%${q}%` } },
    include: INCLUDE_STANDARD
  });
};
```
- **`Op.like`**: operatore SQL `LIKE`.
- **`` `%${q}%` ``**: template literal → `%pasta%` cerca "pasta" ovunque nel nome.
- Su MariaDB con collation `utf8_general_ci` la ricerca e' **case-insensitive**
  di default. Se il DB usasse una collation binaria (`_bin`), servirebbe
  `LOWER()` su entrambi i lati.
- Attenzione: usare Op.like con un input non sanitizzato e' sicuro dal punto di
  vista SQL injection (Sequelize fa il parametro bind), ma consente al client di
  fare query costose con pattern come `%%%`. Per un esercizio va bene.

```js
exports.vegetariani = async () => {
  return Piatto.findAll({
    where: { vegetariano: true, disponibile: true },
    include: [{ model: Categoria }]
  });
};
```
Due condizioni AND (le chiavi di `where` sono AND di default).
Traduzione SQL: `WHERE vegetariano = TRUE AND disponibile = TRUE`.

Include solo `Categoria` (non gli ingredienti): la traccia specifica cosi'.

---

## 6. Controllers

### `controllers/categorieController.js`

```js
const categorieService = require('../services/categorieService');
```

```js
exports.lista = async (req, res) => {
  try {
    const categorie = await categorieService.elencaTutte();
    res.status(200).json(categorie);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};
```
Struttura standard:
1. Chiama il service.
2. Risponde con status + JSON.
3. try/catch → in caso di eccezione tecnica risponde 500.

```js
exports.crea = async (req, res) => {
  const { nome, descrizione, ordineMenu } = req.body;
  if (!nome || ordineMenu === undefined || ordineMenu === null) {
    return res.status(400).json({ errore: "Campi obbligatori mancanti: 'nome', 'ordineMenu'." });
  }
  try {
    const categoria = await categorieService.crea({ nome, descrizione, ordineMenu });
    res.status(201).json(categoria);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};
```
- **Validazione input**: se manca `nome` o `ordineMenu` → **400** (Bad Request),
  perche' l'errore e' del client.
- **Attenzione a `ordineMenu === undefined || ordineMenu === null`**: non basta
  `!ordineMenu` perche' `0` e' un valore valido ma cadrebbe nel falsy.
- **`return`** dopo `res.status(...).json(...)`: fermare qui, altrimenti
  proseguirebbe e potrebbe tentare di rispondere due volte (errore "Cannot set
  headers after they are sent").
- **201** = Created (POST riuscito).

```js
exports.elimina = async (req, res) => {
  try {
    const categoria = await categorieService.trovaPerId(req.params.id);
    if (!categoria) {
      return res.status(404).json({ errore: 'Categoria non trovata.' });
    }
    const numPiatti = await categorieService.contaPiatti(req.params.id);
    if (numPiatti > 0) {
      return res.status(400).json({
        errore: 'Impossibile eliminare: esistono piatti associati a questa categoria.'
      });
    }
    await categorieService.elimina(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};
```
- **`req.params.id`**: parametro URL (`/api/categorie/5` → `id = '5'`).
- **404** se non esiste. **400** se non eliminabile (business rule).
- **`204 No Content`**: per DELETE riusciti si usa 204 senza body (`res.send()` con
  nessun argomento). Il messaggio letterale e' quello richiesto dalla traccia.

```js
exports.piatti = async (req, res) => {
  try {
    const categoria = await categorieService.trovaPerId(req.params.id);
    if (!categoria) {
      return res.status(404).json({ errore: 'Categoria non trovata.' });
    }
    const piatti = await categorieService.piattiDellaCategoria(req.params.id);
    res.status(200).json(piatti);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};
```
Prima verifica che la categoria esista (404 pulito), poi restituisce l'array
di piatti.

### `controllers/ingredientiController.js`

Segue lo stesso pattern. Note specifiche:

```js
exports.crea = async (req, res) => {
  const { nome, allergene, unitaMisura } = req.body;
  if (!nome) {
    return res.status(400).json({ errore: "Campo obbligatorio mancante: 'nome'." });
  }
  ...
};
```
Solo `nome` e' obbligatorio (gli altri hanno default nel modello).

### `controllers/piattiController.js`

```js
exports.crea = async (req, res) => {
  const { nome, prezzo, descrizione, vegetariano, disponibile, CategoriaId, ingredientiIds } = req.body;
  if (!nome || prezzo === undefined || CategoriaId === undefined) {
    return res.status(400).json({
      errore: "Campi obbligatori mancanti: 'nome', 'prezzo', 'CategoriaId'."
    });
  }
  try {
    const risultato = await piattiService.crea({ ... });
    if (!risultato.ok) {
      return res.status(risultato.code).json({ errore: risultato.messaggio });
    }
    res.status(201).json(risultato.piatto);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};
```
- **`prezzo === undefined`**: idem del ragionamento su `ordineMenu`. `prezzo: 0`
  e' semanticamente valido (piatto gratis) anche se non realistico.
- **`if (!risultato.ok)`**: traduce l'oggetto risultato del service in HTTP.

```js
exports.cerca = async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ errore: "Parametro di ricerca 'q' obbligatorio." });
  }
  ...
};
```
- **`req.query`**: query string (`?q=pasta` → `req.query.q === 'pasta'`).
- Messaggio letterale come richiesto dalla traccia.

```js
exports.elimina = async (req, res) => {
  try {
    const piatto = await piattiService.trovaPerId(req.params.id);
    if (!piatto) {
      return res.status(404).json({ errore: 'Piatto non trovato.' });
    }
    await piattiService.elimina(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
};
```
Come categorie: verifica esistenza, poi elimina.

---

## 7. Routes

### `routes/categorie.js`

```js
const express = require('express');
const router = express.Router();
const categorieController = require('../controllers/categorieController');
```
- **`express.Router()`**: mini-app Express modulare, pensata per essere montata
  con `app.use(prefix, router)`.
- Nel router scrivi rotte relative (`/`, `/:id`); il prefisso e' aggiunto da
  `app.use('/api/categorie', router)`.

```js
router.get('/',           categorieController.lista);   // Endpoint 1
router.post('/',          categorieController.crea);    // Endpoint 2
router.get('/:id/piatti', categorieController.piatti);  // Endpoint 15
router.delete('/:id',     categorieController.elimina); // Endpoint 3
```
Ordine importante: `/:id/piatti` **prima** di `/:id` (in realta' qui non
collide, perche' i metodi HTTP sono diversi, ma per consistenza si mettono
sempre le rotte piu' specifiche in cima).

```js
module.exports = router;
```

### `routes/ingredienti.js`

```js
router.get('/',    ingredientiController.lista);     // Endpoint 4
router.post('/',   ingredientiController.crea);      // Endpoint 5
router.get('/:id', ingredientiController.dettaglio); // Endpoint 6
router.put('/:id', ingredientiController.aggiorna);  // Endpoint 7
```
Semplice, nessun rischio di collisione tra rotte statiche e dinamiche.

### `routes/piatti.js`

```js
router.get('/search',       piattiController.cerca);       // 13
router.get('/vegetariani',  piattiController.vegetariani); // 14

router.get('/',       piattiController.lista);     // 8
router.post('/',      piattiController.crea);      // 9
router.get('/:id',    piattiController.dettaglio); // 10
router.put('/:id',    piattiController.aggiorna);  // 11
router.delete('/:id', piattiController.elimina);   // 12
```

**Perche' `/search` e `/vegetariani` PRIMA di `/:id`?**
Express valuta le rotte nell'ordine di dichiarazione. Se `/:id` fosse prima:
- `GET /api/piatti/search` matcherebbe `/:id` con `id = "search"`.
- Il controller `dettaglio` cercherebbe un piatto con id "search" → 404.
- Le rotte `/search` e `/vegetariani` non verrebbero mai raggiunte.

---

## 8. Script SQL

### `sql/create_tables.sql`

```sql
CREATE TABLE IF NOT EXISTS Categoria (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  nome         VARCHAR(255) NOT NULL UNIQUE,
  descrizione  TEXT,
  ordineMenu   INT NOT NULL
);
```
- **`IF NOT EXISTS`**: rende lo script rieseguibile senza errore.
- **`AUTO_INCREMENT PRIMARY KEY`**: id auto.
- **`UNIQUE`** su nome.
- **`descrizione TEXT`** → opzionale (senza `NOT NULL` accetta NULL).

```sql
CREATE TABLE IF NOT EXISTS Ingrediente (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  nome         VARCHAR(255) NOT NULL UNIQUE,
  allergene    BOOLEAN NOT NULL DEFAULT FALSE,
  unitaMisura  VARCHAR(255)
);
```
Analoga a Categoria. `BOOLEAN` in MariaDB e' un alias per `TINYINT(1)`.

```sql
CREATE TABLE IF NOT EXISTS Piatto (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  nome         VARCHAR(255) NOT NULL,
  descrizione  TEXT,
  prezzo       FLOAT NOT NULL,
  vegetariano  BOOLEAN NOT NULL DEFAULT FALSE,
  disponibile  BOOLEAN NOT NULL DEFAULT TRUE,
  CategoriaId  INT NOT NULL,
  CONSTRAINT fk_piatto_categoria
    FOREIGN KEY (CategoriaId) REFERENCES Categoria(id)
);
```
- **`CategoriaId INT NOT NULL`**: la traccia richiede che ogni piatto abbia una
  categoria.
- **`CONSTRAINT fk_piatto_categoria FOREIGN KEY ...`**: FK con nome esplicito.
  Il nome aiuta a debuggare (i messaggi di errore includono il nome del vincolo).
- Nota: **niente ON DELETE CASCADE** qui, perche' l'endpoint 3 richiede di
  **bloccare** l'eliminazione della categoria se ci sono piatti. Il vincolo di
  default (RESTRICT) fa esattamente questo.

```sql
CREATE TABLE IF NOT EXISTS PiattoIngrediente (
  PiattoId      INT NOT NULL,
  IngredienteId INT NOT NULL,
  PRIMARY KEY (PiattoId, IngredienteId),
  CONSTRAINT fk_pi_piatto
    FOREIGN KEY (PiattoId)      REFERENCES Piatto(id)      ON DELETE CASCADE,
  CONSTRAINT fk_pi_ingrediente
    FOREIGN KEY (IngredienteId) REFERENCES Ingrediente(id) ON DELETE CASCADE
);
```
- **`PRIMARY KEY (PiattoId, IngredienteId)`**: PK composta. Impedisce di
  associare due volte lo stesso ingrediente allo stesso piatto.
- **`ON DELETE CASCADE`** su entrambe le FK: se elimini un piatto o un
  ingrediente, le righe qui vengono rimosse automaticamente. Evita FK dangling.

**Ordine delle CREATE**: prima le tabelle senza FK (Categoria, Ingrediente),
poi quelle che le referenziano (Piatto), infine la pivot. Se invertissi
l'ordine, il DB darebbe errore "referenced table does not exist" (errno 150).

### `sql/seed_data.sql`

Dati di test coerenti con i modelli:
- **6 categorie** (Antipasti, Primi, Secondi, Contorni, Dolci, Bevande), ognuna
  con un `ordineMenu` distinto per testare l'ordinamento dell'endpoint 1.
- **17 ingredienti**, alcuni marcati come allergeni (`TRUE` su Mozzarella,
  Uovo, Pecorino, Spaghetti, Salmone, Mascarpone, Farina).
- **13 piatti**, distribuiti tra le categorie, mix di vegetariani/non
  vegetariani, uno (`Ossobuco`) marcato `disponibile = FALSE` per testare che
  l'endpoint 14 lo escluda.
- **Associazioni PiattoIngrediente**: ogni piatto ha almeno un ingrediente,
  alcuni ingredienti compaiono in piu' piatti (es. pomodoro in bruschetta,
  caprese, spaghetti al pomodoro, insalata di riso).

Nota: gli id sono espliciti (`INSERT INTO Categoria (id, nome, ...)`) per poter
riferirli nelle FK dei piatti/pivot senza dover leggere gli id auto-generati.

---

## 9. Collection Postman

`postman/ristorante.json` e' un file JSON conforme allo schema Postman v2.1.

Struttura:
- **`info`**: nome e descrizione.
- **`variable`**: variabili globali della collection (`baseUrl` =
  `http://localhost:3000`).
- **`item`**: array di cartelle. Le 3 cartelle sono `Categorie`, `Ingredienti`,
  `Piatti`, come da traccia.
- Ogni request ha: `name`, `method`, `header` (Content-Type per POST/PUT),
  `body` (raw JSON) e `url`.

Nei body: dati realistici che corrispondono ai dati del seed. Esempio POST piatto:
```json
{
  "nome": "Pizza Margherita",
  "prezzo": 8.50,
  "CategoriaId": 2,
  "ingredientiIds": [1, 2, 3, 17]
}
```

Uso in Postman:
1. `File > Import > postman/ristorante.json`.
2. Assicurati che il server sia avviato (`npm start`).
3. Esegui le richieste una alla volta o tutta la collection con Runner.

---

## Regole d'oro riassunte

1. **Layering rigoroso**: routes → controllers → services → models. Ogni layer
   parla solo con quello subito sotto.
2. **`req`/`res`** stanno **solo** nei controller. I service non li conoscono.
3. **Rotte statiche prima delle dinamiche** (`/search` prima di `/:id`).
4. **404** = risorsa non trovata. **400** = input invalido. **204** = successo
   senza contenuto. **201** = creato.
5. **Messaggi di errore letterali** come da traccia.
6. **Include con `through: { attributes: [] }`** per nascondere la pivot.
7. **`setIngredienti([...])`** per gestire la pivot: fa DELETE + INSERT in
   automatico, evita bug.
8. **`ON DELETE CASCADE`** sulla pivot, **niente CASCADE** dalla categoria
   (dobbiamo bloccare la DELETE, non propagarla).
9. **`bigIntAsNumber: true`** nel config Sequelize per evitare crash su
   serializzazione JSON.
10. **`dotenv.config()` per prima riga** in `server.js` e nel config del DB.
