/**
 * scripts/seed.js — Popolamento database
 *
 * Eseguire dalla ROOT del progetto:
 *   node scripts/seed.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { sequelize, Categoria, Autore, Libro } = require('../models');

async function seed() {
  await sequelize.sync({ force: false });

  // ── Categorie ────────────────────────────────────────
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
  const libriData = [
    { isbn: '9788804123456', defaults: { titolo: "L'Odissea",                   annoPubblicazione: -800, prezzo: 9.90,  disponibile: true,  autoreId: omero.id,       categoriaId: poesia.id    } },
    { isbn: '9788804123457', defaults: { titolo: "L'Eneide",                    annoPubblicazione: -19,  prezzo: 9.90,  disponibile: true,  autoreId: virgilio.id,    categoriaId: poesia.id    } },
    { isbn: '9788804123458', defaults: { titolo: 'Faust',                       annoPubblicazione: 1808, prezzo: 12.50, disponibile: true,  autoreId: goethe.id,      categoriaId: classici.id  } },
    { isbn: '9788804123459', defaults: { titolo: 'La Divina Commedia',          annoPubblicazione: 1320, prezzo: 14.00, disponibile: true,  autoreId: dante.id,       categoriaId: poesia.id    } },
    { isbn: '9788804123460', defaults: { titolo: 'Demian',                      annoPubblicazione: 1919, prezzo: 10.00, disponibile: true,  autoreId: hesse.id,       categoriaId: filosofia.id } },
    { isbn: '9788804123461', defaults: { titolo: 'Lo straniero',                annoPubblicazione: 1942, prezzo: 11.00, disponibile: true,  autoreId: camus.id,       categoriaId: filosofia.id } },
    { isbn: '9788804123462', defaults: { titolo: 'Don Chisciotte',              annoPubblicazione: 1605, prezzo: 15.00, disponibile: true,  autoreId: cervantes.id,   categoriaId: classici.id  } },
    { isbn: '9788804123463', defaults: { titolo: "La scena dell'inferno",       annoPubblicazione: 1948, prezzo: 11.50, disponibile: false, autoreId: akutagawa.id,   categoriaId: narrativa.id } },
    { isbn: '9788804123464', defaults: { titolo: 'Il sogno della camera rossa', annoPubblicazione: 1791, prezzo: 18.00, disponibile: true,  autoreId: caoxueqin.id,   categoriaId: classici.id  } },
    { isbn: '9788804123465', defaults: { titolo: 'Delitto e castigo',           annoPubblicazione: 1866, prezzo: 13.00, disponibile: true,  autoreId: dostoevskij.id, categoriaId: classici.id  } },
    { isbn: '9788804123466', defaults: { titolo: 'La metamorfosi',              annoPubblicazione: 1915, prezzo: 8.90,  disponibile: true,  autoreId: kafka.id,       categoriaId: narrativa.id } },
    { isbn: '9788804123467', defaults: { titolo: 'Le ali',                      annoPubblicazione: 1936, prezzo: 10.50, disponibile: false, autoreId: yisang.id,      categoriaId: narrativa.id } },
    { isbn: '9788804123468', defaults: { titolo: 'Moby Dick',                   annoPubblicazione: 1851, prezzo: 14.00, disponibile: true,  autoreId: melville.id,    categoriaId: avventura.id } },
    { isbn: '9788804123469', defaults: { titolo: 'Cime tempestose',             annoPubblicazione: 1847, prezzo: 11.00, disponibile: true,  autoreId: bronte.id,      categoriaId: classici.id  } },
  ];

  for (const { isbn, defaults } of libriData) {
    await Libro.findOrCreate({ where: { isbn }, defaults });
  }

  console.log('✅ Database popolato:');
  console.log('   - 5  categorie');
  console.log('   - 14 autori');
  console.log('   - 14 libri');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Errore seed:', err.message);
  process.exit(1);
});