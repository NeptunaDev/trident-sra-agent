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
const internalLogService = require('../services/internalLog.service');
const agentEmitter = require('../services/eventEmitter');

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

function getConnectionIdFromClientConnection(clientConnection) {
  return String(clientConnection?.query?.connectionId || '').trim();
}

function getConnectionTypeFromClientConnection(clientConnection) {
  return String(clientConnection?.query?.connectionType || '').trim();
}

guacServer.on('open', (clientConnection) => {
  const sessionId = getSessionIdFromClientConnection(clientConnection);
  if (!sessionId) return;

  const existing = sessionManager.getSession(sessionId);
  if (existing?.clientConnection) return;

  const connectionId = existing?.connectionId || getConnectionIdFromClientConnection(clientConnection);
  const connectionType = existing?.connectionType || getConnectionTypeFromClientConnection(clientConnection);
  const startedAt = existing?.startedAt || new Date().toISOString();

  if (!connectionId || !connectionType) return;

  sessionManager.registerSession(sessionId, {
    connectionId,
    connectionType,
    startedAt,
    clientConnection,
  });

  internalLogService.addLog(
    'INFO',
    `Sesión iniciada (sessionId=${sessionId}, connectionId=${connectionId}, type=${connectionType})`,
    sessionId,
  );
  agentEmitter.emit('session:started', {
    sessionId,
    connectionId,
    connectionType,
  });
});

guacServer.on('close', (clientConnection) => {
  const sessionId = getSessionIdFromClientConnection(clientConnection);
  if (!sessionId) return;
  const closed = sessionManager.closeSession(sessionId);
  if (!closed) return;

  internalLogService.addLog('INFO', `Sesión cerrada (sessionId=${sessionId})`, sessionId);
  agentEmitter.emit('session:ended', { sessionId });
  console.info(`Sesión cerrada: ${sessionId}`);
});

guacServer.on('error', (error) => {
  const message = `Error de conexión con guacd: ${error?.message || 'desconocido'}`;
  internalLogService.addLog('ERROR', message);
  agentEmitter.emit('agent:error', { message });
  console.error(message);
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
