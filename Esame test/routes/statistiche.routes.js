const router = require('express').Router();
const ctrl = require('../controller/statistiche.controller');

router.get('/servizi-popolari', ctrl.serviziPopolari);

module.exports = router;
