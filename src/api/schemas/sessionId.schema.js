/**
 * Esquema de validación para rutas que requieren sessionId (query o params).
 *
 * Usado en GET /view/log, GET /view/video (query) y DELETE /sessions/:sessionId (params).
 */

const { query, param } = require('express-validator');

/** Validadores para rutas con ?sessionId=... (view/log, view/video). */
const sessionIdQuerySchema = [
  query('sessionId')
    .trim()
    .notEmpty()
    .withMessage('Falta sessionId'),
];

/** Validadores para rutas con :sessionId en la URL (DELETE /sessions/:sessionId). */
const sessionIdParamSchema = [
  param('sessionId')
    .trim()
    .notEmpty()
    .withMessage('Falta sessionId'),
];

module.exports = {
  sessionIdQuerySchema,
  sessionIdParamSchema,
};
