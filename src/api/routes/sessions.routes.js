/**
 * Rutas de sesiones (listado desde CSV).
 *
 * GET /sessions — devuelve array de sesiones (connectionName, sessionId, videoPath, typescriptPath).
 */

const express = require('express');
const sessionsController = require('../controllers/sessions.controller');

const router = express.Router();

router.get('/', sessionsController.getSessions);

module.exports = router;
