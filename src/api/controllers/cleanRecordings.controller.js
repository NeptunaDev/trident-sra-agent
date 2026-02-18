/**
 * Controlador de POST /clean-recordings.
 *
 * Vacía las carpetas data/recordings y data/typescript (solo archivos en el primer nivel).
 */

const config = require('../config');
const fileService = require('../services/file.service');

/**
 * POST /clean-recordings
 * Responde con ok, número de archivos eliminados en cada carpeta y mensaje.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function postCleanRecordings(req, res) {
  const recordingsDir = config.RECORDING_PATH_HOST;
  const typescriptDir = config.TYPESCRIPT_PATH_HOST;

  const deletedRecordings = fileService.clearDirectory(recordingsDir);
  const deletedTypescript = fileService.clearDirectory(typescriptDir);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    ok: true,
    deletedRecordings,
    deletedTypescript,
    message: `Eliminados ${deletedRecordings} archivo(s) en recordings y ${deletedTypescript} en typescript.`
  });
}

module.exports = {
  postCleanRecordings,
};
