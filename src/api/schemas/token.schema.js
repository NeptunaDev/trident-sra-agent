/**
 * Esquema de validación para GET /token.
 *
 * Requiere query.connection y que sea una conexión existente en config.
 */

const { query } = require('express-validator');
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

module.exports = {
  getTokenSchema,
};
