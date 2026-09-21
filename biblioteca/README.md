# Biblioteca REST API

REST API per la gestione di una biblioteca, sviluppata in **Node.js / Express / Sequelize** su **MariaDB/MySQL**.

Realizzata come esercizio d'esame IFTS (traccia originale FastAPI, autorizzata versione JavaScript).

---

## Requisiti

- Node.js 18+
- MariaDB o MySQL 5.7+

---

## Installazione

```bash
# 1. Clona il repository
git clone <url-repo>
cd biblioteca

# 2. Installa le dipendenze
npm install

# 3. Configura .env (esempio)
```

**File `.env` alla radice del progetto**:
```
DB_NAME=biblioteca
DB_USER=root
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=3306
DB_DIALECT=mysql
DB_LOGGING=false
PORT=3000
```

---

## Creazione database

Nel DB MariaDB/MySQL crea prima il database vuoto:
```sql
CREATE DATABASE biblioteca CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

Poi le tabelle vengono create automaticamente da Sequelize all'avvio (`sync`).

### ⚠️ Se stai aggiornando da una versione precedente
Nel modello Libro↔Autore la relazione è passata da **molti-a-uno** a **molti-a-molti**. Devi:

```sql
-- Drop della vecchia FK diretta
ALTER TABLE libro DROP FOREIGN KEY <nome_vincolo_autore>;
ALTER TABLE libro DROP COLUMN autore;

-- La tabella libro_autore viene creata da Sequelize al primo sync
```

Oppure, se non hai dati importanti:
```js
// in server.js, cambia temporaneamente:
await sequelize.sync({ force: true });  // ⚠️ CANCELLA TUTTO
```
poi lancia il seed e rimetti `force: false`.

---

## Popolamento dati di esempio

```bash
node scripts/scripts.js
```

Inserisce: 5 categorie, 14 autori, 14 libri.

---

## Avvio

```bash
npm start
```

Il server risponde su `http://localhost:3000`.

---

## Struttura del progetto

```
biblioteca/
├── server.js              # Avvio del server
├── app.js                 # Configurazione Express
├── config/
│   └── database.js        # Connessione Sequelize
├── models/
│   ├── index.js           # Associazioni tra modelli
│   ├── categoria.model.js
│   ├── autore.model.js
│   ├── libri.model.js
│   └── libro_autore.model.js  # Tabella pivot per many-to-many
├── repository/            # Solo query DB
├── service/               # Logica di business
├── validator/             # Validazione input
├── controllers/           # Handler HTTP
├── routes/                # Definizione endpoint
└── scripts/
    └── scripts.js         # Popolamento DB
```

**Architettura a strati**:
`routes → controller → validator → service → repository → model → DB`

---

## Endpoint disponibili

Base URL: `http://localhost:3000/api`

### Categorie
| Metodo | URL | Descrizione |
|---|---|---|
| GET | `/categorie` | Elenco categorie |
| GET | `/categorie/:id` | Dettaglio |
| POST | `/categorie` | Crea |
| PUT | `/categorie/:id` | Aggiorna |
| DELETE | `/categorie/:id` | Elimina (solo se senza libri) |
| GET | `/categorie/:id/libri` | Libri di una categoria |

### Autori
| Metodo | URL | Descrizione |
|---|---|---|
| GET | `/autori` | Elenco (con i loro libri) |
| GET | `/autori/:id` | Dettaglio |
| POST | `/autori` | Crea |
| PUT | `/autori/:id` | Aggiorna |
| DELETE | `/autori/:id` | Elimina |

### Libri
| Metodo | URL | Descrizione |
|---|---|---|
| GET | `/libri` | Elenco (con categoria + autori) |
| GET | `/libri/:id` | Dettaglio |
| POST | `/libri` | Crea (accetta `autori_ids: []`) |
| PUT | `/libri/:id` | Aggiorna |
| DELETE | `/libri/:id` | Elimina |
| GET | `/libri/search?q=...` | Ricerca titolo (case-insensitive) |
| GET | `/libri/disponibili` | Solo libri disponibili |

---

## Esempio di richiesta

**Crea un libro con più autori**:
```http
POST /api/libri
Content-Type: application/json

{
  "titolo": "Il nome della rosa",
  "isbn": "9788845292613",
  "annoPubblicazione": 1980,
  "prezzo": 15.00,
  "disponibile": true,
  "categoriaId": 3,
  "autori_ids": [1, 2]
}
```

**Risposta** (`201 Created`):
```json
{
  "id": 15,
  "titolo": "Il nome della rosa",
  "isbn": "9788845292613",
  "annoPubblicazione": 1980,
  "prezzo": 15.00,
  "disponibile": true,
  "categoriaId": 3,
  "categoria": { "id": 3, "nome": "Classici", "descrizione": "..." },
  "autori": [
    { "id": 1, "nome": "Umberto", "cognome": "Eco", "..." },
    { "id": 2, "nome": "...", "cognome": "...", "..." }
  ]
}
```

---

## Status HTTP

| Codice | Quando |
|---|---|
| 200 | OK (GET, PUT) |
| 201 | Created (POST) |
| 204 | No Content (DELETE) |
| 400 | Regola di business violata (es. delete categoria con libri) |
| 404 | Risorsa non trovata |
| 422 | Validazione fallita |
| 500 | Errore interno |

---

## Test rapido

Nel file `test.http` (con l'estensione VS Code **REST Client**) trovi esempi
pronti da eseguire.

Autore: Giovanni Sechi
