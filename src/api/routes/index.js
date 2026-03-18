/**
 * Agregador de rutas de la API (prefijo /api/v1).
 *
 * Estructura: /api/v1/{carpeta}/{endpoint}
 * - sessions: listado (GET) y limpieza (POST clean-recordings).
 * - guacamole: token de conexión (GET token).
 * - view: log (GET log) y video (GET video) de sesión.
 * - internal: logs internos (GET logs) y estado (GET health).
 * - crypt: cifrado de texto (POST crypt).
 *
 * 
 */

const express = require('express');
const sessionsRoutes = require('./sessions/index');
const guacamoleRoutes = require('./guacamole/index');
const viewRoutes = require('./view/index');
const internalRoutes = require('./internal/index');
const internalController = require('../controllers/internal.controller');
const tokenController = require('../controllers/token.controller');
const { postCryptSchema } = require('../schemas/token.schema');

const router = express.Router();

router.use('/api/v1/sessions', sessionsRoutes);
router.use('/api/v1/guacamole', guacamoleRoutes);
router.use('/api/v1/view', viewRoutes);
router.use('/api/v1/internal', internalRoutes);
router.post('/api/v1/crypt', postCryptSchema, tokenController.postCrypt);
router.get('/api/v1/health', internalController.getStatus);

module.exports = router;
