/**
 * Rutas de Guacamole (guacd / token de conexión).
 *
 * GET /api/v1/guacamole/token?connection=<name> — genera token cifrado y registra sesión en CSV.
 */

const express = require('express');
const tokenController = require('../../controllers/token.controller');
const { getTokenSchema } = require('../../schemas/token.schema');
const { validateRequest } = require('../../middleware/validateRequest');

const router = express.Router();

router.get('/token', getTokenSchema, validateRequest, tokenController.getToken);

module.exports = router;
