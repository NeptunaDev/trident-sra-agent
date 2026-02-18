/**
 * Controlador de DELETE /api/v1/sessions/:sessionId.
 *
 * Borra los archivos de la sesión (video .guac si existe; .typescript y .typescript.timing si existen)
 * y elimina la fila del CSV.
 */

const csvService = require('../services/csv.service');
const fileService = require('../services/file.service');

/**
 * DELETE /api/v1/sessions/:sessionId
 * Responde con ok y detalle de archivos eliminados.
 * @param {import('express').Request} req - req.params.sessionId ya validado.
 * @param {import('express').Response} res
 */
function deleteSession(req, res) {
  const sessionId = req.params.sessionId.trim();
  const session = csvService.findSessionBySessionId(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Sesión no encontrada' });
  }

  const { deletedVideo, deletedTypescript, deletedTiming } = fileService.deleteSessionFiles(session);
  const removed = csvService.removeSessionBySessionId(sessionId);

  if (!removed) {
    return res.status(500).json({ error: 'No se pudo eliminar la sesión del listado' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    ok: true,
    deletedVideo,
    deletedTypescript,
    deletedTiming,
    message: `Sesión ${sessionId} eliminada.`
  });
}

module.exports = {
  deleteSession,
};
