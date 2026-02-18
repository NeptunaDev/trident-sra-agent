/**
 * Middleware que revisa el resultado de express-validator.
 *
 * Si hay errores de validación, responde 400 con el primer mensaje.
 * Si no hay errores, llama a next().
 */

const { validationResult } = require('express-validator');

/**
 * Devuelve 400 con el primer error de validación si existe.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const firstError = errors.array({ onlyFirstError: true })[0];
  const message = firstError?.msg || 'Error de validación';

  return res.status(400).json({ error: message });
}

module.exports = { validateRequest };
