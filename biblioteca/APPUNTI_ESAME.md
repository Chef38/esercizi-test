# APPUNTI ESAME — Biblioteca REST API (JavaScript version)

> Traccia originale: `Esercizio_FastAPI_Biblioteca.docx` (Python/FastAPI).
> **Concessione del docente**: prova in **JavaScript** (Node/Express/Sequelize).
> Il progetto `biblioteca` in questa cartella è **95% pronto**, servono solo
> modifiche puntuali per allinearlo alla traccia.

---

## 🎯 STATO DEL PROGETTO ATTUALE VS. TRACCIA

| Aspetto | Traccia | Progetto attuale | Da fare |
|---|---|---|---|
| Endpoint categorie | 3 | 3 (+1 PUT extra) | ⚠️ *decidere* se tenere il PUT |
| Endpoint autori | 4 | 5 (con DELETE) | ⚠️ *decidere* se togliere DELETE |
| Endpoint libri CRUD | 5 | 5 | ✅ OK |
| Endpoint ricerche | 3 | 3 | ✅ OK |
| **Relazione Libro↔Autore** | **Molti-a-molti** | Molti-a-uno | ❌ **DA CAMBIARE** |
| Tabella associativa | `libro_autore` | Nessuna | ❌ **DA CREARE** |
| POST /libri con `autori_ids: []` | Sì | No (un solo `autoreId`) | ❌ **DA MODIFICARE** |
| GET /libri/search case-insensitive | Sì | Sì (`Op.like`) | ✅ OK (MySQL default) |
| DELETE /categorie se ha libri → 400 | Sì | Sì | ✅ OK |
| Nomi colonne | snake_case | camelCase con `field` | ✅ OK (JS può differire) |

**Traduzione**: la modifica principale è la relazione **molti-a-molti**. Il resto è cosmetico.

---

## 1. GLI ENDPOINT DELLA TRACCIA (15 esatti)

### Categorie (3)
| # | Metodo | URL | Stato progetto |
|---|---|---|---|
| 1 | GET | `/categorie` | ✅ presente |
| 2 | POST | `/categorie` | ✅ presente |
| 3 | DELETE | `/categorie/{id}` (solo se senza libri, 400 sennò) | ✅ presente |

> Il progetto ha in più: `GET /categorie/:id` e `PUT /categorie/:id`.
> Non è un problema (endpoint in più non tolgono punti), ma **puoi lasciarli
> o rimuoverli** per aderire ai 15 esatti.

### Autori (4)
| # | Metodo | URL | Stato progetto |
|---|---|---|---|
| 4 | GET | `/autori` | ✅ presente |
| 5 | POST | `/autori` | ✅ presente |
| 6 | GET | `/autori/{id}` con lista libri | ✅ presente (repo fa già il JOIN) |
| 7 | PUT | `/autori/{id}` | ✅ presente |

> Il progetto ha in più: `DELETE /autori/:id`. Puoi lasciarlo o toglierlo.

### Libri CRUD (5)
| # | Metodo | URL | Stato progetto |
|---|---|---|---|
| 8 | GET | `/libri` (con categoria + autori) | ⚠️ presente, ma restituisce UN autore |
| 9 | POST | `/libri` (con `autori_ids: []`) | ❌ da rifare per M2M |
| 10 | GET | `/libri/{id}` (dettaglio) | ⚠️ come sopra |
| 11 | PUT | `/libri/{id}` | ⚠️ da adattare per M2M |
| 12 | DELETE | `/libri/{id}` | ✅ presente |

### Ricerche (3)
| # | Metodo | URL | Stato progetto |
|---|---|---|---|
| 13 | GET | `/libri/search?q=...` case-insensitive | ✅ presente |
| 14 | GET | `/libri/disponibili` | ✅ presente |
| 15 | GET | `/categorie/{id}/libri` | ✅ presente |

---

## 2. LA MODIFICA CHIAVE: MOLTI-A-MOLTI

### 2.1 Schema DB da adottare

Attualmente `libro.autore` è una **FK diretta**. Devi:

1. **Rimuovere** la colonna `autore` dalla tabella `libro`
2. **Creare** una tabella associativa `libro_autore`:
   ```sql
   CREATE TABLE libro_autore (
     id_libro  INT NOT NULL,
     id_autore INT NOT NULL,
     PRIMARY KEY (id_libro, id_autore),
     FOREIGN KEY (id_libro)  REFERENCES libro(id),
     FOREIGN KEY (id_autore) REFERENCES autore(id)
   );
   ```

### 2.2 Modifiche a `models/libri.model.js`

Rimuovi il campo `autoreId`:

```js
// PRIMA (da cancellare):
autoreId: {
  type:      DataTypes.INTEGER(11),
  allowNull: true,
  field:     'autore',
},

// DOPO: niente autoreId nel modello Libro.
```

### 2.3 Nuovo modello `models/libro_autore.model.js`

```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tabella pivot senza attributi extra: Sequelize la gestisce
// automaticamente tramite belongsToMany + through.
const LibroAutore = sequelize.define('LibroAutore', {
  id_libro:  { type: DataTypes.INTEGER, primaryKey: true },
  id_autore: { type: DataTypes.INTEGER, primaryKey: true },
}, {
  tableName:  'libro_autore',
  timestamps: false,
});

module.exports = LibroAutore;
```

### 2.4 Modifica `models/index.js` — associazioni

```js
const sequelize   = require('../config/database');
const Categoria   = require('./categoria.model');
const Autore      = require('./autore.model');
const Libro       = require('./libri.model');
const LibroAutore = require('./libro_autore.model');

// 1-a-molti: Categoria → Libro (invariato)
Categoria.hasMany(Libro,   { foreignKey: 'categoriaId', as: 'libri' });
Libro.belongsTo(Categoria, { foreignKey: 'categoriaId', as: 'categoria' });

// ★★★ MOLTI-A-MOLTI: Libro ↔ Autore tramite libro_autore ★★★
Libro.belongsToMany(Autore, {
  through:    LibroAutore,
  foreignKey: 'id_libro',
  otherKey:   'id_autore',
  as:         'autori',   // libro.autori (array!)
});
Autore.belongsToMany(Libro, {
  through:    LibroAutore,
  foreignKey: 'id_autore',
  otherKey:   'id_libro',
  as:         'libri',    // autore.libri (array!)
});

module.exports = { sequelize, Categoria, Autore, Libro, LibroAutore };
```

### 2.5 Aggiorna `repository/libro.repository.js`

L'`INCLUDE_COMPLETO` deve caricare gli **autori** (array), non un singolo autore:

```js
const INCLUDE_COMPLETO = [
  { model: Categoria, as: 'categoria' },
  {
    model: Autore,
    as:    'autori',
    through: { attributes: [] }, // non includere i campi della pivot
  },
];
```

### 2.6 Aggiorna `service/libro.service.js` — create e update

```js
// CREATE
create: async ({ titolo, isbn, annoPubblicazione, prezzo, disponibile, categoriaId, autori_ids = [] }) => {
  // Verifica che categoria esista
  if (categoriaId) {
    const cat = await categoriaRepo.findById(categoriaId);
    if (!cat) throw { status: 404, message: `Categoria con id=${categoriaId} non trovata.` };
  }

  // Verifica che TUTTI gli autori esistano
  if (autori_ids.length > 0) {
    const autori = await Autore.findAll({ where: { id: autori_ids } });
    if (autori.length !== autori_ids.length) {
      throw { status: 404, message: 'Uno o più autori non esistono.' };
    }
  }

  // Crea il libro
  const libro = await libroRepo.create({
    titolo, isbn, annoPubblicazione, prezzo,
    disponibile: disponibile !== undefined ? disponibile : true,
    categoriaId,
  });

  // Collega gli autori tramite la tabella pivot
  if (autori_ids.length > 0) {
    await libro.setAutori(autori_ids); // metodo generato da belongsToMany
  }

  return libroRepo.reload(libro);
},

// UPDATE
update: async (id, datiNuovi) => {
  const libro = await libroRepo.findByIdSemplice(id);
  if (!libro) throw { status: 404, message: 'Libro non trovato.' };

  // Verifica categoria se cambia
  if (datiNuovi.categoriaId) {
    const cat = await categoriaRepo.findById(datiNuovi.categoriaId);
    if (!cat) throw { status: 404, message: `Categoria con id=${datiNuovi.categoriaId} non trovata.` };
  }

  // Verifica autori se passati
  if (datiNuovi.autori_ids) {
    const autori = await Autore.findAll({ where: { id: datiNuovi.autori_ids } });
    if (autori.length !== datiNuovi.autori_ids.length) {
      throw { status: 404, message: 'Uno o più autori non esistono.' };
    }
  }

  const campiAmmessi = ['titolo', 'isbn', 'annoPubblicazione', 'prezzo', 'disponibile', 'categoriaId'];
  campiAmmessi.forEach(campo => {
    if (datiNuovi[campo] !== undefined) libro[campo] = datiNuovi[campo];
  });

  await libroRepo.save(libro);

  // Se sono passati autori_ids, aggiorna la pivot
  if (datiNuovi.autori_ids) {
    await libro.setAutori(datiNuovi.autori_ids);
  }

  return libroRepo.reload(libro);
},
```

`setAutori(idsArray)` è un metodo che Sequelize **genera automaticamente**
grazie a `belongsToMany`. Sovrascrive la pivot con l'elenco fornito.

### 2.7 Servizio autori: `getById` deve tornare i libri

Già ok se `INCLUDE_LIBRI` in `repository/autore.repository.js` è:

```js
const INCLUDE_LIBRI = [{
  model: Libro,
  as:    'libri',
  through: { attributes: [] },
  include: [{ model: Categoria, as: 'categoria' }],
}];
```

### 2.8 Popolamento (`scripts/scripts.js`)

Sostituisci `autoreId: X` con `autori_ids: [X, Y]` e poi:

```js
const [libro] = await Libro.findOrCreate({ where: { isbn }, defaults });
await libro.setAutori(autori_ids);
```

---

## 3. RIEPILOGO FILE DA TOCCARE

- [ ] `models/libri.model.js` → **rimuovi** `autoreId`
- [ ] `models/libro_autore.model.js` → **crea** (nuovo file)
- [ ] `models/index.js` → sostituisci hasMany/belongsTo Autore↔Libro con `belongsToMany`
- [ ] `repository/libro.repository.js` → cambia `as: 'autore'` in `as: 'autori'` con `through: { attributes: [] }`
- [ ] `repository/autore.repository.js` → `INCLUDE_LIBRI` con `through`
- [ ] `service/libro.service.js` → gestire `autori_ids` in create/update con `setAutori()`
- [ ] `validator/libro.validator.js` → (opzionale) validare che `autori_ids` sia array
- [ ] `scripts/scripts.js` → passare `autori_ids` invece di `autoreId`
- [ ] **DB**: droppa la colonna `autore` dalla tabella `libro`, crea `libro_autore`

**Comandi SQL da eseguire in HeidiSQL prima del test**:
```sql
ALTER TABLE libro DROP FOREIGN KEY nome_fk_autore;  -- se c'è
ALTER TABLE libro DROP COLUMN autore;

CREATE TABLE libro_autore (
  id_libro  INT NOT NULL,
  id_autore INT NOT NULL,
  PRIMARY KEY (id_libro, id_autore),
  FOREIGN KEY (id_libro)  REFERENCES libro(id),
  FOREIGN KEY (id_autore) REFERENCES autore(id)
);
```

Oppure lascia fare a Sequelize con `sync({ force: true })` una volta sola
(⚠️ cancella tutti i dati, poi rilancia il seed).

---

## 4. VALIDATOR DA AGGIORNARE (libro)

`validator/libro.validator.js`:

```js
validaCreazione: ({ titolo, isbn, autori_ids } = {}) => {
  const errori = [];
  if (!titolo || titolo.trim() === '') errori.push('Il campo "titolo" è obbligatorio.');
  if (!isbn   || isbn.trim()   === '') errori.push('Il campo "isbn" è obbligatorio.');
  if (autori_ids !== undefined && !Array.isArray(autori_ids)) {
    errori.push('Il campo "autori_ids" deve essere un array di ID.');
  }
  return errori;
},
```

---

## 5. NOMI CAMPI: camelCase vs snake_case

La traccia usa snake_case (`anno_pubblicazione`, `autori_ids`).
Il tuo progetto usa camelCase (`annoPubblicazione`).

**Scelta consigliata**: mantieni camelCase all'interno del codice JS (idiomatico),
ma **accetta anche snake_case** nell'input JSON se vuoi essere fedele. Ad esempio
nel controller `POST /libri` puoi accettare entrambi:

```js
const { autori_ids, autoriIds, ...resto } = req.body;
const ids = autori_ids || autoriIds || [];
```

Alternativa più semplice: fai finta di niente e usa camelCase ovunque (`autoriIds`).
Il docente probabilmente accetta perché in JS è la convenzione.

---

## 6. TEST DEGLI ENDPOINT DOPO LE MODIFICHE

Salva un file `test.http` alla radice e usa l'estensione REST Client di VS Code:

```http
### 1. Crea categoria
POST http://localhost:3000/api/categorie
Content-Type: application/json

{ "nome": "Test", "descrizione": "Categoria test" }

### 2. Crea autore
POST http://localhost:3000/api/autori
Content-Type: application/json

{ "nome": "Mario", "cognome": "Rossi", "nazionalita": "Italiana" }

### 3. Crea libro con più autori
POST http://localhost:3000/api/libri
Content-Type: application/json

{
  "titolo": "Libro Test",
  "isbn": "9999999999999",
  "annoPubblicazione": 2024,
  "prezzo": 15.0,
  "disponibile": true,
  "categoriaId": 1,
  "autori_ids": [1, 2]
}

### 4. Ricerca case-insensitive
GET http://localhost:3000/api/libri/search?q=TEST

### 5. Libri disponibili
GET http://localhost:3000/api/libri/disponibili

### 6. Libri di una categoria
GET http://localhost:3000/api/categorie/1/libri

### 7. Delete categoria con libri → deve dare 400
DELETE http://localhost:3000/api/categorie/1
```

---

## 7. CHECKLIST FINALE PRE-CONSEGNA

- [ ] Tutti e 15 gli endpoint funzionanti
- [ ] Relazione **molti-a-molti** Libri↔Autori con tabella associativa
- [ ] Status HTTP corretti: 200, 201, 204, 400, 404, 422
- [ ] Messaggio esatto DELETE categoria: `"Impossibile eliminare: esistono libri associati a questa categoria."` ✅ (già presente)
- [ ] Ricerca titolo case-insensitive (verifica con maiuscole/minuscole)
- [ ] `package.json` con script `npm start`
- [ ] `.env.example` (senza credenziali vere) per il repo
- [ ] `README.md` con istruzioni:
  - come clonare
  - come installare (`npm install`)
  - come configurare `.env`
  - come creare DB (SQL script o `sync({ force: true })`)
  - come popolare (`node scripts/scripts.js`)
  - come avviare (`npm start`)
- [ ] Repo GitHub creato + push
- [ ] `.gitignore` con `node_modules/`, `.env`, `*.log`

**Facoltativi per voto pieno**:
- [ ] Script seed con 5 categorie, 10 autori, 15 libri ✅ (già presente)
- [ ] Paginazione: `GET /libri?skip=0&limit=10`
- [ ] Middleware CORS: `npm i cors` + `app.use(cors())`

---

## 8. STRATEGIA TEMPO (se rifai da zero all'esame)

| Minuti | Fase |
|---|---|
| 0–10 | Leggere traccia + disegnare ER + segnare i 15 endpoint |
| 10–20 | Setup: `npm init`, install express/sequelize/mysql2/dotenv, `.env` |
| 20–40 | `config/database.js` + modelli con **belongsToMany** |
| 40–60 | `models/index.js` con associazioni + creazione DB |
| 60–100 | Repository + Service per le 3 entità |
| 100–130 | Controller + Routes + Validator |
| 130–150 | Test manuale con REST Client / Postman |
| 150–170 | Fix bug + endpoint di ricerca |
| 170–180 | README + commit + push |

**Se invece adatti il progetto esistente**: bastano **40–60 minuti** per fare
le modifiche del §3 (many-to-many) + test.

---

## 9. DOMANDE GUIDATE (§9 della traccia) — RISPOSTE PER JS

1. **Molti-a-molti in Sequelize?**
   Si usa `belongsToMany` con `through: 'nomeTabella'` (o modello). Sequelize crea/usa
   la tabella associativa e genera i metodi `set/add/remove` per l'entità:
   `libro.setAutori([1,2,3])`, `libro.addAutore(4)`, ecc.

2. **Differenza tra input e output?**
   Nel POST/PUT accetti solo i campi che il client può fornire (senza id, senza relazioni
   annidate — solo gli `autori_ids`). Nel GET restituisci l'oggetto completo con id e
   relazioni caricate via `include`.

3. **`from_attributes` equivalente in Sequelize?**
   In Sequelize non serve: le istanze sono già serializzabili in JSON con `res.json(obj)`.
   Il concetto analogo è `include`, che dice a Sequelize di caricare le relazioni.

4. **Cancellazione con FK collegate?**
   Sequelize (o il DB) lancia un errore di integrità referenziale. Va gestito nel
   service con un controllo preventivo (come fa `categoriaService.delete`).

5. **Ricerca case-insensitive?**
   MySQL/MariaDB con collation `utf8mb4_general_ci` (default) fa LIKE case-insensitive.
   In caso di dubbio: `where: { titolo: { [Op.like]: sequelize.literal(`LOWER('%${q}%')`) } }`
   oppure `fn('LOWER', col('titolo'))`.

---

## 10. AVVERTENZA (dalla traccia)

> L'uso di soluzioni generate automaticamente da IA senza comprensione del codice
> è considerato disonestà accademica. Il docente si riserva di richiedere la spiegazione
> di qualsiasi parte del codice.

**Come prepararti a spiegare**:
- Leggi tutti i commenti nel progetto (li abbiamo scritti insieme).
- Prova a spiegare a voce ogni file (server → app → routes → controller → service → repo → model).
- Punti che il prof potrebbe chiederti:
  - **Perché la validazione è separata dal service?** → Separation of concerns
  - **Cos'è un middleware in Express?** → funzione (req,res,next), viene eseguita per ogni richiesta
  - **Cos'è belongsToMany?** → many-to-many con tabella pivot
  - **Perché la whitelist campi in update?** → mass-assignment
  - **Cos'è async/await?** → sintassi sopra le Promise per rendere leggibile il codice asincrono
  - **Cos'è un JOIN?** → operazione SQL che unisce righe di due tabelle correlate

**In bocca al lupo!** 🚀
