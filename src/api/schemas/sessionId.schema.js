/**
 * Esquema de validación para rutas que requieren sessionId en query.
 *
 * Usado en GET /view-log y GET /view-video.
 */

const { query } = require('express-validator');

/** Validadores para rutas con ?sessionId=... (view-log, view-video). */
const sessionIdQuerySchema = [
  query('sessionId')
    .trim()
    .notEmpty()
    .withMessage('Falta sessionId'),
];

module.exports = {
  sessionIdQuerySchema,
};
