/**
 * Rutas de limpieza de grabaciones.
 *
 * POST /clean-recordings — vacía data/recordings y data/typescript.
 */

const express = require('express');
const cleanRecordingsController = require('../controllers/cleanRecordings.controller');

const router = express.Router();

router.post('/', cleanRecordingsController.postCleanRecordings);

module.exports = router;
