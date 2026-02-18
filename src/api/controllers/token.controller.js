/**
 * Controlador de GET /token.
 *
 * Genera un token cifrado para la conexión solicitada, registra la sesión en el CSV
 * y devuelve el token para que el frontend abra el túnel WebSocket con guacamole-lite.
 */

const crypto = require('crypto');
const path = require('path');
const config = require('../config');
const csvService = require('../services/csv.service');
const tokenService = require('../services/token.service');

/**
 * GET /token?connection=<name>
 * Responde con { token } para la conexión indicada. Validación de query en schema.
 * @param {import('express').Request} req - req.query.connection ya validado.
 * @param {import('express').Response} res
 */
function getToken(req, res) {
  const connectionName = req.query.connection.trim();
  const baseConfig = config.connections[connectionName];

  const connectionConfig = JSON.parse(JSON.stringify(baseConfig));
  const sessionId = crypto.randomUUID();

  const connectionType = connectionConfig.connection.type;
  let videoPath = null;
  let typescriptPath = null;

  if (['rdp', 'vnc'].includes(connectionType)) {
    connectionConfig.connection.settings['recording-path'] = config.RECORDINGS_PATH;
    connectionConfig.connection.settings['recording-name'] = `${sessionId}.guac`;
    connectionConfig.connection.settings['create-recording-path'] = 'true';
    videoPath = path.join(config.RECORDING_PATH_HOST, `${sessionId}.guac`);
  }
  if (connectionType === 'ssh') {
    connectionConfig.connection.settings['typescript-path'] = config.TYPESCRIPT_PATH;
    connectionConfig.connection.settings['typescript-name'] = `${sessionId}.typescript`;
    connectionConfig.connection.settings['create-typescript-path'] = 'true';
    typescriptPath = path.join(config.TYPESCRIPT_PATH_HOST, `${sessionId}.typescript`);
  }

  csvService.appendSessionToCsv(connectionName, sessionId, videoPath, typescriptPath);

  const token = tokenService.encryptToken(connectionConfig);
  res.json({ token });
}

module.exports = {
  getToken,
};
