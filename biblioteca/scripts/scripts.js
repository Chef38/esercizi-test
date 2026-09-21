/**
 * scripts/seed.js — Popolamento database
 *
 * Eseguire dalla ROOT del progetto:
 *   node scripts/seed.js
 *
 * Inserisce dati di esempio nel DB usando findOrCreate:
 * se i record esistono NON li duplica, quindi lo script è idempotente
 * (può essere eseguito più volte senza problemi).
 */

// path serve per costruire il percorso assoluto al file .env
const path = require('path');
// __dirname = cartella dello script; ../ risale alla root del progetto
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Import di sequelize + modelli
const { sequelize, Categoria, Autore, Libro } = require('../models');

async function seed() {
  // Sincronizza i modelli con il DB (crea tabelle se mancano, senza cancellare dati)
  await sequelize.sync({ force: false });

  // ── Categorie ────────────────────────────────────────
  // findOrCreate: cerca in base a `where`, se non trova crea con `defaults`.
  // Restituisce un array [istanza, creato?] → destrutturo solo l'istanza.
  const [poesia]    = await Categoria.findOrCreate({ where: { nome: 'Poesia'    }, defaults: { descrizione: 'Epica, lirica e poesia in versi' } });
  const [narrativa] = await Categoria.findOrCreate({ where: { nome: 'Narrativa' }, defaults: { descrizione: 'Romanzi e racconti di finzione' } });
  const [classici]  = await Categoria.findOrCreate({ where: { nome: 'Classici'  }, defaults: { descrizione: 'Grandi classici della letteratura mondiale' } });
  const [filosofia] = await Categoria.findOrCreate({ where: { nome: 'Filosofia' }, defaults: { descrizione: 'Filosofia e riflessione esistenziale' } });
  const [avventura] = await Categoria.findOrCreate({ where: { nome: 'Avventura' }, defaults: { descrizione: "Romanzi d'azione e avventura" } });

  // ── Autori ───────────────────────────────────────────
  // nazionalita (senza accento in JS) → mappato a "nazionalità" nel DB tramite field in Autore.js
  // annoNascita → stesso nome nel DB (camelCase)
  const [omero]       = await Autore.findOrCreate({ where: { nome: 'Omero',      cognome: ''            }, defaults: { nazionalita: 'Greca antica', annoNascita: null } });
  const [virgilio]    = await Autore.findOrCreate({ where: { nome: 'Virgilio',   cognome: ''            }, defaults: { nazionalita: 'Romana',       annoNascita: -70  } });
  const [goethe]      = await Autore.findOrCreate({ where: { nome: 'Johann',     cognome: 'Goethe'      }, defaults: { nazionalita: 'Tedesca',      annoNascita: 1749 } });
  const [dante]       = await Autore.findOrCreate({ where: { nome: 'Dante',      cognome: 'Alighieri'   }, defaults: { nazionalita: 'Italiana',     annoNascita: 1265 } });
  const [hesse]       = await Autore.findOrCreate({ where: { nome: 'Hermann',    cognome: 'Hesse'       }, defaults: { nazionalita: 'Tedesca',      annoNascita: 1877 } });
  const [camus]       = await Autore.findOrCreate({ where: { nome: 'Albert',     cognome: 'Camus'       }, defaults: { nazionalita: 'Francese',     annoNascita: 1913 } });
  const [cervantes]   = await Autore.findOrCreate({ where: { nome: 'Miguel',     cognome: 'Cervantes'   }, defaults: { nazionalita: 'Spagnola',     annoNascita: 1547 } });
  const [akutagawa]   = await Autore.findOrCreate({ where: { nome: 'Ryunosuke',  cognome: 'Akutagawa'   }, defaults: { nazionalita: 'Giapponese',   annoNascita: 1892 } });
  const [caoxueqin]   = await Autore.findOrCreate({ where: { nome: 'Cao',        cognome: 'Xueqin'      }, defaults: { nazionalita: 'Cinese',       annoNascita: 1715 } });
  const [dostoevskij] = await Autore.findOrCreate({ where: { nome: 'Fëdor',      cognome: 'Dostoevskij' }, defaults: { nazionalita: 'Russa',        annoNascita: 1821 } });
  const [kafka]       = await Autore.findOrCreate({ where: { nome: 'Franz',      cognome: 'Kafka'       }, defaults: { nazionalita: 'Ceca',         annoNascita: 1883 } });
  const [yisang]      = await Autore.findOrCreate({ where: { nome: 'Yi',         cognome: 'Sang'        }, defaults: { nazionalita: 'Coreana',      annoNascita: 1910 } });
  const [melville]    = await Autore.findOrCreate({ where: { nome: 'Herman',     cognome: 'Melville'    }, defaults: { nazionalita: 'Americana',    annoNascita: 1819 } });
  const [bronte]      = await Autore.findOrCreate({ where: { nome: 'Emily',      cognome: 'Brontë'      }, defaults: { nazionalita: 'Britannica',   annoNascita: 1818 } });

  // ── Libri ─────────────────────────────────────────────
  // Ora la relazione libro↔autore è many-to-many:
  // ogni libro può avere PIÙ autori (vedi ultimo esempio, Moby Dick,
  // che qui associo a Melville + Brontë solo per mostrare il caso multiplo).
  const libriData = [
    { isbn: '9788804123456', autori_ids: [omero.id],       defaults: { titolo: "L'Odissea",                   annoPubblicazione: -800, prezzo: 9.90,  disponibile: true,  categoriaId: poesia.id    } },
    { isbn: '9788804123457', autori_ids: [virgilio.id],    defaults: { titolo: "L'Eneide",                    annoPubblicazione: -19,  prezzo: 9.90,  disponibile: true,  categoriaId: poesia.id    } },
    { isbn: '9788804123458', autori_ids: [goethe.id],      defaults: { titolo: 'Faust',                       annoPubblicazione: 1808, prezzo: 12.50, disponibile: true,  categoriaId: classici.id  } },
    { isbn: '9788804123459', autori_ids: [dante.id],       defaults: { titolo: 'La Divina Commedia',          annoPubblicazione: 1320, prezzo: 14.00, disponibile: true,  categoriaId: poesia.id    } },
    { isbn: '9788804123460', autori_ids: [hesse.id],       defaults: { titolo: 'Demian',                      annoPubblicazione: 1919, prezzo: 10.00, disponibile: true,  categoriaId: filosofia.id } },
    { isbn: '9788804123461', autori_ids: [camus.id],       defaults: { titolo: 'Lo straniero',                annoPubblicazione: 1942, prezzo: 11.00, disponibile: true,  categoriaId: filosofia.id } },
    { isbn: '9788804123462', autori_ids: [cervantes.id],   defaults: { titolo: 'Don Chisciotte',              annoPubblicazione: 1605, prezzo: 15.00, disponibile: true,  categoriaId: classici.id  } },
    { isbn: '9788804123463', autori_ids: [akutagawa.id],   defaults: { titolo: "La scena dell'inferno",       annoPubblicazione: 1948, prezzo: 11.50, disponibile: false, categoriaId: narrativa.id } },
    { isbn: '9788804123464', autori_ids: [caoxueqin.id],   defaults: { titolo: 'Il sogno della camera rossa', annoPubblicazione: 1791, prezzo: 18.00, disponibile: true,  categoriaId: classici.id  } },
    { isbn: '9788804123465', autori_ids: [dostoevskij.id], defaults: { titolo: 'Delitto e castigo',           annoPubblicazione: 1866, prezzo: 13.00, disponibile: true,  categoriaId: classici.id  } },
    { isbn: '9788804123466', autori_ids: [kafka.id],       defaults: { titolo: 'La metamorfosi',              annoPubblicazione: 1915, prezzo: 8.90,  disponibile: true,  categoriaId: narrativa.id } },
    { isbn: '9788804123467', autori_ids: [yisang.id],      defaults: { titolo: 'Le ali',                      annoPubblicazione: 1936, prezzo: 10.50, disponibile: false, categoriaId: narrativa.id } },
    { isbn: '9788804123468', autori_ids: [melville.id],    defaults: { titolo: 'Moby Dick',                   annoPubblicazione: 1851, prezzo: 14.00, disponibile: true,  categoriaId: avventura.id } },
    { isbn: '9788804123469', autori_ids: [bronte.id],      defaults: { titolo: 'Cime tempestose',             annoPubblicazione: 1847, prezzo: 11.00, disponibile: true,  categoriaId: classici.id  } },
  ];

  // Ciclo sui libri: findOrCreate + poi setAutori per popolare la pivot.
  // setAutori(ids) è generato da belongsToMany: riscrive la tabella
  // libro_autore con esattamente gli id passati.
  for (const { isbn, autori_ids, defaults } of libriData) {
    const [libro] = await Libro.findOrCreate({ where: { isbn }, defaults });
    await libro.setAutori(autori_ids);
  }

  console.log('✅ Database popolato:');
  console.log('   - 5  categorie');
  console.log('   - 14 autori');
  console.log('   - 14 libri');
  // Termina il processo con exit code 0 (successo).
  // Senza questa riga il processo resterebbe appeso alla connessione DB.
  process.exit(0);
}

// Esegue seed() e cattura eventuali errori.
// .catch() è necessario perché una funzione async che throwa
// senza un try/catch esterno lascia un'unhandled promise rejection.
seed().catch(err => {
  console.error('❌ Errore seed:', err.message);
  process.exit(1); // exit code 1 = errore
});