/**
 * Rutas de visualización de log typescript.
 *
 * GET /view-log?sessionId=... — sirve el archivo typescript de la sesión (texto plano).
 */

const express = require('express');
const viewLogController = require('../controllers/viewLog.controller');
const { sessionIdQuerySchema } = require('../schemas/sessionId.schema');
const { validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

router.get('/', sessionIdQuerySchema, validateRequest, viewLogController.getViewLog);

module.exports = router;
