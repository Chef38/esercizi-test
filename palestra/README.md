# Palestra — Backend REST API

Backend REST per la gestione di una **palestra** (sale, corsi, iscritti).
Stack: **Node.js 20+**, **Express 4**, **Sequelize 6**, **MariaDB**.

Il progetto espone **15 endpoint** organizzati in tre risorse (Sale, Iscritti,
Corsi) piu' alcune interrogazioni avanzate (ricerca per nome, corsi con posti
disponibili, corsi di una specifica sala).

---

## Modello dei dati

```
+---------+           +---------+           +-----------+
|  Sala   | 1 ---- N |  Corso  | N ---- N | Iscritto  |
+---------+           +---------+           +-----------+
                            |
                            +-- CorsoIscritto (pivot: CorsoId, IscrittoId)
```

- **Corso -> Sala**: relazione **molti-a-uno** (`Corso.belongsTo(Sala)` /
  `Sala.hasMany(Corso)`).
- **Corso <-> Iscritto**: relazione **molti-a-molti** con tabella associativa
  `CorsoIscritto` (`Corso.belongsToMany(Iscritto, { through: 'CorsoIscritto' })`
  e la reciproca).

---

## Struttura del progetto

```
palestra/
├── server.js                  # entry point: avvia il server + connessione DB
├── app.js                     # crea e configura l'app Express (esportata)
├── config/
│   └── database.js            # connessione Sequelize + MariaDB
├── routes/                    # rotte: montano validator + controller
│   ├── sale.js
│   ├── iscritti.js
│   └── corsi.js
├── validators/                # middleware di validazione input (body/query/params)
│   ├── _helpers.js
│   ├── saleValidator.js
│   ├── iscrittiValidator.js
│   └── corsiValidator.js
├── controllers/               # gestione HTTP: leggono la richiesta e rispondono
│   ├── saleController.js
│   ├── iscrittiController.js
│   └── corsiController.js
├── services/                  # logica di business (orchestrazione)
│   ├── saleService.js
│   ├── iscrittiService.js
│   └── corsiService.js
├── repositories/              # accesso ai dati (SOLO query Sequelize)
│   ├── salaRepository.js
│   ├── iscrittoRepository.js
│   └── corsoRepository.js
├── models/
│   ├── index.js               # carica modelli e definisce le associazioni
│   ├── Sala.js
│   ├── Iscritto.js
│   └── Corso.js
├── sql/
│   ├── create_tables.sql
│   └── seed_data.sql
├── postman/
│   └── palestra.json
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 1. Prerequisiti

- Node.js 20 LTS o superiore
- Un server MariaDB in esecuzione

## 2. Installazione

```bash
npm install
```

## 3. Configurazione

Copia `.env.example` in `.env` e inserisci le tue credenziali:

```bash
cp .env.example .env
```

```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=palestra
DB_USER=root
DB_PASSWORD=la_tua_password
PORT=3000
```

## 4. Creazione e popolamento del database

Crea il database (se non lo fai negli script), poi esegui i due file SQL:

```bash
# esempio da terminale
mysql -u root -p palestra < sql/create_tables.sql
mysql -u root -p palestra < sql/seed_data.sql
```

> Gli script sono eseguibili su un DB pulito. `create_tables.sql` usa
> `IF NOT EXISTS`, quindi e' ripetibile. L'ordine (`Sale`, `Iscritti`, `Corsi`,
> `CorsoIscritto`) rispetta le dipendenze fra chiavi esterne.

## 5. Avvio del server

```bash
npm start
# oppure, con auto-reload durante lo sviluppo:
npm run dev
```

Il server risponde su `http://localhost:3000`.

---

## 6. Endpoint (15)

| #  | Metodo | URL                        | Descrizione                                              | Tag      |
|----|--------|----------------------------|----------------------------------------------------------|----------|
| 1  | GET    | `/api/sale`                | Elenco di tutte le sale                                  | Sala     |
| 2  | POST   | `/api/sale`                | Crea una nuova sala                                      | Sala     |
| 3  | DELETE | `/api/sale/:id`            | Elimina una sala (solo se senza corsi associati)         | Sala     |
| 4  | GET    | `/api/iscritti`            | Elenco di tutti gli iscritti                             | Iscritto |
| 5  | POST   | `/api/iscritti`            | Crea un nuovo iscritto                                   | Iscritto |
| 6  | GET    | `/api/iscritti/:id`        | Dettaglio iscritto con i corsi frequentati               | Iscritto |
| 7  | PUT    | `/api/iscritti/:id`        | Aggiorna i dati di un iscritto                           | Iscritto |
| 8  | GET    | `/api/corsi`               | Lista corsi con sala e iscritti                          | Corso    |
| 9  | POST   | `/api/corsi`               | Crea un nuovo corso (con array `iscrittiIds`)            | Corso    |
| 10 | GET    | `/api/corsi/:id`           | Dettaglio completo di un singolo corso                   | Corso    |
| 11 | PUT    | `/api/corsi/:id`           | Modifica un corso esistente                              | Corso    |
| 12 | DELETE | `/api/corsi/:id`           | Elimina un corso dal catalogo                            | Corso    |
| 13 | GET    | `/api/corsi/search?q=...`  | Ricerca corsi per nome (LIKE, case-insensitive)          | Ricerca  |
| 14 | GET    | `/api/corsi/disponibili`   | Corsi con posti ancora disponibili (iscritti < postiMax) | Ricerca  |
| 15 | GET    | `/api/sale/:id/corsi`      | Corsi che si svolgono in una sala specifica              | Ricerca  |

Codici HTTP usati: `200` OK, `201` Created, `204` No Content, `400` Bad Request,
`404` Not Found, `500` Server Error.

La collection Postman e' in `postman/palestra.json` (usa la variabile
`baseUrl` = `http://localhost:3000`).

---

## 7. Note tecniche (le parti "non ovvie")

### Separazione a 5 layer
Dal piu' esterno al piu' interno:
**routes -> validators -> controllers -> services -> repositories -> models**.

- **`routes/`** dichiara *quali* URL esistono e monta, in ordine, i middleware
  di validazione e la funzione del controller.
- **`validators/`** sono middleware Express che controllano `body`, `query` e
  `params`. Se qualcosa non torna rispondono **400** con un messaggio esplicito;
  altrimenti chiamano `next()` e il controller riceve dati gia' "puliti".
  La logica di validazione e' fatta a mano (nessuna dipendenza esterna) tramite
  gli helper in [validators/_helpers.js](validators/_helpers.js).
- **`controllers/`** gestisce la parte **HTTP**: legge parametri e body,
  chiama il service e traduce l'esito in status code e JSON di risposta.
  **Non** valida input (lo fanno i validator) e **non** contiene query Sequelize.
- **`services/`** contiene la **logica di business** (orchestrazione):
  regole di dominio ("la sala deve esistere prima di creare un corso", "un
  iscritto puo' essere aggiornato solo su questi campi"), coordinamento fra
  piu' repository, whitelisting dei campi. Non chiama Sequelize direttamente.
- **`repositories/`** contiene le **query Sequelize** vere e proprie:
  `findAll`, `findByPk`, `create`, `count`, `destroy`, `setIscritti`, ecc.
  E' l'unico layer che parla con l'ORM. Se domani cambia database o ORM, si
  tocca solo qui.
- **`models/`** definisce le tabelle e le associazioni.
- **`app.js`** costruisce l'app Express e la **esporta**, senza aprire porte.
- **`server.js`** e' l'**entry point**: importa `app`, verifica la connessione
  al DB e chiama `app.listen(...)`.

Vantaggio: ogni cambiamento tocca un solo layer. Cambia il formato dell'input?
Solo il validator. Cambia una regola di business? Solo il service. Cambia una
query? Solo il repository.

### Ordine delle rotte in `routes/corsi.js`
Express valuta le rotte dall'alto verso il basso. `GET /api/corsi/search` e
`GET /api/corsi/disponibili` **devono** stare **prima** di `GET /api/corsi/:id`:
altrimenti Express interpreterebbe `search`/`disponibili` come valori del
parametro `:id`. Analogamente, in `routes/sale.js` la rotta `/:id/corsi` viene
prima di `DELETE /:id` per lo stesso motivo.

### Endpoint 9 (POST /api/corsi) - creazione con associazioni M:N
Il body accetta `iscrittiIds` (array opzionale). Il service:
1. Verifica che la sala esista (altrimenti 404 "Sala non trovata.").
2. Verifica che **tutti** gli id in `iscrittiIds` esistano *prima* di creare il
   corso: se anche uno solo manca, risponde 404 senza inserire nulla nel DB.
3. Crea il corso con `Corso.create(...)`.
4. Collega gli iscritti con il metodo generato da Sequelize
   `corso.setIscritti(iscrittiIds)` (popola la pivot `CorsoIscritto`).

### Endpoint 11 (PUT /api/corsi/:id) - update parziale + sostituzione degli iscritti
Il PUT aggiorna solo i campi presenti nel body (whitelist).
Se il body contiene `iscrittiIds`, chiamiamo `corso.setIscritti([...])` che
**sostituisce** l'intero insieme di iscritti: passare `[]` rimuove tutti gli
iscritti dal corso.

### Endpoint 13 - ricerca case-insensitive
Su MariaDB il `LIKE` con collation `utf8_general_ci` (o `utf8mb4_unicode_ci`) e'
gia' case-insensitive di default, quindi basta:
```js
where: { nome: { [Op.like]: `%${q}%` } }
```
Il parametro `q` e' obbligatorio: senza `q` -> 400.

### Endpoint 14 - corsi disponibili
Le opzioni erano una sub-query SQL o un filtro lato JS dopo `include: Iscritto`.
Ho scelto la seconda per leggibilita' (per una palestra i numeri sono piccoli):
prendo tutti i corsi con i loro iscritti e tengo solo quelli con
`Iscrittos.length < postiMax`. Aggiungo anche i campi calcolati
`postiOccupati` e `postiDisponibili` per comodita' del client.

### Endpoint 3 - eliminazione sala con protezione
Prima di eliminare la sala controllo con `Corso.count({ where: { SalaId: id } })`.
Se c'e' anche solo un corso associato rispondo 400 con:
> "Impossibile eliminare: esistono corsi associati a questa sala."

Il vincolo `ON DELETE RESTRICT` nella FK di `Corsi.SalaId` e' la "cintura di
sicurezza" a livello DB: anche se il controllo applicativo saltasse, il DB
rifiuterebbe comunque la cancellazione.

### `through: { attributes: [] }`
Quando includo `Iscritto` in una query su `Corso` (o viceversa) uso
`through: { attributes: [] }` per **escludere dalla risposta JSON** le colonne
interne della pivot `CorsoIscritto` (`CorsoId`, `IscrittoId`), che al client
non servono e sono gia' desumibili dall'associazione.

### Alias italiani sulle associazioni Sequelize
Per default Sequelize pluralizza i nomi in inglese: `Corso` -> `Corsos`,
`Iscritto` -> `Iscrittos`. Questo si riflette:
- sui metodi generati: `corso.setIscrittos([...])`, `sala.getCorsos()`;
- sulle proprieta' nelle risposte con `include`: `corso.Iscrittos`, `sala.Corsos`.

Un mix italiano/inglese poco leggibile. Nel file [models/index.js](models/index.js)
forziamo l'alias con l'opzione `as`:

```js
Sala.hasMany(Corso, { as: 'Corsi' });
Corso.belongsToMany(Iscritto, {
  through: 'CorsoIscritto',
  as: { singular: 'Iscritto', plural: 'Iscritti' }
});
```

Cosi' otteniamo `sala.Corsi`, `corso.Iscritti`, `corso.setIscritti([...])`.
**Regola conseguente:** quando includiamo un'associazione con alias, l'`as`
va SEMPRE ripetuto nella query, altrimenti Sequelize solleva l'errore
"You must use the 'as' keyword to reference this association":

```js
Corso.findAll({
  include: [
    { model: Sala },
    { model: Iscritto, as: 'Iscritti', through: { attributes: [] } }
  ]
});
```

### Perche' niente `sequelize.sync()`
Le tabelle sono create dagli script SQL (come richiesto dalla specifica).
L'app si limita a `sequelize.authenticate()` per verificare la connessione,
senza toccare lo schema del database.
