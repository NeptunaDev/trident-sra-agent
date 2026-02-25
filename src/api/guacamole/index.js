/**
 * Inicialización de guacamole-lite (WebSocket + guacd).
 *
 * Al cargar este módulo se crea la instancia de GuacamoleLite que escucha en WEBSOCKET_PORT
 * y se comunica con guacd en GUACD_PORT. El frontend conecta vía WebSocket con el token
 * obtenido de GET /token para establecer la sesión remota (VNC/SSH/RDP).
 */

const GuacamoleLite = require('guacamole-lite');
const config = require('../config');
const sessionManager = require('../services/sessionManager');

const websocketOptions = {
  port: config.WEBSOCKET_PORT
};

const guacdOptions = {
  port: config.GUACD_PORT
};

const clientOptions = {
  crypt: {
    cypher: config.CIPHER,
    key: config.CRYPT_KEY
  }
};

/** Instancia de guacamole-lite. Se mantiene viva mientras la aplicación corre. */
const guacServer = new GuacamoleLite(websocketOptions, guacdOptions, clientOptions);

function getSessionIdFromClientConnection(clientConnection) {
  return String(clientConnection.query.sessionId || '').trim();
}

guacServer.on('open', (clientConnection) => {
  const sessionId = getSessionIdFromClientConnection(clientConnection);
  if (!sessionId) return;
  const existing = sessionManager.getSession(sessionId);
  if (!existing) return;

  sessionManager.registerSession(sessionId, {
    connectionId: existing.connectionId,
    connectionType: existing.connectionType,
    startedAt: existing.startedAt,
    clientConnection,
  });
});

guacServer.on('close', (clientConnection) => {
  const sessionId = getSessionIdFromClientConnection(clientConnection);
  if (!sessionId) return;
  sessionManager.closeSession(sessionId);
  console.info(`Sesión cerrada: ${sessionId}`);
});

function forceCloseSession(sessionId) {
  const targetSessionId = String(sessionId || '').trim();
  if (!targetSessionId) return false;

  for (const activeConnection of guacServer.activeConnections.values()) {
    const currentSessionId = String(activeConnection?.query?.sessionId || '').trim();
    if (currentSessionId !== targetSessionId) continue;
    if ( typeof activeConnection.close === 'function') activeConnection.close();
    return true;
  }

  return false;
}

module.exports = {
  guacServer,
  forceCloseSession,
};
