/**
 * Rutas de visualización de grabación .guac.
 *
 * GET /view-video?sessionId=... — sirve el archivo .guac de la sesión.
 */

const express = require('express');
const viewVideoController = require('../controllers/viewVideo.controller');
const { sessionIdQuerySchema } = require('../schemas/sessionId.schema');
const { validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

router.get('/', sessionIdQuerySchema, validateRequest, viewVideoController.getViewVideo);

module.exports = router;
