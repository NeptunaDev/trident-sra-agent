/**
 * Controlador de POST /clean-recordings.
 *
 * Vacía las carpetas data/recordings y data/typescript y trunca el CSV de sesiones.
 */

const config = require('../config');
const csvService = require('../services/csv.service');
const fileService = require('../services/file.service');

/**
 * POST /clean-recordings
 * Responde con ok, número de archivos eliminados y mensaje. También vacía el listado de sesiones (CSV).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function postCleanRecordings(req, res) {
  const recordingsDir = config.RECORDING_PATH_HOST;
  const typescriptDir = config.TYPESCRIPT_PATH_HOST;

  const deletedRecordings = fileService.clearDirectory(recordingsDir);
  const deletedTypescript = fileService.clearDirectory(typescriptDir);
  csvService.truncateSessionsCsv();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    ok: true,
    deletedRecordings,
    deletedTypescript,
    message: `Eliminados ${deletedRecordings} archivo(s) en recordings, ${deletedTypescript} en typescript y vaciado el listado de sesiones.`
  });
}

module.exports = {
  postCleanRecordings,
};
