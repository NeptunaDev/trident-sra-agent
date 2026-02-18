/**
 * Agregador de rutas de la API (prefijo /api/v1).
 *
 * Estructura: /api/v1/{carpeta}/{endpoint}
 * - sessions: listado (GET) y limpieza (POST clean-recordings).
 * - guacamole: token de conexión (GET token).
 * - view: log (GET log) y video (GET video) de sesión.
 */

const express = require('express');
const sessionsRoutes = require('./sessions/index');
const guacamoleRoutes = require('./guacamole/index');
const viewRoutes = require('./view/index');

const router = express.Router();

router.use('/api/v1/sessions', sessionsRoutes);
router.use('/api/v1/guacamole', guacamoleRoutes);
router.use('/api/v1/view', viewRoutes);

module.exports = router;
