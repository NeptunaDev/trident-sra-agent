/**
 * Controlador de GET /view-video.
 *
 * Sirve el archivo .guac de la sesión (grabación). Resuelve la ruta desde el CSV
 * o por convención en la carpeta configurada.
 */

const path = require('path');
const config = require('../config');
const csvService = require('../services/csv.service');
const fileService = require('../services/file.service');

/**
 * GET /view-video?sessionId=...
 * Responde con el archivo .guac o 404 si no existe.
 * @param {import('express').Request} req - req.query.sessionId ya validado.
 * @param {import('express').Response} res
 */
function getViewVideo(req, res) {
  const sessionId = req.query.sessionId.trim();
  const session = csvService.findSessionBySessionId(sessionId);
  const videoPathFromCsv = session && (session.videoPath || '').trim();

  const filePath = fileService.resolveFilePath([
    videoPathFromCsv,
    path.join(config.RECORDING_PATH_HOST, `${sessionId}.guac`)
  ]);

  if (!filePath) {
    return res.status(404).send('Archivo no encontrado');
  }

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(filePath);
}

module.exports = {
  getViewVideo,
};
