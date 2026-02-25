/**
 * Rutas de sesiones y limpieza (CSV + recordings).
 *
 * GET    /api/v1/sessions — listado paginado ordenado por createdAt desc.
 * GET    /api/v1/sessions/active — listado de sesiones activas en tiempo real.
 * POST   /api/v1/sessions/clean-recordings — vacía recordings, typescript y CSV.
 * DELETE /api/v1/sessions/active/:sessionId — cierre forzado de sesión activa.
 * DELETE /api/v1/sessions/:sessionId — borra archivos de la sesión y su fila en el CSV.
 */

const express = require('express');
const sessionsController = require('../../controllers/sessions.controller');
const cleanRecordingsController = require('../../controllers/cleanRecordings.controller');
const deleteSessionController = require('../../controllers/deleteSession.controller');
const { getSessionsSchema } = require('../../schemas/sessions.schema');
const { sessionIdParamSchema } = require('../../schemas/sessionId.schema');
const { validateRequest } = require('../../middleware/validateRequest');

const router = express.Router();

router.get('/', getSessionsSchema, validateRequest, sessionsController.getSessions);
router.get('/active', sessionsController.getActiveSessions);
router.post('/clean-recordings', cleanRecordingsController.postCleanRecordings);
router.delete('/active/:sessionId', sessionIdParamSchema, validateRequest, sessionsController.deleteActiveSession);
router.delete('/:sessionId', sessionIdParamSchema, validateRequest, deleteSessionController.deleteSession);

module.exports = router;
