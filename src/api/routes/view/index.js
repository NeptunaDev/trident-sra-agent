/**
 * Rutas de visualización de archivos de sesión (log typescript y grabación .guac).
 *
 * GET /api/v1/view/log?sessionId=... — sirve el typescript (texto plano).
 * GET /api/v1/view/video?sessionId=... — sirve el archivo .guac.
 */

const express = require('express');
const viewLogController = require('../../controllers/viewLog.controller');
const viewVideoController = require('../../controllers/viewVideo.controller');
const { sessionIdQuerySchema } = require('../../schemas/sessionId.schema');
const { validateRequest } = require('../../middleware/validateRequest');

const router = express.Router();

router.get('/log', sessionIdQuerySchema, validateRequest, viewLogController.getViewLog);
router.get('/video', sessionIdQuerySchema, validateRequest, viewVideoController.getViewVideo);

module.exports = router;
