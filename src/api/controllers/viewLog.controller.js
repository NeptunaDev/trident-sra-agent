/**
 * Controlador de GET /view-log.
 *
 * Sirve el archivo typescript de la sesión (texto plano). Resuelve la ruta desde el CSV
 * o por convención en la carpeta configurada.
 */

const path = require('path');
const config = require('../config');
const csvService = require('../services/csv.service');
const fileService = require('../services/file.service');

/**
 * GET /view-log?sessionId=...
 * Responde con el contenido del archivo typescript o 404 si no existe.
 * @param {import('express').Request} req - req.query.sessionId ya validado.
 * @param {import('express').Response} res
 */
function getViewLog(req, res) {
  const sessionId = req.query.sessionId.trim();
  const session = csvService.findSessionBySessionId(sessionId);
  const typescriptPathFromCsv = session && (session.typescriptPath || '').trim();

  const filePath = fileService.resolveFilePath([
    typescriptPathFromCsv,
    path.join(config.TYPESCRIPT_PATH_HOST, `${sessionId}.typescript`),
    path.join(config.TYPESCRIPT_PATH_HOST, `${sessionId}.txt`)
  ]);

  if (!filePath) {
    return res.status(404).send('Archivo no encontrado');
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(filePath);
}

module.exports = {
  getViewLog,
};
