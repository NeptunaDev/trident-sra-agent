/**
 * Controlador de GET /sessions.
 *
 * Devuelve la lista de sesiones leída del CSV (connectionName, sessionId, videoPath, typescriptPath).
 */

const csvService = require('../services/csv.service');

/**
 * GET /sessions
 * Responde con un array de objetos de sesión.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function getSessions(req, res) {
  const sessions = csvService.readSessionsFromCsv();
  res.json(sessions);
}

module.exports = {
  getSessions,
};
