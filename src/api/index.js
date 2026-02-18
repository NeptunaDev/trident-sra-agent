/**
 * Punto de entrada de la API (Trident Agent).
 *
 * Carga la app Express, inicializa guacamole-lite (WebSocket) y exporta startApi, app y PORT
 * para que el proceso principal (main.js) arranque el servidor HTTP.
 *
 * Endpoints:
 * - GET /token?connection=...
 * - GET /sessions
 * - GET /view-log?sessionId=...
 * - GET /view-video?sessionId=...
 * - POST /clean-recordings
 */

const app = require('./app');

/** Inicializa guacamole-lite (WebSocket + guacd). Debe ejecutarse antes de startApi. */
require('./guacamole');

const PORT = 3417;

/**
 * Inicia el servidor HTTP de la API en el puerto configurado.
 * @returns {Promise<import('http').Server>}
 */
function startApi() {
  return new Promise((resolve) => {
    const server = app.listen(PORT, () => {
      console.log(`API escuchando en http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

module.exports = { startApi, app, PORT };
