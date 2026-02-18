/**
 * Agregador de rutas de la API.
 *
 * Monta todos los routers bajo las rutas indicadas.
 */

const express = require('express');
const tokenRoutes = require('./token.routes');
const sessionsRoutes = require('./sessions.routes');
const viewLogRoutes = require('./viewLog.routes');
const viewVideoRoutes = require('./viewVideo.routes');
const cleanRecordingsRoutes = require('./cleanRecordings.routes');

const router = express.Router();

router.use('/token', tokenRoutes);
router.use('/sessions', sessionsRoutes);
router.use('/view-log', viewLogRoutes);
router.use('/view-video', viewVideoRoutes);
router.use('/clean-recordings', cleanRecordingsRoutes);

module.exports = router;
