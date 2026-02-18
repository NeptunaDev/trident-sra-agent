/**
 * Esquema de validación para GET /sessions (paginación).
 *
 * page y limit opcionales; limit acotado entre 1 y 50.
 */

const { query } = require('express-validator');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

/** Validadores para GET /sessions: page y limit opcionales. */
const getSessionsSchema = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page debe ser un entero mayor que 0')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: MAX_LIMIT })
    .withMessage(`limit debe ser un entero entre 1 y ${MAX_LIMIT}`)
    .toInt(),
];

module.exports = {
  getSessionsSchema,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
};
