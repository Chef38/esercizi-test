# Note per l'esame — memo pratico

File di studio personale, **non fa parte della consegna**.
Rileggerlo prima della prova e tenerlo aperto durante lo svolgimento.

Progetto di riferimento: **biblioteca** (Node/Express/Sequelize/MariaDB).
Traccia originale: FastAPI/Python, versione JavaScript autorizzata dal docente.

**Architettura scelta**: `routes → controller (con validator) → service (con query DB) → model → DB`.
Validator e repository sono stati **assorbiti** rispettivamente nei controller e nei service, per avere meno file da adattare all'esame.

---

## 1. Prima di scrivere una riga di codice

- Leggere **tutta** la traccia due volte.
- Sottolineare/segnare:
  - Numero esatto di endpoint richiesti (la traccia biblioteca ne chiede **15**).
  - Le **entità** e le **cardinalità** (biblioteca: Categoria→Libro molti-a-uno, Libro↔Autore **molti-a-molti**).
  - **Messaggi di errore letterali** (es. "Impossibile eliminare: esistono libri associati a questa categoria.", "Uno o più autori non esistono.") — vanno copiati carattere per carattere, punto e maiuscole comprese.
  - Codici HTTP richiesti (200 / 201 / 204 / 400 / 404 / 422).
  - Se la tabella pivot ha attributi propri o è pivot pura (biblioteca: pura, solo `id_libro` + `id_autore`).
  - Tipi dei campi (INTEGER vs FLOAT, BOOLEAN default true).
- Disegnare su carta il diagramma ER prima di aprire il codice.

---

## 2. Workflow: come riusare i vecchi esercizi

1. **Copiare** una cartella di esercizio già funzionante (`biblioteca` è quella di riferimento) e rinominarla — mai partire da zero.
2. Modificare **un livello per volta**, testando dopo ognuno:
   1. `.env` → nome DB nuovo, utente e password del proprio ambiente.
   2. Creare il DB vuoto in HeidiSQL: `CREATE DATABASE nome CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;`
   3. `models/` (una tabella = un file) + `models/index.js` per le associazioni.
   4. `server.js` con `sync({ force: true })` la **prima volta** per creare tabelle e pivot.
   5. `npm start`. Deve stampare "✅ Connessione al database riuscita." Se non parte qui, il problema è nei modelli o nella connessione, **non nelle rotte**.
   6. Rimettere `sync({ force: false })` per non perdere i dati.
   7. `node scripts/scripts.js` per popolare il DB.
   8. `routes/` + `controllers/` **una risorsa alla volta**, testando ogni endpoint da `test.http` o Postman **prima** di passare alla successiva.
3. **File `test.http`** già pronto → modificarlo, non farlo da zero. Cambiare solo body e ids.

---

## 3. Trappole classiche (le più costose)

### Ordine delle rotte
Rotte statiche (`/search`, `/disponibili`) **sempre prima** di `/:id`, altrimenti Express intercetta il segmento statico come valore del parametro.

```js
router.get('/search',      controller.search);        // OK, prima di /:id
router.get('/disponibili', controller.getDisponibili); // OK, prima di /:id
router.get('/:id',         controller.getById);       // OK, per ultimo
```

### Relazione many-to-many con pivot pura
Basta il modello della pivot con le due FK come PK composta. Le associazioni si dichiarano con `belongsToMany` sui **due lati** con `through`:

```js
Libro.belongsToMany(Autore,  { through: LibroAutore, foreignKey: 'id_libro',  otherKey: 'id_autore', as: 'autori' });
Autore.belongsToMany(Libro,  { through: LibroAutore, foreignKey: 'id_autore', otherKey: 'id_libro',  as: 'libri'  });
```

Sequelize genera in automatico i metodi `libro.setAutori([...])`, `libro.addAutore(id)`, `libro.getAutori()`. Nel `create`/`update` del service uso `libro.setAutori(autori_ids)` per popolare la pivot in un colpo solo.

### `through: { attributes: [] }`
Negli include, senza questa riga il JSON di risposta contiene anche le colonne della pivot (`id_libro`, `id_autore`) ripetute in ogni autore/libro. Sporca l'output. Sempre presente in `INCLUDE_COMPLETO`.

### `field: 'nome_reale'` per colonne con nomi diversi
Nel modello Autore la colonna DB si chiama `nazionalità` (con accento) → in JS uso `nazionalita` con `field: 'nazionalità'`. Trucco fondamentale se lo schema DB non è camelCase.

### Ordine in `server.js`
`require('dotenv').config()` DEVE essere la **prima riga**, altrimenti `config/database.js` legge `process.env` vuoti e la connessione fallisce con "Access denied" o "unknown database".

### `Op.like`
MariaDB con collation `utf8mb4_general_ci` è già case-insensitive di default. `where: { titolo: { [Op.like]: `%${q}%` } }` funziona senza bisogno di `LOWER()`. Verificare la collation del proprio DB.

### 404 vs 400 vs 422
- **404** = risorsa cercata non esiste (id inesistente, autore in `autori_ids` che non c'è).
- **400** = regola di business violata (delete categoria che ha libri).
- **422** = dati in ingresso malformati (titolo mancante, `autori_ids` non è un array).
Non confonderli — al prof piace vedere la distinzione netta.

### Whitelist campi negli update
Nel service:
```js
const campiAmmessi = ['titolo', 'isbn', 'annoPubblicazione', 'prezzo', 'disponibile', 'categoriaId'];
campiAmmessi.forEach(c => { if (datiNuovi[c] !== undefined) libro[c] = datiNuovi[c]; });
```
Serve a evitare **mass-assignment**: se il client manda `{"id": 999}` non deve poter cambiare l'id.

### `reload()` dopo create/update
Dopo `Libro.create()` e `libro.setAutori()`, l'istanza in memoria non ha le relazioni popolate. Il `libro.reload({ include: INCLUDE_COMPLETO })` rifà una SELECT con JOIN e restituisce l'oggetto completo. Senza `reload` il client riceverebbe un libro senza `categoria` e senza `autori`.

### Autori inesistenti in `autori_ids` → 404
La traccia (§5, endpoint 9) impone: "se uno degli ID autori non esiste, restituire HTTP 404". Nel service:
```js
const autori = await autoreService.findByIds(autori_ids);
if (autori.length !== autori_ids.length) throw { status: 404, message: 'Uno o più autori non esistono.' };
```

### Messaggio letterale DELETE categoria
La traccia impone il testo **esatto**: `"Impossibile eliminare: esistono libri associati a questa categoria."`. Copiarlo carattere per carattere. Punto finale compreso.

---

## 4. Cheat-sheet Sequelize per l'esame

| Cosa | Sintassi | Note |
|------|----------|------|
| Trova per id | `Model.findByPk(id)` | Restituisce `null` se non esiste |
| Trova con JOIN | `Model.findByPk(id, { include: [{ model, as }] })` | `as` DEVE combaciare con l'associazione |
| Trova tutti | `Model.findAll({ where, include })` | Restituisce array |
| Trova per lista di id | `Model.findAll({ where: { id: { [Op.in]: ids } } })` | Verifica esistenza multipla |
| Ricerca `LIKE` | `where: { titolo: { [Op.like]: `%${q}%` } }` | Case-insensitive con collation `_ci` |
| Inner join filtrato | `include: [{ model, as, where: {...}, required: true }]` | `required:true` = INNER JOIN |
| Crea | `Model.create(dati)` | INSERT + SELECT (torna l'istanza) |
| Salva modifiche | `istanza.save()` | UPDATE sulla riga |
| Elimina | `istanza.destroy()` | DELETE per id |
| Ricarica con JOIN | `istanza.reload({ include })` | Utile dopo `setAutori` |
| Pivot: sostituire | `libro.setAutori([1,2,3])` | Riscrive `libro_autore` |
| Pivot: aggiungere | `libro.addAutore(id)` | INSERT nella pivot |
| Pivot: rimuovere | `libro.removeAutore(id)` | DELETE dalla pivot |
| Nascondere colonne pivot | `through: { attributes: [] }` | Ripulisce il JSON |

---

## 5. Cheat-sheet status HTTP

| Codice | Quando | Come farlo |
|--------|--------|------------|
| 200 | GET/PUT ok | `res.json(...)` default |
| 201 | POST create ok | `res.status(201).json(...)` |
| 204 | DELETE ok | `res.status(204).send()` senza body |
| 400 | Regola di business violata | `throw { status: 400, message: '...' }` nel service |
| 404 | Risorsa non trovata | `throw { status: 404, message: '...' }` nel service |
| 422 | Validazione fallita | `res.status(422).json({ errori })` dopo il validator |
| 500 | Errore imprevisto | Fallback nel catch del controller |

---

## 6. Domande tipiche dell'orale (preparare risposte a voce)

1. **Perché `belongsToMany` e non due `hasMany`?**
   → Perché la relazione libro↔autore è simmetrica: un libro ha molti autori E un autore molti libri. `belongsToMany` genera la tabella pivot e i metodi `setAutori`/`addAutore` per gestire le associazioni. Con due `hasMany` avrei bisogno di una FK diretta, che non basta per il molti-a-molti.

2. **A cosa serve `libro.setAutori([1, 2, 3])`?**
   → È un metodo generato automaticamente da Sequelize quando dichiaro `belongsToMany`. Riscrive **completamente** la tabella pivot `libro_autore` con gli id passati: elimina le vecchie righe che non sono più nella lista e aggiunge quelle nuove. Utile per POST/PUT.

3. **Perché `through: { attributes: [] }` negli include?**
   → Per non includere le colonne della tabella pivot nel JSON di risposta. Senza, ogni autore avrebbe un campo `LibroAutore: { id_libro, id_autore }` inutile e sporca l'output. La relazione basta esprimerla come array `autori: [...]`.

4. **Perché `/search` prima di `/:id`?**
   → Express valuta le rotte nell'ordine di dichiarazione. Se `/:id` è prima, una richiesta a `/api/libri/search` matcha `/:id` con `id = "search"` e la rotta di ricerca non viene mai raggiunta.

5. **Differenza tra 400, 404 e 422?**
   → **404** = risorsa cercata non esiste (id sbagliato). **400** = la richiesta è formalmente valida ma viola una regola di business (delete categoria con libri collegati). **422** = i dati inviati sono malformati (campo obbligatorio mancante, tipo sbagliato).

6. **Perché il validator è dentro il controller e non separato?**
   → Per snellire la struttura all'esame. Concettualmente sono responsabilità diverse (il validator controlla la **forma** dei dati — obbligatorietà, tipo, formato — mentre il controller adatta HTTP), ma sono così legate che tenerle nello stesso file riduce i salti tra file senza confondere la logica. Le regole di business restano invece nel service, che non tocca `req`/`res`.

6-bis. **E perché il repository è dentro il service?**
   → Stessa logica: in un progetto d'esame con 15 endpoint la separazione repository↔service aggiunge boilerplate senza benefici. Il service importa direttamente i modelli e fa le query. In un progetto reale con DB intercambiabili o test estesi manterrei il repository separato.

7. **Perché `app.js` è separato da `server.js`?**
   → `app.js` costruisce ed esporta l'app Express senza aprire alcuna porta. `server.js` importa `app`, verifica la connessione al DB e chiama `app.listen`. Il vantaggio: `app` può essere importato nei test senza avviare il server.

8. **Cos'è un middleware in Express?**
   → Una funzione con firma `(req, res, next)` che intercetta ogni richiesta prima che arrivi al controller. Esempi: `express.json()` fa il parsing del body, il logger stampa le richieste, l'error handler ha firma `(err, req, res, next)` e cattura gli errori non gestiti.

9. **Cos'è `async/await`?**
   → Sintassi sopra le Promise per scrivere codice asincrono in modo sequenziale. `await` "aspetta" che una Promise si risolva prima di continuare, senza bloccare il thread principale (Node.js resta libero di gestire altre richieste). Rende leggibile un'operazione altrimenti fatta con `.then()` annidati.

10. **Perché `Op.like` funziona case-insensitive in MariaDB?**
    → Perché la collation di default `utf8mb4_general_ci` (o `_unicode_ci`) è **case-insensitive**. Il `_ci` finale significa "case insensitive". Se il DB usasse `_bin` o `_cs` servirebbe `LOWER()` su entrambi i lati.

11. **Cosa fa `reload({ include })` dopo la create?**
    → Fa una nuova SELECT sulla riga appena creata caricando anche le relazioni (categoria, autori). Senza `reload`, l'istanza in memoria contiene solo i campi diretti del libro, non le relazioni popolate.

12. **Perché la whitelist dei campi nell'update del service?**
    → Per evitare **mass-assignment**: se il client mandasse `{"id": 9999, "titolo": "..."}`, senza whitelist Sequelize aggiornerebbe anche l'id. La whitelist assicura che solo campi controllati possano essere modificati.

---

## 7. Regola d'oro

Se copi codice da un vecchio esercizio, **rileggi ogni riga e chiediti "perché è così"**.
Il prof sa che riusi materiale — quello che valuta è se capisci cosa hai copiato.

La nota nella traccia lo dice esplicitamente: *"Il docente si riserva di richiedere la spiegazione di qualsiasi parte del codice consegnato."*
