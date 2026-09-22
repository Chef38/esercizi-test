# Salone di Parrucchiere — Backend REST API

Backend REST **di sola lettura** per la gestione di un salone di parrucchiere.
Stack: **Node.js 20+**, **Express 4**, **Sequelize 6**, **MariaDB**.

Tutti gli endpoint sono `GET` e ognuno usa almeno una funzione SQL di
concatenazione, conversione o aggregazione direttamente nella query.

---

## Struttura del progetto

```
salone-parrucchiere/
├── server.js                  # entry point: avvia il server + connessione DB
├── app.js                     # crea e configura l'app Express (esportata)
├── config/
│   └── database.js            # connessione Sequelize + MariaDB
├── controllers/               # gestione HTTP: leggono la richiesta e rispondono
│   ├── clientiController.js
│   ├── serviziController.js
│   └── statisticheController.js
├── services/                  # logica di accesso ai dati (le query Sequelize)
│   ├── clientiService.js
│   ├── serviziService.js
│   └── statisticheService.js
├── models/
│   ├── index.js               # carica modelli e associazioni
│   ├── Cliente.js
│   ├── Servizio.js
│   └── Prenotazione.js        # tabella associativa (modello esplicito)
├── routes/                    # definizione rotte: delegano ai controller
│   ├── clienti.js
│   ├── servizi.js
│   └── statistiche.js
├── sql/
│   ├── create_tables.sql
│   └── seed_data.sql
├── postman/
│   └── salone_parrucchiere.json
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
DB_NAME=salone_parrucchiere
DB_USER=root
DB_PASSWORD=la_tua_password
PORT=3000
```

## 4. Creazione e popolamento del database

Crea il database (se non lo fai negli script), poi esegui i due file SQL:

```bash
# esempio da terminale
mysql -u root -p salone_parrucchiere < sql/create_tables.sql
mysql -u root -p salone_parrucchiere < sql/seed_data.sql
```

> Gli script sono eseguibili su un DB pulito. `create_tables.sql` usa
> `IF NOT EXISTS`, quindi è ripetibile.

## 5. Avvio del server

```bash
npm start
# oppure, con auto-reload durante lo sviluppo:
npm run dev
```

Il server risponde su `http://localhost:3000`.

---

## 6. Endpoint

| # | Metodo | URL | Descrizione |
|---|--------|-----|-------------|
| 1 | GET | `/api/clienti` | Lista clienti con nome completo concatenato |
| 2 | GET | `/api/clienti/:id` | Dettaglio cliente con età calcolata e servizi svolti |
| 3 | GET | `/api/clienti/ricerca?q=...` | Ricerca clienti per nome o cognome |
| 4 | GET | `/api/servizi` | Lista servizi con durata e prezzo formattati |
| 5 | GET | `/api/servizi/:id` | Dettaglio servizio con valutazione media |
| 6 | GET | `/api/statistiche/servizi-popolari` | Classifica servizi per prenotazioni e incasso |

Codici: `200` successo, `404` risorsa inesistente, `400` parametro `q` mancante.

La collection Postman è in `postman/salone_parrucchiere.json` (usa la variabile
`baseUrl` = `http://localhost:3000`).

---

## 7. Note tecniche (le parti "non ovvie")

Queste sono le decisioni chiave del progetto, utili anche per spiegarle a voce.

### Separazione rotte / controller / service / model
Il progetto è diviso in livelli con responsabilità distinte (dal più esterno al
più interno: **routes → controllers → services → models**):
- **`routes/`** dichiara solo *quali* URL esistono e a *quale* funzione
  corrispondono. Sono file corti e leggibili.
- **`controllers/`** gestisce la parte **HTTP**: legge parametri e query dalla
  richiesta, valida l'input (es. il `q` obbligatorio → 404/400), chiama il
  service e imposta la risposta con lo status code corretto. Non contiene query.
- **`services/`** contiene la **logica di accesso ai dati**: qui vivono le query
  Sequelize. Un service non conosce `req`/`res`: riceve dati semplici e
  restituisce dati (o `null` quando qualcosa non esiste), lasciando al controller
  la decisione su come rispondere.
- **`models/`** definisce le tabelle e le associazioni.
- **`app.js`** costruisce l'app Express (middleware + montaggio dei router) e la
  **esporta**, senza aprire alcuna porta.
- **`server.js`** è l'**entry point**: importa `app`, verifica la connessione al
  DB e chiama `app.listen(...)`.

Il vantaggio: ogni livello ha un solo compito. Se domani cambia una query, tocchi
solo il service; se cambia il formato della risposta HTTP, tocchi solo il
controller. E l'app resta importabile nei test senza far partire il server.

### Perché `Prenotazione` è un modello a sé stante
La tabella associativa ha **attributi propri** (`dataAppuntamento`,
`valutazione`), non solo le due chiavi esterne. Per poterli leggere va definita
come modello e passata come `through` esplicito:
```js
Cliente.belongsToMany(Servizio, { through: Prenotazione });
```
Così, includendo `Servizio` in una query su `Cliente`, ogni risultato porta con
sé l'oggetto `Prenotazione` con i suoi campi.

### `fn`, `col`, `literal`
- `fn('CONCAT', col('nome'), ' ', col('cognome'))` → chiama una funzione SQL
  passando colonne in modo sicuro (Sequelize fa l'escape dei nomi).
- `literal("CONCAT(FLOOR(durataMinuti/60), 'h ', ...)")` → SQL grezzo, usato
  quando servono espressioni più libere (divisione intera, modulo, FORMAT).
  Da usare solo con stringhe che scrivi tu, mai con input dell'utente.
- `TIMESTAMPDIFF(YEAR, ...)` richiede `literal('YEAR')` perché `YEAR` è una
  parola chiave (unità di misura), non una stringa.

### Ordine delle rotte: `/ricerca` prima di `/:id`
Express valuta le rotte dall'alto verso il basso. Se `/:id` fosse dichiarata
prima, una richiesta a `/api/clienti/ricerca` finirebbe lì con `id = "ricerca"`.
Per questo in `routes/clienti.js` la rotta di ricerca viene **prima** del
dettaglio per id.

### Endpoint 5 e 6: due query o GROUP BY
- Nell'endpoint 5 le statistiche (`COUNT`, `AVG`) e l'elenco dei clienti hanno
  esigenze opposte (aggregazione vs tutte le righe), quindi si fanno due query
  separate e si uniscono in JSON.
- Nell'endpoint 6 si parte da `Servizio` con `LEFT JOIN` sulle prenotazioni,
  `GROUP BY Servizio.id`, e si ordina per il conteggio in modo decrescente. Il
  `LEFT JOIN` fa comparire anche i servizi con 0 prenotazioni.

### Serializzazione di `COUNT`/`SUM`
Le funzioni di aggregazione restituiscono `BIGINT`. Senza l'opzione
`bigIntAsNumber: true` (in `config/database.js`) il driver mariadb le ritorna
come `BigInt`, che `JSON.stringify` non sa serializzare e farebbe crashare la
risposta. Con quell'opzione tornano come normali numeri.

### Perché niente `sequelize.sync()`
Le tabelle sono create dagli script SQL (come richiesto). L'app si limita a
`sequelize.authenticate()` per verificare la connessione, senza toccare lo schema.
