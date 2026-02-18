/**
 * Inicialización de guacamole-lite (WebSocket + guacd).
 *
 * Al cargar este módulo se crea la instancia de GuacamoleLite que escucha en WEBSOCKET_PORT
 * y se comunica con guacd en GUACD_PORT. El frontend conecta vía WebSocket con el token
 * obtenido de GET /token para establecer la sesión remota (VNC/SSH/RDP).
 */

const GuacamoleLite = require('guacamole-lite');
const config = require('../config');

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

module.exports = guacServer;
