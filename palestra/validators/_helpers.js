/**
 * validators/_helpers.js
 *
 * Piccola libreria di primitive di validazione, condivise fra tutti i
 * validator. Nessuna dipendenza esterna (niente joi/zod/yup): questa e'
 * una scelta didattica, per rendere trasparente COSA succede a ogni
 * controllo. In un progetto reale una libreria come `zod` semplifica il
 * lavoro e permette di derivare tipi TypeScript.
 *
 * Convenzione: ogni helper e' una funzione pura (senza side effect) che
 * torna true/false. I validator combinano piu' helper e producono una
 * lista di stringhe di errore, che il `middleware()` in fondo trasforma
 * in una risposta HTTP 400.
 */

/**
 * vuoto(v): true se il valore e' undefined, null o stringa vuota (dopo trim).
 *
 * Attenzione: `false` NON e' vuoto (per un futuro campo booleano) e nemmeno
 * `0` (per un campo numerico che accetta zero, es. piano terra). E' un
 * dettaglio importante: molte implementazioni "ingenue" scriverebbero
 * `if (!v)` che considera vuoti anche 0 e false.
 */
const vuoto = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

/**
 * isIntPositivo(v): true se v e' un intero >= 0.
 * Accetta:
 *   - numeri interi non negativi: 0, 1, 42
 *   - stringhe di soli digit: "0", "1", "42" (utile per req.params che
 *     arrivano sempre come stringhe dall'URL)
 * Rifiuta:
 *   - numeri con decimali (12.5), negativi (-1)
 *   - stringhe con segno o decimali ("-1", "1.5", "1e3", "0x1")
 *   - null, undefined, oggetti, boolean
 */
const isIntPositivo = (v) => {
  if (typeof v === 'number') return Number.isInteger(v) && v >= 0;
  if (typeof v === 'string' && /^\d+$/.test(v)) return true;
  return false;
};

/**
 * isNumeroPositivo(v): true se v e' un numero (o stringa numerica) >= 0.
 * Piu' permissiva di isIntPositivo: accetta i decimali.
 * Uso: prezzoMensile puo' essere 25.50, quindi qui serve.
 *
 * Number.isFinite() esclude NaN, Infinity e -Infinity, che Number()
 * potrebbe altrimenti restituire per input strani ("abc" -> NaN,
 * "1e999" -> Infinity).
 */
const isNumeroPositivo = (v) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n >= 0;
};

/**
 * isEmail(v): validazione "pragmatica" di un'email.
 *
 * NB: la RFC 5321/5322 per le email e' molto complessa e la regex "vera"
 * occupa centinaia di caratteri. Nessuno usa quella regex in un form; si
 * usa una versione semplice che copre il 99% dei casi reali:
 *   almeno un carattere non-spazio non-@, poi '@', almeno un
 *   carattere non-spazio non-@, poi '.', poi almeno un altro.
 * Casi limite legittimi (email con quote, IPv6 nel dominio) NON matchano,
 * ma per un'applicazione web di livello universitario e' sufficiente.
 */
const isEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/**
 * isDateOnly(v): true se v e' una stringa nel formato YYYY-MM-DD
 * che rappresenta una data valida.
 *
 * Il check e' in DUE passi:
 *   1) la regex garantisce la FORMA: 4 cifre - 2 cifre - 2 cifre.
 *   2) new Date(v) valida che la data ESISTA davvero.
 *      Es. "2024-02-30" passa la regex ma new Date("2024-02-30").toString()
 *      restituisce "Invalid Date" -> getTime() e' NaN -> rifiutata.
 */
const isDateOnly = (v) => {
  if (typeof v !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v);
  return !isNaN(d.getTime());
};

/**
 * middleware(raccogli): FACTORY che costruisce middleware Express uniformi.
 *
 * Il pattern:
 *   1) `raccogli(req)` esamina req e restituisce un ARRAY di stringhe di
 *      errore (vuoto se tutto ok).
 *   2) Se ci sono errori, rispondiamo HTTP 400 con { errore: "<tutti gli errori uniti>" }
 *      e non chiamiamo next() -> la richiesta si ferma qui, il controller
 *      non viene mai eseguito.
 *   3) Se non ci sono errori, next() passa il controllo al middleware
 *      successivo (di solito il controller).
 *
 * Perche' astrarre? Cosi' ogni validator si concentra solo sulle REGOLE,
 * senza ripetere il codice di risposta HTTP. E' il classico refactoring
 * "template method" applicato ai middleware Express.
 *
 * Perche' errori.join(' ')? I messaggi finiscono con '.', concatenandoli
 * con uno spazio otteniamo una frase leggibile:
 *   'Il campo "nome" e obbligatorio. Il campo "email" e obbligatorio.'
 * Alternativa: rispondere con un array. La stringa e' piu' semplice per un
 * client basico (es. mostrare in un alert).
 */
const middleware = (raccogli) => (req, res, next) => {
  const errori = raccogli(req);
  if (errori.length > 0) {
    return res.status(400).json({ errore: errori.join(' ') });
  }
  next();
};

module.exports = { vuoto, isIntPositivo, isNumeroPositivo, isEmail, isDateOnly, middleware };
