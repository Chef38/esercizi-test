# Guida ORALE — come SPIEGARE il codice all'esame

File di studio per la parte discussa a voce col docente.
Per la parte "come scrivere il codice" vedi `GUIDA_PRATICA.md`.
Per il commento riga-per-riga di ogni file vedi `SPIEGAZIONE_COMPLETA.md`.

Indice:

1. Regola d'oro dell'orale
2. Come rispondere ai "perche'"
3. Le 8 domande classiche + risposta pronta
4. Concetti extra da tirare fuori TU (fanno bella figura)
5. Riepilogo architettura da spiegare in 30 secondi

---

## 1. Regola d'oro dell'orale

Se copi codice da un vecchio esercizio, **rileggi ogni riga e chiediti "perche'
e' cosi'"**.

Il prof sa che riusi materiale — quello che valuta e' se capisci cosa hai copiato.
La nota nella traccia lo dice esplicitamente:
> "Il docente si riserva di richiedere la spiegazione di qualsiasi parte del
> materiale consegnato."

Ogni scelta tecnica deve essere motivabile con **il problema che risolve**, non
con "l'ho sempre fatto cosi'".

---

## 2. Come rispondere ai "perche'"

### Struttura della risposta
Usa la coppia **problema → soluzione**:
> "Se non lo facessi succederebbe X, per questo scrivo Y."

Non elencare cosa fa il codice: il prof lo vede. Elenca il **problema che eviti**.

### Se non sai una cosa
Dilla. "Non ho testato quel caso specifico, ma se dovessi farlo controllerei X."
Vale piu' di improvvisare una risposta sbagliata.

### Punti "avanzati" da tirare fuori TU
Se anticipi 2-3 concetti prima che il prof li chieda, gli fai capire che hai
capito e la discussione si sposta piu' in alto. Candidati ideali (vedi sez. 4):
- Perche' `bigIntAsNumber: true`.
- Perche' il service ritorna `{ok, code, messaggio}` invece di lanciare.
- Perche' la separazione routes → controller → service.
- Perche' `app.js` e' separato da `server.js`.
- Perche' `piatto.setIngredienti()` invece di INSERT manuali sulla pivot.

---

## 3. Le 8 domande classiche + risposta pronta

### 3.1 "Come si gestisce in Sequelize una relazione molti-a-molti?"
> Con `belongsToMany` su entrambi i lati, passando una tabella pivot come
> `through`. Se la pivot ha attributi propri va definita come modello a se',
> altrimenti Sequelize puo' anche crearla implicitamente. Sequelize genera
> automaticamente i metodi `setXxx`, `getXxx`, `addXxx`, `removeXxx` che
> gestiscono INSERT/DELETE sulla pivot senza scriverle a mano.

### 3.2 "Differenza tra `Piatto.findOne()` e `Piatto.findByPk()`?"
> `findByPk(id)` e' una scorciatoia per cercare per chiave primaria; e' piu'
> leggibile e leggermente ottimizzata. `findOne({ where })` e' generico e serve
> quando cerchi per un campo diverso dall'id. Nel progetto uso `findByPk`
> ovunque cerco per id.

### 3.3 "Perche' in Express e' importante l'ordine delle route?"
> Express valuta le rotte nell'ordine di dichiarazione: matcha la prima che
> soddisfa metodo e path. Se `/:id` fosse prima di `/search`, una richiesta a
> `/api/piatti/search` matcherebbe `/:id` con `id = "search"` e il controller
> cercherebbe un piatto con id "search" → risposta sbagliata. Per questo le
> rotte statiche vanno SEMPRE prima di quelle dinamiche.

### 3.4 "Cosa succede se elimini una categoria con piatti associati?"
> Se non gestissi il caso, il DB rifiuterebbe la DELETE per violazione del
> vincolo di FK (Piatto.CategoriaId → Categoria.id, senza ON DELETE CASCADE
> perche' non lo vogliamo qui). Sequelize propagherebbe un errore.
> Io lo gestisco a monte: nel controller, prima della DELETE, faccio
> `Piatto.count({ where: { CategoriaId: id } })` e se e' > 0 rispondo HTTP 400
> con il messaggio richiesto dalla traccia. Cosi' il client riceve un errore
> leggibile invece di un 500 tecnico.

### 3.5 "Come si implementa una ricerca case-insensitive in Sequelize?"
> Uso `where: { nome: { [Op.like]: '%q%' } }`. Su MariaDB con collation
> `utf8_general_ci` (o `utf8mb4_unicode_ci`) LIKE e' gia' case-insensitive di
> default, quindi non serve altro. Se il DB fosse configurato con collation
> binaria (`_bin`), applicherei `LOWER()` su entrambi i lati.
> La query e' anche SQL-injection safe perche' Sequelize usa parametri bindati:
> l'input dell'utente non finisce mai concatenato nella stringa SQL.

### 3.6 "Perche' usare `setIngredienti()` invece di INSERT manuali?"
> Perche' e' meno codice e meno bug. `setIngredienti([1,2,3])` sotto il cofano
> fa DELETE di tutte le associazioni esistenti + INSERT dei nuovi id in una
> sola chiamata. Se lo facessi a mano dovrei:
> 1) leggere le associazioni esistenti,
> 2) calcolare da rimuovere e da aggiungere,
> 3) fare le query giuste in ordine,
> 4) gestire il caso di rollback su errore.
> Sequelize fa tutto questo per me e la logica sta in un unico posto testato.

### 3.7 "Perche' `bigIntAsNumber: true` nel config Sequelize?"
> E' un'opzione del driver `mariadb`. Le funzioni di aggregazione (COUNT, SUM)
> restituiscono BIGINT, che il driver di default converte in `BigInt` JavaScript.
> Il problema e' che `JSON.stringify(BigInt)` **lancia un TypeError**: quindi
> `res.json(...)` crasherebbe ogni volta che restituisci un conteggio. Con
> `bigIntAsNumber: true` tornano come `Number` normali e la serializzazione
> funziona.

### 3.8 "Perche' `app.js` e' separato da `server.js`?"
> `app.js` costruisce ed esporta l'app Express senza aprire alcuna porta.
> `server.js` importa `app`, verifica la connessione al DB con `authenticate()`
> e chiama `app.listen(PORT)`.
> Il vantaggio principale e' la testabilita': in un test con Jest + Supertest
> importo `app` e faccio richieste HTTP simulate senza aprire davvero una porta.
> Bonus: `authenticate()` prima di `listen()` evita di avere un server che
> risponde a HTTP ma non ha DB.

---

## 4. Concetti extra da tirare fuori TU (fanno bella figura)

### 4.1 Perche' niente `sequelize.sync()`
> Le tabelle le crea `sql/create_tables.sql`, come richiede la traccia. `sync()`
> genererebbe uno schema alternativo (nomi pluralizzati in inglese, tipi diversi,
> nessun vincolo CHECK) che potrebbe non combaciare col nostro. Uso solo
> `authenticate()` come health check.

### 4.2 Perche' il service ritorna `{ok, code, messaggio}`
> Cosi' il controller resta lineare: un semplice `if (!risultato.ok)` traduce
> l'errore di business in status HTTP. Se il service lanciasse per errori di
> business, il controller dovrebbe avere un try/catch complesso che distingue
> "categoria mancante" (404) da "DB down" (500). Le eccezioni le uso solo per
> gli errori tecnici veri.

### 4.3 Architettura a strati (routes → controllers → services → models)
> Ogni layer parla SOLO con quello subito sotto:
> - **routes/**: solo mapping URL → funzione.
> - **controllers/**: solo HTTP (leggo req, valido, chiamo service, rispondo).
> - **services/**: solo query Sequelize (nessun riferimento a req/res).
> - **models/**: definizione dei dati e associazioni.
>
> Vantaggio: un cambio di framework HTTP non tocca i service; un cambio di ORM
> non tocca i controller. La stessa logica di business e' riutilizzabile da CLI,
> WebSocket, job schedulati.

### 4.4 `through: { attributes: [] }`
> Senza questa opzione, ogni riga di ingrediente in output includerebbe i campi
> tecnici della pivot (`PiattoIngrediente: { PiattoId, IngredienteId }`). Sono
> informazioni che il client non deve vedere: nasconderle mantiene la risposta
> pulita.

### 4.5 Chiave primaria composta della pivot
> `PRIMARY KEY (PiattoId, IngredienteId)` non e' solo un'ottimizzazione: impedisce
> automaticamente di associare due volte lo stesso ingrediente allo stesso piatto.
> Un secondo INSERT identico verrebbe rifiutato dal DB con errore di duplicato.

### 4.6 ON DELETE CASCADE — solo sulla pivot
> Sulla pivot lo metto perche' se elimino un piatto ha senso che spariscano le
> sue righe di associazione (evita orfani). Sulla FK verso Categoria NON lo metto
> perche' la traccia chiede di BLOCCARE la DELETE della categoria se ci sono
> piatti associati. Il vincolo di default (RESTRICT) fa esattamente questo.

### 4.7 Eager loading vs lazy loading (e problema N+1)
> - Eager loading: `include: [Model]` -> una singola query con JOIN.
> - Lazy loading: `piatto.getIngredienti()` -> query separata "on demand".
>
> Nel progetto uso eager ovunque per evitare il problema N+1: se recuperi 100
> piatti e poi cerchi gli ingredienti in un loop, generi 1+100 query. Con
> `include` e' una sola query con JOIN.

### 4.8 Transazioni (non richieste, ma bell'argomento)
> Nel `crea` faccio `Piatto.create()` + `setIngredienti()` = due operazioni
> separate. Se la seconda fallisse, il piatto resterebbe creato senza ingredienti
> = dato inconsistente. In produzione lo racchiuderei in una transazione:
> ```js
> const t = await sequelize.transaction();
> try {
>   const p = await Piatto.create({...}, { transaction: t });
>   await p.setIngredienti(ids, { transaction: t });
>   await t.commit();
> } catch (err) { await t.rollback(); throw err; }
> ```

### 4.9 Middleware chain di Express
> `app.use(...)` registra middleware eseguiti in ordine. Ogni middleware puo':
> - rispondere e terminare la catena (`res.send(...)`),
> - passare al successivo (`next()`),
> - passare al gestore errori (`next(err)`).
>
> `express.json()` va PRIMA delle rotte perche' parsa il body: senza, i controller
> avrebbero `req.body === undefined`.
> Il 404 catch-all va PER ULTIMO perche' intercetta tutto quello che non ha
> ancora risposto.

### 4.10 Metodi HTTP e idempotenza
> GET, PUT, DELETE sono idempotenti: fatti N volte producono lo stesso stato.
> POST non e' idempotente: due POST creano due risorse. PATCH sarebbe piu'
> corretto RFC-wise per un update parziale, ma la traccia dice PUT ed e' prassi
> comune usarlo anche cosi'.

### 4.11 Perche' `req.body`, `req.params`, `req.query` sono cose diverse
> - `req.params` -> parametri dell'URL (`/api/piatti/:id` → `req.params.id`).
> - `req.query` -> query string (`?q=pasta` → `req.query.q`).
> - `req.body` -> body della richiesta (POST/PUT), parsato da `express.json()`.
>
> Vanno validati diversamente: `params` esiste sempre se la rotta matcha,
> `query` puo' mancare, `body` puo' essere `{}`.

### 4.12 `required: true/false` negli include
> - `required: true` -> INNER JOIN (esclude righe senza il correlato).
> - `required: false` (default) -> LEFT JOIN (include anche le righe "vuote").
>
> Utile per statistiche: LEFT JOIN mostra anche le categorie con 0 piatti.

---

## 5. Riepilogo architettura da spiegare in 30 secondi

Se il prof ti chiede "descrivi il progetto in un minuto":

> "E' un backend REST con Node.js, Express e Sequelize per gestire il menu di un
> ristorante. Ho tre entita': Categoria, Piatto e Ingrediente. Piatto e' la
> tabella principale, ha una FK verso Categoria (relazione N:1 gestita con
> `belongsTo`/`hasMany`) e una relazione N:N verso Ingrediente tramite una
> tabella pivot pura (gestita con `belongsToMany`).
>
> L'API ha 15 endpoint divisi in Categorie, Ingredienti, Piatti e ricerche.
> Il codice e' organizzato in quattro strati: le **routes** mappano gli URL,
> i **controllers** gestiscono HTTP, i **services** contengono le query
> Sequelize, i **models** definiscono lo schema. Ogni strato parla solo con
> quello subito sotto.
>
> Il DB e' MariaDB, creato dai due script SQL in `sql/`. Non uso
> `sequelize.sync()` perche' la traccia richiede lo schema esplicito. La
> collection Postman in `postman/` contiene tutte le richieste con body di esempio."

Fine. Se vuole approfondire, aspetti la domanda specifica e vai in dettaglio.
