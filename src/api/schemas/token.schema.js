/**
 * Esquema de validación para GET /token.
 *
 * Requiere query.connection y que sea una conexión existente en config.
 */

const { query, body } = require('express-validator');
const config = require('../config');

const connectionNames = Object.keys(config.connections || {});

/** Validadores para GET /token: connection obligatorio y debe ser una clave de config.connections. */
const getTokenSchema = [
  query('connection')
    .trim()
    .notEmpty()
    .withMessage('Falta el parámetro connection')
    .isIn(connectionNames)
    .withMessage(`connection debe ser uno de: ${connectionNames.join(', ')}`),
];

/**
 * Validadores para POST /crypt.
 * - username es opcional
 * - password es obligatorio
 */
const postCryptSchema = [
  body('username')
    .optional()
    .isString()
    .withMessage('username debe ser string')
    .trim()
    .notEmpty()
    .withMessage('username no puede estar vacío'),

  body('password')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('password es obligatorio')
    .isString()
    .withMessage('password debe ser string')
    .trim()
    .notEmpty()
    .withMessage('password no puede estar vacío'),
];

module.exports = {
  getTokenSchema,
  postCryptSchema,
};
