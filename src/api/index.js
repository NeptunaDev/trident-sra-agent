/**
 * Punto de entrada de la API (Trident Agent).
 *
 * Carga la app Express, inicializa guacamole-lite (WebSocket) y exporta startApi, app y PORT
 * para que el proceso principal (main.js) arranque el servidor HTTP.
 *
 * Endpoints (prefijo /api/v1):
 * - GET  /api/v1/guacamole/token?connection=...
 * - GET  /api/v1/sessions?page=&limit=
 * - GET  /api/v1/view/log?sessionId=...
 * - GET  /api/v1/view/video?sessionId=...
 * - POST   /api/v1/sessions/clean-recordings
 * - DELETE /api/v1/sessions/:sessionId
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
