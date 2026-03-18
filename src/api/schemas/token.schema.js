/**
 * Esquema de validación para GET /token.
 *
 * Requiere query.connection y que sea una conexión existente en config.
 */

const { query, body } = require('express-validator');
const config = require('../config');

const connectionNames = Object.keys(config.connections || {});
const connectionTypes = ['vnc', 'ssh', 'rdp'];

/** Validadores para GET /token: connection obligatorio y debe ser una clave de config.connections. */
const getTokenSchema = [
  query('connection')
    .trim()
    .notEmpty()
    .withMessage('Falta el parámetro connection')
    .isIn(connectionNames)
    .withMessage(`connection debe ser uno de: ${connectionNames.join(', ')}`),
];

const postConnectionToken = [
  body('type')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('type es obligatorio')
    .trim()
    .toLowerCase()
    .isIn(connectionTypes)
    .withMessage(`type debe ser uno de: ${connectionTypes.join(', ')}`),

  body('hostname')
    .trim()
    .notEmpty()
    .withMessage('hostname no puede estar vacío')
    .isString(),

  body('port')
    .isInt({ min: 1, max: 65535 })
    .withMessage('port debe ser un número entre 1 y 65535'),

  // Username Opcional inicialmente,se valida después según el tipo de conexión
  body('username')
    .optional()
    .trim()
    .isString(),

  // Password Sin trim por seguridad
  body('password')
    .optional()
    .isString(),

  // Validación para username y password según el tipo de conexión
  body().custom((value, { req }) => {
    const type = String(req.body?.type || '').toLowerCase();
    const username = req.body?.username;
    const password = req.body?.password;

    // 1. Username obligatorio para todo menos VNC
    if (type !== 'vnc' && !username) {
      throw new Error('username es obligatorio para protocolos que no sean VNC');
    }

    // 2. Password obligatorio para SSH y RDP
    if ((type === 'ssh' || type === 'rdp') && !password) {
      throw new Error(`password es obligatorio para el protocolo ${type.toUpperCase()}`);
    }

    return true;
  }),
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
  postConnectionToken,
  postCryptSchema,
};
